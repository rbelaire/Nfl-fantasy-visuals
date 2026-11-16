"use client";
import type { Fmt, Player } from "@/lib/types";
import { bucketCounts, buckets, fmt1, pts } from "@/lib/scoring";

const RAMP = ["var(--ramp-1)", "var(--ramp-2)", "var(--ramp-3)", "var(--ramp-4)"];
const INK = ["#0b1730", "#0b1730", "#0b1730", "#eef2f9"];

/** One tile per week, shaded by where the player finished at his position that week. */
export function BoomBust({ player, fmt, weeks }: { player: Player; fmt: Fmt; weeks: number }) {
  const b = buckets(player.pos);
  const counts = bucketCounts(player, fmt);
  const byWeek = new Map(player.g.map((g) => [g.w, g]));
  return (
    <div>
      <div className="grid grid-cols-6 gap-[3px] sm:grid-cols-9">
        {Array.from({ length: weeks }, (_, i) => {
          const g = byWeek.get(i + 1);
          const k = g ? b.findIndex((x) => g.rk[fmt] <= x.max) : -1;
          return (
            <div
              key={i}
              title={g ? `Week ${g.w}: ${player.pos}${g.rk[fmt]}, ${fmt1(pts(g, fmt))} points` : `Week ${i + 1}: did not play`}
              className="stat flex h-12 flex-col items-center justify-center rounded text-xs leading-tight"
              style={g ? { background: RAMP[k], color: INK[k] } : { border: "1px dashed var(--color-rule)", color: "var(--color-dim)" }}
            >
              <span className="opacity-75">Wk {i + 1}</span>
              <span className="text-sm font-semibold">{g ? `${player.pos}${g.rk[fmt]}` : "–"}</span>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mute">
        {b.map((x, i) => (
          <li key={x.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: RAMP[i] }} />
            {x.label} finish: <span className="stat font-semibold text-chalk">{counts[i]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
