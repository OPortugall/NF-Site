'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminEnviarArquivo } from '@/lib/api';
import { ACOES, CATEGORIAS, dataHora, descreverDetalhes } from './comum';
import { EstoqueRapido, miniatura, situacaoEstoque } from './Produtos';

const VAZIO = {
  slug: '', marca: '', modelo: '', nome: '', categoria: 'multifuncionais', impressao: 'colorida', condicao: 'seminovo',
  resumo: '', descricao: '', disponivelVenda: true, disponivelLocacao: true, estoque: '1', estoqueMinimo: '0', preco: '',
  status: 'ativo', destaque: false, ordem: '0',
};
const COM_IMPRESSAO = ['multifuncionais', 'impressoras'];

// "Ricoh IM C3000" → "ricoh-im-c3000"
const gerarSlug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
// centavos ↔ "1.500,00"
const paraReais = (c) => (c == null ? '' : (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
function paraCentavos(texto) {
  const t = texto.trim().replace(/[R$\s]/g, '');
  if (!t) return null;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

function paraFormulario(p) {
  return {
    slug: p.slug, marca: p.marca, modelo: p.modelo, nome: p.nome, categoria: p.categoria, impressao: p.impressao || 'colorida',
    condicao: p.condicao, resumo: p.resumo, descricao: p.descricao, disponivelVenda: p.disponivelVenda, disponivelLocacao: p.disponivelLocacao,
    estoque: String(p.estoque), estoqueMinimo: String(p.estoqueMinimo), preco: paraReais(p.precoReferencia), status: p.status,
    destaque: p.destaque, ordem: String(p.ordem),
  };
}

function Campo({ rotulo, erro, children, largo, ajuda }) {
  return (
    <label className={`adm-campo ${largo ? 'adm-campo--largo' : ''} ${erro ? 'adm-campo--erro' : ''}`}>
      <span>{rotulo}</span>
      {children}
      {ajuda && <span className="adm-campo__ajuda">{ajuda}</span>}
      {erro && <span className="adm-campo__erro">{erro}</span>}
    </label>
  );
}

// Ficha do produto (ou cadastro de um produto novo, com `novo`).
export default function FichaProduto({ id, novo, api, ir }) {
  const [produto, setProduto] = useState(null);
  const [f, setF] = useState(VAZIO);
  const [slugManual, setSlugManual] = useState(false);
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const copia = /-copia(-\d+)?$/.test(produto?.slug || ''); // enquanto tiver o endereço provisório da duplicação

  const carregar = useCallback(async () => {
    const r = await api('GET', `produto?id=${id}`);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    setProduto(r.dados.produto);
    setF(paraFormulario(r.dados.produto));
  }, [api, id]);
  useEffect(() => { if (!novo) carregar(); }, [novo, carregar]);

  const muda = (campo) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((a) => {
      const n = { ...a, [campo]: v };
      // No cadastro e na cópia, o endereço acompanha marca + modelo (ou o nome) até o admin mexer nele
      if ((novo || copia) && !slugManual && ['marca', 'modelo', 'nome'].includes(campo)) n.slug = gerarSlug(n.modelo ? `${n.marca} ${n.modelo}` : n.nome);
      if (campo === 'categoria' && v === 'suprimentos') n.disponivelLocacao = false;
      return n;
    });
  };

  const salvar = async (e) => {
    e.preventDefault();
    const preco = paraCentavos(f.preco);
    const inteiro = (v) => (/^-?\d+$/.test(String(v).trim()) ? Number(v) : NaN);
    const dados = {
      ...f, impressao: COM_IMPRESSAO.includes(f.categoria) ? f.impressao : null,
      estoque: inteiro(f.estoque), estoqueMinimo: inteiro(f.estoqueMinimo), ordem: inteiro(f.ordem), precoReferencia: preco,
    };
    delete dados.preco;
    const locais = {};
    if (Number.isNaN(preco)) locais.precoReferencia = 'Digite o valor em reais, como 1.500,00.';
    for (const c of ['estoque', 'estoqueMinimo', 'ordem']) if (Number.isNaN(dados[c])) locais[c] = 'Digite um número inteiro.';
    if (Object.keys(locais).length) {
      setErros(locais);
      return setMsg({ tipo: 'erro', texto: 'Confira os campos destacados.' });
    }
    setOcupado(true);
    setMsg(null);
    const r = novo ? await api('POST', 'produto-criar', dados) : await api('POST', 'produto-editar', { ...dados, id });
    setOcupado(false);
    if (!r.ok) {
      setErros(r.campos || {});
      return setMsg({ tipo: 'erro', texto: r.erro });
    }
    setErros({});
    if (novo) return ir(`produto/${r.dados.id}`);
    setMsg({ tipo: 'ok', texto: r.dados.alterados.length ? 'Alterações salvas. Publique o site para elas aparecerem.' : 'Nada foi alterado.' });
    if (r.dados.alterados.length) carregar(); // sem mudança, não recarrega (não apaga o que o admin começar a digitar)
  };

  const duplicar = async () => {
    setOcupado(true);
    const r = await api('POST', 'produto-duplicar', { id });
    setOcupado(false);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    ir(`produto/${r.dados.id}`);
  };

  const excluir = async () => {
    setOcupado(true);
    const r = await api('POST', 'produto-excluir', { id, confirmacao });
    setOcupado(false);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    ir('produtos');
  };

  if (!novo && !produto) return msg ? <p className="adm-aviso adm-aviso--erro">{msg.texto}</p> : <p className="adm-carregando">Carregando…</p>;
  const situacao = produto && situacaoEstoque(produto);

  return (
    <>
      <p><a href="#produtos" className="adm-voltar">← Produtos</a></p>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">{novo ? 'Novo produto' : produto.titulo}</h1>
        {!novo && (
          <div className="adm-acoes">
            <span className={`adm-etiqueta ${produto.status === 'ativo' ? 'adm-etiqueta--ok' : 'adm-etiqueta--cinza'}`}>{produto.status === 'ativo' ? 'Visível no site' : 'Oculto'}</span>
            {situacao && <span className={`adm-etiqueta ${situacao[1]}`}>{situacao[0]}</span>}
            {produto.status === 'ativo' && <a className="adm-link" href={`/loja/inicio/${produto.slug}.html`} target="_blank" rel="noopener">Ver no site</a>}
            <button type="button" className="adm-botao adm-botao--fantasma adm-botao--compacto" disabled={ocupado} onClick={duplicar} title="Copia o produto como está salvo">Duplicar</button>
          </div>
        )}
      </div>
      {copia && produto.status === 'oculto' && (
        <p className="adm-aviso adm-aviso--ok">Esta é uma cópia e está oculta no site. Altere o que for diferente, marque “Visível” e salve.</p>
      )}
      {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}

      <div className="adm-ficha adm-ficha--produto">
        <form className="adm-bloco adm-form-grade" onSubmit={salvar} noValidate>
          <h2 className="adm-campo--largo">Identificação</h2>
          <Campo rotulo="Marca" erro={erros.marca}><input value={f.marca} onChange={muda('marca')} maxLength={60} /></Campo>
          <Campo rotulo="Modelo (vazio em toner e afins)" erro={erros.modelo}><input value={f.modelo} onChange={muda('modelo')} maxLength={100} /></Campo>
          <Campo rotulo="Nome completo" erro={erros.nome} largo ajuda="Aparece no carrinho e nos pedidos. O título da página usa marca + modelo (ou este nome, se não houver modelo).">
            <input value={f.nome} onChange={muda('nome')} maxLength={160} />
          </Campo>
          <Campo rotulo="Endereço da página" erro={erros.slug} largo ajuda={`nfsolucoesdigitais.com.br/loja/inicio/${f.slug || '…'}.html${!novo && !copia ? ' — mudar o endereço quebra links já compartilhados' : ''}`}>
            <input value={f.slug} onChange={(e) => { setSlugManual(true); setF((a) => ({ ...a, slug: e.target.value.toLowerCase() })); }} maxLength={120} />
          </Campo>

          <h2 className="adm-campo--largo">Tipo</h2>
          <Campo rotulo="Categoria" erro={erros.categoria}>
            <select value={f.categoria} onChange={muda('categoria')}>
              {Object.entries(CATEGORIAS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </Campo>
          <fieldset className="adm-radios">
            <legend>Condição</legend>
            {[['novo', 'Novo'], ['seminovo', 'Seminovo']].map(([v, r]) => (
              <label key={v}><input type="radio" name="condicao" checked={f.condicao === v} onChange={() => setF((a) => ({ ...a, condicao: v }))} /> {r}</label>
            ))}
          </fieldset>
          {COM_IMPRESSAO.includes(f.categoria) && (
            <fieldset className="adm-radios adm-campo--largo">
              <legend>Impressão</legend>
              {[['colorida', 'Colorida'], ['monocromatica', 'Preto e branco']].map(([v, r]) => (
                <label key={v}><input type="radio" name="impressao" checked={f.impressao === v} onChange={() => setF((a) => ({ ...a, impressao: v }))} /> {r}</label>
              ))}
              {erros.impressao && <span className="adm-campo__erro">{erros.impressao}</span>}
            </fieldset>
          )}
          {f.categoria === 'scooter' && (
            <fieldset className="adm-radios adm-campo--largo">
              <legend>Impressão</legend>
              <label><input type="radio" name="impressao" checked readOnly /> Scooter</label>
            </fieldset>
          )}
          <fieldset className="adm-radios adm-campo--largo">
            <legend>Disponível para</legend>
            <label><input type="checkbox" checked={f.disponivelVenda} onChange={muda('disponivelVenda')} /> Venda</label>
            <label><input type="checkbox" checked={f.disponivelLocacao} disabled={f.categoria === 'suprimentos'} onChange={muda('disponivelLocacao')} /> Locação (empresas)</label>
            {(erros.disponivelVenda || erros.disponivelLocacao) && <span className="adm-campo__erro">{erros.disponivelVenda || erros.disponivelLocacao}</span>}
          </fieldset>

          <h2 className="adm-campo--largo">Textos</h2>
          <Campo rotulo="Resumo (aparece no cartão da loja)" erro={erros.resumo} largo>
            <textarea rows={2} maxLength={300} value={f.resumo} onChange={muda('resumo')} />
          </Campo>
          <Campo rotulo="Descrição e especificações" erro={erros.descricao} largo>
            <textarea rows={14} className="adm-descricao" value={f.descricao} onChange={muda('descricao')} spellCheck />
          </Campo>
          <div className="adm-campo--largo adm-ajuda-descricao">
            <strong>Como formatar:</strong> deixe uma linha em branco entre os blocos.
            <code>## Título da seção</code> · <code>- item de lista</code> · <code>| Velocidade | 30 ppm</code> (linha da tabela de especificações) · qualquer outro texto vira parágrafo.
          </div>

          <h2 className="adm-campo--largo">Estoque e site</h2>
          <Campo rotulo="Estoque (unidades)" erro={erros.estoque} ajuda="0 = aparece como indisponível no site">
            <input type="number" min="0" inputMode="numeric" value={f.estoque} onChange={muda('estoque')} />
          </Campo>
          <Campo rotulo="Avisar quando chegar a" erro={erros.estoqueMinimo} ajuda="0 = sem aviso de estoque baixo">
            <input type="number" min="0" inputMode="numeric" value={f.estoqueMinimo} onChange={muda('estoqueMinimo')} />
          </Campo>
          <Campo rotulo="Preço de referência (interno, R$)" erro={erros.precoReferencia} ajuda="Nunca aparece no site">
            <input inputMode="decimal" value={f.preco} onChange={muda('preco')} placeholder="0,00" />
          </Campo>
          <Campo rotulo="Ordem na loja" erro={erros.ordem} ajuda="Números menores aparecem primeiro">
            <input type="number" inputMode="numeric" value={f.ordem} onChange={muda('ordem')} />
          </Campo>
          <fieldset className="adm-radios adm-campo--largo">
            <legend>No site</legend>
            <label><input type="radio" name="status" checked={f.status === 'ativo'} onChange={() => setF((a) => ({ ...a, status: 'ativo' }))} /> Visível</label>
            <label><input type="radio" name="status" checked={f.status === 'oculto'} onChange={() => setF((a) => ({ ...a, status: 'oculto' }))} /> Oculto</label>
            <label><input type="checkbox" checked={f.destaque} onChange={muda('destaque')} /> Destaque na página inicial (“Equipamentos em estoque”)</label>
          </fieldset>
          <div className="adm-campo--largo">
            <button className="adm-botao" disabled={ocupado}>{ocupado ? 'Salvando…' : novo ? 'Cadastrar produto' : 'Salvar alterações'}</button>
            {novo && <p className="adm-dica adm-dica--depois">Depois de cadastrar, envie as fotos.</p>}
          </div>
        </form>

        {!novo && (
          <aside className="adm-lateral adm-lateral--produto">
            <Fotos produto={produto} api={api} aoMudar={carregar} />

            <section className="adm-bloco">
              <h2>Estoque</h2>
              <p className="adm-dica">Muda na hora no site, sem publicar.</p>
              <EstoqueRapido produto={produto} api={api} aoMudar={carregar} />
            </section>

            <section className="adm-bloco">
              <h2>Histórico</h2>
              {produto.historico.length === 0 ? <p className="adm-vazio">Nenhuma alteração pelo painel.</p> : (
                <ul className="adm-lista adm-lista--compacta">
                  {produto.historico.map((h, i) => (
                    <li key={i}>
                      <strong>{ACOES[h.acao] || h.acao}</strong>
                      <span className="adm-suave">{h.admin}, em {dataHora(h.em)}</span>
                      {descreverDetalhes(h.acao, h.detalhes) && <span className="adm-suave adm-bloco-texto">{descreverDetalhes(h.acao, h.detalhes)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="adm-bloco adm-bloco--perigo">
              <h2>Excluir produto</h2>
              <p className="adm-dica">Apaga o produto e as fotos enviadas pelo painel. Pedidos antigos continuam com o nome. Para tirar do site sem apagar, marque “Oculto”.</p>
              <label className="adm-campo">
                <span>Para confirmar, digite o endereço do produto</span>
                <input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder={produto.slug} />
              </label>
              <button type="button" className="adm-botao adm-botao--perigo" disabled={ocupado || confirmacao.trim() !== produto.slug} onClick={excluir}>
                Excluir definitivamente
              </button>
            </section>
          </aside>
        )}
      </div>
    </>
  );
}

// Fotos: enviar (JPG, PNG ou WebP até 8 MB), mudar a ordem e apagar. A primeira é a do cartão da loja.
function Fotos({ produto, api, aoMudar }) {
  const [enviando, setEnviando] = useState(false);
  const [alt, setAlt] = useState('');
  const [msg, setMsg] = useState(null);
  const [apagar, setApagar] = useState(null);
  const arquivo = useRef(null);
  const fotos = produto.fotos;

  const enviar = async (e) => {
    e.preventDefault();
    const lista = [...(arquivo.current?.files || [])];
    if (!lista.length) return setMsg({ tipo: 'erro', texto: 'Escolha uma ou mais fotos.' });
    setEnviando(true);
    setMsg(null);
    let enviadas = 0;
    for (const foto of lista) {
      const r = await adminEnviarArquivo('produto-foto', { produtoId: String(produto.id), alt, foto });
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: `${foto.name}: ${r.erro}` });
        break;
      }
      enviadas++;
    }
    setEnviando(false);
    if (enviadas) {
      if (enviadas === lista.length) setMsg({ tipo: 'ok', texto: enviadas === 1 ? 'Foto enviada.' : `${enviadas} fotos enviadas.` });
      setAlt('');
      if (arquivo.current) arquivo.current.value = '';
      aoMudar();
    }
  };

  const mover = async (i, d) => {
    const ids = fotos.map((x) => x.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    const r = await api('POST', 'produto-fotos-ordem', { produtoId: produto.id, ids });
    if (!r.ok) setMsg({ tipo: 'erro', texto: r.erro });
    aoMudar();
  };

  const excluir = async (fotoId) => {
    setApagar(null);
    const r = await api('POST', 'produto-foto-excluir', { id: fotoId });
    if (!r.ok) setMsg({ tipo: 'erro', texto: r.erro });
    aoMudar();
  };

  return (
    <section className="adm-bloco">
      <h2>Fotos</h2>
      {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}
      {fotos.length === 0 ? <p className="adm-vazio">Nenhuma foto. O site mostra o selo da NF no lugar.</p> : (
        <ol className="adm-fotos">
          {fotos.map((x, i) => (
            <li key={x.id}>
              <img src={miniatura(x.url)} alt={x.alt || ''} width={96} height={72} />
              <span className="adm-fotos__info">
                {i === 0 ? <strong>Foto principal</strong> : `Foto ${i + 1}`}
                {x.alt && <span className="adm-suave adm-bloco-texto">{x.alt}</span>}
              </span>
              <span className="adm-fotos__acoes">
                <button type="button" className="adm-botao adm-botao--fantasma adm-botao--compacto" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir a foto ${i + 1}`}>↑</button>
                <button type="button" className="adm-botao adm-botao--fantasma adm-botao--compacto" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)} aria-label={`Descer a foto ${i + 1}`}>↓</button>
                {apagar === x.id ? (
                  <>
                    <button type="button" className="adm-botao adm-botao--perigo adm-botao--compacto" onClick={() => excluir(x.id)}>Apagar</button>
                    <button type="button" className="adm-link" onClick={() => setApagar(null)}>Não</button>
                  </>
                ) : (
                  <button type="button" className="adm-link" onClick={() => setApagar(x.id)}>Apagar</button>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
      <form className="adm-form adm-fotos__enviar" onSubmit={enviar}>
        <label className="adm-campo">
          <span>Enviar fotos (JPG, PNG ou WebP, até 8 MB)</span>
          <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" multiple />
        </label>
        <label className="adm-campo">
          <span>Descrição da foto (opcional)</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} placeholder="Ex.: vista frontal com o alimentador aberto" />
        </label>
        <button className="adm-botao" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar'}</button>
      </form>
      <p className="adm-dica">As fotos aparecem no site depois de publicar as alterações.</p>
    </section>
  );
}
