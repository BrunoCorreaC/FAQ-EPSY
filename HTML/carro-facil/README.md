# Cadê meu carro?

Marketplace mobile-first (PWA) que conecta **clientes** e **garagistas**, com foco em quem busca o primeiro carro.

## Cliente
- Catálogo com fotos, busca e **filtros**: região (estado/cidade), marca, modelo, ano, valor, km, câmbio, combustível, tipo e **garagista**; ordenação por preço, km, ano.
- **Preferências salvas** ("Para você"): carros ranqueados por % de combinação com o que a pessoa procura.
- **"Tenho interesse"**: o garagista recebe nome, WhatsApp e mensagem (só nesse momento).
- Contato (WhatsApp/telefone) só para logados; favoritos e progresso do guia salvos na conta.
- Despachantes (com ordenação por proximidade), guia do primeiro carro e simulador de financiamento.

## Garagista
- Cadastro de perfil e da garagem; **cadastro/edição de veículos** com até 6 fotos (compressão no aparelho), status ativo/pausado/vendido.
- Painel: anúncios, **interessados** (com WhatsApp e "marcar atendido") e **buscas compatíveis** (quantos clientes têm preferências que combinam com cada veículo, sem identificá-los).

## Rodar

    python3 -m http.server 8000   # nesta pasta, e abra http://localhost:8000

Estrutura: `index.html`, `style.css`, `js/` (`core` estado/Supabase, `catalogo`, `garagem`, `extras`, `main` roteador), `supabase/` (SQL).

## Modelo de negócio (demanda x oferta)
- **Clientes** dizem o que procuram (busca salva) e, se **autorizarem** (LGPD, opt-in explícito e reversível), aparecem para garagens aprovadas.
- **Garagistas** só anunciam e veem clientes depois de **aprovados** (CNPJ + análise no painel `#/admin`).
- **Clientes buscando** (`#/demanda`): a garagem vê buscas compatíveis com o próprio estoque **sem dados pessoais**; para ver nome e WhatsApp, gasta **1 crédito** (idempotente: reabrir o mesmo cliente não cobra de novo; se o cliente retirar o consentimento, o contato some).
- "Tenho interesse" (o cliente escolhe uma garagem) continua gratuito para a garagem: é lead quente.
- **Créditos** são concedidos pelo admin (piloto com cobrança manual: Pix/boleto fora do app). Integração de pagamento fica para depois de validar o preço.
- **Radar de demanda** (`#/radar`): o que os clientes cadastrados buscam e favoritam, agregado (grupos com menos de 3 pessoas ficam ocultos) + referência de mercado (Fenauto/Webmotors).
- **Push** nos dois sentidos: cliente é avisado quando entra carro parecido com a busca; garagista, quando surge cliente para o estoque dele. No iPhone só funciona com o app na **tela inicial**.

## Assinaturas e pagamentos (painel administrativo)
Garagem aprovada só anuncia e vê clientes com **assinatura mensal** em dia (ou em teste/cortesia). Os **valores dos planos são definidos por você** em `#/admin/planos` (nada vem pré-definido; os 3 planos iniciais estão com valor 0 e inativos).
- **Abas do admin** (`#/admin`): Garagens (aprovação) · Assinaturas (receita mensal, recebido, a receber, vencido; criar/alterar/suspender/cancelar) · Cobranças (registrar/desfazer pagamento, cancelar) · Planos (valor, limite de anúncios, créditos/mês) · Ajustes (instruções de pagamento e dias de carência).
- **Mensalidades recorrentes:** uma rotina diária no banco (pg_cron, 08h de Brasília) gera a cobrança do mês 5 dias antes do vencimento, marca vencidas, coloca a assinatura **em atraso** e, passada a **carência**, **suspende** (anúncios saem do catálogo). Registrar o pagamento reativa e soma os créditos do plano.
- **Limite de anúncios** por plano (bloqueado no banco), **teste grátis** por dias, **cortesia** e valor especial por garagem. Toda ação do admin fica em `assinatura_log`.
- O garagista vê a própria situação em `#/assinatura` (plano, próxima cobrança, últimas cobranças e como pagar) e recebe push de nova mensalidade, atraso e suspensão.
- **Recebimento:** por enquanto o admin confirma o pagamento (Pix/boleto/dinheiro). Cobrança automática em cartão ou débito exige contratar um provedor (Asaas, Mercado Pago, Stripe…); as tabelas já têm `gateway`/`gateway_ref`.

## Validações e diferenciais

- **Cliente e garagista**: nome, telefone (DDD e formato BR), e-mail, senha (8+ com letra e número), CNPJ (dígitos verificadores), UF, anos, preços e km são validados na tela, com erro ao lado do campo, e novamente no banco (`supabase/005_validacoes.sql`).
- **Busca salva** (`preferencias.busca`) é validada no banco para que um JSON inválido não quebre o match de ninguém.
- **Anúncio ativo exige foto** e fotos só na pasta da própria garagem (`006_foto_obrigatoria.sql`).
- **Erros** de rede/sessão/banco aparecem em português (`CF.msgErro`), com aviso de offline.
- **Diferenciais**: selo "Verificada" (CNPJ aprovado), demanda qualificada com consentimento (LGPD), só garagistas aprovados e em dia anunciam.

## Placa e selo "Dados conferidos"

- Campo **Placa** no anúncio (antiga `ABC-1234` ou Mercosul `ABC1D23`), obrigatório para garagens reais. Fica numa tabela privada (`veiculo_placas`): o catálogo público não a vê. Não se repete em dois anúncios não vendidos da mesma garagem.
- Botão **Consultar placa**: a Edge Function `consulta_placa` valida garagem liberada, formato, **cota diária** (`placa_limite_dia`, padrão 30) e **cache de 30 dias** por placa, e preenche marca, modelo, ano, cor e combustível.
- O selo **Dados conferidos** é decidido só pelo banco (`placa_confere`): a consulta precisa ser da própria garagem, de provedor real, e marca, modelo e ano do anúncio têm de bater. Mudou algum desses campos, o selo é recalculado. Não dá para forjá-lo por insert/update.
- Provedor: `config_privada.placa_provedor` = `simulado` (padrão; dados fictícios, **nunca** gera selo). Para ativar um real, implemente `consultaProvedor` em `supabase/functions/consulta_placa/index.ts` conforme a documentação do contratado, guarde a chave nos segredos da função e mude `placa_provedor`.
- Migração: `supabase/007_placa.sql`.

## Backend (Supabase)
Projeto `carro-facil` (ref `idqaecjrakbrpatgvczq`, sa-east-1). Chaves públicas em `js/config.js`.
SQL: `supabase/schema.sql` (login/preferências/despachantes), `002_marketplace.sql` (perfis, garagens, veículos, interesses, fotos), `003_negocio.sql` (aprovação, consentimento, leads/créditos, radar, push) e `004_assinaturas.sql` (planos, assinaturas, cobranças, rotina diária). Função de push: `supabase/functions/notificar` (verify_jwt desligado; autenticada por segredo compartilhado em `config_privada`).
Tudo com RLS; funções sensíveis (`SECURITY DEFINER`) checam o usuário por dentro. Telefones e créditos nunca ficam em tabelas públicas.

**Dados de exemplo:** 6 garagens e 12 veículos fictícios (`garagens.demo = true`, aprovadas, sem dono). Para remover: `delete from garagens where demo;`.

### Configuração pendente (manual)
0. **Mensalidades:** em `#/admin/planos` defina o valor de cada plano e ative os que quiser oferecer; em `#/admin/ajustes` escreva as instruções de pagamento (chave Pix etc.) e a carência. Depois de aprovar uma garagem, crie a assinatura em `#/admin/assinaturas` (teste grátis, cortesia ou cobrança).
1. **Administrador:** no SQL Editor do Supabase, `insert into public.admin_emails values ('seu-email@dominio.com');` (minúsculas). Só vale para e-mail **confirmado** no login.
2. **Contato do push:** `update public.config_privada set valor = 'mailto:contato@seu-dominio.com' where chave = 'vapid_subject';`
3. **Comercial:** em `js/config.js`, `contatoComercial` (WhatsApp `55DDDNUMERO`) para o garagista pedir créditos.
4. **Google:** criar *ID do cliente OAuth* (Web) no Google Cloud Console, URI de redirecionamento `https://idqaecjrakbrpatgvczq.supabase.co/auth/v1/callback`; ativar em Supabase → Authentication → Providers → Google.
5. **Supabase** → Authentication → URL Configuration: *Site URL* e *Redirect URLs* com o endereço publicado.
6. E-mails de confirmação/recuperação: configure SMTP próprio (o padrão do Supabase tem limite baixo).
7. **Deploy (escolha um):**
   - **GitHub Pages** (já configurado em `.github/workflows/pages.yml`): em *Settings → Pages → Source* escolha **GitHub Actions**. O endereço sai como `https://<usuario>.github.io/FAQ-EPSY/`. (Em repositório privado o Pages exige plano pago do GitHub.)
   - **Vercel:** importar o repositório com *Root Directory* `HTML/carro-facil` (site estático, sem build).
   - Push exige HTTPS nos dois.
8. **LGPD:** revisar com advogado os textos de consentimento e a política de privacidade antes de operar com clientes reais.

## Lojas (App Store / Google Play)
Consulta de placa com dados reais: [`ATIVAR_PLACA.md`](ATIVAR_PLACA.md).
Projeto Capacitor em `/mobile`, exigências das lojas em `supabase/008_lojas.sql` (exclusão de conta, denúncia, ocultar garagem, token de push) e checklist com custos em [`LANCAMENTO.md`](LANCAMENTO.md).
