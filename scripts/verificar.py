"""Verificações automáticas do repositório NF-Site (usadas no CI e localmente).

Uso:
    python scripts/verificar.py

Checagens:
  1. arquivos proibidos   - backups, executáveis, configs com senha, logs, arquivos grandes
  2. código fora do lugar - PHP/scripts de servidor só nas pastas liberadas
  3. código malicioso     - padrões de webshell/backdoor vistos no ataque ao site antigo
  4. conteúdo             - fotos citadas nas fichas existem, CSVs bem formados

Falsos positivos de (3) podem ser liberados em .github/verificacao-permitidos.txt
(uma linha por arquivo: "caminho  # motivo").
"""
import csv
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAMANHO_MAXIMO = 5 * 1024 * 1024  # 5 MB

EXTENSOES_PROIBIDAS = {
    '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.jpa',        # backups compactados
    '.exe', '.dll', '.bat', '.cmd', '.msi', '.scr', '.com',      # executáveis Windows
    '.phar', '.phtml', '.php5', '.php7', '.pht', '.suspected',   # variantes de PHP usadas por webshells
    '.sql', '.bak', '.old', '.log', '.env',                      # dumps, cópias e logs
}
NOMES_PROIBIDOS = {
    'wp-config.php', 'configuration.php', 'settings.inc.php', 'parameters.php',
    'error_log', '.htpasswd', 'php.ini', '.user.ini',
}
# Scripts de servidor só podem existir nestas pastas (o resto do repositório é conteúdo).
EXTENSOES_SERVIDOR = {'.php', '.inc', '.cgi', '.pl', '.py', '.sh', '.asp', '.aspx', '.jsp'}
PASTAS_LIBERADAS_PARA_SERVIDOR = (
    'reconstrucao/site-principal/layout-original-template-nfsolucoes/',
    'scripts/',
)

EXTENSOES_IMAGEM = {'.jpg', '.jpeg', '.png', '.gif', '.ico', '.bmp', '.webp'}
EXTENSOES_TEXTO = {'.php', '.inc', '.js', '.html', '.htm', '.css', '.less', '.scss', '.svg', '.xml',
                   '.json', '.md', '.txt', '.csv', '.ini', '.htaccess', '.py', '.sh', '.yml', '.yaml', ''}

ASSINATURAS = [
    ('eval com decodificação', r"\b(eval|assert)\s*\(\s*@?\s*(base64_decode|gzinflate|gzuncompress|gzdecode|str_rot13|strrev|rawurldecode|hex2bin|convert_uudecode)\s*\("),
    ('execução de dado da requisição', r"\b(eval|assert|system|exec|shell_exec|passthru|popen|proc_open)\s*\(\s*@?\s*(stripslashes\s*\(\s*)?\$_(GET|POST|REQUEST|COOKIE|SERVER)"),
    ('função variável vinda da requisição', r"\$_(GET|POST|REQUEST|COOKIE)\s*\[[^\]]+\]\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)"),
    ('create_function com requisição', r"create_function\s*\([^)]*\$_(GET|POST|REQUEST|COOKIE)"),
    ('nome de webshell conhecido', r"(FilesMan|WSO\s*\d|b374k|c99shell|r57shell|IndoXploit|AnonymousFox|ALFA_DATA|hacked\s+by)"),
    ('ofuscação via $GLOBALS', r"\$GLOBALS\s*\[\s*['\"][^'\"]{1,12}['\"]\s*\]\s*\[\s*\d+\s*\]\s*\.\s*\$GLOBALS"),
    ('palavra-chave em hexadecimal', r"(\\x65\\x76\\x61\\x6c|\\145\\166\\141\\154|\\x62\\x61\\x73\\x65|\\x61\\x73\\x73\\x65\\x72\\x74)"),
    ('include de arquivo remoto', r"(include|require)(_once)?\s*\(?\s*['\"]https?://"),
    ('include de imagem ou texto', r"(include|require)(_once)?\s*\(?\s*['\"][^'\"]+\.(ico|png|jpe?g|gif|txt)['\"]"),
    ('senha fixa em cookie (backdoor)', r"md5\s*\(\s*\$_(COOKIE|POST|GET)\s*\[[^\]]+\]\s*\)\s*==\s*['\"][0-9a-f]{32}['\"]"),
    ('JavaScript eval ofuscado', r"eval\s*\(\s*(String\.fromCharCode|atob\s*\(|unescape\s*\()"),
    ('auto_prepend/append de PHP', r"auto_(prepend|append)_file\s*=?\s*['\"]?[^\s'\"]+"),
    ('PHP executando arquivos de mídia', r"(AddType|AddHandler|SetHandler)[^\n]*(php|x-httpd)[^\n]*\.(jpe?g|png|gif|ico|txt)"),
]
ASSINATURAS = [(nome, re.compile(rx, re.I | re.S)) for nome, rx in ASSINATURAS]

erros = []


def erro(checagem, caminho, mensagem, linha=None):
    erros.append((checagem, caminho, linha, mensagem))


def extensao(caminho):
    base = caminho.rsplit('/', 1)[-1]
    if base.startswith('.') and base.count('.') == 1:
        return base.lower()
    return ('.' + base.rsplit('.', 1)[-1].lower()) if '.' in base else ''


def listar_arquivos():
    """Arquivos versionados + novos ainda não ignorados (mesma visão do CI)."""
    try:
        saida = subprocess.run(['git', '-c', 'core.quotepath=off', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
                               cwd=RAIZ, capture_output=True, check=True).stdout
        return sorted(p for p in saida.decode('utf-8').split('\0') if p and os.path.isfile(os.path.join(RAIZ, p)))
    except (OSError, subprocess.CalledProcessError):
        arquivos = []
        for pasta, dirs, nomes in os.walk(RAIZ):
            dirs[:] = [d for d in dirs if d not in ('.git', 'graphify-out')]
            arquivos += [os.path.relpath(os.path.join(pasta, n), RAIZ).replace(os.sep, '/') for n in nomes]
        return sorted(arquivos)


def carregar_permitidos():
    caminho = os.path.join(RAIZ, '.github', 'verificacao-permitidos.txt')
    permitidos = set()
    if os.path.exists(caminho):
        for linha in open(caminho, encoding='utf-8'):
            linha = linha.split('#', 1)[0].strip()
            if linha:
                permitidos.add(linha)
    return permitidos


def sql_de_estrutura(caminho):
    """Libera .sql só na pasta banco-de-dados/ e só se não tiver dados (nenhum INSERT/LOAD DATA).
    Um backup (dump) de banco sempre tem INSERT, então continua barrado."""
    if not caminho.startswith('banco-de-dados/'):
        return False
    with open(os.path.join(RAIZ, caminho), encoding='utf-8', errors='replace') as f:
        texto = f.read()
    return not re.search(r'\b(INSERT\s+INTO|LOAD\s+DATA|REPLACE\s+INTO)\b', texto, re.I)


def verificar_arquivos_proibidos(arquivos):
    for caminho in arquivos:
        nome = caminho.rsplit('/', 1)[-1]
        if re.fullmatch(r'\.env(\..+)?', nome) and not nome.endswith('.example'):
            erro('arquivos proibidos', caminho, 'arquivo .env com configuração real (senhas ficam só no servidor; publique apenas os .example)')
        if extensao(caminho) == '.sql' and sql_de_estrutura(caminho):
            pass  # estrutura do banco (tabelas e permissões), sem nenhum dado: pode ser publicada
        elif extensao(caminho) in EXTENSOES_PROIBIDAS:
            erro('arquivos proibidos', caminho, f'extensão {extensao(caminho)} não pode ser publicada (backup, executável, dump ou log)')
        if nome.lower() in NOMES_PROIBIDOS or re.search(r'(old|_|backup)[-_]?configuration\.php$', nome, re.I):
            erro('arquivos proibidos', caminho, 'arquivo de configuração/log do servidor (pode conter senhas)')
        tamanho = os.path.getsize(os.path.join(RAIZ, caminho))
        if tamanho > TAMANHO_MAXIMO:
            erro('arquivos proibidos', caminho, f'arquivo com {tamanho / 1048576:.1f} MB (limite {TAMANHO_MAXIMO // 1048576} MB)')
        if re.search(r'\.(php|phtml|asp|jsp)\.(jpe?g|png|gif|txt)$|\.(jpe?g|png|gif)\.(php|phtml)$', nome, re.I):
            erro('arquivos proibidos', caminho, 'extensão dupla (truque comum para esconder scripts)')


def verificar_codigo_fora_do_lugar(arquivos):
    for caminho in arquivos:
        if extensao(caminho) in EXTENSOES_SERVIDOR and not caminho.startswith(PASTAS_LIBERADAS_PARA_SERVIDOR):
            erro('código fora do lugar', caminho,
                 'script de servidor fora das pastas liberadas (veja PASTAS_LIBERADAS_PARA_SERVIDOR em scripts/verificar.py)')


def verificar_codigo_malicioso(arquivos, permitidos):
    for caminho in arquivos:
        if caminho in permitidos or caminho == 'scripts/verificar.py':
            continue
        ext = extensao(caminho)
        if ext not in EXTENSOES_TEXTO and ext not in EXTENSOES_IMAGEM:
            continue
        try:
            dados = open(os.path.join(RAIZ, caminho), 'rb').read()
        except OSError as e:
            # No Windows, o antivírus bloqueia a leitura de arquivos que ele reconhece como maliciosos.
            erro('código malicioso', caminho, f'não foi possível ler o arquivo (bloqueado pelo antivírus?): {e.strerror}')
            continue
        texto = dados.decode('latin-1')
        if ext in EXTENSOES_IMAGEM:
            # "<?=" fica de fora: com só 3 bytes, aparece por acaso dentro de dados comprimidos.
            if re.search(r'<\?php|\beval\s*\(', texto, re.I):
                erro('código malicioso', caminho, 'imagem contém código PHP escondido')
            continue
        for nome, rx in ASSINATURAS:
            achado = rx.search(texto)
            if achado:
                linha = texto.count('\n', 0, achado.start()) + 1
                trecho = re.sub(r'\s+', ' ', achado.group(0))[:80]
                erro('código malicioso', caminho, f'{nome}: "{trecho}"', linha)


def ler_csv(caminho):
    with open(os.path.join(RAIZ, caminho), encoding='utf-8-sig', newline='') as f:
        return list(csv.reader(f, delimiter=';'))


def verificar_conteudo(arquivos):
    conjunto = set(arquivos)
    for caminho in arquivos:
        if extensao(caminho) in ('.js', '.jsx', '.mjs', '.ts', '.tsx') or caminho.rsplit('/', 1)[-1].startswith('.env'):
            texto = open(os.path.join(RAIZ, caminho), encoding='utf-8', errors='replace').read()
            for m in re.finditer(r'NEXT_PUBLIC_[A-Z0-9_]*(SENHA|SEGREDO|SECRET|TOKEN|PASSWORD|CHAVE|KEY|DATABASE)[A-Z0-9_]*', texto):
                erro('conteúdo', caminho, f'{m.group(0)}: segredo com prefixo NEXT_PUBLIC_ iria para o navegador',
                     texto.count(chr(10), 0, m.start()) + 1)
        if extensao(caminho) == '.csv':
            try:
                linhas = ler_csv(caminho)
            except UnicodeDecodeError:
                erro('conteúdo', caminho, 'CSV não está em UTF-8')
                continue
            if not linhas:
                erro('conteúdo', caminho, 'CSV vazio')
                continue
            for n, linha in enumerate(linhas[1:], start=2):
                if len(linha) != len(linhas[0]):
                    erro('conteúdo', caminho, f'linha com {len(linha)} colunas, cabeçalho tem {len(linhas[0])}', n)
        if caminho.endswith('/produto.md'):
            pasta = caminho.rsplit('/', 1)[0]
            texto = open(os.path.join(RAIZ, caminho), encoding='utf-8').read()
            m = re.search(r'\*\*Fotos:\*\*\s*(.+)', texto)
            fotos = [f.strip() for f in m.group(1).split(',')] if m else []
            for foto in fotos:
                if foto and not foto.startswith('nenhuma') and f'{pasta}/{foto}' not in conjunto:
                    erro('conteúdo', caminho, f'foto citada não existe: {foto}')
    if 'reconstrucao/loja/produtos.csv' in conjunto:
        pastas = {re.match(r'reconstrucao/loja/produtos/(\d+)-', p).group(1).lstrip('0')
                  for p in conjunto if re.match(r'reconstrucao/loja/produtos/\d+-[^/]+/produto\.md$', p)}
        ids = {linha[0] for linha in ler_csv('reconstrucao/loja/produtos.csv')[1:] if linha}
        for i in sorted(ids - pastas, key=int):
            erro('conteúdo', 'reconstrucao/loja/produtos.csv', f'produto {i} está na planilha mas não tem pasta com produto.md')
        for i in sorted(pastas - ids, key=int):
            erro('conteúdo', 'reconstrucao/loja/produtos.csv', f'pasta do produto {i} existe mas ele não está na planilha')


def relatorio(arquivos):
    no_ci = os.environ.get('GITHUB_ACTIONS') == 'true'
    for checagem, caminho, linha, msg in erros:
        if no_ci:
            onde = f'file={caminho}' + (f',line={linha}' if linha else '')
            print(f'::error {onde},title={checagem}::{msg}')
        else:
            print(f'[{checagem}] {caminho}' + (f':{linha}' if linha else '') + f' - {msg}')
    checagens = ['arquivos proibidos', 'código fora do lugar', 'código malicioso', 'conteúdo']
    resumo = ['## Verificação do repositório', '', f'{len(arquivos)} arquivos verificados.', '',
              '| Checagem | Resultado |', '|---|---|']
    for c in checagens:
        n = sum(1 for e in erros if e[0] == c)
        resumo.append(f'| {c} | {"✅ ok" if n == 0 else f"❌ {n} problema(s)"} |')
    texto = '\n'.join(resumo) + '\n'
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
            f.write(texto)
    print()
    print(texto)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    arquivos = listar_arquivos()
    verificar_arquivos_proibidos(arquivos)
    verificar_codigo_fora_do_lugar(arquivos)
    verificar_codigo_malicioso(arquivos, carregar_permitidos())
    verificar_conteudo(arquivos)
    relatorio(arquivos)
    sys.exit(1 if erros else 0)


if __name__ == '__main__':
    main()
