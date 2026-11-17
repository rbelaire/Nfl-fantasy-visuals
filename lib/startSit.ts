import type { Fmt, Player, Season } from "./types";
import { defenseTable, luck, ppg, pts, touchValues } from "./scoring";

export interface StartRead {
  p: Player;
  bye: boolean;
  opp: string | null;          // "DAL" or "@DAL"
  defRank: number | null;      // 1 = allows the most to this position
  matchup: number;             // multiplier, 0.85-1.15
  recent: number;              // points per game, last 3
  workload: number | null;     // what the last 3 games' touches usually earn
  season: number;              // points per game, season
  startable: number;           // share of games above the starter line
  score: number | null;        // the lean, null on a bye
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A simple, visible read of who to start next week: recent points, what the recent workload
 * usually earns, the season average, then a nudge for how generous the opposing defense has been.
 */
export function startRead(p: Player, data: Season, f: Fmt, values = touchValues(data.players, f)): StartRead {
  const last = p.g.slice(-3);
  const recent = last.length ? last.reduce((t, g) => t + pts(g, f), 0) / last.length : 0;
  const form = luck(p, f, values);
  const season = ppg(p, f);
  const base = form ? 0.4 * recent + 0.3 * form.expected + 0.3 * season : 0.5 * recent + 0.5 * season;
  const opp = data.next?.opp[p.team] ?? null;
  const table = defenseTable(data.defense, p.pos, f);
  const league = table.reduce((t, r) => t + r.avg, 0) / (table.length || 1);
  const row = opp ? table.find((r) => r.team === opp.replace("@", "")) : undefined;
  const matchup = row && league ? clamp(row.avg / league, 0.85, 1.15) : 1;
  const bye = !!data.next && !opp;
  const line = data.line[p.pos][f];
  return {
    p, bye, opp, defRank: row?.rank ?? null, matchup, recent, workload: form?.expected ?? null, season,
    startable: p.g.length ? p.g.filter((g) => pts(g, f) >= line).length / p.g.length : 0,
    score: bye ? null : base * matchup,
  };
}
