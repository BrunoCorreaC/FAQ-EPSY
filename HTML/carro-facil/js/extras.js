// Despachantes, guia do primeiro carro e simulador de financiamento
(() => {
  const { esc, brl, s: S } = CF;
  const $ = id => document.getElementById(id);
  let pos = null; // localização do usuário, só em memória

  const dist = (a, b) => {
    const r = x => x * Math.PI / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };

  const cardDesp = (d, km) => {
    const t = S.telD['d' + d.id];
    const botoes = !CF.sb ? '<p class="meta">Contato indisponível.</p>'
      : !S.user ? `<a class="btn sec" href="#/entrar">${CF.ico('lock', 'peq')} Entre para ver o contato</a>`
      : !t ? `<p class="meta">${S.telsOk ? 'Contato indisponível.' : 'Carregando contato…'}</p>`
      : `<a class="btn" href="tel:+${t}">${CF.ico('phone', 'peq')} ${esc(CF.fmtTel(t))}</a><a class="btn zap" target="_blank" rel="noopener" href="${CF.wa(t, 'Olá! Vi seu contato no app Cadê meu carro? e preciso de ajuda com a documentação de um carro.')}">WhatsApp</a>`;
    return `<article class="card desp"><div><h3>${esc(d.nome)}</h3>
      <p class="meta">${CF.ico('pin', 'peq')} ${esc(d.bairro)}, ${esc(d.cidade)}${km != null ? ` · ${km.toFixed(km < 10 ? 1 : 0)} km de você` : ''}</p>
      <p class="meta">${CF.ico('clock', 'peq')} ${esc(d.horario)} · ${CF.ico('star', 'peq')} ${d.nota.toFixed(1)}</p>
      <p class="tags">${d.servicos.map(s => `<span>${esc(s)}</span>`).join('')}</p></div><div class="acoes">${botoes}</div></article>`;
  };

  CF.rotas.despachantes = async () => ({
    html: `<section class="pagina estreita"><h2>Despachantes</h2><p class="meta">Profissionais que resolvem a documentação do carro no Detran.</p>
      <button class="btn sec" id="btn-loc">${CF.ico('pin', 'peq')} Ordenar por proximidade</button><p class="meta" id="loc-msg" role="status"></p><div id="lista-desp"></div></section>`,
    bind() {
      const pinta = () => {
        const l = DESPACHANTES.map(d => ({ d, km: pos ? dist(pos, d) : null }));
        if (pos) l.sort((a, b) => a.km - b.km);
        $('lista-desp').innerHTML = l.map(x => cardDesp(x.d, x.km)).join('');
      };
      $('btn-loc').onclick = () => {
        const m = $('loc-msg');
        if (!navigator.geolocation) { m.textContent = 'Seu navegador não suporta localização.'; return; }
        m.textContent = 'Buscando sua localização…';
        navigator.geolocation.getCurrentPosition(
          p => { pos = { lat: p.coords.latitude, lng: p.coords.longitude }; m.textContent = 'Ordenado do mais próximo ao mais distante.'; pinta(); },
          () => { m.textContent = 'Não foi possível obter a localização. Permita o acesso e tente de novo.'; }, { timeout: 10000 });
      };
      pinta();
    }
  });

  CF.rotas.guia = async () => ({
    html: `<section class="pagina estreita"><h2>Guia do primeiro carro</h2><p class="meta">Marque cada passo conforme for avançando.</p>
      <ol class="passos">${PASSOS.map((p, i) => `<li><label><input type="checkbox" data-passo="${i}" ${S.checks.includes(i) ? 'checked' : ''}>
        <span><strong>${esc(p.t)}</strong><small>${esc(p.d)}</small></span></label></li>`).join('')}</ol>
      <h3>Documentos que você vai precisar</h3><ul class="docs">${DOCUMENTOS.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <div class="acoes"><a class="btn grande" href="#/despachantes">Falar com um despachante</a><a class="btn sec grande" href="#/simulador">Simular financiamento</a></div></section>`,
    bind() {
      $('app').onchange = e => {
        const i = e.target.dataset.passo; if (i == null) return;
        S.checks = e.target.checked ? [...new Set([...S.checks, +i])] : S.checks.filter(x => x !== +i);
        CF.salvaPrefs();
      };
    }
  });

  CF.rotas.simulador = async (_a, _b, params) => {
    const v = Math.max(0, Math.min(1e7, +params.get('valor') || 50000));
    return {
      html: `<section class="pagina estreita"><h2>Simulador de financiamento</h2><p class="meta">Estimativa simples (parcelas fixas). Consulte o banco para taxas reais.</p>
        <form class="form" id="sim" onsubmit="return false">
          <label class="campo">Valor do carro (R$)<input type="number" id="s-valor" min="0" step="500" value="${v}" inputmode="numeric"></label>
          <label class="campo">Entrada (R$)<input type="number" id="s-ent" min="0" step="500" value="${Math.round(v * 0.3)}" inputmode="numeric"></label>
          <label class="campo">Prazo (meses)<select id="s-prazo">${[12, 24, 36, 48, 60].map(m => `<option ${m === 48 ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label class="campo">Juros ao mês (%)<input type="number" id="s-juros" min="0" step="0.1" value="1.9" inputmode="decimal"></label></form>
        <div class="resultado" id="sim-res" role="status"></div></section>`,
      bind() {
        const calc = () => {
          const valor = +$('s-valor').value || 0, ent = Math.min(+$('s-ent').value || 0, valor);
          const n = +$('s-prazo').value, i = (+$('s-juros').value || 0) / 100, fin = valor - ent;
          const parc = fin <= 0 ? 0 : i === 0 ? fin / n : fin * i / (1 - Math.pow(1 + i, -n));
          const total = parc * n + ent;
          $('sim-res').innerHTML = `<p>Valor financiado: <strong>${brl(fin)}</strong></p><p class="preco grande">${n}x de ${brl(parc)}</p>
            <p>Total pago: <strong>${brl(total)}</strong> (juros: ${brl(Math.max(0, total - valor))})</p><p class="meta">Some ao orçamento: IPVA, seguro, combustível e manutenção.</p>`;
        };
        $('sim').oninput = calc; calc();
      }
    };
  };
})();
