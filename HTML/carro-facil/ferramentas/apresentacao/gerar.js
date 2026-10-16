// Apresentação "Cadê meu carro?" tela por tela (pptxgenjs, deck estruturado)
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const { applyTheme } = require('/root/.claude/skills/synced/a18c6743-eff6-4e45-b62d-e3e2dbd761b2_7826641c-b7dc-47a2-bae5-8a71f983ba59/pptx/scripts/apply_theme.js');

const THEME = {
  name: 'Cade meu carro', headFontFace: 'Arial', bodyFontFace: 'Calibri',
  colors: { dk1: '102016', lt1: 'FFFFFF', dk2: '0F2416', lt2: 'F2F5F0', accent1: '1A7F3C', accent2: 'C8F542', accent3: '146B31', accent4: 'E1F1E1', accent5: '56655A', accent6: 'B42318', hlink: '146B31', folHlink: '56655A' }
};
const OUT = 'cade-meu-carro-apresentacao.pptx';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = 'Cadê meu carro? · O produto tela por tela';
pres.author = 'Cadê meu carro?';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const img = f => 'image/jpeg;base64,' + fs.readFileSync('jpg/' + f).toString('base64');
const icon = 'image/svg+xml;base64,' + fs.readFileSync('/home/user/FAQ-EPSY/HTML/carro-facil/icon.svg').toString('base64');

// ---------- layouts ----------
pres.defineSlideMaster({
  title: 'CAPA', background: { color: THEME.colors.dk2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.9, w: 6.4, h: 2.2, fontSize: 44, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 4.3, w: 6.2, h: 1.4, fontSize: 18, color: C.accent4, valign: 'top', align: 'left', margin: 0 }, text: '' } }
  ]
});
pres.defineSlideMaster({
  title: 'SECAO', background: { color: THEME.colors.dk2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 2.5, w: 7.6, h: 1.2, fontSize: 40, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.8, w: 7.2, h: 1.6, fontSize: 18, color: C.accent4, valign: 'top', align: 'left', margin: 0 }, text: '' } }
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: 'right' }
});
pres.defineSlideMaster({
  title: 'TELA', background: { color: THEME.colors.lt2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.4, w: 12.1, h: 0.75, fontSize: 32, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Cadê meu carro?', options: { x: 0.6, y: 6.95, w: 4, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } }
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: 'right' }
});
pres.defineSlideMaster({
  title: 'TEXTO', background: { color: 'FFFFFF' },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.4, w: 12.1, h: 0.75, fontSize: 32, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Cadê meu carro?', options: { x: 0.6, y: 6.95, w: 4, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } }
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: 'right' }
});

// ---------- peças ----------
const etiqueta = (s, texto, x, y, w = 2.2) => s.addText(texto, { x, y, w, h: 0.42, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06, fill: { color: C.accent2 }, color: C.text1, fontSize: 13, bold: true, align: 'center', valign: 'middle', margin: 0, rotate: -2, isTextBox: true, objectName: 'Etiqueta do portal' });
const moldura = (s, arq, x, y, w, h) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: 'D9E2D4', width: 0.75 }, shadow: { type: 'outer', blur: 8, offset: 3, angle: 90, opacity: 0.18, color: '102016' }, objectName: 'Moldura da tela' });
  s.addImage({ data: img(arq), x, y, w, h, altText: 'Tela do app', objectName: 'Tela' });
};
const celular = (s, arq, x, y, h) => {
  const w = h * 600 / 1298;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.09, y: y - 0.09, w: w + 0.18, h: h + 0.18, rectRadius: 0.22, fill: { color: C.text1 }, line: { color: '102016', width: 0.5 }, shadow: { type: 'outer', blur: 10, offset: 4, angle: 90, opacity: 0.22, color: '102016' }, objectName: 'Celular' });
  s.addImage({ data: img(arq), x, y, w, h, altText: 'Tela no celular', objectName: 'Tela no celular' });
  return w;
};
const coluna = (s, x, w, mostra, porque, rotuloPorque = 'Por que importa') => {
  s.addText('O que a tela mostra', { x, y: 1.5, w, h: 0.35, fontSize: 13, bold: true, color: C.accent3, margin: 0, isTextBox: true });
  s.addText(mostra.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < mostra.length - 1 } })), { x, y: 1.9, w, h: 2.75, fontSize: 14, color: C.text1, valign: 'top', paraSpaceAfter: 6, margin: 0, isTextBox: true });
  s.addText([{ text: rotuloPorque + '\n', options: { bold: true, fontSize: 13, color: C.accent3 } }, { text: porque, options: { fontSize: 14, color: C.text1 } }],
    { x, y: 4.85, w, h: 1.65, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, fill: { color: C.accent4 }, valign: 'top', margin: 10, isTextBox: true, objectName: 'Destaque' });
};
let secao = '';
const tela = ({ titulo, portal, arq, mostra, porque, rotuloPorque, notas }) => {
  const s = pres.addSlide({ masterName: 'TELA', sectionTitle: secao });
  s.addText(titulo, { placeholder: 'title' });
  moldura(s, arq, 0.6, 1.5, 8.0, 5.0);
  etiqueta(s, portal, 6.25, 1.06);
  coluna(s, 9.05, 3.7, mostra, porque, rotuloPorque);
  s.addNotes(notas);
  return s;
};
const divisor = (titulo, texto, arq, notas) => {
  const s = pres.addSlide({ masterName: 'SECAO', sectionTitle: secao });
  s.addText(titulo, { placeholder: 'title' });
  s.addText(texto, { placeholder: 'body' });
  if (arq) celular(s, arq, 9.3, 0.9, 5.7);
  s.addNotes(notas);
};

// ---------- 1. abertura ----------
secao = 'Abertura'; pres.addSection({ title: secao });
{
  const s = pres.addSlide({ masterName: 'CAPA', sectionTitle: secao });
  s.addImage({ data: icon, x: 0.6, y: 0.7, w: 0.6, h: 0.6, altText: 'Logo', objectName: 'Logo' });
  s.addText('Cadê meu carro?', { x: 1.35, y: 0.75, w: 5, h: 0.5, fontSize: 20, bold: true, color: C.background1, margin: 0, isTextBox: true });
  s.addText('Quem procura o seu carro, direto no seu WhatsApp', { placeholder: 'title' });
  s.addText('O produto tela por tela: app do cliente, Portal da Loja e Administração', { placeholder: 'body' });
  s.addImage({ data: img('v12-1.jpg'), x: 7.4, y: 1.6, w: 5.4, h: 4.05, altText: 'Carro no pátio', objectName: 'Foto de capa' });
  s.addText('R$ 89.900', { x: 7.7, y: 5.0, w: 1.9, h: 0.5, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06, fill: { color: C.accent2 }, color: C.text1, fontSize: 18, bold: true, align: 'center', valign: 'middle', margin: 0, rotate: -2, isTextBox: true, objectName: 'Etiqueta de preço' });
  s.addNotes('Abertura. Apresente-se e diga em uma frase o que o app faz: o cliente diz o carro que quer e as lojas da região vão até ele. Avise que a apresentação mostra as telas reais do produto, com dados de demonstração, e que no fim há uma proposta de piloto gratuito.');
}
{
  const s = pres.addSlide({ masterName: 'TEXTO', sectionTitle: secao });
  s.addText('Um marketplace, três portais separados', { placeholder: 'title' });
  const cards = [
    ['App do cliente', 'Quem procura carro', 'Busca em frase, carros que combinam, favoritos, guia do primeiro carro e contato direto com a loja.', 'c-inicio.jpg'],
    ['Portal da Loja', 'Garagens e lojas de seminovos', 'Estoque, interessados no WhatsApp, clientes buscando carros como os seus e radar da região.', 'l-painel.jpg'],
    ['Administração', 'Equipe do produto', 'Aprovação de lojas, planos, assinaturas, cobranças e denúncias.', 'a-garagens.jpg']
  ];
  cards.forEach(([t, quem, txt, arq], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 3.8, h: 5.1, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: 'D9E2D4', width: 0.75 }, objectName: 'Cartão ' + t });
    s.addImage({ data: img(arq), x: x + 0.2, y: 1.7, w: 3.4, h: 2.125, altText: t, objectName: 'Tela ' + t });
    s.addText(t, { x: x + 0.2, y: 4.0, w: 3.4, h: 0.45, fontSize: 20, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(quem, { x: x + 0.2, y: 4.45, w: 3.4, h: 0.35, fontSize: 13, bold: true, color: C.accent3, margin: 0, isTextBox: true });
    s.addText(txt, { x: x + 0.2, y: 4.85, w: 3.4, h: 1.55, fontSize: 14, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
  });
  s.addNotes('Cada perfil tem o seu portal, com menu, telas e acesso próprios. O cliente nunca vê as telas da loja, a loja nunca vê a administração, e uma conta de outro perfil é barrada. Isso também protege os dados: o banco só entrega a cada um o que é dele.');
}
{
  const s = pres.addSlide({ masterName: 'TEXTO', sectionTitle: secao });
  s.addText('O mercado de usados bateu recorde em 2025', { placeholder: 'title' });
  s.addText('18,5 mi', { x: 0.6, y: 1.7, w: 5.6, h: 1.4, fontSize: 80, bold: true, color: C.accent1, margin: 0, isTextBox: true, fontFace: 'Arial' });
  s.addText('carros usados e seminovos vendidos no Brasil em 2025, 17,3% a mais que em 2024', { x: 0.6, y: 3.2, w: 5.4, h: 0.9, fontSize: 18, color: C.text1, margin: 0, isTextBox: true });
  s.addText('Fonte: Fenauto, vendas de veículos usados e seminovos em 2025.', { x: 0.6, y: 6.35, w: 6, h: 0.3, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true });
  const pts = [['Portais grandes', 'Muita audiência, ligados a bancos; a loja pequena compete com milhares de anúncios.'],
    ['Loja pequena', 'Vende por WhatsApp, Instagram e Marketplace, e só descobre o cliente quando ele chama.'],
    ['A brecha', 'Mostrar à loja quem já disse o que procura na região, com consentimento do cliente.']];
  pts.forEach(([t, d], i) => {
    const y = 1.6 + i * 1.6;
    s.addShape(pres.shapes.OVAL, { x: 6.9, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: C.accent4 }, line: { color: 'E1F1E1', width: 0.5 }, objectName: 'Marcador' });
    s.addText(String(i + 1), { x: 6.9, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.accent3, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText([{ text: t + '\n', options: { bold: true, fontSize: 18, color: C.text1 } }, { text: d, options: { fontSize: 14, color: C.accent5 } }], { x: 7.6, y, w: 5.1, h: 1.35, valign: 'top', margin: 0, isTextBox: true });
  });
  s.addNotes('O mercado é grande e está crescendo: 18,5 milhões de usados vendidos em 2025, recorde. Os portais grandes têm audiência, mas a loja pequena paga para disputar atenção com milhares de anúncios. A brecha é mostrar à loja quem já disse o que procura na região dela. Atenção: o número de lojas por região ainda não foi levantado; não cite números que não estão aqui.');
}
{
  const s = pres.addSlide({ masterName: 'TEXTO', sectionTitle: secao });
  s.addText('Do pedido do cliente ao WhatsApp da loja', { placeholder: 'title' });
  const passos = [['1', 'O cliente diz o que quer', '"Quero um hatch até R$ 60 mil em SC"'], ['2', 'Autoriza ser encontrado', 'Só quem autoriza aparece para as lojas'], ['3', 'A loja vê quem combina', 'Sem nome nem telefone, até usar 1 crédito'], ['4', 'Conversa no WhatsApp', 'O contato chega com o carro e a mensagem']];
  passos.forEach(([n, t, d], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.2, w: 2.7, h: 2.9, rectRadius: 0.1, fill: { color: i === 3 ? C.accent2 : C.background2 }, line: { color: 'D9E2D4', width: 0.75 }, objectName: 'Passo ' + n });
    s.addText(n, { x: x + 0.25, y: 2.45, w: 0.7, h: 0.7, fontSize: 32, bold: true, color: C.accent3, margin: 0, isTextBox: true });
    s.addText([{ text: t + '\n', options: { bold: true, fontSize: 18, color: C.text1 } }, { text: d, options: { fontSize: 14, color: C.text1 } }], { x: x + 0.25, y: 3.25, w: 2.25, h: 1.7, valign: 'top', margin: 0, isTextBox: true });
    if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.76, y: 3.5, w: 0.3, h: 0.3, fill: { color: C.accent5 }, line: { color: '56655A', width: 0.5 }, objectName: 'Seta' });
  });
  s.addText('Quando entra um carro parecido, o cliente recebe aviso. Quando um cliente salva uma busca parecida com o estoque, a loja recebe aviso.', { x: 0.6, y: 5.5, w: 12.1, h: 0.8, fontSize: 16, color: C.accent5, margin: 0, isTextBox: true });
  s.addNotes('Este é o coração do produto. Nos portais tradicionais o cliente procura o carro. Aqui, além disso, a loja encontra quem procura. O consentimento é a base: só aparece para a loja quem autorizou, e o cliente pode desautorizar quando quiser.');
}

// ---------- 2. cliente ----------
secao = 'App do cliente'; pres.addSection({ title: secao });
divisor('App do cliente', 'Para quem procura carro, principalmente o primeiro: busca simples, só lojas aprovadas e ajuda em cada passo.', 'm-inicio.jpg', 'Agora as telas do cliente. Elas funcionam no navegador do celular e podem ser instaladas na tela inicial, sem baixar app de loja.');
tela({ titulo: 'Início: a busca vira uma frase', portal: 'App do cliente', arq: 'c-inicio.jpg',
  mostra: ['Busca em frase: tipo de carro, valor máximo e estado', 'Foto de capa com a etiqueta de preço, como no para-brisa', 'Três garantias: lojas aprovadas, dados conferidos, contato só se o cliente pedir'],
  porque: 'Quem compra o primeiro carro não sabe filtrar. Uma frase é mais fácil do que um formulário.',
  notas: 'A primeira tela já explica o produto. O cliente monta a busca como uma frase e toca em Ver carros. No topo aparecem os números do catálogo: carros, lojas e cidades. As três garantias abaixo respondem ao medo de golpe.' });
tela({ titulo: 'Estoque com filtros completos', portal: 'App do cliente', arq: 'c-filtros.jpg',
  mostra: ['Filtros de região, marca, modelo, ano, valor, km, câmbio, combustível e loja', 'O botão mostra quantos carros sobram antes de aplicar', 'Atalhos rápidos e ordenação por preço, km ou ano'],
  porque: 'Quem já sabe o que quer encontra em segundos. E a busca pode ser salva para receber avisos.',
  notas: 'Para quem quer detalhar, a folha de filtros cobre tudo o que importa na compra. O contador no botão evita a frustração de aplicar filtros e não achar nada. Valores fora da faixa são avisados antes de aplicar.' });
tela({ titulo: 'Detalhe do carro: tudo para decidir', portal: 'App do cliente', arq: 'c-detalhe.jpg',
  mostra: ['Galeria de fotos com miniaturas', 'Ficha: ano, km, câmbio, combustível, tipo e cor', 'Selos de loja verificada e dados conferidos pela placa', 'Botão "Tenho interesse" e WhatsApp da loja'],
  porque: 'O interesse chega à loja com o carro, a mensagem e o WhatsApp do cliente.',
  notas: 'Esta é a tela que gera negócio. O cliente vê as fotos, a ficha e quem vende. Ao tocar em Tenho interesse, a loja recebe o contato na hora. No fim da página há o aviso de laudo cautelar e os links para o guia e o simulador.' });
tela({ titulo: 'Para você: os carros que mais combinam', portal: 'App do cliente', arq: 'c-voce.jpg',
  mostra: ['Carros ordenados pelo quanto combinam com a busca salva', 'Percentual de combinação em cada carro', 'Os critérios salvos aparecem no topo, para editar'],
  porque: 'O cliente volta ao app sem precisar refazer a busca.',
  notas: 'Depois que o cliente salva o que procura, esta tela mostra primeiro o que mais combina. O percentual ajuda a comparar. Só entram carros a partir de 60% de combinação.' });
tela({ titulo: 'O que eu procuro e a autorização de contato', portal: 'App do cliente', arq: 'c-preferencias.jpg',
  mostra: ['A busca salva, com os mesmos filtros do catálogo', 'Caixa "Quero ser encontrado por lojas", desmarcável a qualquer momento', 'Ativação de avisos no celular'],
  porque: 'É aqui que nasce o lead: só com a autorização do cliente, conforme a LGPD.',
  notas: 'Esta tela sustenta o modelo de negócio. Sem a autorização, a busca do cliente só entra em estatísticas anônimas. Com ela, lojas aprovadas veem que existe um cliente compatível. O cliente pode desmarcar quando quiser.' });
{
  const s = pres.addSlide({ masterName: 'TELA', sectionTitle: secao });
  s.addText('Guia, despachantes e simulador', { placeholder: 'title' });
  moldura(s, 'c-guia.jpg', 0.6, 1.5, 6.4, 4.0);
  etiqueta(s, 'App do cliente', 4.65, 1.06);
  const w = celular(s, 'm-despachantes.jpg', 7.55, 1.55, 4.9);
  celular(s, 'm-simulador.jpg', 7.55 + w + 0.45, 1.55, 4.9);
  s.addText([{ text: 'Por que importa\n', options: { bold: true, fontSize: 13, color: C.accent3 } }, { text: 'O primeiro carro assusta. O guia passo a passo, os despachantes próximos e o simulador de parcelas tiram as dúvidas antes da visita.', options: { fontSize: 14, color: C.text1 } }],
    { x: 0.6, y: 5.75, w: 6.4, h: 0.95, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, fill: { color: C.accent4 }, valign: 'top', margin: 8, isTextBox: true, objectName: 'Destaque' });
  s.addNotes('Estas ferramentas atraem o cliente de primeiro carro. O guia tem os passos da compra, do orçamento à transferência, e o cliente marca o que já fez. Os despachantes podem ser ordenados por distância. O simulador mostra a parcela com entrada, prazo e juros, e lembra dos custos de IPVA, seguro e manutenção.');
}
tela({ titulo: 'Conta e privacidade nas mãos do cliente', portal: 'App do cliente', arq: 'c-conta.jpg',
  mostra: ['Perfil, busca salva e favoritos', 'Termos de Uso, Política de Privacidade e Suporte', 'Garagens ocultadas, com opção de mostrar de novo', 'Excluir conta, com confirmação'],
  porque: 'Confiança: o cliente controla os próprios dados e pode sair quando quiser.',
  notas: 'O cliente pode editar o perfil, rever o que procura, ocultar lojas que não quer ver e excluir a conta pelo próprio app. Os textos legais ainda são minutas e passarão por revisão jurídica antes do lançamento.' });

// ---------- 3. loja ----------
secao = 'Portal da Loja'; pres.addSection({ title: secao });
divisor('Portal da Loja', 'Para garagens e lojas de seminovos: estoque, interessados e clientes buscando carros como os seus.', 'm-interessados.jpg', 'Agora o lado da loja. É um portal separado, com endereço e acesso próprios. No celular, o menu fica embaixo; no computador, ao lado.');
tela({ titulo: 'Entrada exclusiva para lojas', portal: 'Portal da Loja', arq: 'l-entrar.jpg',
  mostra: ['Login e cadastro só de lojas, separado do app do cliente', 'Cadastro com nome da loja, CNPJ e WhatsApp', 'CNPJ validado e aprovação pela equipe antes de anunciar'],
  porque: 'Só lojas aprovadas anunciam. Isso afasta golpes e anúncios falsos.',
  notas: 'A loja entra por um endereço próprio. Uma conta de cliente não acessa este portal, e vice-versa. No cadastro pedimos CNPJ e WhatsApp; a equipe analisa antes de liberar os anúncios.' });
tela({ titulo: 'Estoque: anúncios e quem procura por eles', portal: 'Portal da Loja', arq: 'l-painel.jpg',
  mostra: ['Anúncios ativos, interessados novos e buscas compatíveis', 'Em cada carro: quantos clientes procuram algo parecido', 'Status ativo, pausado ou vendido, editar e ver o anúncio público'],
  porque: 'A loja vê a demanda por carro, não só as visitas.',
  notas: 'O painel mostra a saúde do estoque. O número mais importante é quantos clientes procuram algo parecido com cada carro, sem identificar ninguém. O lojista pausa, edita ou marca como vendido em um toque.' });
tela({ titulo: 'Anunciar com a placa', portal: 'Portal da Loja', arq: 'l-anuncio.jpg',
  mostra: ['Consulta pela placa preenche marca, modelo, ano, cor e combustível', 'Até 6 fotos, com tamanho mínimo e formato conferidos', 'Selo "Dados conferidos" quando o anúncio bate com o registro'],
  porque: 'Menos digitação para a loja e mais confiança para o cliente.',
  notas: 'A placa fica privada: o público não a vê. A consulta preenche os dados e, quando tudo bate com o registro, o anúncio ganha o selo Dados conferidos. Hoje a consulta funciona em modo de teste; a consulta real depende de contratar um provedor de dados de placa.' });
tela({ titulo: 'Interessados direto no WhatsApp', portal: 'Portal da Loja', arq: 'l-interessados.jpg',
  mostra: ['Nome, carro de interesse, data e mensagem do cliente', 'Botão de WhatsApp com mensagem pronta', 'Marcar como atendido para organizar o dia'],
  porque: 'O cliente que tocou em "Tenho interesse" chega pronto para conversar.',
  notas: 'Cada interesse chega com o nome do cliente, o carro e a mensagem. O botão abre o WhatsApp com uma mensagem pronta. Os novos ficam no topo, e o lojista marca como atendido.' });
tela({ titulo: 'Clientes buscando: o lead antes do anúncio', portal: 'Portal da Loja', arq: 'l-demanda.jpg',
  mostra: ['Buscas de clientes que autorizaram contato e combinam com o estoque', 'Quando a busca foi atualizada e quantos carros combinam', 'Contato liberado com 1 crédito'],
  porque: 'É o diferencial do produto: a loja encontra o cliente, não só o contrário.',
  notas: 'Aqui a loja vê quem procura carros parecidos com os dela, sem nome nem telefone. Para ver o contato, usa um crédito. Os créditos vêm do plano ou são concedidos pela equipe. Só aparecem clientes que autorizaram.' });
tela({ titulo: 'Radar: o que a região procura', portal: 'Portal da Loja', arq: 'l-radar.jpg',
  mostra: ['Marcas, modelos, faixas de preço e estados mais procurados', 'Dados agregados de buscas salvas', 'Grupos com menos de 3 pessoas não aparecem'],
  porque: 'Ajuda a decidir o que comprar para o estoque, sem expor ninguém.',
  notas: 'O radar mostra a demanda agregada da região. Para proteger a privacidade, um grupo só aparece com pelo menos 3 pessoas. É uma ferramenta de compra de estoque para o lojista.' });
tela({ titulo: 'Assinatura e cobranças da loja', portal: 'Portal da Loja', arq: 'l-assinatura.jpg',
  mostra: ['Plano, valor e próxima cobrança', 'Instruções de pagamento e histórico de cobranças', 'Avisos de teste, atraso e carência'],
  porque: 'Transparência: a loja sabe o que paga e quando.',
  notas: 'O lojista acompanha a própria assinatura. Os valores dos planos ainda serão definidos; na demonstração eles são fictícios. Se a mensalidade atrasar além da carência, os anúncios saem do ar até a regularização.' });

// ---------- 4. admin ----------
secao = 'Administração'; pres.addSection({ title: secao });
divisor('Administração', 'Para a equipe do produto: aprovar lojas, cuidar das assinaturas e tratar denúncias.', null, 'Por fim, a administração. É um terceiro portal, só para a equipe, que também não aparece para clientes nem lojas.');
tela({ titulo: 'Garagens: aprovação e créditos', portal: 'Administração', arq: 'a-garagens.jpg',
  mostra: ['Lojas pendentes no topo, com CNPJ e WhatsApp', 'Aprovar, suspender ou voltar para pendente', 'Conceder créditos avulsos'],
  porque: 'É o filtro de qualidade: só entra quem foi conferido.',
  notas: 'A equipe vê cada loja, com CNPJ, telefone, créditos e situação da assinatura. Lojas novas aparecem primeiro, para aprovação.' });
tela({ titulo: 'Assinaturas: receita e inadimplência', portal: 'Administração', arq: 'a-assinaturas.jpg',
  mostra: ['Receita mensal recorrente e totais por situação', 'Lojas em teste, ativas, em atraso, suspensas e cortesias', 'Gerar cobranças do período'],
  porque: 'A saúde do negócio em uma tela.',
  notas: 'O resumo mostra a receita mensal recorrente e o que está a receber ou vencido. As cobranças são geradas automaticamente todo dia; o pagamento é registrado manualmente pela equipe.' });
tela({ titulo: 'Cobranças: baixa e controle', portal: 'Administração', arq: 'a-cobrancas.jpg',
  mostra: ['Filtros por situação: vencidas, em aberto, pagas, canceladas', 'Registrar pagamento com forma e data', 'Desfazer pagamento ou cancelar cobrança'],
  porque: 'Controle simples enquanto a cobrança automática não é ativada.',
  notas: 'Hoje o recebimento é por Pix ou boleto e a baixa é manual. Ao registrar o pagamento de uma loja em atraso, ela volta a ficar ativa. A cobrança automática por cartão ou Pix está no roadmap.' });
tela({ titulo: 'Planos e ajustes de cobrança', portal: 'Administração', arq: 'a-planos.jpg',
  mostra: ['Planos com mensalidade, limite de anúncios e créditos por mês', 'Ativar ou desativar planos', 'Instruções de pagamento e dias de carência nos ajustes'],
  porque: 'Os preços são definidos pela equipe, sem mexer no código.',
  notas: 'A equipe define os planos e os valores. Mudar o valor de um plano não altera assinaturas que já existem. Os ajustes guardam as instruções de pagamento e a carência antes do bloqueio.' });
tela({ titulo: 'Denúncias: resposta rápida', portal: 'Administração', arq: 'a-denuncias.jpg',
  mostra: ['Denúncias abertas com motivo, anúncio e loja', 'Arquivar, pausar o anúncio ou suspender a loja', 'Contagem de denúncias abertas por loja'],
  porque: 'Golpe se combate com resposta rápida. A meta é responder em até 24 horas.',
  notas: 'O cliente denuncia um anúncio pelo app e a equipe decide aqui. Suspender a garagem tira todos os anúncios dela do ar.' });

// ---------- 5. fechamento ----------
secao = 'Fechamento'; pres.addSection({ title: secao });
{
  const s = pres.addSlide({ masterName: 'TEXTO', sectionTitle: secao });
  s.addText('Segurança e privacidade desde o início', { placeholder: 'title' });
  const itens = [['Portais isolados', 'Cada perfil só vê as próprias telas; conta de outro perfil é barrada.'], ['Dados por perfil', 'O banco entrega a cada um só o que é dele.'], ['Consentimento', 'A loja só vê quem autorizou o contato.'], ['Placa privada', 'Usada só para conferir o anúncio; o público não vê.'], ['Moderação', 'Denúncia, ocultar loja e suspensão de anunciantes.'], ['Exclusão de conta', 'O cliente apaga a conta pelo próprio app.']];
  itens.forEach(([t, d], i) => {
    const col = i % 3, lin = Math.floor(i / 3), x = 0.6 + col * 4.1, y = 1.6 + lin * 2.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.8, h: 2.2, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: 'D9E2D4', width: 0.75 }, objectName: 'Item ' + t });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.45, h: 0.45, fill: { color: C.accent1 }, line: { color: '1A7F3C', width: 0.5 }, objectName: 'Marcador' });
    s.addText('✓', { x: x + 0.25, y: y + 0.25, w: 0.45, h: 0.45, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText([{ text: t + '\n', options: { bold: true, fontSize: 18, color: C.text1 } }, { text: d, options: { fontSize: 14, color: C.accent5 } }], { x: x + 0.25, y: y + 0.85, w: 3.3, h: 1.25, valign: 'top', margin: 0, isTextBox: true });
  });
  s.addNotes('Antes da proposta, reforce a confiança. Os três portais são separados, os dados são protegidos por perfil no banco e o lead só existe com consentimento. Os Termos e a Política de Privacidade passarão por revisão jurídica antes do lançamento.');
}
{
  const s = pres.addSlide({ masterName: 'CAPA', sectionTitle: secao });
  s.addText('Piloto gratuito para as primeiras lojas', { placeholder: 'title' });
  s.addText('30 a 60 dias, cadastro feito junto e preço de lançamento travado para quem entrar agora', { placeholder: 'body' });
  const passos = ['Cadastrar a loja e 5 carros hoje, em 10 minutos', 'Receber interessados e clientes buscando no WhatsApp', 'No fim do teste, decidir com base nos resultados'];
  passos.forEach((t, i) => {
    const y = 1.9 + i * 1.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.6, y, w: 5.1, h: 1.05, rectRadius: 0.1, fill: { color: i === 0 ? C.accent2 : '1D3A25' }, line: { color: i === 0 ? 'C8F542' : '2E5236', width: 0.75 }, objectName: 'Passo do piloto ' + (i + 1) });
    s.addText([{ text: `${i + 1}  `, options: { bold: true, fontSize: 20, color: i === 0 ? C.text1 : C.accent2 } }, { text: t, options: { fontSize: 16, color: i === 0 ? C.text1 : C.background1 } }], { x: 7.85, y, w: 4.7, h: 1.05, valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addNotes('Feche com o pedido: "Posso cadastrar sua loja agora, com 5 carros?". As condições exatas do piloto são combinadas na visita. Deixe o folder com o lojista e anote o WhatsApp dele.');
}

pres.writeFile({ fileName: OUT }).then(async () => { await applyTheme(OUT, THEME); console.log('ok', OUT); });
