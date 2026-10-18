'use client';

import { useEffect, useState } from 'react';
import { Paginacao, data, documento } from './comum';

const FILTROS = {
  status: [['', 'Todos'], ['ativo', 'Ativos'], ['inativo', 'Inativos']],
  pagamento: [['', 'Todos'], ['em_dia', 'Em dia'], ['em_atraso', 'Em atraso']],
  tipo: [['', 'Todos'], ['cpf', 'Pessoa física'], ['cnpj', 'Empresa']],
};

// Lista de clientes: busca, filtros, páginas e exportação para planilha.
export default function Clientes({ api }) {
  const [filtros, setFiltros] = useState({ busca: '', status: '', pagamento: '', tipo: '' });
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState('');

  // espera o admin parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.busca === busca ? f : { ...f, busca })), 350);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => setPagina(1), [filtros]);

  const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
  useEffect(() => {
    let ativo = true;
    api('GET', `clientes?${consulta}&pagina=${pagina}`).then((r) => {
      if (!ativo) return;
      if (r.ok) { setRes(r.dados); setErro(''); } else setErro(r.erro);
    });
    return () => { ativo = false; };
  }, [api, consulta, pagina]);

  return (
    <>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">Clientes</h1>
        <div className="adm-acoes">
          <a className="adm-botao adm-botao--fantasma" href={`/api/admin/clientes-csv?${consulta}`} download>Exportar planilha (CSV)</a>
          <a className="adm-botao" href="#novo-cliente">Novo cliente</a>
        </div>
      </div>

      <div className="adm-filtros">
        <label className="adm-campo adm-campo--busca">
          <span>Buscar</span>
          <input type="search" placeholder="Nome, e-mail, CPF/CNPJ, telefone ou razão social" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        {Object.entries(FILTROS).map(([nome, opcoes]) => (
          <label key={nome} className="adm-campo">
            <span>{{ status: 'Situação', pagamento: 'Pagamento', tipo: 'Tipo' }[nome]}</span>
            <select value={filtros[nome]} onChange={(e) => setFiltros((f) => ({ ...f, [nome]: e.target.value }))}>
              {opcoes.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
        ))}
      </div>

      {erro && <p className="adm-aviso adm-aviso--erro">{erro}</p>}
      {!res ? <p className="adm-carregando">Carregando…</p> : (
        <>
          <p className="adm-suave" aria-live="polite">{res.total} cliente(s)</p>
          {res.clientes.length === 0 ? <p className="adm-vazio">Nenhum cliente encontrado.</p> : (
            <div className="adm-tabela" role="region" aria-label="Clientes" tabIndex={0}>
              <table>
                <thead>
                  <tr><th>Nome</th><th>CPF/CNPJ</th><th>E-mail</th><th>Situação</th><th>Pagamento</th><th>Cadastro</th></tr>
                </thead>
                <tbody>
                  {res.clientes.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <a href={`#cliente/${c.id}`}>{c.nome} {c.sobrenome}</a>
                        {c.razaoSocial && <span className="adm-suave adm-bloco-texto">{c.razaoSocial}</span>}
                      </td>
                      <td className="adm-nowrap">{documento(c)}</td>
                      <td>{c.email}</td>
                      <td><span className={`adm-etiqueta ${c.status === 'inativo' ? 'adm-etiqueta--cinza' : 'adm-etiqueta--ok'}`}>{c.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                      <td><span className={`adm-etiqueta ${c.pagamento === 'em_atraso' ? 'adm-etiqueta--alerta' : ''}`}>{c.pagamento === 'em_atraso' ? 'Em atraso' : 'Em dia'}</span></td>
                      <td className="adm-nowrap">{data(c.criadoEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao total={res.total} pagina={res.pagina} porPagina={res.porPagina} aoMudar={setPagina} />
        </>
      )}
    </>
  );
}
