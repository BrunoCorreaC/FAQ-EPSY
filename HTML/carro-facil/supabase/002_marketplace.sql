-- Marketplace: compradores x garagistas. Aplicado no projeto "carro-facil" (migração marketplace_garagistas).

-- Perfil privado de cada usuário (só o próprio lê/edita)
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  papel text not null check (papel in ('comprador', 'garagista')),
  nome text not null check (char_length(nome) between 2 and 80),
  telefone text not null check (telefone ~ '^[0-9]{12,13}$'),
  cidade text check (char_length(cidade) <= 60),
  uf char(2),
  criado_em timestamptz not null default now()
);
alter table public.perfis enable row level security;
create policy "perfil: le o proprio" on public.perfis for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: cria o proprio" on public.perfis for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: altera o proprio" on public.perfis for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Garagem (loja): dados públicos. owner_id nulo = garagem de demonstração.
create table public.garagens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  cidade text not null check (char_length(cidade) <= 60),
  uf char(2) not null,
  demo boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.garagens enable row level security;
create policy "garagens: todos leem" on public.garagens for select to anon, authenticated using (true);
create policy "garagens: garagista cria a sua" on public.garagens for insert to authenticated
  with check ((select auth.uid()) = owner_id and exists (select 1 from public.perfis p where p.id = (select auth.uid()) and p.papel = 'garagista'));
create policy "garagens: dono altera" on public.garagens for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "garagens: dono apaga" on public.garagens for delete to authenticated using ((select auth.uid()) = owner_id);

-- Telefone da garagem: só logados leem
create table public.garagem_contatos (
  garagem_id uuid primary key references public.garagens (id) on delete cascade,
  telefone text not null check (telefone ~ '^[0-9]{12,13}$')
);
alter table public.garagem_contatos enable row level security;
create policy "contato garagem: logados leem" on public.garagem_contatos for select to authenticated using (true);
create policy "contato garagem: dono cria" on public.garagem_contatos for insert to authenticated
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "contato garagem: dono altera" on public.garagem_contatos for update to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));

-- Veículos à venda
create table public.veiculos (
  id bigint generated always as identity primary key,
  garagem_id uuid not null references public.garagens (id) on delete cascade,
  marca text not null check (char_length(marca) between 1 and 40),
  modelo text not null check (char_length(modelo) between 1 and 60),
  ano smallint not null check (ano between 1970 and 2100),
  km integer not null check (km >= 0),
  preco numeric(12, 2) not null check (preco > 0),
  cambio text not null check (cambio in ('Manual', 'Automático')),
  combustivel text not null check (combustivel in ('Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido')),
  tipo text not null check (tipo in ('Hatch', 'Sedan', 'SUV', 'Picape', 'Utilitário', 'Outro')),
  cor text check (char_length(cor) <= 30),
  cidade text not null check (char_length(cidade) <= 60),
  uf char(2) not null,
  descricao text not null default '' check (char_length(descricao) <= 1000),
  fotos text[] not null default '{}' check (cardinality(fotos) <= 6),
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'vendido')),
  criado_em timestamptz not null default now()
);
create index veiculos_garagem_idx on public.veiculos (garagem_id);
create index veiculos_busca_idx on public.veiculos (status, uf, preco);
alter table public.veiculos enable row level security;
create policy "veiculos: todos veem ativos" on public.veiculos for select to anon, authenticated using (status = 'ativo');
create policy "veiculos: dono ve todos os seus" on public.veiculos for select to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "veiculos: dono cadastra" on public.veiculos for insert to authenticated
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "veiculos: dono altera" on public.veiculos for update to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));
create policy "veiculos: dono apaga" on public.veiculos for delete to authenticated
  using (exists (select 1 from public.garagens g where g.id = garagem_id and g.owner_id = (select auth.uid())));

-- Interesse do comprador em um veículo (o garagista vê nome e telefone de quem demonstrou interesse)
create table public.interesses (
  id bigint generated always as identity primary key,
  veiculo_id bigint not null references public.veiculos (id) on delete cascade,
  comprador_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  telefone text not null check (telefone ~ '^[0-9]{12,13}$'),
  mensagem text not null default '' check (char_length(mensagem) <= 300),
  status text not null default 'novo' check (status in ('novo', 'atendido')),
  criado_em timestamptz not null default now(),
  unique (veiculo_id, comprador_id)
);
create index interesses_veiculo_idx on public.interesses (veiculo_id);
alter table public.interesses enable row level security;
create policy "interesse: comprador cria o seu" on public.interesses for insert to authenticated with check ((select auth.uid()) = comprador_id);
create policy "interesse: comprador ve o seu" on public.interesses for select to authenticated using ((select auth.uid()) = comprador_id);
create policy "interesse: comprador retira o seu" on public.interesses for delete to authenticated using ((select auth.uid()) = comprador_id);
create policy "interesse: garagista ve os do seu veiculo" on public.interesses for select to authenticated
  using (exists (select 1 from public.veiculos v join public.garagens g on g.id = v.garagem_id where v.id = veiculo_id and g.owner_id = (select auth.uid())));
create policy "interesse: garagista atualiza status" on public.interesses for update to authenticated
  using (exists (select 1 from public.veiculos v join public.garagens g on g.id = v.garagem_id where v.id = veiculo_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.veiculos v join public.garagens g on g.id = v.garagem_id where v.id = veiculo_id and g.owner_id = (select auth.uid())));
revoke update on public.interesses from authenticated;
grant update (status) on public.interesses to authenticated;

-- Preferências do comprador (favoritos passam a apontar para veiculos.id; busca = filtros salvos)
alter table public.preferencias alter column favoritos drop default;
alter table public.preferencias alter column favoritos type bigint[] using favoritos::bigint[];
alter table public.preferencias alter column favoritos set default '{}';
alter table public.preferencias add column busca jsonb not null default '{}'
  check (jsonb_typeof(busca) = 'object' and octet_length(busca::text) < 2000);

-- Match: quantos compradores têm uma busca salva que combina com o veículo (só o dono do veículo consulta; não expõe quem são)
create function public.compradores_interessados(p_veiculo bigint) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.veiculos v
  join public.garagens g on g.id = v.garagem_id and g.owner_id = (select auth.uid())
  join public.preferencias p on p.busca <> '{}'::jsonb
  where v.id = p_veiculo
    and (p.busca->>'uf' is null or p.busca->>'uf' = v.uf)
    and (p.busca->>'cidade' is null or lower(p.busca->>'cidade') = lower(v.cidade))
    and (p.busca->>'marca' is null or lower(p.busca->>'marca') = lower(v.marca))
    and (p.busca->>'modelo' is null or lower(v.modelo) like '%' || lower(p.busca->>'modelo') || '%')
    and (p.busca->>'anoMin' is null or v.ano >= (p.busca->>'anoMin')::int)
    and (p.busca->>'anoMax' is null or v.ano <= (p.busca->>'anoMax')::int)
    and (p.busca->>'precoMin' is null or v.preco >= (p.busca->>'precoMin')::numeric)
    and (p.busca->>'precoMax' is null or v.preco <= (p.busca->>'precoMax')::numeric)
    and (p.busca->>'kmMax' is null or v.km <= (p.busca->>'kmMax')::int)
    and (p.busca->>'cambio' is null or p.busca->>'cambio' = v.cambio)
    and (p.busca->>'combustivel' is null or p.busca->>'combustivel' = v.combustivel)
    and (p.busca->>'tipo' is null or p.busca->>'tipo' = v.tipo)
    and (p.busca->>'garagem' is null or p.busca->>'garagem' = v.garagem_id::text);
$$;
revoke execute on function public.compradores_interessados(bigint) from public, anon;
grant execute on function public.compradores_interessados(bigint) to authenticated;

-- Fotos: bucket público para leitura; só o dono da garagem grava na pasta <garagem_id>/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('veiculos', 'veiculos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "fotos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'veiculos' and (storage.foldername(name))[1] in (select g.id::text from public.garagens g where g.owner_id = (select auth.uid())));
create policy "fotos: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'veiculos' and (storage.foldername(name))[1] in (select g.id::text from public.garagens g where g.owner_id = (select auth.uid())));

-- Os contatos de vendedores agora vêm de garagem_contatos; `contatos` fica só para despachantes (chaves d1..d5)
delete from public.contatos where chave like 'c%';
