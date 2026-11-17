"use client";
import Link from "next/link";
import { useState } from "react";
import type { Fmt } from "@/lib/types";
import { useSeason } from "@/lib/useSeason";
import { ago, fetchLeague, useLeague, type League } from "@/lib/useLeague";
import { useSetFmt } from "./Scoring";

const now = () => Date.now();

type Found = { userId: string; name: string; leagues: { id: string; name: string; size: number }[] };

export function LeagueView() {
  const { data } = useSeason();
  const { league, mine, team, save, refresh } = useLeague(data);
  const setFmt = useSetFmt();
  const [username, setUsername] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState<Omit<League, "mine" | "fetched"> | null>(null);
  const [changing, setChanging] = useState(false);

  const lookUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setFound(null);
    try {
      const r = await fetch(`/api/sleeper?user=${encodeURIComponent(username.trim())}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (!j.leagues.length) throw new Error(`${j.name} has no NFL leagues on Sleeper this season.`);
      setFound(j);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reach Sleeper. Try again."); }
    setBusy(false);
  };
  const choose = async (id: string) => {
    setBusy(true); setError("");
    try {
      const l = await fetchLeague(id);
      const own = l.rosters.find((r) => r.owner === found?.userId);
      if (own) finish(l, own.rid); else setPicking(l);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load that league."); }
    setBusy(false);
  };
  const finish = (l: Omit<League, "mine" | "fetched">, rid: number) => {
    save({ ...l, mine: rid, fetched: now() });
    setFmt((l.rec >= 1 ? 2 : l.rec >= 0.5 ? 1 : 0) as Fmt);
    setPicking(null); setFound(null); setChanging(false);
  };

  if (league && !changing) {
    return (
      <div className="space-y-5">
        <h1 className="text-5xl sm:text-6xl">My league</h1>
        <section className="panel space-y-3 p-5">
          <p className="text-mute">Connected to</p>
          <p className="display text-4xl">{league.name}</p>
          <p className="text-mute">
            {league.size} teams, {league.rec >= 1 ? "PPR" : league.rec >= 0.5 ? "Half-PPR" : "Standard"} scoring. Your team: <span className="font-semibold text-chalk">{team ?? "not picked"}</span>. Rosters updated {ago(league.fetched)}.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/waivers" className="rounded-md bg-gold px-4 py-2 font-semibold text-field">See who&apos;s free</Link>
            <Link href={`/start?p=${mine.slice(0, 2).map((p) => p.id).join(",")}`} className="rounded-md border border-rule px-4 py-2 font-semibold">Start or sit my players</Link>
            <button type="button" onClick={() => refresh()} className="rounded-md border border-rule px-4 py-2 font-semibold">Refresh rosters</button>
          </div>
        </section>
        {mine.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-2xl">My roster</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {[...mine].sort((a, b) => "QBRBWRTE".indexOf(a.pos) - "QBRBWRTE".indexOf(b.pos) || a.rk[1] - b.rk[1]).map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <Link href={`/player/${p.id}`} className="hover:underline">{p.name}</Link>
                  <span className="stat text-mute">{p.pos} {p.team}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-dim">Kickers and defenses aren&apos;t shown.</p>
          </section>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={() => setChanging(true)} className="text-gold underline underline-offset-4">Switch league</button>
          <button type="button" onClick={() => save(null)} className="text-mute underline underline-offset-4">Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-5xl sm:text-6xl">Connect your Sleeper league</h1>
      <p className="max-w-prose text-mute">
        Then the waiver list shows only players who are actually free in your league, and start-or-sit can pull your roster. No password needed: Sleeper leagues are public, so your username is enough. Your league stays saved on this device.
      </p>

      {!picking && (
        <form onSubmit={lookUp} className="panel flex max-w-xl flex-wrap gap-2 p-4">
          <label htmlFor="sleeper-user" className="w-full font-medium">Your Sleeper username</label>
          <input
            id="sleeper-user" required autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="e.g. fantasyfan22"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="min-w-0 flex-1 basis-48 rounded-lg border border-rule bg-field px-3 py-2.5 text-chalk placeholder:text-dim"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-field disabled:opacity-60">{busy && !found ? "Looking…" : "Find my leagues"}</button>
          <p className="w-full text-sm text-dim">In the Sleeper app, tap your profile picture; your username is under your name.</p>
        </form>
      )}

      {error && <p role="alert" className="text-[#ff8a8a]">{error}</p>}

      {found && !picking && (
        <section className="panel p-4">
          <h2 className="text-2xl">Pick a league</h2>
          <ul className="mt-3 space-y-2">
            {found.leagues.map((l) => (
              <li key={l.id}>
                <button type="button" disabled={busy} onClick={() => choose(l.id)} className="flex w-full items-center justify-between rounded-lg border border-rule px-4 py-3 text-left hover:border-gold">
                  <span className="font-semibold">{l.name}</span>
                  <span className="stat text-sm text-mute">{l.size} teams</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {picking && (
        <section className="panel p-4">
          <h2 className="text-2xl">Which team is yours?</h2>
          <ul className="mt-3 space-y-2">
            {picking.rosters.map((r) => (
              <li key={r.rid}>
                <button type="button" onClick={() => finish(picking, r.rid)} className="w-full rounded-lg border border-rule px-4 py-3 text-left font-semibold hover:border-gold">{r.team}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {changing && <button type="button" onClick={() => setChanging(false)} className="text-sm text-mute underline underline-offset-4">Keep my current league</button>}
    </div>
  );
}
