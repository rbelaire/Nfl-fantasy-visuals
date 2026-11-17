import type { Fmt, Player, Pos } from "./types";
import { ppg } from "./scoring";

export const TIER_DEPTH: Record<Pos, number> = { QB: 24, RB: 36, WR: 48, TE: 24 };
export const TIER_RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#1c5cab"];
export const minGames = (week: number) => Math.max(3, Math.ceil(week / 2));

/** Splits a sorted list at its largest drop-offs, keeping every tier at least two players deep. */
function tierBreaks(values: number[], tiers: number): Set<number> {
  const gaps = values.slice(1).map((v, i) => ({ at: i + 1, gap: values[i] - v })).sort((a, b) => b.gap - a.gap);
  const cuts: number[] = [];
  for (const g of gaps) {
    if (cuts.length >= tiers - 1) break;
    if (g.at < 2 || g.at > values.length - 2) continue;
    if (cuts.some((c) => Math.abs(c - g.at) < 2)) continue;
    cuts.push(g.at);
  }
  return new Set(cuts);
}

/** Players at a position grouped into tiers by points per game. */
export function buildTiers(players: Player[], pos: Pos, f: Fmt, week: number, depth = TIER_DEPTH[pos]) {
  const list = players.filter((p) => p.pos === pos && p.g.length >= minGames(week))
    .map((p) => ({ p, v: ppg(p, f) })).sort((a, b) => b.v - a.v).slice(0, depth);
  const breaks = tierBreaks(list.map((x) => x.v), TIER_RAMP.length);
  const groups: (typeof list)[] = [];
  list.forEach((x, i) => { if (i === 0 || breaks.has(i)) groups.push([]); groups[groups.length - 1].push(x); });
  return groups;
}
