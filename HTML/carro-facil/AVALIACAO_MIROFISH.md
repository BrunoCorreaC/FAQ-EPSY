# Cadê meu carro? — Documento-base para avaliação (simulação)

> Documento autossuficiente: descreve o produto, o modelo de negócio, o estágio atual e as hipóteses a validar. Onde não há dado real, está escrito "não definido" ou "hipótese". Nenhum número de mercado foi inventado.

## 1. Em uma frase
Marketplace brasileiro de carros usados em que **o cliente diz o que procura e as garagens (lojas de carros) passam a disputar esse cliente**; a plataforma ganha com **mensalidade dos garagistas** e **venda de contatos qualificados (leads)**. Para o cliente, é gratuito.

## 2. O problema
- **Comprador (principalmente de primeiro carro):** muitas opções espalhadas, anúncios de qualidade irregular, medo de golpe e de erro de documentação, não sabe por onde começar (despachante, laudo, financiamento).
- **Garagista (loja de carros usados):** paga para anunciar em grandes portais onde compete por atenção com milhares de anúncios, sem saber **quem está procurando um carro como o seu estoque**. O contato chega tarde e sem contexto.

## 3. A ideia central: demanda primeiro
Nos portais tradicionais o fluxo é **oferta → cliente procura**. Aqui há também **demanda → garagista**:
1. O cliente salva o que busca (região, marca/modelo, ano, faixa de preço, câmbio...).
2. Se **autorizar expressamente** (consentimento LGPD, revogável), garagens aprovadas veem que existe um cliente compatível e podem **desbloquear o contato** usando créditos.
3. Quando um garagista cadastra um carro que combina com buscas salvas, o cliente recebe **notificação**; quando um cliente salva uma busca parecida com o estoque, a garagem é avisada.

## 4. Quem usa e o que faz

### Cliente (gratuito)
- Catálogo com **filtros**: estado/cidade, marca/modelo, ano, preço, quilometragem, câmbio, combustível, tipo de carro e garagem.
- **Fotos e detalhes** dos carros; favoritos; **"Para você"**: carros ordenados por % de combinação com a busca salva.
- **"Tenho interesse"**: envia nome e telefone à garagem; atalho para WhatsApp/telefone.
- Ferramentas para o **primeiro carro**: guia passo a passo (checklist), lista de **despachantes próximos** e **simulador de financiamento**.
- Notificações de novos carros parecidos (web push).
- Segurança: pode **denunciar anúncio**, **ocultar uma garagem**, **excluir a conta** quando quiser, e escolher se autoriza ser visto por garagens.

### Garagista (pago)
- **Cadastro com CNPJ validado** e **aprovação manual** pela equipe. Só garagens aprovadas e com assinatura em dia anunciam e veem demanda.
- **Anúncios** com até 6 fotos (anúncio ativo exige foto), limite de anúncios por plano, campo de **placa**.
- Painel: quantos clientes procuram algo parecido com cada carro, interessados recebidos (com contato), status do anúncio.
- **"Clientes buscando"**: demandas anonimizadas compatíveis com o estoque; o contato só aparece após **desbloquear com crédito**.
- **Radar de demanda**: o que mais é procurado na região (agregado; só mostra grupos com pelo menos 3 pessoas, para não identificar ninguém).
- Selo **"Verificada"** (CNPJ aprovado) e, quando a consulta de placa estiver ativa, selo **"Dados conferidos"** (marca, modelo e ano batem com o registro do veículo).

### Administrador (equipe)
- Aprova ou suspende garagens; planos, assinaturas e cobranças (**recebimento registrado manualmente**: Pix, boleto, dinheiro); créditos de leads; tratamento de **denúncias**; carência por atraso e bloqueio automático de anúncios.

## 5. Modelo de negócio
| Fonte | Como funciona | Estado |
|---|---|---|
| **Mensalidade do garagista** | Planos com limite de anúncios e créditos mensais de leads; teste grátis e carência configuráveis | Valores **não definidos** (a demonstração usa valores fictícios) |
| **Créditos de leads** | Cada contato de cliente desbloqueado consome 1 crédito; créditos vêm do plano e podem ser concedidos pela equipe | Preço do crédito avulso **não definido** |
| **Cliente** | Gratuito | — |
| Possíveis futuras (hipóteses, não implementadas) | Destaque pago de anúncio; cobrança automática (cartão/Pix); consulta de placa paga | — |

**Custos conhecidos:** infraestrutura (banco e autenticação, plano pago do provedor), consulta de placa por provedor externo (opcional), e-mail transacional, contador e jurídico. **Custo de aquisição de garagistas e clientes: não estimado.**

## 6. Diferenciais declarados (a serem testados)
1. **Demanda qualificada com consentimento** — vende contato de quem *já* procura, em vez de só exibir anúncio.
2. **Só garagistas aprovados** e com assinatura em dia → menos anúncio falso e concorrência desleal.
3. **Foco em primeiro carro** — guia, despachante e simulador reduzem o medo de comprar.
4. **Confiança verificável** — CNPJ aprovado, foto obrigatória, conferência de dados por placa, denúncia e moderação.
5. **Privacidade como regra** — placa invisível ao público, demanda anonimizada, k≥3 no radar, exclusão de conta no app.

## 7. Concorrência (referência qualitativa)
Portais e marketplaces nacionais de veículos (por exemplo Webmotors, OLX Autos, iCarros, Mercado Livre Veículos), redes de seminovos com estoque próprio (por exemplo Kavak, Localiza Seminovos) e vendedores via redes sociais/WhatsApp. **Não há aqui dados quantitativos de mercado**; participações, preços de anúncio e audiência dos concorrentes precisam ser levantados à parte.

## 8. Estado atual do produto (honesto)
- **Protótipo funcional** como aplicativo web (funciona no navegador do celular e pode ser instalado na tela inicial). **Não está em loja** (App Store/Google Play) — decisão: validar primeiro pela web.
- **Sem usuários reais ainda.** O catálogo atual é de demonstração (12 carros de garagens fictícias).
- **Link público ainda não publicado** (hospedagem pendente de ativação).
- **Pagamentos:** manuais (Pix/boleto registrados pela equipe). Cobrança automática não implementada.
- **Consulta de placa:** pronta, em **modo simulado**; falta contratar provedor real.
- **Documentos legais** (Termos, Privacidade): minutas **sem revisão jurídica**.
- **Validação técnica:** testes de banco e de tela executados; contraste/acessibilidade auditados.

## 9. Riscos já identificados
- **Ovo e galinha:** garagista só paga se houver clientes procurando; cliente só procura se houver estoque.
- **Consentimento:** poucos clientes autorizarem o compartilhamento reduz o valor dos leads.
- **Qualidade do lead:** cliente que "salvou busca" pode não estar pronto para comprar → risco de o garagista achar caro.
- **Repasse de contato / spam** pelo garagista (LGPD): exige regras e fiscalização.
- **Disposição a pagar** do garagista pequeno e **churn** das mensalidades.
- **Regras das lojas de apps** (se for ao iOS): cobrança digital pode exigir compra no app com comissão.
- **Dependência de provedor de placa** (custo, cobertura, defasagem de base).
- **Fraude/golpe** apesar das verificações; reputação da plataforma.

## 10. Perguntas que queremos que a avaliação responda
1. Entre **garagistas pequenos e médios**, qual a probabilidade de aderirem e **pagarem** a mensalidade? Qual faixa de preço é aceita e onde vira rejeição?
2. Qual **porcentagem de clientes** autorizaria compartilhar o interesse com garagens e que **incentivos/mensagens** aumentam a adesão?
3. **Leads por demanda** valem mais ou menos para o garagista do que anúncio em portal? Em que condições ele **desbloquearia** o contato?
4. Como superar o **ovo e galinha**: começar por qual lado, em qual cidade/região e com qual tamanho de estoque?
5. Quais **objeções** cada perfil levantaria (cliente de primeiro carro; garagista de bairro; garagista maior; despachante)? 
6. Qual o **maior risco de churn** e o que o reduziria?
7. Quais **diferenciais realmente importam** e quais são irrelevantes na prática?
8. **Canais de aquisição** mais plausíveis (associações de lojistas, visita presencial, WhatsApp, Instagram, parcerias com despachantes) e seus riscos.
9. Como o mercado **reagiria a uma resposta dos grandes portais** (copiar o recurso, baixar preço)?
10. Que **métricas iniciais** indicam product-market fit em 90 dias?

## 11. Perfis sugeridos para os agentes da simulação
- Cliente de **primeiro carro** (renda média, inseguro, usa WhatsApp e Instagram), com faixa de preço até R$ 50 mil.
- Cliente **experiente** que compara preços em vários portais.
- **Garagista pequeno** (3–10 carros, anuncia por WhatsApp/Instagram e um portal).
- **Garagista médio** (20–60 carros, paga portal, tem vendedores).
- **Despachante** local.
- **Gestor de portal concorrente** (reação do mercado).
- **Regulador/consumidor atento** a LGPD e a golpes.

## 12. Cenário e limites para a simulação
- Horizonte: **6 a 12 meses** a partir do lançamento web, começando em **uma região metropolitana** do Brasil.
- Parâmetros livres (a explorar): mensalidade, preço do crédito, quantidade de créditos por plano, meta de garagens ativas.
- Não assuma números de mercado que não estejam aqui; quando precisar de um, trate como **hipótese explícita**.
