"use client";
import type { Fmt, Game } from "@/lib/types";
import { ANATOMY_PARTS, anatomy, fmt1 } from "@/lib/scoring";

/** A single stacked bar showing where the points come from. */
export function Anatomy({ games, fmt, showLegend = true }: { games: Game[]; fmt: Fmt; showLegend?: boolean }) {
  const a = anatomy(games, fmt);
  const parts = ANATOMY_PARTS.map((p) => ({ ...p, v: Math.max(0, a[p.key]) })).filter((p) => p.v > 0.05);
  const sum = parts.reduce((t, p) => t + p.v, 0) || 1;
  return (
    <div>
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.v / sum) * 100)}%`).join(", ")}>
        {parts.map((p) => (
          <div key={p.key} title={`${p.label}: ${fmt1(p.v)} points (${Math.round((p.v / sum) * 100)}%)`} style={{ width: `${(p.v / sum) * 100}%`, background: p.color }} />
        ))}
      </div>
      {showLegend && (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {parts.map((p) => (
              <tr key={p.key}>
                <td className="py-0.5 text-mute">
                  <span className="mr-2 inline-block h-3 w-3 rounded-sm align-[-1px]" style={{ background: p.color }} />
                  {p.label}
                </td>
                <td className="stat py-0.5 text-right font-semibold">{fmt1(p.v)}</td>
                <td className="stat w-14 py-0.5 text-right text-mute">{Math.round((p.v / sum) * 100)}%</td>
              </tr>
            ))}
            {a.lost < 0 && (
              <tr>
                <td className="py-0.5 text-mute"><span className="mr-2 inline-block h-3 w-3 rounded-sm border border-dim align-[-1px]" />Lost to turnovers</td>
                <td className="stat py-0.5 text-right font-semibold">−{fmt1(-a.lost)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
