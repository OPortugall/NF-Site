# Reconstrução do site NF Soluções Digitais

Material reunido em 10/10/2026 para reconstruir **nfsolucoesdigitais.com.br**.
São 1.012 arquivos (18,6 MB), separados dos 40.609 que havia no backup.

**Fontes**
- `BkpNF.zip`, já limpo: arquivos do servidor, tirados de `BkpNF-limpo.zip`.
- **Wayback Machine** (web.archive.org): cópias das páginas como estavam no ar. Usamos sempre a cópia mais recente de **antes de 23/01/2025**, data a partir da qual o site estava atacado.

O `BkpNF.zip` original não foi alterado e continua na pasta `NF-Site`.

---

## O que tem aqui

```
reconstrucao/
├── site-principal/          (era o Joomla em /nfs/ — para onde o domínio apontava)
│   ├── conteudo/
│   │   ├── pagina-inicial.md                       ← TODO o texto do site (Empresa, Missão, Serviços...)
│   │   └── pagina-inicial-original-2024-02-22.html ← a página como estava no ar
│   ├── imagens/                                    ← 238 imagens enviadas para o site
│   ├── arquivos-usados-no-site/                    ← imagens, estilos e fontes que a página usava
│   └── layout-original-template-nfsolucoes/        ← o template visual próprio (referência de layout)
│
├── loja/                    (era o PrestaShop em /loja/)
│   ├── produtos.csv                                ← os 12 produtos: nome, modelo, condição, preço, estoque
│   ├── categorias.csv                              ← as 16 categorias e quais produtos estavam em cada uma
│   ├── produtos/NN-nome/                           ← uma pasta por produto
│   │   ├── produto.md                              ← ficha completa com descrição
│   │   ├── foto-NN.jpg                             ← fotos originais (sem redução)
│   │   └── pagina-original-AAAAMMDD.html
│   ├── categorias/                                 ← imagens das categorias
│   ├── paginas/                                    ← Quem somos, Termos, Privacidade, Pagamento, Contato...
│   ├── imagens/                                    ← logotipo, banners e imagens das páginas
│   └── arquivos-usados-no-site/                    ← imagens, estilos e fontes do tema que a loja usava
│
└── _controle/
    ├── origem-de-cada-arquivo.csv                  ← de onde veio cada arquivo e por quê foi mantido
    └── paginas-descartadas.csv                     ← páginas do Wayback que não foram usadas e o motivo
```

### Produtos recuperados

| ID | Produto | Condição | Preço (jan/2025) |
|---|---|---|---|
| 1 | RICOH MPC2050 | Usado | R$ 4.800,00 |
| 2 | RICOH MPC2551 | Usado | R$ 5.600,00 |
| 3 | RICOH MPC2550 | Usado | R$ 5.400,00 |
| 4 | Toner Ricoh Compatível | Novo | R$ 140,00 |
| 11 | Toner Ricoh Compatível | Novo | R$ 260,00 |
| 12 | RICOH MP5000 | Usado | R$ 7.000,00 |
| 13 | RICOH MPC2051 | Usado | R$ 5.400,00 |
| 14 | RICOH SPC232DN | Usado | R$ 600,00 |
| 15 | RICOH MP5001 | Usado | R$ 7.600,00 |
| 16 | RICOH SPC430DN | Usado | R$ 2.000,00 |
| 17 | RICOH MP7500 | Usado | R$ 9.000,00 |
| 18 | RICOH MPC3502 | Usado | R$ 12.000,00 |

Os preços e o estoque são os da data de cada cópia. Confira antes de publicar.

---

## Por que havia 40.000 arquivos (e o que foi descartado)

| Descartado | Arquivos (aprox.) | Motivo |
|---|---|---|
| Site **3rsolar.com.br** inteiro | 14.950 | Outro site, não faz parte da reconstrução |
| Arquivos de sistema do Joomla, PrestaShop e WordPress | 16.000 | São os programas em si. Idênticos aos oficiais e baixáveis a qualquer momento, em versão nova |
| Módulos, plugins, traduções e temas não usados | 6.000 | Extensões instaladas, mas que não apareciam no site |
| Tema e plugins do WordPress em `/nf/` | 380 | Instalação recente (jan/2025), vazia: sem uploads e sem nenhuma página publicada |
| Instalador da loja, cache, logs de erro | 2.300 | Gerados automaticamente ou perigosos de manter |
| Blog do site principal | — | Era o conteúdo de **demonstração** do tema (textos em latim), cheio de spam |

---

## O que descobrimos sobre o ataque

1. **O ataque foi spam nos comentários do blog** do site principal: centenas de comentários de cassino e pornografia. Eles ficam no **banco de dados**, por isso não apareceram nos arquivos.
2. **De abril a dezembro de 2024, o site principal ficou fora do ar.** A página inicial mostrava só um erro de banco de dados (`INSERT command denied ... nfs_session`). Isso costuma acontecer quando o banco estoura o limite de espaço da hospedagem, o que bate com a enxurrada de spam.
3. **O "loop":** o Joomla procurava um template (`vt_hitech`) que tinha sido apagado, gerando erro em cima de erro até travar (23 e 30/01/2025). A loja também gerou 931 mil linhas de erro repetido ao longo dos anos (log de 226 MB).
4. Um arquivo suspeito (`nfs/download/apfill*.zip`, um programa `.exe` pirata) ficou isolado em `BkpNF-quarentena.zip`. **Não abra.**
5. Os sistemas eram muito antigos (Joomla 3.3.4 de 2014, PrestaShop 1.6.1.4) e cheios de falhas conhecidas. **Não reaproveite os programas antigos**: instale versões atuais.

---

## Banco de dados: o que pedir à hospedagem

Para completar a recuperação, peça à hospedagem o backup (dump `.sql`) dos bancos de dados do site. O mais importante é o da **loja**, que tem clientes, pedidos e os produtos completos. Os nomes e endereços dos bancos estão nos arquivos de configuração do backup original, que não é publicado.

As senhas dos bancos estavam nos arquivos do site. **Troque todas** (bancos, FTP, painel da hospedagem e administradores).
