"use client";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { FMT_KEY, fmt1, pts, total } from "@/lib/scoring";
import { weekSummary } from "@/lib/week";
import { ShareBar } from "./ShareBar";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useFmt } from "./Scoring";
import { PlayerSearch } from "./PlayerSearch";
import { Heartbeat, toBeats } from "./Heartbeat";
import { Jersey } from "./Jersey";

const TOOLS = [
  { href: "/compare", name: "Compare two players", text: "A tale of the tape for start-or-sit calls and trade talks." },
  { href: "/tiers", name: "Tier skyline", text: "Every position as a city skyline, with the drop-offs between tiers marked." },
  { href: "/defense", name: "Points allowed", text: "A heat map of what every defense gives up to each position, with next week's matchups." },
  { href: "/race", name: "Season race", text: "Watch the scoring leaders trade places week by week." },
  { href: "/guess", name: "Daily guess", text: "Name the mystery player from his heartbeat alone. A new one every day." },
];

function Row({ p, value, sub }: { p: Player; value: string; sub?: string }) {
  return (
    <Link href={`/player/${p.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-raised">
      <Jersey abbr={p.team} num={p.num} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{p.name}</span>
        <span className="block text-sm text-mute">{sub ?? `${p.pos}, ${team(p.team).name}`}</span>
      </span>
      <span className="stat text-lg font-semibold">{value}</span>
    </Link>
  );
}

export function HomeView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const sum = data ? weekSummary(data, fmt) : null;
  const week = sum?.week ?? 0;
  const at = sum?.at ?? (() => undefined);
  const flex = data?.players.filter((p) => p.pos !== "QB") ?? [];
  const star = flex.length ? flex.reduce((a, b) => (total(b, fmt) > total(a, fmt) ? b : a)) : null;
  const { byPos = [], surprise, bust, buyLow = [], sellHigh = [] } = sum ?? {};

  return (
    <div className="space-y-12">
      <section className="pt-4 sm:pt-10">
        <h1 className="max-w-3xl text-6xl sm:text-8xl">Every fantasy season has a pulse.</h1>
        <p className="mt-4 max-w-xl text-lg text-mute">
          Look up any NFL player and see his season as a heartbeat: the spikes, the flatlines and the week the breakout began.
        </p>
        <div className="mt-6 max-w-xl"><PlayerSearch large placeholder="Search for a player, like Gibbs or Burrow" /></div>
        {star && (
          <div className="panel mt-8 p-4 sm:p-5">
            <p className="text-mute">
              The strongest pulse outside of quarterback so far:{" "}
              <Link href={`/player/${star.id}`} className="font-semibold text-gold underline underline-offset-4">{star.name}</Link>, {fmt1(total(star, fmt))} points.
            </p>
            <div className="mt-2">
              <Heartbeat beats={toBeats(star.g.map((g) => ({ w: g.w, v: pts(g, fmt), tip: `vs ${g.opp}` })), week)} line={data!.line[star.pos][fmt]} lineLabel="Starter line" height={220} />
            </div>
          </div>
        )}
        {!data && <p className="mt-8 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading this season's numbers…"}</p>}
      </section>

      {data && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-4xl">Week {week} at a glance</h2>
            <ShareBar image={`/api/og/week?s=${FMT_KEY[fmt]}`} file={`fantasy-pulse-week-${week}.png`} label="Download poster" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {byPos.map(({ pos, top }) => (
              <div key={pos} className="panel p-3">
                <h3 className="px-2 text-xl text-mute">Top {pos === "QB" ? "quarterbacks" : pos === "RB" ? "running backs" : pos === "WR" ? "receivers" : "tight ends"}</h3>
                <div className="mt-1">{top.map((p) => <Row key={p.id} p={p} value={fmt1(pts(at(p)!, fmt))} sub={`${team(p.team).name} vs ${at(p)!.opp}`} />)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {surprise && (
              <div className="panel p-3">
                <h3 className="px-2 text-xl text-mute">Out of nowhere</h3>
                <Row p={surprise} value={fmt1(pts(at(surprise)!, fmt))} sub={`${surprise.pos}${at(surprise)!.rk[fmt]} this week, ${surprise.pos}${surprise.rk[fmt]} on the season`} />
              </div>
            )}
            {bust && (
              <div className="panel p-3">
                <h3 className="px-2 text-xl text-mute">Flatline of the week</h3>
                <Row p={bust} value={fmt1(pts(at(bust)!, fmt))} sub={`${bust.pos}${bust.rk[fmt]} on the season, ${bust.pos}${at(bust)!.rk[fmt]} this week`} />
              </div>
            )}
          </div>
        </section>
      )}

      {data && (buyLow.length > 0 || sellHigh.length > 0) && (
        <section>
          <h2 className="text-4xl">Workload watch</h2>
          <p className="mt-2 max-w-prose text-mute">
            Each player&apos;s last 3 games against what his targets and carries usually earn at his position. A big gap tends to close.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="panel p-3">
              <h3 className="px-2 text-xl">Buy low</h3>
              <p className="px-2 text-sm text-mute">Getting the work, not the points yet.</p>
              <div className="mt-1">{buyLow.map(({ p, form }) => <Row key={p.id} p={p} value={`${fmt1(form.diff)}`} sub={`${fmt1(form.touches)} touches${form.snap != null ? `, ${Math.round(form.snap)}% of snaps` : ""}, ${fmt1(form.actual)} pts a game`} />)}</div>
            </div>
            <div className="panel p-3">
              <h3 className="px-2 text-xl">Sell high</h3>
              <p className="px-2 text-sm text-mute">Scoring well beyond the workload.</p>
              <div className="mt-1">{sellHigh.map(({ p, form }) => <Row key={p.id} p={p} value={`+${fmt1(form.diff)}`} sub={`${fmt1(form.touches)} touches, ${fmt1(form.actual)} pts a game`} />)}</div>
            </div>
          </div>
          <p className="mt-2 text-sm text-dim">The number is points per game above or below what that workload usually earns.</p>
        </section>
      )}

      <section>
        <h2 className="text-4xl">More ways to look</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="panel block h-full p-4 hover:border-gold">
                <span className="display block text-2xl">{t.name}</span>
                <span className="mt-1.5 block text-mute">{t.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
