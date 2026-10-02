# Ativar a consulta de placa com dados reais

Estado atual: a função `consulta_placa` está publicada e funcionando em **modo simulado** (dados fictícios, nunca gera o selo "Dados conferidos"). Para dados reais falta **contratar um provedor e configurar 5 valores no banco**. Não há nova versão do app a publicar: o app web já usa a função.

## O que já está validado (por mim)
| Item | Como foi validado |
|---|---|
| Formato da placa (antiga e Mercosul), privacidade (placa só visível para a própria garagem), cota diária por garagem, cache de 30 dias por provedor, desfazer cota quando o provedor falha | Testes no banco com troca de papéis e rollback |
| Selo "Dados conferidos" decidido só pelo banco; impossível forjar por insert/update | Testes no banco |
| Comparação anúncio × retorno: apelidos de marca (VW/Volkswagen, GM/Chevrolet, M.BENZ…), prefixos `I/`, palavra do modelo em qualquer posição, ano de fabricação ou do modelo | 8 casos no banco |
| Adaptador genérico (GET + JSON + mapeamento dos campos), 404, 429/5xx, retorno incompleto, descarte de dados do proprietário, token fora do log | 14 testes automatizados (`supabase/functions/consulta_placa/provedor.test.mts`) |
| Tela: consulta, preenchimento, erros de cota/indisponível/não encontrada, selo no card, painel e detalhe | Testes de navegador com Supabase simulado |

## O que NÃO foi validado (só dá para validar com o provedor real)
- Que o provedor contratado responde no formato que você configurar (precisa de um JSON de exemplo real).
- Cobertura: a base do provedor traz marca/modelo/ano para quase todas as placas? Quanto tempo leva para refletir veículos recém-emplacados ou com cor/ano alterados?
- Tempo de resposta e limite do provedor (a função espera até 8 s).
- Quanto custa de fato cada consulta e o que acontece com consultas de placa inexistente.
- A chamada da função com login real (o ambiente de desenvolvimento não alcança a função publicada e não tem login de garagista).

## Passo a passo
**1. Escolher e contratar o provedor (você).** Candidatos encontrados em pesquisa (não consegui abrir as páginas de preço/documentação deste ambiente; confirme tudo com eles):
Infosimples (pré-pago, franquia mínima de R$ 100/mês), WebXcar, FipeAPI.com.br (consulta por placa), API Placas, API Brasil.
Pergunte a cada um:
1. Preço por consulta e franquia mínima; consulta de placa não encontrada é cobrada?
2. A resposta traz **marca, modelo, ano de fabricação, ano do modelo, cor e combustível**? Qual a taxa de acerto e a defasagem da base?
3. De onde vêm os dados (fonte oficial ou compilação)? O contrato permite **exibir o resultado a terceiros** (clientes do marketplace) e **guardar em cache por 30 dias**?
4. Há dados do proprietário no retorno? (Eu os descarto, mas peça para **desligar** se for possível: menos dado pessoal, menos risco LGPD.)
5. Limite de requisições por segundo, SLA e suporte; ambiente de teste/sandbox.
6. Autenticação: token na URL ou em cabeçalho?

**2. Me enviar (você):** um **JSON de exemplo real** de uma consulta (de uma placa sua), a URL/formato de chamada e o token. O token não precisa passar pelo chat: você mesmo pode inseri-lo (passo 3).

**3. Configurar no Supabase (SQL Editor; eu faço se você preferir).** Ajuste a URL e o mapa ao provedor:
```sql
insert into public.config_privada (chave, valor) values
  ('placa_api_url',     'https://api.provedor.com/placas/{placa}'),
  ('placa_api_token',   'COLE_O_TOKEN_AQUI'),
  ('placa_api_headers', '{"Authorization":"Bearer {token}"}'),   -- ou deixe '' e use {token} na URL
  ('placa_api_mapa',    '{"marca":"caminho.marca","modelo":"caminho.modelo","ano_fabricacao":"caminho.ano","ano_modelo":"caminho.anoModelo","cor":"caminho.cor","combustivel":"caminho.combustivel","erro_se":"erro"}')
on conflict (chave) do update set valor = excluded.valor;
```
Os caminhos usam ponto para níveis (`data.vehicle.brand`). `ano` aceita `2019`, `"2019"` ou `"2019/2020"`.

**4. Teste controlado (eu + você), com `placa_provedor` ainda em `simulado` para os usuários:**
1. Eu chamo o adaptador com 5–10 placas reais suas (carros conhecidos) e comparamos com o documento: marca, modelo, anos.
2. Ajusto o mapa e as regras de comparação se algum modelo não casar (ex.: o provedor devolve `I/VW GOL 1.0` e o anúncio diz `Gol`).
3. Meço tempo de resposta e custo real das 10 consultas.

**5. Ativar (um comando, reversível):**
```sql
update public.config_privada set valor = 'generico' where chave = 'placa_provedor';
-- voltar ao modo de teste a qualquer momento:
-- update public.config_privada set valor = 'simulado' where chave = 'placa_provedor';
```
O cache de teste não é reaproveitado (o cache é por provedor). Ajuste a cota se quiser: `update public.config_privada set valor='15' where chave='placa_limite_dia';`

**6. Piloto com 1–2 garagens reais por 1–2 semanas:** acompanhar a taxa de anúncios que recebem o selo, falhas do provedor (logs da função no painel do Supabase), custo por anúncio e reclamações de "não conferiu". Só depois liberar para todas.

## Decisões de produto para você tomar
- **Quem paga a consulta?** Hoje a cota é por garagem (30/dia), e o custo é seu. Opções: incluir no plano, cobrar por consulta acima de X, ou reduzir a cota.
- **Selo é obrigatório?** Hoje é opcional (anúncio sem selo continua válido). Obrigar derrubaria anúncios quando o provedor cair.
- **Mismatch:** hoje o app só deixa de dar o selo. Alternativas: avisar o garagista ("a marca/ano diferem do registro") ou sinalizar para a moderação.

## LGPD
A placa de um veículo de loja é dado do negócio, mas pode identificar o proprietário. Mantemos só 6 campos do veículo, a placa não é exposta ao público, e nenhum dado de proprietário é guardado. Inclua o provedor na Política de Privacidade como operador e confirme no contrato que ele trata os dados conforme a LGPD.

## Custo esperado (a confirmar com o provedor)
Consultas/mês ≈ anúncios novos por mês (o cache de 30 dias evita repetir a mesma placa). Ex.: 20 garagens × 15 anúncios novos = 300 consultas. Pelo modelo pré-pago com franquia mínima citado pela Infosimples (R$ 100/mês), o custo inicial seria da ordem de R$ 100–300/mês, mas **o preço por consulta não pôde ser confirmado**.
