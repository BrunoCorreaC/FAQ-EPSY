// Roteador (hash) e os três portais isolados: cada portal só conhece as próprias telas e o próprio menu.
(() => {
  const app = document.getElementById('app');
  const S = CF.s;
  let tok = 0;

  const PUBLICAS = ['entrar', 'nova-senha', 'privacidade', 'termos', 'suporte'];
  const PORTAIS = {
    cliente: {
      inicio: 'carros', rotulo: '',
      rotas: ['carros', 'carro', 'voce', 'preferencias', 'favoritos', 'guia', 'despachantes', 'simulador', 'entrar', 'nova-senha', 'perfil', 'conta', 'privacidade', 'termos', 'suporte'],
      nav: () => [['#/', 'carros', 'car', 'Carros'], ['#/voce', 'voce', 'spark', 'Para você'], ['#/favoritos', 'favoritos', 'heart', 'Favoritos'], ['#/guia', 'guia', 'guide', 'Guia'],
        S.user ? ['#/conta', 'conta', 'user', 'Conta'] : ['#/entrar', 'entrar', 'user', 'Entrar']],
      ativa: { carro: 'carros', preferencias: 'voce', simulador: 'guia', despachantes: 'guia', perfil: 'conta', 'nova-senha': 'conta' }
    },
    loja: {
      inicio: 'painel', rotulo: 'Portal da Loja', privado: true,
      rotas: ['painel', 'veiculo', 'interessados', 'demanda', 'radar', 'assinatura', 'entrar', 'nova-senha', 'perfil', 'conta', 'privacidade', 'termos', 'suporte'],
      nav: () => S.user && S.garagem ? [['#/painel', 'painel', 'store', 'Estoque'], ['#/demanda', 'demanda', 'spark', 'Clientes buscando'], ['#/interessados', 'interessados', 'chat', 'Interessados'],
        ['#/radar', 'radar', 'chart', 'Radar'], ['#/conta', 'conta', 'user', 'Conta']] : [],
      ativa: { veiculo: 'painel', assinatura: 'conta', perfil: 'conta', 'nova-senha': 'conta' }
    },
    admin: {
      inicio: 'admin', rotulo: 'Administração', privado: true,
      rotas: ['admin', 'entrar', 'nova-senha'],
      nav: () => S.user && S.admin ? (CF.ABAS_ADMIN ?? []).map(([k, t, i]) => [`#/admin${k ? '/' + k : ''}`, `admin:${k}`, i, t]) : [],
      ativa: {}
    }
  };
  CF.PORTAIS = PORTAIS;

  // conta de outro perfil: não mostra nada deste portal, só a saída
  const bloqueio = () => {
    const p = CF.portal;
    const txt = {
      admin: ['Acesso restrito', 'Esta conta não tem permissão para a administração.'],
      loja: ['Esta conta é de cliente', 'O Portal da Loja é só para garagens. Para anunciar, crie uma conta de loja com outro e-mail.'],
      cliente: ['Esta conta é de uma loja', 'O app do cliente é para quem procura carro. Gerencie sua loja pelo Portal da Loja.']
    }[p];
    const ir = p === 'cliente' ? `<a class="btn sec" href="${CF.cfg.urlLoja ?? 'loja.html'}">Abrir o Portal da Loja</a>` : '';
    return { html: `<section class="pagina estreita vazio bloqueio">${CF.ico('lock')}<h2>${txt[0]}</h2><p>${txt[1]}</p><div class="acoes">${ir}<button class="btn" data-acao="sair">Sair desta conta</button></div></section>` };
  };

  const rotaAtual = () => {
    const [caminho, qs] = (location.hash.slice(1) || '/').split('?');
    const [, nome = '', a, b] = caminho.split('/');
    return { nome, a, b, params: new URLSearchParams(qs || '') };
  };

  CF.render = async () => {
    const meu = ++tok;
    const P = PORTAIS[CF.portal] ?? PORTAIS.cliente;
    const { nome, a, b, params } = rotaAtual();
    let chave = nome || P.inicio;
    app.onchange = null;
    let r;
    if (!P.rotas.includes(chave)) r = { html: `<section class="pagina vazio"><h2>Página não encontrada</h2><a class="btn" href="#/">Voltar ao início</a></section>` };
    else {
      if (P.privado && !S.user && !PUBLICAS.includes(chave)) chave = 'entrar';
      const outro = S.user && !PUBLICAS.includes(chave) && (
        CF.portal === 'admin' ? !S.admin : S.perfil && S.perfil.papel !== CF.PAPEL_DO_PORTAL[CF.portal]);
      if (outro) r = bloqueio();
      else {
        app.setAttribute('aria-busy', 'true');
        try { r = await CF.rotas[chave](a, b, params); }
        catch (e) { console.error(e); r = { html: '<section class="pagina vazio"><h2>Algo deu errado</h2><p>Tente novamente.</p><button class="btn" data-acao="recarrega">Recarregar</button></section>' }; }
      }
    }
    if (meu !== tok) return; // outra navegação começou
    app.innerHTML = r.html; app.removeAttribute('aria-busy');
    app.querySelectorAll('form').forEach(f => { f.noValidate = true; }); // as mensagens de validação são as do app
    r.bind?.();
    pintaMoldura(chave === 'admin' ? `admin:${a ?? ''}` : (P.ativa[chave] ?? chave));
    window.scrollTo(0, 0);
  };

  const pintaMoldura = ativa => {
    const P = PORTAIS[CF.portal] ?? PORTAIS.cliente;
    document.title = P.rotulo ? `${P.rotulo} · ${CF.marca}` : CF.marca;
    document.querySelectorAll('[data-marca]').forEach(e => { e.textContent = CF.marca; });
    document.querySelectorAll('[data-rotulo-portal]').forEach(e => { e.textContent = P.rotulo; e.hidden = !P.rotulo; });
    const itens = P.nav();
    const abas = document.getElementById('abas');
    abas.innerHTML = itens.map(([h, k, i, t]) =>
      `<a href="${h}" class="${k === ativa ? 'ativa' : ''}" ${k === ativa ? 'aria-current="page"' : ''}><span aria-hidden="true">${CF.ico(i)}</span><b>${t}</b></a>`).join('')
      + (CF.portal !== 'cliente' && S.user ? `<button class="sair-nav" data-acao="sair"><span aria-hidden="true">${CF.ico('lock')}</span><b>Sair</b></button>` : '');
    abas.hidden = !itens.length;
    document.body.classList.toggle('sem-nav', !itens.length);
    const c = document.getElementById('conta-link');
    if (c) {
      c.hidden = !CF.sb || CF.portal !== 'cliente';
      c.innerHTML = S.user ? `${CF.ico('user')}<span>Conta</span>` : 'Entrar';
      c.setAttribute('href', S.user ? '#/conta' : '#/entrar'); c.setAttribute('aria-label', S.user ? 'Minha conta' : 'Entrar');
    }
    const f = document.getElementById('fav-link'); if (f) f.hidden = CF.portal !== 'cliente';
    const ro = document.getElementById('rodape'); if (ro) ro.hidden = CF.portal === 'admin';
  };

  CF.aoMudar = () => {
    const h = location.hash.split('?')[0];
    if (S.user && !S.perfil && CF.portal !== 'admin' && !['#/perfil', '#/nova-senha', '#/privacidade', '#/termos'].includes(h)) { location.hash = '#/perfil'; return; }
    CF.render();
  };

  CF.inicia = () => {
    if (CF.portal === 'admin') CF.adminAbas = () => ''; // no admin as abas viram o menu lateral
    window.addEventListener('hashchange', CF.render);
    CF.guardaLocal();
    CF.iniciaAuth();
    CF.render();
  };
  CF.inicia();

  if (!CF.nativo && CF.portal === 'cliente' && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
