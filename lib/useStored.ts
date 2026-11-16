"use client";
import { useSyncExternalStore } from "react";

const EVT = "pulse-store";
const mem = new Map<string, string>(); // covers browsers where localStorage is blocked

const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
};
const read = (key: string, fallback: string) => {
  if (mem.has(key)) return mem.get(key)!;
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};

/** A string kept in localStorage. Renders the fallback on the server and the saved value after hydration. */
export function useStored(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  const set = (v: string) => {
    mem.set(key, v);
    try { localStorage.setItem(key, v); } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  return [value, set];
}
