# Carro Fácil

Marketplace mobile-first (PWA) que conecta **compradores** e **garagistas**, com foco em quem busca o primeiro carro.

## Comprador
- Catálogo com fotos, busca e **filtros**: região (estado/cidade), marca, modelo, ano, valor, km, câmbio, combustível, tipo e **garagista**; ordenação por preço, km, ano.
- **Preferências salvas** ("Para você"): carros ranqueados por % de combinação com o que a pessoa procura.
- **"Tenho interesse"**: o garagista recebe nome, WhatsApp e mensagem (só nesse momento).
- Contato (WhatsApp/telefone) só para logados; favoritos e progresso do guia salvos na conta.
- Despachantes (com ordenação por proximidade), guia do primeiro carro e simulador de financiamento.

## Garagista
- Cadastro de perfil e da garagem; **cadastro/edição de veículos** com até 6 fotos (compressão no aparelho), status ativo/pausado/vendido.
- Painel: anúncios, **interessados** (com WhatsApp e "marcar atendido") e **buscas compatíveis** (quantos compradores têm preferências que combinam com cada veículo, sem identificá-los).

## Rodar

    python3 -m http.server 8000   # nesta pasta, e abra http://localhost:8000

Estrutura: `index.html`, `style.css`, `js/` (`core` estado/Supabase, `catalogo`, `garagem`, `extras`, `main` roteador), `supabase/` (SQL).

## Backend (Supabase)
Projeto `carro-facil` (ref `idqaecjrakbrpatgvczq`, sa-east-1). Chaves públicas em `js/config.js`. SQL em `supabase/schema.sql` (login/preferências/contatos de despachantes) e `supabase/002_marketplace.sql` (perfis, garagens, veículos, interesses, match, fotos).
Tudo protegido por RLS: veículos ativos e garagens são públicos; telefones só para logados; interesses só para o comprador e o dono do veículo; fotos só gravadas pelo dono da garagem (bucket `veiculos`).

**Dados de exemplo:** 6 garagens e 12 veículos fictícios (`garagens.demo = true`, sem dono). Para remover: `delete from garagens where demo;` (os veículos saem junto).

### Configuração pendente (manual)
1. **Google**: criar *ID do cliente OAuth* (Web) no Google Cloud Console, com URI de redirecionamento `https://idqaecjrakbrpatgvczq.supabase.co/auth/v1/callback`; ativar em Supabase → Authentication → Providers → Google.
2. **Supabase** → Authentication → URL Configuration: *Site URL* e *Redirect URLs* com o endereço onde o app for publicado.
3. E-mails de confirmação/recuperação: o remetente padrão do Supabase tem limite baixo; configure SMTP próprio para uso real.
4. Deploy: importar o repositório no Vercel com *Root Directory* `HTML/carro-facil` (site estático, sem build).
