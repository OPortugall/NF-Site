# Site da NF Soluções Digitais: versão para publicação (vitrine)

Esta pasta é a **versão que pode ir ao ar agora**, sem banco de dados. É uma cópia do `site-novo/`
sem as partes que dependem de banco:

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

