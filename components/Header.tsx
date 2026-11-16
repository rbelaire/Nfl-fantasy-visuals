"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayerSearch } from "./PlayerSearch";
import { ScoringToggle } from "./Scoring";

const NAV = [
  { href: "/compare", label: "Compare" },
  { href: "/tiers", label: "Tiers" },
  { href: "/race", label: "Race" },
  { href: "/guess", label: "Daily guess" },
];

export function Wordmark() {
  return (
    <span className="display flex items-center gap-2 text-2xl text-chalk">
      <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden>
        <path d="M1 12h8l2 3 4-13 4 16 3-6h11" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      Fantasy Pulse
    </span>
  );
}

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-field/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" aria-label="Fantasy Pulse home"><Wordmark /></Link>
        {path !== "/" && <div className="order-3 w-full sm:order-none sm:w-56"><PlayerSearch /></div>}
        <div className="ml-auto"><ScoringToggle /></div>
        <nav aria-label="Main" className="order-4 -mx-1 flex w-full gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path === n.href ? "page" : undefined}
              className={`whitespace-nowrap rounded px-2.5 py-1 font-medium ${path === n.href ? "bg-raised text-chalk" : "text-mute hover:text-chalk"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
