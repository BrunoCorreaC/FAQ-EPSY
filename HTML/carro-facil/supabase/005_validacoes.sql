-- ===== funções de validação (imutáveis, reutilizáveis nas restrições) =====
create function public.uf_valida(p text) returns boolean language sql immutable as $$
  select p = any (array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'])
$$;

create function public.telefone_br_valido(p text) returns boolean language sql immutable as $$
  -- 55 + DDD existente + (fixo: 8 dígitos começando em 2 a 5) ou (celular: 9 dígitos começando em 9)
  select p ~ '^55(1[1-9]|2[12478]|3[1-578]|4[1-9]|5[1345]|6[1-9]|7[134579]|8[1-9]|9[1-9])([2-5][0-9]{7}|9[0-9]{8})$'
$$;

create function public.cnpj_valido(p text) returns boolean language plpgsql immutable as $$
declare p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2]; s int := 0; d1 int; d2 int; i int;
begin
  if p is null or p !~ '^[0-9]{14}$' or p ~ '^(.)\1{13}$' then return false; end if;
  for i in 1..12 loop s := s + substr(p, i, 1)::int * p1[i]; end loop;
  d1 := case when s % 11 < 2 then 0 else 11 - s % 11 end;
  s := 0;
  for i in 1..13 loop s := s + substr(p, i, 1)::int * p2[i]; end loop;
  d2 := case when s % 11 < 2 then 0 else 11 - s % 11 end;
  return d1 = substr(p, 13, 1)::int and d2 = substr(p, 14, 1)::int;
end $$;

-- busca salva: só chaves conhecidas, tipos e faixas corretos (evita que um valor inválido quebre a função de combinação)
create function public.busca_valida(b jsonb) returns boolean language plpgsql immutable as $$
declare k text; v jsonb; t text;
begin
  if b is null or jsonb_typeof(b) <> 'object' then return false; end if;
  for k, v in select * from jsonb_each(b) loop
    t := jsonb_typeof(v);
    if k = 'uf' then if t <> 'string' or not public.uf_valida(v #>> '{}') then return false; end if;
    elsif k in ('cidade', 'marca', 'modelo') then if t <> 'string' or char_length(btrim(v #>> '{}')) not between 1 and 60 then return false; end if;
    elsif k in ('anoMin', 'anoMax') then if t <> 'number' or (v #>> '{}')::numeric <> trunc((v #>> '{}')::numeric) or (v #>> '{}')::numeric not between 1970 and 2100 then return false; end if;
    elsif k in ('precoMin', 'precoMax') then if t <> 'number' or (v #>> '{}')::numeric not between 0 and 10000000 then return false; end if;
    elsif k = 'kmMax' then if t <> 'number' or (v #>> '{}')::numeric <> trunc((v #>> '{}')::numeric) or (v #>> '{}')::numeric not between 0 and 2000000 then return false; end if;
    elsif k = 'cambio' then if t <> 'string' or (v #>> '{}') not in ('Manual', 'Automático') then return false; end if;
    elsif k = 'combustivel' then if t <> 'string' or (v #>> '{}') not in ('Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido') then return false; end if;
    elsif k = 'tipo' then if t <> 'string' or (v #>> '{}') not in ('Hatch', 'Sedan', 'SUV', 'Picape', 'Utilitário', 'Outro') then return false; end if;
    elsif k = 'garagem' then if t <> 'string' or (v #>> '{}') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
    else return false;
    end if;
  end loop;
  if b ? 'anoMin' and b ? 'anoMax' and (b->>'anoMin')::numeric > (b->>'anoMax')::numeric then return false; end if;
  if b ? 'precoMin' and b ? 'precoMax' and (b->>'precoMin')::numeric > (b->>'precoMax')::numeric then return false; end if;
  return true;
end $$;

-- ===== restrições nas tabelas =====
alter table public.preferencias add constraint preferencias_busca_chk check (public.busca_valida(busca));

alter table public.perfis
  add constraint perfis_nome_chk check (nome = btrim(nome) and nome ~ '^[[:alpha:]][[:alpha:]'' .-]{1,79}$'),
  add constraint perfis_telefone_br_chk check (public.telefone_br_valido(telefone)),
  add constraint perfis_cidade_chk check (cidade is null or char_length(btrim(cidade)) > 0),
  add constraint perfis_uf_chk check (uf is null or public.uf_valida(uf));

alter table public.garagens
  add constraint garagens_nome_chk check (nome = btrim(nome) and char_length(nome) >= 2),
  add constraint garagens_cidade_chk check (char_length(btrim(cidade)) > 0),
  add constraint garagens_uf_chk check (public.uf_valida(uf));

alter table public.garagem_contatos add constraint garagem_contatos_telefone_br_chk check (public.telefone_br_valido(telefone));
alter table public.garagem_privado add constraint garagem_privado_cnpj_chk check (cnpj is null or public.cnpj_valido(cnpj));

alter table public.interesses
  add constraint interesses_telefone_br_chk check (public.telefone_br_valido(telefone)),
  add constraint interesses_nome_chk check (nome = btrim(nome) and nome ~ '^[[:alpha:]][[:alpha:]'' .-]{1,79}$');

alter table public.veiculos
  add constraint veiculos_marca_chk check (marca = btrim(marca) and char_length(marca) >= 1),
  add constraint veiculos_modelo_chk check (modelo = btrim(modelo) and char_length(modelo) >= 1),
  add constraint veiculos_cidade_chk check (char_length(btrim(cidade)) > 0),
  add constraint veiculos_uf_chk check (public.uf_valida(uf)),
  add constraint veiculos_km_max_chk check (km <= 2000000),
  add constraint veiculos_preco_faixa_chk check (preco between 500 and 10000000);

-- ano não pode ser maior que o próximo ano; fotos só da própria pasta da garagem
create function public.trg_valida_veiculo() returns trigger language plpgsql set search_path = public as $$
begin
  if new.ano > extract(year from public.hoje())::int + 1 then raise exception 'ano_invalido'; end if;
  if exists (select 1 from unnest(new.fotos) f where f !~ ('^' || new.garagem_id::text || '/[A-Za-z0-9._-]+$')) then raise exception 'foto_invalida'; end if;
  return new;
end $$;
create trigger valida_veiculo before insert or update on public.veiculos for each row execute function public.trg_valida_veiculo();

revoke execute on function public.trg_valida_veiculo() from public, anon, authenticated;