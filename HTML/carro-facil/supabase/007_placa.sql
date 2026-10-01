-- Placa do veículo: formato, privacidade, consulta (cache + cota) e selo "Dados conferidos".
-- A placa fica em tabela privada (o catálogo público não a vê); o selo é um boolean público calculado só pelo banco.

create function public.placa_normaliza(p text) returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'))
$$;
-- antiga (ABC1234) ou Mercosul (ABC1D23)
create function public.placa_valida(p text) returns boolean language sql immutable as $$
  select p ~ '^[A-Z]{3}[0-9]{4}$' or p ~ '^[A-Z]{3}[0-9][A-Z][0-9]{2}$'
$$;
create function public.txt_norm(p text) returns text language sql immutable as $$
  select regexp_replace(translate(lower(coalesce(p, '')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[^a-z0-9]', '', 'g')
$$;

create table public.placa_cache (
  placa text primary key check (public.placa_valida(placa)),
  dados jsonb not null,            -- {marca, modelo, ano_fabricacao, ano_modelo, cor, combustivel}
  provedor text not null,
  consultado_em timestamptz not null default now()
);
create table public.placa_consultas (
  id bigint generated always as identity primary key,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  placa text not null,
  de_cache boolean not null default false,
  criado_em timestamptz not null default now()
);
create index placa_consultas_idx on public.placa_consultas (garagem_id, criado_em desc);
create table public.veiculo_placas (
  veiculo_id bigint primary key references public.veiculos (id) on delete cascade,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  placa text not null check (public.placa_valida(placa)),
  atualizado_em timestamptz not null default now()
);
create index veiculo_placas_idx on public.veiculo_placas (garagem_id, placa);
alter table public.placa_cache enable row level security;
alter table public.placa_consultas enable row level security;
alter table public.veiculo_placas enable row level security;
revoke all on public.placa_cache, public.placa_consultas, public.veiculo_placas from anon, authenticated;
create policy "veiculo_placas: dono le" on public.veiculo_placas for select to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
grant select on public.veiculo_placas to authenticated;

alter table public.veiculos add column conferido boolean not null default false; -- sem grant de escrita: só o banco define
insert into public.config_privada (chave, valor) values ('placa_provedor', 'simulado'), ('placa_limite_dia', '30') on conflict (chave) do nothing;

-- dados da consulta batem com o anúncio? (só provedor real, consulta feita por esta garagem, até 30 dias)
create function public.placa_confere(p_garagem uuid, p_placa text, p_marca text, p_modelo text, p_ano int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.placa_cache c
    where c.placa = p_placa and c.provedor <> 'simulado' and c.consultado_em > now() - interval '30 days'
      and exists (select 1 from public.placa_consultas q where q.garagem_id = p_garagem and q.placa = p_placa)
      and (public.txt_norm(c.dados->>'marca') like '%' || public.txt_norm(p_marca) || '%' or public.txt_norm(p_marca) like '%' || public.txt_norm(c.dados->>'marca') || '%')
      and public.txt_norm(c.dados->>'modelo') like '%' || public.txt_norm(split_part(btrim(p_modelo), ' ', 1)) || '%'
      and p_ano in ((c.dados->>'ano_fabricacao')::int, (c.dados->>'ano_modelo')::int)
  )
$$;

create function public.placa_preparar(p_placa text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.garagens; pl text := public.placa_normaliza(p_placa); c public.placa_cache; lim int; usadas int; qid bigint; prov text;
begin
  if (select auth.uid()) is null then raise exception 'nao_autenticado'; end if;
  select * into g from public.garagens where owner_id = (select auth.uid());
  if not found or not public.garagem_liberada(g.id) then raise exception 'garagem_nao_aprovada'; end if;
  if not public.placa_valida(pl) then raise exception 'placa_invalida'; end if;
  select * into c from public.placa_cache where placa = pl and consultado_em > now() - interval '30 days';
  if found then
    insert into public.placa_consultas (garagem_id, placa, de_cache) values (g.id, pl, true) returning id into qid;
    return jsonb_build_object('placa', pl, 'dados', c.dados, 'provedor', c.provedor, 'consulta_id', qid);
  end if;
  select coalesce((select valor::int from public.config_privada where chave = 'placa_limite_dia'), 30) into lim;
  select count(*) into usadas from public.placa_consultas where garagem_id = g.id and not de_cache and criado_em > now() - interval '24 hours';
  if usadas >= lim then raise exception 'limite_consultas'; end if;
  insert into public.placa_consultas (garagem_id, placa) values (g.id, pl) returning id into qid;
  select valor into prov from public.config_privada where chave = 'placa_provedor';
  return jsonb_build_object('placa', pl, 'dados', null, 'provedor', coalesce(prov, 'simulado'), 'consulta_id', qid);
end $$;

create function public.definir_placa_veiculo(p_veiculo bigint, p_placa text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v public.veiculos; pl text := public.placa_normaliza(p_placa); ok boolean;
begin
  select * into v from public.veiculos where id = p_veiculo;
  if not found or not exists (select 1 from public.garagens g where g.id = v.garagem_id and g.owner_id = (select auth.uid())) then raise exception 'veiculo_nao_encontrado'; end if;
  if not public.garagem_liberada(v.garagem_id) then raise exception 'garagem_nao_aprovada'; end if;
  if not public.placa_valida(pl) then raise exception 'placa_invalida'; end if;
  if exists (select 1 from public.veiculo_placas vp join public.veiculos o on o.id = vp.veiculo_id
             where vp.garagem_id = v.garagem_id and vp.placa = pl and vp.veiculo_id <> v.id and o.status <> 'vendido') then
    raise exception 'placa_duplicada';
  end if;
  insert into public.veiculo_placas (veiculo_id, garagem_id, placa) values (v.id, v.garagem_id, pl)
    on conflict (veiculo_id) do update set placa = excluded.placa, atualizado_em = now();
  ok := public.placa_confere(v.garagem_id, pl, v.marca, v.modelo, v.ano);
  update public.veiculos set conferido = ok where id = v.id;
  return ok;
end $$;

-- em todo insert/update o selo é recalculado pelo banco (ninguém o altera por fora)
create function public.trg_reconfere_veiculo() returns trigger language plpgsql security definer set search_path = public as $$
declare pl text;
begin
  if tg_op = 'INSERT' then new.conferido := false; return new; end if;  -- placa só entra depois, pela RPC
  select placa into pl from public.veiculo_placas where veiculo_id = new.id;
  new.conferido := pl is not null and public.placa_confere(new.garagem_id, pl, new.marca, new.modelo, new.ano);
  return new;
end $$;
create trigger reconfere_veiculo before insert or update on public.veiculos for each row execute function public.trg_reconfere_veiculo();

revoke execute on function public.placa_confere(uuid, text, text, text, int), public.trg_reconfere_veiculo() from public, anon, authenticated;
revoke execute on function public.placa_preparar(text), public.definir_placa_veiculo(bigint, text) from public, anon;
grant execute on function public.placa_preparar(text), public.definir_placa_veiculo(bigint, text) to authenticated;
