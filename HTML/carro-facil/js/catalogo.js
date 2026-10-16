// Catálogo do cliente: busca, filtros, match com preferências, detalhe do veículo, favoritos
(() => {
  const { esc, brl, num, s: S } = CF;
  const F = CF.F = { ordem: 'recentes' }; // filtros ativos da busca (só em memória)

  const NUM = ['anoMin', 'anoMax', 'precoMin', 'precoMax', 'kmMax'];
  const ROTULOS = {
    uf: v => v, cidade: v => v, marca: v => v, modelo: v => `Modelo: ${v}`, cambio: v => v, combustivel: v => v, tipo: v => v,
    anoMin: v => `Ano ≥ ${v}`, anoMax: v => `Ano ≤ ${v}`, precoMin: v => `Desde ${CF.brl(v)}`, precoMax: v => `Até ${CF.brl(v)}`,
    kmMax: v => `Até ${CF.num(v)} km`, garagem: v => (S.garagens[v]?.nome ?? 'Garagem'), q: v => `“${v}”`
  };
  const ORDENS = { recentes: 'Mais recentes', preco: 'Menor preço', precoDesc: 'Maior preço', km: 'Menor km', ano: 'Mais novos' };
  const RAPIDOS = [
    { t: 'Até R$ 40 mil', f: { precoMax: 40000 } }, { t: 'Automático', f: { cambio: 'Automático' } },
    { t: 'SUV', f: { tipo: 'SUV' } }, { t: 'Baixa km', f: { kmMax: 40000 } }, { t: '2020 ou mais novo', f: { anoMin: 2020 } }
  ];
  // silhuetas por tipo (traço, mesma linguagem dos ícones)
  const sil = d => `<svg class="sil" viewBox="0 0 64 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="16" cy="22" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="48" cy="22" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  const SILHUETA = {
    Hatch: sil('M4 22V15l6-1 8-7h20l10 7 10 2v6h-6M22 22h20M10 22H4'), Sedan: sil('M3 22v-6l9-2 9-7h18l9 7 13 2v6h-7M22 22h20M10 22H3'),
    SUV: sil('M4 22V11l4-5h28l10 7 13 2v7h-7M22 22h20M10 22H4'), Picape: sil('M3 22v-9h24V6h14l8 7h12v9h-7M22 22h20M10 22H3'),
    'Utilitário': sil('M4 22V5h38l8 9 10 2v6h-6M22 22h20M10 22H4'), Outro: sil('M4 22V15l6-1 8-7h20l10 7 10 2v6h-6M22 22h20M10 22H4')
  };

  const txt = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const limpa = f => Object.fromEntries(Object.entries(f).filter(([k, v]) => k !== 'ordem' && v !== '' && v != null && !(typeof v === 'number' && isNaN(v))));

  const passa = (v, f) =>
    (!f.q || f.q.split(/\s+/).every(w => txt(`${v.marca} ${v.modelo} ${v.ano}`).includes(txt(w)))) &&
    (!f.uf || v.uf === f.uf) && (!f.cidade || txt(v.cidade) === txt(f.cidade)) &&
    (!f.marca || txt(v.marca) === txt(f.marca)) && (!f.modelo || txt(v.modelo).includes(txt(f.modelo))) &&
    (f.anoMin == null || v.ano >= f.anoMin) && (f.anoMax == null || v.ano <= f.anoMax) &&
    (f.precoMin == null || v.preco >= f.precoMin) && (f.precoMax == null || v.preco <= f.precoMax) &&
    (f.kmMax == null || v.km <= f.kmMax) && (!f.cambio || v.cambio === f.cambio) &&
    (!f.combustivel || v.combustivel === f.combustivel) && (!f.tipo || v.tipo === f.tipo) &&
    (!f.garagem || v.garagem_id === f.garagem);

  const ordena = (l, o) => [...l].sort({
    recentes: (a, b) => new Date(b.criado_em) - new Date(a.criado_em), preco: (a, b) => a.preco - b.preco,
    precoDesc: (a, b) => b.preco - a.preco, km: (a, b) => a.km - b.km, ano: (a, b) => b.ano - a.ano || a.km - b.km
  }[o] || (() => 0));

  // match: % dos critérios da busca salva que o veículo atende (preço até 10% acima conta pela metade)
  const pontua = (v, b) => {
    const c = limpa(b); delete c.q; const ks = Object.keys(c); if (!ks.length) return null;
    let ok = 0;
    for (const k of ks) {
      if (passa(v, { [k]: c[k] })) ok++;
      else if (k === 'precoMax' && v.preco <= c[k] * 1.1) ok += 0.5;
    }
    return Math.round(ok / ks.length * 100);
  };
  CF.pontua = pontua;
  CF.descreveBusca = b => Object.entries(b || {}).map(([k, v]) => ROTULOS[k]?.(v)).filter(Boolean);

  const foto = v => CF.fotoHtml(v);

  const verif = g => g?.demo === false ? `<span class="verif" title="Loja com CNPJ verificado">${CF.ico('check', 'peq')}Verificada</span>` : '';
  const card = (v, pct) => {
    const g = S.garagens[v.garagem_id]; const fav = S.favs.includes(v.id);
    const novo = Date.now() - new Date(v.criado_em) < 5 * 864e5;
    return `<article class="card-carro">
      <a class="foto" href="#/carro/${v.id}" aria-label="${esc(`${v.marca} ${v.modelo} ${v.ano}, ${brl(v.preco)}`)}">${foto(v)}
        <span class="etiqueta">${brl(v.preco)}</span>
        ${pct != null ? `<span class="match ${pct >= 90 ? 'alto' : ''}">${pct}% do que você quer</span>` : novo ? '<span class="selo">Chegou agora</span>' : ''}</a>
      <button class="fav ${fav ? 'on' : ''}" data-acao="fav" data-id="${v.id}" aria-label="Favoritar ${esc(v.modelo)}" aria-pressed="${fav}">${CF.ico('heart')}</button>
      <div class="info">
        <h3><a href="#/carro/${v.id}"><span>${esc(v.marca)}</span> ${esc(v.modelo)}</a></h3>
        <p class="ficha"><span>${v.ano}</span><span>${num(v.km)} km</span><span>${esc(v.cambio)}</span></p>
        <p class="loja-linha">${CF.ico('pin', 'peq')}<span>${esc(v.cidade)}/${esc(v.uf)}${g ? ` · ${esc(g.nome)}` : ''}</span>${verif(g)}${CF.seloConf(v)}</p>
      </div></article>`;
  };
  CF.cardCarro = card;

  const esqueleto = n => Array.from({ length: n }, () => '<div class="card veic sk"><div class="foto"></div><div class="corpo"><p class="preco">&nbsp;</p><p class="meta">&nbsp;</p></div></div>').join('');
  const erroCarga = () => `<div class="vazio"><p>Não foi possível carregar os carros agora.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></div>`;
  CF.acoes.recarrega = async () => { S.veiculos = null; CF.render(); };
  CF.acoes.rolaLista = () => document.getElementById('estoque')?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  // ---------- formulário de filtros (usado na folha de filtros e nas preferências) ----------
  const opts = (lista, sel, vazio) => `<option value="">${vazio}</option>` + lista.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const formFiltros = f => {
    const V = S.veiculos ?? [];
    const ufs = [...new Set(V.map(v => v.uf))].sort();
    const cidades = [...new Set(V.filter(v => !f.uf || v.uf === f.uf).map(v => v.cidade))].sort();
    const marcas = [...new Set(V.map(v => v.marca))].sort();
    const gs = Object.values(S.garagens).sort((a, b) => a.nome.localeCompare(b.nome));
    const seg = (nome, lista) => `<div class="seg" role="radiogroup">${['', ...lista].map(x =>
      `<label><input type="radio" name="${nome}" value="${esc(x)}" ${(f[nome] ?? '') === x ? 'checked' : ''}><span>${x || 'Qualquer'}</span></label>`).join('')}</div>`;
    const n = (nome, ph) => `<input type="number" inputmode="numeric" name="${nome}" placeholder="${ph}" value="${f[nome] ?? ''}" min="0">`;
    return `
      <fieldset><legend>Região</legend>
        <div class="dupla"><select name="uf" aria-label="Estado">${opts(ufs, f.uf, 'Estado')}</select>
        <select name="cidade" aria-label="Cidade">${opts(cidades, f.cidade, 'Cidade')}</select></div></fieldset>
      <fieldset><legend>Veículo</legend>
        <div class="dupla"><select name="marca" aria-label="Marca">${opts(marcas, f.marca, 'Marca')}</select>
        <input type="text" name="modelo" placeholder="Modelo (ex.: Onix)" value="${esc(f.modelo ?? '')}" autocomplete="off"></div>
        <select name="tipo" aria-label="Tipo">${opts(TIPOS, f.tipo, 'Qualquer tipo')}</select></fieldset>
      <fieldset><legend>Ano</legend><div class="dupla">${n('anoMin', 'De')}${n('anoMax', 'Até')}</div></fieldset>
      <fieldset><legend>Valor (R$)</legend><div class="dupla">${n('precoMin', 'Mínimo')}${n('precoMax', 'Máximo')}</div></fieldset>
      <fieldset><legend>Quilometragem máxima</legend>
        <select name="kmMax" aria-label="Km máximo"><option value="">Qualquer</option>${[20000, 40000, 60000, 80000, 100000].map(k => `<option value="${k}" ${f.kmMax === k ? 'selected' : ''}>Até ${num(k)} km</option>`).join('')}</select></fieldset>
      <fieldset><legend>Câmbio</legend>${seg('cambio', ['Manual', 'Automático'])}</fieldset>
      <fieldset><legend>Combustível</legend><select name="combustivel" aria-label="Combustível">${opts(COMBUSTIVEIS, f.combustivel, 'Qualquer')}</select></fieldset>
      <fieldset><legend>Garagista</legend><select name="garagem" aria-label="Garagista"><option value="">Todos</option>${gs.map(g => `<option value="${g.id}" ${f.garagem === g.id ? 'selected' : ''}>${esc(g.nome)} · ${esc(g.cidade)}/${esc(g.uf)}</option>`).join('')}</select></fieldset>`;
  };

  const lerForm = form => {
    const o = {};
    for (const [k, v] of new FormData(form)) {
      const t = String(v).trim(); if (!t) continue;
      o[k] = NUM.includes(k) ? Number(t) : t;
    }
    return limpa(o);
  };
  // ao trocar o estado, a lista de cidades acompanha
  const ligaRegiao = form => {
    form.elements.uf?.addEventListener('change', () => {
      const uf = form.elements.uf.value;
      const cs = [...new Set((S.veiculos ?? []).filter(v => !uf || v.uf === uf).map(v => v.cidade))].sort();
      form.elements.cidade.innerHTML = opts(cs, '', 'Cidade');
    });
  };

  // ---------- folha de filtros ----------
  CF.acoes.abreFiltros = () => {
    const d = document.getElementById('folha');
    d.innerHTML = `<form id="ff" method="dialog">
      <header><h2>Filtros</h2><button class="btn-ico" type="button" data-acao="fechaFolha" aria-label="Fechar">✕</button></header>
      <div class="rolagem">${formFiltros(F)}</div>
      <p class="erro-geral" id="ff-erro" role="alert" hidden></p>
      <footer><button class="btn-link" type="button" data-acao="limpaFiltros">Limpar</button>
        <button class="btn grande" type="button" data-acao="aplicaFiltros" id="ff-ver">Ver resultados</button></footer></form>`;
    const form = d.querySelector('form'); ligaRegiao(form);
    const conta = () => { const n = S.veiculos.filter(v => passa(v, { ...lerForm(form), q: F.q })).length; document.getElementById('ff-ver').textContent = `Ver ${n} carro${n === 1 ? '' : 's'}`; };
    form.addEventListener('input', conta); form.addEventListener('change', conta); conta();
    d.showModal();
  };
  CF.acoes.fechaFolha = () => document.getElementById('folha').close();
  CF.acoes.aplicaFiltros = () => {
    const novo = lerForm(document.getElementById('ff'));
    const problema = CF.val.filtros(novo), box = document.getElementById('ff-erro');
    if (problema) { box.textContent = problema; box.hidden = false; box.scrollIntoView?.({ block: 'nearest' }); return; }
    box.hidden = true;
    for (const k of Object.keys(F)) if (k !== 'ordem' && k !== 'q') delete F[k];
    Object.assign(F, novo); document.getElementById('folha').close(); CF.render();
  };
  CF.acoes.limpaFiltros = () => { for (const k of Object.keys(F)) if (k !== 'ordem') delete F[k]; document.getElementById('folha').close(); CF.render(); };
  CF.acoes.removeFiltro = el => { delete F[el.dataset.k]; CF.render(); };
  CF.acoes.rapido = el => {
    const r = RAPIDOS[+el.dataset.i]; const [k] = Object.keys(r.f);
    if (F[k] === r.f[k]) delete F[k]; else Object.assign(F, r.f);
    CF.render();
  };
  CF.acoes.tipoCat = el => { if (F.tipo === el.dataset.t) delete F.tipo; else F.tipo = el.dataset.t; CF.render(); };
  CF.acoes.salvaBuscaAtual = async () => {
    if (!S.user) { CF.toast('Entre para salvar sua busca.'); location.hash = '#/entrar'; return; }
    const { q, ...resto } = limpa(F); S.busca = resto; await CF.salvaPrefs();
    CF.toast('Busca salva! Veja os carros que combinam em "Para você".'); CF.render();
  };

  // ---------- favoritos ----------
  CF.acoes.fav = el => {
    const id = +el.dataset.id;
    S.favs = S.favs.includes(id) ? S.favs.filter(x => x !== id) : [...S.favs, id];
    CF.salvaPrefs();
    document.querySelectorAll(`[data-acao="fav"][data-id="${id}"]`).forEach(b => {
      const on = S.favs.includes(id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      const t = b.querySelector('span'); if (t) t.textContent = on ? 'Nos favoritos' : 'Guardar nos favoritos';
    });
    if (location.hash === '#/favoritos') CF.render();
  };

  // ---------- telas ----------
  CF.rotas.carros = async () => {
    try { await CF.carregaCatalogo(); } catch { return { html: `<section class="pagina">${erroCarga()}</section>` }; }
    const bc = S.busca && Object.keys(S.busca).length;
    const ativos = Object.entries(limpa(F));
    const V = S.veiculos, mostraHero = !ativos.length && CF.papel() !== 'garagista';
    const cont = {}; V.forEach(v => { cont[v.tipo] = (cont[v.tipo] || 0) + 1; });
    const cidades = new Set(V.map(v => v.cidade)).size, lojas = new Set(V.map(v => v.garagem_id)).size;
    const capa = [...V].filter(v => v.fotos?.length).sort((x, y) => new Date(y.criado_em) - new Date(x.criado_em))[0];
    const faixas = [30000, 50000, 70000, 100000, 150000];
    const ufsV = [...new Set(V.map(v => v.uf))].sort();
    const hero = mostraHero ? `
      <section class="abertura"><div class="abertura-in">
        <div class="abertura-txt">
          <p class="eyebrow">${V.length} carros · ${lojas} lojas · ${cidades} cidades</p>
          <h1>Diga o carro que você quer. <em>As lojas vêm até você.</em></h1>
          <form class="frase" id="frase" aria-label="Montar busca">
            <span>Quero um</span><select name="tipo" aria-label="Tipo de carro"><option value="">carro</option>${TIPOS.filter(t => cont[t]).map(t => `<option>${t}</option>`).join('')}</select>
            <span>até</span><select name="precoMax" aria-label="Valor máximo"><option value="">qualquer valor</option>${faixas.map(x => `<option value="${x}">${brl(x)}</option>`).join('')}</select>
            <span>em</span><select name="uf" aria-label="Estado"><option value="">todo o Brasil</option>${ufsV.map(u => `<option>${u}</option>`).join('')}</select>
            <button class="btn" type="submit" id="frase-ok">Ver carros</button></form>
          <p class="abertura-nota">${S.user ? '<a href="#/preferencias">Salve o que procura</a> e avisamos quando chegar um carro assim.' : '<a href="#/entrar">Crie sua conta</a> para salvar o que procura e ser avisado quando chegar um carro assim.'}</p>
        </div>
        ${capa ? `<a class="abertura-foto" href="#/carro/${capa.id}">${foto(capa)}<span class="etiqueta">${brl(capa.preco)}</span><span class="legenda">${esc(capa.marca)} ${esc(capa.modelo)} ${capa.ano}</span></a>` : ''}
      </div>
      <ul class="confianca">
        <li>${CF.ico('store')}<span><strong>Só lojas aprovadas</strong>CNPJ conferido antes de anunciar</span></li>
        <li>${CF.ico('check')}<span><strong>Dados conferidos</strong>Marca, modelo e ano batem com a placa</span></li>
        <li>${CF.ico('lock')}<span><strong>Você decide</strong>Lojas só falam com você se você pedir</span></li>
      </ul></section>` : '';
    // destaques: com preferências salvas, os que mais combinam; senão, os mais recentes
    const bcv = S.busca && Object.keys(S.busca).length;
    const dest = mostraHero ? [...V].sort((a, b) => bcv ? (pontua(b, S.busca) - pontua(a, S.busca)) || (new Date(b.criado_em) - new Date(a.criado_em)) : new Date(b.criado_em) - new Date(a.criado_em)).slice(0, 6) : [];
    const destaques = dest.length ? `<section class="destaques" aria-label="Em destaque"><div class="titulo-secao"><h2>${bcv ? 'Combinam com você' : 'Chegaram agora'}</h2>${bcv ? '<a href="#/voce">Ver todos</a>' : '<button class="btn-link" data-acao="rolaLista">Ver estoque</button>'}</div>
      <div class="trilho">${dest.map(v => card(v, bcv ? pontua(v, S.busca) : null)).join('')}</div></section>` : '';
    const cats = `<div class="cats" role="group" aria-label="Tipos de carro">${TIPOS.filter(t => cont[t]).map(t =>
      `<button class="cat ${F.tipo === t ? 'on' : ''}" data-acao="tipoCat" data-t="${t}" aria-pressed="${F.tipo === t}">${SILHUETA[t] ?? SILHUETA.Hatch}<strong>${t}</strong><span>${cont[t]}</span></button>`).join('')}</div>`;
    const nFiltros = ativos.filter(([k]) => k !== 'q').length;
    return {
      html: `${hero}
      <section class="busca-topo">
        <div class="busca-linha">
          <input type="search" id="q" placeholder="Buscar marca ou modelo" value="${esc(F.q ?? '')}" aria-label="Buscar" autocomplete="off">
          <button class="btn sec filtro-btn" data-acao="abreFiltros">Filtros${nFiltros ? `<span class="badge">${nFiltros}</span>` : ''}</button>
        </div>
        <div class="chips" role="group" aria-label="Filtros rápidos">
          ${RAPIDOS.map((r, i) => { const [k] = Object.keys(r.f); return `<button class="chip ${F[k] === r.f[k] ? 'on' : ''}" data-acao="rapido" data-i="${i}">${r.t}</button>`; }).join('')}
        </div></section>
      <section class="pagina">
        ${destaques}
        ${mostraHero || F.tipo ? cats : ''}
        ${ativos.filter(([k]) => k !== 'q').length ? `<div class="chips ativos">${ativos.filter(([k]) => k !== 'q').map(([k, v]) => `<button class="chip on" data-acao="removeFiltro" data-k="${k}" aria-label="Remover filtro ${esc(ROTULOS[k](v))}">${esc(ROTULOS[k](v))} ✕</button>`).join('')}
          <button class="chip salvar" data-acao="salvaBuscaAtual">★ Salvar como minha busca</button></div>` : ''}
        <div class="linha-res" id="estoque"><h2 class="titulo-lista">Estoque</h2><p class="meta" id="contagem" role="status"></p>
          <label class="ordem">Ordenar <select id="ordem">${Object.entries(ORDENS).map(([k, t]) => `<option value="${k}" ${F.ordem === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
        <div class="grade" id="lista"></div>
      </section>`,
      bind() {
        const pinta = () => {
          const l = ordena(S.veiculos.filter(v => passa(v, F)), F.ordem);
          document.getElementById('contagem').textContent = `${l.length} carro${l.length === 1 ? '' : 's'}`;
          document.getElementById('lista').innerHTML = l.length ? l.map(v => card(v, bc ? pontua(v, S.busca) : null)).join('')
            : '<div class="vazio"><p>Nenhum carro com esses filtros.</p><button class="btn sec" data-acao="limpaFiltros">Limpar filtros</button></div>';
        };
        pinta();
        document.getElementById('q').addEventListener('input', e => { F.q = e.target.value.trim(); pinta(); });
        document.getElementById('ordem').addEventListener('change', e => { F.ordem = e.target.value; pinta(); });
        const fr = document.getElementById('frase');
        if (fr) fr.onsubmit = e => { e.preventDefault();
          for (const k of ['tipo', 'precoMax', 'uf']) { const x = fr.elements[k].value; if (x) F[k] = k === 'precoMax' ? +x : x; else delete F[k]; }
          CF.render().then(() => document.getElementById('estoque')?.scrollIntoView({ block: 'start' })); };
      }
    };
  };

  CF.rotas.voce = async () => {
    if (!S.user) return { html: `<section class="pagina vazio"><h2>Carros que combinam com você</h2><p>Entre e conte o que procura. Mostramos primeiro os carros que mais combinam.</p><a class="btn grande" href="#/entrar">Entrar ou criar conta</a></section>` };
    if (CF.papel() === 'garagista') return { html: '<section class="pagina vazio"><p>Esta área é para clientes.</p><a class="btn" href="#/painel">Ir para meus veículos</a></section>' };
    try { await CF.carregaCatalogo(); } catch { return { html: `<section class="pagina">${erroCarga()}</section>` }; }
    const b = S.busca ?? {};
    if (!Object.keys(b).length) return { html: `<section class="pagina vazio"><h2>Conte o que você procura</h2><p>Defina região, modelo, ano e valor. Depois é só voltar aqui para ver os melhores resultados.</p><a class="btn grande" href="#/preferencias">Definir preferências</a></section>` };
    const l = S.veiculos.map(v => ({ v, p: pontua(v, b) })).filter(x => x.p >= 60).sort((a, c) => c.p - a.p || a.v.preco - c.v.preco);
    return {
      html: `<section class="pagina"><div class="cab"><h2>Para você</h2><a class="btn sec" href="#/preferencias">Editar preferências</a></div>
        <div class="chips ativos">${Object.entries(b).map(([k, v]) => `<span class="chip on">${esc(ROTULOS[k]?.(v) ?? v)}</span>`).join('')}</div>
        <p class="meta">${l.length} carro${l.length === 1 ? '' : 's'} combinam com sua busca (a partir de 60%).</p>
        <div class="grade">${l.length ? l.map(x => card(x.v, x.p)).join('') : '<div class="vazio"><p>Nada por enquanto. Amplie o valor ou a região.</p></div>'}</div></section>`
    };
  };

  CF.rotas.preferencias = async () => {
    if (!S.user) return { html: '<section class="pagina vazio"><p>Entre para definir suas preferências.</p><a class="btn" href="#/entrar">Entrar</a></section>' };
    try { await CF.carregaCatalogo(); } catch { return { html: `<section class="pagina">${erroCarga()}</section>` }; }
    return {
      html: `<section class="pagina estreita"><h2>O que você procura</h2><p class="meta">Salvamos sua busca e mostramos primeiro os carros que mais combinam. Se você autorizar, garagens aprovadas com carros parecidos também podem falar com você.</p>
        <form id="fp" class="form-filtros">${formFiltros(S.busca ?? {})}
        <p class="erro-geral" id="fp-erro" role="alert" hidden></p>
        <label class="consentimento"><input type="checkbox" id="autoriza" ${S.autoriza ? 'checked' : ''}>
          <span><strong>Quero ser encontrado por garagens.</strong> Autorizo que garagens cadastradas e aprovadas, com carros parecidos com a minha busca, vejam meu nome e WhatsApp e entrem em contato comigo. Posso desmarcar quando quiser.</span></label>
        <div class="acoes"><button class="btn grande" type="submit">Salvar preferências</button>
        <button class="btn sec grande" type="button" data-acao="limpaPrefs">Limpar</button></div></form>
        ${CF.push.cartao('Avisos no celular', 'Receba uma notificação quando entrar um carro parecido com a sua busca.')}</section>`,
      bind() {
        const f = document.getElementById('fp'); ligaRegiao(f); CF.push.liga();
        f.onsubmit = async e => { e.preventDefault();
          const novo = lerForm(f), problema = CF.val.filtros(novo), box = document.getElementById('fp-erro');
          if (problema) { box.textContent = problema; box.hidden = false; box.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); return; }
          box.hidden = true; S.busca = novo;
          const quer = document.getElementById('autoriza').checked;
          if (quer && !S.autoriza) S.autorizadoEm = new Date().toISOString();
          S.autoriza = quer;
          try { await CF.salvaPrefs(); } catch (err) { CF.toastErro(err); return; }
          CF.toast('Preferências salvas!'); location.hash = '#/voce'; };
      }
    };
  };
  CF.acoes.limpaPrefs = async () => { S.busca = {}; await CF.salvaPrefs(); CF.toast('Preferências removidas.'); CF.render(); };

  CF.rotas.favoritos = async () => {
    try { await CF.carregaCatalogo(); } catch { return { html: `<section class="pagina">${erroCarga()}</section>` }; }
    const l = S.veiculos.filter(v => S.favs.includes(v.id));
    return { html: `<section class="pagina"><h2>Meus favoritos</h2>${l.length ? `<div class="grade">${l.map(v => card(v, null)).join('')}</div>` : '<div class="vazio"><p>Toque no ♥ de um carro para salvá-lo aqui.</p><a class="btn" href="#/">Ver carros</a></div>'}</section>` };
  };

  // ---------- detalhe ----------
  const botoesContato = (tel, msg) => tel
    ? `<a class="btn zap grande" target="_blank" rel="noopener" href="${CF.wa(tel, msg)}">WhatsApp</a><a class="btn sec grande" href="tel:+${tel}">${CF.ico('phone', 'peq')} ${CF.fmtTel(tel)}</a>`
    : (S.user ? '<p class="meta">Contato indisponível.</p>' : `<a class="btn sec grande" href="#/entrar">${CF.ico('lock', 'peq')} Entre para ver o contato</a>`);

  CF.rotas.carro = async id => {
    try { await CF.carregaCatalogo(); } catch { return { html: `<section class="pagina">${erroCarga()}</section>` }; }
    const v = S.veiculos.find(x => x.id === +id);
    if (!v) return { html: '<section class="pagina vazio"><h2>Este carro saiu do catálogo</h2><p>Pode ter sido vendido ou pausado pela loja.</p><a class="btn" href="#/">Ver outros carros</a></section>' };
    const g = S.garagens[v.garagem_id] ?? {}; const fav = S.favs.includes(v.id);
    const enviado = S.enviados.has(v.id);
    const msg = `Olá! Tenho interesse no ${v.marca} ${v.modelo} ${v.ano} (${brl(v.preco)}) que vi no ${CF.marca}`;
    const n = (v.fotos ?? []).filter(p => CF.fotoUrl(p)).length;
    const pct = S.busca && Object.keys(S.busca).length ? pontua(v, S.busca) : null;
    const spec = (k, x) => `<div><dt>${k}</dt><dd>${esc(x)}</dd></div>`;
    const acao = enviado
      ? `<p class="ok">${CF.ico('check', 'peq')} Interesse enviado. A loja vai falar com você.</p><button class="btn-link" data-acao="retiraInteresse" data-id="${v.id}">Retirar interesse</button>`
      : `<label class="campo">Mensagem para a loja (opcional)<textarea id="msg-int" maxlength="300" rows="2" placeholder="Ex.: Posso ver o carro no sábado?"></textarea></label>
        <button class="btn grande destaque" data-acao="interesse" data-id="${v.id}" id="cta-interesse">Tenho interesse</button>
        <p class="meta">A loja recebe seu nome e WhatsApp e responde por lá.</p>`;
    return {
      html: `<section class="pagina detalhe">
        <a class="voltar" href="#/">${CF.ico('car', 'peq')} Voltar aos carros</a>
        <div class="galeria-carro">
          <div class="foto-principal" id="foto-principal">${foto(v)}</div>
          ${n > 1 ? `<div class="miniaturas" role="group" aria-label="Fotos">${v.fotos.map((p, i) => CF.fotoUrl(p) ? `<button class="mini ${i ? '' : 'on'}" data-acao="verFoto" data-i="${i}" aria-label="Foto ${i + 1} de ${n}">${CF.fotoHtml(v, i)}</button>` : '').join('')}</div>` : ''}
        </div>
        <aside class="painel-compra">
          <p class="etiqueta grande">${brl(v.preco)}</p>
          <h1><span>${esc(v.marca)}</span> ${esc(v.modelo)}</h1>
          <p class="selos">${verif(g)}${CF.seloConf(v)}${pct != null ? `<span class="match-linha">${pct}% do que você procura</span>` : ''}</p>
          <dl class="specs">${spec('Ano', v.ano)}${spec('Quilometragem', `${num(v.km)} km`)}${spec('Câmbio', v.cambio)}${spec('Combustível', v.combustivel)}${spec('Tipo', v.tipo)}${spec('Cor', v.cor || '—')}</dl>
          <div class="cta" id="cta">${acao}</div>
          <div class="loja-card"><p class="meta">Vendido por</p><h3>${esc(g.nome ?? 'Loja')} ${verif(g)}</h3><p class="meta">${CF.ico('pin', 'peq')} ${esc(v.cidade)}/${esc(v.uf)}</p>
            <div class="acoes">${botoesContato(S.telG[v.garagem_id], msg)}</div></div>
          <button class="fav em-linha ${fav ? 'on' : ''}" data-acao="fav" data-id="${v.id}" aria-pressed="${fav}">${CF.ico('heart')}<span>${fav ? 'Nos favoritos' : 'Guardar nos favoritos'}</span></button>
        </aside>
        <div class="sobre">
          ${v.descricao ? `<h2>Sobre este carro</h2><p class="descricao">${esc(v.descricao)}</p>` : ''}
          <div class="aviso">${CF.ico('info', 'peq')} <span>Antes de pagar: peça o laudo cautelar e consulte débitos. <a href="#/guia">Guia do primeiro carro</a> · <a href="#/simulador?valor=${Math.round(v.preco)}">Simular parcelas</a></span></div>
          ${CF.linhaDenuncia?.(v) ?? ''}
        </div>
        <div class="barra-compra"><span class="etiqueta">${brl(v.preco)}</span>${enviado ? '<span class="ok">Interesse enviado</span>' : '<button class="btn destaque" data-acao="irCta">Tenho interesse</button>'}</div>
      </section>`
    };
  };
  CF.acoes.verFoto = el => {
    const v = S.veiculos.find(x => x.fotos?.length && location.hash.includes(`/carro/${x.id}`)); if (!v) return;
    document.getElementById('foto-principal').innerHTML = CF.fotoHtml(v, +el.dataset.i);
    document.querySelectorAll('.mini').forEach(m => m.classList.toggle('on', m === el));
  };
  CF.acoes.irCta = () => { document.getElementById('cta')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => document.getElementById('msg-int')?.focus(), 400); };

  CF.acoes.interesse = async el => {
    if (!S.user) { location.hash = '#/entrar'; return; }
    if (!S.perfil) { location.hash = '#/perfil'; return; }
    el.disabled = true;
    const { error } = await CF.sb.from('interesses').insert({
      veiculo_id: +el.dataset.id, comprador_id: S.user.id, nome: S.perfil.nome, telefone: S.perfil.telefone,
      mensagem: (document.getElementById('msg-int')?.value ?? '').trim().slice(0, 300)
    });
    if (error && error.code !== '23505') { el.disabled = false; CF.toastErro(error); return; }
    S.enviados.add(+el.dataset.id); CF.toast('Interesse enviado!'); CF.render();
  };
  CF.acoes.retiraInteresse = async el => {
    await CF.sb.from('interesses').delete().eq('veiculo_id', +el.dataset.id).eq('comprador_id', S.user.id);
    S.enviados.delete(+el.dataset.id); CF.render();
  };
})();
