import type { Fmt, PastSeason, Player } from "./types";
import { pts } from "./scoring";

const REC = [0, 0.5, 1];
export const pastPts = (s: PastSeason, f: Fmt) => s.s.map((v, i) => v + s.r[i] * REC[f]);

export interface Twin {
  season: PastSeason;
  /** past season's points per game, in order */
  values: number[];
  /** average gap, in points per game, between the two seasons over the matched games */
  gap: number;
  /** points per game over the matched games, and over the games after them */
  early: number; rest: number;
}

const rms = (a: number[], b: number[]) => Math.sqrt(a.reduce((t, v, i) => t + (v - b[i]) ** 2, 0) / a.length);
const mean = (a: number[]) => (a.length ? a.reduce((t, v) => t + v, 0) / a.length : 0);

/**
 * Past seasons whose first N games look most like this player's first N games.
 * The gap blends the game-by-game order with the overall spread of scores,
 * so a matching run of spikes and duds counts as much as a matching average.
 */
export function findTwins(player: Player, seasons: PastSeason[], f: Fmt, count = 5): Twin[] {
  const mine = player.g.map((g) => pts(g, f));
  const k = mine.length;
  if (k < 3) return [];
  const mineSorted = [...mine].sort((a, b) => a - b);
  return seasons
    .filter((s) => s.pos === player.pos && s.s.length >= k + 3)
    .map((s) => {
      const values = pastPts(s, f);
      const head = values.slice(0, k);
      const gap = 0.5 * rms(mine, head) + 0.5 * rms(mineSorted, [...head].sort((a, b) => a - b));
      return { season: s, values, gap, early: mean(head), rest: mean(values.slice(k)) };
    })
    .sort((a, b) => a.gap - b.gap)
    .slice(0, count);
}
