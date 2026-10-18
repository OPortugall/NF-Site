'use client';

import { useEffect, useState } from 'react';
import { ACOES, Paginacao, dataHora, descreverDetalhes } from './comum';

// Histórico de tudo o que foi feito pelo painel (quem, o quê, quando).
export default function Auditoria({ api }) {
  const [pagina, setPagina] = useState(1);
  const [res, setRes] = useState(null);

  useEffect(() => {
    api('GET', `auditoria?pagina=${pagina}`).then((r) => r.ok && setRes(r.dados));
  }, [api, pagina]);

  return (
    <>
      <h1 className="adm-titulo">Histórico do painel</h1>
      <p className="adm-dica">Registro de tudo o que foi feito no painel. Senhas e segredos nunca aparecem aqui.</p>
      {!res ? <p className="adm-carregando">Carregando…</p> : res.registros.length === 0 ? <p className="adm-vazio">Nada registrado ainda.</p> : (
        <>
          <div className="adm-tabela" role="region" aria-label="Histórico" tabIndex={0}>
            <table>
              <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Detalhes</th></tr></thead>
              <tbody>
                {res.registros.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-nowrap">{dataHora(r.criadoEm)}</td>
                    <td>{r.admin}</td>
                    <td>
                      {ACOES[r.acao] || r.acao}
                      {r.alvoTipo === 'cliente' && r.alvoId && r.acao !== 'cliente_excluir' && <> · <a href={`#cliente/${r.alvoId}`}>cliente #{r.alvoId}</a></>}
                      {r.acao === 'cliente_excluir' && <> · cliente #{r.alvoId}</>}
                    </td>
                    <td className="adm-suave">{descreverDetalhes(r.acao, r.detalhes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao total={res.total} pagina={res.pagina} porPagina={res.porPagina} aoMudar={setPagina} />
        </>
      )}
    </>
  );
}
