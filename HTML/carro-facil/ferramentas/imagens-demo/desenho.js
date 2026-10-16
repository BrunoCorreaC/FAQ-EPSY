// Gera ilustração lateral de um carro em SVG (tipo, cor, cena). Usado só para imagens de demonstração.
const CORES = { Branco: '#eceeee', Preto: '#23272b', Prata: '#b8bec3', Cinza: '#6b7379', Vermelho: '#b0262c', Azul: '#2b5ca6', Laranja: '#d9661f', Verde: '#2f6b45', Bege: '#cdbb98' };
function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
// polígono com cantos arredondados (raio por vértice)
function suave(pts) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y, r] = pts[i], [px, py] = pts[(i - 1 + n) % n], [nx, ny] = pts[(i + 1) % n];
    const l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y);
    const r1 = Math.min(r, l1 / 2), r2 = Math.min(r, l2 / 2);
    const ax = x + (px - x) * r1 / l1, ay = y + (py - y) * r1 / l1, bx = x + (nx - x) * r2 / l2, by = y + (ny - y) * r2 / l2;
    d += (i ? 'L' : 'M') + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'Q' + x + ' ' + y + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1);
  }
  return d + 'Z';
}
const MODELOS = {
  Hatch: { L: 800, wr: 74, wf: 0.82, wb: 0.18, chao: 46, corpo: L => [[6, 46, 10], [0, 122, 16], [26, 236, 44], [110, 282, 70], [0.55 * L, 286, 90], [0.735 * L, 204, 40], [0.96 * L, 168, 50], [L, 114, 22], [L - 4, 46, 10]],
    vidro: L => [[50, 212, 6], [82, 254, 26], [124, 270, 22], [0.535 * L, 272, 26], [0.705 * L, 210, 6]], colunas: L => [0.19 * L, 0.43 * L], frente: 0.71, belt: 204, cauda: 214 },
  Sedan: { L: 880, wr: 74, wf: 0.81, wb: 0.19, chao: 46, corpo: L => [[6, 48, 10], [0, 124, 16], [14, 192, 24], [0.2 * L, 204, 40], [0.33 * L, 292, 80], [0.6 * L, 298, 80], [0.76 * L, 210, 40], [0.965 * L, 172, 46], [L, 116, 22], [L - 4, 48, 10]],
    vidro: L => [[0.215 * L, 214, 6], [0.33 * L, 282, 40], [0.585 * L, 286, 24], [0.745 * L, 216, 6]], colunas: L => [0.29 * L, 0.48 * L], frente: 0.72, belt: 210, cauda: 186 },
  SUV: { L: 860, wr: 86, wf: 0.8, wb: 0.19, chao: 70, corpo: L => [[6, 74, 12], [0, 168, 18], [10, 330, 30], [60, 362, 46], [0.65 * L, 366, 60], [0.79 * L, 262, 40], [0.975 * L, 232, 46], [L, 160, 24], [L - 4, 74, 12]],
    vidro: L => [[26, 274, 6], [44, 340, 18], [0.63 * L, 346, 26], [0.765 * L, 270, 6]], colunas: L => [0.2 * L, 0.45 * L], frente: 0.74, belt: 268, rack: true, cauda: 270 },
  Picape: { L: 940, wr: 84, wf: 0.8, wb: 0.17, chao: 70, corpo: L => [[4, 72, 12], [0, 186, 12], [0.37 * L, 186, 6], [0.395 * L, 334, 24], [0.44 * L, 352, 40], [0.65 * L, 354, 56], [0.785 * L, 260, 36], [0.975 * L, 228, 44], [L, 160, 22], [L - 4, 72, 12]],
    vidro: L => [[0.41 * L, 266, 6], [0.425 * L, 330, 18], [0.635 * L, 336, 24], [0.765 * L, 266, 6]], colunas: L => [0.52 * L], frente: 0.74, belt: 262, cacamba: true, cauda: 178 },
};
MODELOS['Utilitário'] = MODELOS.Picape; MODELOS.Outro = MODELOS.Hatch;

function roda(cx, cy, r, id) {
  const raios = [0, 72, 144, 216, 288].map(a => `<rect x="${-r * 0.07}" y="${-r * 0.56}" width="${r * 0.14}" height="${r * 0.42}" rx="${r * 0.05}" transform="rotate(${a})" fill="url(#aro${id})"/>`).join('');
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="#16191b"/><circle r="${r * 0.93}" fill="none" stroke="#2a2f33" stroke-width="${r * 0.05}"/>
    <circle r="${r * 0.64}" fill="#3a4045"/><circle r="${r * 0.6}" fill="#2a2f33"/>
    ${raios}<circle r="${r * 0.6}" fill="none" stroke="url(#aro${id})" stroke-width="${r * 0.07}"/>
    <circle r="${r * 0.16}" fill="url(#aro${id})"/><circle r="${r * 0.06}" fill="#30363a"/></g>`;
}

function carro(tipo, corNome, id = 'a') {
  const m = MODELOS[tipo] || MODELOS.Hatch, L = m.L, base = CORES[corNome] || '#8a9196';
  const claro = mix(base, '#ffffff', base === CORES.Preto ? 0.28 : 0.4), escuro = mix(base, '#000000', 0.42);
  const Y = h => -h; // altura acima do chão -> y negativo
  const body = suave(m.corpo(L).map(([x, h, r]) => [x, Y(h), r]));
  const vidro = suave(m.vidro(L).map(([x, h, r]) => [x, Y(h), r]));
  const xt = L * m.wb, xf = L * m.wf, wr = m.wr;
  const colunas = `<g clip-path="url(#cv${id})">${m.colunas(L).map(x => `<rect x="${x - 10}" y="${Y(420)}" width="20" height="260" fill="${mix(base, '#000', 0.25)}"/>`).join('')}</g>`;
  const portas = m.colunas(L).concat([L * m.frente]).map(x => `<path d="M${x} ${Y(m.belt - 2)}V${Y(m.chao + 16)}" stroke="${escuro}" stroke-opacity=".6" stroke-width="2.4"/>`).join('');
  const macanetas = m.colunas(L).map(x => `<rect x="${x + 22}" y="${Y(m.belt - 28)}" width="44" height="9" rx="4.5" fill="${escuro}" opacity=".6"/>`).join('');
  return `
  <defs>
    <linearGradient id="lat${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${escuro}"/></linearGradient>
    <linearGradient id="vid${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d6a74"/><stop offset=".5" stop-color="#1c2328"/><stop offset="1" stop-color="#0f1316"/></linearGradient>
    <radialGradient id="aro${id}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#f2f4f5"/><stop offset=".6" stop-color="#a9b0b5"/><stop offset="1" stop-color="#6c747a"/></radialGradient>
    <linearGradient id="farol${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd8de"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <clipPath id="clip${id}"><path d="${body}"/></clipPath><clipPath id="cv${id}"><path d="${vidro}"/></clipPath>
  </defs>
  <path d="${body}" fill="url(#lat${id})"/>
  <g clip-path="url(#clip${id})">
    <circle cx="${xt}" cy="${-wr}" r="${wr * 1.17}" fill="#0d1012"/><circle cx="${xf}" cy="${-wr}" r="${wr * 1.17}" fill="#0d1012"/>
    <path d="M0 ${Y(m.chao + 22)}H${L}V0H0Z" fill="#000" opacity=".22"/>
    <path d="M0 ${Y(m.belt + 4)}H${L}" stroke="${claro}" stroke-width="5" opacity=".7"/>
    <path d="M0 ${Y(m.belt - 66)}H${L}" stroke="${escuro}" stroke-width="2.5" opacity=".4"/><path d="M0 ${Y(m.belt - 63)}H${L}" stroke="${claro}" stroke-width="2" opacity=".35"/>
    <circle cx="${xt}" cy="${-wr}" r="${wr * 1.24}" fill="none" stroke="${claro}" stroke-width="3" opacity=".5"/><circle cx="${xf}" cy="${-wr}" r="${wr * 1.24}" fill="none" stroke="${claro}" stroke-width="3" opacity=".5"/>
  </g>
  <path d="${vidro}" fill="url(#vid${id})"/>
  <path d="${vidro}" fill="none" stroke="#0b0e10" stroke-width="3"/>
  <g clip-path="url(#cv${id})"><path d="M${L * 0.3} ${Y(m.belt)}L${L * 0.42} ${Y(m.belt + 120)}L${L * 0.5} ${Y(m.belt + 120)}L${L * 0.38} ${Y(m.belt)}Z" fill="#fff" opacity=".13"/><path d="M${L * 0.56} ${Y(m.belt)}L${L * 0.66} ${Y(m.belt + 120)}L${L * 0.69} ${Y(m.belt + 120)}L${L * 0.59} ${Y(m.belt)}Z" fill="#fff" opacity=".08"/></g>
  ${colunas}${portas}${macanetas}
  ${m.rack ? `<rect x="${L * 0.08}" y="${Y(378)}" width="${L * 0.52}" height="9" rx="4" fill="#2a2f33"/>` : ''}
  ${m.cacamba ? `<path d="M10 ${Y(176)}H${L * 0.37}" stroke="#15191c" stroke-width="5"/>` : ''}
  <path d="M${L * (m.frente + 0.02)} ${Y(m.belt + 2)}q4 -26 30 -26q8 0 8 10l-4 20z" fill="${escuro}"/>
  <path d="M${L - 70} ${Y(m.belt - 40)}q48 -2 66 10l-2 22q-34 -2 -66 -6z" fill="url(#farol${id})" stroke="#7d868c" stroke-width="2"/>
  <rect x="${L - 64}" y="${Y(84)}" width="56" height="16" rx="6" fill="#121517" opacity=".85"/>
  <path d="M3 ${Y(m.cauda)}q22 -4 34 -2l-2 36q-20 0 -34 -4z" fill="#a3161d"/><path d="M7 ${Y(m.cauda - 6)}q14 -3 26 -2" stroke="#ff6d6d" stroke-width="3" fill="none"/>
  ${roda(xt, -wr, wr, id)}${roda(xf, -wr, wr, id)}`;
}

function cena(tipo, corNome, tipoCena = 'estudio') {
  const m = MODELOS[tipo] || MODELOS.Hatch, W = 1200, H = 900, chao = 712, x0 = (W - m.L * 1.12) / 2;
  const sombra = `<ellipse cx="${W / 2}" cy="${chao + 6}" rx="${m.L * 0.62}" ry="26" fill="#000" opacity=".38" filter="url(#borrao)"/>`;
  let fundo = '', reflexo = '';
  if (tipoCena === 'patio') {
    fundo = `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc3e4"/><stop offset="1" stop-color="#e7eff3"/></linearGradient>
      <linearGradient id="asf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d9296"/><stop offset="1" stop-color="#5f6468"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#ceu)"/>
      <rect x="0" y="330" width="${W}" height="${chao - 330}" fill="#e6e1d6"/>
      <rect x="0" y="330" width="${W}" height="54" fill="#1f7a3a"/><rect x="0" y="384" width="${W}" height="8" fill="#c8f542"/>
      ${[0, 1, 2, 3, 4].map(i => `<rect x="${60 + i * 230}" y="430" width="170" height="${chao - 470}" fill="#b9c8cf" opacity=".85"/><rect x="${60 + i * 230}" y="430" width="170" height="10" fill="#9fb0b8"/>`).join('')}
      <rect x="0" y="${chao - 40}" width="${W}" height="40" fill="#cfc9bb"/>
      <rect x="0" y="${chao}" width="${W}" height="${H - chao}" fill="url(#asf)"/>
      ${[-1, 0, 1, 2].map(i => `<path d="M${W / 2 + i * 380 - 180} ${H}L${W / 2 + i * 300 - 120} ${chao}" stroke="#f1f1ec" stroke-width="7" opacity=".75"/>`).join('')}`;
  } else {
    fundo = `<defs><radialGradient id="est" cx=".5" cy=".38" r=".85"><stop offset="0" stop-color="#f4f5f4"/><stop offset=".7" stop-color="#d5d9da"/><stop offset="1" stop-color="#b7bdbf"/></radialGradient>
      <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4c9cb"/><stop offset="1" stop-color="#e9ebeb"/></linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="mref"><rect x="0" y="${chao}" width="${W}" height="${H - chao}" fill="url(#fade)"/></mask></defs>
      <rect width="${W}" height="${H}" fill="url(#est)"/><rect x="0" y="${chao}" width="${W}" height="${H - chao}" fill="url(#piso)"/>`;
    reflexo = `<g mask="url(#mref)"><g transform="translate(${x0} ${chao}) scale(1.12 -1.12)">${carro(tipo, corNome, 'r')}</g></g>`;
  }
  const zoom = tipoCena === 'detalhe' ? `transform="translate(${-W * 0.55} ${-H * 0.62}) scale(1.85)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><filter id="borrao" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="14"/></filter></defs>
    <g ${zoom}>${fundo}${reflexo}${sombra}<g transform="translate(${x0} ${chao}) scale(1.12)">${carro(tipo, corNome, 'c')}</g></g></svg>`;
}
if (typeof module !== 'undefined') module.exports = { cena, CORES };
