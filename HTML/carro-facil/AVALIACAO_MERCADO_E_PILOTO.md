# Cadê meu carro? — Avaliação de mercado e plano de piloto

Data da pesquisa: out/2026. Fontes são resultados de busca na web; alguns sites (Reclame Aqui, Seu Dinheiro, páginas de preço) não puderam ser abertos. **Números sem fonte são hipóteses minhas e estão marcados.**

## 1. Veredito
O mercado é grande e a tese tem espaço, mas só vale como **teste barato de 60 a 90 dias com critérios de parada**. O risco financeiro é pequeno; o risco real é a ideia não pegar (garagistas pagarem e clientes autorizarem o compartilhamento). Não apostar alto antes de validar.

## 2. Mercado
- 2025: **18.508.929** usados e seminovos vendidos, recorde da série (desde 2011), **+17,3%** vs 2024 — [Fenauto](https://www.fenauto.org.br/news/vendas-de-veiculos-seminovos-e-usados-de-2025-ja-superam-total-de-2024), [O Tempo](https://www.otempo.com.br/autotempo/2026/1/7/mercado-de-carros-usados-bate-recorde-em-2025-com-18-5-milhoes-de-vendas).
- Setor com mais profissionalização das multimarcas — [AutoData](https://www.autodata.com.br/noticias/2026/01/08/mercado-de-veiculos-usados-bate-novo-recorde/98356/).
- **Lacuna:** não foi encontrado o número de revendas de usados no país nem por região (os resultados só traziam concessionárias de marcas novas e grandes redes). Pedir à Fenauto/associações locais.

## 3. Concorrência
| Player | Dado encontrado |
|---|---|
| Webmotors | ~33 mi de visitas mensais (2024), [fonte](https://www.webmotors.com.br/vender-carro). Planos para lojista: **Performance (paga por lead)**, **Controle (teto mensal)** e **Web** — [fonte](https://www.webmotors.com.br/wm1/seu-bolso/quanto-custa-vender-na-webmotors). |
| OLX | Maior classificado de autos, anúncios gratuitos para muitos casos — [NaPista](https://napista.com.br/radar/melhores-sites-de-carros-usados/). |
| Mobiauto | ~5 mi de acessos e ~200 mil veículos — [fonte](https://naoeagencia.com.br/seo/2025/06/02/estrategia-seo-mercado-carros-mobiauto/). |
| iCarros, NaPista, Autoline | Portais ligados a bancos. |
| Kavak, Localiza/Unidas Seminovos | Estoque próprio, inspeção/garantia (modelo diferente de classificado). |
| Facebook Marketplace + WhatsApp | Gratuito para o lojista — [fonte](https://revendamais.com.br/blog/como-vender-carros-pelo-marketplace-do-facebook/). |

**Observações-chave**
1. Os grandes portais são **ligados a bancos** (Webmotors–Santander, iCarros–Itaú, NaPista–BV, Autoline–Bradesco, Mobiauto–Banco Pan, segundo [agregador de comparação](https://moobiai.com.br/blog/melhor-site-para-comprar-e-vender-carros-comparativo-completo-das-principais-plataformas/)). A receita grande está no **financiamento**; eles podem manter preço de anúncio baixo. Competir em preço de anúncio é difícil.
2. **Vender lead por desempenho já existe** (Plano Performance da Webmotors). O diferencial não é "pagar por contato", é **o tipo de contato**: cliente que declara o que procura, com consentimento.
3. **Hipótese minha (sem dado):** o lead de portal (cliente clicou num carro) tem intenção maior que o nosso (cliente salvou uma busca). O valor percebido pelo garagista pode ser menor. É o ponto central a validar.
4. Preços citados em comparadores ("Webmotors a partir de R$ 137; Mobiauto a partir de R$ 49") são ambíguos (podem ser por anúncio de pessoa física); **não usar como preço de lojista** sem confirmar.
5. Existe ao menos [um post de lojista no Reclame AQUI](https://www.reclameaqui.com.br/webmotors-compreauto-vmotors/nao-indico-para-nenhum-lojista-e-pessoa-fisica-leia-antes_BEKBJpx0rG4Z-Q_4/) criticando a Webmotors; conteúdo não verificado, frequência desconhecida.

## 4. Onde a ideia pode caber
- **Garagista pequeno/regional** que hoje vive de Instagram, WhatsApp e Marketplace gratuito e não compensa o portal grande. *(hipótese)*
- **Cliente de primeiro carro**, que precisa de orientação (guia, despachante, simulador) e tem medo de golpe. *(hipótese)*
- Atuação **regional** (uma cidade/região), onde dá para ter densidade de estoque e de clientes.

## 5. Custo de tentar (estimativas, a confirmar)
| Item | Faixa |
|---|---|
| Antes de lançar (domínio, revisão jurídica mínima, banco pago) | R$ 2.000–7.000 |
| Mensal (banco pago, e-mail), sem placa real e sem lojas de apps | R$ 150–400 |
| Ponto de equilíbrio | Poucas garagens pagantes (mensalidade ainda não definida) |
| **Custo oculto** | Seu tempo e a aquisição (visitas, anúncios, atendimento) |

## 6. Riscos (maior → menor)
1. Ovo e galinha (cliente × estoque). 2. Pouca disposição do garagista pequeno a pagar. 3. Poucos clientes autorizando o compartilhamento. 4. Sem audiência própria. 5. Jurídico/LGPD.

---

# Plano de piloto (8 semanas, uma região)

## Pré-requisitos (semana 0)
- [ ] Link público do app (GitHub Pages ativado) e URL cadastrada no Supabase Auth.
- [ ] Conta admin criada; **planos e valores definidos** em `#/admin/planos`; instruções de pagamento (Pix) em `#/admin/ajustes`; `contatoComercial` (WhatsApp) em `js/config.js`.
- [ ] Revisão jurídica **mínima** dos Termos e da Privacidade (`js/legal.js`); dados da empresa preenchidos; `documentosRevisados: true` só depois da revisão.
- [ ] Escolher a **região** (cidade onde você consegue visitar lojas pessoalmente) e mapear **30–40 revendas** (Google Maps, Instagram, grupos locais).
- [ ] Planilha de acompanhamento (garagem, contato, estágio, data, observação).

## Oferta ao garagista (sugestão, a ajustar)
- Cadastro **assistido por você** (você preenche com ele em 10 minutos, com 5+ carros e fotos).
- **Teste grátis de 30–60 dias** (o app já suporta teste e carência) e créditos de leads de cortesia.
- Compromisso de preço fixo de lançamento para quem entrar no piloto.
- Valor da mensalidade **a definir por você**; use o piloto para descobrir a faixa aceita (ex.: perguntar "qual valor você pagaria?" e testar 2 valores).

## Cronograma
| Semana | Foco | Entregável |
|---|---|---|
| 0 | Pré-requisitos acima | App no ar, planos definidos, lista de 30–40 lojas |
| 1 | Abordagem a lojistas (visita + WhatsApp) | 15–20 conversas, 5 cadastros |
| 2 | Cadastro assistido e estoque inicial | 10 garagens com 5+ carros cada |
| 3 | Atrair clientes: grupos regionais, parceria com despachantes, indicação das próprias lojas | Primeiros 50–100 clientes cadastrados |
| 4 | Medir: leads gerados, desbloqueios, interesse enviado; entrevistas de 15 min com 5 lojistas | Relatório da semana 4 |
| 5–6 | Corrigir o que travou (cadastro, fotos, mensagem); reforçar a captação de clientes | Segunda onda de lojas |
| 7 | **Pedir o pagamento**: apresentar mensalidade ao fim do teste | Quantas aceitam pagar |
| 8 | Decisão com os critérios abaixo | Documento de decisão |

## Roteiro de abordagem (WhatsApp/visita)
> "Oi, [nome]! Sou o [seu nome], estou lançando o *Cadê meu carro?* em [cidade]. Diferente dos portais, a gente mostra para a loja **quem está procurando um carro como o seu estoque** e você libera o contato do cliente quando quiser. Posso cadastrar sua loja agora, de graça, em 10 minutos? Sem compromisso por [30/60] dias."

Perguntas para a conversa (ouça mais do que fale): onde vende hoje? quanto gasta por mês com portal/anúncio? quantos contatos bons recebe? o que mais atrapalha? já pagou por lead? quanto valeria um cliente que já disse que quer exatamente aquele carro?

## Métricas (semanal)
| Métrica | Onde medir |
|---|---|
| Garagens cadastradas / aprovadas / com 5+ carros | Admin → Garagens |
| Clientes cadastrados e **% que autoriza contato** | `preferencias.autoriza_contato` (SQL ou painel) |
| Buscas salvas compatíveis com estoque | Painel do garagista ("buscando algo parecido") |
| **Leads desbloqueados** por garagem | Painel "Clientes buscando" / `desbloqueios` |
| Interesses enviados (cliente → garagem) | `interesses` |
| Visitas/vendas relatadas pelas lojas | Entrevista semanal (manual) |
| Garagens que **aceitam pagar** ao fim do teste | Admin → Assinaturas |

## Critérios de decisão (sugestão; ajuste conforme sua tolerância)
**Seguir** se, ao final da semana 8:
- **≥ 30%** das garagens do piloto aceitarem pagar a mensalidade;
- **≥ 20%** dos clientes autorizarem o compartilhamento;
- **≥ 1 em 3** garagens desbloquear leads de forma recorrente;
- pelo menos **algumas visitas/vendas** atribuídas pelas lojas à plataforma.

**Pivotar ou parar** se:
- **< 3** garagens aceitarem pagar mesmo com teste grátis e valor baixo;
- clientes não autorizarem o compartilhamento;
- leads não gerarem visita (o produto não entrega valor);
- o custo de aquisição por garagem for maior que a receita de 6 meses.

**Pivôs possíveis**, caso o piloto mostre sinal parcial: (a) foco total em garagista pequeno com mensalidade mínima; (b) trocar créditos por assinatura simples; (c) foco no cliente de primeiro carro com monetização por financiamento/parceiros (onde o setor realmente ganha); (d) captação de leads com despachantes e consignação.

## O que depende de você e não pode ser feito por mim
Contratar o jurídico; visitar e conversar com lojistas; decidir preço; ativar o Pages e o Supabase Auth; criar a conta admin e cadastrar Pix; interpretar as entrevistas.
