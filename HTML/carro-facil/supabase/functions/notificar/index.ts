// Envia Web Push para as assinaturas do usuário quando uma linha entra em `notificacoes`.
// Chamada pelo gatilho do banco (pg_net) com o cabeçalho x-webhook-secret; sem esse segredo responde 403.
// verify_jwt desligado de propósito: a autenticação é o segredo compartilhado guardado em config_privada.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function config(): Promise<Record<string, string>> {
  const { data } = await sb.from("config_privada").select("chave,valor");
  return Object.fromEntries((data ?? []).map((x) => [x.chave, x.valor]));
}

Deno.serve(async (req) => {
  let c = await config();
  if (!c.webhook_secret || req.headers.get("x-webhook-secret") !== c.webhook_secret) {
    return new Response("forbidden", { status: 403 });
  }
  let body: { id?: number; init?: boolean } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }

  // primeira execução: gera o par de chaves VAPID e guarda no banco (a chave privada nunca sai daqui)
  if (!c.vapid_public || !c.vapid_private) {
    const k = webpush.generateVAPIDKeys();
    await sb.from("config_privada").upsert(
      [{ chave: "vapid_public", valor: k.publicKey }, { chave: "vapid_private", valor: k.privateKey }],
      { onConflict: "chave", ignoreDuplicates: true },
    );
    c = await config();
  }
  if (body.init || !body.id) return Response.json({ ok: true, init: true });

  const { data: n } = await sb.from("notificacoes").select("*").eq("id", body.id).maybeSingle();
  if (!n || n.enviada_em) return Response.json({ ok: true, ignorada: true });

  const { data: subs } = await sb.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", n.user_id);
  webpush.setVapidDetails(c.vapid_subject || "mailto:contato@example.com", c.vapid_public, c.vapid_private);
  const payload = JSON.stringify({ titulo: n.titulo, corpo: n.corpo, url: n.url });

  let enviados = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
      enviados++;
    } catch (e) {
      const st = (e as { statusCode?: number }).statusCode;
      if (st === 404 || st === 410) await sb.from("push_subscriptions").delete().eq("id", s.id); // assinatura expirada
    }
  }));
  await sb.from("notificacoes").update({ enviada_em: new Date().toISOString() }).eq("id", n.id);
  return Response.json({ ok: true, enviados });
});
