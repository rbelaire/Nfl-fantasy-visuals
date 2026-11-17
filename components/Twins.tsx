"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Fmt, Player } from "@/lib/types";
import { fmt1, pts } from "@/lib/scoring";
import { findTwins } from "@/lib/twins";
import { team } from "@/lib/teams";
import { useHistory } from "@/lib/useHistory";
import { useWidth } from "@/lib/useWidth";

/**
 * Heartbeat twins: the past seasons whose opening stretch looked most like this one,
 * drawn through to the end so you can see where seasons like this tend to go.
 */
export function Twins({ player, fmt, known }: { player: Player; fmt: Fmt; known: Set<string> }) {
  const { data, error } = useHistory();
  const twins = useMemo(() => (data ? findTwins(player, data.seasons, fmt) : []), [data, player, fmt]);
  const k = player.g.length;

  if (error) return <p className="text-mute">Past seasons did not load. Refresh the page to try again.</p>;
  if (!data) return <p className="text-mute">Searching past seasons…</p>;
  if (k < 3) return <p className="text-mute">Twins appear once a player has three games this season.</p>;
  if (!twins.length) return <p className="text-mute">No past {player.pos} season started quite like this one.</p>;

  const early = twins.reduce((t, x) => t + x.early, 0) / twins.length;
  const rest = twins.reduce((t, x) => t + x.rest, 0) / twins.length;
  const up = rest >= early;
  return (
    <div>
      <p className="max-w-prose">
        The five {player.pos} seasons since {data.first} that started most like this one averaged{" "}
        <span className="stat font-semibold">{fmt1(early)}</span> points a game over their first {k} games, then{" "}
        <span className="stat font-semibold">{fmt1(rest)}</span> the rest of the way.{" "}
        {Math.abs(rest - early) < 1 ? "Seasons like this mostly held steady." : up ? "Seasons like this tended to get better." : "Seasons like this tended to cool off."}
      </p>
      <TwinChart values={player.g.map((g) => pts(g, fmt))} twins={twins.map((t) => t.values)} />
      <ul className="mt-4 divide-y divide-rule/60">
        {twins.map((t) => {
          const s = t.season;
          const name = known.has(s.id) ? <Link href={`/player/${s.id}`} className="hover:underline">{s.name}</Link> : s.name;
          return (
            <li key={`${s.id}-${s.yr}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 py-2">
              <span className="min-w-0 flex-1 font-medium">
                {name} <span className="font-normal text-mute">{s.yr}, {team(s.tm).name}</span>
              </span>
              <span className="stat text-sm text-mute">
                Start {fmt1(t.early)}, rest {fmt1(t.rest)}, finished <span className="font-semibold text-chalk">{s.pos}{s.rk[fmt]}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-dim">Matched game by game on the first {k} games, counting both the order of the scores and how spread out they were. Past results, not a forecast.</p>
    </div>
  );
}

function TwinChart({ values, twins }: { values: number[]; twins: number[][] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const games = Math.max(values.length, ...twins.map((t) => t.length));
  const avg = Array.from({ length: games }, (_, i) => {
    const v = twins.map((t) => t[i]).filter((x) => x != null);
    return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
  });
  const all = [...values, ...twins.flat()];
  const top = Math.max(10, Math.ceil((Math.max(...all) + 1) / 10) * 10), low = Math.min(0, Math.floor(Math.min(...all) / 5) * 5);
  const height = 250, m = { t: 14, r: 14, b: 26, l: 30 };
  const iw = width - m.l - m.r, ih = height - m.t - m.b, step = iw / games;
  const x = (i: number) => m.l + step * (i + 0.5), y = (v: number) => m.t + ih * (1 - (v - low) / (top - low));
  const path = (s: (number | null)[]) => s.reduce<string>((d, v, i) => (v == null ? d : d + `${d && s[i - 1] != null ? "L" : "M"}${x(i)},${y(v)} `), "");
  const ticks: number[] = []; for (let t = 0; t <= top; t += top > 40 ? 20 : 10) ticks.push(t);
  const k = values.length;
  return (
    <div className="mt-4">
      <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mute">
        <li className="flex items-center gap-2"><span className="inline-block h-1 w-6 rounded bg-gold" />This season</li>
        <li className="flex items-center gap-2"><span className="inline-block h-1 w-6 rounded bg-[var(--series-1)]" />Twin average</li>
        <li className="flex items-center gap-2"><span className="inline-block h-px w-6 bg-mute" />Each twin</li>
      </ul>
      <div ref={ref} className="relative w-full" style={{ height }}>
        <svg
          width={width} height={height} role="img" aria-label="This season's points per game against its five closest past seasons" style={{ touchAction: "pan-y" }}
          onPointerMove={(e) => { const i = Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left - m.l) / step); setHover(i >= 0 && i < games ? i : null); }}
          onPointerLeave={() => setHover(null)}
        >
          <rect x={m.l + step * k} y={m.t} width={iw - step * k} height={ih} fill="rgb(238 242 249 / 0.03)" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="stat" fontSize={12} fill="var(--color-dim)">{t}</text>
            </g>
          ))}
          {Array.from({ length: games }, (_, i) => (
            <text key={i} x={x(i)} y={height - 7} textAnchor="middle" className="stat" fontSize={12} fill="var(--color-dim)">{width < 420 && i % 2 ? "" : i + 1}</text>
          ))}
          <line x1={m.l + step * k} x2={m.l + step * k} y1={m.t} y2={m.t + ih} stroke="var(--color-dim)" strokeDasharray="3 4" />
          <text x={m.l + step * k + 6} y={m.t + 12} fontSize={12} fill="var(--color-mute)">Rest of season</text>
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--color-dim)" />}
          {twins.map((t, i) => <path key={i} d={path(t)} fill="none" stroke="var(--color-mute)" strokeOpacity={0.35} strokeWidth={1.25} />)}
          <path d={path(avg)} fill="none" stroke="var(--series-1)" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={path(values)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} strokeLinejoin="round" />
          {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5.5 : 4} fill="var(--color-gold)" stroke="var(--surface)" strokeWidth={2} />)}
        </svg>
        {hover != null && (
          <div className="tip" style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: m.t + 4, transform: "translate(-50%, 0)" }}>
            <div className="text-mute">Game {hover + 1}</div>
            {values[hover] != null && <div className="stat">This season: <span className="font-semibold">{fmt1(values[hover])}</span></div>}
            {avg[hover] != null && <div className="stat">Twin average: <span className="font-semibold">{fmt1(avg[hover]!)}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}
