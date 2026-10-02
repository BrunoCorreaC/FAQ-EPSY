// Assinaturas e pagamentos: painel administrativo (planos, assinaturas, cobranças, ajustes) e visão do garagista
(() => {
  const { esc, s: S } = CF;
  const $ = id => document.getElementById(id);
  const reais = c => (Number(c) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const paraCentavos = v => { const n = parseFloat(String(v).trim().replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null; };
  const emReais = c => (Number(c) / 100).toFixed(2).replace('.', ',');
  const dia = d => d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') : '—';
  const mesAno = d => { const [a, m] = String(d).split('-'); return `${m}/${a}`; };
  CF.reais = reais;
  const ok = x => CF.toast(x.error ? CF.msgErro(x.error) : 'Pronto!');

  const STATUS_ASSIN = { teste: 'Em teste', ativa: 'Ativa', em_atraso: 'Em atraso', suspensa: 'Suspensa', cancelada: 'Cancelada', cortesia: 'Cortesia', sem_assinatura: 'Sem assinatura', demo: 'Demonstração' };
  const STATUS_COB = { aberta: 'Em aberto', vencida: 'Vencida', paga: 'Paga', cancelada: 'Cancelada' };
  const tag = (t, ruim) => `<span class="tag ${ruim ? 'novo' : ''}">${esc(t)}</span>`;
  const ruimAssin = s => ['em_atraso', 'suspensa', 'cancelada', 'sem_assinatura'].includes(s);

  CF.liberada = () => S.assin?.liberada === true;

  // ---------- abas do administrador ----------
  const ABAS = [['', 'Garagens'], ['assinaturas', 'Assinaturas'], ['cobrancas', 'Cobranças'], ['planos', 'Planos'], ['denuncias', 'Denúncias'], ['ajustes', 'Ajustes']];
  CF.adminAbas = ativa => `<nav class="abas-admin" aria-label="Administração">${ABAS.map(([k, t]) => `<a href="#/admin${k ? '/' + k : ''}" class="${k === ativa ? 'ativa' : ''}" ${k === ativa ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  const falha = () => ({ html: `${CF.adminAbas('')}<section class="pagina vazio"><p>Não foi possível carregar.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>` });
  const pagina = (aba, corpo) => ({ html: `<section class="pagina">${CF.adminAbas(aba)}${corpo}</section>` });

  // ---------- assinaturas ----------
  const kpi = (n, t, ruim) => `<div class="${ruim ? 'kpi-alerta' : ''}"><strong>${n}</strong><span>${t}</span></div>`;
  const rotaAssinaturas = async () => {
    const [rs, as, gs, ps] = await Promise.all([CF.sb.rpc('admin_resumo'), CF.sb.rpc('admin_assinaturas'), CF.sb.rpc('admin_garagens'), CF.sb.rpc('admin_planos')]);
    if (rs.error || as.error || gs.error || ps.error) return falha();
    const r = rs.data, planos = (ps.data ?? []).filter(p => p.ativo), lista = as.data ?? [];
    const semAssin = (gs.data ?? []).filter(g => g.status_aprovacao === 'aprovada' && !g.demo && !g.assin_status);
    const optPlanos = sel => planos.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)} · ${reais(p.valor_centavos)}</option>`).join('');
    const novo = g => `<article class="card adm"><h3>${esc(g.nome)} ${tag('Aprovada, sem assinatura', true)}</h3><p class="meta">${esc(g.cidade)}/${esc(g.uf)}</p>
      ${planos.length ? `<form class="form" data-form="criaAssin" data-id="${g.id}">
        <label class="campo">Plano<select name="plano">${optPlanos()}</select></label>
        <div class="dupla"><label class="campo">Vencimento (dia 1 a 28)<input name="dia" inputmode="numeric" maxlength="2" value="10"></label>
          <label class="campo">Teste grátis (dias)<input name="teste" inputmode="numeric" maxlength="3" value="0"></label></div>
        <label class="campo">Valor especial (R$, opcional)<input name="valor" inputmode="decimal" placeholder="usa o valor do plano"></label>
        <label class="consentimento"><input type="checkbox" name="cortesia"><span>Cortesia (sem cobrança) — libera sem gerar mensalidades</span></label>
        <button class="btn" type="submit">Criar assinatura</button></form>` : '<p class="meta">Ative ao menos um plano na aba Planos para criar assinaturas.</p>'}</article>`;
    const item = a => {
      const ruim = ruimAssin(a.status);
      return `<article class="card adm"><h3>${esc(a.garagem_nome)} ${tag(STATUS_ASSIN[a.status], ruim)}</h3>
        <p class="meta">${esc(a.plano_nome)} · ${reais(a.valor_centavos)}/mês · vence dia ${a.dia_vencimento}</p>
        <p class="meta">${a.status === 'teste' ? `Teste até ${dia(a.teste_ate)} · ` : ''}Próxima cobrança: ${dia(a.proxima_cobranca)}${a.bloqueio_em ? ` · bloqueio em ${dia(a.bloqueio_em)}` : ''}${a.cortesia_ate ? ` · cortesia até ${dia(a.cortesia_ate)}` : ''}</p>
        ${a.vencidas > 0 ? `<p class="aviso-linha">${CF.ico('info', 'peq')} ${a.vencidas} cobrança(s) vencida(s): ${reais(a.devido_centavos)}</p>` : ''}
        <div class="acoes-linha">
          ${a.status === 'suspensa' || a.status === 'cancelada' || a.status === 'cortesia' ? `<button class="btn peq" data-acao="assinStatus" data-id="${a.garagem_id}" data-s="ativa">Reativar</button>` : ''}
          ${a.status === 'ativa' || a.status === 'em_atraso' || a.status === 'teste' ? `<button class="btn sec peq" data-acao="assinStatus" data-id="${a.garagem_id}" data-s="suspensa">Suspender</button>` : ''}
          ${a.status !== 'cancelada' ? `<button class="btn-link peq" data-acao="assinCancela" data-id="${a.garagem_id}">Cancelar</button>` : ''}</div>
        <details class="editar"><summary>Alterar plano, valor ou vencimento</summary>
          <form class="form" data-form="alteraAssin" data-id="${a.garagem_id}">
            <label class="campo">Plano<select name="plano">${optPlanos(a.plano_id)}</select></label>
            <div class="dupla"><label class="campo">Valor (R$)<input name="valor" inputmode="decimal" value="${emReais(a.valor_centavos)}"></label>
              <label class="campo">Dia do vencimento<input name="dia" inputmode="numeric" maxlength="2" value="${a.dia_vencimento}"></label></div>
            <button class="btn sec" type="submit">Salvar alterações</button></form></details></article>`;
    };
    return pagina('assinaturas', `
      <div class="cab"><h2>Assinaturas</h2><button class="btn sec peq" data-acao="rodaCobrancas">Gerar cobranças agora</button></div>
      <div class="kpis kpis-fin">${kpi(reais(r.mrr_centavos), 'receita mensal (MRR)')}${kpi(reais(r.recebido_mes_centavos), 'recebido no mês')}${kpi(reais(r.a_receber_centavos), 'a receber')}${kpi(reais(r.vencido_centavos), 'vencido', r.vencido_centavos > 0)}</div>
      <div class="kpis kpis-fin">${kpi(r.ativas, 'ativas')}${kpi(r.teste, 'em teste')}${kpi(r.em_atraso, 'em atraso', r.em_atraso > 0)}${kpi(r.suspensas, 'suspensas', r.suspensas > 0)}</div>
      ${r.pendentes_aprovacao > 0 ? `<div class="aviso">${r.pendentes_aprovacao} garagem(ns) aguardando aprovação na aba <a href="#/admin">Garagens</a>.</div>` : ''}
      ${semAssin.length ? `<h3>Aprovadas, aguardando assinatura</h3>${semAssin.map(novo).join('')}` : ''}
      <h3>Assinaturas</h3>${lista.length ? lista.map(item).join('') : '<div class="vazio"><p>Nenhuma assinatura criada ainda.</p></div>'}
      <p class="meta">As cobranças do próximo mês são geradas automaticamente todos os dias às 8h (Brasília). Garagem em atraso continua no ar durante a carência e depois é suspensa; ao registrar o pagamento ela volta ao ar.</p>`);
  };

  // ---------- cobranças ----------
  let filtroCob = null;
  const rotaCobrancas = async () => {
    const r = await CF.sb.rpc('admin_cobrancas', { p_status: filtroCob });
    if (r.error) return falha();
    const lista = r.data ?? [];
    const filtros = [[null, 'Todas'], ['vencida', 'Vencidas'], ['aberta', 'Em aberto'], ['paga', 'Pagas'], ['cancelada', 'Canceladas']];
    const item = c => {
      const aberta = c.status === 'aberta' || c.status === 'vencida';
      return `<article class="card adm"><h3>${esc(c.garagem_nome)} ${tag(STATUS_COB[c.status], c.status === 'vencida')}</h3>
        <p class="meta">Competência ${mesAno(c.competencia)} · vence ${dia(c.vencimento)} · <strong>${reais(c.valor_centavos)}</strong></p>
        ${c.status === 'paga' ? `<p class="meta">Pago em ${dia(c.pago_em)} via ${esc(c.forma ?? '—')}${c.observacao ? ` · ${esc(c.observacao)}` : ''}</p>` : (c.observacao ? `<p class="meta">${esc(c.observacao)}</p>` : '')}
        ${aberta ? `<details class="editar"><summary>Registrar pagamento</summary><form class="form" data-form="pagaCob" data-id="${c.id}">
          <div class="dupla"><label class="campo">Forma<select name="forma"><option value="pix">Pix</option><option value="boleto">Boleto</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option><option value="outro">Outro</option></select></label>
            <label class="campo">Data<input name="data" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${new Date().toISOString().slice(0, 10)}"></label></div>
          <label class="campo">Observação (opcional)<input name="obs" maxlength="200" placeholder="ex.: comprovante enviado por WhatsApp"></label>
          <button class="btn" type="submit">Confirmar pagamento</button></form></details>
          <button class="btn-link peq" data-acao="cobCancela" data-id="${c.id}">Cancelar cobrança</button>` : ''}
        ${c.status === 'paga' ? `<button class="btn-link peq" data-acao="cobDesfaz" data-id="${c.id}">Desfazer pagamento</button>` : ''}</article>`;
    };
    return pagina('cobrancas', `<h2>Cobranças</h2><div class="chips ativos">${filtros.map(([k, t]) => `<button class="chip ${k === filtroCob ? 'on' : ''}" data-acao="cobFiltro" data-s="${k ?? ''}">${t}</button>`).join('')}</div>
      ${lista.length ? lista.map(item).join('') : '<div class="vazio"><p>Nenhuma cobrança neste filtro.</p></div>'}`);
  };

  // ---------- planos ----------
  const formPlano = p => `<form class="form" data-form="salvaPlano" data-id="${p?.id ?? ''}">
    <label class="campo">Nome do plano<input name="nome" maxlength="60" value="${esc(p?.nome ?? '')}"></label>
    <div class="dupla"><label class="campo">Mensalidade (R$)<input name="valor" inputmode="decimal" placeholder="0,00" value="${p ? emReais(p.valor_centavos) : ''}"></label>
      <label class="campo">Máx. de anúncios ativos<input name="max" inputmode="numeric" placeholder="ilimitado" value="${p?.max_anuncios ?? ''}"></label></div>
    <label class="campo">Créditos de contato por mês<input name="cred" inputmode="numeric" value="${p?.creditos_mensais ?? 0}"></label>
    <label class="campo">Descrição (aparece para o garagista)<input name="desc" maxlength="300" value="${esc(p?.descricao ?? '')}"></label>
    <label class="consentimento"><input type="checkbox" name="ativo" ${p?.ativo ? 'checked' : ''}><span>Plano ativo (pode ser contratado)</span></label>
    <button class="btn" type="submit">${p ? 'Salvar plano' : 'Criar plano'}</button></form>`;
  const rotaPlanos = async () => {
    const r = await CF.sb.rpc('admin_planos'); if (r.error) return falha();
    const l = r.data ?? [], semValor = l.length > 0 && l.every(p => p.valor_centavos === 0);
    return pagina('planos', `<h2>Planos</h2><p class="meta">Defina aqui as mensalidades. Mudar o valor de um plano não altera assinaturas já criadas (o valor de cada garagem fica registrado na assinatura).</p>
      ${semValor ? '<div class="aviso">Os valores ainda não foram definidos. Preencha a mensalidade de cada plano e ative os que quiser oferecer.</div>' : ''}
      ${l.map(p => `<article class="card adm"><h3>${esc(p.nome)} ${p.ativo ? tag('Ativo') : tag('Inativo', true)}</h3><p class="meta">${reais(p.valor_centavos)}/mês · ${p.max_anuncios ? `até ${p.max_anuncios} anúncios` : 'anúncios ilimitados'} · ${p.creditos_mensais} crédito(s)/mês · ${p.assinaturas} assinatura(s)</p>
        <details class="editar"><summary>Editar plano</summary>${formPlano(p)}</details></article>`).join('')}
      <h3>Novo plano</h3><div class="card">${formPlano(null)}</div>`);
  };

  // ---------- denúncias ----------
  const STATUS_DEN = { aberta: 'Aberta', arquivada: 'Arquivada', garagem_suspensa: 'Garagem suspensa' };
  const rotaDenuncias = async () => {
    const r = await CF.sb.rpc('admin_denuncias'); if (r.error) return falha();
    const l = r.data ?? [], abertas = l.filter(d => d.status === 'aberta').length;
    return pagina('denuncias', `<h2>Denúncias</h2><p class="meta">${abertas ? `${abertas} aberta${abertas === 1 ? '' : 's'}.` : 'Nenhuma denúncia aberta.'} Apps nas lojas devem tratar denúncias com rapidez: responda em até 24 horas.</p>
      ${l.map(d => `<article class="card adm"><h3>${esc(d.veiculo)} ${tag(STATUS_DEN[d.status] ?? d.status, d.status === 'aberta')}</h3>
        <p class="meta">${esc(d.garagem)} · ${esc(CF.motivos?.[d.motivo] ?? d.motivo)} · ${new Date(d.criado_em).toLocaleDateString('pt-BR')}${d.abertas_na_garagem > 1 ? ` · <strong>${d.abertas_na_garagem} abertas nesta garagem</strong>` : ''}</p>
        ${d.detalhe ? `<p>${esc(d.detalhe)}</p>` : ''}
        ${d.status === 'aberta' ? `<div class="acoes-linha"><button class="btn sec peq" data-acao="denAcao" data-id="${d.id}" data-op="arquivar">Arquivar</button>
          ${d.veiculo_id ? `<button class="btn sec peq" data-acao="denAcao" data-id="${d.id}" data-op="pausar_anuncio">Pausar anúncio</button>` : ''}
          <button class="btn-link perigo peq" data-acao="denAcao" data-id="${d.id}" data-op="suspender_garagem">Suspender garagem</button></div>` : ''}</article>`).join('') || '<div class="vazio"><p>Sem denúncias.</p></div>'}`);
  };
  CF.acoes.denAcao = async el => {
    if (el.dataset.op === 'suspender_garagem' && el.dataset.conf !== '1') { el.dataset.conf = '1'; el.textContent = 'Confirmar suspensão?'; return; }
    el.disabled = true;
    const { error } = await CF.sb.rpc('admin_resolver_denuncia', { p_id: +el.dataset.id, p_acao: el.dataset.op });
    if (error) { el.disabled = false; CF.toastErro(error); return; }
    CF.toast('Denúncia tratada.'); CF.render();
  };

  // ---------- ajustes ----------
  const rotaAjustes = async () => {
    const r = await CF.sb.rpc('admin_config'); if (r.error) return falha();
    return pagina('ajustes', `<h2>Ajustes de cobrança</h2>
      <form class="form" data-form="salvaConfig">
        <label class="campo">Instruções de pagamento (o garagista vê na página Assinatura)<textarea name="instr" rows="5" maxlength="1000" placeholder="Ex.: Pix (CNPJ 00.000.000/0001-00) ou boleto. Envie o comprovante pelo WhatsApp.">${esc(r.data.instrucoes_pagamento ?? '')}</textarea></label>
        <label class="campo">Dias de carência após o vencimento<input name="carencia" inputmode="numeric" maxlength="2" value="${r.data.dias_carencia ?? 5}"></label>
        <p class="meta">Durante a carência a garagem em atraso continua no ar. Depois dela, os anúncios saem do catálogo até a regularização.</p>
        <button class="btn" type="submit">Salvar ajustes</button></form>
      <div class="card"><h3>Cobrança automática</h3><p class="meta">Hoje as mensalidades são geradas automaticamente e o recebimento é registrado por você (Pix, boleto ou dinheiro). A cobrança automática em cartão ou débito depende de contratar um provedor de pagamento (por exemplo Asaas, Mercado Pago ou Stripe); a estrutura já guarda o vínculo com o provedor.</p></div>`);
  };

  // roteia as abas do administrador
  const garagens = CF.rotas.admin;
  CF.rotas.admin = async aba => {
    if (!S.admin) return garagens(aba);
    const m = { assinaturas: rotaAssinaturas, cobrancas: rotaCobrancas, planos: rotaPlanos, denuncias: rotaDenuncias, ajustes: rotaAjustes }[aba];
    return m ? m() : garagens();
  };

  // ---------- ações do administrador ----------
  const val = (f, n) => f.elements[n]?.value;
  const formularios = {
    async criaAssin(f) {
      const v = CF.validar(f, [['plano', x => x ? { ok: +x } : { erro: 'Escolha um plano.' }], ['dia', x => CF.val.inteiro(x, { min: 1, max: 28, rotulo: 'o dia do vencimento' })],
        ['teste', x => CF.val.inteiro(x, { min: 0, max: 365, rotulo: 'os dias de teste', obrigatorio: false })], ['valor', x => CF.val.reais(x, { min: 0, max: 100000, rotulo: 'valor', obrigatorio: false })]]);
      if (!v) return false;
      ok(await CF.sb.rpc('admin_criar_assinatura', { p_garagem: f.dataset.id, p_plano: v.plano, p_dia: v.dia, p_dias_teste: v.teste || 0, p_valor_centavos: v.valor == null ? null : Math.round(v.valor * 100), p_cortesia: f.elements.cortesia.checked }));
    },
    async alteraAssin(f) {
      const v = CF.validar(f, [['plano', x => x ? { ok: +x } : { erro: 'Escolha um plano.' }], ['valor', x => CF.val.reais(x, { min: 0, max: 100000, rotulo: 'valor' })], ['dia', x => CF.val.inteiro(x, { min: 1, max: 28, rotulo: 'o dia do vencimento' })]]);
      if (!v) return false;
      ok(await CF.sb.rpc('admin_alterar_assinatura', { p_garagem: f.dataset.id, p_plano: v.plano, p_valor_centavos: Math.round(v.valor * 100), p_dia: v.dia }));
    },
    async pagaCob(f) {
      const v = CF.validar(f, [['forma', x => ['pix', 'boleto', 'cartao', 'dinheiro', 'outro'].includes(x) ? { ok: x } : { erro: 'Escolha a forma de pagamento.' }], ['data', x => CF.val.data(x)],
        ['obs', x => CF.val.texto(x, { max: 200, rotulo: 'a observação', obrigatorio: false })]]);
      if (!v) return false;
      ok(await CF.sb.rpc('admin_registrar_pagamento', { p_cobranca: +f.dataset.id, p_forma: v.forma, p_pago_em: v.data, p_obs: v.obs ?? '' }));
    },
    async salvaPlano(f) {
      const v = CF.validar(f, [['nome', x => CF.val.texto(x, { min: 2, max: 60, rotulo: 'o nome do plano' })], ['valor', x => CF.val.reais(x, { min: 0, max: 100000, rotulo: 'valor' })],
        ['max', x => CF.val.inteiro(x, { min: 1, max: 10000, rotulo: 'o limite de anúncios', obrigatorio: false })], ['cred', x => CF.val.inteiro(x, { min: 0, max: 10000, rotulo: 'os créditos', obrigatorio: false })],
        ['desc', x => CF.val.texto(x, { max: 300, rotulo: 'a descrição', obrigatorio: false })]]);
      if (!v) return false;
      ok(await CF.sb.rpc('admin_salvar_plano', { p_id: f.dataset.id ? +f.dataset.id : null, p_nome: v.nome, p_valor_centavos: Math.round(v.valor * 100), p_max_anuncios: v.max, p_creditos: v.cred || 0, p_descricao: v.desc ?? '', p_ativo: f.elements.ativo.checked }));
    },
    async salvaConfig(f) {
      const v = CF.validar(f, [['instr', x => CF.val.texto(x, { max: 1000, rotulo: 'as instruções', obrigatorio: false })], ['carencia', x => CF.val.inteiro(x, { min: 0, max: 60, rotulo: 'a carência' })]]);
      if (!v) return false;
      ok(await CF.sb.rpc('admin_definir_config', { p_instrucoes: v.instr ?? '', p_dias_carencia: v.carencia }));
    }
  };
  document.addEventListener('submit', async e => {
    const f = e.target.closest('form[data-form]'); if (!f || !formularios[f.dataset.form]) return;
    e.preventDefault();
    const b = f.querySelector('[type=submit]'); if (b) b.disabled = true;
    let enviou = false;
    try { enviou = (await formularios[f.dataset.form](f)) !== false; } catch (err) { CF.toastErro(err); } finally { if (enviou) CF.render(); else if (b) b.disabled = false; }
  });
  const confirma = (el, texto) => { if (el.dataset.conf === '1') return true; el.dataset.conf = '1'; el.dataset.t0 = el.textContent; el.textContent = texto; el.classList.add('perigo'); return false; };
  Object.assign(CF.acoes, {
    async assinStatus(el) { ok(await CF.sb.rpc('admin_definir_assinatura_status', { p_garagem: el.dataset.id, p_status: el.dataset.s })); CF.render(); },
    async assinCancela(el) { if (!confirma(el, 'Confirmar cancelamento?')) return; ok(await CF.sb.rpc('admin_definir_assinatura_status', { p_garagem: el.dataset.id, p_status: 'cancelada' })); CF.render(); },
    async cobCancela(el) { if (!confirma(el, 'Confirmar cancelamento?')) return; ok(await CF.sb.rpc('admin_cancelar_cobranca', { p_cobranca: +el.dataset.id, p_obs: 'Cancelada no painel' })); CF.render(); },
    async cobDesfaz(el) { if (!confirma(el, 'Confirmar: desfazer pagamento?')) return; ok(await CF.sb.rpc('admin_desfazer_pagamento', { p_cobranca: +el.dataset.id })); CF.render(); },
    cobFiltro(el) { filtroCob = el.dataset.s || null; CF.render(); },
    async rodaCobrancas() {
      const r = await CF.sb.rpc('admin_rodar_cobrancas');
      CF.toast(r.error ? 'Não foi possível gerar.' : `Geradas: ${r.data.geradas} · em atraso: ${r.data.em_atraso} · suspensas: ${r.data.suspensas}`); CF.render();
    }
  });

  // ---------- visão do garagista ----------
  CF.rotas.assinatura = async () => {
    if (CF.papel() !== 'garagista' || !S.garagem) return { html: '<section class="pagina vazio"><h2>Assinatura</h2><p>Esta área é para garagistas.</p><a class="btn" href="#/entrar?papel=garagista">Criar conta de garagista</a></section>' };
    const r = await CF.sb.rpc('minha_assinatura'); if (r.error || !r.data) return { html: '<section class="pagina vazio"><p>Não foi possível carregar.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const a = r.data; S.assin = a;
    const zap = CF.cfg?.contatoComercial ? `<a class="btn zap" target="_blank" rel="noopener" href="${CF.wa(CF.cfg.contatoComercial, `Olá! Sou da ${S.garagem.nome} no Cadê meu carro? e quero falar sobre a minha assinatura.`)}">Falar com a equipe</a>` : '';
    if (a.status === 'sem_assinatura' || a.status === 'demo') {
      return { html: `<section class="pagina estreita"><h2>Assinatura</h2><div class="card"><p>${a.status === 'demo' ? 'Esta é uma garagem de demonstração.' : S.garagem.status_aprovacao === 'aprovada' ? 'Seu cadastro foi aprovado. Falta ativar a sua assinatura para anunciar veículos.' : 'Assim que o seu cadastro for aprovado, a equipe ativa a sua assinatura.'}</p>${zap}</div>
        ${a.instrucoes && !CF.semPagamento ? `<div class="card"><h3>Como pagar</h3><p class="instr">${esc(a.instrucoes)}</p></div>` : ''}</section>` };
    }
    const msgs = {
      teste: `Período de teste até <strong>${dia(a.teste_ate)}</strong>. Depois começa a mensalidade.`,
      ativa: `Tudo certo. Próxima cobrança em <strong>${dia(a.proxima_cobranca)}</strong>.`,
      em_atraso: `Mensalidade em atraso. Regularize até <strong>${dia(a.bloqueio_em)}</strong> para manter seus anúncios no ar.`,
      suspensa: 'Assinatura suspensa por falta de pagamento. Seus anúncios estão ocultos até a regularização.',
      cancelada: 'Assinatura cancelada. Seus anúncios estão ocultos.',
      cortesia: a.cortesia_ate ? `Cortesia até <strong>${dia(a.cortesia_ate)}</strong>.` : 'Assinatura em cortesia, sem cobrança.'
    };
    const cob = c => `<li><span>${mesAno(c.competencia)}<small>vence ${dia(c.vencimento)}</small></span><span>${reais(c.valor_centavos)}</span>${tag(STATUS_COB[c.status], c.status === 'vencida')}</li>`;
    const abertas = (a.cobrancas ?? []).some(c => c.status === 'aberta' || c.status === 'vencida');
    return { html: `<section class="pagina estreita"><h2>Assinatura</h2>
      <div class="card"><div class="cab"><div><h3>${esc(a.plano.nome)}</h3><p class="preco">${reais(a.valor_centavos)}<small>/mês</small></p></div>${tag(STATUS_ASSIN[a.status], ruimAssin(a.status))}</div>
        <p class="${ruimAssin(a.status) ? 'aviso-linha' : ''}">${ruimAssin(a.status) ? CF.ico('info', 'peq') + ' ' : ''}${msgs[a.status] ?? ''}</p>
        <p class="meta">${a.plano.max_anuncios ? `Até ${a.plano.max_anuncios} anúncios ativos` : 'Anúncios ilimitados'} · ${a.plano.creditos_mensais} crédito(s) de contato por mês · vencimento todo dia ${a.dia_vencimento}</p>${a.plano.descricao ? `<p class="meta">${esc(a.plano.descricao)}</p>` : ''}</div>
      ${(abertas || a.instrucoes) && !CF.semPagamento ? `<div class="card"><h3>Como pagar</h3>${a.instrucoes ? `<p class="instr">${esc(a.instrucoes)}</p>` : '<p class="meta">Fale com a equipe para receber os dados de pagamento.</p>'}<p class="meta">Depois de pagar, envie o comprovante para a equipe. A liberação é feita após a confirmação.</p>${zap}</div>` : ''}
      <h3>Últimas cobranças</h3>${(a.cobrancas ?? []).length ? `<ul class="cobrancas">${a.cobrancas.map(cob).join('')}</ul>` : '<div class="vazio"><p>Ainda não há cobranças.</p></div>'}</section>` };
  };
})();
