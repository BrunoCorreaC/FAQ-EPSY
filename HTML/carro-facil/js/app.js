(() => {
  const app = document.getElementById('app');
  const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTel = t => { const d = t.slice(2); return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
  const wa = (tel, msg) => `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;

  // ---- estado persistido (falha silenciosa se o storage estiver bloqueado) ----
  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignorado */ } }
  };
  let favs = store.get('cf_favs', []);
  let checks = store.get('cf_checks', []);
  let pos = null; // {lat,lng} do usuário, só em memória
  const filtro = { q: '', max: 100000, tipo: '', cambio: '', cidade: '' };

  // ---- login (Supabase); sem config/biblioteca o app segue funcionando sem conta ----
  const cfg = window.CF_CONFIG || {};
  const sb = (window.supabase && cfg.supabaseUrl && cfg.supabaseKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { flowType: 'pkce' } }) : null;
  let user = null;
  const bloqueio = '<a class="btn grande" href="#/entrar">🔒 Entre para ver o contato</a>';
  let tels = {}, telsOk = false; // chave -> telefone; vem do banco e só existe com login

  // botões de contato: 'grande' = versão da página do carro
  const botoesContato = (chave, msg, grande = false) => {
    if (!sb) return '<p class="meta">Contato indisponível no momento.</p>';
    if (!user) return bloqueio;
    const t = tels[chave];
    if (!t) return `<p class="meta">${telsOk ? 'Contato indisponível.' : 'Carregando contato…'}</p>`;
    return grande
      ? `<a class="btn zap grande" target="_blank" rel="noopener" href="${wa(t, msg)}">Falar no WhatsApp</a>
         <a class="btn grande sec" href="tel:+${t}">📞 Ligar</a>`
      : `<a class="btn" href="tel:+${t}">📞 Ligar ${fmtTel(t)}</a>
         <a class="btn zap" target="_blank" rel="noopener" href="${wa(t, msg)}">WhatsApp</a>`;
  };

  const atualizaFavCount = () => { document.getElementById('fav-count').textContent = favs.length; };
  const atualizaConta = () => {
    const a = document.getElementById('conta-link');
    a.hidden = !sb; a.textContent = user ? '👤 Conta' : 'Entrar'; a.setAttribute('href', user ? '#/conta' : '#/entrar');
  };
  const salvaPrefs = () => {
    if (!sb || !user) return;
    sb.from('preferencias').upsert({ user_id: user.id, favoritos: favs, passos: checks, atualizado_em: new Date().toISOString() }).then(() => {}, () => {});
  };
  const guardaLocal = () => { store.set('cf_favs', favs); store.set('cf_checks', checks); atualizaFavCount(); };
  const toggleFav = id => {
    favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    guardaLocal(); salvaPrefs();
  };
  // junta o que já estava no aparelho com o que está salvo na conta
  const carregaPrefs = async () => {
    const { data } = await sb.from('preferencias').select('favoritos,passos').eq('user_id', user.id).maybeSingle();
    favs = [...new Set([...(data?.favoritos ?? []), ...favs])];
    checks = [...new Set([...(data?.passos ?? []), ...checks])];
    guardaLocal(); salvaPrefs();
  };
  const carregaContatos = async () => {
    const { data } = await sb.from('contatos').select('chave,telefone');
    tels = Object.fromEntries((data ?? []).map(x => [x.chave, x.telefone])); telsOk = true;
  };
  const mudouUsuario = async sessao => {
    const novo = sessao?.user ?? null;
    if (novo?.id === user?.id) return; // renovação de token
    user = novo;
    if (user) { try { await Promise.all([carregaPrefs(), carregaContatos()]); } catch { /* segue com os dados locais */ } }
    else { tels = {}; telsOk = false; favs = []; checks = []; guardaLocal(); } // não deixa dados de uma conta em aparelho compartilhado
    atualizaConta(); rota();
  };
  const traduzErro = e => {
    const m = (e.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
    if (m.includes('not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (m.includes('password')) return 'Senha inválida ou fraca. Use ao menos 8 caracteres.';
    if (e.status === 429 || m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    return 'Não foi possível concluir. Tente novamente.';
  };

  const dist = (a, b) => {
    const r = x => x * Math.PI / 180, R = 6371;
    const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // ---- componentes ----
  const cardCarro = c => `
    <article class="card carro">
      <a class="thumb" href="#/carro/${c.id}" aria-label="${esc(c.marca + ' ' + c.modelo)}">
        <span class="cor" style="--c:${corCss(c.cor)}">🚗</span>
      </a>
      <div class="info">
        <h3><a href="#/carro/${c.id}">${esc(c.marca)} ${esc(c.modelo)}</a></h3>
        <p class="preco">${brl(c.preco)}</p>
        <p class="meta">${c.ano} · ${c.km.toLocaleString('pt-BR')} km · ${esc(c.cambio)}</p>
        <p class="meta">📍 ${esc(c.cidade)}</p>
      </div>
      <button class="fav ${favs.includes(c.id) ? 'on' : ''}" data-fav="${c.id}" aria-label="Favoritar" aria-pressed="${favs.includes(c.id)}">♥</button>
    </article>`;

  const corCss = n => ({ Branco: '#e8ecea', Preto: '#2b2f2e', Prata: '#c3c9c7', Cinza: '#8a918f', Vermelho: '#d64545', Azul: '#3b78c4', Laranja: '#ec8a2c' }[n] || '#ccc');

  const cardDesp = (d, km) => `
    <article class="card desp">
      <div>
        <h3>${esc(d.nome)}</h3>
        <p class="meta">📍 ${esc(d.bairro)}, ${esc(d.cidade)}${km != null ? ` · ${km.toFixed(km < 10 ? 1 : 0)} km de você` : ''}</p>
        <p class="meta">🕒 ${esc(d.horario)} · ⭐ ${d.nota.toFixed(1)}</p>
        <p class="tags">${d.servicos.map(s => `<span>${esc(s)}</span>`).join('')}</p>
      </div>
      <div class="acoes">
        ${botoesContato('d' + d.id, 'Olá! Vi seu contato no app Carro Fácil e preciso de ajuda com a documentação de um carro.')}
      </div>
    </article>`;

  // ---- telas ----
  const telas = {
    home() {
      const destaque = [...CARROS].sort((a, b) => a.preco - b.preco).slice(0, 4);
      return `
        <section class="hero">
          <h1>Seu primeiro carro,<br>sem complicação.</h1>
          <p>Veja carros à venda, fale com despachantes perto de você e siga um passo a passo simples.</p>
          <div class="hero-btns"><a class="btn grande" href="#/carros">Ver carros</a><a class="btn grande sec" href="#/guia">Como comprar</a></div>
        </section>
        <section><h2>Mais baratos do momento</h2>${destaque.map(cardCarro).join('')}<a class="link-mais" href="#/carros">Ver todos os carros →</a></section>
        <section><h2>Precisa de documentação?</h2>
          <p class="meta">Despachantes cuidam da transferência, licenciamento e emplacamento para você.</p>
          <a class="btn grande" href="#/despachantes">Encontrar despachante</a></section>`;
    },

    carros() {
      const tipos = [...new Set(CARROS.map(c => c.tipo))], cidades = [...new Set(CARROS.map(c => c.cidade))];
      return `
        <h2>Carros à venda</h2>
        <form class="filtros" id="filtros" onsubmit="return false">
          <input type="search" id="f-q" placeholder="Buscar marca ou modelo" value="${esc(filtro.q)}" aria-label="Buscar">
          <label>Preço até: <strong id="f-max-v">${brl(filtro.max)}</strong>
            <input type="range" id="f-max" min="30000" max="100000" step="5000" value="${filtro.max}"></label>
          <div class="linha">
            <select id="f-tipo" aria-label="Tipo"><option value="">Todos os tipos</option>${tipos.map(t => `<option ${filtro.tipo === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
            <select id="f-cambio" aria-label="Câmbio"><option value="">Qualquer câmbio</option><option ${filtro.cambio === 'Manual' ? 'selected' : ''}>Manual</option><option ${filtro.cambio === 'Automático' ? 'selected' : ''}>Automático</option></select>
            <select id="f-cidade" aria-label="Cidade"><option value="">Todas as cidades</option>${cidades.map(t => `<option ${filtro.cidade === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
          </div>
        </form>
        <div id="lista"></div>`;
    },

    carro(id) {
      const c = CARROS.find(x => x.id === +id);
      if (!c) return naoEncontrado();
      const desp = DESPACHANTES.filter(d => d.cidade === c.cidade);
      const msg = `Olá! Tenho interesse no ${c.marca} ${c.modelo} ${c.ano} (${brl(c.preco)}) que vi no app Carro Fácil. Ainda está disponível?`;
      return `
        <a class="voltar" href="#/carros">← Voltar</a>
        <div class="foto-grande" style="--c:${corCss(c.cor)}">🚗</div>
        <h2>${esc(c.marca)} ${esc(c.modelo)}</h2>
        <p class="preco grande">${brl(c.preco)}</p>
        <dl class="specs">
          <div><dt>Ano</dt><dd>${c.ano}</dd></div><div><dt>Km</dt><dd>${c.km.toLocaleString('pt-BR')}</dd></div>
          <div><dt>Câmbio</dt><dd>${esc(c.cambio)}</dd></div><div><dt>Combustível</dt><dd>${esc(c.combustivel)}</dd></div>
          <div><dt>Tipo</dt><dd>${esc(c.tipo)}</dd></div><div><dt>Cor</dt><dd>${esc(c.cor)}</dd></div>
        </dl>
        <p>${esc(c.obs)}</p>
        <p class="meta">Vendedor: ${esc(c.vendedor)} · 📍 ${esc(c.cidade)}</p>
        <div class="acoes fixa">
          ${botoesContato('c' + c.id, msg, true)}
          <button class="btn grande sec" data-fav="${c.id}">${favs.includes(c.id) ? '♥ Favorito' : '♡ Favoritar'}</button>
        </div>
        <div class="aviso">💡 Antes de fechar: peça laudo cautelar e consulte débitos. <a href="#/guia">Ver guia</a></div>
        ${desp.length ? `<h3>Despachantes em ${esc(c.cidade)}</h3>${desp.map(d => cardDesp(d)).join('')}` : ''}
        <p><a href="#/simulador?valor=${c.preco}">Simular financiamento deste carro →</a></p>`;
    },

    favoritos() {
      const lista = CARROS.filter(c => favs.includes(c.id));
      return `<h2>Meus favoritos</h2>${lista.length ? lista.map(cardCarro).join('') : '<p class="vazio">Você ainda não favoritou nenhum carro. Toque no ♥ para salvar.</p>'}`;
    },

    despachantes() {
      return `
        <h2>Despachantes</h2>
        <p class="meta">Profissionais que resolvem a documentação do carro no Detran.</p>
        <button class="btn grande sec" id="btn-loc">📍 Ordenar por proximidade</button>
        <p class="meta" id="loc-msg" role="status"></p>
        <div id="lista-desp"></div>`;
    },

    guia() {
      return `
        <h2>Guia do primeiro carro</h2>
        <p class="meta">Marque cada passo conforme for avançando.</p>
        <ol class="passos">${PASSOS.map((p, i) => `
          <li><label><input type="checkbox" data-passo="${i}" ${checks.includes(i) ? 'checked' : ''}>
            <span><strong>${esc(p.t)}</strong><br><small>${esc(p.d)}</small></span></label></li>`).join('')}</ol>
        <h3>Documentos que você vai precisar</h3>
        <ul class="docs">${DOCUMENTOS.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
        <a class="btn grande" href="#/despachantes">Falar com um despachante</a>`;
    },

    entrar() {
      if (!sb) return '<p class="vazio">Login indisponível: configure o Supabase em <code>js/config.js</code>.</p>';
      if (user) return '<p class="vazio">Você já está conectado. <a href="#/conta">Ir para a conta</a></p>';
      return `
        <h2 id="a-titulo">Entrar</h2>
        <p class="meta">Com uma conta você vê os contatos de vendedores e despachantes e salva favoritos e o progresso do guia.</p>
        <button class="btn grande sec" id="a-google" type="button">Continuar com Google</button>
        <p class="meta ou">ou use e-mail e senha</p>
        <form class="sim" id="a-form">
          <label>E-mail<input type="email" id="a-email" autocomplete="email" required></label>
          <label>Senha<input type="password" id="a-senha" autocomplete="current-password" minlength="8" required></label>
          <button class="btn grande" id="a-ok" type="submit">Entrar</button>
        </form>
        <button class="btn-link" id="a-troca" type="button">Não tem conta? Criar conta</button>
        <button class="btn-link" id="a-esqueci" type="button">Esqueci a senha</button>
        <p class="meta" id="a-msg" role="status"></p>`;
    },

    conta() {
      if (!user) return '<p class="vazio">Você não está conectado. <a href="#/entrar">Entrar</a></p>';
      const g = user.app_metadata?.provider === 'google' ? 'Google' : 'e-mail e senha';
      return `
        <h2>Minha conta</h2>
        <div class="card"><p><strong>${esc(user.email || '')}</strong></p><p class="meta">Login com ${g}</p>
          <p class="meta">${favs.length} favorito(s) · ${checks.length} de ${PASSOS.length} passos do guia concluídos</p></div>
        <button class="btn grande sec" id="a-sair" type="button">Sair</button>`;
    },

    'nova-senha'() {
      if (!user) return '<p class="vazio">Link expirado. <a href="#/entrar">Voltar ao login</a></p>';
      return `
        <h2>Nova senha</h2>
        <form class="sim" id="n-form">
          <label>Nova senha<input type="password" id="n-senha" autocomplete="new-password" minlength="8" required></label>
          <button class="btn grande" type="submit">Salvar senha</button>
        </form>
        <p class="meta" id="n-msg" role="status"></p>`;
    },

    simulador(_, params) {
      const v = Math.max(0, Math.min(1e7, +params.get('valor') || 50000));
      return `
        <h2>Simulador de financiamento</h2>
        <p class="meta">Estimativa simples (parcelas fixas). Consulte o banco para taxas reais.</p>
        <form class="sim" id="sim" onsubmit="return false">
          <label>Valor do carro (R$)<input type="number" id="s-valor" min="0" step="500" value="${v}" inputmode="numeric"></label>
          <label>Entrada (R$)<input type="number" id="s-ent" min="0" step="500" value="${Math.round(v * 0.3)}" inputmode="numeric"></label>
          <label>Prazo (meses)<select id="s-prazo">${[12, 24, 36, 48, 60].map(m => `<option ${m === 48 ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label>Juros ao mês (%)<input type="number" id="s-juros" min="0" step="0.1" value="1.9" inputmode="decimal"></label>
        </form>
        <div class="resultado" id="sim-res" role="status"></div>`;
    }
  };

  const naoEncontrado = () => `<p class="vazio">Página não encontrada. <a href="#/">Voltar ao início</a></p>`;

  // ---- interações por tela ----
  const ligacoes = {
    carros() {
      const $ = id => document.getElementById(id);
      const render = () => {
        const q = filtro.q.trim().toLowerCase();
        const r = CARROS.filter(c =>
          (`${c.marca} ${c.modelo}`.toLowerCase().includes(q)) && c.preco <= filtro.max &&
          (!filtro.tipo || c.tipo === filtro.tipo) && (!filtro.cambio || c.cambio === filtro.cambio) &&
          (!filtro.cidade || c.cidade === filtro.cidade)).sort((a, b) => a.preco - b.preco);
        $('lista').innerHTML = r.length ? `<p class="meta">${r.length} carro(s) encontrado(s)</p>${r.map(cardCarro).join('')}` : '<p class="vazio">Nenhum carro com esses filtros. Tente aumentar o preço.</p>';
      };
      $('f-q').oninput = e => { filtro.q = e.target.value; render(); };
      $('f-max').oninput = e => { filtro.max = +e.target.value; $('f-max-v').textContent = brl(filtro.max); render(); };
      $('f-tipo').onchange = e => { filtro.tipo = e.target.value; render(); };
      $('f-cambio').onchange = e => { filtro.cambio = e.target.value; render(); };
      $('f-cidade').onchange = e => { filtro.cidade = e.target.value; render(); };
      render();
    },

    despachantes() {
      const render = () => {
        const l = DESPACHANTES.map(d => ({ d, km: pos ? dist(pos, d) : null }));
        if (pos) l.sort((a, b) => a.km - b.km);
        document.getElementById('lista-desp').innerHTML = l.map(x => cardDesp(x.d, x.km)).join('');
      };
      document.getElementById('btn-loc').onclick = () => {
        const msg = document.getElementById('loc-msg');
        if (!navigator.geolocation) { msg.textContent = 'Seu navegador não suporta localização.'; return; }
        msg.textContent = 'Buscando sua localização…';
        navigator.geolocation.getCurrentPosition(
          p => { pos = { lat: p.coords.latitude, lng: p.coords.longitude }; msg.textContent = 'Ordenado do mais próximo ao mais distante.'; render(); },
          () => { msg.textContent = 'Não foi possível obter a localização. Permita o acesso e tente de novo.'; },
          { timeout: 10000 });
      };
      render();
    },

    entrar() {
      const $ = id => document.getElementById(id);
      const msg = t => { $('a-msg').textContent = t; };
      const volta = () => location.origin + location.pathname;
      let criar = false;
      $('a-troca').onclick = () => {
        criar = !criar;
        $('a-titulo').textContent = criar ? 'Criar conta' : 'Entrar';
        $('a-ok').textContent = criar ? 'Criar conta' : 'Entrar';
        $('a-troca').textContent = criar ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta';
        $('a-senha').autocomplete = criar ? 'new-password' : 'current-password';
        msg('');
      };
      $('a-google').onclick = async () => {
        const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volta() } });
        if (error) msg('Login com Google indisponível no momento.');
      };
      $('a-esqueci').onclick = async () => {
        const email = $('a-email').value.trim();
        if (!email) { msg('Digite seu e-mail acima e toque de novo em "Esqueci a senha".'); return; }
        await sb.auth.resetPasswordForEmail(email, { redirectTo: volta() });
        msg('Se esse e-mail tiver conta, enviaremos um link para criar uma nova senha.');
      };
      $('a-form').onsubmit = async e => {
        e.preventDefault();
        const email = $('a-email').value.trim(), password = $('a-senha').value;
        $('a-ok').disabled = true; msg('Aguarde…');
        const r = criar ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: volta() } })
                        : await sb.auth.signInWithPassword({ email, password });
        $('a-ok').disabled = false;
        if (r.error) { msg(traduzErro(r.error)); return; }
        if (criar && !r.data.session) { msg('Enviamos um e-mail de confirmação. Confirme para entrar.'); return; }
        location.hash = '#/';
      };
    },

    conta() {
      const b = document.getElementById('a-sair'); if (!b) return;
      b.onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; };
    },

    'nova-senha'() {
      const f = document.getElementById('n-form'); if (!f) return;
      f.onsubmit = async e => {
        e.preventDefault();
        const { error } = await sb.auth.updateUser({ password: document.getElementById('n-senha').value });
        document.getElementById('n-msg').textContent = error ? traduzErro(error) : 'Senha alterada!';
        if (!error) setTimeout(() => { location.hash = '#/conta'; }, 800);
      };
    },

    guia() {
      app.onchange = e => {
        const i = e.target.dataset.passo; if (i == null) return;
        checks = e.target.checked ? [...new Set([...checks, +i])] : checks.filter(x => x !== +i);
        guardaLocal(); salvaPrefs();
      };
    },

    simulador() {
      const $ = id => document.getElementById(id);
      const calc = () => {
        const valor = +$('s-valor').value || 0, ent = Math.min(+$('s-ent').value || 0, valor);
        const n = +$('s-prazo').value, i = (+$('s-juros').value || 0) / 100, fin = valor - ent;
        const parc = fin <= 0 ? 0 : i === 0 ? fin / n : fin * i / (1 - Math.pow(1 + i, -n));
        const total = parc * n + ent;
        $('sim-res').innerHTML = `
          <p>Valor financiado: <strong>${brl(fin)}</strong></p>
          <p class="preco grande">${n}x de ${brl(parc)}</p>
          <p>Total pago: <strong>${brl(total)}</strong> (juros: ${brl(Math.max(0, total - valor))})</p>
          <p class="meta">Some ao orçamento: IPVA, seguro, combustível e manutenção.</p>`;
      };
      $('sim').oninput = calc; calc();
    }
  };

  // ---- roteador (hash) ----
  function rota() {
    const [caminho, qs] = (location.hash.slice(1) || '/').split('?');
    const [, nome = 'home', arg] = caminho.split('/');
    const params = new URLSearchParams(qs || '');
    const tela = telas[nome || 'home'];
    app.onchange = null;
    app.innerHTML = tela ? tela(arg, params) : naoEncontrado();
    if (tela && ligacoes[nome]) ligacoes[nome]();
    const aba = ['carros', 'carro'].includes(nome) ? 'carros' : nome === 'favoritos' ? '' : nome || 'home';
    document.querySelectorAll('.abas a').forEach(a => a.classList.toggle('ativa', a.dataset.tab === aba));
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  // delegação para o botão de favoritos
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]'); if (!b) return;
    toggleFav(+b.dataset.fav);
    const on = favs.includes(+b.dataset.fav);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    if (b.classList.contains('btn')) b.textContent = on ? '♥ Favorito' : '♡ Favoritar';
    if (location.hash === '#/favoritos') rota();
  });

  window.addEventListener('hashchange', rota);
  atualizaFavCount();
  atualizaConta();
  rota();
  if (sb) {
    // não chamar o Supabase direto dentro do callback (risco de travar): adia com setTimeout
    sb.auth.onAuthStateChange((evento, sessao) => setTimeout(async () => {
      await mudouUsuario(sessao);
      if (evento === 'PASSWORD_RECOVERY') location.hash = '#/nova-senha';
    }, 0));
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
