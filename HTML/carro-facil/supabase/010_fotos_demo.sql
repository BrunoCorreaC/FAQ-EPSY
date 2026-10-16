-- Garagens de demonstração usam ilustrações que vêm com o próprio app (img/demo/...), não o bucket.
create or replace function public.trg_valida_veiculo() returns trigger language plpgsql set search_path = public as $$
declare demo boolean := exists (select 1 from public.garagens g where g.id = new.garagem_id and g.demo);
begin
  if new.ano > extract(year from public.hoje())::int + 1 then raise exception 'ano_invalido'; end if;
  if exists (select 1 from unnest(new.fotos) f
             where f !~ ('^' || new.garagem_id::text || '/[A-Za-z0-9._-]+$') and not (demo and f ~ '^demo/[A-Za-z0-9._-]+$')) then
    raise exception 'foto_invalida';
  end if;
  if new.status = 'ativo' and cardinality(new.fotos) = 0 and not demo then raise exception 'foto_obrigatoria'; end if;
  return new;
end $$;

update public.veiculos v set fotos = array['demo/v' || v.id || '-1.jpg', 'demo/v' || v.id || '-2.jpg', 'demo/v' || v.id || '-3.jpg']
where exists (select 1 from public.garagens g where g.id = v.garagem_id and g.demo) and v.id between 1 and 12;
