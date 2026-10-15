# Site da NF Soluções Digitais: versão para publicação (vitrine)

Esta pasta é a **versão que pode ir ao ar agora**, sem banco de dados. É uma cópia do `site-novo/`
sem as partes que dependem de banco:

- **Saiu:** login, cadastro (`/entrar`), carrinho e a consulta de CNPJ.
- **Fica:** página inicial com o banner, loja com filtros, página de cada produto e pedido
  de orçamento pelo WhatsApp (com a mensagem já preenchida).

O desenvolvimento continua em `site-novo/`. Quando o banco estiver pronto, login e carrinho
voltam a partir de lá.

O site não coleta dados pessoais (não há formulários), por isso pode ir ao ar antes da
Política de Privacidade. Ela passa a ser obrigatória quando o cadastro voltar.

## Rodar no computador

```
cd site-publicacao
npm install
npm run build
npm start
```

Abra http://localhost:3000.

## Publicar na Hostinger (plano Cloud, Node.js)

1. No hPanel: **Sites → Adicionar site → Node.js Apps**.
2. Envie esta pasta (pelo GitHub ou em .zip, **sem** `node_modules` e `.next`).
3. Configuração:
   - Versão do Node: **22.x** ou **24.x**
   - Comando de build: `npm run build`
   - Comando de início: `npm start`
4. Aponte o domínio `nfsolucoesdigitais.com.br` para o app.

## Antes de publicar, confirme com o cliente

- As fotos de Konica Minolta, Epson, Anycubic e ADGL são dos fabricantes/fornecedores:
  confirmar que a NF pode usá-las como revendedora.
- A lista de produtos (alguns serão trocados por modelos mais novos).
