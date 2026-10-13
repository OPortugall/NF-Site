"""Gera a loja em Next.js a partir das páginas arquivadas do PrestaShop.

Uso:
    python scripts/gerar_loja.py [caminho/para/BkpNF-limpo.zip]

- Cabeçalho, rodapé e "voltar ao topo" viram componentes compartilhados (site/app/_loja/).
- O miolo de cada página vira um componente próprio (site/app/_loja/paginas/).
- Cada tipo de página do PrestaShop (index, category, product, cms...) ganha um layout com o
  <body id/class> original, porque o CSS do tema depende disso.
- CSS, scripts, imagens e fontes originais são copiados para site/public/loja/ (mesmos caminhos).
"""
import glob
import hashlib
import json
import os
import re
import sys
import urllib.parse
import zipfile
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from html_para_jsx import converter, scripts_em_ordem  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REC = os.path.join(RAIZ, 'reconstrucao', 'loja')
ZIP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'BkpNF-limpo.zip')
SITE = os.path.join(RAIZ, 'site')
APP = os.path.join(SITE, 'app')
PRIV = os.path.join(APP, '_loja')
PUBLIC = os.path.join(SITE, 'public')
HOST = re.compile(r'^https?://(www\.)?nfsolucoesdigitais\.com\.br', re.I)
VAZIAS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param'}

# Endereços antigos com espaço/acentos -> endereços novos (os antigos redirecionam, ver next.config.mjs)
RENOMEADOS = {'/loja/mapa do site': '/loja/mapa-do-site', '/loja/preços-em-queda': '/loja/precos-em-queda'}

# Tipo de página do PrestaShop (id do <body>) -> rota no Next.js
ROTAS = {
    'index': ('loja-inicio', 'loja'),
    'category': ('loja-categoria', 'loja/[categoria]'),
    'product': ('loja-produto', 'loja/inicio/[produto]'),
    'cms': ('loja-cms', 'loja/content/[pagina]'),
    'contact': ('loja-contato', 'loja/entrar-em-contato-conosco'),
    'stores': ('loja-lojas', 'loja/lojas'),
    'sitemap': ('loja-mapa', 'loja/mapa-do-site'),
    'new-products': ('loja-novos', 'loja/novos-produtos'),
    'prices-drop': ('loja-precos', 'loja/precos-em-queda'),
}
PARAMETRO = {'category': 'categoria', 'product': 'produto', 'cms': 'pagina'}


def ler(p):
    raw = open(p, 'rb').read()
    try:
        return raw.decode('utf-8')
    except UnicodeDecodeError:
        return raw.decode('cp1252')


def limpar_tokens(texto):
    """Esvazia tokens de sessão do PrestaShop antigo (sem uso no site novo e barrados pelo gitleaks)."""
    texto = re.sub(r"""((?:static_token|token|secure_key|stf_secure_key)\s*[=:]\s*)(['"])[0-9a-f]{16,64}\2""", r'\1\2\2', texto, flags=re.I)
    texto = re.sub(r'([?&](?:amp;)?(?:token|static_token|secure_key)=)[0-9a-f]{16,64}', r'\1', texto, flags=re.I)
    texto = re.sub(r'''(name=["'](?:token|static_token|secure_key)["'][^>]*value=["'])[0-9a-f]{16,64}''', r'\1', texto, flags=re.I)
    texto = re.sub(r'''(value=["'])[0-9a-f]{32}(["'][^>]*name=["'](?:token|static_token|secure_key)["'])''', r'\1\2', texto, flags=re.I)
    return texto


BASE_PAGINA = ['/loja/']  # endereço da página sendo convertida (para resolver caminhos relativos)


def reescrever_url(u):
    u = u.strip()
    if not u or u.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')):
        return u
    u = HOST.sub('', u)
    if re.match(r'^[a-z][a-z0-9+.-]*://', u, re.I) or u.startswith('//'):
        return u
    if not u.startswith('/'):
        u = urllib.parse.urljoin('http://x' + BASE_PAGINA[0], u)[len('http://x'):]
    caminho, sep, resto = u.partition('?')
    caminho_dec = urllib.parse.unquote(caminho)
    if caminho_dec in RENOMEADOS:
        caminho = RENOMEADOS[caminho_dec]
    # imagens com endereço "amigável" (antes traduzido pelo .htaccess) -> arquivo real
    m = re.match(r'^/loja/(\d+)-([a-z_]+)/[^/]+\.jpg$', caminho, re.I)
    if m:
        idd, tipo = m.groups()
        caminho = f"/loja/img/p/{'/'.join(idd)}/{idd}-{tipo}.jpg"
    m = re.match(r'^/loja/(\d+)/[^/]+\.jpg$', caminho, re.I)  # foto original, sem tipo no endereço
    if m:
        idd = m.group(1)
        caminho = f"/loja/img/p/{'/'.join(idd)}/{idd}.jpg"
    m = re.match(r'^/loja/c/(\d+)-([a-z_]+)/[^/]+\.jpg$', caminho, re.I)
    if m:
        caminho = f'/loja/img/c/{m.group(1)}-{m.group(2)}.jpg'
    if caminho in ('/loja/index.php', '/loja/'):
        caminho = '/loja' if not resto else '/loja/index.php'
    return caminho + (sep + resto if sep else '')


class Elementos(HTMLParser):
    """Lista os filhos diretos de um elemento (por id) com suas posições no texto."""

    def __init__(self, texto):
        super().__init__(convert_charrefs=True)
        self.texto = texto
        self.linhas = [0] + [m.end() for m in re.finditer('\n', texto)]
        self.pilha = []
        self.filhos = []  # (profundidade, tag, attrs, inicio, fim)

    def pos(self):
        linha, col = self.getpos()
        return self.linhas[linha - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in VAZIAS:
            return
        self.pilha.append([tag, dict(attrs), self.pos()])

    def handle_endtag(self, tag):
        if tag in VAZIAS:
            return
        for i in range(len(self.pilha) - 1, -1, -1):
            if self.pilha[i][0] == tag:
                t, a, ini = self.pilha[i]
                fim = self.texto.index('>', self.pos()) + 1
                self.filhos.append((i, t, a, ini, fim))
                del self.pilha[i:]
                return


def partes_da_pagina(texto):
    """Divide o <body> em: cabeçalho, slider (só na inicial), miolo, rodapé (marcas+footer) e extras."""
    corpo_ini = texto.lower().index('<body')
    corpo_ini = texto.index('>', corpo_ini) + 1
    corpo = texto[corpo_ini: texto.lower().rindex('</body>')]
    el = Elementos(corpo)
    el.feed(corpo)
    nivel0 = sorted([f for f in el.filhos if f[0] == 0], key=lambda f: f[3])
    pagina = next(f for f in nivel0 if f[2].get('id') == 'page')
    filhos = sorted([f for f in el.filhos if f[0] == 1 and pagina[3] < f[3] < pagina[4]], key=lambda f: f[3])
    cab = next(f for f in filhos if 'header-container' in (f[2].get('class') or ''))
    rod = next(f for f in filhos if f[2].get('id') == 'footer')
    marcas = [f for f in filhos if f[3] > cab[4] and f[4] < rod[3] and 'pts-brand-container' in corpo[f[3]:f[4]]]
    inicio_rodape = marcas[0][3] if marcas else rod[3]
    slider = next((f for f in el.filhos if 'slider' == (f[2].get('class') or '') and cab[3] < f[3] < cab[4]), None)
    extras = [f for f in nivel0 if f[3] > pagina[4] and f[1] != 'script']
    return {
        'corpo': corpo,
        'cabecalho': corpo[cab[3]:cab[4]],
        'slider': corpo[slider[3]:slider[4]] if slider else '',
        'miolo': corpo[cab[4]:inicio_rodape],
        'rodape': corpo[inicio_rodape:rod[4]],
        'extras': ''.join(corpo[f[3]:f[4]] for f in extras),
        'selecionados': sorted({reescrever_url(h) for h in re.findall(r'<a[^>]+href="([^"]+)"[^>]*class="selected"', corpo[cab[3]:cab[4]])}
                               | {reescrever_url(h) for h in re.findall(r'<a[^>]+class="selected"[^>]*href="([^"]+)"', corpo[cab[3]:cab[4]])}),
    }


def jsx_de(html):
    return limpar_tokens(converter(html, reescrever_url))


def nome_componente(s):
    return 'Pagina' + ''.join(p.capitalize() for p in re.split(r'[^a-zA-Z0-9]+', s) if p)


def escrever(caminho, conteudo):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write(conteudo)


def coletar_paginas():
    paginas = []
    for p in sorted(glob.glob(os.path.join(REC, 'paginas', 'html-original', '*.html'))):
        paginas.append(p)
    for p in sorted(glob.glob(os.path.join(REC, 'categorias', 'html-original', '*.html'))):
        paginas.append(p)
    for p in sorted(glob.glob(os.path.join(REC, 'produtos', '*', 'pagina-original-*.html'))):
        paginas.append(p)
    return paginas


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    paginas = coletar_paginas()
    registro = {}     # tipo -> lista de (slug, componente, dados)
    referencias = set()
    corpos_rodape, cabecalho_base, extras_base = set(), None, None
    tipos_body = {}

    for caminho in paginas:
        texto = ler(caminho)
        sem_coment = re.sub(r'<!--.*?-->', '', texto, flags=re.S)
        body = re.search(r'<body([^>]*)>', texto).group(1)
        tipo = re.search(r'id="([^"]*)"', body).group(1)
        classes = re.search(r'class="([^"]*)"', body).group(1).split()
        canon = re.search(r'<link rel="canonical" href="([^"]+)"', texto)
        url = reescrever_url(canon.group(1)) if canon else None
        titulo = re.search(r'<title>(.*?)</title>', texto, re.S).group(1).strip()
        descricao = re.search(r'<meta name="description" content="([^"]*)"', texto)
        partes = partes_da_pagina(texto)

        # slug do endereço antigo, tirado do nome do arquivo/pasta em reconstrucao/
        # (produtos/15-mp5001/ -> 15-mp5001.html; categorias/03-impressoras-AAAAMMDD.html -> 3-impressoras;
        #  paginas/4-quem-somos-AAAAMMDD.html -> 4-quem-somos)
        if tipo == 'product':
            idd, resto = os.path.basename(os.path.dirname(caminho)).split('-', 1)
            slug_url = f'{int(idd)}-{resto}.html'
            slug = f'{int(idd)}-{resto}'
        elif tipo in ('category', 'cms'):
            idd, resto = re.sub(r'-\d{8}\.html$', '', os.path.basename(caminho)).split('-', 1)
            slug_url = f'{int(idd)}-{resto}'
            slug = slug_url
        else:
            slug_url = None
            slug = tipo
        BASE_PAGINA[0] = {'product': '/loja/inicio/', 'cms': '/loja/content/'}.get(tipo, '/loja/')

        css = list(dict.fromkeys(reescrever_url(h) for h in re.findall(r'<link[^>]+href="([^"]+\.css[^"]*)"', sem_coment)))
        scripts = list(dict.fromkeys(reescrever_url(s.replace('&amp;', '&')) for s in re.findall(r'<script[^>]+src="([^"]+)"', sem_coment)))
        icone = re.search(r'<link[^>]+rel="(?:shortcut )?icon"[^>]*href="([^"]+)"', sem_coment)
        icone = reescrever_url(icone.group(1).split('?')[0]) if icone else None
        if icone:
            referencias.add(icone)
        def transformar(s):
            s = re.sub(r"""(['"])https?://(?:www\.)?nfsolucoesdigitais\.com\.br""", r'\1', s)
            s = re.sub(r'https?:\\/\\/(?:www\.)?nfsolucoesdigitais\.com\.br', '', s)
            # imagens com endereço "amigável" usadas pelos scripts (ex.: sharing_img) -> arquivo real
            s = re.sub(r"""(['"])(/loja/[^'"\s]+?\.jpg)\1""", lambda m: m.group(1) + reescrever_url(m.group(2)) + m.group(1), s)
            return limpar_tokens(s)

        itens_scripts = scripts_em_ordem(texto, reescrever_url, transformar)
        inline = [i['codigo'] for i in itens_scripts if 'codigo' in i]

        corpos_rodape.add(hashlib.md5(re.sub(r'\s+', ' ', re.sub(r'<script.*?</script>', '', partes['rodape'], flags=re.S)).encode()).hexdigest())
        if tipo not in ('category', 'index') and cabecalho_base is None:
            cabecalho_base = partes['cabecalho']
            extras_base = partes['extras']
            rodape_base = partes['rodape']
        tipos_body.setdefault(tipo, set()).add(' '.join(c for c in classes if not re.match(r'^(product|category|cms)-', c)))

        nome = nome_componente(f'{tipo}-{slug}')
        miolo_jsx = jsx_de(partes['miolo'])
        arq = os.path.join(PRIV, 'paginas', f'{tipo}-{slug}.jsx')
        extra_slider = ''
        if partes['slider']:
            escrever(os.path.join(PRIV, 'SliderInicial.jsx'),
                     '// Gerado por scripts/gerar_loja.py — slider da página inicial da loja.\n'
                     'export default function SliderInicial() {\n  return (\n    <>\n' + jsx_de(partes['slider']) + '\n    </>\n  );\n}\n')
            extra_slider = 'slider'
        escrever(arq, f'// Gerado por scripts/gerar_loja.py a partir de {os.path.relpath(caminho, RAIZ).replace(os.sep, "/")}\n'
                      f'export default function {nome}() {{\n  return (\n    <>\n{miolo_jsx}\n    </>\n  );\n}}\n')
        dados = {
            'titulo': titulo, 'descricao': descricao.group(1) if descricao else '', 'url': url,
            'estilos': css, 'scripts': itens_scripts, 'icone': icone,
            'selecionados': partes['selecionados'], 'slider': bool(extra_slider), 'classesBody': classes,
        }
        registro.setdefault(tipo, []).append((slug, slug_url, nome, dados))
        referencias |= {u for u in css + scripts}
        for m in re.finditer(r'''(?:src|href|data-[a-z-]+|content)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\)''', partes['corpo'], re.I):
            referencias.add(reescrever_url(html_unescape(m.group(1) or m.group(2))))
        for s in inline:
            for m in re.finditer(r"""['"](/loja/[^'"\s]+\.(?:png|jpe?g|gif|svg|css|js))['"]""", s):
                referencias.add(m.group(1))

    if len(corpos_rodape) != 1:
        print(f'AVISO: o rodapé varia entre páginas ({len(corpos_rodape)} versões); usando a de uma página institucional')

    # ---------- componentes compartilhados ----------
    cab_jsx = jsx_de(cabecalho_base)
    # destaque do item de menu da categoria atual (no original: class="selected")
    cab_jsx = re.sub(r'<a href="(/loja/\d+-[^"]+)"(?![^>]*className=)', r'<a href="\1" className={sel("\1")}', cab_jsx)
    pos = cab_jsx.rindex('</header>')
    cab_jsx = cab_jsx[:pos] + '{children}' + cab_jsx[pos:]
    escrever(os.path.join(PRIV, 'Cabecalho.jsx'),
             '// Gerado por scripts/gerar_loja.py — cabeçalho da loja (igual em todas as páginas).\n'
             '// "selecionados": endereços de categoria destacados no menu; "children": conteúdo extra no fim do <header> (slider da inicial).\n'
             'export default function Cabecalho({ selecionados = [], children }) {\n'
             "  const sel = (href) => (selecionados.includes(href) ? 'selected' : undefined);\n"
             '  return (\n    <>\n' + cab_jsx + '\n    </>\n  );\n}\n')
    escrever(os.path.join(PRIV, 'Rodape.jsx'),
             '// Gerado por scripts/gerar_loja.py — marcas, rodapé e botão "voltar ao topo" (iguais em todas as páginas).\n'
             'export default function Rodape() {\n  return (\n    <>\n' + jsx_de(rodape_base) + '\n    </>\n  );\n}\n'
             'export function Extras() {\n  return (\n    <>\n' + (jsx_de(extras_base) or 'null') + '\n    </>\n  );\n}\n')

    # ---------- dados e registro por tipo ----------
    for tipo, itens in registro.items():
        linhas_imp = [f"import {nome} from './{tipo}-{slug}';" for slug, _, nome, _ in itens]
        mapa = ',\n'.join(f'  {json.dumps(slug_url or tipo, ensure_ascii=False)}: {{ Miolo: {nome}, ...{json.dumps(dados, ensure_ascii=False)} }}'
                          for slug, slug_url, nome, dados in itens)
        escrever(os.path.join(PRIV, 'paginas', f'registro-{tipo}.js'),
                 f'// Gerado por scripts/gerar_loja.py — páginas do tipo "{tipo}".\n' + '\n'.join(linhas_imp) +
                 f'\n\nconst paginas = {{\n{mapa}\n}};\n\nexport default paginas;\n')

    # ---------- layouts (um por tipo de página, com o <body> original) e rotas ----------
    for tipo, (grupo, rota) in ROTAS.items():
        if tipo not in registro:
            print(f'AVISO: nenhuma página do tipo {tipo}')
            continue
        classes_comuns = sorted(tipos_body[tipo], key=len)[0]
        base_grupo = os.path.join(APP, f'({grupo})')
        escrever(os.path.join(base_grupo, 'layout.js'),
                 '// Gerado por scripts/gerar_loja.py — layout das páginas do tipo ' + f'"{tipo}" (mesmo <body> do PrestaShop).\n'
                 "import HtmlLoja from '../_loja/HtmlLoja';\n\n"
                 f'export default function Layout({{ children }}) {{\n'
                 f'  return <HtmlLoja idBody={json.dumps(tipo)} classeBody={json.dumps(classes_comuns)}>{{children}}</HtmlLoja>;\n}}\n')
        profundidade = rota.count('/') + 2  # (grupo)/loja/... -> volta até app/
        volta = '../' * profundidade
        if tipo in PARAMETRO:
            p = PARAMETRO[tipo]
            codigo = (
                f"import paginas from '{volta}_loja/paginas/registro-{tipo}';\n"
                f"import PaginaLoja, {{ metadadosDaPagina }} from '{volta}_loja/PaginaLoja';\n\n"
                'export const dynamicParams = false;\n\n'
                'export function generateStaticParams() {\n'
                f'  return Object.keys(paginas).map(({p}) => ({{ {p} }}));\n}}\n\n'
                'export async function generateMetadata({ params }) {\n'
                f'  const {{ {p} }} = await params;\n'
                f'  return metadadosDaPagina(paginas[decodeURIComponent({p})]);\n}}\n\n'
                'export default async function Pagina({ params }) {\n'
                f'  const {{ {p} }} = await params;\n'
                f'  return <PaginaLoja pagina={{paginas[decodeURIComponent({p})]}} />;\n}}\n')
        else:
            codigo = (
                f"import paginas from '{volta}_loja/paginas/registro-{tipo}';\n"
                f"import PaginaLoja, {{ metadadosDaPagina }} from '{volta}_loja/PaginaLoja';\n\n"
                f'const pagina = paginas[{json.dumps(tipo)}];\n\n'
                'export const metadata = metadadosDaPagina(pagina);\n\n'
                'export default function Pagina() {\n  return <PaginaLoja pagina={pagina} />;\n}\n')
        escrever(os.path.join(base_grupo, *rota.split('/'), 'page.js'),
                 f'// Gerado por scripts/gerar_loja.py — rota /{rota}.\n' + codigo)

    # ---------- copia arquivos usados ----------
    z = zipfile.ZipFile(ZIP)
    nomes = {n for n in z.namelist() if not n.endswith('/')}
    minusculos = {n.lower(): n for n in nomes}
    pendentes = {u.split('?')[0].split('#')[0] for u in referencias if u.startswith('/loja/')}
    copiados, ausentes, vistos = 0, [], set()
    while pendentes:
        url = pendentes.pop()
        if url in vistos:
            continue
        vistos.add(url)
        if not re.search(r'\.[a-z0-9]{2,5}$', url, re.I):
            continue  # é uma página, não um arquivo
        cz = urllib.parse.unquote(url.lstrip('/'))
        real = cz if cz in nomes else minusculos.get(cz.lower())
        if not real:
            ausentes.append(url)
            continue
        if re.search(r'\.(php|tpl|inc)$', real, re.I):
            continue  # código PHP do PrestaShop não vai para o site novo
        dados = z.read(real)
        destino = os.path.join(PUBLIC, *cz.split('/'))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'wb') as f:
            f.write(dados)
        copiados += 1
        if url.lower().endswith('.css'):
            base = url.rsplit('/', 1)[0] + '/'
            for m in re.finditer(r'''url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']''', dados.decode('utf-8', 'replace')):
                ref = (m.group(1) or m.group(2)).strip()
                if ref.startswith(('data:', 'http:', 'https:', '//', '#')):
                    continue
                alvo = os.path.normpath(base + ref.split('?')[0].split('#')[0]).replace('\\', '/')
                if alvo.startswith('/loja/'):
                    pendentes.add(alvo)

    total = sum(len(v) for v in registro.values())
    print(f'páginas geradas: {total} ->', {t: len(v) for t, v in registro.items()})
    print(f'arquivos copiados para site/public/loja: {copiados}')
    if ausentes:
        print(f'referências sem arquivo no backup ({len(ausentes)}):')
        for a in sorted(ausentes)[:60]:
            print('   ', a)


def html_unescape(s):
    import html
    return html.unescape(s)


if __name__ == '__main__':
    main()
