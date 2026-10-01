// Núcleo: helpers, estado, Supabase (sessão, perfil, catálogo, preferências)
(() => {
  const CF = window.CF = { acoes: {}, rotas: {} };

  CF.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CF.brl = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  CF.num = n => Number(n).toLocaleString('pt-BR');
  CF.fmtTel = t => { const d = String(t).slice(2); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; };
  CF.normTel = s => { let d = String(s).replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return /^55\d{10,11}$/.test(d) ? d : null; };
  // ícones de linha (mesmo traço em todos os aparelhos, no lugar de emojis)
  const ICONES = {
    car: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 2-1.5h10a2 2 0 0 1 2 1.5l2 6v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
    spark: '<path d="M11 3l1.9 5.1L18 10l-5.100 1.900L11 17l-1.900-5.100L4 10l5.100-1.900z"/><path d="M19 14l.8 2.200L22 17l-2.200.8L19 20l-.8-2.200L16 17l2.200-.8z"/>',
    phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    guide: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    store: '<path d="M3 9l1.500-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.500 7.200L4 20l1-4.500A8 8 0 1 1 21 12z"/>',
    heart: '<path d="M12 20s-7-4.600-9.200-9.100C1.300 7.600 3.400 4 6.800 4c2 0 3.600 1.100 5.200 3 1.600-1.900 3.200-3 5.200-3 3.400 0 5.500 3.600 4 6.900C19 15.400 12 20 12 20z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pin: '<path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.900L12 16.900 6.800 19.700l1-5.900L3.500 9.700l5.900-.8z"/>'
  };
  CF.ico = (nome, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] ?? ''}</svg>`;
  CF.wa = (tel, msg) => `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;

  CF.store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage bloqueado */ } }
  };

  const cfg = CF.cfg = window.CF_CONFIG || {};
  const sb = CF.sb = (window.supabase && cfg.supabaseUrl && cfg.supabaseKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { flowType: 'pkce' } }) : null;

  // estado
  const S = CF.s = {
    user: null, perfil: null, garagem: null, priv: null, assin: null, admin: false, autoriza: false, autorizadoEm: null,
    favs: CF.store.get('cf_favs', []), checks: CF.store.get('cf_checks', []), busca: CF.store.get('cf_busca', {}),
    veiculos: null, garagens: {}, telG: {}, telD: {}, telsOk: false, enviados: new Set()
  };
  CF.papel = () => S.perfil?.papel ?? null;

  CF.fotoUrl = p => /^[0-9a-f-]{36}\/[\w.-]+$/i.test(p || '') ? `${cfg.supabaseUrl}/storage/v1/object/public/veiculos/${p}` : null;

  CF.toast = msg => {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(CF.toast.t); CF.toast.t = setTimeout(() => t.classList.remove('on'), 3200);
  };

  CF.guardaLocal = () => {
    CF.store.set('cf_favs', S.favs); CF.store.set('cf_checks', S.checks); CF.store.set('cf_busca', S.busca);
    const n = document.getElementById('fav-count'); if (n) n.textContent = S.favs.length;
  };
  CF.salvaPrefs = async () => {
    CF.guardaLocal();
    if (!sb || !S.user) return;
    const { error } = await sb.from('preferencias').upsert({ user_id: S.user.id, favoritos: S.favs, passos: S.checks, busca: S.busca,
      autoriza_contato: S.autoriza, autorizado_em: S.autoriza ? (S.autorizadoEm ?? (S.autorizadoEm = new Date().toISOString())) : null, atualizado_em: new Date().toISOString() });
    if (error) throw error;
  };

  // catálogo público (veículos ativos + garagens)
  CF.carregaCatalogo = async force => {
    if (S.veiculos && !force) return;
    if (!sb) throw new Error('sem-supabase');
    const [v, g] = await Promise.all([
      sb.from('veiculos').select('*').eq('status', 'ativo').order('criado_em', { ascending: false }).limit(500),
      sb.from('garagens').select('id,nome,cidade,uf,demo')
    ]);
    if (v.error || g.error) throw (v.error || g.error);
    S.veiculos = v.data ?? [];
    S.garagens = Object.fromEntries((g.data ?? []).map(x => [x.id, x]));
  };

  // dados da conta após o login
  const carregaConta = async () => {
    const uid = S.user.id;
    const [p, pr, tg, td, it] = await Promise.all([
      sb.from('perfis').select('*').eq('id', uid).maybeSingle(),
      sb.from('preferencias').select('favoritos,passos,busca,autoriza_contato,autorizado_em').eq('user_id', uid).maybeSingle(),
      sb.from('garagem_contatos').select('garagem_id,telefone'),
      sb.from('contatos').select('chave,telefone'),
      sb.from('interesses').select('veiculo_id').eq('comprador_id', uid)
    ]);
    S.perfil = p.data ?? null;
    S.garagem = null;
    S.priv = null;
    if (S.perfil?.papel === 'garagista') {
      S.garagem = (await sb.from('garagens').select('*').eq('owner_id', uid).maybeSingle()).data ?? null;
      if (S.garagem) S.priv = (await sb.from('garagem_privado').select('cnpj,creditos').eq('garagem_id', S.garagem.id).maybeSingle()).data ?? null;
    }
    S.assin = S.garagem ? ((await sb.rpc('minha_assinatura')).data ?? null) : null;
    S.admin = (await sb.rpc('sou_admin')).data === true;
    S.autoriza = pr.data?.autoriza_contato === true; S.autorizadoEm = pr.data?.autorizado_em ?? null;
    S.telG = Object.fromEntries((tg.data ?? []).map(x => [x.garagem_id, x.telefone]));
    S.telD = Object.fromEntries((td.data ?? []).map(x => [x.chave, x.telefone])); S.telsOk = true;
    S.enviados = new Set((it.data ?? []).map(x => x.veiculo_id));
    // junta o que estava no aparelho com o que está na conta
    S.favs = [...new Set([...(pr.data?.favoritos ?? []), ...S.favs])];
    S.checks = [...new Set([...(pr.data?.passos ?? []), ...S.checks])];
    const bd = pr.data?.busca ?? {};
    S.busca = Object.keys(bd).length ? bd : S.busca;
    await CF.salvaPrefs();
    CF.push?.sincroniza().catch(() => {});
  };
  CF.recarregaConta = carregaConta;

  const mudouUsuario = async sessao => {
    const novo = sessao?.user ?? null;
    if (novo?.id === S.user?.id) return; // renovação de token
    S.user = novo;
    if (novo) { try { await carregaConta(); } catch { /* segue com dados locais */ } }
    else { // não deixa dados de uma conta em aparelho compartilhado
      Object.assign(S, { perfil: null, garagem: null, priv: null, assin: null, admin: false, autoriza: false, autorizadoEm: null, telG: {}, telD: {}, telsOk: false, enviados: new Set(), favs: [], checks: [], busca: {} });
      CF.guardaLocal();
    }
    CF.aoMudar?.();
  };

  CF.iniciaAuth = () => {
    if (!sb) return;
    sb.auth.onAuthStateChange((evento, sessao) => setTimeout(async () => {
      await mudouUsuario(sessao);
      if (evento === 'PASSWORD_RECOVERY') location.hash = '#/nova-senha';
    }, 0));
  };

  CF.traduzErro = e => {
    const m = (e?.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
    if (m.includes('not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (m.includes('password')) return 'Senha inválida ou fraca. Use ao menos 8 caracteres.';
    if (e?.status === 429 || m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    return 'Não foi possível concluir. Tente novamente.';
  };

  // ações globais por data-acao
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-acao]'); if (!el) return;
    const fn = CF.acoes[el.dataset.acao]; if (fn) { e.preventDefault(); fn(el, e); }
  });
})();
