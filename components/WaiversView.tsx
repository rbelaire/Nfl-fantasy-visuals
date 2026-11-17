"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Pos } from "@/lib/types";
import { POSITIONS } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useStored } from "@/lib/useStored";
import { waiverPicks } from "@/lib/waivers";
import { ago, useLeague } from "@/lib/useLeague";
import { EmailSignup } from "./EmailSignup";
import { useFmt } from "./Scoring";
import { PosTabs } from "./PosTabs";
import { Jersey } from "./Jersey";

const TABS = ["All", ...POSITIONS] as const;
const SIZES = ["10 teams", "12 teams", "14 teams"] as const;
const SHOW = 12;

export function WaiversView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const [pos, setPos] = useState<(typeof TABS)[number]>("All");
  const [size, setSize] = useStored("league-size", "12");
  const [takenRaw, saveTaken] = useStored("waiver-taken", "");
  const taken = useMemo(() => new Set(takenRaw ? takenRaw.split(",") : []), [takenRaw]);
  const { league, rostered, refresh } = useLeague(data);
  const picks = useMemo(() => (data ? waiverPicks(data, fmt, league?.size ?? Number(size), rostered) : []), [data, fmt, size, league, rostered]);
  if (!data) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;

  const open = picks.filter((x) => (league || !taken.has(x.p.id)) && (pos === "All" || x.p.pos === (pos as Pos)));
  const list = open.slice(0, SHOW);
  const wk = data.next?.week ?? data.week + 1;
  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Who should I pick up?</h1>
      {league ? (
        <p className="panel max-w-prose px-4 py-3">
          Showing players free in <span className="font-semibold">{league.name}</span>, best first for week {wk}. Rosters updated {ago(league.fetched)}.{" "}
          <button type="button" onClick={() => refresh()} className="text-gold underline underline-offset-4">Refresh</button>
        </p>
      ) : (
        <>
          <p className="max-w-prose text-mute">
            The best players likely to be free for week {wk}, best first, each with the reason in plain words.
            If someone is already on a team in your league, tap &ldquo;Taken&rdquo; and the next name moves up. The top name left is your pickup.
          </p>
          <Link href="/league" className="panel flex max-w-xl items-center justify-between gap-3 border-gold px-4 py-3 hover:bg-raised">
            <span><span className="font-semibold">Play on Sleeper?</span> <span className="text-mute">Connect your league and this list shows only players who are actually free.</span></span>
            <span className="shrink-0 font-semibold text-gold">Connect</span>
          </Link>
        </>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <PosTabs options={TABS} value={pos} onChange={setPos} label="Position" />
        {!league && <PosTabs options={SIZES} value={`${size} teams` as (typeof SIZES)[number]} onChange={(v) => setSize(v.split(" ")[0])} label="League size" />}
      </div>
      {!league && taken.size > 0 && (
        <p className="text-sm text-mute">
          {taken.size} marked as taken.{" "}
          <button type="button" onClick={() => saveTaken("")} className="text-gold underline underline-offset-4">Show them again</button>
        </p>
      )}
      {list.length === 0 && <p className="panel p-5 text-mute">No one left worth adding here. Try another position, or show the players you marked as taken.</p>}
      <ol className="space-y-3">
        {list.map((x, i) => (
          <li key={x.p.id} className={`panel p-4 ${i === 0 ? "border-gold" : ""}`}>
            {i === 0 && <p className="mb-2 text-sm font-semibold text-gold">Top pickup{pos === "All" ? "" : ` at ${pos}`}</p>}
            <div className="flex items-center gap-3">
              <span className="stat w-5 text-right text-dim">{i + 1}</span>
              <Jersey abbr={x.p.team} num={x.p.num} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/player/${x.p.id}`} className="display block truncate text-2xl hover:underline">{x.p.name}</Link>
                <p className="text-sm text-mute">{x.p.pos}, {team(x.p.team).name}</p>
              </div>
              {!league && <button
                type="button" aria-label={`${x.p.name} is taken in my league`}
                onClick={() => saveTaken([...taken, x.p.id].join(","))}
                className="shrink-0 rounded-md border border-rule px-3 py-2 text-sm font-semibold text-mute hover:text-chalk"
              >Taken</button>}
            </div>
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded bg-raised px-2 py-0.5 font-medium">{x.tag}</span>
              <span className={`rounded px-2 py-0.5 font-semibold ${x.startable ? "bg-[#1fae7c] text-field" : "bg-raised text-mute"}`}>
                {x.startable ? `Can start in week ${wk}` : "For the bench"}
              </span>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              {x.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </li>
        ))}
      </ol>
      {open.length > SHOW && <p className="text-sm text-dim">{open.length - SHOW} more behind these. Mark names as taken to bring them up.</p>}
      <EmailSignup source="waivers" />
      {!league && <p className="max-w-prose text-sm text-dim">
        The list starts from players ranked low enough on the season that they are usually free in a league this size. Connect a Sleeper league or use the Taken button to correct it. Injuries and news are not included.
      </p>}
    </div>
  );
}
