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
  players: Player[];
}
