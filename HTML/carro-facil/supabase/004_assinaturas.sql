-- Aplicado no projeto "carro-facil" (migração assinaturas_mensalidades) + agendamento diário (pg_cron).
-- Assinaturas mensais das garagens: planos (valores definidos pelo admin), cobranças mensais automáticas,
-- registro de pagamentos, carência, suspensão e bloqueio de anúncios para garagem inadimplente.
-- Depois de aplicar:  create extension if not exists pg_cron;
--   select cron.schedule('rodar-cobrancas-diario', '0 11 * * *', $$select public.rodar_cobrancas()$$);   -- 08h de Brasília

create function public.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
create function public.proximo_vencimento(p_a_partir_de date, p_dia integer) returns date language sql immutable as $$
  select case
    when make_date(extract(year from p_a_partir_de)::int, extract(month from p_a_partir_de)::int, p_dia) >= p_a_partir_de
      then make_date(extract(year from p_a_partir_de)::int, extract(month from p_a_partir_de)::int, p_dia)
    else (make_date(extract(year from p_a_partir_de)::int, extract(month from p_a_partir_de)::int, 1) + interval '1 month')::date + (p_dia - 1)
  end
$$;

create table public.planos (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 2 and 60),
  valor_centavos integer not null default 0 check (valor_centavos >= 0),
  max_anuncios integer check (max_anuncios is null or max_anuncios > 0),
  creditos_mensais integer not null default 0 check (creditos_mensais >= 0),
  descricao text not null default '' check (char_length(descricao) <= 300),
  ativo boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.planos enable row level security;
insert into public.planos (nome, descricao) values
  ('Essencial', 'Plano de entrada. Defina valor, limite de anúncios e créditos no painel.'),
  ('Profissional', 'Plano intermediário. Defina valor, limite de anúncios e créditos no painel.'),
  ('Premium', 'Plano completo. Defina valor, limite de anúncios e créditos no painel.');

create table public.assinaturas (
  id bigint generated always as identity primary key,
  garagem_id uuid not null unique references public.garagens (id) on delete cascade,
  plano_id bigint not null references public.planos (id),
  status text not null default 'teste' check (status in ('teste', 'ativa', 'em_atraso', 'suspensa', 'cancelada', 'cortesia')),
  valor_centavos integer not null check (valor_centavos >= 0),
  dia_vencimento smallint not null default 10 check (dia_vencimento between 1 and 28),
  inicio date not null default public.hoje(),
  teste_ate date,
  proxima_cobranca date not null,
  bloqueio_em date,
  cortesia_ate date,
  gateway text, gateway_ref text,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index assinaturas_plano_idx on public.assinaturas (plano_id);
alter table public.assinaturas enable row level security;

create table public.cobrancas (
  id bigint generated always as identity primary key,
  assinatura_id bigint not null references public.assinaturas (id) on delete cascade,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  competencia date not null,
  vencimento date not null,
  valor_centavos integer not null check (valor_centavos >= 0),
  status text not null default 'aberta' check (status in ('aberta', 'vencida', 'paga', 'cancelada')),
  pago_em date,
  forma text check (forma in ('pix', 'boleto', 'cartao', 'dinheiro', 'outro')),
  observacao text not null default '' check (char_length(observacao) <= 200),
  gateway_ref text,
  criado_em timestamptz not null default now(),
  unique (assinatura_id, competencia)
);
create index cobrancas_garagem_idx on public.cobrancas (garagem_id);
create index cobrancas_status_idx on public.cobrancas (status, vencimento);
alter table public.cobrancas enable row level security;

create table public.assinatura_log (
  id bigint generated always as identity primary key,
  garagem_id uuid references public.garagens (id) on delete cascade,
  evento text not null, detalhe jsonb not null default '{}', por uuid, criado_em timestamptz not null default now()
);
create index assinatura_log_garagem_idx on public.assinatura_log (garagem_id);
alter table public.assinatura_log enable row level security;

insert into public.config_privada (chave, valor) values ('dias_carencia', '5'), ('instrucoes_pagamento', '') on conflict (chave) do nothing;

-- garagem "liberada" = aprovada + (demo ou assinatura em dia/teste/cortesia/atraso dentro da carência)
create function public.garagem_liberada(p_garagem uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.garagens g
    where g.id = p_garagem and g.status_aprovacao = 'aprovada'
      and (g.demo or exists (
        select 1 from public.assinaturas a
        where a.garagem_id = g.id and (
          a.status = 'ativa'
          or (a.status = 'teste' and a.teste_ate >= public.hoje())
          or (a.status = 'cortesia' and (a.cortesia_ate is null or a.cortesia_ate >= public.hoje()))
          or (a.status = 'em_atraso' and a.bloqueio_em >= public.hoje()))))
  )
$$;
grant execute on function public.garagem_liberada(uuid) to anon, authenticated;

drop policy "veiculos: todos veem ativos" on public.veiculos;
create policy "veiculos: todos veem ativos" on public.veiculos for select to anon, authenticated
  using (status = 'ativo' and public.garagem_liberada(garagem_id));
drop policy "veiculos: dono cadastra" on public.veiculos;
create policy "veiculos: dono cadastra" on public.veiculos for insert to authenticated
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())) and public.garagem_liberada(garagem_id));
drop policy "veiculos: dono altera" on public.veiculos;
create policy "veiculos: dono altera" on public.veiculos for update to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())) and public.garagem_liberada(garagem_id));
drop policy "fotos: dono envia" on storage.objects;
create policy "fotos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'veiculos' and (storage.foldername(name))[1] in (select g.id::text from public.garagens g where g.owner_id = (select auth.uid()) and public.garagem_liberada(g.id)));

create function public.trg_limite_anuncios() returns trigger language plpgsql security definer set search_path = public as $$
declare lim integer;
begin
  if new.status = 'ativo' and (tg_op = 'INSERT' or old.status is distinct from 'ativo') then
    select p.max_anuncios into lim from public.assinaturas a join public.planos p on p.id = a.plano_id where a.garagem_id = new.garagem_id;
    if lim is not null and (select count(*) from public.veiculos v where v.garagem_id = new.garagem_id and v.status = 'ativo' and v.id is distinct from new.id) >= lim then
      raise exception 'limite_anuncios';
    end if;
  end if;
  return new;
end $$;
create trigger limite_anuncios before insert or update of status on public.veiculos for each row execute function public.trg_limite_anuncios();

-- demandas_para_mim, desbloquear_lead, radar_demanda e os gatilhos de push passam a usar garagem_liberada()
-- (versões completas em 003_negocio.sql com "public.garagem_liberada(g.id)" no lugar de "g.status_aprovacao = 'aprovada'")
create or replace function public.demandas_para_mim() returns table (lead_ref uuid, busca jsonb, compat integer, atualizado_em timestamptz, desbloqueado boolean)
language sql stable security definer set search_path = public as $$
  select p.lead_ref, p.busca - 'garagem', count(distinct v.id)::int, p.atualizado_em,
         exists (select 1 from public.desbloqueios d where d.garagem_id = g.id and d.lead_ref = p.lead_ref)
  from public.garagens g
  join public.veiculos v on v.garagem_id = g.id and v.status = 'ativo'
  join public.preferencias p on p.autoriza_contato and p.busca <> '{}'::jsonb and public.combina(v, p.busca)
  where g.owner_id = (select auth.uid()) and public.garagem_liberada(g.id)
  group by g.id, p.lead_ref, p.busca, p.atualizado_em
  order by p.atualizado_em desc limit 100
$$;

create or replace function public.desbloquear_lead(p_lead uuid) returns table (nome text, telefone text)
language plpgsql security definer set search_path = public as $$
declare g public.garagens;
begin
  select * into g from public.garagens where owner_id = (select auth.uid());
  if not found or not public.garagem_liberada(g.id) then raise exception 'garagem_nao_aprovada'; end if;
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

-- radar_demanda, trg_veiculo_notifica e trg_preferencia_notifica: mesma troca (garagem_liberada no lugar de status_aprovacao = 'aprovada').
-- Reaplique as definições de 003_negocio.sql trocando essa condição.

create function public.notificar_dono(p_garagem uuid, p_chave text, p_titulo text, p_corpo text, p_url text) returns void
language sql security definer set search_path = public as $$
  insert into public.notificacoes (user_id, chave, titulo, corpo, url)
  select g.owner_id, p_chave, p_titulo, p_corpo, p_url from public.garagens g
  where g.id = p_garagem and g.owner_id is not null and exists (select 1 from public.push_subscriptions s where s.user_id = g.owner_id)
  on conflict do nothing
$$;

-- rotina diária: gera mensalidades (5 dias antes), marca vencidas, entra em atraso e suspende após a carência
create function public.rodar_cobrancas() returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h date := public.hoje();
  carencia integer := coalesce((select valor::integer from public.config_privada where chave = 'dias_carencia'), 5);
  antecedencia constant integer := 5;
  a public.assinaturas; prox date; cid bigint; novas integer := 0; atrasadas integer := 0; suspensas integer := 0; limite date;
begin
  update public.assinaturas set status = 'ativa', atualizado_em = now() where status = 'teste' and teste_ate < h;

  for a in select * from public.assinaturas where status in ('ativa', 'em_atraso') loop
    prox := a.proxima_cobranca;
    while prox <= h + antecedencia loop
      cid := null;
      insert into public.cobrancas (assinatura_id, garagem_id, competencia, vencimento, valor_centavos, status, pago_em, forma, observacao)
      values (a.id, a.garagem_id, date_trunc('month', prox)::date, prox, a.valor_centavos,
              case when a.valor_centavos = 0 then 'paga' else 'aberta' end,
              case when a.valor_centavos = 0 then prox end, case when a.valor_centavos = 0 then 'outro' end,
              case when a.valor_centavos = 0 then 'Sem cobrança' else '' end)
      on conflict (assinatura_id, competencia) do nothing returning id into cid;
      if cid is not null then
        novas := novas + 1;
        if a.valor_centavos > 0 then
          perform public.notificar_dono(a.garagem_id, 'cob:' || cid, 'Nova mensalidade', 'Sua mensalidade vence em ' || to_char(prox, 'DD/MM') || '. Veja em Assinatura.', '#/assinatura');
        end if;
      end if;
      prox := (date_trunc('month', prox) + interval '1 month')::date + (a.dia_vencimento - 1);
    end loop;
    if prox is distinct from a.proxima_cobranca then
      update public.assinaturas set proxima_cobranca = prox, atualizado_em = now() where id = a.id;
    end if;
  end loop;

  update public.cobrancas set status = 'vencida' where status = 'aberta' and vencimento < h;

  for a in select s.* from public.assinaturas s where s.status = 'ativa'
           and exists (select 1 from public.cobrancas c where c.assinatura_id = s.id and c.status = 'vencida') loop
    select min(c.vencimento) + carencia into limite from public.cobrancas c where c.assinatura_id = a.id and c.status = 'vencida';
    update public.assinaturas set status = 'em_atraso', bloqueio_em = limite, atualizado_em = now() where id = a.id;
    atrasadas := atrasadas + 1;
    insert into public.assinatura_log (garagem_id, evento, detalhe) values (a.garagem_id, 'em_atraso', jsonb_build_object('bloqueio_em', limite));
    perform public.notificar_dono(a.garagem_id, 'atraso:' || a.id || ':' || h, 'Mensalidade em atraso', 'Regularize até ' || to_char(limite, 'DD/MM') || ' para manter seus anúncios no ar.', '#/assinatura');
  end loop;

  for a in select * from public.assinaturas where status = 'em_atraso' and bloqueio_em < h loop
    update public.assinaturas set status = 'suspensa', atualizado_em = now() where id = a.id;
    suspensas := suspensas + 1;
    insert into public.assinatura_log (garagem_id, evento, detalhe) values (a.garagem_id, 'suspensa', '{}');
    perform public.notificar_dono(a.garagem_id, 'susp:' || a.id || ':' || h, 'Anúncios ocultos', 'Sua assinatura foi suspensa por falta de pagamento. Regularize para voltar ao ar.', '#/assinatura');
  end loop;

  return jsonb_build_object('geradas', novas, 'em_atraso', atrasadas, 'suspensas', suspensas);
end $$;


create function public.minha_assinatura() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.garagens; a public.assinaturas; p public.planos; cfg text; cobs jsonb;
begin
  select * into g from public.garagens where owner_id = (select auth.uid());
  if not found then return null; end if;
  select valor into cfg from public.config_privada where chave = 'instrucoes_pagamento';
  select * into a from public.assinaturas where garagem_id = g.id;
  if not found then
    return jsonb_build_object('status', case when g.demo then 'demo' else 'sem_assinatura' end, 'liberada', public.garagem_liberada(g.id), 'instrucoes', coalesce(cfg, ''));
  end if;
  select * into p from public.planos where id = a.plano_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'competencia', c.competencia, 'vencimento', c.vencimento, 'valor_centavos', c.valor_centavos,
                                               'status', c.status, 'pago_em', c.pago_em, 'forma', c.forma) order by c.vencimento desc), '[]'::jsonb)
    into cobs from (select * from public.cobrancas where assinatura_id = a.id order by vencimento desc limit 12) c;
  return jsonb_build_object('status', a.status, 'liberada', public.garagem_liberada(g.id), 'valor_centavos', a.valor_centavos, 'dia_vencimento', a.dia_vencimento,
    'proxima_cobranca', a.proxima_cobranca, 'teste_ate', a.teste_ate, 'bloqueio_em', a.bloqueio_em, 'cortesia_ate', a.cortesia_ate,
    'plano', jsonb_build_object('nome', p.nome, 'max_anuncios', p.max_anuncios, 'creditos_mensais', p.creditos_mensais, 'descricao', p.descricao),
    'cobrancas', cobs, 'instrucoes', coalesce(cfg, ''));
end $$;

drop function public.admin_garagens();
create function public.admin_garagens() returns table (id uuid, nome text, cidade text, uf text, status_aprovacao text, cnpj text, telefone text, creditos integer, criado_em timestamptz, demo boolean, assin_status text, plano_nome text, liberada boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select g.id, g.nome, g.cidade, g.uf::text, g.status_aprovacao, p.cnpj, c.telefone, coalesce(p.creditos, 0), g.criado_em, g.demo, a.status, pl.nome, public.garagem_liberada(g.id)
    from public.garagens g left join public.garagem_privado p on p.garagem_id = g.id left join public.garagem_contatos c on c.garagem_id = g.id
    left join public.assinaturas a on a.garagem_id = g.id left join public.planos pl on pl.id = a.plano_id
    order by (g.status_aprovacao = 'pendente') desc, g.criado_em desc;
end $$;

create function public.admin_resumo() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb; ini date := date_trunc('month', public.hoje())::date;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  select jsonb_build_object(
    'mrr_centavos', coalesce((select sum(valor_centavos) from public.assinaturas where status in ('ativa', 'em_atraso')), 0),
    'ativas', (select count(*) from public.assinaturas where status = 'ativa'),
    'teste', (select count(*) from public.assinaturas where status = 'teste'),
    'cortesia', (select count(*) from public.assinaturas where status = 'cortesia'),
    'em_atraso', (select count(*) from public.assinaturas where status = 'em_atraso'),
    'suspensas', (select count(*) from public.assinaturas where status = 'suspensa'),
    'canceladas', (select count(*) from public.assinaturas where status = 'cancelada'),
    'recebido_mes_centavos', coalesce((select sum(valor_centavos) from public.cobrancas where status = 'paga' and pago_em >= ini and pago_em < (ini + interval '1 month')::date), 0),
    'a_receber_centavos', coalesce((select sum(valor_centavos) from public.cobrancas where status = 'aberta'), 0),
    'vencido_centavos', coalesce((select sum(valor_centavos) from public.cobrancas where status = 'vencida'), 0),
    'pendentes_aprovacao', (select count(*) from public.garagens where status_aprovacao = 'pendente' and not demo),
    'sem_assinatura', (select count(*) from public.garagens g where g.status_aprovacao = 'aprovada' and not g.demo and not exists (select 1 from public.assinaturas a where a.garagem_id = g.id))
  ) into r;
  return r;
end $$;

create function public.admin_planos() returns table (id bigint, nome text, valor_centavos integer, max_anuncios integer, creditos_mensais integer, descricao text, ativo boolean, assinaturas bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select p.id, p.nome, p.valor_centavos, p.max_anuncios, p.creditos_mensais, p.descricao, p.ativo, (select count(*) from public.assinaturas a where a.plano_id = p.id)
    from public.planos p order by p.valor_centavos, p.id;
end $$;

create function public.admin_salvar_plano(p_id bigint, p_nome text, p_valor_centavos integer, p_max_anuncios integer, p_creditos integer, p_descricao text, p_ativo boolean) returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_id is null then
    insert into public.planos (nome, valor_centavos, max_anuncios, creditos_mensais, descricao, ativo)
    values (p_nome, p_valor_centavos, p_max_anuncios, coalesce(p_creditos, 0), coalesce(p_descricao, ''), coalesce(p_ativo, false)) returning id into v;
  else
    update public.planos set nome = p_nome, valor_centavos = p_valor_centavos, max_anuncios = p_max_anuncios, creditos_mensais = coalesce(p_creditos, 0),
      descricao = coalesce(p_descricao, ''), ativo = coalesce(p_ativo, false) where id = p_id returning id into v;
    if v is null then raise exception 'plano_invalido'; end if;
  end if;
  insert into public.assinatura_log (evento, detalhe, por) values ('plano_salvo', jsonb_build_object('plano', v, 'valor_centavos', p_valor_centavos), (select auth.uid()));
  return v;
end $$;

create function public.admin_assinaturas() returns table (garagem_id uuid, garagem_nome text, plano_id bigint, plano_nome text, status text, valor_centavos integer, dia_vencimento smallint, teste_ate date, proxima_cobranca date, bloqueio_em date, cortesia_ate date, vencidas bigint, devido_centavos bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select a.garagem_id, g.nome, a.plano_id, p.nome, a.status, a.valor_centavos, a.dia_vencimento, a.teste_ate, a.proxima_cobranca, a.bloqueio_em, a.cortesia_ate,
      (select count(*) from public.cobrancas c where c.assinatura_id = a.id and c.status = 'vencida'),
      (select coalesce(sum(c.valor_centavos), 0)::bigint from public.cobrancas c where c.assinatura_id = a.id and c.status in ('vencida'))
    from public.assinaturas a join public.garagens g on g.id = a.garagem_id join public.planos p on p.id = a.plano_id
    order by (a.status = 'em_atraso') desc, (a.status = 'suspensa') desc, g.nome;
end $$;

create function public.admin_cobrancas(p_status text default null) returns table (id bigint, garagem_id uuid, garagem_nome text, competencia date, vencimento date, valor_centavos integer, status text, pago_em date, forma text, observacao text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select c.id, c.garagem_id, g.nome, c.competencia, c.vencimento, c.valor_centavos, c.status, c.pago_em, c.forma, c.observacao
    from public.cobrancas c join public.garagens g on g.id = c.garagem_id
    where p_status is null or c.status = p_status
    order by (c.status = 'vencida') desc, c.vencimento desc limit 300;
end $$;

create function public.admin_criar_assinatura(p_garagem uuid, p_plano bigint, p_dia integer, p_dias_teste integer default 0, p_valor_centavos integer default null, p_cortesia boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare pl public.planos; h date := public.hoje(); st text; t date; prox date; v integer;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_dia not between 1 and 28 then raise exception 'dia_invalido'; end if;
  if p_dias_teste not between 0 and 365 then raise exception 'teste_invalido'; end if;
  select * into pl from public.planos where id = p_plano;
  if not found then raise exception 'plano_invalido'; end if;
  v := coalesce(p_valor_centavos, pl.valor_centavos);
  if v < 0 then raise exception 'valor_invalido'; end if;
  if p_cortesia then st := 'cortesia';
  elsif p_dias_teste > 0 then st := 'teste'; t := h + p_dias_teste;
  else st := 'ativa'; end if;
  prox := public.proximo_vencimento(case when st = 'teste' then t + 1 else h end, p_dia);
  insert into public.assinaturas (garagem_id, plano_id, status, valor_centavos, dia_vencimento, teste_ate, proxima_cobranca)
  values (p_garagem, p_plano, st, v, p_dia, t, prox)
  on conflict (garagem_id) do update set plano_id = excluded.plano_id, status = excluded.status, valor_centavos = excluded.valor_centavos,
    dia_vencimento = excluded.dia_vencimento, teste_ate = excluded.teste_ate, proxima_cobranca = excluded.proxima_cobranca,
    bloqueio_em = null, cortesia_ate = null, atualizado_em = now();
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (p_garagem, 'assinatura_criada', jsonb_build_object('plano', p_plano, 'status', st, 'valor_centavos', v), (select auth.uid()));
  perform public.notificar_dono(p_garagem, 'assin:' || p_garagem || ':' || h, 'Assinatura ativada', 'Sua garagem está liberada para anunciar. Veja os detalhes em Assinatura.', '#/assinatura');
end $$;

create function public.admin_alterar_assinatura(p_garagem uuid, p_plano bigint, p_valor_centavos integer, p_dia integer) returns void
language plpgsql security definer set search_path = public as $$
declare a public.assinaturas;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_dia not between 1 and 28 or p_valor_centavos < 0 then raise exception 'dados_invalidos'; end if;
  select * into a from public.assinaturas where garagem_id = p_garagem;
  if not found then raise exception 'sem_assinatura'; end if;
  if not exists (select 1 from public.planos where id = p_plano) then raise exception 'plano_invalido'; end if;
  update public.assinaturas set plano_id = p_plano, valor_centavos = p_valor_centavos, dia_vencimento = p_dia,
    proxima_cobranca = case when p_dia <> a.dia_vencimento then date_trunc('month', a.proxima_cobranca)::date + (p_dia - 1) else a.proxima_cobranca end,
    atualizado_em = now() where garagem_id = p_garagem;
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (p_garagem, 'assinatura_alterada', jsonb_build_object('plano', p_plano, 'valor_centavos', p_valor_centavos, 'dia', p_dia), (select auth.uid()));
end $$;

create function public.admin_definir_assinatura_status(p_garagem uuid, p_status text, p_ate date default null) returns void
language plpgsql security definer set search_path = public as $$
declare a public.assinaturas; h date := public.hoje();
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_status not in ('ativa', 'suspensa', 'cancelada', 'cortesia') then raise exception 'status_invalido'; end if;
  select * into a from public.assinaturas where garagem_id = p_garagem;
  if not found then raise exception 'sem_assinatura'; end if;
  update public.assinaturas set status = p_status, bloqueio_em = null,
    cortesia_ate = case when p_status = 'cortesia' then p_ate else null end,
    proxima_cobranca = case when p_status = 'ativa' and a.proxima_cobranca < h then public.proximo_vencimento(h, a.dia_vencimento) else a.proxima_cobranca end,
    atualizado_em = now() where garagem_id = p_garagem;
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (p_garagem, 'status_' || p_status, jsonb_build_object('ate', p_ate), (select auth.uid()));
end $$;

create function public.admin_registrar_pagamento(p_cobranca bigint, p_forma text, p_pago_em date default null, p_obs text default '') returns void
language plpgsql security definer set search_path = public as $$
declare c public.cobrancas; a public.assinaturas; cred integer; h date := public.hoje();
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_forma not in ('pix', 'boleto', 'cartao', 'dinheiro', 'outro') then raise exception 'forma_invalida'; end if;
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found then raise exception 'cobranca_invalida'; end if;
  if c.status in ('paga', 'cancelada') then raise exception 'cobranca_ja_encerrada'; end if;
  update public.cobrancas set status = 'paga', pago_em = coalesce(p_pago_em, h), forma = p_forma, observacao = left(coalesce(p_obs, ''), 200) where id = c.id;
  select * into a from public.assinaturas where id = c.assinatura_id;
  select p.creditos_mensais into cred from public.planos p where p.id = a.plano_id;
  if coalesce(cred, 0) > 0 then
    insert into public.garagem_privado (garagem_id, creditos) values (c.garagem_id, cred)
      on conflict (garagem_id) do update set creditos = public.garagem_privado.creditos + cred;
    insert into public.creditos_log (garagem_id, qtd, motivo, por) values (c.garagem_id, cred, 'Plano mensal ' || to_char(c.competencia, 'MM/YYYY'), (select auth.uid()));
  end if;
  if a.status in ('em_atraso', 'suspensa') and not exists (select 1 from public.cobrancas x where x.assinatura_id = a.id and x.status = 'vencida') then
    update public.assinaturas set status = 'ativa', bloqueio_em = null, atualizado_em = now() where id = a.id;
  end if;
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (c.garagem_id, 'pagamento', jsonb_build_object('cobranca', c.id, 'forma', p_forma, 'valor_centavos', c.valor_centavos), (select auth.uid()));
  perform public.notificar_dono(c.garagem_id, 'pago:' || c.id, 'Pagamento confirmado', 'Recebemos sua mensalidade. Obrigado!', '#/assinatura');
end $$;

create function public.admin_desfazer_pagamento(p_cobranca bigint) returns void
language plpgsql security definer set search_path = public as $$
declare c public.cobrancas;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found or c.status <> 'paga' then raise exception 'cobranca_invalida'; end if;
  update public.cobrancas set status = case when vencimento < public.hoje() then 'vencida' else 'aberta' end, pago_em = null, forma = null where id = c.id;
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (c.garagem_id, 'pagamento_desfeito', jsonb_build_object('cobranca', c.id), (select auth.uid()));
end $$;

create function public.admin_cancelar_cobranca(p_cobranca bigint, p_obs text default '') returns void
language plpgsql security definer set search_path = public as $$
declare c public.cobrancas;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found or c.status in ('paga', 'cancelada') then raise exception 'cobranca_invalida'; end if;
  update public.cobrancas set status = 'cancelada', observacao = left(coalesce(p_obs, ''), 200) where id = c.id;
  insert into public.assinatura_log (garagem_id, evento, detalhe, por) values (c.garagem_id, 'cobranca_cancelada', jsonb_build_object('cobranca', c.id), (select auth.uid()));
end $$;

create function public.admin_config() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return jsonb_build_object('instrucoes_pagamento', coalesce((select valor from public.config_privada where chave = 'instrucoes_pagamento'), ''),
                            'dias_carencia', coalesce((select valor::integer from public.config_privada where chave = 'dias_carencia'), 5));
end $$;

create function public.admin_definir_config(p_instrucoes text, p_dias_carencia integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  if p_dias_carencia not between 0 and 60 then raise exception 'carencia_invalida'; end if;
  insert into public.config_privada (chave, valor) values ('instrucoes_pagamento', left(coalesce(p_instrucoes, ''), 1000)), ('dias_carencia', p_dias_carencia::text)
    on conflict (chave) do update set valor = excluded.valor;
end $$;

create function public.admin_rodar_cobrancas() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return public.rodar_cobrancas();
end $$;

revoke execute on function public.rodar_cobrancas(), public.notificar_dono(uuid, text, text, text, text), public.trg_limite_anuncios() from public, anon, authenticated;
revoke execute on function public.minha_assinatura(), public.admin_garagens(), public.admin_resumo(), public.admin_planos(),
  public.admin_salvar_plano(bigint, text, integer, integer, integer, text, boolean), public.admin_assinaturas(), public.admin_cobrancas(text),
  public.admin_criar_assinatura(uuid, bigint, integer, integer, integer, boolean), public.admin_alterar_assinatura(uuid, bigint, integer, integer),
  public.admin_definir_assinatura_status(uuid, text, date), public.admin_registrar_pagamento(bigint, text, date, text), public.admin_desfazer_pagamento(bigint),
  public.admin_cancelar_cobranca(bigint, text), public.admin_config(), public.admin_definir_config(text, integer), public.admin_rodar_cobrancas() from public, anon;
grant execute on function public.minha_assinatura(), public.admin_garagens(), public.admin_resumo(), public.admin_planos(),
  public.admin_salvar_plano(bigint, text, integer, integer, integer, text, boolean), public.admin_assinaturas(), public.admin_cobrancas(text),
  public.admin_criar_assinatura(uuid, bigint, integer, integer, integer, boolean), public.admin_alterar_assinatura(uuid, bigint, integer, integer),
  public.admin_definir_assinatura_status(uuid, text, date), public.admin_registrar_pagamento(bigint, text, date, text), public.admin_desfazer_pagamento(bigint),
  public.admin_cancelar_cobranca(bigint, text), public.admin_config(), public.admin_definir_config(text, integer), public.admin_rodar_cobrancas() to authenticated;
create index creditos_log_garagem_idx on public.creditos_log (garagem_id);
