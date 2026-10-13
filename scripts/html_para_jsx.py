"""Converte HTML legado em JSX (React) preservando estrutura, classes e atributos.

Uso como módulo:
    from html_para_jsx import converter
    jsx = converter(html, reescrever_url=lambda u: u)

Regras: class->className, for->htmlFor, atributos em camelCase, style em objeto,
tags vazias autofechadas, value/checked de formulário viram defaultValue/defaultChecked,
<script> e comentários são removidos (scripts legados são carregados à parte).
"""
import html
import json
import re
from html.parser import HTMLParser

VAZIAS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param'}
ATRIBUTOS = {
    'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'maxlength': 'maxLength',
    'readonly': 'readOnly', 'colspan': 'colSpan', 'rowspan': 'rowSpan', 'frameborder': 'frameBorder',
    'allowfullscreen': 'allowFullScreen', 'autocomplete': 'autoComplete', 'enctype': 'encType',
    'cellpadding': 'cellPadding', 'cellspacing': 'cellSpacing', 'srcset': 'srcSet', 'crossorigin': 'crossOrigin',
    'http-equiv': 'httpEquiv', 'charset': 'charSet', 'accept-charset': 'acceptCharset', 'novalidate': 'noValidate',
    'autofocus': 'autoFocus', 'autoplay': 'autoPlay', 'datetime': 'dateTime', 'usemap': 'useMap',
    'marginheight': 'marginHeight', 'marginwidth': 'marginWidth', 'contenteditable': 'contentEditable',
    'spellcheck': 'spellCheck', 'itemprop': 'itemProp', 'itemscope': 'itemScope', 'itemtype': 'itemType',
    'xmlns:xlink': 'xmlnsXlink', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'viewbox': 'viewBox',
    'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
}
BOOLEANOS = {'allowFullScreen', 'autoFocus', 'autoPlay', 'checked', 'disabled', 'hidden', 'multiple', 'noValidate',
             'readOnly', 'required', 'selected', 'itemScope', 'controls', 'loop', 'muted', 'defer', 'async'}
URL_ATTRS = {'src', 'href', 'action', 'poster', 'data-src', 'data-image', 'data-bg', 'data-thumb', 'data-original'}
# Tags de bloco que, pela especificação do HTML, fecham um <p> aberto (o navegador faz isso ao ler a página).
FECHAM_P = {'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure',
            'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre',
            'section', 'table', 'ul'}


def _js(valor):
    return json.dumps(valor, ensure_ascii=False)


def _estilo(css, reescrever_url):
    partes = []
    for decl in css.split(';'):
        if ':' not in decl:
            continue
        prop, val = decl.split(':', 1)
        prop, val = prop.strip(), val.strip()
        if not prop or not val:
            continue
        val = re.sub(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", lambda m: f"url('{reescrever_url(m.group(1))}')", val)
        if prop.startswith('--'):
            chave = _js(prop)
        else:
            chave = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), prop.lower())
            if chave.startswith('Ms'):
                chave = 'ms' + chave[2:]
        partes.append(f'{chave}: {_js(val)}')
    return '{{ ' + ', '.join(partes) + ' }}'


def _texto(t):
    if not t:
        return ''
    # escapa caracteres especiais do JSX mantendo o texto visível idêntico
    return re.sub(r'([{}<>])', lambda m: "{'" + m.group(1) + "'}", t)


class _Conversor(HTMLParser):
    def __init__(self, reescrever_url):
        super().__init__(convert_charrefs=True)
        self.saida = []
        self.pilha = []
        self.pular = 0  # dentro de <script>
        self.estilo_inline = None
        self.reescrever_url = reescrever_url

    def _atributos(self, tag, attrs):
        res = []
        for nome, valor in attrs:
            nome_l = nome.lower()
            if nome_l.startswith('on'):  # handlers inline não são permitidos em JSX; o comportamento vem dos scripts legados
                continue
            if nome_l == 'style':
                if valor:
                    res.append(f'style={_estilo(valor, self.reescrever_url)}')
                continue
            jsx = ATRIBUTOS.get(nome_l, nome if (nome_l.startswith(('data-', 'aria-')) or ':' in nome) else nome_l)
            if tag in ('input', 'textarea', 'select') and jsx == 'value':
                jsx = 'defaultValue'
            if tag == 'input' and jsx == 'checked':
                jsx = 'defaultChecked'
            if tag == 'option' and jsx == 'selected':
                continue
            if valor is None:
                res.append(jsx if jsx in BOOLEANOS or jsx.startswith(('data-', 'aria-')) else f'{jsx}=""')
                continue
            if nome_l in URL_ATTRS:
                valor = self.reescrever_url(valor)
            res.append(f'{jsx}={_js(valor)}')
        return (' ' + ' '.join(res)) if res else ''

    def handle_starttag(self, tag, attrs):
        if self.pular:
            return
        if tag == 'script':
            self.pular += 1
            return
        if tag == 'style':
            self.estilo_inline = []
            return
        a = self._atributos(tag, attrs)
        if tag in FECHAM_P and 'p' in self.pilha:
            # mesmo comportamento do navegador: um bloco dentro de <p> fecha o parágrafo antes
            # (sem isso o React acusa erro de hidratação, porque o HTML do servidor e o do navegador diferem)
            while self.pilha:
                aberta = self.pilha.pop()
                self.saida.append(f'</{aberta}>')
                if aberta == 'p':
                    break
        if tag in VAZIAS:
            self.saida.append(f'<{tag}{a} />')
        else:
            self.saida.append(f'<{tag}{a}>')
            self.pilha.append(tag)

    def handle_startendtag(self, tag, attrs):
        if self.pular or tag == 'script':
            return
        self.saida.append(f'<{tag}{self._atributos(tag, attrs)} />')

    def handle_endtag(self, tag):
        if tag == 'script':
            self.pular = max(0, self.pular - 1)
            return
        if self.pular:
            return
        if tag == 'style' and self.estilo_inline is not None:
            css = ''.join(self.estilo_inline)
            self.saida.append('<style dangerouslySetInnerHTML={{ __html: ' + _js(css) + ' }} />')
            self.estilo_inline = None
            return
        if tag in VAZIAS:
            return
        if tag == 'p' and 'p' not in self.pilha:
            # um </p> sem abertura vira um parágrafo vazio, como o navegador faz
            self.saida.append('<p></p>')
            return
        # fecha tags esquecidas no HTML original até achar a correspondente
        if tag in self.pilha:
            while self.pilha:
                aberta = self.pilha.pop()
                self.saida.append(f'</{aberta}>')
                if aberta == tag:
                    break

    def handle_data(self, data):
        if self.pular:
            return
        if self.estilo_inline is not None:
            self.estilo_inline.append(data)
            return
        self.saida.append(_texto(data))

    def handle_comment(self, data):
        pass

    def resultado(self):
        while self.pilha:
            self.saida.append(f'</{self.pilha.pop()}>')
        jsx = ''.join(self.saida)
        jsx = re.sub(r'\n\s*\n+', '\n', jsx)
        return jsx


def converter(fragmento_html, reescrever_url=lambda u: u):
    c = _Conversor(reescrever_url)
    c.feed(fragmento_html)
    c.close()
    return c.resultado()


def scripts_em_ordem(pagina_html, reescrever_url=lambda u: u, transformar_codigo=lambda c: c, remover=()):
    """Lista os <script> da página na ordem original: [{'src': ...} | {'codigo': ...}].

    Ignora scripts dentro de comentários (ex.: condicionais do IE) e os de tipo não-JavaScript
    (ex.: text/template). "remover" é uma lista de trechos de endereço a descartar.
    """
    sem_comentarios = re.sub(r'<!--.*?-->', '', pagina_html, flags=re.S)
    itens = []
    for m in re.finditer(r'<script\b([^>]*)>(.*?)</script>', sem_comentarios, re.S | re.I):
        attrs, corpo = m.group(1), m.group(2)
        tipo = re.search(r'type\s*=\s*["\']([^"\']+)', attrs, re.I)
        if tipo and 'javascript' not in tipo.group(1).lower():
            continue
        src = re.search(r'src\s*=\s*["\']([^"\']+)', attrs, re.I)
        if src:
            url = reescrever_url(html.unescape(src.group(1)))
            if not any(r in url for r in remover):
                itens.append({'src': url})
        elif corpo.strip():
            codigo = transformar_codigo(corpo.strip())
            if codigo:
                itens.append({'codigo': codigo})
    return itens


def componente(nome, fragmento_html, reescrever_url=lambda u: u, comentario=''):
    jsx = converter(fragmento_html, reescrever_url)
    cab = f'// {comentario}\n' if comentario else ''
    return f'{cab}export default function {nome}() {{\n  return (\n    <>\n{jsx}\n    </>\n  );\n}}\n'
