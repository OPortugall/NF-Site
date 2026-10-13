"""Gera a página inicial do site principal em Next.js a partir do HTML arquivado.

Uso:
    python scripts/gerar_site_principal.py [caminho/para/BkpNF-limpo.zip]

- Converte cada seção da página antiga em um componente JSX (site/app/(site)/componentes/).
- Copia CSS, scripts, imagens e fontes originais para site/public/nfs/ (mesmos caminhos de antes).
- Gera a lista de scripts legados e os códigos de inicialização (site/app/(site)/scripts-legados.js).
"""
import json
import os
import re
import sys
import zipfile
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from html_para_jsx import converter, scripts_em_ordem  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM_HTML = os.path.join(RAIZ, 'reconstrucao', 'site-principal', 'conteudo', 'pagina-inicial-original-2024-02-22.html')
ZIP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'BkpNF-limpo.zip')
SITE = os.path.join(RAIZ, 'site')
APP = os.path.join(SITE, 'app', '(site)')
PUBLIC = os.path.join(SITE, 'public')
HOST = re.compile(r'^https?://(www\.)?nfsolucoesdigitais\.com\.br', re.I)

# Seções da página (id ou classe do elemento -> nome do componente)
SECOES = [
    ('class', 'navigation', 'Navegacao'),
    ('class', 'body-overlay', 'Sobreposicao'),
    ('id', 'intro', 'Abertura'),
    ('id', 'about', 'Sobre'),
    ('id', 'servises', 'Servicos'),
    ('id', 'portfolio', 'Portfolio'),
    ('id', 'team', 'Equipe'),
    ('id', 'subscribe', 'Newsletter'),
    ('id', 'clientlist', 'Clientes'),
    ('id', 'contacts', 'Contato'),       # primeira ocorrência
    ('id', 'contacts', 'Rodape'),        # segunda ocorrência (rodapé com redes sociais)
]
FORMULARIOS = {'subscriptionForm': '/api/newsletter', 'contact_form': '/api/contato'}
SCRIPTS_REMOVIDOS = ('maps.google.com/maps/api/js',)  # API antiga do Google Maps sem chave não funciona mais


def reescrever_url(u):
    u = u.strip()
    if not u or u.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')):
        return u
    u = HOST.sub('', u)
    if re.match(r'^[a-z][a-z0-9+.-]*://', u, re.I) or u.startswith('//'):
        return u  # endereço externo
    if not u.startswith('/'):
        u = '/nfs/' + u
    if re.match(r'^/nfs/?(index\.php)?/?$', u):
        return '/'
    return u


class Mapeador(HTMLParser):
    """Encontra o início e o fim (posição no texto) de cada seção."""
    VAZIAS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param'}

    def __init__(self, texto):
        super().__init__(convert_charrefs=True)
        self.inicio_linhas = [0]
        for m in re.finditer('\n', texto):
            self.inicio_linhas.append(m.end())
        self.texto = texto
        self.pilha = []
        self.achados = []
        self.usados = set()

    def pos(self):
        linha, col = self.getpos()
        return self.inicio_linhas[linha - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in self.VAZIAS:
            return
        a = dict(attrs)
        alvo = None
        for i, (tipo, valor, nome) in enumerate(SECOES):
            if i in self.usados:
                continue
            if (tipo == 'id' and a.get('id') == valor) or (tipo == 'class' and valor in (a.get('class') or '').split()):
                if not any(p[1] is not None for p in self.pilha):  # só seções que não estão dentro de outra seção
                    alvo = (i, nome)
                break
        self.pilha.append((tag, alvo, self.pos()))

    def handle_endtag(self, tag):
        if tag in self.VAZIAS:
            return
        while self.pilha:
            t, alvo, ini = self.pilha.pop()
            if alvo is not None and t == tag:
                fim = self.texto.index('>', self.pos()) + 1
                self.achados.append((alvo[0], alvo[1], ini, fim))
                self.usados.add(alvo[0])
            if t == tag:
                break


def coletar_referencias(texto):
    refs = set()
    for m in re.finditer(r'''(?:src|href|data-[a-z-]+)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\)''', texto, re.I):
        u = reescrever_url(m.group(1) or m.group(2))
        if u.startswith('/nfs/'):
            refs.add(u.split('?')[0].split('#')[0])
    return refs


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    texto = open(ORIGEM_HTML, encoding='utf-8').read()
    cabeca = texto[:texto.lower().index('<body')]
    corpo = texto[texto.lower().index('<body'):]
    corpo = corpo[corpo.index('>') + 1: corpo.lower().rindex('</body>')]

    # ---------- CSS e scripts, na ordem original ----------
    sem_comentarios = re.sub(r'<!--.*?-->', '', texto, flags=re.S)  # descarta CSS/JS condicionais do IE
    css = [reescrever_url(h) for h in re.findall(r'<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"', sem_comentarios)]
    css += [reescrever_url(h) for h in re.findall(r'<link[^>]+href="([^"]+\.css[^"]*)"[^>]*rel="stylesheet"', sem_comentarios)]
    css = list(dict.fromkeys(css))
    def transformar(s):
        if 'google.maps' in s:
            # mapa: o original usava a API JS sem chave; agora um mapa incorporado no mesmo lugar
            lat, lng = re.search(r'LatLng\(\s*-*([\d.]+)\s*,\s*(-?[\d.]+)', s).groups()
            return ("(function(){var c=document.getElementById('map_canvas');if(!c)return;"
                    "var f=document.createElement('iframe');"
                    f"f.src='https://maps.google.com/maps?q=-{lat},{lng}&z=17&output=embed';"
                    "f.style.width='100%';f.style.height='100%';f.style.border='0';f.loading='lazy';"
                    "f.title='Mapa da localização';c.appendChild(f);})();")
        return s

    itens_scripts = scripts_em_ordem(texto, reescrever_url, transformar, SCRIPTS_REMOVIDOS)
    scripts = [i['src'] for i in itens_scripts if 'src' in i]

    titulo = re.search(r'<title>(.*?)</title>', cabeca, re.S)
    titulo = titulo.group(1).strip() if titulo else 'NF Soluções Digitais'
    favicon = re.search(r'<link[^>]+rel="(?:shortcut )?icon"[^>]*href="([^"]+)"', cabeca)

    # ---------- formulários apontam para as rotas JavaScript ----------
    for fid, rota in FORMULARIOS.items():
        corpo = re.sub(rf'(<form[^>]*id="{fid}"[^>]*action=")[^"]*(")', rf'\g<1>{rota}\2', corpo)
        corpo = re.sub(rf'(<form[^>]*action=")[^"]*("[^>]*id="{fid}")', rf'\g<1>{rota}\2', corpo)

    # ---------- divide em componentes ----------
    mapa = Mapeador(corpo)
    mapa.feed(corpo)
    achados = sorted(mapa.achados, key=lambda x: x[2])
    faltando = [nome for i, (_, _, nome) in enumerate(SECOES) if i not in mapa.usados]
    if faltando:
        raise SystemExit(f'Seções não encontradas: {faltando}')
    os.makedirs(os.path.join(APP, 'componentes'), exist_ok=True)
    esqueleto, ultimo = [], 0
    for _, nome, ini, fim in achados:
        jsx = converter(corpo[ini:fim], reescrever_url)
        with open(os.path.join(APP, 'componentes', f'{nome}.jsx'), 'w', encoding='utf-8', newline='\n') as f:
            f.write('// Gerado por scripts/gerar_site_principal.py a partir da página arquivada de 22/02/2024.\n'
                    f'export default function {nome}() {{\n  return (\n    <>\n{jsx}\n    </>\n  );\n}}\n')
        esqueleto.append(corpo[ultimo:ini])
        esqueleto.append(f'<componente-{nome.lower()}></componente-{nome.lower()}>')
        ultimo = fim
    esqueleto.append(corpo[ultimo:])
    pagina_jsx = converter(''.join(esqueleto), reescrever_url)
    for _, nome, _, _ in achados:
        pagina_jsx = pagina_jsx.replace(f'<componente-{nome.lower()}></componente-{nome.lower()}>', f'<{nome} />')
    imports = '\n'.join(f"import {n} from './componentes/{n}';" for n in sorted({a[1] for a in achados}))
    with open(os.path.join(APP, 'page.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('// Gerado por scripts/gerar_site_principal.py — página inicial do site principal.\n'
                "import ScriptsLegados from '../componentes/ScriptsLegados';\n"
                "import { itens } from './scripts-legados';\n"
                f'{imports}\n\n'
                'export default function PaginaInicial() {\n  return (\n    <>\n'
                f'{pagina_jsx}\n'
                '      <ScriptsLegados itens={itens} />\n'
                '    </>\n  );\n}\n')
    with open(os.path.join(APP, 'scripts-legados.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('// Gerado por scripts/gerar_site_principal.py — scripts do template (arquivos e embutidos), na ordem original.\n'
                f'export const itens = {json.dumps(itens_scripts, ensure_ascii=False, indent=2)};\n')
    with open(os.path.join(APP, 'estilos-legados.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('// Gerado por scripts/gerar_site_principal.py — folhas de estilo originais, na ordem original.\n'
                f'export const estilos = {json.dumps(css, ensure_ascii=False, indent=2)};\n'
                f'export const titulo = {json.dumps(titulo, ensure_ascii=False)};\n'
                f'export const favicon = {json.dumps(reescrever_url(favicon.group(1)) if favicon else None)};\n')

    # ---------- copia arquivos usados (CSS, JS, imagens, fontes) ----------
    z = zipfile.ZipFile(ZIP)
    nomes = {n for n in z.namelist() if not n.endswith('/')}
    minusculos = {n.lower(): n for n in nomes}
    pendentes = coletar_referencias(texto) | {s.split('?')[0] for s in scripts + css if s.startswith('/nfs/')}
    if favicon:
        pendentes.add(reescrever_url(favicon.group(1)))
    copiados, ausentes, vistos = [], [], set()
    while pendentes:
        url = pendentes.pop()
        if url in vistos or url == '/':
            continue
        vistos.add(url)
        caminho_zip = url.lstrip('/')
        real = caminho_zip if caminho_zip in nomes else minusculos.get(caminho_zip.lower())
        if not real:
            ausentes.append(url)
            continue
        dados = z.read(real)
        destino = os.path.join(PUBLIC, *url.lstrip('/').split('/'))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'wb') as f:
            f.write(dados)
        copiados.append(url)
        if url.lower().endswith('.css'):
            base = url.rsplit('/', 1)[0] + '/'
            for m in re.finditer(r'''url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']''', dados.decode('utf-8', 'replace')):
                ref = (m.group(1) or m.group(2)).strip()
                if ref.startswith(('data:', 'http:', 'https:', '//', '#')):
                    continue
                alvo = os.path.normpath(base + ref.split('?')[0].split('#')[0]).replace('\\', '/')
                if alvo.startswith('/nfs/'):
                    pendentes.add(alvo)

    print(f'componentes: {len(achados)} -> {", ".join(a[1] for a in achados)}')
    print(f'estilos: {len(css)} | scripts: {len(scripts)} arquivos + {len(itens_scripts) - len(scripts)} embutidos')
    print(f'arquivos copiados para site/public: {len(copiados)}')
    if ausentes:
        print(f'referências sem arquivo no backup ({len(ausentes)}):')
        for a in sorted(ausentes):
            print('   ', a)


if __name__ == '__main__':
    main()
