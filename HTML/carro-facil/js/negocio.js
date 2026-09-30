// Negócio: clientes buscando (leads com crédito), radar de demanda e administração de garagens
(() => {
  const { esc, s: S } = CF;
  const $ = id => document.getElementById(id);
  const data = d => new Date(d).toLocaleDateString('pt-BR');
  const bloqueio = (titulo, texto, ir) => ({ html: `<section class="pagina vazio"><h2>${titulo}</h2><p>${texto}</p>${ir ?? ''}</section>` });
  const ehGaragista = () => CF.papel() === 'garagista' && S.garagem;
  const aprovada = () => S.garagem?.status_aprovacao === 'aprovada';
  const wa = t => CF.normTel(t) ?? t;

  // referência de mercado (estática): fontes públicas citadas na pesquisa
  const MERCADO = {
    vendidos: { titulo: 'Usados mais vendidos · jul/2026', fonte: 'Fenauto', itens: [{ nome: 'VW Gol', total: 70874 }, { nome: 'Chevrolet Onix', total: 43180 }, { nome: 'Hyundai HB20', total: 42312 }] },
    idade: { titulo: 'Vendas de usados por idade do carro · 2025', fonte: 'Fenauto (18,5 mi de transferências)', itens: [{ nome: '13 anos ou mais', total: 37 }, { nome: '4 a 8 anos', total: 24 }, { nome: '0 a 3 anos', total: 19 }, { nome: '9 a 12 anos', total: 19 }], sufixo: '%' },
    buscados: { titulo: 'Usados mais buscados · abr/2026', fonte: 'Webmotors (visitas aos anúncios)', lista: ['Honda Civic', 'Toyota Corolla', 'Chevrolet Onix', 'VW Polo', 'Hyundai HB20'] }
  };
  const barras = (itens, suf = '') => {
    const max = Math.max(...itens.map(x => x.total), 1);
    return `<ul class="barras">${itens.map(x => `<li><span class="rot">${esc(x.nome)}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round(x.total / max * 100)}%"></i></span><b>${CF.num(x.total)}${suf}</b></li>`).join('')}</ul>`;
  };
  const bloco = (titulo, itens, suf) => itens?.length ? `<div class="card"><h3>${titulo}</h3>${barras(itens, suf)}</div>` : '';

  // ---------- clientes buscando ----------
  CF.rotas.demanda = async () => {
    if (!ehGaragista()) return bloqueio('Clientes buscando', 'Esta área é para garagistas.', '<a class="btn" href="#/entrar?papel=garagista">Criar conta de garagista</a>');
    if (!aprovada()) return bloqueio('Cadastro em análise', 'Assim que a sua garagem for aprovada, você verá aqui os clientes que procuram carros parecidos com o seu estoque.', '<a class="btn" href="#/painel">Voltar ao painel</a>');
    const [d, u] = await Promise.all([CF.sb.rpc('demandas_para_mim'), CF.sb.rpc('meus_desbloqueios')]);
    if (d.error) return { html: '<section class="pagina vazio"><p>Não foi possível carregar agora.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const lista = d.data ?? [], abertos = u.data ?? [];
    const contato = Object.fromEntries(abertos.map(x => [x.lead_ref, x]));
    const cred = S.priv?.creditos ?? 0;
    const zap = x => `<a class="btn zap" target="_blank" rel="noopener" href="${CF.wa(wa(x.telefone), `Olá ${x.nome}! Aqui é da ${S.garagem.nome}. Vi que você procura ${CF.descreveBusca(x.busca).join(', ')} no Cadê meu carro? e tenho carros que combinam. Posso te mostrar?`)}">WhatsApp de ${esc(x.nome)}</a>`;
    const item = x => {
      const c = contato[x.lead_ref];
      return `<article class="card lead demanda"><div><p class="meta">Busca atualizada em ${data(x.atualizado_em)}</p>
        <div class="chips ativos">${CF.descreveBusca(x.busca).map(t => `<span class="chip on">${esc(t)}</span>`).join('')}</div>
        <p class="meta"><strong>${x.compat}</strong> ${x.compat === 1 ? 'veículo seu combina' : 'veículos seus combinam'}</p></div>
        <div class="acoes">${c ? zap(c) : `<button class="btn" data-acao="desbloqueia" data-id="${x.lead_ref}">Ver contato · 1 crédito</button>`}</div></article>`;
    };
    const semCred = cred < 1 ? `<div class="aviso">Você está sem créditos. ${CF.cfg?.contatoComercial ? `<a target="_blank" rel="noopener" href="${CF.wa(CF.cfg.contatoComercial, 'Olá! Sou garagista no Cadê meu carro? e quero comprar créditos para ver contatos de clientes.')}">Falar com a equipe</a> para adquirir mais.` : 'Fale com a equipe do Cadê meu carro? para adquirir mais.'}</div>` : '';
    return {
      html: `<section class="pagina estreita"><div class="cab"><div><h2>Clientes buscando</h2><p class="meta">Pessoas que autorizaram contato e procuram carros parecidos com o seu estoque. O contato só aparece depois de usar 1 crédito.</p></div>
        <span class="creditos" aria-label="Créditos">Créditos <strong>${cred}</strong></span></div>${semCred}
        ${lista.length ? lista.map(item).join('') : '<div class="vazio"><p>Ainda não há clientes com busca compatível e contato autorizado. Avisaremos por notificação quando surgir.</p></div>'}
        <div class="acoes"><a class="btn sec" href="#/radar">Ver radar de demanda</a></div></section>`
    };
  };
  CF.acoes.desbloqueia = async el => {
    if (el.dataset.conf !== '1') { el.dataset.conf = '1'; el.textContent = 'Confirmar: usar 1 crédito'; el.classList.add('destaque'); return; }
    el.disabled = true;
    const { error } = await CF.sb.rpc('desbloquear_lead', { p_lead: el.dataset.id });
    if (error) {
      const m = error.message || '';
      CF.toast(m.includes('sem_creditos') ? 'Sem créditos disponíveis.' : m.includes('lead_indisponivel') ? 'Este cliente não está mais disponível.' : 'Não foi possível liberar o contato.');
      el.disabled = false; if (m.includes('lead_indisponivel')) CF.render(); return;
    }
    const p = (await CF.sb.from('garagem_privado').select('cnpj,creditos').eq('garagem_id', S.garagem.id).maybeSingle()).data; if (p) S.priv = p;
    CF.toast('Contato liberado!'); CF.render();
  };

  // ---------- radar de demanda ----------
  CF.rotas.radar = async () => {
    if (!(ehGaragista() && aprovada()) && !S.admin) return bloqueio('Radar de demanda', 'Disponível para garagens aprovadas.', '<a class="btn" href="#/painel">Voltar ao painel</a>');
    const r = await CF.sb.rpc('radar_demanda');
    if (r.error) return { html: '<section class="pagina vazio"><p>Não foi possível carregar agora.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const j = r.data ?? {};
    const temGrupos = ['marcas', 'modelos', 'ufs', 'faixas', 'tipos', 'cambio', 'favoritos'].some(k => (j[k] ?? []).length);
    return {
      html: `<section class="pagina estreita"><h2>Radar de demanda</h2>
        <p class="meta">O que os clientes cadastrados procuram agora, a partir das buscas salvas e dos favoritos. Para proteger a privacidade, só aparecem grupos com 3 ou mais pessoas.</p>
        <div class="kpis"><div><strong>${CF.num(j.total ?? 0)}</strong><span>buscas salvas</span></div></div>
        ${temGrupos ? [bloco('Marcas mais buscadas', j.marcas), bloco('Modelos mais buscados', j.modelos), bloco('Faixas de preço (valor máximo)', j.faixas), bloco('Regiões (UF)', j.ufs), bloco('Tipos', j.tipos), bloco('Câmbio', j.cambio), bloco('Mais favoritados', j.favoritos)].join('')
          : '<div class="vazio"><p>Ainda há poucos clientes para mostrar tendências. Conforme as buscas se repetirem, os grupos aparecem aqui.</p></div>'}
        <h3>Referência do mercado nacional</h3>
        <div class="card"><h3>${MERCADO.vendidos.titulo}</h3><p class="meta">Fonte: ${MERCADO.vendidos.fonte}</p>${barras(MERCADO.vendidos.itens)}</div>
        <div class="card"><h3>${MERCADO.idade.titulo}</h3><p class="meta">Fonte: ${MERCADO.idade.fonte}</p>${barras(MERCADO.idade.itens, '%')}</div>
        <div class="card"><h3>${MERCADO.buscados.titulo}</h3><p class="meta">Fonte: ${MERCADO.buscados.fonte}</p><ol class="docs">${MERCADO.buscados.lista.map(x => `<li>${x}</li>`).join('')}</ol></div></section>`
    };
  };

  // ---------- administração ----------
  const ST = { pendente: 'Pendente', aprovada: 'Aprovada', suspensa: 'Suspensa' };
  CF.rotas.admin = async () => {
    if (!S.admin) return bloqueio('Administração', 'Área restrita.', '<a class="btn" href="#/">Ir para o início</a>');
    const r = await CF.sb.rpc('admin_garagens');
    if (r.error) return { html: '<section class="pagina vazio"><p>Não foi possível carregar.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const fmt = c => c ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : 'sem CNPJ';
    const item = g => `<article class="card adm"><h3>${esc(g.nome)} <span class="tag ${g.status_aprovacao === 'pendente' ? 'novo' : ''}">${ST[g.status_aprovacao]}</span>${g.demo ? ' <span class="tag">Demo</span>' : ''}</h3>
      <p class="meta">${esc(g.cidade)}/${esc(g.uf)} · CNPJ ${esc(fmt(g.cnpj))} · ${g.telefone ? esc(CF.fmtTel(g.telefone)) : 'sem telefone'} · cadastrada em ${data(g.criado_em)}</p>
      <p class="meta">Créditos: <strong>${g.creditos}</strong></p>
      <div class="acoes-linha">${['aprovada', 'pendente', 'suspensa'].filter(s => s !== g.status_aprovacao).map(s => `<button class="btn ${s === 'aprovada' ? '' : 'sec'} peq" data-acao="admStatus" data-id="${g.id}" data-s="${s}">${s === 'aprovada' ? 'Aprovar' : s === 'suspensa' ? 'Suspender' : 'Voltar a pendente'}</button>`).join('')}
        <input class="cred-qtd" type="number" min="-1000" max="1000" step="1" value="10" aria-label="Quantidade de créditos" id="cq-${g.id}">
        <button class="btn sec peq" data-acao="admCred" data-id="${g.id}">Créditos</button></div></article>`;
    const l = r.data ?? [];
    return { html: `<section class="pagina estreita"><h2>Administração</h2><p class="meta">Aprove garagens, suspenda cadastros e conceda créditos. Créditos positivos somam; negativos descontam.</p>${l.length ? l.map(item).join('') : '<div class="vazio"><p>Nenhuma garagem cadastrada.</p></div>'}</section>` };
  };
  CF.acoes.admStatus = async el => {
    const { error } = await CF.sb.rpc('admin_definir_status', { p_garagem: el.dataset.id, p_status: el.dataset.s });
    CF.toast(error ? 'Não foi possível alterar.' : 'Status atualizado.'); CF.render();
  };
  CF.acoes.admCred = async el => {
    const q = parseInt($('cq-' + el.dataset.id)?.value, 10);
    if (!q) { CF.toast('Informe uma quantidade diferente de zero.'); return; }
    const { data: total, error } = await CF.sb.rpc('admin_conceder_creditos', { p_garagem: el.dataset.id, p_qtd: q, p_motivo: 'Painel admin' });
    CF.toast(error ? 'Não foi possível alterar.' : `Créditos: ${total}`); CF.render();
  };
})();
