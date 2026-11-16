"use client";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/types";
import { preloadSeason, useSeason } from "@/lib/useSeason";
import { Jersey } from "./Jersey";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "");

export function PlayerSearch({
  onPick, placeholder = "Find a player", large = false, exclude = [],
}: { onPick?: (p: Player) => void; placeholder?: string; large?: boolean; exclude?: string[] }) {
  const { data, error } = useSeason();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const term = norm(q).trim();
    if (!data || !term) return [];
    return data.players
      .filter((p) => !exclude.includes(p.id) && norm(p.name).split(" ").some((part, i, all) => part.startsWith(term) || all.slice(i).join(" ").startsWith(term)))
      .sort((a, b) => a.rk[1] - b.rk[1])
      .slice(0, 7);
  }, [data, q, exclude]);

  const pick = (p: Player) => {
    setQ("");
    setOpen(false);
    if (onPick) onPick(p);
    else router.push(`/player/${p.id}`);
  };

  return (
    <div className="relative w-full">
      <input
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-label={placeholder}
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onFocus={() => { preloadSeason(); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && results[active]) pick(results[active]);
          else if (e.key === "Escape") setOpen(false);
        }}
        className={`w-full rounded-lg border border-rule bg-field text-chalk placeholder:text-dim ${large ? "px-4 py-3.5 text-lg" : "px-3 py-2 text-base"}`}
      />
      {open && q.trim() && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-rule bg-panel shadow-xl shadow-black/40">
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-raised" : ""}`}
              >
                <Jersey abbr={p.team} num={p.num} size={30} />
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <span className="stat text-sm text-mute">{p.pos} {p.team}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-mute">
              {error ? "Player data did not load. Check your connection and try again." : data ? "No player by that name has fantasy points this season." : "Loading players…"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
