// Gera as ilustrações dos carros de demonstração (img/demo/v<id>-<n>.jpg)
// Uso: cd ferramentas/imagens-demo && NODE_PATH=$(npm root -g) node gerar.js  (precisa do playwright com chromium)
const { chromium } = require('playwright'); const { cena } = require('./desenho.js');
const V = [[1,'Hatch','Branco'],[2,'Hatch','Prata'],[3,'Hatch','Preto'],[4,'Hatch','Laranja'],[5,'Hatch','Cinza'],[6,'Hatch','Vermelho'],[7,'Sedan','Branco'],[8,'Hatch','Prata'],[9,'Picape','Branco'],[10,'Hatch','Azul'],[11,'Hatch','Cinza'],[12,'SUV','Preto']];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 0.8 });
  for (const [id, tipo, cor] of V) {
    // ordem varia para o catálogo não parecer repetido: metade abre no pátio
    const cenas = id % 2 ? ['estudio', 'patio', 'detalhe'] : ['patio', 'estudio', 'detalhe'];
    for (let i = 0; i < 3; i++) {
      await p.setContent(`<style>body{margin:0}svg{display:block}</style>${cena(tipo, cor, cenas[i])}`);
      await p.screenshot({ path: `${require('path').join(__dirname, '../../img/demo')}/v${id}-${i + 1}.jpg`, type: 'jpeg', quality: 80 });
    }
  }
  await b.close();
})();
