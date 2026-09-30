// Roteador (hash), navegação por perfil e inicialização
(() => {
  const app = document.getElementById('app');
  const S = CF.s;
  let tok = 0;

  const navItens = () => {
    const g = CF.papel() === 'garagista';
    if (g) return [['#/', 'carros', '🚗', 'Carros'], ['#/painel', 'painel', '🏪', 'Meus veículos'], ['#/interessados', 'interessados', '💬', 'Interessados'], ['#/conta', 'conta', '👤', 'Conta']];
    return [['#/', 'carros', '🚗', 'Carros'], ['#/voce', 'voce', '✨', 'Para você'], ['#/despachantes', 'despachantes', '📞', 'Despachantes'], ['#/guia', 'guia', '📋', 'Guia'],
      S.user ? ['#/conta', 'conta', '👤', 'Conta'] : ['#/entrar', 'entrar', '👤', 'Entrar']];
  };

  CF.render = async () => {
    const meu = ++tok;
    const [caminho, qs] = (location.hash.slice(1) || '/').split('?');
    const [, nome = '', a, b] = caminho.split('/');
    const chave = nome || 'carros';
    const rota = CF.rotas[chave];
    const params = new URLSearchParams(qs || '');
    app.onchange = null;
    let r;
    if (!rota) r = { html: '<section class="pagina vazio"><p>Página não encontrada.</p><a class="btn" href="#/">Ver carros</a></section>' };
    else {
      app.setAttribute('aria-busy', 'true');
      try { r = await rota(a, b, params); } catch { r = { html: '<section class="pagina vazio"><p>Algo deu errado. Tente novamente.</p><button class="btn" data-acao="recarrega">Recarregar</button></section>' }; }
    }
    if (meu !== tok) return; // outra navegação começou
    app.innerHTML = r.html; app.removeAttribute('aria-busy');
    r.bind?.();
    const ativa = { carro: 'carros', veiculo: 'painel', preferencias: 'voce', favoritos: '', simulador: 'guia', perfil: 'conta', 'nova-senha': 'conta' }[chave] ?? chave;
    document.getElementById('abas').innerHTML = navItens().map(([h, k, i, t]) =>
      `<a href="${h}" class="${k === ativa ? 'ativa' : ''}" ${k === ativa ? 'aria-current="page"' : ''}><span aria-hidden="true">${i}</span>${t}</a>`).join('');
    const c = document.getElementById('conta-link'); c.hidden = !CF.sb;
    c.textContent = S.user ? '👤' : 'Entrar'; c.setAttribute('href', S.user ? '#/conta' : '#/entrar');
    c.setAttribute('aria-label', S.user ? 'Minha conta' : 'Entrar');
    window.scrollTo(0, 0);
  };

  CF.aoMudar = () => {
    if (S.user && !S.perfil && !['#/perfil', '#/nova-senha'].includes(location.hash.split('?')[0])) { location.hash = '#/perfil'; return; }
    CF.render();
  };

  window.addEventListener('hashchange', CF.render);
  CF.guardaLocal();
  CF.iniciaAuth();
  CF.render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
