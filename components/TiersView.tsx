"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Pos } from "@/lib/types";
import { POSITIONS, fmt1, ppg } from "@/lib/scoring";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PosTabs } from "./PosTabs";

const DEPTH: Record<Pos, number> = { QB: 24, RB: 36, WR: 48, TE: 24 };
const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#1c5cab"];
const MAX_H = 230;

/** Splits a sorted list at its largest drop-offs, keeping every tier at least two players deep. */
function tierBreaks(values: number[], tiers: number): Set<number> {
  const gaps = values.slice(1).map((v, i) => ({ at: i + 1, gap: values[i] - v })).sort((a, b) => b.gap - a.gap);
  const cuts: number[] = [];
  for (const g of gaps) {
    if (cuts.length >= tiers - 1) break;
    if (g.at < 2 || g.at > values.length - 2) continue;
    if (cuts.some((c) => Math.abs(c - g.at) < 2)) continue;
    cuts.push(g.at);
  }
  return new Set(cuts);
}

export function TiersView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const [pos, setPos] = useState<Pos>("RB");
  const list = useMemo(() => {
    if (!data) return [];
    const min = Math.max(3, Math.ceil(data.week / 2));
    return data.players.filter((p) => p.pos === pos && p.g.length >= min)
      .map((p) => ({ p, v: ppg(p, fmt) })).sort((a, b) => b.v - a.v).slice(0, DEPTH[pos]);
  }, [data, pos, fmt]);
  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;

  const breaks = tierBreaks(list.map((x) => x.v), RAMP.length);
  const max = list[0]?.v || 1;
  const groups: (typeof list)[] = [];
  list.forEach((x, i) => { if (i === 0 || breaks.has(i)) groups.push([]); groups[groups.length - 1].push(x); });
  let rank = 0;

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Tier skyline</h1>
      <p className="max-w-prose text-mute">
        Each building is a player, as tall as his points per game. A gap in the skyline marks a real drop-off, so players in the same block are close to interchangeable.
        Players need {Math.max(3, Math.ceil(data.week / 2))} or more games to appear.
      </p>
      <PosTabs options={POSITIONS} value={pos} onChange={setPos} label="Position" />
      <div className="panel overflow-x-auto p-4">
        <div className="flex min-w-max items-end gap-5">
          {groups.map((g, t) => (
            <div key={t}>
              <div className="flex items-end gap-[3px]" style={{ height: MAX_H + 22 }}>
                {g.map(({ p, v }) => {
                  rank++;
                  return (
                    <Link key={p.id} href={`/player/${p.id}`} title={`${p.name}: ${fmt1(v)} per game`} className="group flex w-9 flex-col items-center justify-end">
                      <span className="stat mb-1 text-xs text-mute group-hover:text-chalk">{fmt1(v)}</span>
                      <span className="block w-full rounded-t group-hover:brightness-125" style={{ height: Math.max(8, (v / max) * MAX_H), background: RAMP[t] }} />
                    </Link>
                  );
                })}
              </div>
              <div className="flex gap-[3px] border-t-2 pt-2" style={{ borderColor: RAMP[t] }}>
                {g.map(({ p }) => (
                  <Link key={p.id} href={`/player/${p.id}`} className="flex h-36 w-9 justify-center text-sm text-mute hover:text-chalk" style={{ writingMode: "vertical-rl" }}>
                    <span className="rotate-180 truncate">{p.name}</span>
                  </Link>
                ))}
              </div>
              <div className="display mt-2 text-lg" >Tier {t + 1}</div>
              <div className="stat text-sm text-mute">{pos}{rank - g.length + 1}{g.length > 1 ? `–${rank}` : ""}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-dim sm:hidden">Swipe sideways to walk the whole skyline.</p>
    </div>
  );
}
