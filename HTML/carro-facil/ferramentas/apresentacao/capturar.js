const { chromium } = require('playwright'); const fs = require('fs');
const css = fs.readFileSync('folder/fontes.css', 'utf8') + `.demo-bar{display:none!important} :root{--demo-h:0px!important} @media (min-width:900px){[data-portal="loja"] body,[data-portal="admin"] body{grid-template-rows:auto 1fr auto!important}[data-portal="loja"] .abas,[data-portal="admin"] .abas{top:60px!important;height:calc(100vh - 60px)!important}}`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const run = async (vw, vh, sc, lista) => {
    const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: sc });
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
    await p.goto('file://' + process.cwd() + '/demo-artifact.html'); await p.addStyleTag({ content: css }); await p.waitForTimeout(1500);
    let atual = 'cliente';
    for (const [portal, hash, nome, extra] of lista) {
      if (portal !== atual) { await p.evaluate(x => window.__portal(x), portal); await p.waitForTimeout(1200); atual = portal; }
      if (hash === 'SAIR') { await p.evaluate(() => window.__logout()); await p.waitForTimeout(500); continue; }
      if (hash === 'ENTRAR') { await p.evaluate(x => window.__login(...x), extra); await p.waitForTimeout(900); continue; }
      await p.evaluate(h => CFH.hash = h, hash); await p.waitForTimeout(700);
      if (extra === 'filtros') { await p.click('[data-acao=abreFiltros]'); await p.waitForTimeout(400); }
      if (extra === 'rolar') { await p.evaluate(() => document.getElementById('estoque')?.scrollIntoView()); await p.waitForTimeout(300); }
      if (extra === 'placa') { await p.click('#placa-ok'); await p.waitForTimeout(500); }
      await p.screenshot({ path: `deck/telas/${nome}.png` });
      if (extra === 'filtros') await p.evaluate(() => document.getElementById('folha').close());
    }
    await p.close();
  };
  // computador
  await run(1440, 900, 1.25, [
    ['cliente', '#/', 'c-inicio'], ['cliente', '#/', 'c-estoque', 'rolar'], ['cliente', '#/', 'c-filtros', 'filtros'], ['cliente', '#/carro/12', 'c-detalhe'],
    ['cliente', '#/voce', 'c-voce'], ['cliente', '#/preferencias', 'c-preferencias'], ['cliente', '#/guia', 'c-guia'],
    ['cliente', '#/conta', 'c-conta'],
    ['loja', '#/', 'l-painel'], ['loja', '#/veiculo/12/editar', 'l-anuncio', 'placa'], ['loja', '#/interessados', 'l-interessados'], ['loja', '#/demanda', 'l-demanda'],
    ['loja', '#/radar', 'l-radar'], ['loja', '#/assinatura', 'l-assinatura'],
    ['admin', '#/admin', 'a-garagens'], ['admin', '#/admin/assinaturas', 'a-assinaturas'], ['admin', '#/admin/cobrancas', 'a-cobrancas'], ['admin', '#/admin/planos', 'a-planos'],
    ['admin', '#/admin/denuncias', 'a-denuncias'], ['admin', '#/admin/ajustes', 'a-ajustes'],
    ['loja', 'SAIR'], ['loja', '#/', 'l-entrar'],
    ['cliente', 'SAIR'], ['cliente', '#/entrar', 'c-entrar']
  ]);
  // celular
  await run(390, 844, 2, [
    ['cliente', '#/', 'm-inicio'], ['cliente', '#/carro/12', 'm-detalhe'], ['cliente', '#/despachantes', 'm-despachantes'], ['cliente', '#/simulador?valor=89900', 'm-simulador'],
    ['loja', '#/', 'm-painel'], ['loja', '#/interessados', 'm-interessados']
  ]);
  await b.close();
})();
