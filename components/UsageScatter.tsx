"use client";
import { useState } from "react";
import type { Fmt, Player } from "@/lib/types";
import { fmt1, pts } from "@/lib/scoring";
import { useWidth } from "@/lib/useWidth";

/** Touches a player got each week against the points he turned them into. */
export function UsageScatter({ player, fmt }: { player: Player; fmt: Fmt }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const qb = player.pos === "QB";
  const xLabel = qb ? "Pass attempts + carries" : "Targets + carries";
  const dots = player.g.map((g) => ({ w: g.w, opp: g.opp, u: qb ? g.att + g.car : g.tgt + g.car, v: pts(g, fmt) }));
  const height = 230, m = { t: 12, r: 14, b: 40, l: 34 };
  const xMax = Math.max(10, Math.ceil(Math.max(...dots.map((d) => d.u)) / 5) * 5);
  const yMax = Math.max(10, Math.ceil(Math.max(...dots.map((d) => d.v)) / 10) * 10);
  const yMin = Math.min(0, Math.floor(Math.min(...dots.map((d) => d.v)) / 5) * 5);
  const iw = width - m.l - m.r, ih = height - m.t - m.b;
  const x = (u: number) => m.l + (u / xMax) * iw;
  const y = (v: number) => m.t + ih * (1 - (v - yMin) / (yMax - yMin));
  const xt = Array.from({ length: 5 }, (_, i) => Math.round((xMax / 4) * i));
  const yt = []; for (let t = 0; t <= yMax; t += yMax > 30 ? 20 : 10) yt.push(t);
  const h = hover != null ? dots[hover] : null;
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`${xLabel} against fantasy points, one dot per week`}>
        {yt.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="stat" fontSize={12} fill="var(--color-dim)">{t}</text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={t} x={x(t)} y={m.t + ih + 16} textAnchor="middle" className="stat" fontSize={12} fill="var(--color-dim)">{t}</text>
        ))}
        <text x={m.l + iw / 2} y={height - 4} textAnchor="middle" fontSize={12} fill="var(--color-mute)">{xLabel}</text>
        {dots.map((d, i) => (
          <g key={d.w} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <circle cx={x(d.u)} cy={y(d.v)} r={14} fill="transparent" />
            <circle cx={x(d.u)} cy={y(d.v)} r={hover === i ? 7 : 5.5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        ))}
      </svg>
      {h && (
        <div className="tip" style={{ left: Math.min(Math.max(x(h.u), 80), width - 80), top: y(h.v) - 12 }}>
          <div className="text-mute">Week {h.w} vs {h.opp}</div>
          <div className="stat font-semibold">{h.u} touches, {fmt1(h.v)} points</div>
        </div>
      )}
    </div>
  );
}
