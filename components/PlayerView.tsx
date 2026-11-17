"use client";
import Link from "next/link";
import type { Player, Season } from "@/lib/types";
import { FMT_KEY, FMT_LABEL, STARTER_RANK, archetype, defenseTable, fmt1, luck, matchupLabel, ppg, pts, rarity, total, touchValues, volatility } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useFmt } from "./Scoring";
import { Jersey } from "./Jersey";
import { Heartbeat, toBeats } from "./Heartbeat";
import { BoomBust } from "./BoomBust";
import { Anatomy } from "./Anatomy";
import { UsageScatter } from "./UsageScatter";
import { GameLog } from "./GameLog";
import { Twins } from "./Twins";
import { ShareBar } from "./ShareBar";

export function Section({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel min-w-0 p-4 sm:p-5">
      <h2 className="text-2xl">{title}</h2>
      {note && <p className="mt-1.5 max-w-prose text-sm text-mute">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PlayerView({ player, week, line, season, defense, next, values, known }: {
  player: Player; week: number; line: Season["line"]; season: number;
  defense: Season["defense"]; next: Season["next"]; values: ReturnType<typeof touchValues>[]; known: string[];
}) {
  const fmt = useFmt();
  const form = luck(player, fmt, values[fmt]);
  const table = defenseTable(defense, player.pos, fmt);
  const nextOpp = next?.opp[player.team];
  const nextRank = nextOpp ? table.find((r) => r.team === nextOpp.replace("@", ""))?.rank : undefined;
  const t = team(player.team);
  const starter = line[player.pos][fmt];
  const startable = player.g.filter((g) => pts(g, fmt) >= starter).length;
  const vol = volatility(player, fmt);
  const cutoff = `${player.pos}${STARTER_RANK[player.pos]}`;
  const tiles = [
    { label: "Total points", value: fmt1(total(player, fmt)) },
    { label: "Per game", value: fmt1(ppg(player, fmt)) },
    { label: "Position rank", value: `${player.pos}${player.rk[fmt]}` },
    { label: "Startable weeks", value: `${startable} of ${player.g.length}` },
  ];
  const cardUrl = `/api/card/${player.id}?s=${FMT_KEY[fmt]}`;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-4">
        <Jersey abbr={player.team} num={player.num} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-5xl sm:text-6xl">{player.name}</h1>
          <p className="mt-1.5 text-mute">
            {player.pos}, {t.name}
            {player.exp != null && <span>, {player.exp === 0 ? "rookie" : `year ${player.exp + 1}`}</span>}
          </p>
          <p className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-raised px-2 py-0.5 font-medium">{archetype(player)}</span>
            {vol && <span className="rounded bg-raised px-2 py-0.5 font-medium">{vol}</span>}
            <span className="rounded px-2 py-0.5 font-semibold text-field" style={{ background: rarity(player, fmt).color }}>{rarity(player, fmt).name}</span>
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.label} className="panel px-4 py-3">
            <dt className="text-sm text-mute">{x.label}</dt>
            <dd className="display mt-1 text-4xl">{x.value}</dd>
          </div>
        ))}
      </dl>

      {next && (
        <p className="panel px-4 py-3">
          <span className="font-semibold">Week {next.week}: </span>
          {nextOpp
            ? <>{nextOpp.startsWith("@") ? "at" : "vs"} {team(nextOpp.replace("@", "")).name}, who {nextRank ? matchupLabel(nextRank, table.length, player.pos) : "have no games yet"}. <Link href={`/defense?pos=${player.pos}`} className="text-gold underline underline-offset-4">See every matchup</Link></>
            : "bye week."}
        </p>
      )}

      <Section
        title="Season heartbeat"
        note={<>One spike per week of {FMT_LABEL[fmt]} points. Gold dots cleared the starter line, the score the {cutoff} averages each week ({fmt1(starter)}). A flat stretch is a week he did not play.</>}
      >
        <Heartbeat
          beats={toBeats(player.g.map((g) => ({ w: g.w, v: pts(g, fmt), tip: `vs ${g.opp}`, sn: g.sn })), week)}
          line={starter} lineLabel="Starter line" snaps
        />
      </Section>

      <Section title="Heartbeat twins" note="Past seasons whose opening stretch looked most like this one, and where they went from here.">
        <Twins player={player} fmt={fmt} known={new Set(known)} />
      </Section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="Weekly finishes" note={`Where he ranked among ${player.pos}s each week. More light tiles means more weeks that won matchups.`}>
          <BoomBust player={player} fmt={fmt} weeks={week} />
        </Section>
        <Section title="Where the points come from" note="A player who leans on touchdowns is harder to trust than one fed by yards and catches.">
          <Anatomy games={player.g} fmt={fmt} />
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="Workload against output" note="One dot per week. Dots low and to the right are busy weeks that did not pay off, often a sign of better days ahead.">
          {form && (
            <p className="mb-3">
              Over his last 3 games he averaged <span className="stat font-semibold">{fmt1(form.touches)}</span> targets and carries
              {form.snap != null && <> on <span className="stat font-semibold">{Math.round(form.snap)}%</span> of snaps</>}.
              That work usually earns a {player.pos} <span className="stat font-semibold">{fmt1(form.expected)}</span> points; he scored{" "}
              <span className="stat font-semibold">{fmt1(form.actual)}</span>.{" "}
              {form.diff <= -3 ? "The role is there and the points have lagged, a classic buy-low sign." : form.diff >= 3 ? "He is outscoring his workload, which big plays and touchdowns rarely sustain." : "His points match his workload."}
            </p>
          )}
          <UsageScatter player={player} fmt={fmt} />
        </Section>
        <Section title="Trading card" note="Save it and drop it in the group chat.">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt={`${player.name} trading card`} width={300} height={420} loading="lazy" className="rounded-xl" />
            <ShareBar image={cardUrl} file={`${player.name.replace(/[^A-Za-z]+/g, "-").toLowerCase()}-${season}-card.png`} label="Download card" />
          </div>
        </Section>
      </div>

      <Section title="Game log">
        <GameLog player={player} fmt={fmt} />
      </Section>

      <p>
        <Link href={`/compare?a=${player.id}`} className="font-semibold text-gold underline underline-offset-4">
          Compare {player.name} with another player
        </Link>
      </p>
    </div>
  );
}
