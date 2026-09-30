// Núcleo: helpers, estado, Supabase (sessão, perfil, catálogo, preferências)
(() => {
  const CF = window.CF = { acoes: {}, rotas: {} };

  CF.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CF.brl = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  CF.num = n => Number(n).toLocaleString('pt-BR');
  CF.fmtTel = t => { const d = String(t).slice(2); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; };
  CF.normTel = s => { let d = String(s).replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return /^55\d{10,11}$/.test(d) ? d : null; };
  CF.wa = (tel, msg) => `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;

  CF.store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage bloqueado */ } }
  };

  const cfg = window.CF_CONFIG || {};
  const sb = CF.sb = (window.supabase && cfg.supabaseUrl && cfg.supabaseKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { flowType: 'pkce' } }) : null;

  // estado
  const S = CF.s = {
    user: null, perfil: null, garagem: null,
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
    await sb.from('preferencias').upsert({ user_id: S.user.id, favoritos: S.favs, passos: S.checks, busca: S.busca, atualizado_em: new Date().toISOString() });
  };

  // catálogo público (veículos ativos + garagens)
  CF.carregaCatalogo = async force => {
    if (S.veiculos && !force) return;
    if (!sb) throw new Error('sem-supabase');
    const [v, g] = await Promise.all([
      sb.from('veiculos').select('*').eq('status', 'ativo').order('criado_em', { ascending: false }).limit(500),
      sb.from('garagens').select('id,nome,cidade,uf')
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
      sb.from('preferencias').select('favoritos,passos,busca').eq('user_id', uid).maybeSingle(),
      sb.from('garagem_contatos').select('garagem_id,telefone'),
      sb.from('contatos').select('chave,telefone'),
      sb.from('interesses').select('veiculo_id').eq('comprador_id', uid)
    ]);
    S.perfil = p.data ?? null;
    S.garagem = null;
    if (S.perfil?.papel === 'garagista') S.garagem = (await sb.from('garagens').select('*').eq('owner_id', uid).maybeSingle()).data ?? null;
    S.telG = Object.fromEntries((tg.data ?? []).map(x => [x.garagem_id, x.telefone]));
    S.telD = Object.fromEntries((td.data ?? []).map(x => [x.chave, x.telefone])); S.telsOk = true;
    S.enviados = new Set((it.data ?? []).map(x => x.veiculo_id));
    // junta o que estava no aparelho com o que está na conta
    S.favs = [...new Set([...(pr.data?.favoritos ?? []), ...S.favs])];
    S.checks = [...new Set([...(pr.data?.passos ?? []), ...S.checks])];
    const bd = pr.data?.busca ?? {};
    S.busca = Object.keys(bd).length ? bd : S.busca;
    await CF.salvaPrefs();
  };
  CF.recarregaConta = carregaConta;

  const mudouUsuario = async sessao => {
    const novo = sessao?.user ?? null;
    if (novo?.id === S.user?.id) return; // renovação de token
    S.user = novo;
    if (novo) { try { await carregaConta(); } catch { /* segue com dados locais */ } }
    else { // não deixa dados de uma conta em aparelho compartilhado
      Object.assign(S, { perfil: null, garagem: null, telG: {}, telD: {}, telsOk: false, enviados: new Set(), favs: [], checks: [], busca: {} });
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
