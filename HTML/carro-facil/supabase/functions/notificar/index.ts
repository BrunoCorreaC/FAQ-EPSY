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

// ---------- push nativo (Android direto; iOS via APNs configurado no Firebase) ----------
// Credencial: JSON da conta de serviço do Firebase em config_privada.fcm_service_account (vazio = push nativo desligado).
const b64u = (b: ArrayBuffer | string) => btoa(typeof b === "string" ? b : String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let tokenFcm: { v: string; exp: number } | null = null;
async function acessoFcm(sa: { client_email: string; private_key: string; token_uri?: string }): Promise<string> {
  if (tokenFcm && tokenFcm.exp > Date.now() + 60000) return tokenFcm.v;
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: sa.token_uri ?? "https://oauth2.googleapis.com/token", iat: agora, exp: agora + 3600 }))}`;
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "");
  const chave = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", chave, new TextEncoder().encode(corpo));
  const r = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${b64u(assinatura)}` }) });
  const j = await r.json();
  if (!j.access_token) throw new Error("fcm_auth");
  tokenFcm = { v: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return tokenFcm.v;
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

  // push nativo (apps das lojas)
  let enviadosNativo = 0;
  if (c.fcm_service_account) {
    const { data: toks } = await sb.from("push_tokens").select("token").eq("user_id", n.user_id);
    if (toks?.length) {
      try {
        const sa = JSON.parse(c.fcm_service_account);
        const acesso = await acessoFcm(sa);
        await Promise.all(toks.map(async (t) => {
          const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
            method: "POST", headers: { Authorization: `Bearer ${acesso}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: { token: t.token, notification: { title: n.titulo, body: n.corpo }, data: { url: String(n.url ?? "") } } }),
          });
          if (r.ok) enviadosNativo++;
          else if (r.status === 404 || r.status === 400) await sb.from("push_tokens").delete().eq("token", t.token); // token expirado/inválido
        }));
      } catch (e) { console.error("push nativo falhou", (e as Error).message); }
    }
  }
  await sb.from("notificacoes").update({ enviada_em: new Date().toISOString() }).eq("id", n.id);
  return Response.json({ ok: true, enviados, enviadosNativo });
});
