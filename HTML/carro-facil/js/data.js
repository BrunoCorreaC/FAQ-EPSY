// DADOS DE EXEMPLO (fictícios). Substitua por dados reais ou por uma API.
// Os telefones NÃO ficam aqui: estão na tabela `contatos` do Supabase (só usuários logados leem).
// Chave: 'c<id>' (vendedor do carro) e 'd<id>' (despachante). Veja supabase/schema.sql.

const CARROS = [
  { id: 1, marca: 'Fiat', modelo: 'Mobi Like', ano: 2019, km: 48000, preco: 42900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Branco', cidade: 'Florianópolis', vendedor: 'Loja Mar Azul', obs: 'Único dono, revisões em dia. Ótimo consumo para uso urbano.' },
  { id: 2, marca: 'Chevrolet', modelo: 'Onix 1.0', ano: 2020, km: 39000, preco: 58900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Prata', cidade: 'São José', vendedor: 'Auto Centro SJ', obs: 'Ar-condicionado, direção elétrica, central multimídia.' },
  { id: 3, marca: 'Volkswagen', modelo: 'Gol 1.6', ano: 2017, km: 72000, preco: 36500, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Preto', cidade: 'Palhoça', vendedor: 'Garagem do Zé', obs: 'Peças baratas e fáceis de achar. Ótimo para começar.' },
  { id: 4, marca: 'Renault', modelo: 'Kwid Zen', ano: 2021, km: 27000, preco: 44900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Laranja', cidade: 'Florianópolis', vendedor: 'Loja Mar Azul', obs: 'Muito econômico. IPVA 2026 quitado.' },
  { id: 5, marca: 'Hyundai', modelo: 'HB20 Comfort', ano: 2018, km: 61000, preco: 51900, cambio: 'Automático', combustivel: 'Flex', tipo: 'Hatch', cor: 'Cinza', cidade: 'Joinville', vendedor: 'Norte Veículos', obs: 'Câmbio automático, ideal para trânsito pesado.' },
  { id: 6, marca: 'Fiat', modelo: 'Argo Drive', ano: 2021, km: 33000, preco: 67900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Vermelho', cidade: 'Porto Alegre', vendedor: 'Sul Motors', obs: 'Laudo cautelar aprovado. Aceita financiamento.' },
  { id: 7, marca: 'Chevrolet', modelo: 'Prisma LT', ano: 2016, km: 80000, preco: 38900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Sedan', cor: 'Branco', cidade: 'São José', vendedor: 'Auto Centro SJ', obs: 'Porta-malas grande, ótimo para família.' },
  { id: 8, marca: 'Honda', modelo: 'Fit LX', ano: 2015, km: 89000, preco: 49900, cambio: 'Automático', combustivel: 'Flex', tipo: 'Hatch', cor: 'Prata', cidade: 'Florianópolis', vendedor: 'Particular - Ana', obs: 'Espaçoso e confiável. Revisões na concessionária.' },
  { id: 9, marca: 'Fiat', modelo: 'Strada Endurance', ano: 2022, km: 21000, preco: 84900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Picape', cor: 'Branco', cidade: 'Joinville', vendedor: 'Norte Veículos', obs: 'Cabine simples, ótima para trabalho.' },
  { id: 10, marca: 'Toyota', modelo: 'Etios X', ano: 2018, km: 56000, preco: 46900, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Azul', cidade: 'Palhoça', vendedor: 'Garagem do Zé', obs: 'Manutenção barata e alta durabilidade.' },
  { id: 11, marca: 'Ford', modelo: 'Ka SE', ano: 2019, km: 45000, preco: 45500, cambio: 'Manual', combustivel: 'Flex', tipo: 'Hatch', cor: 'Cinza', cidade: 'Porto Alegre', vendedor: 'Sul Motors', obs: 'Bom custo-benefício, ar e direção.' },
  { id: 12, marca: 'Jeep', modelo: 'Renegade Sport', ano: 2019, km: 52000, preco: 89900, cambio: 'Automático', combustivel: 'Flex', tipo: 'SUV', cor: 'Preto', cidade: 'Florianópolis', vendedor: 'Loja Mar Azul', obs: 'SUV compacto, posição de dirigir alta.' }
];

const DESPACHANTES = [
  { id: 1, nome: 'Despachante Ilha Documentos', cidade: 'Florianópolis', bairro: 'Centro', lat: -27.5954, lng: -48.5480, horario: 'Seg a Sex, 8h–18h', servicos: ['Transferência', 'Licenciamento', 'Emplacamento', 'Vistoria', '2ª via CRV'], nota: 4.8 },
  { id: 2, nome: 'Rápido Auto Docs', cidade: 'São José', bairro: 'Kobrasol', lat: -27.5900, lng: -48.6270, horario: 'Seg a Sex, 8h–17h30', servicos: ['Transferência', 'Licenciamento', 'Baixa de gravame', 'Multas'], nota: 4.6 },
  { id: 3, nome: 'Despachante Palhoça Legal', cidade: 'Palhoça', bairro: 'Centro', lat: -27.6450, lng: -48.6700, horario: 'Seg a Sex, 9h–18h', servicos: ['Transferência', 'Emplacamento', 'Primeiro emplacamento'], nota: 4.5 },
  { id: 4, nome: 'Norte Despachos', cidade: 'Joinville', bairro: 'América', lat: -26.3050, lng: -48.8460, horario: 'Seg a Sex, 8h–18h · Sáb 8h–12h', servicos: ['Transferência', 'Licenciamento', 'Vistoria', 'Regularização'], nota: 4.7 },
  { id: 5, nome: 'Gaúcha Despachante', cidade: 'Porto Alegre', bairro: 'Menino Deus', lat: -30.0500, lng: -51.2200, horario: 'Seg a Sex, 8h30–18h', servicos: ['Transferência', 'Licenciamento', 'Emplacamento', 'Multas', 'Baixa de gravame'], nota: 4.9 }
];

// Coordenadas aproximadas das cidades, usadas para ordenar por proximidade.
const CIDADES = {
  'Florianópolis': [-27.5954, -48.5480],
  'São José': [-27.6136, -48.6366],
  'Palhoça': [-27.6450, -48.6700],
  'Joinville': [-26.3045, -48.8487],
  'Porto Alegre': [-30.0346, -51.2177]
};

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
