# Lançamento nas lojas: o que fazer e quanto custa

Valores em reais são **estimativas** (dólar a ~R$ 5,50, preços de lista consultados de memória/pesquisa em out/2026). Confirme nas páginas oficiais antes de pagar.

## O que já está pronto no código
Exclusão de conta no app, denúncia e ocultar garagem, painel de denúncias (admin), Entrar com Apple, termos/privacidade/suporte (minutas), aceite dos termos no cadastro, push nativo (FCM) e projetos Android/iOS em `mobile/`, ícones e splash, iOS sem instruções de pagamento. Banco e funções já aplicados no Supabase.

## Sequência do que é seu (por ordem; o que demora vem primeiro)

| # | Ação | Quem | Prazo típico |
|---|---|---|---|
| 1 | **CNPJ** da empresa (se ainda não tiver) e **número D-U-N-S** (gratuito, em dnb.com / pelo portal da Apple) | você + contador | CNPJ 1–7 dias; D-U-N-S 5–30 dias |
| 2 | **Contas de desenvolvedor** como empresa: Apple Developer Program e Google Play Console | você | Apple 1–14 dias após D-U-N-S; Google 2–7 dias de verificação |
| 3 | **Jurídico**: revisar Política de Privacidade e Termos (`js/legal.js`), contrato/termo de adesão do garagista, política de pagamentos; decidir **cobrança fora do app (iOS)** | advogado | 1–3 semanas |
| 4 | **Domínio** (ex.: cademeucarro.com.br) + HTTPS (GitHub Pages ou Vercel) e e-mails `suporte@` e `privacidade@` | você | 1 dia |
| 5 | **Supabase**: subir para o plano Pro, configurar SMTP próprio, URL do site em Auth, Google OAuth, **Sign in with Apple** (Services ID + chave) | você (eu guio) | 1–2 dias |
| 6 | **Firebase**: projeto, apps Android/iOS, `google-services.json`, `GoogleService-Info.plist`, chave APNs (.p8) e conta de serviço em `config_privada.fcm_service_account` | você | 1 dia |
| 7 | **Preencher `js/config.js`**: razão social, CNPJ, e-mails, WhatsApp comercial; marcar `documentosRevisados: true` depois do item 3 | você | 1 hora |
| 8 | **Admin e planos**: criar a conta admin, definir mensalidades e Pix em `#/admin/planos` e `#/admin/ajustes` | você | 1 hora |
| 9 | **Material das lojas**: capturas de tela por aparelho, descrição curta/longa, palavras-chave, categoria, classificação indicativa, formulários *Data Safety* (Google) e *Privacy Nutrition Labels* (Apple), URL de suporte e de privacidade, conta de teste de garagista aprovada para os revisores | você (eu gero rascunhos) | 2–4 dias |
| 10 | **Build e assinatura**: Android (keystore, `bundleRelease`) e iOS (Xcode, certificados, TestFlight) | você + eu | 1–3 dias |
| 11 | **Google Play, conta pessoal apenas**: teste fechado com 12 testadores por 14 dias seguidos (não vale para conta de empresa; por isso o item 2 como empresa) | você | 14 dias |
| 12 | **Enviar para revisão** (TestFlight antes na Apple) e responder à revisão | você | 1–7 dias cada loja; rejeição na 1ª tentativa é comum |
| 13 | **Provedor de placa real** (opcional no lançamento): contratar, passar a chave, eu implemento | você | 1–2 dias |

**Caminho crítico:** itens 1 → 2 → 9/10 → 12. Em paralelo: 3, 4, 5, 6. Estimativa total: **4 a 8 semanas** até as duas lojas aprovadas.

## Pontos de decisão (afetam aprovação e custo)
1. **Cobrança dos garagistas no iOS.** A Apple tende a exigir compra no app (comissão 15–30%) para bens digitais; a exceção para serviços vendidos a organizações existe, mas é interpretada caso a caso. Hoje o iOS **não mostra instruções de pagamento** (`CF.semPagamento`) e a cobrança é feita fora do app. Peça parecer ao advogado e esteja preparado para uma rejeição nesse ponto.
2. **Google Play**: regras de pagamento menos rígidas para este caso, mas confira a política vigente.
3. **Conta Apple como empresa** exige D-U-N-S e pode exigir site e e-mail do domínio da empresa.

## Orçamento

### Pontual (antes do lançamento)
| Item | Faixa estimada |
|---|---|
| Google Play (taxa única, US$ 25) | R$ 140 |
| Apple Developer Program (1º ano, US$ 99) | R$ 550 |
| Domínio .com.br (1º ano) | R$ 40–80 |
| Revisão jurídica (privacidade, termos, contrato do garagista, parecer de pagamentos) | R$ 1.500–6.000 |
| Abertura de CNPJ (se necessário; MEI é gratuito, ME via contador) | R$ 0–1.500 |
| Registro da marca no INPI (opcional; taxa + honorários) | R$ 400–2.000 |
| Capturas/arte de loja por designer (opcional; eu gero rascunhos) | R$ 0–1.500 |
| Build iOS na nuvem nas semanas de build (se não tiver Mac) | R$ 0–500 |
| **Total pontual** | **≈ R$ 2.700–12.000** (típico ≈ R$ 3.500–5.000) |

### Recorrente (por mês)
| Item | Estimativa |
|---|---|
| Supabase Pro (US$ 25 + uso) | R$ 140–250 |
| E-mail transacional (free tier no início; ~US$ 20 depois) | R$ 0–110 |
| Firebase Cloud Messaging (notificações) | R$ 0 |
| Provedor de consulta de placa (Infosimples: franquia mínima R$ 100/mês; preço por consulta a confirmar) | R$ 0–300 (opcional) |
| Gateway Pix/cartão para automatizar mensalidades (opcional; taxa por transação, ~1% Pix, 3–5% cartão) | variável |
| Contador/impostos sobre a receita das mensalidades | conforme regime |
| Monitoramento de erros (Sentry free tier) | R$ 0 |
| **Total recorrente** | **≈ R$ 150–700/mês** |

### Anuais
Apple Developer (≈ R$ 550), domínio (≈ R$ 40–80). Google Play não renova.

### Não incluído
Aquisição de garagistas e clientes (marketing), equipe comercial/atendimento, comissão de 15–30% da Apple caso a compra no app seja exigida, tributos, e eventual DPO terceirizado.

## Antes de publicar, confirme
- [ ] `documentosRevisados: true` e dados da empresa em `js/config.js`
- [ ] Sign in with Apple e Google funcionando no app (redirect `com.cademeucarro.app://auth`)
- [ ] Notificação de teste recebida em Android e iPhone
- [ ] Excluir conta testado com uma conta de cliente e uma de garagista
- [ ] Conta de teste de garagista aprovada informada aos revisores
