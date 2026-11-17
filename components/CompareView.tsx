"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Fmt, Player, Season } from "@/lib/types";
import { FMT_KEY, archetype, buckets, bucketCounts, fmt1, ppg, pts, total } from "@/lib/scoring";
import { ShareBar } from "./ShareBar";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useWidth } from "@/lib/useWidth";
import { useFmt } from "./Scoring";
import { PlayerSearch } from "./PlayerSearch";
import { Jersey } from "./Jersey";
import { Anatomy } from "./Anatomy";
import { Section } from "./PlayerView";

const COLORS = ["var(--series-1)", "var(--series-2)"];

function Corner({ p, side, onChange, other }: { p: Player; side: 0 | 1; onChange: (p: Player) => void; other: string }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`min-w-0 flex-1 ${side ? "text-right" : ""}`}>
      <div className={`flex flex-col gap-2 sm:items-center sm:gap-3 ${side ? "items-end sm:flex-row-reverse" : "items-start sm:flex-row"}`}>
        <Jersey abbr={p.team} num={p.num} size={48} />
        <div className="min-w-0">
          <Link href={`/player/${p.id}`} className="display block break-words text-2xl hover:underline sm:text-4xl">{p.name}</Link>
          <div className="text-sm text-mute">{p.pos}, {team(p.team).name}</div>
        </div>
      </div>
      <div className={`mt-2 flex items-center gap-2 text-sm ${side ? "flex-row-reverse" : ""}`}>
        <span className="inline-block h-1 w-6 rounded" style={{ background: COLORS[side] }} />
        <span className="text-mute">{archetype(p)}</span>
      </div>
      <div className="mt-2">
        {editing
          ? <PlayerSearch placeholder="Swap in a player" exclude={[other]} onPick={(n) => { setEditing(false); onChange(n); }} />
          : <button type="button" onClick={() => setEditing(true)} className="rounded border border-rule px-2.5 py-1 text-sm font-medium text-mute hover:text-chalk">Change player</button>}
      </div>
    </div>
  );
}

function Tape({ a, b, fmt, line }: { a: Player; b: Player; fmt: Fmt; line: Season["line"] }) {
  const stat = (p: Player) => {
    const v = p.g.map((g) => pts(g, fmt));
    const tds = p.g.reduce((t, g) => t + g.ptd + g.rtd + g.rectd, 0);
    const touches = p.g.reduce((t, g) => t + (p.pos === "QB" ? g.att : g.tgt) + g.car, 0) / (p.g.length || 1);
    return [total(p, fmt), ppg(p, fmt), Math.max(...v), Math.min(...v), v.filter((x) => x >= line[p.pos][fmt]).length, bucketCounts(p, fmt)[0], tds, touches];
  };
  const labels = ["Total points", "Points per game", "Best week", "Worst week", "Startable weeks", `${buckets(a.pos)[0].label} finishes`, "Touchdowns", "Touches per game"];
  const whole = [false, false, false, false, true, true, true, false];
  const A = stat(a), B = stat(b);
  return (
    <div className="space-y-3">
      {labels.map((label, i) => {
        const max = Math.max(Math.abs(A[i]), Math.abs(B[i]), 0.1);
        const show = (v: number) => (whole[i] ? String(v) : fmt1(v));
        const cell = (v: number, side: 0 | 1, wins: boolean) => (
          <div className={`flex flex-1 items-center gap-2 ${side ? "" : "flex-row-reverse"}`}>
            <div className={`flex h-2.5 flex-1 ${side ? "" : "justify-end"}`}>
              <div className="h-full rounded-sm" style={{ width: `${(Math.max(v, 0) / max) * 100}%`, background: COLORS[side], opacity: wins ? 1 : 0.45 }} />
            </div>
            <span className={`stat w-12 text-base ${side ? "text-left" : "text-right"} ${wins ? "font-semibold text-chalk" : "text-mute"}`}>{show(v)}</span>
          </div>
        );
        return (
          <div key={label}>
            <div className="text-center text-sm text-mute">{label}</div>
            <div className="flex items-center gap-1">
              {cell(A[i], 0, A[i] >= B[i])}
              {cell(B[i], 1, B[i] >= A[i])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyLines({ a, b, fmt, weeks }: { a: Player; b: Player; fmt: Fmt; weeks: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 250, m = { t: 14, r: 14, b: 26, l: 30 };
  const series = [a, b].map((p) => Array.from({ length: weeks }, (_, i) => { const g = p.g.find((x) => x.w === i + 1); return g ? pts(g, fmt) : null; }));
  const all = series.flat().filter((v): v is number => v != null);
  const top = Math.max(10, Math.ceil((Math.max(...all) + 1) / 10) * 10), low = Math.min(0, Math.floor(Math.min(...all) / 5) * 5);
  const iw = width - m.l - m.r, ih = height - m.t - m.b, step = iw / weeks;
  const x = (i: number) => m.l + step * (i + 0.5), y = (v: number) => m.t + ih * (1 - (v - low) / (top - low));
  const ticks = []; for (let t = 0; t <= top; t += top > 40 ? 20 : 10) ticks.push(t);
  const path = (s: (number | null)[]) => s.reduce((d, v, i) => (v == null ? d : d + `${d && s[i - 1] != null ? "L" : "M"}${x(i)},${y(v)} `), "");
  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {[a, b].map((p, i) => (
          <li key={p.id} className="flex items-center gap-2"><span className="inline-block h-1 w-6 rounded" style={{ background: COLORS[i] }} />{p.name}</li>
        ))}
      </ul>
      <div ref={ref} className="relative w-full" style={{ height }}>
        <svg
          width={width} height={height} role="img" aria-label={`Weekly points for ${a.name} and ${b.name}`} style={{ touchAction: "pan-y" }}
          onPointerMove={(e) => { const i = Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left - m.l) / step); setHover(i >= 0 && i < weeks ? i : null); }}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="stat" fontSize={12} fill="var(--color-dim)">{t}</text>
            </g>
          ))}
          {Array.from({ length: weeks }, (_, i) => (
            <text key={i} x={x(i)} y={height - 7} textAnchor="middle" className="stat" fontSize={12} fill="var(--color-dim)">{weeks > 12 && width < 420 && i % 2 ? "" : i + 1}</text>
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--color-dim)" />}
          {series.map((s, k) => (
            <g key={k}>
              <path d={path(s)} fill="none" stroke={COLORS[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.map((v, i) => v != null && <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5.5 : 4} fill={COLORS[k]} stroke="var(--surface)" strokeWidth={2} />)}
            </g>
          ))}
        </svg>
        {hover != null && (
          <div className="tip" style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: m.t + 4, transform: "translate(-50%, 0)" }}>
            <div className="text-mute">Week {hover + 1}</div>
            {[a, b].map((p, k) => (
              <div key={p.id} className="stat flex items-center gap-2">
                <span className="inline-block h-1 w-4 rounded" style={{ background: COLORS[k] }} />
                {p.name.split(" ").slice(-1)[0]}: <span className="font-semibold">{series[k][hover] != null ? fmt1(series[k][hover]!) : "did not play"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const params = useSearchParams();
  const router = useRouter();
  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;

  const find = (id: string | null) => data.players.find((p) => p.id === id);
  const ranked = [...data.players].filter((p) => p.pos !== "QB").sort((x, y) => total(y, fmt) - total(x, fmt));
  const a = find(params.get("a")) ?? ranked[0];
  const b = find(params.get("b")) ?? ranked.find((p) => p.id !== a.id && p.pos === a.pos) ?? ranked[1];
  const go = (na: Player, nb: Player) => router.replace(`/compare?a=${na.id}&b=${nb.id}`, { scroll: false });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl sm:text-6xl">Tale of the tape</h1>
        <ShareBar image={`/api/og/compare?a=${a.id}&b=${b.id}&s=${FMT_KEY[fmt]}`} file={`${a.name}-vs-${b.name}.png`.replace(/[^A-Za-z.]+/g, "-").toLowerCase()} />
      </div>
      <div className="panel flex items-start gap-3 p-4 sm:gap-6 sm:p-5">
        <Corner p={a} side={0} other={b.id} onChange={(n) => go(n, b)} />
        <span className="display pt-3 text-2xl text-dim">vs</span>
        <Corner p={b} side={1} other={a.id} onChange={(n) => go(a, n)} />
      </div>
      <Section title="Head to head" note={a.pos !== b.pos ? "These two play different positions, so finishes and starter lines are measured against their own position." : undefined}>
        <Tape a={a} b={b} fmt={fmt} line={data.line} />
      </Section>
      <Section title="Week by week">
        <WeeklyLines a={a} b={b} fmt={fmt} weeks={data.week} />
      </Section>
      <Section title="Where the points come from">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[a, b].map((p) => (
            <div key={p.id}>
              <h3 className="mb-2 text-xl">{p.name}</h3>
              <Anatomy games={p.g} fmt={fmt} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
