# Carro Fácil

App web (PWA, mobile-first) para quem está em busca do primeiro carro.

- **Catálogo**: busca e filtros (preço, tipo, câmbio, cidade), detalhe do carro, contato por WhatsApp/telefone e favoritos.
- **Despachantes**: contatos com ligação/WhatsApp direto e ordenação por proximidade (geolocalização opcional, processada só no aparelho).
- **Guia do primeiro carro**: passo a passo com checklist salvo no aparelho + lista de documentos.
- **Simulador de financiamento** (estimativa por parcelas fixas).
- Instalável na tela inicial e com cache offline.

## Rodar

    python3 -m http.server 8000   # nesta pasta, e abra http://localhost:8000

## Dados

`js/data.js` contém **dados fictícios** de exemplo (carros, despachantes, telefones). Substitua por dados reais ou por uma API.
Telefones: formato internacional, só dígitos (ex.: `5548999999999`).

## Próximos passos sugeridos

Fotos reais dos carros, backend (ex.: Supabase) para cadastro por lojas/despachantes, mapa, avaliações.

## Login do comprador (Supabase)

E-mail/senha e Google. Login libera: contatos (WhatsApp/telefone) de vendedores e despachantes, e salva favoritos e progresso do guia na conta (tabela `preferencias`, com RLS em `supabase/schema.sql`).
Projeto Supabase: `carro-facil` (ref `idqaecjrakbrpatgvczq`, região sa-east-1). Chaves públicas em `js/config.js`.
Sem a config ou sem a biblioteca, o app funciona normalmente, sem conta.

> Limite atual: os contatos ainda vêm de `js/data.js`, então o bloqueio é só de tela. Para proteção real, mover os contatos para uma tabela no Supabase legível apenas por usuários logados.

### Configuração pendente (manual)
1. **Google Cloud Console** → APIs e serviços → Credenciais → criar *ID do cliente OAuth* (tipo Web). Em "URIs de redirecionamento autorizados": `https://idqaecjrakbrpatgvczq.supabase.co/auth/v1/callback`.
2. **Supabase** → Authentication → Providers → Google: ativar e colar Client ID e Client Secret.
3. **Supabase** → Authentication → URL Configuration: definir *Site URL* e adicionar em *Redirect URLs* o endereço onde o app for publicado.
4. E-mail de confirmação: o remetente padrão do Supabase tem limite baixo de envios; para uso real configure um SMTP próprio (Authentication → SMTP).
