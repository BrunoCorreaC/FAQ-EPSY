// Exigências das lojas: denunciar anúncio, ocultar garagem, excluir conta, links legais na conta.
(() => {
  const { s: S, esc } = CF, $ = id => document.getElementById(id);
  const MOTIVOS = { golpe: 'Suspeita de golpe', fotos_falsas: 'Fotos falsas ou de outro carro', preco_enganoso: 'Preço enganoso', ja_vendido: 'Carro já vendido', conteudo_improprio: 'Conteúdo impróprio', outro: 'Outro motivo' };
  CF.motivos = MOTIVOS;
  const folha = (titulo, corpo, rodape, id) => {
    const d = $('folha'); d.setAttribute('aria-label', titulo);
    d.innerHTML = `<form id="${id}" method="dialog"><header><h2>${titulo}</h2><button class="btn-ico" type="button" data-acao="fechaFolha" aria-label="Fechar">✕</button></header>
      <div class="rolagem form">${corpo}</div><p class="erro-geral" id="${id}-erro" role="alert" hidden></p><footer>${rodape}</footer></form>`;
    return d;
  };
  const erroFolha = (id, t) => { const e = $(id + '-erro'); e.textContent = t; e.hidden = !t; };

  // ---------- denunciar e ocultar ----------
  CF.linhaDenuncia = v => S.garagem?.id === v.garagem_id ? '' :
    `<p class="denuncia-linha"><button class="btn-link" data-acao="denuncia" data-id="${v.id}">Denunciar anúncio</button> · <button class="btn-link" data-acao="ocultaGaragem" data-id="${v.garagem_id}">Ocultar esta garagem</button></p>`;

  CF.acoes.denuncia = el => {
    if (!S.user) { location.hash = '#/entrar'; return; }
    const d = folha('Denunciar anúncio', `<label class="campo">Motivo<select name="motivo">${Object.entries(MOTIVOS).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      <label class="campo">Detalhes (opcional)<textarea name="detalhe" rows="3" maxlength="500"></textarea></label>`, '<button class="btn grande" type="submit" id="df-ok">Enviar denúncia</button>', 'df');
    $('df').onsubmit = async e => {
      e.preventDefault(); const f = $('df'); erroFolha('df', '');
      const detalhe = f.elements.detalhe.value.trim();
      if (detalhe.length > 500) { erroFolha('df', 'Os detalhes podem ter no máximo 500 caracteres.'); return; }
      $('df-ok').disabled = true;
      let error; try { ({ error } = await CF.sb.rpc('denunciar_anuncio', { p_veiculo: +el.dataset.id, p_motivo: f.elements.motivo.value, p_detalhe: detalhe })); } catch (err) { error = err; }
      $('df-ok').disabled = false;
      if (error) { erroFolha('df', CF.msgErro(error)); return; }
      d.close(); CF.toast('Denúncia enviada. Nossa equipe vai analisar. Obrigado!');
    };
    d.showModal();
  };

  CF.acoes.ocultaGaragem = async el => {
    if (!S.user) { location.hash = '#/entrar'; return; }
    const { error } = await CF.sb.from('garagens_ocultas').insert({ user_id: S.user.id, garagem_id: el.dataset.id });
    if (error && error.code !== '23505') { CF.toastErro(error); return; }
    S.ocultas.add(el.dataset.id); S.veiculos = null;
    CF.toast('Garagem ocultada. Para desfazer, vá em Minha conta.'); location.hash = '#/';
  };
  CF.acoes.mostraGaragem = async el => {
    const { error } = await CF.sb.from('garagens_ocultas').delete().eq('user_id', S.user.id).eq('garagem_id', el.dataset.id);
    if (error) { CF.toastErro(error); return; }
    S.ocultas.delete(el.dataset.id); S.veiculos = null; CF.toast('Garagem visível de novo.'); CF.render();
  };

  // ---------- conta: links legais, ocultas, excluir ----------
  CF.contaExtras = () => `<div class="card"><h3>Privacidade e segurança</h3>
    <div id="ocultas"></div>
    <div class="lista-links"><a class="btn sec" href="#/privacidade">Política de Privacidade</a><a class="btn sec" href="#/termos">Termos de Uso</a><a class="btn sec" href="#/suporte">Suporte</a>
      <button class="btn-link perigo" data-acao="excluiConta">Excluir minha conta</button></div></div>`;
  CF.contaBind = async () => {
    if (!S.ocultas?.size || !$('ocultas')) return;
    const r = await CF.sb.from('garagens_ocultas').select('garagem_id,garagens(nome)');
    if (r.error || !r.data?.length || !$('ocultas')) return;
    $('ocultas').innerHTML = `<p class="meta">Garagens que você ocultou:</p><ul class="lista-ocultas">${r.data.map(x => `<li>${esc(x.garagens?.nome ?? 'Garagem')} <button class="btn-link" data-acao="mostraGaragem" data-id="${esc(x.garagem_id)}">Mostrar de novo</button></li>`).join('')}</ul>`;
  };

  CF.acoes.excluiConta = () => {
    if (S.admin) { CF.toast('Contas de administrador não podem ser excluídas por aqui.'); return; }
    const g = CF.papel() === 'garagista';
    const d = folha('Excluir minha conta', `<p>Esta ação é <strong>permanente</strong>. Vamos apagar seu perfil, preferências, favoritos e interesses${g ? ', a sua garagem, todos os anúncios e as fotos' : ''}.</p>
      ${g ? '<p class="meta">Os registros de cobrança são mantidos, sem vínculo com a conta, pelo prazo exigido pela legislação fiscal.</p>' : ''}
      <label class="campo">Para confirmar, digite EXCLUIR<input name="conf" autocomplete="off" autocapitalize="characters" maxlength="10"></label>`,
      '<button class="btn grande perigo" type="submit" id="xf-ok">Excluir definitivamente</button>', 'xf');
    $('xf').onsubmit = async e => {
      e.preventDefault(); erroFolha('xf', '');
      if ($('xf').elements.conf.value.trim().toUpperCase() !== 'EXCLUIR') { erroFolha('xf', 'Digite EXCLUIR para confirmar.'); return; }
      $('xf-ok').disabled = true;
      try {
        if (g && S.garagem) { // remove as fotos do armazenamento antes de apagar os anúncios
          const v = await CF.sb.from('veiculos').select('fotos').eq('garagem_id', S.garagem.id);
          const fotos = (v.data ?? []).flatMap(x => x.fotos ?? []);
          for (let i = 0; i < fotos.length; i += 100) await CF.sb.storage.from('veiculos').remove(fotos.slice(i, i + 100));
        }
        try { await CF.push.desvincula(); } catch { /* segue */ }
        const { error } = await CF.sb.rpc('excluir_minha_conta'); if (error) throw error;
      } catch (err) { $('xf-ok').disabled = false; erroFolha('xf', CF.msgErro(err)); return; }
      d.close();
      try { await CF.sb.auth.signOut({ scope: 'local' }); } catch { /* a conta já não existe */ }
      CF.toast('Conta excluída. Sentiremos sua falta!'); location.hash = '#/';
    };
    d.showModal();
  };
})();
