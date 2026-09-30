// Dados fixos do app. Carros, garagens e telefones ficam no Supabase (tabelas veiculos, garagens, garagem_contatos).
// DADOS DE EXEMPLO (fictícios) dos despachantes; telefones deles estão na tabela `contatos` (chaves d<id>).

const DESPACHANTES = [
  { id: 1, nome: 'Despachante Ilha Documentos', cidade: 'Florianópolis', bairro: 'Centro', lat: -27.5954, lng: -48.5480, horario: 'Seg a Sex, 8h–18h', servicos: ['Transferência', 'Licenciamento', 'Emplacamento', 'Vistoria', '2ª via CRV'], nota: 4.8 },
  { id: 2, nome: 'Rápido Auto Docs', cidade: 'São José', bairro: 'Kobrasol', lat: -27.5900, lng: -48.6270, horario: 'Seg a Sex, 8h–17h30', servicos: ['Transferência', 'Licenciamento', 'Baixa de gravame', 'Multas'], nota: 4.6 },
  { id: 3, nome: 'Despachante Palhoça Legal', cidade: 'Palhoça', bairro: 'Centro', lat: -27.6450, lng: -48.6700, horario: 'Seg a Sex, 9h–18h', servicos: ['Transferência', 'Emplacamento', 'Primeiro emplacamento'], nota: 4.5 },
  { id: 4, nome: 'Norte Despachos', cidade: 'Joinville', bairro: 'América', lat: -26.3050, lng: -48.8460, horario: 'Seg a Sex, 8h–18h · Sáb 8h–12h', servicos: ['Transferência', 'Licenciamento', 'Vistoria', 'Regularização'], nota: 4.7 },
  { id: 5, nome: 'Gaúcha Despachante', cidade: 'Porto Alegre', bairro: 'Menino Deus', lat: -30.0500, lng: -51.2200, horario: 'Seg a Sex, 8h30–18h', servicos: ['Transferência', 'Licenciamento', 'Emplacamento', 'Multas', 'Baixa de gravame'], nota: 4.9 }
];

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const MARCAS = ['Chevrolet','Citroën','Fiat','Ford','Honda','Hyundai','Jeep','Nissan','Peugeot','Renault','Toyota','Volkswagen'];
const TIPOS = ['Hatch','Sedan','SUV','Picape','Utilitário','Outro'];
const COMBUSTIVEIS = ['Flex','Gasolina','Diesel','Elétrico','Híbrido'];

const PASSOS = [
  { t: 'Defina o orçamento total', d: 'Some ao preço do carro: IPVA, seguro, transferência (~R$ 300–600), combustível e manutenção. Uma regra comum: parcela + custos fixos até 30% da renda.' },
  { t: 'Escolha o tipo de carro', d: 'Para o primeiro carro, modelos compactos populares têm seguro mais barato, peças acessíveis e boa revenda.' },
  { t: 'Pesquise o valor na tabela FIPE', d: 'Compare o preço anunciado com a tabela FIPE (fipe.org.br). Desconfie de preços muito abaixo da tabela.' },
  { t: 'Visite e faça test drive', d: 'Vá de dia, verifique lataria, pneus, ruídos, painel e documentos. Leve alguém de confiança ou um mecânico.' },
  { t: 'Peça o laudo cautelar', d: 'O laudo cautelar mostra batidas, remarcações e sinistros. Vale muito a pena, principalmente em carros usados de particulares.' },
  { t: 'Consulte débitos e restrições', d: 'Confira multas, IPVA, licenciamento e alienação fiduciária (gravame). Um despachante resolve isso rapidamente.' },
  { t: 'Negocie e feche por escrito', d: 'Preencha o CRV/ATPV-e (Autorização para Transferência) com firma ou via digital, e guarde o comprovante de pagamento.' },
  { t: 'Faça a transferência', d: 'Você tem 30 dias para transferir a propriedade. Um despachante cuida de toda a burocracia no Detran.' },
  { t: 'Contrate o seguro', d: 'Cote em pelo menos 3 seguradoras antes de rodar. Condutores iniciantes costumam pagar mais.' }
];

const DOCUMENTOS = [
  'CNH válida (categoria B)', 'RG e CPF', 'Comprovante de residência recente',
  'CRV/ATPV-e preenchido pelo vendedor', 'Comprovante de pagamento da compra',
  'Certificado de licenciamento (CRLV) atualizado', 'Laudo de vistoria (quando exigido pelo Detran)'
];
