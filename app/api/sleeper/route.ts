import type { NextRequest } from "next/server";
import { season } from "@/lib/data";

// A small relay to Sleeper's public API, so the browser only talks to this site.
const API = "https://api.sleeper.app/v1";
const get = async (path: string, seconds: number) => {
  const r = await fetch(`${API}${path}`, { next: { revalidate: seconds } });
  if (!r.ok) return null;
  return r.json();
};
const json = (body: unknown, status = 200, cache = "public, s-maxage=300") =>
  Response.json(body, { status, headers: { "Cache-Control": cache } });

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const user = q.get("user"), league = q.get("league");

  if (user) {
    if (!/^[A-Za-z0-9_]{2,40}$/.test(user)) return json({ error: "Sleeper usernames use letters, numbers and underscores." }, 400, "no-store");
    const u = await get(`/user/${encodeURIComponent(user)}`, 3600);
    if (!u?.user_id) return json({ error: "No Sleeper account has that username. Check the spelling in the Sleeper app under your profile." }, 404, "no-store");
    const leagues = (await get(`/user/${u.user_id}/leagues/nfl/${season.season}`, 300)) ?? [];
    return json({
      userId: u.user_id,
      name: u.display_name,
      leagues: leagues.map((l: { league_id: string; name: string; total_rosters: number }) => ({ id: l.league_id, name: l.name, size: l.total_rosters })),
    });
  }

  if (league) {
    if (!/^\d{5,25}$/.test(league)) return json({ error: "That league id doesn't look right." }, 400, "no-store");
    const [info, rosters, users] = await Promise.all([get(`/league/${league}`, 300), get(`/league/${league}/rosters`, 120), get(`/league/${league}/users`, 600)]);
    if (!info || !rosters) return json({ error: "Sleeper didn't return that league. Try again in a minute." }, 502, "no-store");
    const names = new Map<string, string>((users ?? []).map((u: { user_id: string; display_name: string; metadata?: { team_name?: string } }) => [u.user_id, u.metadata?.team_name || u.display_name]));
    return json({
      id: info.league_id,
      name: info.name,
      size: info.total_rosters,
      rec: Number(info.scoring_settings?.rec ?? 0),
      rosters: rosters.map((r: { roster_id: number; owner_id: string | null; players: string[] | null }) => ({
        rid: r.roster_id, owner: r.owner_id, team: (r.owner_id && names.get(r.owner_id)) || `Team ${r.roster_id}`, players: r.players ?? [],
      })),
    }, 200, "public, s-maxage=60");
  }

  return json({ error: "Send a Sleeper username or league id." }, 400, "no-store");
}
