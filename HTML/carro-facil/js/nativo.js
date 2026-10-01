// App das lojas (Capacitor): detecção da plataforma, login social pelo navegador do sistema e retorno por link profundo.
// No navegador comum nada disso muda: CF.nativo = false e CF.redirect() devolve a URL da página.
(() => {
  const C = window.Capacitor, cfg = window.CF_CONFIG || {};
  CF.nativo = !!C?.isNativePlatform?.();
  CF.plataforma = CF.nativo ? C.getPlatform() : 'web';
  // Apple: bens digitais pedem compra no app. Até a decisão sobre assinatura, o iOS não mostra instruções de pagamento.
  CF.semPagamento = CF.plataforma === 'ios';
  CF.plugin = nome => C?.Plugins?.[nome];
  CF.redirect = () => CF.nativo ? `${cfg.appScheme || 'com.cademeucarro.app'}://auth` : location.origin + location.pathname;

  // login social: no app abre o navegador do sistema (Google/Apple não aceitam webview) e volta pelo esquema do app
  CF.oauth = async provider => {
    const { data, error } = await CF.sb.auth.signInWithOAuth({ provider, options: { redirectTo: CF.redirect(), skipBrowserRedirect: CF.nativo } });
    if (error) throw error;
    if (CF.nativo && data?.url) await CF.plugin('Browser')?.open({ url: data.url });
  };

  if (!CF.nativo) return;
  const esquema = (cfg.appScheme || 'com.cademeucarro.app') + '://';
  CF.plugin('App')?.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith(esquema)) return;
    try { await CF.plugin('Browser')?.close(); } catch { /* já fechado */ }
    const u = new URL(url.replace(esquema, 'https://app.local/'));
    const frag = new URLSearchParams(u.hash.replace(/^#/, ''));
    try {
      if (u.searchParams.get('code')) await CF.sb.auth.exchangeCodeForSession(u.searchParams.get('code'));
      else if (frag.get('access_token') && frag.get('refresh_token')) await CF.sb.auth.setSession({ access_token: frag.get('access_token'), refresh_token: frag.get('refresh_token') });
      else if (u.searchParams.get('error_description')) CF.toast('Não foi possível entrar: ' + u.searchParams.get('error_description'));
    } catch (e) { CF.toastErro?.(e); }
  });
  document.documentElement.classList.add('nativo', 'nativo-' + CF.plataforma);
})();
