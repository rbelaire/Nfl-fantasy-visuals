export type Pos = "QB" | "RB" | "WR" | "TE";
/** 0 = standard, 1 = half-PPR, 2 = PPR */
export type Fmt = 0 | 1 | 2;

export interface Game {
  w: number; opp: string;
  /** standard-scoring points; add receptions × multiplier for PPR formats */
  s: number; rec: number; tgt: number; car: number;
  cmp: number; att: number; py: number; ptd: number; int: number;
  ry: number; rtd: number; recy: number; rectd: number;
  fl: number; tp: number; st: number;
  /** share of the team's offensive snaps, 0-100 */
  sn: number | null;
  /** positional finish that week, per scoring format */
  rk: [number, number, number];
}

export interface Player {
  id: string; name: string; pos: Pos; team: string;
  num: number | null; college: string | null; exp: number | null;
  g: Game[];
  /** season positional rank by total points, per scoring format */
  rk: [number, number, number];
}

export interface Season {
  season: number; week: number; updated: string;
  /** average weekly score of the last startable player at each position */
  line: Record<Pos, [number, number, number]>;
  /** points each defense allowed to each position, per week: [standard points, receptions] or null on a bye */
  defense: Record<string, Record<Pos, ([number, number] | null)[]>>;
  /** next week's opponents; "@" marks a road game, a missing team is on bye */
  next: { week: number; opp: Record<string, string> } | null;
  players: Player[];
}

/** A past season used to find heartbeat twins. Arrays are per game, in order. */
export interface PastSeason {
  id: string; name: string; pos: Pos; tm: string; yr: number;
  w: number[]; s: number[]; r: number[];
  rk: [number, number, number];
}
export interface History { first: number; last: number; seasons: PastSeason[] }
