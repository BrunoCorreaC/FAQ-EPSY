-- Já aplicado no projeto "carro-facil" (migrações preferencias_comprador e contatos_somente_logados).
-- Guarda favoritos e progresso do guia de cada comprador; cada usuário só acessa a própria linha.
create table public.preferencias (
  user_id uuid primary key references auth.users (id) on delete cascade,
  favoritos integer[] not null default '{}',
  passos integer[] not null default '{}',
  atualizado_em timestamptz not null default now()
);

alter table public.preferencias enable row level security;

create policy "le propria linha" on public.preferencias
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cria propria linha" on public.preferencias
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "altera propria linha" on public.preferencias
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "apaga propria linha" on public.preferencias
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Contatos (telefones) de vendedores e despachantes: só usuários logados leem.
-- chave: 'c<id>' = vendedor do carro, 'd<id>' = despachante. Telefone em dígitos, formato internacional.
create table public.contatos (
  chave text primary key,
  telefone text not null check (telefone ~ '^[0-9]{12,13}$')
);

alter table public.contatos enable row level security;

create policy "logados leem contatos" on public.contatos
  for select to authenticated using (true);
-- sem policy de insert/update/delete: só o painel/admin grava.

-- Os dados de exemplo (fictícios) estão na migração; troque pelos números reais no painel do Supabase.

-- ATENÇÃO: os contatos de vendedores (chaves c<id>) foram substituídos por garagem_contatos.
-- `contatos` agora guarda apenas despachantes (d1..d5). Veja 002_marketplace.sql.
