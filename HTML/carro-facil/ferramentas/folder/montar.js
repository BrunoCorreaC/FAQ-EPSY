const fs = require('fs'), path = require('path');
const img = f => 'data:' + (f.endsWith('.png') ? 'image/png' : 'image/jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
const D = '/home/user/FAQ-EPSY/HTML/carro-facil/';
const icon = 'data:image/svg+xml;base64,' + Buffer.from(fs.readFileSync(D + 'icon.svg', 'utf8')).toString('base64');
const ck = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Folder · Cadê meu carro?</title><style>
${fs.readFileSync('fontes.css', 'utf8')}
@page { size: A4 landscape; margin: 0 }
:root { --ink:#102016; --mut:#4f5f54; --brand:#1a7f3c; --brand-txt:#146b31; --soft:#e1f1e1; --bg:#f2f5f0; --lime:#c8f542; --lime-ink:#14210a; --moldura:#0f2416; }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font: 10.5pt/1.45 Figtree, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact }
.folha { width: 297mm; height: 210mm; display: grid; grid-template-columns: 99mm 99mm 99mm; page-break-after: always; overflow: hidden }
.painel { padding: 12mm 10mm; position: relative; display: flex; flex-direction: column; gap: 4mm; overflow: hidden }
h1, h2, h3, .etq, .num { font-family: Archivo, sans-serif; font-stretch: 112% }
h1 { font-size: 25pt; line-height: 1.04; font-weight: 800; letter-spacing: -.02em }
h2 { font-size: 16pt; line-height: 1.1; font-weight: 780 }
h3 { font-size: 11pt; font-weight: 700 }
.eyebrow { font-size: 7.5pt; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; color: var(--brand-txt) }
.marca { display: flex; align-items: center; gap: 3mm; font-family: Archivo, sans-serif; font-stretch: 112%; font-weight: 800; font-size: 13pt }
.marca img { width: 9mm; height: 9mm }
.etq { display: inline-block; background: var(--lime); color: var(--lime-ink); font-weight: 800; padding: 1.6mm 3mm 1.3mm; border-radius: 1.5mm; font-size: 14pt; box-shadow: 0 .6mm 0 rgba(20,33,10,.25) }
p { margin: 0 } .mut { color: var(--mut) }
/* capa */
.capa { background: var(--moldura); color: #e9f3e6 }
.capa .marca { color: #fff } .capa .eyebrow { color: var(--lime) }
.capa h1 em { font-style: normal; color: var(--lime); display: block }
.capa .foto { margin: 0 -10mm; position: relative } .capa .foto img { width: 100%; display: block }
.capa .foto .etq { position: absolute; left: 10mm; bottom: 6mm; transform: rotate(-2deg) }
.capa .rodape { margin-top: auto; font-size: 8.5pt; color: #9fb7a4 }
/* listas */
.passos { list-style: none; display: grid; gap: 3.2mm; counter-reset: p }
.passos li { display: grid; grid-template-columns: 8mm 1fr; gap: 2.5mm; align-items: start; counter-increment: p }
.passos li::before { content: counter(p); font-family: Archivo, sans-serif; font-weight: 800; font-stretch: 112%; font-size: 12pt; width: 8mm; height: 8mm; border-radius: 50%; background: var(--soft); color: var(--brand-txt); display: grid; place-items: center }
.ganhos { list-style: none; display: grid; gap: 2.4mm }
.ganhos li { display: grid; grid-template-columns: 5mm 1fr; gap: 2mm; align-items: start } .ganhos svg { color: var(--brand-txt); margin-top: .6mm }
.ganhos b { display: block }
.tag-breve { font-size: 7pt; font-weight: 700; background: var(--soft); color: var(--brand-txt); border-radius: 1mm; padding: .2mm 1.4mm; margin-left: 1mm; vertical-align: 1pt }
.tela { width: 46mm; border-radius: 5mm; border: 1.2mm solid var(--ink); overflow: hidden; align-self: center; box-shadow: 0 2mm 6mm rgba(16,32,22,.18) }
.tela img { width: 100%; display: block }
.numero { background: var(--soft); border-radius: 3mm; padding: 5mm }
.numero .num { font-size: 30pt; font-weight: 800; line-height: 1; color: var(--brand-txt) }
.oferta { background: var(--lime); color: var(--lime-ink); border-radius: 3mm; padding: 6mm 5mm }
.oferta h2 { font-size: 19pt }
.campo { border-bottom: .3mm solid var(--ink); height: 9mm; display: flex; align-items: flex-end; padding-bottom: 1mm; font-size: 8.5pt; color: var(--mut) }
.fonte { font-size: 7pt; color: var(--mut); margin-top: auto }
.dobra { border-left: .2mm dashed rgba(16,32,22,.12) }
.fundo-claro { background: var(--bg) }
</style></head><body>
<!-- FRENTE (fora): aba interna · verso · capa -->
<section class="folha">
  <div class="painel fundo-claro">
    <p class="eyebrow">Para as primeiras lojas</p>
    <div class="oferta"><h2>Piloto gratuito de 30 a 60 dias</h2></div>
    <ul class="ganhos">
      <li>${ck}<span><b>Cadastro feito junto</b>A gente cadastra a loja e o estoque com você em 10 minutos.</span></li>
      <li>${ck}<span><b>Preço de lançamento travado</b>Quem entra no piloto mantém o valor de lançamento.</span></li>
      <li>${ck}<span><b>Só lojas aprovadas</b>CNPJ conferido antes de anunciar: você não disputa com anúncio falso.</span></li>
      <li>${ck}<span><b>Você ajuda a definir o produto</b>As primeiras lojas dizem o que falta e a gente constrói.</span></li>
    </ul>
    <p class="fonte">Condições do piloto combinadas na visita.</p>
  </div>
  <div class="painel dobra">
    <p class="eyebrow">Comece hoje</p>
    <h2>Sua loja no ar em 10 minutos</h2>
    <ol class="passos">
      <li><span><h3>Cadastro</h3><span class="mut">Nome da loja, CNPJ e WhatsApp.</span></span></li>
      <li><span><h3>Estoque</h3><span class="mut">Fotos e dados de 5 carros, com placa.</span></span></li>
      <li><span><h3>Clientes</h3><span class="mut">Interessados e clientes buscando chegam no Portal da Loja e no seu WhatsApp.</span></span></li>
    </ol>
    <div class="tela" style="width:38mm"><img src="${img('loja-demanda.png')}" alt="Clientes buscando no Portal da Loja"></div>
    <div style="margin-top:auto;display:grid;gap:1mm">
      <div class="campo">Consultor</div><div class="campo">WhatsApp</div><div class="campo">Endereço do app</div>
    </div>
  </div>
  <div class="painel capa">
    <div class="marca"><img src="${icon}" alt="">Cadê meu carro?</div>
    <p class="eyebrow" style="margin-top:6mm">Portal da Loja</p>
    <h1>Quem procura o seu carro, <em>direto no seu WhatsApp.</em></h1>
    <p>Para lojas de seminovos da sua região.</p>
    <div class="foto"><img src="${img(D + 'img/demo/v12-1.jpg')}" alt="Jeep Renegade no pátio"><span class="etq">R$ 89.900</span></div>
    <p class="rodape">Marketplace de carros de lojas aprovadas, com o cliente dizendo o que procura.</p>
  </div>
</section>
<!-- VERSO (dentro): problema · como funciona · ganhos -->
<section class="folha">
  <div class="painel fundo-claro">
    <p class="eyebrow">O mercado</p>
    <h2>O cliente já sabe o que quer. Falta chegar até você.</h2>
    <div class="numero"><p class="num">18,5 mi</p><p>carros usados e seminovos vendidos no Brasil em 2025, recorde da série.</p></div>
    <p>Hoje sua loja disputa atenção com milhares de anúncios e só descobre o cliente quando ele chama.</p>
    <p>No <b>Cadê meu carro?</b> o cliente diz o que procura, e você vê quem combina com o seu estoque antes da concorrência.</p>
    <p class="fonte">Fonte: Fenauto, vendas de veículos usados e seminovos em 2025.</p>
  </div>
  <div class="painel dobra">
    <p class="eyebrow">Como funciona</p>
    <h2>Do pedido do cliente ao seu WhatsApp</h2>
    <ol class="passos" style="gap:2.2mm">
      <li><span><b>O cliente monta a busca</b><br><span class="mut">"Quero um hatch até R$ 60 mil em SC."</span></span></li>
      <li><span><b>Autoriza ser encontrado</b><br><span class="mut">Só quem autoriza aparece para as lojas.</span></span></li>
      <li><span><b>Você vê quem combina</b><br><span class="mut">E libera o contato com 1 crédito.</span></span></li>
    </ol>
    <div class="tela"><img src="${img('cliente-home.png')}" alt="App do cliente"></div>
  </div>
  <div class="painel dobra">
    <p class="eyebrow">O que sua loja ganha</p>
    <ul class="ganhos">
      <li>${ck}<span><b>Interessados no WhatsApp</b>Nome, carro e mensagem de quem tocou em "Tenho interesse".</span></li>
      <li>${ck}<span><b>Clientes buscando</b>Pessoas que procuram carros como os seus, com consentimento.</span></li>
      <li>${ck}<span><b>Radar da região</b>O que mais é procurado perto de você.</span></li>
      <li>${ck}<span><b>Selo de loja verificada</b>Mais confiança para quem compra.</span></li>
      <li>${ck}<span><b>Dados conferidos pela placa <span class="tag-breve">em breve</span></b>Marca, modelo e ano batem com o registro.</span></li>
    </ul>
    <div class="tela" style="width:42mm"><img src="${img('loja-interessados.png')}" alt="Portal da Loja"></div>
  </div>
</section>
</body></html>`;
fs.writeFileSync('folder.html', html);
