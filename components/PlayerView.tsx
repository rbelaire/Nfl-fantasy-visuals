"use client";
import Link from "next/link";
import type { Player, Season } from "@/lib/types";
import { FMT_KEY, FMT_LABEL, STARTER_RANK, archetype, fmt1, ppg, pts, rarity, total, volatility } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useFmt } from "./Scoring";
import { Jersey } from "./Jersey";
import { Heartbeat, toBeats } from "./Heartbeat";
import { BoomBust } from "./BoomBust";
import { Anatomy } from "./Anatomy";
import { UsageScatter } from "./UsageScatter";
import { GameLog } from "./GameLog";

export function Section({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel min-w-0 p-4 sm:p-5">
      <h2 className="text-2xl">{title}</h2>
      {note && <p className="mt-1.5 max-w-prose text-sm text-mute">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PlayerView({ player, week, line, season }: { player: Player; week: number; line: Season["line"]; season: number }) {
  const fmt = useFmt();
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

      <Section
        title="Season heartbeat"
        note={<>One spike per week of {FMT_LABEL[fmt]} points. Gold dots cleared the starter line, the score the {cutoff} averages each week ({fmt1(starter)}). A flat stretch is a week he did not play.</>}
      >
        <Heartbeat
          beats={toBeats(player.g.map((g) => ({ w: g.w, v: pts(g, fmt), tip: `vs ${g.opp}` })), week)}
          line={starter} lineLabel="Starter line"
        />
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
          <UsageScatter player={player} fmt={fmt} />
        </Section>
        <Section title="Trading card" note="Save it and drop it in the group chat.">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt={`${player.name} trading card`} width={300} height={420} loading="lazy" className="rounded-xl" />
            <a href={cardUrl} download={`${player.name.replace(/[^A-Za-z]+/g, "-").toLowerCase()}-${season}-card.png`} className="rounded-md bg-gold px-4 py-2 font-semibold text-field">
              Download card
            </a>
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
