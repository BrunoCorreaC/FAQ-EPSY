-- Aplicado no projeto "carro-facil" (migração negocio_aprovacao_leads_radar_push).
-- Aprovação de garagistas, consentimento LGPD, leads com créditos, radar de demanda e push.
-- Pré-requisito: extensão pg_net. Depois de aplicar, faça o deploy da função supabase/functions/notificar
-- (verify_jwt desligado) e chame-a uma vez com {"init": true} para gerar as chaves VAPID.
-- Defina o administrador: insert into public.admin_emails values ('seu-email@dominio.com');  (em minúsculas)
-- Ajuste o contato do push: update public.config_privada set valor = 'mailto:contato@seu-dominio.com' where chave = 'vapid_subject';

create extension if not exists pg_net with schema extensions;

-- 1) Aprovação de garagistas -------------------------------------------------
alter table public.garagens add column status_aprovacao text not null default 'pendente'
  check (status_aprovacao in ('pendente', 'aprovada', 'suspensa'));
update public.garagens set status_aprovacao = 'aprovada' where demo;
revoke insert, update on public.garagens from authenticated;
grant insert (owner_id, nome, cidade, uf) on public.garagens to authenticated;
grant update (nome, cidade, uf) on public.garagens to authenticated;

create table public.garagem_privado (
  garagem_id uuid primary key references public.garagens (id) on delete cascade,
  cnpj text check (cnpj ~ '^[0-9]{14}$'),
  creditos integer not null default 0 check (creditos >= 0)
);
alter table public.garagem_privado enable row level security;
create policy "privado: dono le" on public.garagem_privado for select to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "privado: dono cria" on public.garagem_privado for insert to authenticated
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "privado: dono altera" on public.garagem_privado for update to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
revoke insert, update on public.garagem_privado from authenticated;
grant insert (garagem_id, cnpj) on public.garagem_privado to authenticated;
grant update (cnpj) on public.garagem_privado to authenticated;
insert into public.garagem_privado (garagem_id) select id from public.garagens on conflict do nothing;

create table public.admin_emails (email text primary key check (email = lower(email)));
alter table public.admin_emails enable row level security;
create table public.creditos_log (
  id bigint generated always as identity primary key,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  qtd integer not null, motivo text not null default '', por uuid, criado_em timestamptz not null default now()
);
alter table public.creditos_log enable row level security;

create function public.sou_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u join public.admin_emails a on a.email = lower(u.email)
                 where u.id = (select auth.uid()) and u.email_confirmed_at is not null)
$$;

create function public.admin_garagens() returns table (id uuid, nome text, cidade text, uf text, status_aprovacao text, cnpj text, telefone text, creditos integer, criado_em timestamptz, demo boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select g.id, g.nome, g.cidade, g.uf::text, g.status_aprovacao, p.cnpj, c.telefone, coalesce(p.creditos, 0), g.criado_em, g.demo
    from public.garagens g left join public.garagem_privado p on p.garagem_id = g.id left join public.garagem_contatos c on c.garagem_id = g.id
    order by (g.status_aprovacao = 'pendente') desc, g.criado_em desc;
end $$;

create function public.admin_definir_status(p_garagem uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_status not in ('pendente', 'aprovada', 'suspensa') then raise exception 'status_invalido'; end if;
  update public.garagens set status_aprovacao = p_status where id = p_garagem;
end $$;

create function public.admin_conceder_creditos(p_garagem uuid, p_qtd integer, p_motivo text default '') returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_qtd = 0 or p_qtd not between -1000 and 1000 then raise exception 'quantidade_invalida'; end if;
  insert into public.garagem_privado (garagem_id, creditos) values (p_garagem, greatest(p_qtd, 0))
    on conflict (garagem_id) do update set creditos = greatest(public.garagem_privado.creditos + p_qtd, 0)
    returning creditos into v;
  insert into public.creditos_log (garagem_id, qtd, motivo, por) values (p_garagem, p_qtd, left(coalesce(p_motivo, ''), 200), (select auth.uid()));
  return v;
end $$;

drop policy "veiculos: todos veem ativos" on public.veiculos;
create policy "veiculos: todos veem ativos" on public.veiculos for select to anon, authenticated
  using (status = 'ativo' and exists (select 1 from public.garagens g where g.id = garagem_id and g.status_aprovacao = 'aprovada'));
drop policy "veiculos: dono cadastra" on public.veiculos;
create policy "veiculos: dono cadastra" on public.veiculos for insert to authenticated
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid()) and g.status_aprovacao = 'aprovada'));
drop policy "veiculos: dono altera" on public.veiculos;
create policy "veiculos: dono altera" on public.veiculos for update to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid()) and g.status_aprovacao = 'aprovada'));
drop policy "fotos: dono envia" on storage.objects;
create policy "fotos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'veiculos' and (storage.foldername(name))[1] in (select g.id::text from public.garagens g where g.owner_id = (select auth.uid()) and g.status_aprovacao = 'aprovada'));

-- 2) Consentimento (LGPD) e identificador anônimo da busca --------------------
alter table public.preferencias
  add column autoriza_contato boolean not null default false,
  add column autorizado_em timestamptz,
  add column lead_ref uuid not null default gen_random_uuid() unique;
revoke insert, update on public.preferencias from authenticated;
grant insert (user_id, favoritos, passos, busca, autoriza_contato, autorizado_em, atualizado_em) on public.preferencias to authenticated;
grant update (favoritos, passos, busca, autoriza_contato, autorizado_em, atualizado_em) on public.preferencias to authenticated;

-- 3) Regra única de combinação veículo x busca ---------------------------------
create function public.combina(v public.veiculos, b jsonb) returns boolean language sql immutable set search_path = public as $$
  select (b->>'uf' is null or b->>'uf' = v.uf)
    and (b->>'cidade' is null or lower(b->>'cidade') = lower(v.cidade))
    and (b->>'marca' is null or lower(b->>'marca') = lower(v.marca))
    and (b->>'modelo' is null or lower(v.modelo) like '%' || lower(b->>'modelo') || '%')
    and (b->>'anoMin' is null or v.ano >= (b->>'anoMin')::int)
    and (b->>'anoMax' is null or v.ano <= (b->>'anoMax')::int)
    and (b->>'precoMin' is null or v.preco >= (b->>'precoMin')::numeric)
    and (b->>'precoMax' is null or v.preco <= (b->>'precoMax')::numeric)
    and (b->>'kmMax' is null or v.km <= (b->>'kmMax')::int)
    and (b->>'cambio' is null or b->>'cambio' = v.cambio)
    and (b->>'combustivel' is null or b->>'combustivel' = v.combustivel)
    and (b->>'tipo' is null or b->>'tipo' = v.tipo)
    and (b->>'garagem' is null or b->>'garagem' = v.garagem_id::text)
$$;
revoke execute on function public.combina(public.veiculos, jsonb) from public, anon, authenticated;

create or replace function public.compradores_interessados(p_veiculo bigint) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.veiculos v
  join public.garagens g on g.id = v.garagem_id and g.owner_id = (select auth.uid())
  join public.preferencias p on p.busca <> '{}'::jsonb
  where v.id = p_veiculo and public.combina(v, p.busca)
$$;

-- 4) Clientes buscando (leads) com desbloqueio por crédito --------------------
create table public.desbloqueios (
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  lead_ref uuid not null, criado_em timestamptz not null default now(),
  primary key (garagem_id, lead_ref)
);
alter table public.desbloqueios enable row level security;
create policy "desbloqueio: dono le" on public.desbloqueios for select to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));

create function public.demandas_para_mim() returns table (lead_ref uuid, busca jsonb, compat integer, atualizado_em timestamptz, desbloqueado boolean)
language sql stable security definer set search_path = public as $$
  select p.lead_ref, p.busca - 'garagem', count(distinct v.id)::int, p.atualizado_em,
         exists (select 1 from public.desbloqueios d where d.garagem_id = g.id and d.lead_ref = p.lead_ref)
  from public.garagens g
  join public.veiculos v on v.garagem_id = g.id and v.status = 'ativo'
  join public.preferencias p on p.autoriza_contato and p.busca <> '{}'::jsonb and public.combina(v, p.busca)
  where g.owner_id = (select auth.uid()) and g.status_aprovacao = 'aprovada'
  group by g.id, p.lead_ref, p.busca, p.atualizado_em
  order by p.atualizado_em desc limit 100
$$;

create function public.desbloquear_lead(p_lead uuid) returns table (nome text, telefone text)
language plpgsql security definer set search_path = public as $$
declare g public.garagens;
begin
  select * into g from public.garagens where owner_id = (select auth.uid());
  if not found or g.status_aprovacao <> 'aprovada' then raise exception 'garagem_nao_aprovada'; end if;
  if not exists (select 1 from public.preferencias p join public.veiculos v on v.garagem_id = g.id and v.status = 'ativo'
                 where p.lead_ref = p_lead and p.autoriza_contato and public.combina(v, p.busca)) then
    raise exception 'lead_indisponivel';
  end if;
  if not exists (select 1 from public.desbloqueios d where d.garagem_id = g.id and d.lead_ref = p_lead) then
    update public.garagem_privado set creditos = creditos - 1 where garagem_id = g.id and creditos >= 1;
    if not found then raise exception 'sem_creditos'; end if;
    insert into public.desbloqueios (garagem_id, lead_ref) values (g.id, p_lead);
  end if;
  return query select pf.nome, pf.telefone from public.preferencias p join public.perfis pf on pf.id = p.user_id where p.lead_ref = p_lead;
end $$;

create function public.meus_desbloqueios() returns table (lead_ref uuid, nome text, telefone text, busca jsonb, desbloqueado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select d.lead_ref, pf.nome, pf.telefone, p.busca - 'garagem', d.criado_em
  from public.garagens g join public.desbloqueios d on d.garagem_id = g.id
  join public.preferencias p on p.lead_ref = d.lead_ref and p.autoriza_contato
  join public.perfis pf on pf.id = p.user_id
  where g.owner_id = (select auth.uid()) order by d.criado_em desc
$$;

-- 5) Radar de demanda (agregado; grupos com menos de 3 pessoas ficam ocultos) ---
create function public.radar_demanda() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not (public.sou_admin() or exists (select 1 from public.garagens g where g.owner_id = (select auth.uid()) and g.status_aprovacao = 'aprovada')) then
    raise exception 'nao_autorizado';
  end if;
  with b as (select busca from public.preferencias where busca <> '{}'::jsonb)
  select jsonb_build_object(
    'total', (select count(*) from b),
    'marcas', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (select initcap(lower(busca->>'marca')) k, count(*) n from b where busca ? 'marca' group by 1 having count(*) >= 3 order by 2 desc limit 8) t), '[]'::jsonb),
    'modelos', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (select initcap(lower(trim(busca->>'modelo'))) k, count(*) n from b where busca ? 'modelo' group by 1 having count(*) >= 3 order by 2 desc limit 8) t), '[]'::jsonb),
    'ufs', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (select busca->>'uf' k, count(*) n from b where busca ? 'uf' group by 1 having count(*) >= 3 order by 2 desc limit 8) t), '[]'::jsonb),
    'tipos', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (select busca->>'tipo' k, count(*) n from b where busca ? 'tipo' group by 1 having count(*) >= 3 order by 2 desc) t), '[]'::jsonb),
    'cambio', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (select busca->>'cambio' k, count(*) n from b where busca ? 'cambio' group by 1 having count(*) >= 3 order by 2 desc) t), '[]'::jsonb),
    'faixas', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (
        select case when (busca->>'precoMax')::numeric <= 30000 then 'Até R$ 30 mil' when (busca->>'precoMax')::numeric <= 50000 then 'R$ 30 a 50 mil'
                    when (busca->>'precoMax')::numeric <= 80000 then 'R$ 50 a 80 mil' when (busca->>'precoMax')::numeric <= 120000 then 'R$ 80 a 120 mil' else 'Acima de R$ 120 mil' end k, count(*) n
        from b where busca ? 'precoMax' group by 1 having count(*) >= 3 order by 2 desc) t), '[]'::jsonb),
    'favoritos', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'total', n) order by n desc) from (
        select v.marca || ' ' || v.modelo k, count(*) n from public.preferencias p cross join lateral unnest(p.favoritos) f(id) join public.veiculos v on v.id = f.id
        group by 1 having count(*) >= 3 order by 2 desc limit 8) t), '[]'::jsonb)
  ) into r;
  return r;
end $$;

-- 6) Push: assinaturas, fila de notificações e gatilhos ------------------------
create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique, p256dh text not null, auth text not null,
  criado_em timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "push: le a propria" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "push: cria a propria" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push: altera a propria" on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "push: apaga a propria" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

create table public.notificacoes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null, titulo text not null, corpo text not null, url text not null default '#/',
  criado_em timestamptz not null default now(), enviada_em timestamptz,
  unique (user_id, chave)
);
alter table public.notificacoes enable row level security;
create policy "notificacoes: le as proprias" on public.notificacoes for select to authenticated using ((select auth.uid()) = user_id);

create table public.config_privada (chave text primary key, valor text not null);
alter table public.config_privada enable row level security;
insert into public.config_privada (chave, valor) values
  ('webhook_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  ('vapid_subject', 'mailto:contato@example.com');

create function public.trg_notificacao_envia() returns trigger language plpgsql security definer set search_path = public as $$
declare seg text;
begin
  select valor into seg from public.config_privada where chave = 'webhook_secret';
  if seg is not null then
    perform net.http_post(url := 'https://idqaecjrakbrpatgvczq.supabase.co/functions/v1/notificar',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', seg),
      body := jsonb_build_object('id', new.id));
  end if;
  return new;
end $$;
create trigger notificacao_envia after insert on public.notificacoes for each row execute function public.trg_notificacao_envia();

create function public.trg_veiculo_notifica() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'ativo' and (tg_op = 'INSERT' or old.status is distinct from 'ativo')
     and exists (select 1 from public.garagens g where g.id = new.garagem_id and g.status_aprovacao = 'aprovada') then
    insert into public.notificacoes (user_id, chave, titulo, corpo, url)
    select p.user_id, 'v:' || new.id, 'Novo carro para você',
           new.marca || ' ' || new.modelo || ' ' || new.ano || ' · R$ ' || regexp_replace(round(new.preco)::text, '(\d)(?=(\d{3})+$)', '\1.', 'g'),
           '#/carro/' || new.id
    from public.preferencias p
    where p.busca <> '{}'::jsonb and public.combina(new, p.busca)
      and exists (select 1 from public.push_subscriptions s where s.user_id = p.user_id)
      and not exists (select 1 from public.garagens g where g.id = new.garagem_id and g.owner_id = p.user_id)
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger veiculo_notifica after insert or update of status on public.veiculos for each row execute function public.trg_veiculo_notifica();

create function public.trg_preferencia_notifica() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.autoriza_contato and new.busca <> '{}'::jsonb
     and (tg_op = 'INSERT' or old.busca is distinct from new.busca or old.autoriza_contato is distinct from new.autoriza_contato) then
    insert into public.notificacoes (user_id, chave, titulo, corpo, url)
    select g.owner_id, 'd:' || new.lead_ref || ':' || g.id, 'Cliente procurando algo como o seu estoque',
           count(distinct v.id)::text || ' veículo(s) seu(s) combinam com uma nova busca. Veja em Clientes.', '#/demanda'
    from public.garagens g join public.veiculos v on v.garagem_id = g.id and v.status = 'ativo'
    where g.status_aprovacao = 'aprovada' and g.owner_id is not null and g.owner_id <> new.user_id
      and public.combina(v, new.busca)
      and exists (select 1 from public.push_subscriptions s where s.user_id = g.owner_id)
    group by g.owner_id, g.id
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger preferencia_notifica after insert or update of busca, autoriza_contato on public.preferencias for each row execute function public.trg_preferencia_notifica();

revoke execute on function public.trg_notificacao_envia(), public.trg_veiculo_notifica(), public.trg_preferencia_notifica() from public, anon, authenticated;
revoke execute on function public.sou_admin(), public.admin_garagens(), public.admin_definir_status(uuid, text), public.admin_conceder_creditos(uuid, integer, text),
  public.demandas_para_mim(), public.desbloquear_lead(uuid), public.meus_desbloqueios(), public.radar_demanda() from public, anon;
grant execute on function public.sou_admin(), public.admin_garagens(), public.admin_definir_status(uuid, text), public.admin_conceder_creditos(uuid, integer, text),
  public.demandas_para_mim(), public.desbloquear_lead(uuid), public.meus_desbloqueios(), public.radar_demanda() to authenticated;
