"use client";
import { useEffect, useState } from "react";
import type { Season } from "./types";

let cache: Promise<Season> | null = null;
const load = () => (cache ??= fetch("/data/season.json").then((r) => {
  if (!r.ok) throw new Error("Could not load player data");
  return r.json();
}).catch((e) => { cache = null; throw e; }));

/** Loads the full season snapshot once per visit, for pages that need every player. */
export function useSeason() {
  const [data, setData] = useState<Season | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let on = true;
    load().then((d) => on && setData(d), () => on && setError(true));
    return () => { on = false; };
  }, []);
  return { data, error };
}
export const preloadSeason = () => void load().catch(() => {});
