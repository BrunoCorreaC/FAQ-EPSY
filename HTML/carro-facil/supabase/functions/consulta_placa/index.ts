// Consulta de placa para o cadastro de anúncios. Autenticada por JWT do garagista (verify_jwt ligado).
// Fluxo: RPC placa_preparar (como o usuário: valida garagem liberada, formato, cota diária e cache de 30 dias)
//        -> se não há cache, chama o provedor -> grava no cache com a chave de serviço.
// O selo "Dados conferidos" é decidido só pelo banco (placa_confere); o provedor "simulado" nunca gera selo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { consultaGenerica, type Dados } from "./provedor.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const resp = (o: unknown, status = 200) => Response.json(o, { status, headers: CORS });

// Provedor de teste: dados determinísticos a partir da placa. NÃO é consulta real.
function simulado(placa: string): Dados {
  const base: Dados[] = [
    { marca: "CHEVROLET", modelo: "ONIX 1.0 LT", ano_fabricacao: 2019, ano_modelo: 2020, cor: "BRANCA", combustivel: "Flex" },
    { marca: "VOLKSWAGEN", modelo: "GOL 1.6 MSI", ano_fabricacao: 2017, ano_modelo: 2018, cor: "PRATA", combustivel: "Flex" },
    { marca: "FIAT", modelo: "ARGO 1.3 DRIVE", ano_fabricacao: 2021, ano_modelo: 2021, cor: "VERMELHA", combustivel: "Flex" },
    { marca: "HYUNDAI", modelo: "HB20 1.0 COMFORT", ano_fabricacao: 2020, ano_modelo: 2020, cor: "PRETA", combustivel: "Flex" },
  ];
  let h = 0; for (const ch of placa) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return base[h % base.length];
}

// placa_provedor = "simulado" (teste, nunca gera selo) ou "generico" (qualquer API JSON configurada em config_privada; ver provedor.ts).
async function consultaProvedor(provedor: string, placa: string): Promise<Dados> {
  if (provedor === "simulado") return simulado(placa);
  if (provedor === "generico") {
    const { data } = await admin.from("config_privada").select("chave,valor").like("chave", "placa_api_%");
    return await consultaGenerica(Object.fromEntries((data ?? []).map((x) => [x.chave, x.valor])), placa);
  }
  throw new Error("provedor_nao_configurado");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return resp({ erro: "metodo" }, 405);
  const auth = req.headers.get("Authorization") ?? "";
  let placa = "";
  try { placa = String((await req.json()).placa ?? ""); } catch { /* corpo inválido */ }

  const user = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const prep = await user.rpc("placa_preparar", { p_placa: placa });
  if (prep.error) {
    const m = prep.error.message || "";
    const codigo = ["nao_autenticado", "garagem_nao_aprovada", "placa_invalida", "limite_consultas"].find((c) => m.includes(c)) ?? "erro";
    return resp({ erro: codigo }, codigo === "erro" ? 500 : codigo === "nao_autenticado" ? 401 : 400);
  }
  const { placa: pl, dados, provedor, consulta_id } = prep.data as { placa: string; dados: Dados | null; provedor: string; consulta_id: number };
  if (dados) return resp({ ok: true, placa: pl, dados, simulado: provedor === "simulado", cache: true });

  try {
    const novo = await consultaProvedor(provedor, pl);
    await admin.from("placa_cache").upsert({ placa: pl, dados: novo, provedor, consultado_em: new Date().toISOString() }, { onConflict: "placa" });
    return resp({ ok: true, placa: pl, dados: novo, simulado: provedor === "simulado", cache: false });
  } catch (e) {
    await admin.from("placa_consultas").delete().eq("id", consulta_id); // falha do provedor não gasta a cota
    const m = (e as Error).message;
    console.error("consulta_placa", m);
    if (m === "placa_nao_encontrada") return resp({ erro: m }, 404);
    return resp({ erro: m === "provedor_nao_configurado" ? "provedor_indisponivel" : "provedor_falhou" }, 502);
  }
});
