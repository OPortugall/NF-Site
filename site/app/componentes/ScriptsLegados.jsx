'use client';

import { useEffect } from 'react';

/**
 * Executa os scripts do site antigo (arquivos .js e scripts embutidos) na mesma ordem
 * em que apareciam na página original.
 *
 * "itens" é uma lista em ordem: { src: '/caminho.js' } ou { codigo: '...' }.
 *
 * Como funciona:
 *  1. baixa todos os arquivos locais em paralelo;
 *  2. executa tudo em sequência, de uma vez só (sem pausas entre um script e outro).
 * Assim o "documento pronto" do jQuery só dispara depois que todos os scripts rodaram,
 * exatamente como acontecia no site antigo, e as variáveis globais que os scripts embutidos
 * definem já existem quando os arquivos .js precisam delas.
 *
 * Roda só no navegador, depois que o React montou a página.
 */
export default function ScriptsLegados({ itens }) {
  useEffect(() => {
    // Evita rodar duas vezes (o React executa efeitos em dobro no modo de desenvolvimento).
    if (window.__scriptsLegadosCarregados) return;
    window.__scriptsLegadosCarregados = true;

    const local = (src) => src.startsWith('/') && !src.startsWith('//');

    const baixar = (src) =>
      fetch(src)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${src}`))))
        .catch((erro) => {
          console.error('Script legado não carregou:', erro.message);
          return '';
        });

    Promise.all(itens.map((item) => (item.src && local(item.src) ? baixar(item.src) : null))).then((textos) => {
      itens.forEach((item, i) => {
        const tag = document.createElement('script');
        if (item.src && !local(item.src)) {
          tag.src = item.src; // serviço externo (ex.: chat): carrega normalmente, sem bloquear
          tag.async = true;
        } else if (item.src) {
          // "sourceURL" mantém o nome do arquivo nas mensagens de erro do navegador
          tag.text = `${textos[i]}\n//# sourceURL=${item.src}`;
        } else {
          tag.text = item.codigo;
        }
        document.body.appendChild(tag);
      });
    });
  }, [itens]);

  return null;
}
