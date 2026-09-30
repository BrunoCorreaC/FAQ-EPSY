// Web Push: permissão, assinatura e cartão de ativação (Android/desktop direto; iPhone só com o app na tela inicial)
(() => {
  const { s: S } = CF;
  const cfg = window.CF_CONFIG || {};
  const suportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalado = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  const registro = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('sw')), 2500))]);
  const assinatura = async () => { try { return await (await registro()).pushManager.getSubscription(); } catch { return null; } };

  const grava = async sub => {
    const j = sub.toJSON();
    return CF.sb.from('push_subscriptions').upsert({ user_id: S.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
  };

  const P = CF.push = {
    suportado,
    async estado() {
      if (!CF.sb || !cfg.vapidPublicKey || !suportado()) return 'nao-suportado';
      if (ios() && !instalado()) return 'ios-instalar';
      if (Notification.permission === 'denied') return 'bloqueado';
      return (await assinatura()) ? 'ativo' : 'inativo';
    },
    async ativar() {
      if (await Notification.requestPermission() !== 'granted') return false;
      const reg = await registro();
      const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.vapidPublicKey) });
      const { error } = await grava(sub);
      return !error;
    },
    async desativar() {
      const sub = await assinatura(); if (!sub) return;
      await CF.sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    },
    // após o login: se este aparelho já tem permissão e assinatura, vincula à conta atual sem perguntar de novo
    async sincroniza() {
      if (!CF.sb || !S.user || !suportado() || Notification.permission !== 'granted') return;
      const sub = await assinatura(); if (sub) await grava(sub);
    },
    // ao sair: desvincula o aparelho da conta (o navegador continua com a assinatura para o próximo login)
    async desvincula() {
      const sub = await assinatura(); if (sub && S.user) await CF.sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    },
    cartao(titulo, detalhe) {
      return `<div class="card push" id="push-card"><h3>${titulo}</h3><p class="meta">${detalhe}</p><div id="push-acao"></div></div>`;
    },
    async liga() {
      const box = document.getElementById('push-acao'); if (!box) return;
      const e = await P.estado();
      const msgs = {
        'nao-suportado': '<p class="meta">Este aparelho ou navegador não permite avisos.</p>',
        'ios-instalar': '<p class="meta">No iPhone, toque em <strong>Compartilhar</strong> e em <strong>Adicionar à Tela de Início</strong>. Depois abra o app por lá e volte aqui para ativar.</p>',
        'bloqueado': '<p class="meta">Os avisos estão bloqueados. Libere as notificações deste site nas configurações do navegador.</p>',
        'ativo': '<p class="ok">Avisos ativados neste aparelho.</p><button class="btn-link" data-acao="pushDesativa">Desativar</button>',
        'inativo': '<button class="btn" data-acao="pushAtiva">Ativar avisos neste aparelho</button>'
      };
      box.innerHTML = msgs[e];
    }
  };
  CF.acoes.pushAtiva = async () => { const ok = await P.ativar(); CF.toast(ok ? 'Avisos ativados!' : 'Não foi possível ativar os avisos.'); P.liga(); };
  CF.acoes.pushDesativa = async () => { await P.desativar(); CF.toast('Avisos desativados.'); P.liga(); };
})();
