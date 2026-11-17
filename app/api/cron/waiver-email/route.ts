import type { NextRequest } from "next/server";
import { season } from "@/lib/data";
import { SITE, waiverEmail } from "@/lib/email";

export const maxDuration = 60;

const env = (k: string) => process.env[k] ?? "";
const authorized = (req: NextRequest) => {
  const secret = env("CRON_SECRET");
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}` || req.nextUrl.searchParams.get("key") === secret;
};
const unsubUrl = (token: string) => `${SITE}/unsubscribe?t=${token}`;

async function subscribers(): Promise<{ email: string; token: string }[]> {
  const r = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/subscribers_to_send`, {
    method: "POST",
    headers: { apikey: env("SUPABASE_PUBLISHABLE_KEY"), Authorization: `Bearer ${env("SUPABASE_PUBLISHABLE_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: env("SUBSCRIBER_READ_TOKEN") }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Could not read the subscriber list (${r.status}).`);
  return r.json();
}

async function sendBatch(batch: { email: string; token: string }[], key: string) {
  const address = env("MAILING_ADDRESS");
  const body = batch.map((s) => {
    const m = waiverEmail(season, unsubUrl(s.token), address);
    return {
      from: env("EMAIL_FROM"), to: [s.email], subject: m.subject, html: m.html, text: m.text,
      headers: { "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${s.token}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    };
  });
  const r = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Email service refused the batch (${r.status}): ${(await r.text()).slice(0, 300)}`);
}

/**
 * The weekly waiver email.
 *   ?preview=1                 shows this week's email in the browser (no sending)
 *   ?key=SECRET&dry=1          checks setup and counts subscribers (no sending)
 *   ?key=SECRET&test=a@b.com   sends one copy to that address
 *   Vercel Cron (Bearer SECRET) sends to everyone, Tuesday mornings
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (q.get("preview")) {
    const m = waiverEmail(season, `${SITE}/unsubscribe?t=preview`, env("MAILING_ADDRESS") || "[mailing address goes here]");
    return new Response(m.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  if (!authorized(req)) return Response.json({ error: "Not allowed." }, { status: 401 });

  const missing = ["RESEND_API_KEY", "EMAIL_FROM", "MAILING_ADDRESS", "SUBSCRIBER_READ_TOKEN", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].filter((k) => !env(k));
  if (q.get("dry")) {
    let count: number | string;
    try { count = (await subscribers()).length; } catch (e) { count = e instanceof Error ? e.message : "error"; }
    return Response.json({ week: season.next?.week ?? season.week + 1, subscribers: count, missing });
  }
  if (missing.length) return Response.json({ error: `Not sending: missing ${missing.join(", ")}.` }, { status: 503 });

  const wk = season.next?.week ?? season.week + 1;
  const test = q.get("test");
  if (test) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(test)) return Response.json({ error: "That test address isn't valid." }, { status: 400 });
    await sendBatch([{ email: test, token: "test" }], `test-${season.season}-w${wk}-${test}-${Date.now()}`);
    return Response.json({ sent: 1, to: test });
  }

  const list = await subscribers();
  let sent = 0;
  for (let i = 0; i < list.length; i += 100) {
    // The idempotency key stops a retried run from sending the same week twice.
    await sendBatch(list.slice(i, i + 100), `waivers-${season.season}-w${wk}-${i / 100}`);
    sent += Math.min(100, list.length - i);
    if (i + 100 < list.length) await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`Waiver email week ${wk}: sent ${sent}`);
  return Response.json({ week: wk, sent });
}
