// Adaptador genérico: serve para qualquer provedor que responda JSON a um GET por placa.
// Nada aqui assume o formato de um provedor específico: URL, cabeçalhos e mapeamento dos campos ficam em config_privada.
//   placa_api_url      ex.: https://api.exemplo.com/placas/{placa}?token={token}
//   placa_api_token    chave do provedor (substitui {token})
//   placa_api_headers  JSON opcional, ex.: {"Authorization":"Bearer {token}"}
//   placa_api_mapa     JSON com caminhos no retorno, ex.:
//     {"marca":"dados.marca","modelo":"dados.modelo","ano_fabricacao":"dados.ano","ano_modelo":"dados.anoModelo","cor":"dados.cor","combustivel":"dados.combustivel","erro_se":"erro"}
// Só estes 6 campos são guardados: dados de proprietário (nome, CPF, endereço) que o provedor mande são descartados aqui.

export type Dados = { marca: string; modelo: string; ano_fabricacao: number; ano_modelo: number; cor: string; combustivel: string };
export type Mapa = Partial<Record<keyof Dados | "erro_se", string>>;

const pega = (obj: unknown, caminho?: string): unknown => {
  if (!caminho) return undefined;
  return caminho.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
};
const texto = (v: unknown, max = 60) => (v == null ? "" : String(v)).replace(/\s+/g, " ").trim().slice(0, max);
// aceita 2019, "2019" ou "2019/2020" (devolve [fabricação, modelo])
const anos = (v: unknown): number[] => (String(v ?? "").match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);

export function combustivelPadrao(v: string): string {
  const s = v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/hibrid/.test(s)) return "Híbrido";
  if (/eletric/.test(s)) return "Elétrico";
  if (/diesel/.test(s)) return "Diesel";
  if (/flex|alcool.*gasolina|gasolina.*alcool|etanol/.test(s)) return "Flex";
  if (/gasolina/.test(s)) return "Gasolina";
  return v ? texto(v, 30) : "";
}

export function extrai(json: unknown, mapa: Mapa): Dados {
  if (mapa.erro_se && pega(json, mapa.erro_se)) throw new Error("placa_nao_encontrada");
  const marca = texto(pega(json, mapa.marca)), modelo = texto(pega(json, mapa.modelo), 80);
  const fab = anos(pega(json, mapa.ano_fabricacao)), mod = anos(pega(json, mapa.ano_modelo));
  const ano_fabricacao = fab[0] ?? mod[0] ?? (fab[1] ?? 0), ano_modelo = mod[mod.length - 1] ?? (fab[1] ?? fab[0] ?? 0);
  if (!marca || !modelo || !ano_fabricacao) throw new Error("retorno_incompleto");
  return { marca, modelo, ano_fabricacao, ano_modelo: ano_modelo || ano_fabricacao, cor: texto(pega(json, mapa.cor), 30), combustivel: combustivelPadrao(texto(pega(json, mapa.combustivel), 40)) };
}

export async function consultaGenerica(c: Record<string, string>, placa: string, buscar: typeof fetch = fetch): Promise<Dados> {
  if (!c.placa_api_url || !c.placa_api_mapa) throw new Error("provedor_nao_configurado");
  const sub = (s: string, cru = false) => { const e = cru ? (x: string) => x : encodeURIComponent; return s.replaceAll("{placa}", e(placa)).replaceAll("{token}", e(c.placa_api_token ?? "")); }; // URL escapa; cabeçalho vai cru
  let headers: Record<string, string> = {}, mapa: Mapa;
  try { mapa = JSON.parse(c.placa_api_mapa); if (c.placa_api_headers) headers = Object.fromEntries(Object.entries(JSON.parse(c.placa_api_headers)).map(([k, v]) => [k, sub(String(v), true)])); }
  catch { throw new Error("provedor_nao_configurado"); }
  const r = await buscar(sub(c.placa_api_url), { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(8000) });
  if (r.status === 404) throw new Error("placa_nao_encontrada");
  if (!r.ok) throw new Error("provedor_falhou");
  let json: unknown; try { json = await r.json(); } catch { throw new Error("provedor_falhou"); }
  return extrai(json, mapa);
}
