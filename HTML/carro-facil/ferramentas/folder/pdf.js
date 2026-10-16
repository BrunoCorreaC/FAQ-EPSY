const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/folder.html'); await p.waitForTimeout(800);
  await p.pdf({ path: '/home/user/FAQ-EPSY/HTML/carro-facil/apresentacao/folder-lojistas.pdf', width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
  await p.setViewportSize({ width: 1123, height: 794 }); await p.screenshot({ path: 'previa.png', fullPage: true });
  await b.close(); })();
