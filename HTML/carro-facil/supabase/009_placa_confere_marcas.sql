-- Comparação mais tolerante entre o anúncio e o retorno do provedor de placa:
-- apelidos de marca (VW, GM, M.BENZ…), prefixos "I/" e palavras do modelo em qualquer posição.
create function public.marca_tokens(p text) returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct case t
      when 'vw' then 'volkswagen' when 'gm' then 'chevrolet' when 'chev' then 'chevrolet'
      when 'mbenz' then 'mercedesbenz' when 'mercedes' then 'mercedesbenz' when 'benz' then 'mercedesbenz'
      else t end), '{}')
  from unnest(regexp_split_to_array(translate(lower(coalesce(p, '')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[^a-z0-9]+')) t
  where t <> '' and t not in ('i', 'imp', 'importado')
$$;

create or replace function public.placa_confere(p_garagem uuid, p_placa text, p_marca text, p_modelo text, p_ano int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.placa_cache c
    where c.placa = p_placa and c.provedor <> 'simulado' and c.consultado_em > now() - interval '30 days'
      and exists (select 1 from public.placa_consultas q where q.garagem_id = p_garagem and q.placa = p_placa)
      and public.marca_tokens(c.dados->>'marca') && public.marca_tokens(p_marca)
      and exists (select 1 from unnest(regexp_split_to_array(translate(lower(p_modelo), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[^a-z0-9]+')) w
                  where w ~ '^[a-z][a-z0-9]{2,}$' and public.txt_norm(c.dados->>'modelo') like '%' || w || '%')
      and p_ano in ((c.dados->>'ano_fabricacao')::int, (c.dados->>'ano_modelo')::int)
  )
$$;
revoke execute on function public.marca_tokens(text) from public, anon;

-- o cache só vale para o provedor ativo (ao trocar de "simulado" para o real, resultados de teste não são reaproveitados)
create or replace function public.placa_preparar(p_placa text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.garagens; pl text := public.placa_normaliza(p_placa); c public.placa_cache; lim int; usadas int; qid bigint; prov text;
begin
  if (select auth.uid()) is null then raise exception 'nao_autenticado'; end if;
  select * into g from public.garagens where owner_id = (select auth.uid());
  if not found or not public.garagem_liberada(g.id) then raise exception 'garagem_nao_aprovada'; end if;
  if not public.placa_valida(pl) then raise exception 'placa_invalida'; end if;
  select coalesce((select valor from public.config_privada where chave = 'placa_provedor'), 'simulado') into prov;
  select * into c from public.placa_cache where placa = pl and provedor = prov and consultado_em > now() - interval '30 days';
  if found then
    insert into public.placa_consultas (garagem_id, placa, de_cache) values (g.id, pl, true) returning id into qid;
    return jsonb_build_object('placa', pl, 'dados', c.dados, 'provedor', c.provedor, 'consulta_id', qid);
  end if;
  select coalesce((select valor::int from public.config_privada where chave = 'placa_limite_dia'), 30) into lim;
  select count(*) into usadas from public.placa_consultas where garagem_id = g.id and not de_cache and criado_em > now() - interval '24 hours';
  if usadas >= lim then raise exception 'limite_consultas'; end if;
  insert into public.placa_consultas (garagem_id, placa) values (g.id, pl) returning id into qid;
  return jsonb_build_object('placa', pl, 'dados', null, 'provedor', prov, 'consulta_id', qid);
end $$;
