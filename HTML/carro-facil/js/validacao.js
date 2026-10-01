// Validação de dados e tratamento de erros: regras reutilizáveis, mensagens junto de cada campo,
// máscaras (telefone/CNPJ), tradução dos erros do banco e proteção contra falhas inesperadas.
(() => {
  const V = CF.val = {};
  const ANO_MAX = new Date().getFullYear() + 1;
  V.ANO_MIN = 1970; V.ANO_MAX = ANO_MAX; V.PRECO_MIN = 500; V.PRECO_MAX = 10000000; V.KM_MAX = 2000000;
  const erro = e => ({ erro: e }), ok = v => ({ ok: v });
  const DDDS = new Set('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '));

  V.texto = (raw, { min = 1, max, rotulo = 'Campo', obrigatorio = true } = {}) => {
    const t = String(raw ?? '').trim().replace(/\s+/g, ' ');
    if (!t) return obrigatorio ? erro(`Informe ${rotulo}.`) : ok(null);
    if (t.length < min) return erro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} deve ter ao menos ${min} caracteres.`);
    if (max && t.length > max) return erro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} pode ter no máximo ${max} caracteres.`);
    return ok(t);
  };
  V.nome = (raw, rotulo = 'seu nome') => {
    const t = String(raw ?? '').trim().replace(/\s+/g, ' ').replace(/[’‘]/g, "'");
    if (!t) return erro(`Informe ${rotulo}.`);
    if (t.length < 2) return erro('O nome precisa de ao menos 2 letras.');
    if (t.length > 80) return erro('O nome pode ter no máximo 80 caracteres.');
    if (!/^\p{L}[\p{L}' .-]{1,79}$/u.test(t)) return erro('Use só letras, espaços, apóstrofo, hífen e ponto (sem números ou símbolos).');
    return ok(t);
  };
  V.telefone = raw => {
    let d = String(raw ?? '').replace(/\D/g, '');
    if (!d) return erro('Informe o WhatsApp com DDD.');
    if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
    if (d.length !== 10 && d.length !== 11) return erro('Informe o número com DDD, por exemplo (48) 99999-9999.');
    if (!DDDS.has(d.slice(0, 2))) return erro('DDD inválido. Confira os dois primeiros números.');
    const l = d.slice(2);
    if (l.length === 9 && l[0] !== '9') return erro('Celular começa com 9 depois do DDD.');
    if (l.length === 8 && !/[2-5]/.test(l[0])) return erro('Número fixo inválido. Se for celular, coloque o 9 na frente.');
    return ok('55' + d);
  };
  V.email = raw => {
    const t = String(raw ?? '').trim().toLowerCase();
    if (!t) return erro('Informe o e-mail.');
    if (t.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return erro('E-mail inválido. Confira o @ e o final (por exemplo .com).');
    return ok(t);
  };
  V.senha = (raw, email = '') => {
    const s = String(raw ?? '');
    if (!s) return erro('Crie uma senha.');
    if (s.length < 8) return erro('A senha precisa de ao menos 8 caracteres.');
    if (s.length > 72) return erro('A senha pode ter no máximo 72 caracteres.');
    if (!/\p{L}/u.test(s) || !/\d/.test(s)) return erro('Use letras e números na senha.');
    if (email && s.toLowerCase() === String(email).toLowerCase()) return erro('A senha não pode ser igual ao e-mail.');
    return ok(s);
  };
  V.cnpjValido = c => {
    if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
    const dv = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return dv(12) === +c[12] && dv(13) === +c[13];
  };
  V.cnpj = raw => {
    const c = String(raw ?? '').replace(/\D/g, '');
    if (!c) return erro('Informe o CNPJ.');
    return V.cnpjValido(c) ? ok(c) : erro('CNPJ inválido. Confira os 14 números.');
  };
  // placa antiga (ABC-1234) ou Mercosul (ABC1D23); devolve só letras e números em maiúsculas
  V.placa = (raw, obrigatorio = true) => {
    const p = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!p) return obrigatorio ? erro('Informe a placa do veículo.') : ok(null);
    return /^[A-Z]{3}\d{4}$/.test(p) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(p) ? ok(p) : erro('Placa inválida. Use o formato ABC-1234 ou ABC1D23.');
  };
  V.uf = (raw, obrigatorio = true) => {
    const t = String(raw ?? '').trim();
    if (!t) return obrigatorio ? erro('Escolha o estado (UF).') : ok(null);
    return UFS.includes(t) ? ok(t) : erro('Estado (UF) inválido.');
  };
  V.inteiro = (raw, { min, max, rotulo = 'Valor', obrigatorio = true, milhar = true } = {}) => {
    const f = x => milhar ? CF.num(x) : String(x);
    const t = String(raw ?? '').trim();
    if (!t) return obrigatorio ? erro(`Informe ${rotulo}.`) : ok(null);
    if (!/^-?\d+$/.test(t)) return erro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} deve ser um número inteiro.`);
    const n = Number(t);
    if (min != null && n < min) return erro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} não pode ser menor que ${f(min)}.`);
    if (max != null && n > max) return erro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} não pode ser maior que ${f(max)}.`);
    return ok(n);
  };
  V.parseReais = raw => {
    let t = String(raw ?? '').replace(/R\$|\s/g, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return /^\d+(\.\d{1,2})?$/.test(t) ? parseFloat(t) : NaN;
  };
  V.reais = (raw, { min = 0, max, rotulo = 'valor', obrigatorio = true } = {}) => {
    const n = V.parseReais(raw);
    if (n === null) return obrigatorio ? erro(`Informe o ${rotulo}.`) : ok(null);
    if (Number.isNaN(n)) return erro(`Valor inválido. Use só números, por exemplo 42.900 ou 42900,50.`);
    if (n < min) return erro(`O ${rotulo} mínimo é ${CF.brl(min)}.`);
    if (max != null && n > max) return erro(`O ${rotulo} máximo é ${CF.brl(max)}.`);
    return ok(n);
  };
  V.data = (raw, { futuro = false } = {}) => {
    const t = String(raw ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(t))) return erro('Informe uma data válida.');
    if (!futuro && t > new Date().toISOString().slice(0, 10)) return erro('A data não pode estar no futuro.');
    return ok(t);
  };
  // filtros/preferências: faixas coerentes
  V.filtros = o => {
    const f = (k, ...a) => o[k] != null;
    for (const k of ['anoMin', 'anoMax']) if (o[k] != null && (!Number.isInteger(o[k]) || o[k] < V.ANO_MIN || o[k] > V.ANO_MAX)) return `Ano deve estar entre ${V.ANO_MIN} e ${V.ANO_MAX}.`;
    if (f('anoMin') && f('anoMax') && o.anoMin > o.anoMax) return 'O ano inicial não pode ser maior que o ano final.';
    for (const k of ['precoMin', 'precoMax']) if (o[k] != null && (o[k] < 0 || o[k] > V.PRECO_MAX)) return `O valor deve estar entre R$ 0 e ${CF.brl(V.PRECO_MAX)}.`;
    if (f('precoMin') && f('precoMax') && o.precoMin > o.precoMax) return 'O valor mínimo não pode ser maior que o máximo.';
    if (o.kmMax != null && (o.kmMax < 0 || o.kmMax > V.KM_MAX)) return 'Quilometragem inválida.';
    return null;
  };

  // ---------- erros junto dos campos ----------
  const alvo = (form, nome) => form.elements[nome] || form.querySelector(`[data-campo="${nome}"]`);
  CF.limpaErroEl = el => {
    el.removeAttribute?.('aria-invalid'); el.removeAttribute?.('aria-describedby');
    const box = el.closest?.('.campo, fieldset, [data-campo]') || el.parentElement;
    box?.querySelectorAll(':scope > .erro').forEach(x => x.remove());
  };
  CF.limpaErros = form => { form.querySelectorAll('[aria-invalid]').forEach(el => CF.limpaErroEl(el)); form.querySelectorAll('.erro').forEach(x => x.remove()); };
  CF.erroCampo = (form, nome, msg) => {
    const el = alvo(form, nome); if (!el) return null;
    const box = el.closest?.('.campo, fieldset, [data-campo]') || el.parentElement;
    box.querySelectorAll(':scope > .erro').forEach(x => x.remove());
    const s = document.createElement('small'); s.className = 'erro'; s.id = `e-${nome}`; s.setAttribute('role', 'alert'); s.textContent = msg;
    box.appendChild(s); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', s.id);
    return el;
  };
  // regras: [campo, (valor, acumulado) => ({ok}|{erro})]; devolve os valores limpos ou null (e mostra os erros)
  CF.validar = (form, regras) => {
    CF.limpaErros(form);
    const vals = {}; let primeiro = null;
    for (const [nome, fn] of regras) {
      const el = alvo(form, nome);
      const r = fn(el && 'value' in el ? el.value : undefined, vals);
      if (r.erro) { const e = CF.erroCampo(form, nome, r.erro); primeiro ??= e; } else vals[nome] = r.ok;
    }
    if (primeiro) { primeiro.focus?.(); primeiro.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); return null; }
    return vals;
  };
  document.addEventListener('input', e => { if (e.target?.getAttribute?.('aria-invalid') === 'true') CF.limpaErroEl(e.target); });

  // ---------- máscaras ----------
  const mascara = {
    tel: d => { d = d.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11); if (d.length <= 2) return d ? `(${d}` : ''; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; },
    placa: d => { d = d.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7); return /^[A-Z]{3}\d{4}$/.test(d) ? d.slice(0, 3) + '-' + d.slice(3) : d; },
    cnpj: d => { d = d.replace(/\D/g, '').slice(0, 14); return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); }
  };
  document.addEventListener('input', e => { const m = e.target?.dataset?.mask; if (m && mascara[m] && e.inputType !== 'deleteContentBackward') e.target.value = mascara[m](e.target.value); });
  CF.mascara = mascara;

  // ---------- mensagens de erro em português ----------
  const MAPA = [
    ['limite_anuncios', 'Você atingiu o limite de anúncios ativos do seu plano. Pause ou conclua um anúncio, ou fale com a equipe para mudar de plano.'],
    ['foto_obrigatoria', 'Anúncios ativos precisam de ao menos 1 foto. Adicione uma foto ou salve como pausado.'],
    ['placa_duplicada', 'Você já tem um anúncio (não vendido) com esta placa.'], ['placa_invalida', 'Placa inválida. Use o formato ABC-1234 ou ABC1D23.'],
    ['limite_consultas', 'Você atingiu o limite de consultas de placa de hoje. Tente amanhã ou preencha os dados manualmente.'],
    ['provedor_indisponivel', 'A consulta de placa ainda não está disponível. Preencha os dados manualmente.'], ['provedor_falhou', 'A consulta de placa falhou agora. Tente de novo em instantes ou preencha manualmente.'],
    ['foto_invalida', 'Uma das fotos é inválida. Remova e envie de novo.'],
    ['ano_invalido', `O ano não pode ser maior que ${ANO_MAX}.`],
    ['veiculos_preco_faixa_chk', `O valor deve estar entre ${CF.brl(500)} e ${CF.brl(10000000)}.`],
    ['veiculos_km_max_chk', 'Quilometragem acima do permitido.'],
    ['veiculos_marca_chk', 'Marca inválida.'], ['veiculos_modelo_chk', 'Modelo inválido.'], ['veiculos_cidade_chk', 'Informe a cidade.'], ['veiculos_uf_chk', 'Estado (UF) inválido.'],
    ['perfis_telefone_br_chk', 'Telefone inválido. Use DDD e número válidos.'], ['interesses_telefone_br_chk', 'Seu telefone cadastrado é inválido. Atualize em Meu perfil.'],
    ['garagem_contatos_telefone_br_chk', 'Telefone da garagem inválido.'],
    ['perfis_nome_chk', 'Nome inválido. Use só letras, espaços, apóstrofo, hífen e ponto.'], ['interesses_nome_chk', 'Seu nome cadastrado é inválido. Atualize em Meu perfil.'],
    ['garagem_privado_cnpj_chk', 'CNPJ inválido.'], ['garagens_nome_chk', 'Nome da garagem inválido.'], ['garagens_uf_chk', 'Estado (UF) inválido.'], ['garagens_cidade_chk', 'Informe a cidade.'],
    ['preferencias_busca_chk', 'Preferências inválidas. Revise os valores (anos, preços e quilometragem).'],
    ['sem_creditos', 'Você não tem créditos suficientes.'], ['lead_indisponivel', 'Este cliente não está mais disponível.'],
    ['garagem_nao_aprovada', 'Sua garagem ainda não está liberada para esta ação. Veja a página Assinatura.'],
    ['nao_autorizado', 'Você não tem permissão para esta ação.'], ['cobranca_ja_encerrada', 'Esta cobrança já foi encerrada.'],
    ['quantidade_invalida', 'Quantidade inválida.'], ['valor_invalido', 'Valor inválido.'], ['dia_invalido', 'O dia de vencimento deve ser de 1 a 28.'], ['teste_invalido', 'O teste grátis deve ter de 0 a 365 dias.'],
    ['plano_invalido', 'Plano inválido.'], ['sem_assinatura', 'Esta garagem ainda não tem assinatura.'], ['carencia_invalida', 'A carência deve ser de 0 a 60 dias.'], ['status_invalido', 'Status inválido.']
  ];
  CF.msgErro = e => {
    const m = String(e?.message ?? e ?? '').toLowerCase(), code = String(e?.code ?? '');
    if (!navigator.onLine || m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) return 'Sem conexão com a internet. Confira o sinal e tente de novo.';
    if (m.includes('jwt') || m.includes('not authenticated') || e?.status === 401) return 'Sua sessão expirou. Entre novamente.';
    for (const [k, t] of MAPA) if (m.includes(k)) return t;
    if (code === '23505' || m.includes('duplicate key')) return 'Este registro já existe.';
    if (code === '42501' || m.includes('row-level security') || m.includes('permission denied')) return 'Você não tem permissão para esta ação. Se for anunciar, confira a sua assinatura.';
    if (code === '23514') return 'Algum dado está fora do permitido. Revise o formulário.';
    if (e?.status === 429 || m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    return CF.traduzErro ? CF.traduzErro(e) : 'Não foi possível concluir. Tente novamente.';
  };
  CF.toastErro = e => CF.toast(CF.msgErro(e));

  // ---------- falhas inesperadas e conexão ----------
  let ultimo = 0;
  const avisa = (e, origem) => { console.error(origem, e); if (Date.now() - ultimo > 4000) { ultimo = Date.now(); CF.toast(CF.msgErro(e)); } };
  window.addEventListener('unhandledrejection', e => avisa(e.reason, 'promessa não tratada'));
  window.addEventListener('error', e => { if (e.message && !/ResizeObserver/.test(e.message)) avisa(e.error ?? e.message, 'erro'); });
  const banner = () => {
    let b = document.getElementById('offline');
    if (!b) { b = document.createElement('div'); b.id = 'offline'; b.setAttribute('role', 'status'); b.textContent = 'Você está sem internet. Algumas ações não vão funcionar até a conexão voltar.'; document.body.prepend(b); }
    b.hidden = navigator.onLine;
  };
  window.addEventListener('offline', banner); window.addEventListener('online', () => { banner(); CF.toast('Conexão restabelecida.'); });
  document.addEventListener('DOMContentLoaded', banner); if (document.readyState !== 'loading') banner();
})();
