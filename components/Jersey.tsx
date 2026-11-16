import { team } from "@/lib/teams";

/** A jersey-number badge in the team's color, used in place of player photos. */
export function Jersey({ abbr, num, size = 44 }: { abbr: string; num: number | null; size?: number }) {
  return (
    <span
      aria-hidden
      className="display inline-flex shrink-0 items-center justify-center rounded-lg text-white"
      style={{ width: size, height: size, fontSize: size * 0.56, background: team(abbr).color, textShadow: "0 1px 0 rgb(0 0 0 / .35)" }}
    >
      {num ?? "–"}
    </span>
  );
}
