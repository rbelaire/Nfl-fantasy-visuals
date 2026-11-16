"use client";
import { useEffect, useMemo, useState } from "react";
import type { Player } from "@/lib/types";
import { fmt1, pts } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PosTabs } from "./PosTabs";

const GROUPS = ["Flex", "QB", "RB", "WR", "TE"] as const;
const SHOW = 10, ROW = 40;

export function RaceView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Flex");
  const [week, setWeek] = useState(1);
  const [wantPlay, setPlaying] = useState(false);
  const weeks = data?.week ?? 1;
  const playing = wantPlay && week < weeks;

  // Running totals for everyone in the group, and who is ever in the top ten.
  const field = useMemo(() => {
    if (!data) return [];
    const pool = data.players.filter((p) => (group === "Flex" ? p.pos !== "QB" : p.pos === group));
    const rows = pool.map((p) => {
      let run = 0;
      const cum = Array.from({ length: data.week }, (_, i) => { const g = p.g.find((x) => x.w === i + 1); if (g) run += pts(g, fmt); return run; });
      return { p, cum, rank: [] as number[] };
    });
    for (let w = 0; w < data.week; w++) [...rows].sort((a, b) => b.cum[w] - a.cum[w]).forEach((r, i) => { r.rank[w] = i; });
    return rows.filter((r) => r.rank.some((x) => x < SHOW));
  }, [data, group, fmt]);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setWeek((w) => w + 1), 1100);
    return () => clearTimeout(id);
  }, [playing, week]);

  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;
  const w = Math.min(week, weeks) - 1;
  const lead = Math.max(...field.map((r) => r.cum[w]), 1);
  const play = () => { if (week >= weeks) setWeek(1); setPlaying(true); };

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Season race</h1>
      <p className="max-w-prose text-mute">Total points after each week. Press play and watch the leaders trade places.</p>
      <PosTabs options={GROUPS} value={group} onChange={(g) => { setGroup(g); setPlaying(false); }} label="Position" />
      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => (playing ? setPlaying(false) : play())} className="w-24 rounded-md bg-gold px-4 py-2 font-semibold text-field">
            {playing ? "Pause" : week >= weeks ? "Replay" : "Play"}
          </button>
          <label className="flex min-w-48 flex-1 items-center gap-3">
            <span className="display w-28 whitespace-nowrap text-3xl">Week {w + 1}</span>
            <input type="range" min={1} max={weeks} value={w + 1} onChange={(e) => { setPlaying(false); setWeek(Number(e.target.value)); }} className="flex-1 accent-[var(--color-gold)]" aria-label="Week" />
          </label>
        </div>
        <ol className="relative mt-5" style={{ height: SHOW * ROW }} aria-label={`Top ${SHOW} after week ${w + 1}`}>
          {field.map((r) => <Bar key={r.p.id} p={r.p} rank={r.rank[w]} value={r.cum[w]} lead={lead} />)}
        </ol>
      </div>
    </div>
  );
}

function Bar({ p, rank, value, lead }: { p: Player; rank: number; value: number; lead: number }) {
  const shown = rank < SHOW;
  return (
    <li
      aria-hidden={!shown}
      className="absolute left-0 right-0 flex items-center gap-2 transition-all duration-700 ease-in-out"
      style={{ height: ROW - 6, transform: `translateY(${Math.min(rank, SHOW) * ROW}px)`, opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none" }}
    >
      <span className="stat w-5 text-right text-sm text-dim">{rank + 1}</span>
      <div className="relative h-full flex-1">
        <div className="h-full rounded-r transition-all duration-700 ease-in-out" style={{ width: `${Math.max(2, (value / lead) * 100)}%`, background: team(p.team).color }} />
        <a href={`/player/${p.id}`} className="absolute inset-y-0 left-2 flex items-center truncate font-semibold text-white" style={{ textShadow: "0 1px 2px rgb(0 0 0 / .7)" }}>
          {p.name} <span className="stat ml-2 text-sm font-medium opacity-85">{p.pos} {p.team}</span>
        </a>
      </div>
      <span className="stat w-14 text-right font-semibold">{fmt1(value)}</span>
    </li>
  );
}
