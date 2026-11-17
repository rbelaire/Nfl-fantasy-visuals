/** Daily-guess history kept on the visitor's device: date -> guesses used to win, or 0 for a miss. */
export type GuessLog = Record<string, number>;

export const LAUNCH = "2026-11-16";
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (day: string, by: number) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + by); return dayKey(d); };
export const puzzleNumber = (day: string) => Math.round((new Date(`${day}T12:00:00`).getTime() - new Date(`${LAUNCH}T12:00:00`).getTime()) / 86400000) + 1;

export function parseLog(raw: string): GuessLog {
  try { const v = JSON.parse(raw || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

export function stats(log: GuessLog, today: string, max: number) {
  const days = Object.keys(log);
  const wins = days.filter((d) => log[d] > 0).length;
  // Current streak counts back from today, or from yesterday if today is not played yet.
  let cur = 0, d = log[today] != null ? today : shift(today, -1);
  while (log[d] > 0) { cur++; d = shift(d, -1); }
  let best = 0, run = 0;
  for (const day of [...days].sort()) {
    run = log[day] > 0 && (run === 0 || log[shift(day, -1)] > 0) ? run + 1 : log[day] > 0 ? 1 : 0;
    best = Math.max(best, run);
  }
  const dist = Array.from({ length: max }, (_, i) => days.filter((x) => log[x] === i + 1).length);
  return { played: days.length, wins, winPct: days.length ? Math.round((wins / days.length) * 100) : 0, cur, best, dist };
}
