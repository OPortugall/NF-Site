'use client';

import { useMemo, useState } from 'react';
import { IMPRESSAO, TIPOS, linkWhatsApp } from '@/lib/produtos';
import CartaoProduto from './CartaoProduto';

const ORDENS = {
  relevancia: 'Mais relevantes',
  menor: 'Menor preço',
  maior: 'Maior preço',
};

function Filtro({ legenda, opcoes, valor, aoMudar, nome }) {
  return (
    <fieldset className="filtro">
      <legend className="filtro__legenda">{legenda}</legend>
      <div className="filtro__opcoes">
        {Object.entries(opcoes).map(([chave, rotulo]) => (
          <label key={chave} className="filtro__opcao">
            <input type="radio" name={nome} value={chave} checked={valor === chave} onChange={() => aoMudar(chave)} />
            <span>{rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Catalogo({ produtos }) {
  const [tipo, setTipo] = useState('todos');
  const [impressao, setImpressao] = useState('todas');
  const [ordem, setOrdem] = useState('relevancia');

  const lista = useMemo(() => {
    const filtrados = produtos.filter(
      (p) => (tipo === 'todos' || p.tipo === tipo) && (impressao === 'todas' || p.impressao === impressao),
    );
    if (ordem === 'menor') return [...filtrados].sort((a, b) => a.precoCentavos - b.precoCentavos);
    if (ordem === 'maior') return [...filtrados].sort((a, b) => b.precoCentavos - a.precoCentavos);
    return filtrados;
  }, [produtos, tipo, impressao, ordem]);

  const limpar = () => {
    setTipo('todos');
    setImpressao('todas');
  };

  return (
    <div className="catalogo">
      <div className="catalogo__filtros">
        <Filtro legenda="Tipo" nome="tipo" opcoes={{ todos: 'Todos', ...TIPOS }} valor={tipo} aoMudar={setTipo} />
        <Filtro legenda="Impressão" nome="impressao" opcoes={{ todas: 'Todas', ...IMPRESSAO }} valor={impressao} aoMudar={setImpressao} />
      </div>

      <div className="catalogo__barra">
        <p aria-live="polite">
          {lista.length} {lista.length === 1 ? 'produto' : 'produtos'}
        </p>
        <label className="catalogo__ordem">
          Ordenar por
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            {Object.entries(ORDENS).map(([k, r]) => (
              <option key={k} value={k}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {lista.length > 0 ? (
        <div className="grade-produtos">
          {lista.map((p, i) => (
            <CartaoProduto key={p.slug} produto={p} preload={i < 4} />
          ))}
        </div>
      ) : (
        <div className="vazio">
          <p>Nenhum produto com esses filtros no momento.</p>
          <div className="vazio__acoes">
            <button type="button" className="botao botao--secundario" onClick={limpar}>Limpar filtros</button>
            <a className="botao botao--whatsapp" href={linkWhatsApp('Olá! Procuro um equipamento que não encontrei no site.')}>
              Perguntar pelo WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
