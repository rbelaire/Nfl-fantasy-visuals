import type { Fmt, Player, Season } from "./types";
import { POSITIONS, STARTER_RANK, luck, pts, touchValues } from "./scoring";

/** The week's headlines: top scorers by position, a surprise, a dud, and workload signals. */
export function weekSummary(data: Season, f: Fmt) {
  const week = data.week;
  const at = (p: Player) => p.g.find((g) => g.w === week);
  const played = data.players.filter((p) => at(p));
  const score = (p: Player) => pts(at(p)!, f);
  const byPos = POSITIONS.map((pos) => ({ pos, top: played.filter((p) => p.pos === pos).sort((a, b) => score(b) - score(a)).slice(0, 3) }));
  const surprise = played.filter((p) => p.rk[f] > STARTER_RANK[p.pos]).sort((a, b) => score(b) - score(a))[0];
  const bust = played.filter((p) => p.rk[f] <= (p.pos === "QB" || p.pos === "TE" ? 6 : 12)).sort((a, b) => score(a) - score(b))[0];

  // Busy players scoring below what their work usually earns, and the reverse.
  const values = touchValues(data.players, f);
  const forms = data.players
    .filter((p) => p.pos !== "QB" && p.g.some((g) => g.w >= week - 1))
    .map((p) => ({ p, form: luck(p, f, values) }))
    .filter((x): x is { p: Player; form: NonNullable<ReturnType<typeof luck>> } => !!x.form && x.form.touches >= 6);
  const buyLow = [...forms].filter((x) => x.form.diff < 0 && (x.form.snap ?? 100) >= 55).sort((a, b) => a.form.diff - b.form.diff).slice(0, 5);
  const sellHigh = [...forms].filter((x) => x.form.diff > 0).sort((a, b) => b.form.diff - a.form.diff).slice(0, 5);
  return { week, at, score, byPos, surprise, bust, buyLow, sellHigh };
}
