"use client";
import { useEffect, useMemo, useRef } from "react";
import type { Player, Season } from "./types";
import { useStored } from "./useStored";

export interface Roster { rid: number; owner: string | null; team: string; players: string[] }
export interface League {
  id: string; name: string; size: number; rec: number;
  rosters: Roster[];
  mine: number | null;     // roster id of the visitor's team
  fetched: number;         // ms timestamp
}

const STALE = 15 * 60 * 1000;
export async function fetchLeague(id: string): Promise<Omit<League, "mine" | "fetched">> {
  const r = await fetch(`/api/sleeper?league=${id}`);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "Could not load that league.");
  return j;
}

/** The visitor's connected Sleeper league, kept in their browser and refreshed when it gets stale. */
export function useLeague(data: Season | null) {
  const [raw, save] = useStored("league", "");
  const league = useMemo<League | null>(() => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } }, [raw]);
  const refreshing = useRef(false);

  const refresh = async (force = false) => {
    if (!league || refreshing.current) return;
    if (!force && Date.now() - league.fetched < STALE) return;
    refreshing.current = true;
    try { save(JSON.stringify({ ...league, ...(await fetchLeague(league.id)), fetched: Date.now() })); } catch {} finally { refreshing.current = false; }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [league?.id]);

  const derived = useMemo(() => {
    if (!league || !data) return null;
    const bySleeper = new Map(data.players.filter((p) => p.sl).map((p) => [p.sl!, p]));
    const rostered = new Set<string>();
    for (const r of league.rosters) for (const s of r.players) { const p = bySleeper.get(s); if (p) rostered.add(p.id); }
    const mineRoster = league.rosters.find((r) => r.rid === league.mine);
    const mine = (mineRoster?.players ?? []).map((s) => bySleeper.get(s)).filter((p): p is Player => !!p);
    return { rostered, mine, team: mineRoster?.team ?? null };
  }, [league, data]);

  return {
    league,
    rostered: derived?.rostered ?? null,
    mine: derived?.mine ?? [],
    team: derived?.team ?? null,
    save: (l: League | null) => save(l ? JSON.stringify(l) : ""),
    refresh: () => refresh(true),
  };
}

export const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`;
};
