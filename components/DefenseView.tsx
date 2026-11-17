"use client";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Pos } from "@/lib/types";
import { FMT_KEY, POSITIONS, defenseTable, fmt1 } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PosTabs } from "./PosTabs";
import { ShareBar } from "./ShareBar";

// One-hue ramp, dark to light: on the navy field, brighter means more points allowed.
const RAMP = ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"];
const INK = ["#eef2f9", "#eef2f9", "#0b1730", "#0b1730", "#0b1730", "#0b1730"];
const POS_NAME: Record<Pos, string> = { QB: "quarterbacks", RB: "running backs", WR: "receivers", TE: "tight ends" };

export function DefenseView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const params = useSearchParams();
  const router = useRouter();
  const pos = (POSITIONS.includes(params.get("pos") as Pos) ? params.get("pos") : "WR") as Pos;
  const rows = useMemo(() => (data ? defenseTable(data.defense, pos, fmt) : []), [data, pos, fmt]);
  const breaks = useMemo(() => {
    const all = rows.flatMap((r) => r.vals).filter((v): v is number => v != null).sort((a, b) => a - b);
    return [1, 2, 3, 4, 5].map((i) => all[Math.floor((all.length * i) / 6)] ?? 0);
  }, [rows]);
  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading defenses…"}</p>;

  const bin = (v: number) => breaks.findIndex((b) => v < b) === -1 ? 5 : breaks.findIndex((b) => v < b);
  const avgBin = (v: number) => bin(v);
  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Points allowed by defense</h1>
      <p className="max-w-prose text-mute">
        Fantasy points each defense gave up to {POS_NAME[pos]}, week by week. Most generous at the top. The last column shows who they face next, so you can spot the soft matchups coming.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PosTabs options={POSITIONS} value={pos} onChange={(p) => router.replace(`/defense?pos=${p}`, { scroll: false })} label="Position" />
        <ShareBar image={`/api/og/defense?pos=${pos}&s=${FMT_KEY[fmt]}`} file={`points-allowed-${pos.toLowerCase()}-week-${data.week}.png`} />
      </div>
      <div className="panel overflow-x-auto p-3">
        <table className="stat w-full border-separate border-spacing-[2px] text-sm">
          <thead>
            <tr className="text-mute">
              <th className="sticky left-0 z-10 bg-panel px-2 py-1 text-left font-medium">Defense</th>
              {Array.from({ length: data.week }, (_, i) => <th key={i} className="min-w-10 px-1 py-1 font-medium">Wk {i + 1}</th>)}
              <th className="min-w-14 px-1 py-1 font-medium">Avg</th>
              {data.next && <th className="min-w-16 px-1 py-1 font-medium">Wk {data.next.week}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const opp = data.next?.opp[r.team];
              return (
                <tr key={r.team}>
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-panel px-2 py-1 text-left font-semibold" title={team(r.team).name}>
                    <span className="mr-1.5 inline-block w-5 text-right text-xs font-normal text-dim">{r.rank}</span>{r.team}
                  </th>
                  {r.vals.map((v, i) => (
                    <td
                      key={i}
                      title={v == null ? `${team(r.team).name}, week ${i + 1}: bye` : `${team(r.team).name} allowed ${fmt1(v)} to ${pos}s in week ${i + 1}`}
                      className="h-8 rounded text-center"
                      style={v == null ? { border: "1px dashed var(--color-rule)", color: "var(--color-dim)" } : { background: RAMP[bin(v)], color: INK[bin(v)] }}
                    >
                      {v == null ? "–" : Math.round(v)}
                    </td>
                  ))}
                  <td className="rounded text-center font-semibold" style={{ background: RAMP[avgBin(r.avg)], color: INK[avgBin(r.avg)] }}>{fmt1(r.avg)}</td>
                  {data.next && (
                    <td className="px-1 text-center text-mute" title={opp ? `${team(r.team).name} ${opp.startsWith("@") ? "visit" : "host"} ${team(opp.replace("@", "")).name}` : "Bye"}>
                      {opp ? `${opp.startsWith("@") ? "at" : "vs"} ${opp.replace("@", "")}` : "Bye"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-mute">
        <span>Fewer points</span>
        <div className="flex gap-[2px]">
          {RAMP.map((c, i) => (
            <span key={c} className="stat flex h-6 w-11 items-center justify-center rounded text-xs" style={{ background: c, color: INK[i] }}>
              {i === 0 ? `<${Math.round(breaks[0])}` : i === 5 ? `${Math.round(breaks[4])}+` : `${Math.round(breaks[i - 1])}`}
            </span>
          ))}
        </div>
        <span>More points</span>
        <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-6 rounded border border-dashed border-rule" />Bye</span>
      </div>
    </div>
  );
}
