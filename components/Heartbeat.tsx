"use client";
import { useMemo, useState } from "react";
import { useWidth } from "@/lib/useWidth";
import { fmt1 } from "@/lib/scoring";

export interface Beat { w: number; v: number | null; tip?: string }

const niceMax = (v: number) => {
  const step = v > 40 ? 20 : v > 20 ? 10 : 5;
  return Math.max(step * 2, Math.ceil((v + 1) / step) * step);
};

/**
 * A season drawn as an EKG trace: one spike per week, flat when the player sat out.
 * The gold dashed line is the "starter line", the score a startable player averages.
 */
export function Heartbeat({
  beats, line, lineLabel, height = 240, color = "var(--color-chalk)", compact = false, animate = true,
}: { beats: Beat[]; line?: number; lineLabel?: string; height?: number; color?: string; compact?: boolean; animate?: boolean }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = compact ? { t: 10, r: 6, b: 6, l: 6 } : { t: 22, r: 12, b: 26, l: 30 };
  const values = beats.map((b) => b.v ?? 0);
  const top = niceMax(Math.max(...values, line ?? 0));
  const low = Math.min(0, ...values);
  const bottom = low < 0 ? -5 * Math.ceil(-low / 5) : 0;
  const iw = width - m.l - m.r, ih = height - m.t - m.b;
  const step = iw / beats.length;
  const x = (i: number) => m.l + step * (i + 0.5);
  const y = (v: number) => m.t + ih * (1 - (v - bottom) / (top - bottom));
  const y0 = y(0);

  const path = useMemo(() => {
    let d = `M${m.l},${y0}`;
    beats.forEach((b, i) => {
      const cx = x(i);
      if (b.v == null) return;
      const peak = y(b.v), dip = Math.min(7, ih * 0.04);
      d += ` L${cx - step * 0.2},${y0} L${cx - step * 0.1},${y0 + dip * 0.6} L${cx},${peak} L${cx + step * 0.1},${y0 + dip} L${cx + step * 0.2},${y0}`;
    });
    return d + ` L${m.l + iw},${y0}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beats, width, height, top, bottom]);

  const played = beats.map((b, i) => ({ ...b, i })).filter((b) => b.v != null);
  const best = played.reduce((a, b) => (b.v! > (a?.v ?? -99) ? b : a), played[0]);
  const last = played[played.length - 1];
  const labelled = new Set([best?.i, last?.i]);
  const ticks = [];
  for (let t = 0; t <= top; t += top > 40 ? 20 : 10) ticks.push(t);
  const h = hover != null ? beats[hover] : null;

  return (
    <div>
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg
        width={width} height={height} role="img"
        aria-label={`Weekly fantasy points. Best week: ${best ? `${fmt1(best.v!)} in week ${best.w}` : "none"}.`}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - box.left - m.l) / step);
          setHover(i >= 0 && i < beats.length ? i : null);
        }}
        onPointerLeave={() => setHover(null)}
        style={{ touchAction: "pan-y" }}
      >
        {!compact && ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="stat" fontSize={12} fill="var(--color-dim)">{t}</text>
          </g>
        ))}
        {!compact && beats.map((b, i) => (
          <text key={b.w} x={x(i)} y={height - 7} textAnchor="middle" className="stat" fontSize={12} fill={hover === i ? "var(--color-chalk)" : "var(--color-dim)"}>
            {beats.length > 12 && width < 420 && b.w % 2 === 0 ? "" : b.w}
          </text>
        ))}
        {line != null && (
          <g>
            <line x1={m.l} x2={m.l + iw} y1={y(line)} y2={y(line)} stroke="var(--color-gold)" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.85} />
          </g>
        )}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--color-dim)" strokeWidth={1} />}
        <path
          d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
          pathLength={1} className={animate ? "trace" : undefined} style={{ ["--len" as string]: 1 }}
        />
        {played.map((b) => {
          const start = line != null && b.v! >= line;
          return (
            <g key={b.w}>
              <circle
                cx={x(b.i)} cy={y(b.v!)} r={compact ? 3 : hover === b.i ? 5.5 : 4.5}
                fill={start ? "var(--color-gold)" : "var(--surface)"} stroke={start ? "var(--surface)" : color} strokeWidth={2}
              />
              {!compact && labelled.has(b.i) && hover == null && (
                <text x={x(b.i)} y={y(b.v!) - 10} textAnchor="middle" className="stat" fontSize={13} fontWeight={600} fill="var(--color-chalk)">{fmt1(b.v!)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {h && !compact && (
        <div className="tip" style={{ left: Math.min(Math.max(x(hover!), 70), width - 70), top: (h.v != null ? y(Math.max(h.v, 0)) : y0) - 12 }}>
          <div className="text-mute">Week {h.w}{h.tip ? ` ${h.tip}` : ""}</div>
          <div className="stat font-semibold">{h.v != null ? `${fmt1(h.v)} points` : "Did not play"}</div>
        </div>
      )}
    </div>
    {!compact && line != null && lineLabel && (
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mute">
        <li className="flex items-center gap-2">
          <svg width="24" height="4" aria-hidden><line x1="0" x2="24" y1="2" y2="2" stroke="var(--color-gold)" strokeWidth="2" strokeDasharray="5 4" /></svg>
          {lineLabel} ({fmt1(line)})
        </li>
        <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" />Week above the line</li>
      </ul>
    )}
    </div>
  );
}

/** Fills in missed weeks so the trace flatlines where a player sat out. */
export function toBeats(games: { w: number; v: number; tip?: string }[], weeks: number): Beat[] {
  const by = new Map(games.map((g) => [g.w, g]));
  return Array.from({ length: weeks }, (_, i) => {
    const g = by.get(i + 1);
    return { w: i + 1, v: g ? g.v : null, tip: g?.tip };
  });
}
