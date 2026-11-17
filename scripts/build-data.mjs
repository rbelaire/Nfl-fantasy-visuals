// Builds public/data/season.json from nflverse weekly player stats, snap counts and the schedule.
// Source: https://github.com/nflverse/nflverse-data (free, open data).
// Run: npm run data   (SEASON=2025 npm run data for another year)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, POSITIONS, download, n, parseCsv, r2 } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/season.json");
const now = new Date();
const guessSeason = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
const SEASON = Number(process.env.SEASON || guessSeason);
const STARTER_RANK = { QB: 12, RB: 24, WR: 36, TE: 12 };
const REC_MULT = [0, 0.5, 1]; // standard, half-PPR, PPR

async function main() {
  const [statsCsv, playersCsv, snapsCsv, gamesCsv] = await Promise.all([
    download(`${BASE}/stats_player/stats_player_week_${SEASON}.csv`),
    download(`${BASE}/players/players.csv`),
    download(`${BASE}/snap_counts/snap_counts_${SEASON}.csv`).catch(() => ""),
    download(`${BASE}/schedules/games.csv`).catch(() => ""),
  ]);
  // Sleeper player ids, so a visitor's Sleeper league can be matched to these players.
  let sleeperIds = new Map();
  try {
    const ids = parseCsv(await download("https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv"));
    sleeperIds = new Map(ids.filter((x) => x.gsis_id && x.gsis_id !== "NA" && x.sleeper_id && x.sleeper_id !== "NA").map((x) => [x.gsis_id, x.sleeper_id]));
  } catch {
    if (existsSync(OUT)) for (const p of JSON.parse(readFileSync(OUT, "utf8")).players) if (p.sl) sleeperIds.set(p.id, p.sl);
    console.warn("Sleeper id list unavailable; reusing ids from the existing snapshot.");
  }
  const people = parseCsv(playersCsv);
  const bio = new Map(people.map((p) => [p.gsis_id, p]));
  // Snap counts use Pro Football Reference ids; map them to the stats ids.
  const pfrToGsis = new Map(people.filter((p) => p.pfr_id && p.gsis_id).map((p) => [p.pfr_id, p.gsis_id]));
  const snaps = new Map();
  if (snapsCsv) {
    for (const r of parseCsv(snapsCsv)) {
      if (r.game_type !== "REG" || !POSITIONS.includes(r.position)) continue;
      const id = pfrToGsis.get(r.pfr_player_id);
      if (id) snaps.set(`${id}|${n(r.week)}`, Math.round(n(r.offense_pct) * 100));
    }
  }
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
      sn: snaps.get(`${r.player_id}|${n(r.week)}`) ?? null,
    };
    if (!byId.has(r.player_id)) byId.set(r.player_id, { id: r.player_id, name: r.player_display_name, pos: r.position, g: [] });
    byId.get(r.player_id).g.push(g);
  }

  const week = Math.max(...rows.map((r) => n(r.week)));

  // Fantasy points each defense allowed to each position, per week: [standard points, receptions].
  const teams = [...new Set(rows.map((r) => r.team))].sort();
  const defense = Object.fromEntries(teams.map((t) => [t, Object.fromEntries(POSITIONS.map((p) => [p, Array(week).fill(null)]))]));
  for (const r of rows) {
    const cell = defense[r.opponent_team]?.[r.position];
    if (!cell) continue;
    const w = n(r.week) - 1;
    const c = (cell[w] ||= [0, 0]);
    c[0] = r2(c[0] + n(r.fantasy_points));
    c[1] += n(r.receptions);
  }

  // Next week's opponents ("@" marks a road game); teams missing from the list are on bye.
  let next = null;
  if (gamesCsv) {
    const games = parseCsv(gamesCsv).filter((g) => n(g.season) === SEASON && g.game_type === "REG" && n(g.week) === week + 1);
    if (games.length) {
      const opp = {};
      for (const g of games) { opp[g.home_team] = g.away_team; opp[g.away_team] = `@${g.home_team}`; }
      next = { week: week + 1, opp };
    }
  }
  let players = [...byId.values()].map((p) => {
    p.g.sort((a, b) => a.w - b.w);
    const b = bio.get(p.id) || {};
    return {
      id: p.id, name: p.name, pos: p.pos, team: p.g[p.g.length - 1].tm,
      num: b.jersey_number ? Number(b.jersey_number) : null,
      sl: sleeperIds.get(p.id) ?? null,
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
  const out = { season: SEASON, week, updated: new Date().toISOString().slice(0, 10), line, defense, next, players };
  if (existsSync(OUT)) {
    // Leave the file untouched when the stats have not changed, so scheduled refreshes only commit real updates.
    const old = JSON.parse(readFileSync(OUT, "utf8"));
    if (JSON.stringify({ ...old, updated: "" }) === JSON.stringify({ ...out, updated: "" })) {
      console.log(`season.json is already current: ${SEASON} through week ${week}`);
      return;
    }
  }
  writeFileSync(OUT, JSON.stringify(out));
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
