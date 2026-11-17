import type { Fmt, Player, Pos, Season } from "./types";
import { defenseTable, expectedPts, matchupLabel, ppg, pts, touchValues } from "./scoring";

/** Season rank at which players are usually already on a team, by league size. */
const ROSTERED: Record<number, Record<Pos, number>> = {
  10: { QB: 12, RB: 32, WR: 40, TE: 12 },
  12: { QB: 15, RB: 40, WR: 50, TE: 14 },
  14: { QB: 18, RB: 48, WR: 60, TE: 17 },
};

export interface Pickup {
  p: Player;
  tag: "Role is growing" | "Hot hand" | "Matchup play" | "Bench stash";
  startable: boolean;      // good enough to start next week
  recent: number;          // points a game, last 2 games
  value: number;           // lean score relative to the starter line at his position
  reasons: string[];
}

const avg = (a: number[]) => (a.length ? a.reduce((t, v) => t + v, 0) / a.length : 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const f1 = (v: number) => v.toFixed(1);

/** Likely-available players ranked by how much they are worth adding right now. */
export function waiverPicks(data: Season, f: Fmt, leagueSize = 12): Pickup[] {
  const cut = ROSTERED[leagueSize] ?? ROSTERED[12];
  const values = touchValues(data.players, f);
  const tables = {} as Record<Pos, ReturnType<typeof defenseTable>>;
  const teams = Object.keys(data.defense).length;
  const out: Pickup[] = [];
  for (const p of data.players) {
    if (p.rk[f] <= cut[p.pos]) continue;
    if (!p.g.some((g) => g.w >= data.week - 1)) continue; // must have played in the last two weeks
    const now = p.g.slice(-2), before = p.g.slice(0, -2);
    const recent = avg(now.map((g) => pts(g, f)));
    const work = p.pos === "QB" ? recent : avg(now.map((g) => expectedPts(g, values[p.pos])));
    const touch = (g: Player["g"][number]) => (p.pos === "QB" ? g.att : g.tgt) + g.car;
    const touchNow = avg(now.map(touch)), touchBefore = before.length ? avg(before.map(touch)) : null;
    const sn = (gs: Player["g"]) => { const v = gs.filter((g) => g.sn != null).map((g) => g.sn!); return v.length ? avg(v) : null; };
    const snapNow = sn(now), snapBefore = sn(before);
    const snapJump = snapNow != null && snapBefore != null ? snapNow - snapBefore : 0;
    const touchJump = touchBefore != null ? touchNow - touchBefore : 0;

    const table = (tables[p.pos] ||= defenseTable(data.defense, p.pos, f));
    const league = avg(table.map((r) => r.avg));
    const opp = data.next?.opp[p.team] ?? null;
    const row = opp ? table.find((r) => r.team === opp.replace("@", "")) : undefined;
    const bye = !!data.next && !opp;
    const matchup = row && league ? clamp(row.avg / league, 0.85, 1.15) : 1;

    const line = data.line[p.pos][f];
    const growing = p.pos !== "QB" && (snapJump >= 15 || touchJump >= 4);
    let score = (0.45 * recent + 0.35 * work + 0.2 * ppg(p, f)) * matchup + clamp(snapJump, 0, 40) * 0.06;
    if (bye) score *= 0.85;
    const value = score / line;
    if (value < 0.55 || (p.pos !== "QB" && touchNow < 3)) continue;

    const reasons: string[] = [];
    if (snapJump >= 15) reasons.push(`Snaps are up from ${Math.round(snapBefore!)}% to ${Math.round(snapNow!)}% over his last 2 games.`);
    if (p.pos !== "QB" && touchJump >= 4) reasons.push(`Targets and carries are up from ${f1(touchBefore!)} to ${f1(touchNow)} a game.`);
    if (recent >= line) reasons.push(`Scored ${f1(recent)} a game over his last 2, more than a typical starting ${p.pos} (${f1(line)}).`);
    else if (p.pos !== "QB" && work - recent >= 3) reasons.push(`Getting ${f1(touchNow)} targets and carries a game, work that usually earns ${f1(work)} points. He has scored ${f1(recent)}.`);
    if (bye) reasons.push(`On bye in week ${data.next!.week}, so this is a pickup for later.`);
    else if (row && opp) {
      const where = `${opp.startsWith("@") ? "at" : "vs"} ${opp.replace("@", "")}`;
      if (row.rank <= 8) reasons.push(`Next up ${where}, a defense that ${matchupLabel(row.rank, teams, p.pos)}.`);
      else if (row.rank > teams - 6) reasons.push(`Tough game next ${where}, a defense that ${matchupLabel(row.rank, teams, p.pos)}.`);
    }
    if (!reasons.length) reasons.push(`Averaging ${f1(recent)} points over his last 2 games on ${f1(touchNow)} ${p.pos === "QB" ? "pass attempts and carries" : "targets and carries"}.`);

    const startable = !bye && value >= 1;
    const tag: Pickup["tag"] = growing ? "Role is growing" : startable && row && row.rank <= 8 && recent < line ? "Matchup play" : recent >= line ? "Hot hand" : !bye && row && row.rank <= 6 ? "Matchup play" : "Bench stash";
    out.push({ p, tag, startable, recent, value, reasons: reasons.slice(0, 3) });
  }
  return out.sort((a, b) => b.value - a.value);
}
