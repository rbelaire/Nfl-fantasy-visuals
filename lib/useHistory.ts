"use client";
import { useEffect, useState } from "react";
import type { History } from "./types";

let cache: Promise<History> | null = null;
const load = () => (cache ??= fetch("/data/history.json").then((r) => {
  if (!r.ok) throw new Error("Could not load past seasons");
  return r.json();
}).catch((e) => { cache = null; throw e; }));

/** Past seasons, loaded only when a page needs them. */
export function useHistory() {
  const [data, setData] = useState<History | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let on = true;
    load().then((d) => on && setData(d), () => on && setError(true));
    return () => { on = false; };
  }, []);
  return { data, error };
}
