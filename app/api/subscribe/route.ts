import type { NextRequest } from "next/server";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Adds an email to the weekly list. The database function ignores repeats. */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown; company?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "Send an email address." }, { status: 400 }); }
  // Bots fill in the hidden "company" field; people never see it.
  if (body.company) return Response.json({ ok: true });
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL.test(email) || email.length > 254) return Response.json({ error: "Enter a full email address, like name@example.com." }, { status: 400 });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: "Sign-ups are not set up yet." }, { status: 503 });
  const r = await fetch(`${url}/rest/v1/rpc/subscribe`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_email: email, p_source: typeof body.source === "string" ? body.source.slice(0, 40) : null }),
  });
  if (!r.ok) return Response.json({ error: "Something went wrong saving that. Try again in a minute." }, { status: 502 });
  return Response.json({ ok: true });
}
