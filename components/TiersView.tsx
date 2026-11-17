"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Pos } from "@/lib/types";
import { FMT_KEY, POSITIONS, fmt1 } from "@/lib/scoring";
import { TIER_RAMP, buildTiers, minGames } from "@/lib/tiers";
import { ShareBar } from "./ShareBar";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PosTabs } from "./PosTabs";

const MAX_H = 230;

export function TiersView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const [pos, setPos] = useState<Pos>("RB");
  const groups = useMemo(() => (data ? buildTiers(data.players, pos, fmt, data.week) : []), [data, pos, fmt]);
  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;

  const max = groups[0]?.[0]?.v || 1;
  let rank = 0;

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Tier skyline</h1>
      <p className="max-w-prose text-mute">
        Each building is a player, as tall as his points per game. A gap in the skyline marks a real drop-off, so players in the same block are close to interchangeable.
        Players need {minGames(data.week)} or more games to appear.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PosTabs options={POSITIONS} value={pos} onChange={setPos} label="Position" />
        <ShareBar image={`/api/og/tiers?pos=${pos}&s=${FMT_KEY[fmt]}`} file={`${pos.toLowerCase()}-tiers-week-${data.week}.png`} />
      </div>
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
                      <span className="block w-full rounded-t group-hover:brightness-125" style={{ height: Math.max(8, (v / max) * MAX_H), background: TIER_RAMP[t] }} />
                    </Link>
                  );
                })}
              </div>
              <div className="flex gap-[3px] border-t-2 pt-2" style={{ borderColor: TIER_RAMP[t] }}>
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
