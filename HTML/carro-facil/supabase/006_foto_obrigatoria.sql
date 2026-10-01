create or replace function public.trg_valida_veiculo() returns trigger language plpgsql set search_path = public as $$
begin
  if new.ano > extract(year from public.hoje())::int + 1 then raise exception 'ano_invalido'; end if;
  if exists (select 1 from unnest(new.fotos) f where f !~ ('^' || new.garagem_id::text || '/[A-Za-z0-9._-]+$')) then raise exception 'foto_invalida'; end if;
  -- anúncio ativo precisa de ao menos 1 foto (garagens de demonstração ficam de fora)
  if new.status = 'ativo' and cardinality(new.fotos) = 0
     and not exists (select 1 from public.garagens g where g.id = new.garagem_id and g.demo) then
    raise exception 'foto_obrigatoria';
  end if;
  return new;
end $$;