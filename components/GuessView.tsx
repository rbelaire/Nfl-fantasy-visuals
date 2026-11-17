"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { pts } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useStored } from "@/lib/useStored";
import { dayKey, parseLog, puzzleNumber, stats } from "@/lib/guessStats";
import { useFmt } from "./Scoring";
import { PlayerSearch } from "./PlayerSearch";
import { Heartbeat, toBeats } from "./Heartbeat";
import { Anatomy } from "./Anatomy";
import { Section } from "./PlayerView";

const MAX = 6;
const noop = () => () => {};
const POOL: Record<string, number> = { QB: 20, RB: 30, WR: 35, TE: 15 };
const today = () => dayKey(new Date());
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export function GuessView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const day = useSyncExternalStore(noop, today, () => "");
  const [stored, store] = useStored(`guess-${day}`, "");
  const ids = useMemo(() => (stored ? stored.split(",") : []), [stored]);
  const [copied, setCopied] = useState(false);
  // The answer is locked in on the first guess, so a mid-day data refresh can't swap it.
  const [locked, lock] = useStored(`guess-answer-${day}`, "");
  const [rawLog, saveLog] = useStored("guess-log", "{}");
  const log = useMemo(() => parseLog(rawLog), [rawLog]);

  const answer = useMemo(() => {
    if (!data || !day) return null;
    const kept = locked && data.players.find((p) => p.id === locked);
    if (kept) return kept;
    const pool = data.players.filter((p) => p.rk[1] <= POOL[p.pos] && p.g.length >= 4).sort((a, b) => a.id.localeCompare(b.id));
    return pool[hash(day) % pool.length];
  }, [data, day, locked]);

  if (!data || !answer) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading today's player…"}</p>;

  const guesses = ids.map((id) => data.players.find((p) => p.id === id)).filter((p): p is Player => !!p);
  const won = guesses.some((g) => g.id === answer.id);
  const done = won || guesses.length >= MAX;
  const t = team(answer.team);
  const guess = (p: Player) => {
    if (!locked) lock(answer.id);
    const next = [...ids, p.id];
    store(next.join(","));
    const hit = p.id === answer.id;
    if (hit || next.length >= MAX) saveLog(JSON.stringify({ ...log, [day]: hit ? next.length : 0 }));
  };
  const s = stats(log, day, MAX);
  const num = puzzleNumber(day);
  const checks = (g: Player) => {
    const gt = team(g.team);
    return [
      { label: g.pos, ok: g.pos === answer.pos },
      { label: gt.conf, ok: gt.conf === t.conf },
      { label: `${gt.conf} ${gt.div}`, ok: gt.conf === t.conf && gt.div === t.div },
      { label: g.team, ok: g.team === answer.team },
    ];
  };
  const hints = [
    guesses.length >= 2 && `He plays in the ${t.conf}.`,
    guesses.length >= 3 && answer.college && `He played college football at ${answer.college}.`,
    guesses.length >= 4 && answer.exp != null && (answer.exp === 0 ? "He is a rookie." : `This is his ${ordinal(answer.exp + 1)} season.`),
    guesses.length >= 5 && answer.num != null && `He wears number ${answer.num}.`,
  ].filter(Boolean) as string[];
  const share = async () => {
    const grid = guesses.map((g) => checks(g).map((c) => (c.ok ? "🟩" : "⬛")).join("")).join("\n");
    const streak = s.cur > 1 ? `\n🔥 ${s.cur}-day streak` : "";
    const text = `Fantasy Pulse #${num}: ${won ? guesses.length : "X"}/${MAX}\n${grid}${streak}\n${window.location.origin}/guess`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl sm:text-6xl">Whose pulse is this?</h1>
        <p className="stat text-mute">
          Puzzle #{num}{s.cur > 0 && <> · <span className="font-semibold text-gold">{s.cur}-day streak</span></>}
        </p>
      </div>
      <p className="max-w-prose text-mute">
        One mystery player a day, drawn from the top scorers at each position. You get {MAX} guesses. Each miss shows what you got right and unlocks a hint.
      </p>
      <Section title="Today's heartbeat" note="Weekly points this season. The dashed line is the starter line for his position.">
        <Heartbeat beats={toBeats(answer.g.map((g) => ({ w: g.w, v: pts(g, fmt) })), data.week)} line={data.line[answer.pos][fmt]} />
        <div className="mt-4"><Anatomy games={answer.g} fmt={fmt} /></div>
      </Section>

      {!done && (
        <div className="panel p-4">
          <label className="mb-2 block font-medium">Guess {guesses.length + 1} of {MAX}</label>
          <PlayerSearch placeholder="Type a player's name" exclude={ids} onPick={guess} />
        </div>
      )}

      {done && (
        <div className="panel border-gold p-5">
          <p className="text-mute">{won ? `Got it in ${guesses.length}.` : "Out of guesses. It was"}</p>
          <p className="display mt-1 text-5xl">{answer.name}</p>
          <p className="mt-1 text-mute">{answer.pos}, {t.name}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/player/${answer.id}`} className="rounded-md bg-gold px-4 py-2 font-semibold text-field">See his full season</Link>
            <button type="button" onClick={share} className="rounded-md border border-rule px-4 py-2 font-semibold">{copied ? "Copied" : "Copy result to share"}</button>
          </div>
          <Stats s={s} max={MAX} today={won ? guesses.length : 0} />
          <p className="mt-4 text-sm text-dim">A new player arrives at midnight.</p>
        </div>
      )}

      {hints.length > 0 && !done && (
        <ul className="panel space-y-1 p-4">
          {hints.map((h) => <li key={h}>{h}</li>)}
        </ul>
      )}

      {guesses.length > 0 && (
        <div className="panel overflow-x-auto p-4">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-mute">
                <th className="pb-2 font-medium">Your guesses</th>
                {["Position", "Conference", "Division", "Team"].map((h) => <th key={h} className="pb-2 pl-2 text-center font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {guesses.map((g) => (
                <tr key={g.id} className="border-t border-rule/60">
                  <td className="py-2 font-medium">{g.name}</td>
                  {checks(g).map((c, i) => (
                    <td key={i} className="py-2 pl-2 text-center">
                      <span className={`stat inline-block min-w-20 rounded px-2 py-1 font-semibold ${c.ok ? "bg-[#1fae7c] text-field" : "bg-raised text-mute"}`}>
                        {c.ok ? "✓" : "✕"} {c.label}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stats({ s, max, today }: { s: ReturnType<typeof stats>; max: number; today: number }) {
  const top = Math.max(1, ...s.dist);
  const tiles = [["Played", s.played], ["Win %", s.winPct], ["Streak", s.cur], ["Best streak", s.best]] as const;
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <dl className="grid grid-cols-4 gap-2 text-center">
        {tiles.map(([k, v]) => (
          <div key={k}>
            <dd className="display text-4xl">{v}</dd>
            <dt className="text-xs text-mute">{k}</dt>
          </div>
        ))}
      </dl>
      <h3 className="mt-4 text-lg">Guesses to win</h3>
      <ol className="mt-2 space-y-1">
        {s.dist.map((n, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="stat w-3 text-mute">{i + 1}</span>
            <span
              className={`stat flex h-6 min-w-7 items-center justify-end rounded px-2 font-semibold ${today === i + 1 ? "bg-gold text-field" : "bg-raised"}`}
              style={{ width: `${Math.max(8, (n / top) * 100)}%` }}
            >{n}</span>
          </li>
        ))}
      </ol>
      {max > 0 && s.played > s.wins && <p className="mt-2 text-sm text-dim">Missed: {s.played - s.wins}</p>}
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
