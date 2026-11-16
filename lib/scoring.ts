import type { Fmt, Game, Player, Pos } from "./types";

export const FMT_LABEL = ["Standard", "Half-PPR", "PPR"] as const;
export const FMT_KEY = ["std", "half", "ppr"] as const;
const REC_MULT = [0, 0.5, 1];
export const POSITIONS: Pos[] = ["QB", "RB", "WR", "TE"];
export const STARTER_RANK: Record<Pos, number> = { QB: 12, RB: 24, WR: 36, TE: 12 };

export const pts = (g: Game, f: Fmt) => g.s + g.rec * REC_MULT[f];
export const total = (p: Player, f: Fmt) => p.g.reduce((t, g) => t + pts(g, f), 0);
export const ppg = (p: Player, f: Fmt) => (p.g.length ? total(p, f) / p.g.length : 0);
export const fmt1 = (v: number) => v.toFixed(1);
export const parseFmt = (v: string | null | undefined): Fmt => {
  const i = FMT_KEY.indexOf((v ?? "") as (typeof FMT_KEY)[number]);
  return (i < 0 ? 1 : i) as Fmt;
};

/** Where a player's points come from. Positive parts sum with `lost` to the total. */
export interface Anatomy { passYds: number; rushYds: number; recYds: number; tds: number; recs: number; lost: number }
export const ANATOMY_PARTS = [
  { key: "passYds", label: "Passing yards", color: "var(--series-1)" },
  { key: "rushYds", label: "Rushing yards", color: "var(--series-2)" },
  { key: "recYds", label: "Receiving yards", color: "var(--series-3)" },
  { key: "tds", label: "Touchdowns", color: "var(--series-4)" },
  { key: "recs", label: "Receptions", color: "var(--series-5)" },
] as const;

export function anatomy(games: Game[], f: Fmt): Anatomy {
  const a: Anatomy = { passYds: 0, rushYds: 0, recYds: 0, tds: 0, recs: 0, lost: 0 };
  for (const g of games) {
    a.passYds += g.py * 0.04;
    a.rushYds += g.ry * 0.1;
    a.recYds += g.recy * 0.1;
    a.tds += g.ptd * 4 + (g.rtd + g.rectd + g.st) * 6 + g.tp * 2;
    a.recs += g.rec * REC_MULT[f];
    a.lost -= (g.int + g.fl) * 2;
  }
  return a;
}

/** Weekly-finish buckets for the boom/bust meter. */
export function buckets(pos: Pos): { label: string; max: number }[] {
  const n = pos === "QB" || pos === "TE" ? 6 : 12;
  return [
    { label: `Top ${n}`, max: n },
    { label: `${n + 1}–${n * 2}`, max: n * 2 },
    { label: `${n * 2 + 1}–${n * 3}`, max: n * 3 },
    { label: `${n * 3 + 1}+`, max: Infinity },
  ];
}
export function bucketCounts(p: Player, f: Fmt): number[] {
  const b = buckets(p.pos);
  const counts = b.map(() => 0);
  for (const g of p.g) counts[b.findIndex((x) => g.rk[f] <= x.max)]++;
  return counts;
}

const sum = (games: Game[], k: keyof Game) => games.reduce((t, g) => t + (g[k] as number), 0);

/** A short label for how a player earns his points. */
export function archetype(p: Player): string {
  const g = p.g, n = g.length || 1;
  const a = anatomy(g, 1);
  const pos = a.passYds + a.rushYds + a.recYds + a.tds + a.recs || 1;
  const tdShare = a.tds / pos;
  if (p.pos === "QB") {
    const rush = (a.rushYds + sum(g, "rtd") * 6) / pos;
    if (rush >= 0.25) return "Dual Threat";
    if (sum(g, "int") / n >= 1) return "Gunslinger";
    if (sum(g, "py") / n >= 255) return "Volume Passer";
    if (tdShare >= 0.42) return "Touchdown Slinger";
    return "Game Manager";
  }
  if (p.pos === "RB") {
    const car = sum(g, "car");
    if ((a.recYds + a.recs) / pos >= 0.38) return "Pass-Catching Back";
    if (car / n >= 16) return "Workhorse";
    if (tdShare >= 0.4) return "Goal-Line Hammer";
    if (car >= 30 && sum(g, "ry") / car >= 5) return "Big-Play Back";
    return "Committee Back";
  }
  const rec = sum(g, "rec") || 1, ypr = sum(g, "recy") / rec, tgt = sum(g, "tgt") / n;
  if (p.pos === "WR") {
    if (tgt >= 9) return "Target Hog";
    if (ypr >= 15.5) return "Deep Threat";
    if (tdShare >= 0.36) return "Red-Zone Weapon";
    if (rec / n >= 4.5 && ypr < 11.5) return "Chain Mover";
    return "Role Player";
  }
  if (tgt >= 7) return "Focal Point";
  if (tdShare >= 0.38) return "Touchdown Vulture";
  if (ypr >= 12.5) return "Seam Stretcher";
  return "Safety Valve";
}

/** Steadiness from the spread of weekly scores. */
export function volatility(p: Player, f: Fmt): "Steady" | "Streaky" | "Boom-or-bust" | null {
  if (p.g.length < 4) return null;
  const v = p.g.map((g) => pts(g, f)), m = v.reduce((a, b) => a + b, 0) / v.length;
  if (m <= 0) return null;
  const cv = Math.sqrt(v.reduce((t, x) => t + (x - m) ** 2, 0) / v.length) / m;
  return cv < 0.38 ? "Steady" : cv < 0.62 ? "Streaky" : "Boom-or-bust";
}

export const RARITIES = [
  { name: "Legendary", color: "#ffd23f" },
  { name: "Epic", color: "#c79bff" },
  { name: "Rare", color: "#6fb1ff" },
  { name: "Uncommon", color: "#5fd0a5" },
  { name: "Common", color: "#aab8d4" },
] as const;
export function rarity(p: Player, f: Fmt) {
  const k = p.pos === "QB" || p.pos === "TE" ? 0.5 : 1;
  const r = p.rk[f];
  const i = r <= Math.ceil(3 * k) ? 0 : r <= 8 * k ? 1 : r <= 16 * k ? 2 : r <= 30 * k ? 3 : 4;
  return RARITIES[i];
}
