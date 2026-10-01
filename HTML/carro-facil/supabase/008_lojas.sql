-- Exigências das lojas (Apple/Google): excluir conta no app, denunciar/ocultar conteúdo de usuários, push nativo.

-- ---------- excluir conta ----------
-- Dados financeiros de garagistas (cobranças) têm guarda obrigatória; ficam sem vínculo com a conta e só a equipe acessa.
create table public.retencao_financeira (
  id bigint generated always as identity primary key,
  garagem_nome text not null, cnpj text, competencia date not null, vencimento date not null,
  valor_centavos integer not null, status text not null, pago_em date, forma text,
  arquivado_em timestamptz not null default now()
);
alter table public.retencao_financeira enable row level security;
revoke all on public.retencao_financeira from anon, authenticated;

create function public.excluir_minha_conta() returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if public.sou_admin() then raise exception 'admin_nao_exclui'; end if;
  insert into public.retencao_financeira (garagem_nome, cnpj, competencia, vencimento, valor_centavos, status, pago_em, forma)
    select g.nome, gp.cnpj, c.competencia, c.vencimento, c.valor_centavos, c.status, c.pago_em, c.forma
    from public.cobrancas c join public.garagens g on g.id = c.garagem_id
    left join public.garagem_privado gp on gp.garagem_id = g.id
    where g.owner_id = uid;
  delete from auth.users where id = uid; -- o resto sai em cascata (perfil, preferências, garagem, anúncios, interesses…)
end $$;

-- ---------- denúncias ----------
create table public.denuncias (
  id bigint generated always as identity primary key,
  denunciante uuid not null references auth.users (id) on delete cascade,
  veiculo_id bigint references public.veiculos (id) on delete set null,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  motivo text not null check (motivo in ('golpe', 'fotos_falsas', 'preco_enganoso', 'ja_vendido', 'conteudo_improprio', 'outro')),
  detalhe text not null default '' check (char_length(detalhe) <= 500),
  status text not null default 'aberta' check (status in ('aberta', 'arquivada', 'garagem_suspensa')),
  criado_em timestamptz not null default now()
);
create unique index denuncias_aberta_uq on public.denuncias (denunciante, veiculo_id) where status = 'aberta';
create index denuncias_status_idx on public.denuncias (status, criado_em desc);
alter table public.denuncias enable row level security;
revoke all on public.denuncias from anon, authenticated;

create function public.denunciar_anuncio(p_veiculo bigint, p_motivo text, p_detalhe text default '') returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := (select auth.uid()); v public.veiculos;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  select * into v from public.veiculos where id = p_veiculo and status = 'ativo';
  if not found then raise exception 'veiculo_nao_encontrado'; end if;
  if (select count(*) from public.denuncias where denunciante = uid and criado_em > now() - interval '24 hours') >= 10 then raise exception 'limite_denuncias'; end if;
  insert into public.denuncias (denunciante, veiculo_id, garagem_id, motivo, detalhe) values (uid, v.id, v.garagem_id, p_motivo, left(coalesce(p_detalhe, ''), 500));
exception when unique_violation then raise exception 'denuncia_repetida';
end $$;

create function public.admin_denuncias() returns table (id bigint, status text, motivo text, detalhe text, criado_em timestamptz, veiculo_id bigint, veiculo text, garagem_id uuid, garagem text, abertas_na_garagem bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  return query select d.id, d.status, d.motivo, d.detalhe, d.criado_em, d.veiculo_id, coalesce(v.marca || ' ' || v.modelo || ' ' || v.ano, '(anúncio removido)'), d.garagem_id, g.nome,
    (select count(*) from public.denuncias o where o.garagem_id = d.garagem_id and o.status = 'aberta')
    from public.denuncias d join public.garagens g on g.id = d.garagem_id left join public.veiculos v on v.id = d.veiculo_id
    order by (d.status = 'aberta') desc, d.criado_em desc limit 200;
end $$;

create function public.admin_resolver_denuncia(p_id bigint, p_acao text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.denuncias;
begin
  if not public.sou_admin() then raise exception 'nao_autorizado'; end if;
  select * into d from public.denuncias where id = p_id;
  if not found then raise exception 'denuncia_inexistente'; end if;
  if p_acao = 'arquivar' then update public.denuncias set status = 'arquivada' where id = p_id;
  elsif p_acao = 'pausar_anuncio' then
    update public.veiculos set status = 'pausado' where id = d.veiculo_id;
    update public.denuncias set status = 'arquivada' where id = p_id;
  elsif p_acao = 'suspender_garagem' then
    update public.garagens set status_aprovacao = 'suspensa' where id = d.garagem_id;
    update public.denuncias set status = 'garagem_suspensa' where garagem_id = d.garagem_id and status = 'aberta';
  else raise exception 'acao_invalida'; end if;
end $$;

-- ---------- ocultar garagem (bloquear) ----------
create table public.garagens_ocultas (
  user_id uuid not null references auth.users (id) on delete cascade,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, garagem_id)
);
alter table public.garagens_ocultas enable row level security;
create policy "ocultas: dono" on public.garagens_ocultas for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.garagens_ocultas from anon, authenticated;
grant select, insert, delete on public.garagens_ocultas to authenticated;

-- ---------- push nativo (FCM/APNs) ----------
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plataforma text not null check (plataforma in ('ios', 'android')),
  atualizado_em timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;

create function public.registrar_push_token(p_token text, p_plataforma text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is null then raise exception 'nao_autenticado'; end if;
  if char_length(coalesce(p_token, '')) not between 20 and 4096 then raise exception 'token_invalido'; end if;
  insert into public.push_tokens (token, user_id, plataforma) values (p_token, (select auth.uid()), p_plataforma)
    on conflict (token) do update set user_id = excluded.user_id, plataforma = excluded.plataforma, atualizado_em = now();
end $$;
create function public.remover_push_token(p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin delete from public.push_tokens where token = p_token and user_id = (select auth.uid()); end $$;

revoke execute on function public.excluir_minha_conta(), public.denunciar_anuncio(bigint, text, text), public.admin_denuncias(), public.admin_resolver_denuncia(bigint, text),
  public.registrar_push_token(text, text), public.remover_push_token(text) from public, anon;
grant execute on function public.excluir_minha_conta(), public.denunciar_anuncio(bigint, text, text), public.admin_denuncias(), public.admin_resolver_denuncia(bigint, text),
  public.registrar_push_token(text, text), public.remover_push_token(text) to authenticated;
insert into public.config_privada (chave, valor) values ('fcm_service_account', '') on conflict (chave) do nothing;
