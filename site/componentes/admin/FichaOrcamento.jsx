'use client';

import { useCallback, useEffect, useState } from 'react';
import { ACOES, ETIQUETA_ORCAMENTO, SITUACOES_ORCAMENTO, cep, dataHora, descreverDetalhes, documento, telefone } from './comum';

const MODALIDADES = { compra: 'Compra', locacao: 'Locação' };
const soDigitos = (t) => String(t || '').replace(/\D/g, '');

// Um pedido de orçamento: itens, cliente, situação e anotações da equipe.
export default function FichaOrcamento({ id, api }) {
  const [o, setO] = useState(null);
  const [notas, setNotas] = useState('');
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const r = await api('GET', `orcamento?id=${id}`);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    setO(r.dados.orcamento);
    setNotas(r.dados.orcamento.observacoesInternas || '');
  }, [api, id]);
  useEffect(() => { carregar(); }, [carregar]);

  const enviar = async (rota, dados, sucesso) => {
    setOcupado(true);
    setMsg(null);
    const r = await api('POST', rota, { id, ...dados });
    setOcupado(false);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    setMsg({ tipo: 'ok', texto: sucesso });
    carregar();
  };

  if (!o) return msg ? <p className="adm-aviso adm-aviso--erro">{msg.texto}</p> : <p className="adm-carregando">Carregando…</p>;
  const c = o.cliente;
  const en = o.endereco;
  const zap = c ? `https://wa.me/55${soDigitos(c.telefone)}?text=${encodeURIComponent(`Olá, ${c.nome.split(' ')[0]}! Aqui é da NF Soluções Digitais, sobre o seu pedido de orçamento ${o.codigo}.`)}` : null;

  return (
    <>
      <p><a href="#orcamentos" className="adm-voltar">← Pedidos de orçamento</a></p>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">Pedido {o.codigo}</h1>
        <div className="adm-acoes">
          <span className={`adm-etiqueta ${ETIQUETA_ORCAMENTO[o.status]}`}>{SITUACOES_ORCAMENTO[o.status]}</span>
          <span className="adm-suave">Enviado em {dataHora(o.criadoEm)}</span>
        </div>
      </div>
      {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}

      <div className="adm-ficha adm-ficha--orcamento">
        <div>
          <section className="adm-bloco">
            <h2>Produtos pedidos</h2>
            <div className="adm-tabela adm-tabela--simples">
              <table>
                <thead><tr><th>Qtd.</th><th>Produto</th><th>Modalidade</th></tr></thead>
                <tbody>
                  {o.itens.map((i) => (
                    <tr key={`${i.slug}|${i.modalidade}`}>
                      <td><strong>{i.quantidade}</strong></td>
                      <td>{i.produtoId ? <a href={`#produto/${i.produtoId}`}>{i.nome}</a> : i.nome}</td>
                      <td><span className={`adm-etiqueta ${i.modalidade === 'locacao' ? 'adm-etiqueta--c' : ''}`}>{MODALIDADES[i.modalidade]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {o.observacoesCliente && (
              <div className="adm-citacao">
                <strong>Observações do cliente</strong>
                <p>{o.observacoesCliente}</p>
              </div>
            )}
          </section>

          <section className="adm-bloco">
            <h2>Anotações da equipe</h2>
            <p className="adm-dica">Só a equipe vê. Use para valores combinados, prazos e próximos passos.</p>
            <label className="adm-campo">
              <span className="visualmente-oculto">Anotações</span>
              <textarea rows={5} maxLength={5000} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </label>
            <p>
              <button type="button" className="adm-botao" disabled={ocupado || notas === (o.observacoesInternas || '')}
                onClick={() => enviar('orcamento-notas', { observacoes: notas }, 'Anotações salvas.')}>
                Salvar anotações
              </button>
            </p>
          </section>
        </div>

        <aside className="adm-lateral adm-lateral--orcamento">
          <section className="adm-bloco">
            <h2>Situação</h2>
            <p className="adm-dica">O cliente vê a situação em “Minha conta”, no site.</p>
            <div className="adm-situacoes">
              {Object.entries(SITUACOES_ORCAMENTO).map(([v, r]) => (
                <button key={v} type="button" className={`adm-situacao ${o.status === v ? 'adm-situacao--atual' : ''}`} aria-pressed={o.status === v}
                  disabled={ocupado || o.status === v} onClick={() => enviar('orcamento-status', { status: v }, `Situação: ${r}.`)}>
                  {r}
                </button>
              ))}
            </div>
            {o.atendidoPor && <p className="adm-suave">Responsável: {o.atendidoPor}</p>}
          </section>

          <section className="adm-bloco">
            <h2>Cliente</h2>
            {!c ? <p className="adm-vazio">O cliente excluiu a conta. O pedido fica no histórico sem os dados pessoais.</p> : (
              <>
                <p><a href={`#cliente/${c.id}`}><strong>{c.nome}</strong></a></p>
                {c.razaoSocial && <p className="adm-suave">{c.razaoSocial}{c.nomeFantasia ? ` (${c.nomeFantasia})` : ''}</p>}
                <dl className="adm-dados">
                  <dt>{c.tipo === 'cnpj' ? 'CNPJ' : 'CPF'}</dt><dd>{documento(c)}</dd>
                  <dt>E-mail</dt><dd><a href={`mailto:${c.email}?subject=${encodeURIComponent(`Orçamento ${o.codigo} - NF Soluções Digitais`)}`}>{c.email}</a></dd>
                  <dt>Telefone</dt><dd>{telefone(c.telefone)}</dd>
                </dl>
                <p className="adm-acoes adm-acoes--topo">
                  <a className="adm-botao" href={zap} target="_blank" rel="noopener noreferrer">Responder pelo WhatsApp</a>
                </p>
              </>
            )}
          </section>

          {en && (
            <section className="adm-bloco">
              <h2>Endereço de entrega</h2>
              <p>{en.rua}, {en.numero}{en.complemento ? ` ${en.complemento}` : ''}<br />{en.bairro}, {en.cidade}/{en.uf}<br />CEP {cep(en.cep)}</p>
            </section>
          )}

          <section className="adm-bloco">
            <h2>Histórico</h2>
            {o.historico.length === 0 ? <p className="adm-vazio">Nenhuma alteração ainda.</p> : (
              <ul className="adm-lista adm-lista--compacta">
                {o.historico.map((h, i) => (
                  <li key={i}>
                    <strong>{ACOES[h.acao] || h.acao}</strong>
                    <span className="adm-suave">{h.admin}, em {dataHora(h.em)}</span>
                    {descreverDetalhes(h.acao, h.detalhes) && <span className="adm-suave adm-bloco-texto">{descreverDetalhes(h.acao, h.detalhes)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
