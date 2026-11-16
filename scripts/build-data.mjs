// Builds public/data/season.json from nflverse weekly player stats.
// Source: https://github.com/nflverse/nflverse-data (free, open data).
// Run: npm run data   (SEASON=2025 npm run data for another year)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/season.json");
const BASE = "https://github.com/nflverse/nflverse-data/releases/download";
const now = new Date();
const guessSeason = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
const SEASON = Number(process.env.SEASON || guessSeason);
const POSITIONS = ["QB", "RB", "WR", "TE"];
const STARTER_RANK = { QB: 12, RB: 24, WR: 36, TE: 12 };
const REC_MULT = [0, 0.5, 1]; // standard, half-PPR, PPR

async function download(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    // Some environments only allow traffic through a proxy that curl knows about.
    try {
      return execFileSync("curl", ["-sfL", url], { encoding: "utf8", maxBuffer: 1 << 28 });
    } catch {
      throw new Error(`Could not download ${url}: ${err.message}`);
    }
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const n = (v) => (v === "" || v === "NA" || v == null ? 0 : Number(v));
const r2 = (v) => Math.round(v * 100) / 100;

async function main() {
  const [statsCsv, playersCsv] = await Promise.all([
    download(`${BASE}/stats_player/stats_player_week_${SEASON}.csv`),
    download(`${BASE}/players/players.csv`),
  ]);
  const bio = new Map(parseCsv(playersCsv).map((p) => [p.gsis_id, p]));
  const rows = parseCsv(statsCsv).filter((r) => r.season_type === "REG" && POSITIONS.includes(r.position));
  if (!rows.length) throw new Error(`No regular-season rows for ${SEASON}`);

  const byId = new Map();
  for (const r of rows) {
    const g = {
      w: n(r.week), opp: r.opponent_team, tm: r.team,
      s: r2(n(r.fantasy_points)), rec: n(r.receptions), tgt: n(r.targets), car: n(r.carries),
      cmp: n(r.completions), att: n(r.attempts), py: n(r.passing_yards), ptd: n(r.passing_tds), int: n(r.passing_interceptions),
      ry: n(r.rushing_yards), rtd: n(r.rushing_tds), recy: n(r.receiving_yards), rectd: n(r.receiving_tds),
      fl: n(r.sack_fumbles_lost) + n(r.rushing_fumbles_lost) + n(r.receiving_fumbles_lost),
      tp: n(r.passing_2pt_conversions) + n(r.rushing_2pt_conversions) + n(r.receiving_2pt_conversions),
      st: n(r.special_teams_tds),
    };
    if (!byId.has(r.player_id)) byId.set(r.player_id, { id: r.player_id, name: r.player_display_name, pos: r.position, g: [] });
    byId.get(r.player_id).g.push(g);
  }

  const week = Math.max(...rows.map((r) => n(r.week)));
  let players = [...byId.values()].map((p) => {
    p.g.sort((a, b) => a.w - b.w);
    const b = bio.get(p.id) || {};
    return {
      id: p.id, name: p.name, pos: p.pos, team: p.g[p.g.length - 1].tm,
      num: b.jersey_number ? Number(b.jersey_number) : null,
      college: b.college_name ? b.college_name.split(";")[0].trim() : null,
      exp: b.rookie_season ? SEASON - Number(b.rookie_season) : null,
      g: p.g.map((g) => ({ ...g, tm: undefined })),
    };
  });
  // Keep anyone who has actually mattered for fantasy this season.
  players = players.filter((p) => p.g.reduce((t, g) => t + g.s + g.rec, 0) >= 10);

  const pts = (g, f) => g.s + g.rec * REC_MULT[f];
  // Weekly positional finish, for each scoring format.
  const line = {};
  for (const pos of POSITIONS) {
    const group = players.filter((p) => p.pos === pos);
    line[pos] = [0, 0, 0];
    for (let f = 0; f < 3; f++) {
      let sum = 0, weeks = 0;
      for (let w = 1; w <= week; w++) {
        const games = group.flatMap((p) => p.g.filter((g) => g.w === w)).sort((a, b) => pts(b, f) - pts(a, f));
        games.forEach((g, i) => { (g.rk ||= [0, 0, 0])[f] = i + 1; });
        const cut = games[STARTER_RANK[pos] - 1];
        if (cut) { sum += pts(cut, f); weeks++; }
      }
      line[pos][f] = weeks ? r2(sum / weeks) : 0;
      // Season rank at the position by total points.
      const total = (p) => p.g.reduce((t, g) => t + pts(g, f), 0);
      [...group].sort((a, b) => total(b) - total(a)).forEach((p, i) => { (p.rk ||= [0, 0, 0])[f] = i + 1; });
    }
  }
  players.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(dirname(OUT), { recursive: true });
  const next = { season: SEASON, week, updated: new Date().toISOString().slice(0, 10), line, players };
  if (existsSync(OUT)) {
    // Leave the file untouched when the stats have not changed, so scheduled refreshes only commit real updates.
    const old = JSON.parse(readFileSync(OUT, "utf8"));
    if (JSON.stringify({ ...old, updated: "" }) === JSON.stringify({ ...next, updated: "" })) {
      console.log(`season.json is already current: ${SEASON} through week ${week}`);
      return;
    }
  }
  writeFileSync(OUT, JSON.stringify(next));
  console.log(`season.json: ${SEASON} through week ${week}, ${players.length} players`);
}

main().catch((err) => {
  if (existsSync(OUT)) {
    const old = JSON.parse(readFileSync(OUT, "utf8"));
    console.warn(`Data refresh failed (${err.message}). Keeping the existing snapshot: ${old.season} week ${old.week}.`);
  } else {
    console.error(err);
    process.exit(1);
  }
});
