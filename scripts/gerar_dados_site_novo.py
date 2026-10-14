"""Gera os dados dos produtos do site novo (site-novo/) a partir de reconstrucao/loja/.

Uso:
    python scripts/gerar_dados_site_novo.py

- Lê reconstrucao/loja/produtos.csv e a ficha produto.md de cada produto.
- Grava site-novo/dados/produtos.json.
- Copia as fotos para site-novo/public/produtos/<slug>/.
"""
import csv
import json
import os
import re
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, 'reconstrucao', 'loja')
DESTINO = os.path.join(RAIZ, 'site-novo')


# Foto de capa quando a primeira foto da loja antiga não mostra o produto (ex.: SP C430DN abria com uma foto de toners).
CAPAS = {16: 'foto-60.jpg'}


def preco_em_centavos(texto):
    numero = re.sub(r'[^\d,]', '', texto).replace(',', '.')
    return round(float(numero) * 100)


def classificar(nome, modelo, descricao):
    texto = f'{nome} {descricao}'.lower()
    if 'toner' in texto:
        tipo = 'suprimentos'
    elif 'impressora' in texto:
        tipo = 'impressoras'
    else:
        tipo = 'multifuncionais'
    colorida = bool(re.match(r'^(mpc|spc)', modelo or '')) or 'color' in texto
    return tipo, ('colorida' if colorida else 'pb')


TITULOS_SOLTOS = {'principais funcionalidades', 'características', 'especificações'}


def _titulo(texto):
    texto = texto.strip(' :')
    return texto.capitalize() if texto.isupper() else texto


def ler_descricao_completa(md, ignorar=()):
    """Transforma a descrição completa (formatos variados vindos da loja antiga) em blocos:
    {'tipo': 'titulo'|'paragrafo', 'texto'} | {'tipo': 'lista', 'itens'} | {'tipo': 'specs', 'linhas': [[chave, valor]]}
    """
    m = re.search(r'## Descrição completa\s*(.*)', md, re.S)
    if not m:
        return []
    linhas = [re.sub(r'\s+', ' ', l).strip() for l in m.group(1).splitlines()]
    linhas = [l for l in linhas if l and l.lower() not in {i.lower() for i in ignorar if i}]
    blocos = []

    def adicionar(tipo, valor):
        chave = {'lista': 'itens', 'specs': 'linhas'}.get(tipo)
        if chave and blocos and blocos[-1]['tipo'] == tipo:
            blocos[-1][chave].append(valor)
        elif chave:
            blocos.append({'tipo': tipo, chave: [valor]})
        else:
            blocos.append({'tipo': tipo, 'texto': valor})

    i = 0
    while i < len(linhas):
        linha = linhas[i]
        proxima = linhas[i + 1] if i + 1 < len(linhas) else ''
        par = re.fullmatch(r'\*{1,2}(.+?)\*\*\s*(.+)', linha)       # **Chave**Valor ou *Chave**Valor
        negrito = re.fullmatch(r'\*\*(.+?)\*\*', linha)              # **Chave** sozinho
        if linha.startswith('#'):
            adicionar('titulo', _titulo(linha.lstrip('# ')))
        elif negrito:
            if not proxima or proxima.startswith(('*', '#', '•', '- ')):
                adicionar('titulo', _titulo(negrito.group(1)))
            else:
                adicionar('specs', [negrito.group(1).strip(' :'), proxima])
                i += 1
        elif par:
            adicionar('specs', [par.group(1).strip(' :*'), par.group(2).strip()])
        elif re.match(r'^[•\-]\s', linha):
            adicionar('lista', re.sub(r'^[•\-]\s*', '', linha))
        elif linha.lower().strip(' :') in TITULOS_SOLTOS:
            adicionar('titulo', _titulo(linha))
        elif blocos and blocos[-1]['tipo'] == 'specs' and len(linha) < 90:
            # continuação do valor da especificação anterior (quebra de linha no original)
            ultima = blocos[-1]['linhas'][-1]
            ultima[1] = f"{ultima[1].rstrip(' ,;')}; {linha.rstrip(' ,')}"
        else:
            adicionar('paragrafo', linha)
        i += 1
    return blocos


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    pastas = {int(p.split('-', 1)[0]): p for p in os.listdir(os.path.join(ORIGEM, 'produtos')) if p[0].isdigit()}
    produtos = []
    for linha in csv.DictReader(open(os.path.join(ORIGEM, 'produtos.csv'), encoding='utf-8-sig'), delimiter=';'):
        idd = int(linha['id'])
        pasta = pastas[idd]
        slug = f"{idd}-{pasta.split('-', 1)[1]}"
        md = open(os.path.join(ORIGEM, 'produtos', pasta, 'produto.md'), encoding='utf-8').read()
        tipo, impressao = classificar(linha['nome'], linha['modelo'], linha['descricao_curta'])

        fotos = sorted((f for f in os.listdir(os.path.join(ORIGEM, 'produtos', pasta)) if f.startswith('foto-')),
                       key=lambda f: (f != CAPAS.get(idd), int(re.search(r'\d+', f).group())))
        destino_fotos = os.path.join(DESTINO, 'public', 'produtos', slug)
        os.makedirs(destino_fotos, exist_ok=True)
        for f in fotos:
            shutil.copyfile(os.path.join(ORIGEM, 'produtos', pasta, f), os.path.join(destino_fotos, f))

        produtos.append({
            'id': idd,
            'slug': slug,
            'nome': linha['nome'],
            'marca': 'Ricoh' if 'ricoh' in linha['nome'].lower() else '',
            'modelo': linha['modelo'].upper(),
            'condicao': linha['condicao'],
            # Sem preço: a empresa prefere que o cliente peça orçamento. O preço antigo continua em produtos.csv.
            'resumo': linha['descricao_curta'],
            'tipo': tipo,
            'impressao': impressao,
            'fotos': [f'/produtos/{slug}/{f}' for f in fotos],
            'descricao': ler_descricao_completa(md, ignorar=(linha['nome'], linha['modelo'], linha['nome'].replace('RICOH ', ''))),
        })

    # ordem de exibição: equipamentos antes dos suprimentos; dentro de cada grupo, do maior para o menor preço antigo
    preco = {int(l['id']): preco_em_centavos(l['preco'])
             for l in csv.DictReader(open(os.path.join(ORIGEM, 'produtos.csv'), encoding='utf-8-sig'), delimiter=';')}
    produtos.sort(key=lambda p: (p['tipo'] == 'suprimentos', -preco[p['id']]))
    os.makedirs(os.path.join(DESTINO, 'dados'), exist_ok=True)
    with open(os.path.join(DESTINO, 'dados', 'produtos.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(produtos, f, ensure_ascii=False, indent=2)
    for p in produtos:
        resumo = ' '.join(f"{b['tipo']}" + (f"({len(b.get('itens') or b.get('linhas'))})" if b['tipo'] in ('lista', 'specs') else '')
                          for b in p['descricao'])
        print(f"{p['slug']:28} {p['tipo']:16} {p['impressao']:9} {len(p['fotos'])} fotos | {resumo[:110]}")


if __name__ == '__main__':
    main()
