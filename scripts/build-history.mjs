// Builds public/data/history.json: past fantasy seasons used to find "heartbeat twins".
// Run once per offseason: npm run history   (FIRST=2012 LAST=2025 to change the range)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, POSITIONS, download, n, parseCsv, r2 } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/history.json");
const now = new Date();
const LAST = Number(process.env.LAST || (now.getMonth() >= 8 ? now.getFullYear() - 1 : now.getFullYear() - 2));
const FIRST = Number(process.env.FIRST || LAST - 13);
const KEEP = { QB: 32, RB: 60, WR: 80, TE: 32 }; // fantasy-relevant seasons per position per year
const MIN_GAMES = 8;
const REC_MULT = [0, 0.5, 1];

const seasons = [];
for (let yr = FIRST; yr <= LAST; yr++) {
  const rows = parseCsv(await download(`${BASE}/stats_player/stats_player_week_${yr}.csv`))
    .filter((r) => r.season_type === "REG" && POSITIONS.includes(r.position));
  const byId = new Map();
  for (const r of rows) {
    if (!byId.has(r.player_id)) byId.set(r.player_id, { id: r.player_id, name: r.player_display_name, pos: r.position, tm: r.team, yr, w: [], s: [], r: [] });
    const p = byId.get(r.player_id);
    p.w.push(n(r.week)); p.s.push(r2(n(r.fantasy_points))); p.r.push(n(r.receptions)); p.tm = r.team;
  }
  const all = [...byId.values()].map((p) => {
    const order = p.w.map((_, i) => i).sort((a, b) => p.w[a] - p.w[b]);
    return { ...p, w: order.map((i) => p.w[i]), s: order.map((i) => p.s[i]), r: order.map((i) => p.r[i]) };
  });
  let kept = 0;
  for (const pos of POSITIONS) {
    const group = all.filter((p) => p.pos === pos);
    const total = (p, f) => p.s.reduce((t, v, i) => t + v + p.r[i] * REC_MULT[f], 0);
    for (let f = 0; f < 3; f++) [...group].sort((a, b) => total(b, f) - total(a, f)).forEach((p, i) => { (p.rk ||= [0, 0, 0])[f] = i + 1; });
    const best = group.filter((p) => p.w.length >= MIN_GAMES).sort((a, b) => a.rk[1] - b.rk[1]).slice(0, KEEP[pos]);
    seasons.push(...best);
    kept += best.length;
  }
  console.log(`${yr}: kept ${kept} seasons`);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ first: FIRST, last: LAST, seasons }));
console.log(`history.json: ${FIRST}-${LAST}, ${seasons.length} seasons`);
