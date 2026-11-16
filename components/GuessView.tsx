"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { pts } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { useSeason } from "@/lib/useSeason";
import { useStored } from "@/lib/useStored";
import { useFmt } from "./Scoring";
import { PlayerSearch } from "./PlayerSearch";
import { Heartbeat, toBeats } from "./Heartbeat";
import { Anatomy } from "./Anatomy";
import { Section } from "./PlayerView";

const MAX = 6;
const noop = () => () => {};
const POOL: Record<string, number> = { QB: 20, RB: 30, WR: 35, TE: 15 };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export function GuessView() {
  const { data, error } = useSeason();
  const fmt = useFmt();
  const day = useSyncExternalStore(noop, today, () => "");
  const [stored, store] = useStored(`guess-${day}`, "");
  const ids = useMemo(() => (stored ? stored.split(",") : []), [stored]);
  const [copied, setCopied] = useState(false);

  const answer = useMemo(() => {
    if (!data || !day) return null;
    const pool = data.players.filter((p) => p.rk[1] <= POOL[p.pos] && p.g.length >= 4).sort((a, b) => a.id.localeCompare(b.id));
    return pool[hash(day) % pool.length];
  }, [data, day]);

  if (!data || !answer) return <p className="py-10 text-mute">{error ? "Player data did not load. Refresh the page to try again." : "Loading today's player…"}</p>;

  const guesses = ids.map((id) => data.players.find((p) => p.id === id)).filter((p): p is Player => !!p);
  const won = guesses.some((g) => g.id === answer.id);
  const done = won || guesses.length >= MAX;
  const t = team(answer.team);
  const guess = (p: Player) => {
    store([...ids, p.id].join(","));
  };
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
    const text = `Fantasy Pulse daily guess ${day}: ${won ? guesses.length : "X"}/${MAX}\n${grid}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Whose pulse is this?</h1>
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
            <button type="button" onClick={share} className="rounded-md border border-rule px-4 py-2 font-semibold">{copied ? "Copied" : "Copy result"}</button>
          </div>
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

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
