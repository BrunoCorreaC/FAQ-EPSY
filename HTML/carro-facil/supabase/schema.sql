-- Já aplicado no projeto "carro-facil" (migração preferencias_comprador).
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
