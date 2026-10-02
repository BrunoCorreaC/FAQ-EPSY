// Conta, perfil (cliente/garagista) e área do garagista: veículos, fotos e interessados
(() => {
  const { esc, brl, num, s: S } = CF;
  const $ = id => document.getElementById(id);
  const opt = (lista, sel) => lista.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const soDigitos = t => String(t ?? '').replace(/\D/g, '');
  const validaCNPJ = c => {
    if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
    const dv = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return dv(12) === +c[12] && dv(13) === +c[13];
  };
  const fmtCnpj = c => c ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '';
  const soGaragista = (precisaAprovada = false) => CF.papel() === 'garagista' && S.garagem && (!precisaAprovada || CF.liberada())
    ? null
    : CF.papel() === 'garagista' && S.garagem
    ? { html: `<section class="pagina vazio"><h2>${S.garagem.status_aprovacao === 'aprovada' ? 'Assinatura pendente' : 'Cadastro em análise'}</h2><p>${S.garagem.status_aprovacao === 'aprovada' ? 'Para anunciar veículos, a assinatura da sua garagem precisa estar ativa.' : 'Você poderá anunciar veículos assim que a sua garagem for aprovada.'}</p><a class="btn" href="${S.garagem.status_aprovacao === 'aprovada' ? '#/assinatura' : '#/painel'}">${S.garagem.status_aprovacao === 'aprovada' ? 'Ver assinatura' : 'Voltar ao painel'}</a></section>` }
    : { html: `<section class="pagina vazio"><h2>Área do garagista</h2><p>Para anunciar veículos, crie uma conta de garagista.</p><a class="btn grande" href="${S.user ? '#/perfil' : '#/entrar?papel=garagista'}">${S.user ? 'Completar perfil' : 'Criar conta de garagista'}</a></section>` };

  // ---------- entrar / criar conta ----------
  CF.rotas.entrar = async (_a, _b, params) => {
    if (!CF.sb) return { html: '<section class="pagina vazio"><p>Login indisponível: configure o Supabase em <code>js/config.js</code>.</p></section>' };
    if (S.user) return { html: '<section class="pagina vazio"><p>Você já está conectado.</p><a class="btn" href="#/conta">Ir para a conta</a></section>' };
    if (params.get('papel') === 'garagista') CF.store.set('cf_papel_hint', 'garagista');
    return {
      html: `<section class="auth">
        <aside class="auth-marca"><p class="eyebrow">Cadê meu carro?</p><h1>Entre e ache o seu carro mais rápido</h1>
          <ul class="beneficios"><li>${CF.ico('check', 'peq')} Veja o contato direto das garagens</li><li>${CF.ico('check', 'peq')} Salve buscas e favoritos na sua conta</li><li>${CF.ico('check', 'peq')} Receba primeiro os carros que mais combinam</li></ul>
          <p class="auth-g"><strong>É garagista?</strong> Crie sua conta e escolha “Garagista” no perfil para anunciar seus carros e receber clientes interessados.</p></aside>
        <div class="auth-form"><h2 id="a-titulo">Entrar</h2>
        <button class="btn grande sec" id="a-google" type="button">Continuar com Google</button>
        <button class="btn grande sec" id="a-apple" type="button">Continuar com Apple</button>
        <p class="meta ou">ou use e-mail e senha</p>
        <form class="form" id="a-form">
          <label class="campo">E-mail<input type="email" name="email" id="a-email" autocomplete="email" inputmode="email" maxlength="254"></label>
          <label class="campo">Senha<input type="password" name="senha" id="a-senha" autocomplete="current-password" maxlength="72"><small class="dica" id="a-dica" hidden>Mínimo 8 caracteres, com letras e números.</small></label>
          <label class="campo" id="a-conf-l" hidden>Confirmar senha<input type="password" name="conf" id="a-conf" autocomplete="new-password" maxlength="72"></label>
          <label class="mostrar"><input type="checkbox" id="a-ver"> Mostrar senha</label>
          <label class="mostrar" id="a-termos-l" hidden><input type="checkbox" name="termos" id="a-termos"> Li e aceito os <a href="#/termos">Termos de Uso</a> e a <a href="#/privacidade">Política de Privacidade</a></label>
          <button class="btn grande" id="a-ok" type="submit">Entrar</button></form>
        <button class="btn-link" id="a-troca" type="button">Não tem conta? Criar conta</button>
        <button class="btn-link" id="a-esqueci" type="button">Esqueci a senha</button>
        <p class="meta">Ao continuar, você concorda com os <a href="#/termos">Termos de Uso</a> e a <a href="#/privacidade">Política de Privacidade</a>.</p>
        <p class="meta" id="a-msg" role="status"></p></div></section>`,
      bind() {
        const msg = t => { $('a-msg').textContent = t; };
        const volta = () => CF.redirect();
        let criar = false;
        $('a-troca').onclick = () => {
          criar = !criar;
          $('a-titulo').textContent = criar ? 'Criar conta' : 'Entrar';
          $('a-ok').textContent = criar ? 'Criar conta' : 'Entrar';
          $('a-troca').textContent = criar ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta';
          $('a-senha').autocomplete = criar ? 'new-password' : 'current-password'; msg('');
          $('a-conf-l').hidden = !criar; $('a-dica').hidden = !criar; $('a-termos-l').hidden = !criar; CF.limpaErros($('a-form'));
        };
        $('a-ver').onchange = e => { $('a-senha').type = $('a-conf').type = e.target.checked ? 'text' : 'password'; };
        for (const [id, provider, nome] of [['a-google', 'google', 'Google'], ['a-apple', 'apple', 'Apple']]) {
          $(id).onclick = async () => { try { await CF.oauth(provider); } catch { msg(`Login com ${nome} indisponível no momento.`); } };
        }
        $('a-esqueci').onclick = async () => {
          const r = CF.val.email($('a-email').value);
          if (r.erro) { CF.erroCampo($('a-form'), 'email', r.erro); $('a-email').focus(); msg('Digite um e-mail válido acima e toque de novo em "Esqueci a senha".'); return; }
          try { await CF.sb.auth.resetPasswordForEmail(r.ok, { redirectTo: volta() }); msg('Se esse e-mail tiver conta, enviaremos um link para criar uma nova senha.'); }
          catch (e) { msg(CF.msgErro(e)); }
        };
        $('a-form').onsubmit = async e => {
          e.preventDefault(); msg('');
          const v = CF.validar($('a-form'), [
            ['email', x => CF.val.email(x)],
            ['senha', (x, a) => criar ? CF.val.senha(x, a.email) : (x ? { ok: x } : { erro: 'Informe a senha.' })],
            ...(criar ? [['conf', (x, a) => x === $('a-senha').value ? { ok: x } : { erro: 'As senhas não são iguais.' }],
                         ['termos', () => $('a-termos').checked ? { ok: true } : { erro: 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.' }]] : [])
          ]);
          if (!v) return;
          const email = v.email, password = v.senha;
          if ($('a-ok').disabled) return;
          $('a-ok').disabled = true; msg('Aguarde…');
          let r;
          try {
            r = criar ? await CF.sb.auth.signUp({ email, password, options: { emailRedirectTo: volta(), data: { termos_versao: CF.docsVersao, termos_aceitos_em: new Date().toISOString() } } })
                      : await CF.sb.auth.signInWithPassword({ email, password });
          } catch (err) { r = { error: err }; }
          $('a-ok').disabled = false;
          if (r.error) { msg(CF.msgErro(r.error)); return; }
          if (criar && !r.data.session) { msg('Enviamos um e-mail de confirmação. Confirme para entrar.'); return; }
          location.hash = '#/';
        };
      }
    };
  };

  CF.rotas['nova-senha'] = async () => {
    if (!S.user) return { html: '<section class="pagina vazio"><p>Link expirado.</p><a class="btn" href="#/entrar">Voltar ao login</a></section>' };
    return {
      html: `<section class="pagina estreita"><h2>Nova senha</h2><form class="form" id="n-form">
        <label class="campo">Nova senha<input type="password" name="senha" id="n-senha" autocomplete="new-password" maxlength="72"><small class="dica">Mínimo 8 caracteres, com letras e números.</small></label>
        <label class="campo">Confirmar nova senha<input type="password" name="conf" autocomplete="new-password" maxlength="72"></label>
        <button class="btn grande" type="submit">Salvar senha</button></form><p class="meta" id="n-msg" role="status"></p></section>`,
      bind() {
        $('n-form').onsubmit = async e => {
          e.preventDefault(); $('n-msg').textContent = '';
          const f = $('n-form');
          const v = CF.validar(f, [['senha', x => CF.val.senha(x)], ['conf', x => x === f.elements.senha.value ? { ok: x } : { erro: 'As senhas não são iguais.' }]]);
          if (!v) return;
          let error; try { ({ error } = await CF.sb.auth.updateUser({ password: v.senha })); } catch (err) { error = err; }
          $('n-msg').textContent = error ? CF.msgErro(error) : 'Senha alterada!';
          if (!error) setTimeout(() => { location.hash = '#/conta'; }, 800);
        };
      }
    };
  };

  // ---------- perfil (criação e edição) ----------
  CF.rotas.perfil = async () => {
    if (!S.user) return { html: '<section class="pagina vazio"><p>Entre para continuar.</p><a class="btn" href="#/entrar">Entrar</a></section>' };
    const p = S.perfil, g = S.garagem;
    const papel = p?.papel ?? CF.store.get('cf_papel_hint', 'comprador');
    const tel = p ? CF.fmtTel(p.telefone) : '';
    return {
      html: `<section class="pagina estreita"><h2>${p ? 'Meu perfil' : 'Complete seu perfil'}</h2>
        <form class="form" id="pf">
          <fieldset ${p ? 'disabled' : ''}><legend>Eu sou</legend><div class="seg grande" role="radiogroup">
            <label><input type="radio" name="papel" value="comprador" ${papel === 'comprador' ? 'checked' : ''}><span>Cliente<small>Quero encontrar um carro</small></span></label>
            <label><input type="radio" name="papel" value="garagista" ${papel === 'garagista' ? 'checked' : ''}><span>Garagista<small>Quero anunciar carros</small></span></label></div></fieldset>
          <label class="campo">Seu nome<input name="nome" maxlength="80" autocomplete="name" value="${esc(p?.nome ?? '')}"></label>
          <label class="campo">WhatsApp com DDD<input name="telefone" data-mask="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="(48) 99999-9999" value="${esc(tel)}"></label>
          <div class="so-garagista"><label class="campo">Nome da garagem/loja<input name="loja" maxlength="80" value="${esc(g?.nome ?? '')}"></label>
            <label class="campo">CNPJ<input name="cnpj" data-mask="cnpj" inputmode="numeric" maxlength="18" placeholder="00.000.000/0000-00" value="${esc(fmtCnpj(S.priv?.cnpj))}"></label>
            <p class="meta">Só garagens aprovadas anunciam e veem clientes. Analisamos o cadastro antes de liberar.</p></div>
          <div class="dupla"><label class="campo">Cidade<input name="cidade" maxlength="60" autocomplete="address-level2" value="${esc(p?.cidade ?? g?.cidade ?? '')}"></label>
            <label class="campo">UF<select name="uf"><option value="">—</option>${opt(UFS, p?.uf ?? g?.uf)}</select></label></div>
          <p class="meta">Seu nome e telefone só são compartilhados com o garagista quando você toca em "Tenho interesse".</p>
          <button class="btn grande" type="submit" id="pf-ok">Salvar</button></form><p class="meta" id="pf-msg" role="status"></p></section>`,
      bind() {
        const f = $('pf');
        const troca = () => { f.classList.toggle('e-garagista', f.elements.papel.value === 'garagista'); };
        f.addEventListener('change', troca); troca();
        f.onsubmit = async e => {
          e.preventDefault(); const msg = t => { $('pf-msg').textContent = t; };
          msg('');
          const papelSel = p?.papel ?? f.elements.papel.value;
          const gar = papelSel === 'garagista';
          const v = CF.validar(f, [
            ['nome', x => CF.val.nome(x)],
            ['telefone', x => CF.val.telefone(x)],
            ...(gar ? [['loja', x => CF.val.texto(x, { min: 2, max: 80, rotulo: 'o nome da garagem' })], ['cnpj', x => CF.val.cnpj(x)]] : []),
            ['cidade', x => CF.val.texto(x, { max: 60, rotulo: 'a cidade', obrigatorio: gar })],
            ['uf', x => CF.val.uf(x, gar)]
          ]);
          if (!v) return;
          if ($('pf-ok').disabled) return;
          const telefone = v.telefone, cnpj = v.cnpj;
          $('pf-ok').disabled = true; msg('Salvando…');
          let r;
          try {
          const perfil = { id: S.user.id, papel: papelSel, nome: v.nome, telefone, cidade: v.cidade, uf: v.uf };
          r = await CF.sb.from('perfis').upsert(perfil);
          if (!r.error && papelSel === 'garagista') {
            const gdados = { owner_id: S.user.id, nome: v.loja, cidade: v.cidade, uf: v.uf };
            const { owner_id, ...alt } = gdados;
            const gr = S.garagem ? await CF.sb.from('garagens').update(alt).eq('id', S.garagem.id).select('id').single()
                                 : await CF.sb.from('garagens').insert(gdados).select('id').single();
            r = gr.error ? gr : await CF.sb.from('garagem_contatos').upsert({ garagem_id: gr.data.id, telefone });
            if (!r.error) r = await CF.sb.from('garagem_privado').upsert({ garagem_id: gr.data.id, cnpj });
          }
          } catch (err) { r = { error: err }; }
          $('pf-ok').disabled = false;
          if (r.error) { msg(CF.msgErro(r.error)); return; }
          const novo = !p; CF.store.set('cf_papel_hint', null);
          await CF.recarregaConta(); CF.toast('Perfil salvo!');
          location.hash = papelSel === 'garagista' ? '#/painel' : (novo ? '#/preferencias' : '#/conta');
        };
      }
    };
  };

  CF.rotas.conta = async () => {
    if (!S.user) return { html: '<section class="pagina vazio"><p>Você não está conectado.</p><a class="btn" href="#/entrar">Entrar</a></section>' };
    const p = S.perfil; const g = CF.papel() === 'garagista';
    return {
      html: `<section class="pagina estreita"><h2>Minha conta</h2>
        <div class="card"><p><strong>${esc(p?.nome ?? S.user.email ?? '')}</strong> <span class="tag">${p ? (g ? 'Garagista' : 'Cliente') : 'Perfil incompleto'}</span></p>
          <p class="meta">${esc(S.user.email ?? '')}${p ? ` · ${esc(CF.fmtTel(p.telefone))}` : ''}</p>
          ${g && S.garagem ? `<p class="meta">${CF.ico('store', 'peq')} ${esc(S.garagem.nome)} · ${esc(S.garagem.cidade)}/${esc(S.garagem.uf)} <span class="tag ${S.garagem.status_aprovacao === 'aprovada' ? '' : 'novo'}">${{ aprovada: 'Aprovada', pendente: 'Em análise', suspensa: 'Suspensa' }[S.garagem.status_aprovacao]}</span></p>` : ''}
          ${!g ? `<p class="meta">${S.favs.length} favorito(s) · ${S.checks.length} de ${PASSOS.length} passos do guia</p>` : ''}</div>
        <div class="lista-links"><a class="btn sec" href="#/perfil">${p ? 'Editar perfil' : 'Completar perfil'}</a>
          ${g ? '<a class="btn sec" href="#/assinatura">Minha assinatura</a>' : ''}
          ${g ? '<a class="btn sec" href="#/painel">Meus veículos</a><a class="btn sec" href="#/demanda">Clientes buscando</a><a class="btn sec" href="#/interessados">Interessados</a><a class="btn sec" href="#/radar">Radar de demanda</a>' : '<a class="btn sec" href="#/preferencias">Minhas preferências</a><a class="btn sec" href="#/favoritos">Favoritos</a>'}
          ${S.admin ? '<a class="btn sec" href="#/admin">Administração</a>' : ''}
          <button class="btn" data-acao="sair">Sair</button></div>
        ${CF.contaExtras?.() ?? ''}
        ${p ? CF.push.cartao(g ? 'Avisos de novos clientes' : 'Avisos de novos carros', g ? 'Receba uma notificação quando um cliente procurar algo parecido com o seu estoque.' : 'Receba uma notificação quando entrar um carro parecido com a sua busca.') : ''}</section>`,
      bind() { CF.push.liga(); CF.contaBind?.(); }
    };
  };
  CF.acoes.sair = async () => { try { await CF.push.desvincula(); } catch { /* segue */ } await CF.sb.auth.signOut(); location.hash = '#/'; };

  // ---------- painel do garagista ----------
  CF.rotas.painel = async () => {
    const bloq = soGaragista(); if (bloq) return bloq;
    const gid = S.garagem.id, aprov = S.garagem.status_aprovacao === 'aprovada';
    try { S.assin = (await CF.sb.rpc('minha_assinatura')).data ?? S.assin; } catch { /* usa o último estado */ }
    const ok = aprov && CF.liberada(), as = S.assin ?? {};
    const d = x => x ? new Date(x + 'T12:00:00').toLocaleDateString('pt-BR') : '';
    const aviso = !aprov
      ? `<div class="aviso">${S.garagem.status_aprovacao === 'suspensa' ? 'Seu cadastro está suspenso. Fale com a equipe do Cadê meu carro?.' : 'Seu cadastro está <strong>em análise</strong>. Assim que for aprovado você poderá anunciar veículos e ver clientes buscando. Confira o CNPJ e o WhatsApp em <a href="#/perfil">Meu perfil</a>.'}</div>`
      : as.status === 'sem_assinatura' ? '<div class="aviso">Cadastro aprovado. Falta ativar a sua assinatura para anunciar. <a href="#/assinatura">Ver detalhes</a></div>'
      : as.status === 'em_atraso' ? `<div class="aviso alerta">Mensalidade em atraso. Regularize até <strong>${d(as.bloqueio_em)}</strong> para manter os anúncios no ar. <a href="#/assinatura">Ver assinatura</a></div>`
      : as.status === 'suspensa' || as.status === 'cancelada' ? '<div class="aviso alerta">Assinatura suspensa: seus anúncios estão ocultos. <a href="#/assinatura">Regularizar</a></div>'
      : as.status === 'teste' ? `<div class="aviso">Período de teste até <strong>${d(as.teste_ate)}</strong>. <a href="#/assinatura">Ver assinatura</a></div>` : '';
    const [v, it] = await Promise.all([
      CF.sb.from('veiculos').select('*').eq('garagem_id', gid).order('criado_em', { ascending: false }),
      CF.sb.from('interesses').select('veiculo_id,status')
    ]);
    if (v.error) return { html: '<section class="pagina vazio"><p>Não foi possível carregar seus veículos.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const lista = v.data ?? [];
    const matches = await Promise.all(lista.map(x => CF.sb.rpc('compradores_interessados', { p_veiculo: x.id }).then(r => r.data ?? 0, () => 0)));
    const porV = {}; for (const i of it.data ?? []) { (porV[i.veiculo_id] ??= { t: 0, n: 0 }).t++; if (i.status === 'novo') porV[i.veiculo_id].n++; }
    const novos = Object.values(porV).reduce((a, x) => a + x.n, 0);
    const ativos = lista.filter(x => x.status === 'ativo').length;
    const buscando = matches.reduce((a, n) => a + n, 0);
    const item = (x, i) => {
      const li = porV[x.id] ?? { t: 0, n: 0 };
      return `<article class="card veic horiz">
        <a class="foto" href="#/carro/${x.id}">${CF.fotoHtml(x)}</a>
        <div class="corpo"><p class="preco">${brl(x.preco)}</p><h3>${esc(x.marca)} ${esc(x.modelo)} <span class="meta">${x.ano}</span>${CF.seloConf(x)}</h3>
          <p class="meta">${matches[i]} cliente${matches[i] === 1 ? '' : 's'} buscando algo assim · ${li.t} interessado${li.t === 1 ? '' : 's'}${li.n ? ` (<strong>${li.n} novo${li.n === 1 ? '' : 's'}</strong>)` : ''}</p>
          <div class="acoes-linha"><select data-status="${x.id}" aria-label="Status">${['ativo', 'pausado', 'vendido'].map(s => `<option value="${s}" ${x.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select>
            <a class="btn sec peq" href="#/veiculo/${x.id}/editar">Editar</a>
            <button class="btn-link peq" data-acao="apaga" data-id="${x.id}">Excluir</button></div></div></article>`;
    };
    return {
      html: `<section class="pagina"><div class="boas"><div><p class="eyebrow">Painel do garagista</p><h2>${esc(S.garagem.nome)}</h2><p>${CF.ico('pin', 'peq')} ${esc(S.garagem.cidade)}/${esc(S.garagem.uf)}</p></div>
          ${ok ? '<a class="btn claro" href="#/veiculo/novo">+ Anunciar veículo</a>' : ''}</div>${aviso}
        <div class="kpis"><div><strong>${ativos}</strong><span>anúncios ativos</span></div><a href="#/interessados"><strong>${novos}</strong><span>interessados novos</span></a><div><strong>${buscando}</strong><span>buscas compatíveis</span></div></div>
        ${lista.length ? `<div class="grade">${lista.map(item).join('')}</div>` : `<div class="vazio"><p>Você ainda não anunciou nenhum veículo.</p>${ok ? '<a class="btn grande" href="#/veiculo/novo">Cadastrar o primeiro</a>' : ''}</div>`}
        <p class="meta">"Buscas compatíveis" conta clientes com preferências salvas que combinam com o veículo, sem identificá-los.</p></section>`,
      bind() {
        document.querySelectorAll('[data-status]').forEach(s => s.onchange = async () => {
          const { error } = await CF.sb.from('veiculos').update({ status: s.value }).eq('id', +s.dataset.status);
          CF.toast(error ? 'Não foi possível alterar o status.' : 'Status atualizado.');
          if (S.veiculos) S.veiculos = null;
        });
      }
    };
  };
  CF.acoes.apaga = async el => {
    if (el.dataset.conf !== '1') { el.dataset.conf = '1'; el.textContent = 'Confirmar exclusão?'; el.classList.add('perigo'); return; }
    const { data } = await CF.sb.from('veiculos').select('fotos').eq('id', +el.dataset.id).maybeSingle();
    const { error } = await CF.sb.from('veiculos').delete().eq('id', +el.dataset.id);
    if (error) { CF.toast('Não foi possível excluir.'); return; }
    if (data?.fotos?.length) CF.sb.storage.from('veiculos').remove(data.fotos);
    S.veiculos = null; CF.toast('Veículo excluído.'); CF.render();
  };

  // ---------- interessados ----------
  CF.rotas.interessados = async () => {
    const bloq = soGaragista(); if (bloq) return bloq;
    const r = await CF.sb.from('interesses').select('id,nome,telefone,mensagem,status,criado_em,veiculos(marca,modelo,ano)').order('criado_em', { ascending: false });
    if (r.error) return { html: '<section class="pagina vazio"><p>Não foi possível carregar.</p><button class="btn" data-acao="recarrega">Tentar de novo</button></section>' };
    const l = [...(r.data ?? [])].sort((a, b) => (a.status === 'novo' ? 0 : 1) - (b.status === 'novo' ? 0 : 1));
    const item = i => {
      const v = i.veiculos ?? {}; const carro = `${v.marca ?? ''} ${v.modelo ?? ''} ${v.ano ?? ''}`.trim();
      return `<article class="card lead ${i.status}"><div><h3>${esc(i.nome)} ${i.status === 'novo' ? '<span class="tag novo">Novo</span>' : '<span class="tag">Atendido</span>'}</h3>
        <p class="meta">Interesse em <strong>${esc(carro)}</strong> · ${new Date(i.criado_em).toLocaleDateString('pt-BR')}</p>
        ${i.mensagem ? `<p class="citacao">“${esc(i.mensagem)}”</p>` : ''}</div>
        <div class="acoes"><a class="btn zap" target="_blank" rel="noopener" href="${CF.wa(i.telefone, `Olá ${i.nome}! Aqui é da ${S.garagem.nome}. Vi seu interesse no ${carro} pelo app Cadê meu carro?.`)}">WhatsApp ${esc(CF.fmtTel(i.telefone))}</a>
        ${i.status === 'novo' ? `<button class="btn sec" data-acao="atendido" data-id="${i.id}">Marcar atendido</button>` : ''}</div></article>`;
    };
    return { html: `<section class="pagina estreita"><h2>Interessados</h2>${l.length ? l.map(item).join('') : '<div class="vazio"><p>Quando um cliente tocar em "Tenho interesse" nos seus carros, ele aparece aqui.</p></div>'}</section>` };
  };
  CF.acoes.atendido = async el => {
    const { error } = await CF.sb.from('interesses').update({ status: 'atendido' }).eq('id', +el.dataset.id);
    if (error) { CF.toast('Não foi possível atualizar.'); return; } CF.render();
  };

  // ---------- cadastro/edição de veículo ----------
  let fotosForm = []; // {path?, url, blob?}
  const comprime = file => new Promise((ok, err) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      if (Math.max(img.width, img.height) < 480) { URL.revokeObjectURL(url); err(new Error('imagem_pequena')); return; }
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => b ? ok(b) : err(new Error('falha')), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); err(new Error('imagem inválida')); };
    img.src = url;
  });
  const pintaFotos = () => {
    $('thumbs').innerHTML = fotosForm.map((f, i) => `<div class="thumb"><img src="${esc(f.url)}" alt=""><button type="button" data-acao="rmFoto" data-i="${i}" aria-label="Remover foto">✕</button></div>`).join('');
    $('fotos-n').textContent = `${fotosForm.length}/6 fotos`;
  };
  CF.acoes.rmFoto = el => { const f = fotosForm.splice(+el.dataset.i, 1)[0]; if (f?.blob) URL.revokeObjectURL(f.url); pintaFotos(); };

  CF.rotas.veiculo = async (arg, arg2) => {
    const bloq = soGaragista(true); if (bloq) return bloq;
    const edit = arg !== 'novo' && arg2 === 'editar';
    let v = {};
    if (edit) {
      v = (await CF.sb.from('veiculos').select('*').eq('id', +arg).eq('garagem_id', S.garagem.id).maybeSingle()).data;
      if (!v) return { html: '<section class="pagina vazio"><p>Veículo não encontrado.</p><a class="btn" href="#/painel">Voltar</a></section>' };
    }
    const placaAtual = edit ? ((await CF.sb.from('veiculo_placas').select('placa').eq('veiculo_id', v.id).maybeSingle()).data?.placa ?? '') : '';
    const exigePlaca = S.garagem.demo !== true;
    fotosForm = (v.fotos ?? []).map(p => ({ path: p, url: CF.fotoUrl(p) })).filter(f => f.url);
    const val = k => esc(v[k] ?? '');
    const anoMax = new Date().getFullYear() + 1;
    return {
      html: `<section class="pagina estreita"><a class="voltar" href="#/painel">← Meus veículos</a><h2>${edit ? 'Editar veículo' : 'Novo veículo'}</h2>
        <form class="form" id="vf">
          <div class="campo-placa"><label class="campo">Placa${exigePlaca ? '' : ' (opcional)'}<input name="placa" data-mask="placa" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="ABC-1D23" value="${esc(CF.mascara.placa(placaAtual))}"></label>
            <button class="btn sec" type="button" id="placa-ok">Consultar placa</button></div>
          <div id="placa-res" class="placa-res" role="status" aria-live="polite" hidden></div>
          <div class="dupla"><label class="campo">Marca<input name="marca" list="marcas" maxlength="40" value="${val('marca')}"></label>
            <label class="campo">Modelo<input name="modelo" maxlength="60" placeholder="Ex.: Onix 1.0 LT" value="${val('modelo')}"></label></div>
          <datalist id="marcas">${MARCAS.map(m => `<option value="${m}">`).join('')}</datalist>
          <div class="dupla"><label class="campo">Ano<input name="ano" inputmode="numeric" maxlength="4" placeholder="${anoMax - 1}" value="${val('ano')}"></label>
            <label class="campo">Km<input name="km" inputmode="numeric" maxlength="7" placeholder="Ex.: 48000" value="${val('km')}"></label></div>
          <label class="campo">Valor (R$)<input name="preco" inputmode="decimal" placeholder="Ex.: 42.900" value="${v.preco != null ? esc(Number(v.preco).toLocaleString('pt-BR', { maximumFractionDigits: 2 })) : ''}"></label>
          <div class="dupla"><label class="campo">Câmbio<select name="cambio">${opt(['Manual', 'Automático'], v.cambio)}</select></label>
            <label class="campo">Combustível<select name="combustivel">${opt(COMBUSTIVEIS, v.combustivel ?? 'Flex')}</select></label></div>
          <div class="dupla"><label class="campo">Tipo<select name="tipo">${opt(TIPOS, v.tipo)}</select></label>
            <label class="campo">Cor<input name="cor" maxlength="30" value="${val('cor')}"></label></div>
          <div class="dupla"><label class="campo">Cidade<input name="cidade" maxlength="60" value="${esc(v.cidade ?? S.garagem.cidade)}"></label>
            <label class="campo">UF<select name="uf">${opt(UFS, v.uf ?? S.garagem.uf)}</select></label></div>
          <label class="campo">Descrição<textarea name="descricao" rows="4" maxlength="1000" placeholder="Estado, revisões, documentação, acessórios…">${val('descricao')}</textarea></label>
          <fieldset data-campo="fotos"><legend>Fotos <span class="meta" id="fotos-n"></span></legend>
            <div class="thumbs" id="thumbs"></div>
            <label class="btn sec">Adicionar fotos<input type="file" id="arq" accept="image/jpeg,image/png,image/webp" multiple hidden></label></fieldset>
          <label class="campo">Status<select name="status">${(edit ? ['ativo', 'pausado', 'vendido'] : ['ativo', 'pausado']).map(s => `<option value="${s}" ${(v.status ?? 'ativo') === s ? 'selected' : ''}>${{ ativo: 'Ativo (aparece no catálogo)', pausado: 'Pausado (rascunho)', vendido: 'Vendido' }[s]}</option>`).join('')}</select><small class="dica">Anúncio ativo precisa de ao menos 1 foto.</small></label>
          <button class="btn grande" type="submit" id="vf-ok">${edit ? 'Salvar alterações' : 'Publicar anúncio'}</button></form><p class="meta" id="vf-msg" role="status"></p></section>`,
      bind() {
        pintaFotos();
        $('placa-ok').onclick = async () => {
          const f = $('vf'), box = $('placa-res'); CF.limpaErros(f);
          const x = CF.validar(f, [['placa', t => CF.val.placa(t)]]); if (!x) return;
          const btn = $('placa-ok'); btn.disabled = true; btn.textContent = 'Consultando…'; box.hidden = true;
          try {
            const r = await CF.sb.functions.invoke('consulta_placa', { body: { placa: x.placa } });
            if (r.error) { let c = ''; try { c = (await r.error.context.json()).erro; } catch { /* sem corpo */ } throw new Error(c || r.error.message); }
            const d = r.data.dados, titulo = s => String(s ?? '').toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
            const marca = MARCAS.find(m => m.toLowerCase() === String(d.marca).toLowerCase()) ?? titulo(d.marca);
            box.innerHTML = `<p><strong>${esc(marca)} ${esc(d.modelo)}</strong><br><span class="meta">Fabricação ${esc(d.ano_fabricacao)} · modelo ${esc(d.ano_modelo)} · ${esc(titulo(d.cor))} · ${esc(d.combustivel)}</span></p>
              ${r.data.simulado ? '<p class="meta"><strong>Consulta de teste</strong>: dados fictícios, não geram o selo “Dados conferidos”.</p>' : '<p class="meta">Se os dados do anúncio baterem com estes, ele recebe o selo “Dados conferidos”.</p>'}
              <button class="btn sec peq" type="button" id="placa-usa">Usar estes dados</button>`;
            box.hidden = false;
            $('placa-usa').onclick = () => {
              const el = f.elements; el.marca.value = marca; el.modelo.value = d.modelo; el.ano.value = d.ano_modelo; el.cor.value = titulo(d.cor);
              if (COMBUSTIVEIS.includes(d.combustivel)) el.combustivel.value = d.combustivel;
              CF.limpaErros(f); CF.toast('Dados preenchidos. Confira e ajuste o que precisar.');
            };
          } catch (err) { CF.erroCampo(f, 'placa', CF.msgErro(err)); }
          btn.disabled = false; btn.textContent = 'Consultar placa';
        };
        $('arq').onchange = async e => {
          for (const file of [...e.target.files]) {
            if (fotosForm.length >= 6) { CF.toast('Máximo de 6 fotos.'); break; }
            if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { CF.toast(`"${file.name.slice(0, 24)}" não é JPG, PNG ou WebP.`); continue; }
            if (file.size > 20 * 1024 * 1024) { CF.toast(`"${file.name.slice(0, 24)}" é muito grande (máx. 20 MB).`); continue; }
            try { const blob = await comprime(file); fotosForm.push({ blob, url: URL.createObjectURL(blob) }); CF.limpaErros($('vf')); }
            catch (err) { CF.toast(err.message === 'imagem_pequena' ? `"${file.name.slice(0, 24)}" é muito pequena (mínimo 480 px).` : 'Uma das imagens não pôde ser lida.'); }
          }
          e.target.value = ''; pintaFotos();
        };
        $('vf').onsubmit = async e => {
          e.preventDefault(); const msg = t => { $('vf-msg').textContent = t; };
          msg('');
          const f = $('vf');
          const x = CF.validar(f, [
            ['placa', t => CF.val.placa(t, exigePlaca)],
            ['marca', t => CF.val.texto(t, { max: 40, rotulo: 'a marca' })],
            ['modelo', t => CF.val.texto(t, { max: 60, rotulo: 'o modelo' })],
            ['ano', t => CF.val.inteiro(t, { min: CF.val.ANO_MIN, max: CF.val.ANO_MAX, rotulo: 'o ano', milhar: false })],
            ['km', t => CF.val.inteiro(t, { min: 0, max: CF.val.KM_MAX, rotulo: 'a quilometragem' })],
            ['preco', t => CF.val.reais(t, { min: CF.val.PRECO_MIN, max: CF.val.PRECO_MAX, rotulo: 'valor' })],
            ['cidade', t => CF.val.texto(t, { max: 60, rotulo: 'a cidade' })],
            ['uf', t => CF.val.uf(t)],
            ['cor', t => CF.val.texto(t, { max: 30, rotulo: 'a cor', obrigatorio: false })],
            ['descricao', t => CF.val.texto(t, { max: 1000, rotulo: 'a descrição', obrigatorio: false })],
            ['status', t => ['ativo', 'pausado', 'vendido'].includes(t) ? { ok: t } : { erro: 'Status inválido.' }],
            ['fotos', (_, a) => a.status === 'ativo' && fotosForm.length === 0 ? { erro: 'Adicione ao menos 1 foto para publicar, ou escolha o status Pausado.' } : { ok: true }]
          ]);
          if (!x) return;
          const dados = { marca: x.marca, modelo: x.modelo, ano: x.ano, km: x.km, preco: x.preco, cambio: f.elements.cambio.value, combustivel: f.elements.combustivel.value,
            tipo: f.elements.tipo.value, cor: x.cor, cidade: x.cidade, uf: x.uf, descricao: x.descricao ?? '', status: x.status };
          if ($('vf-ok').disabled) return;
          $('vf-ok').disabled = true; msg('Enviando…');
          const enviadas = []; let conferido = false;
          try {
            const fotos = [];
            for (const ft of fotosForm) {
              if (ft.path) { fotos.push(ft.path); continue; }
              const path = `${S.garagem.id}/${crypto.randomUUID()}.jpg`;
              const up = await CF.sb.storage.from('veiculos').upload(path, ft.blob, { contentType: 'image/jpeg' });
              if (up.error) throw up.error; fotos.push(path); enviadas.push(path);
            }
            dados.fotos = fotos;
            const r = edit ? await CF.sb.from('veiculos').update(dados).eq('id', v.id)
                           : await CF.sb.from('veiculos').insert({ ...dados, garagem_id: S.garagem.id }).select('id').single();
            if (r.error) throw r.error;
            if (x.placa) {
              const idV = edit ? v.id : r.data.id;
              const p = await CF.sb.rpc('definir_placa_veiculo', { p_veiculo: idV, p_placa: x.placa });
              if (p.error) {
                if (!edit) { await CF.sb.from('veiculos').delete().eq('id', idV); throw Object.assign(p.error, { placaErro: true }); }
                throw p.error;
              }
              conferido = p.data === true;
            }
            const removidas = (v.fotos ?? []).filter(p => !fotos.includes(p));
            if (removidas.length) CF.sb.storage.from('veiculos').remove(removidas);
          } catch (err) {
            if (enviadas.length) CF.sb.storage.from('veiculos').remove(enviadas).catch(() => {}); // não deixa foto órfã
            $('vf-ok').disabled = false; msg(CF.msgErro(err)); return;
          }
          S.veiculos = null; CF.toast((edit ? 'Anúncio atualizado!' : 'Anúncio publicado!') + (conferido ? ' Dados conferidos ✓' : '')); location.hash = '#/painel';
        };
      }
    };
  };
})();
