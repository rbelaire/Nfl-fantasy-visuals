"use client";
import { createContext, useContext } from "react";
import type { Fmt } from "@/lib/types";
import { FMT_LABEL } from "@/lib/scoring";
import { useStored } from "@/lib/useStored";

const Ctx = createContext<{ fmt: Fmt; setFmt: (f: Fmt) => void }>({ fmt: 1, setFmt: () => {} });
export const useFmt = () => useContext(Ctx).fmt;
export const useSetFmt = () => useContext(Ctx).setFmt;

export function ScoringProvider({ children }: { children: React.ReactNode }) {
  const [saved, save] = useStored("fmt", "1");
  const fmt = (saved === "0" ? 0 : saved === "2" ? 2 : 1) as Fmt;
  return <Ctx.Provider value={{ fmt, setFmt: (f) => save(String(f)) }}>{children}</Ctx.Provider>;
}

const SHORT = ["Std", "Half", "PPR"];
export function ScoringToggle() {
  const { fmt, setFmt } = useContext(Ctx);
  return (
    <div role="group" aria-label="Scoring format" className="flex shrink-0 rounded-md border border-rule bg-field p-0.5">
      {SHORT.map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={fmt === i}
          title={FMT_LABEL[i]}
          onClick={() => setFmt(i as Fmt)}
          className={`stat rounded px-2.5 py-1 text-sm font-semibold ${fmt === i ? "bg-gold text-field" : "text-mute hover:text-chalk"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
