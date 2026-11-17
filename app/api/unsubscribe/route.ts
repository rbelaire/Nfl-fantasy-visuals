import type { NextRequest } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Unsubscribes by the token in each email. Mail apps call this directly for one-click unsubscribe. */
export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get("t");
  if (!token) { try { token = (await req.json()).t; } catch {} }
  if (!token || !UUID.test(token)) return Response.json({ error: "That unsubscribe link isn't complete. Use the link from the bottom of the email." }, { status: 400 });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: "Unsubscribe is not available right now. Reply to the email and we'll remove you." }, { status: 503 });
  const r = await fetch(`${url}/rest/v1/rpc/unsubscribe`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token }),
  });
  if (!r.ok) return Response.json({ error: "Something went wrong. Try again in a minute." }, { status: 502 });
  return Response.json({ ok: true });
}
