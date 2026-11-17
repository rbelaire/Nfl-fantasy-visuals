"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Player } from "@/lib/types";
import { fmt1, matchupLabel, pts, touchValues } from "@/lib/scoring";
import { startRead } from "@/lib/startSit";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PlayerSearch } from "./PlayerSearch";
import { Jersey } from "./Jersey";
import { Heartbeat, toBeats } from "./Heartbeat";
import { ShareBar } from "./ShareBar";

const MAX = 3;

export function StartView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const params = useSearchParams();
  const router = useRouter();
  const ids = (params.get("p") ?? "").split(",").filter(Boolean).slice(0, MAX);
  const values = useMemo(() => (data ? touchValues(data.players, fmt) : null), [data, fmt]);
  if (!data || !values) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading players…"}</p>;

  const players = ids.map((id) => data.players.find((p) => p.id === id)).filter((p): p is Player => !!p);
  const reads = players.map((p) => startRead(p, data, fmt, values));
  const go = (next: string[]) => router.replace(next.length ? `/start?p=${next.join(",")}` : "/start", { scroll: false });
  const ranked = reads.filter((r) => r.score != null).sort((a, b) => b.score! - a.score!);
  const best = ranked[0], second = ranked[1];
  const close = best && second && (best.score! - second.score!) / best.score! < 0.06;
  const wk = data.next?.week ?? data.week + 1;

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Who should I start?</h1>
      <p className="max-w-prose text-mute">
        Add two or three players for week {wk}. The lean weighs the last 3 games, what that workload usually earns, the season average, and how generous next week&apos;s defense has been to the position.
      </p>

      {players.length < MAX && (
        <div className="panel max-w-xl p-4">
          <label className="mb-2 block font-medium">{players.length ? "Add another player" : "Add a player"}</label>
          <PlayerSearch placeholder="Type a player's name" exclude={ids} onPick={(p) => go([...ids, p.id])} />
        </div>
      )}

      {reads.length >= 2 && best && (
        <div className="panel flex flex-wrap items-center justify-between gap-4 border-gold p-5">
          <div>
            <p className="text-mute">{close ? "Close call. Slight lean to" : "Start"}</p>
            <p className="display mt-1 text-5xl">{best.p.name}</p>
            <p className="mt-2 max-w-prose text-mute">{why(best, second, close)}</p>
          </div>
          <ShareBar file="" title={`Week ${wk}: start ${best.p.name}?`} />
        </div>
      )}

      {reads.length > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${reads.length === 2 ? "md:grid-cols-2" : reads.length === 3 ? "md:grid-cols-3" : ""}`}>
          {reads.map((r) => (
            <section key={r.p.id} className={`panel min-w-0 p-4 ${r === best && reads.length > 1 ? "border-gold" : ""}`}>
              <div className="flex items-center gap-3">
                <Jersey abbr={r.p.team} num={r.p.num} size={40} />
                <div className="min-w-0 flex-1">
                  <Link href={`/player/${r.p.id}`} className="display block truncate text-2xl hover:underline">{r.p.name}</Link>
                  <p className="text-sm text-mute">{r.p.pos}, {team(r.p.team).name}</p>
                </div>
                <button type="button" aria-label={`Remove ${r.p.name}`} onClick={() => go(ids.filter((id) => id !== r.p.id))} className="rounded border border-rule px-2 py-1 text-sm text-mute hover:text-chalk">Remove</button>
              </div>
              <div className="mt-3">
                <Heartbeat beats={toBeats(r.p.g.map((g) => ({ w: g.w, v: pts(g, fmt) })), data.week)} line={data.line[r.p.pos][fmt]} height={110} compact animate={false} />
              </div>
              <p className="mt-3 flex items-baseline justify-between">
                <span className="text-mute">Lean score</span>
                <span className="display text-4xl">{r.score != null ? fmt1(r.score) : "Bye"}</span>
              </p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <Line k="Week" v={r.bye ? `Bye in week ${wk}` : r.opp ? `${r.opp.startsWith("@") ? "at" : "vs"} ${team(r.opp.replace("@", "")).name}` : "No game listed yet"} />
                {r.defRank != null && <Line k="Matchup" v={`${cap(matchupLabel(r.defRank, Object.keys(data.defense).length, r.p.pos))} (${r.matchup >= 1 ? "+" : ""}${Math.round((r.matchup - 1) * 100)}%)`} />}
                <Line k="Last 3 games" v={`${fmt1(r.recent)} a game`} />
                {r.workload != null && <Line k="Workload usually earns" v={`${fmt1(r.workload)} a game`} />}
                <Line k="Season" v={`${fmt1(r.season)} a game`} />
                <Line k="Startable weeks" v={`${Math.round(r.startable * 100)}%`} />
              </dl>
            </section>
          ))}
        </div>
      )}

      {reads.length === 1 && <p className="text-mute">Add at least one more player to get a lean.</p>}
      <p className="text-sm text-dim">A quick read of recent form and matchup, not a projection. Injuries and news are not included, so check them before kickoff.</p>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-mute">{k}</dt>
      <dd className="stat text-right font-semibold">{v}</dd>
    </div>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function why(best: ReturnType<typeof startRead>, second: ReturnType<typeof startRead> | undefined, close: boolean | undefined) {
  if (!second) return "Everyone else is on bye.";
  const parts: string[] = [];
  if (best.recent > second.recent + 2) parts.push(`he has been scoring more lately (${fmt1(best.recent)} to ${fmt1(second.recent)} a game)`);
  if (best.matchup > second.matchup + 0.05) parts.push("he has the softer matchup");
  if (best.workload != null && second.workload != null && best.workload > second.workload + 2) parts.push("his workload is bigger");
  if (best.season > second.season + 2) parts.push("his season average is higher");
  if (!parts.length) parts.push("he edges ahead on the overall blend");
  const text = parts.slice(0, 2).join(" and ");
  return `${close ? "Only a small gap: " : ""}${text[0].toUpperCase()}${text.slice(1)}.`;
}
