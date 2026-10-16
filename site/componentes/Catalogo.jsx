'use client';

import { useMemo, useState } from 'react';
import { FILTROS_TIPO, IMPRESSAO, linkWhatsApp } from '@/lib/produtos';
import CartaoProduto from './CartaoProduto';

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

export default function Catalogo({ produtos, tipoInicial = 'todos' }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [impressao, setImpressao] = useState('todas');

  const lista = useMemo(
    () =>
      produtos.filter(
        (p) => (tipo === 'todos' || FILTROS_TIPO[tipo].tipos.includes(p.tipo)) && (impressao === 'todas' || p.impressao === impressao),
      ),
    [produtos, tipo, impressao],
  );

  const limpar = () => {
    setTipo('todos');
    setImpressao('todas');
  };

  return (
    <div className="catalogo">
      <div className="catalogo__filtros">
        <Filtro legenda="Tipo" nome="tipo" opcoes={{ todos: 'Todos', ...Object.fromEntries(Object.entries(FILTROS_TIPO).map(([k, f]) => [k, f.rotulo])) }} valor={tipo} aoMudar={setTipo} />
        <Filtro legenda="Impressão" nome="impressao" opcoes={{ todas: 'Todas', ...IMPRESSAO }} valor={impressao} aoMudar={setImpressao} />
      </div>

      <div className="catalogo__barra">
        <p aria-live="polite">
          {lista.length} {lista.length === 1 ? 'produto' : 'produtos'}
        </p>
        <p>Preços sob consulta: peça seu orçamento sem custo.</p>
      </div>

      {/* Título para leitores de tela: liga o <h1> da página aos <h3> dos cartões, sem pular nível */}
      <h2 className="visualmente-oculto">Produtos</h2>
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
