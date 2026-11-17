import type { Season } from "./types";
import { waiverPicks, type Pickup } from "./waivers";
import { team } from "./teams";

export const SITE = "https://fantasypulse.pro";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** This week's picks: the five best overall, then the best remaining at each position. */
export function emailPicks(data: Season) {
  const all = waiverPicks(data, 1, 12);
  const top = all.slice(0, 5);
  const used = new Set(top.map((x) => x.p.id));
  const byPos = (["QB", "RB", "WR", "TE"] as const)
    .map((pos) => all.find((x) => x.p.pos === pos && !used.has(x.p.id)))
    .filter((x): x is Pickup => !!x);
  return { top, byPos };
}

/** The weekly email. `unsubscribe` is the person's own one-click link. */
export function waiverEmail(data: Season, unsubscribe: string, address: string) {
  const wk = data.next?.week ?? data.week + 1;
  const { top, byPos } = emailPicks(data);
  const subject = top[0] ? `Week ${wk} waivers: ${top[0].p.name} leads the list` : `Week ${wk} waiver picks`;
  const card = (x: Pickup, i?: number) => `
    <tr><td style="padding:14px 0;border-top:1px solid #e3e8f2">
      <div style="font-size:12px;color:#5b6b8c;margin-bottom:2px">${i != null ? `#${i + 1} &middot; ` : ""}${x.p.pos}, ${esc(team(x.p.team).name)}</div>
      <a href="${SITE}/player/${x.p.id}" style="font-size:20px;font-weight:700;color:#0b1730;text-decoration:none">${esc(x.p.name)}</a>
      <div style="margin:6px 0 4px">
        <span style="display:inline-block;font-size:12px;padding:2px 8px;border-radius:4px;background:#eef2f9;color:#13213f">${x.tag}</span>
        <span style="display:inline-block;font-size:12px;padding:2px 8px;border-radius:4px;background:${x.startable ? "#d6f3e8;color:#0d5c40" : "#eef2f9;color:#5b6b8c"}">${x.startable ? `Can start in week ${wk}` : "For the bench"}</span>
      </div>
      <div style="font-size:15px;line-height:1.45;color:#2a3550">${x.reasons.slice(0, 2).map(esc).join(" ")}</div>
    </td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#eef2f9">
<div style="display:none;max-height:0;overflow:hidden">${esc(top.slice(0, 3).map((x) => x.p.name).join(", "))} and more for week ${wk}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f9"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <tr><td style="background:#0b1730;border-radius:10px 10px 0 0;padding:20px 24px">
    <div style="color:#ffd23f;font-size:14px;font-weight:700;letter-spacing:.02em">FANTASY PULSE</div>
    <div style="color:#ffffff;font-size:28px;font-weight:800;line-height:1.15;margin-top:6px">Week ${wk} waiver picks</div>
    <div style="color:#b4c1dc;font-size:15px;margin-top:6px">The best players likely to be free in a 12-team league, and why.</div>
  </td></tr>
  <tr><td style="background:#ffffff;padding:8px 24px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 0 2px;font-size:13px;font-weight:700;color:#5b6b8c">TOP PICKUPS</td></tr>
      ${top.map((x, i) => card(x, i)).join("")}
      ${byPos.length ? `<tr><td style="padding:18px 0 2px;font-size:13px;font-weight:700;color:#5b6b8c">BEST OF THE REST, BY POSITION</td></tr>${byPos.map((x) => card(x)).join("")}` : ""}
    </table>
  </td></tr>
  <tr><td style="background:#ffffff;padding:8px 24px 24px;border-radius:0 0 10px 10px">
    <a href="${SITE}/waivers" style="display:inline-block;background:#ffd23f;color:#0b1730;font-weight:700;font-size:16px;padding:12px 20px;border-radius:6px;text-decoration:none">See the full list</a>
    <p style="font-size:14px;color:#5b6b8c;line-height:1.45;margin:14px 0 0">Some of these may already be taken in your league. On Sleeper? <a href="${SITE}/league" style="color:#256abf">Connect your league</a> and the list shows only players who are actually free.</p>
  </td></tr>
  <tr><td style="padding:16px 24px;font-size:12px;line-height:1.5;color:#5b6b8c;text-align:center">
    You signed up for weekly waiver picks at fantasypulse.pro.<br>
    <a href="${unsubscribe}" style="color:#5b6b8c">Unsubscribe</a> &middot; ${esc(address)}<br>
    Stats from the open nflverse project. Not affiliated with the NFL or any team.
  </td></tr>
</table></td></tr></table></body></html>`;
  const line = (x: Pickup, i?: number) => `${i != null ? `${i + 1}. ` : "- "}${x.p.name} (${x.p.pos}, ${team(x.p.team).name}) - ${x.tag}${x.startable ? `, can start in week ${wk}` : ""}\n   ${x.reasons.slice(0, 2).join(" ")}`;
  const text = `FANTASY PULSE: Week ${wk} waiver picks\n\nTOP PICKUPS\n${top.map((x, i) => line(x, i)).join("\n")}\n\n${byPos.length ? `BEST OF THE REST, BY POSITION\n${byPos.map((x) => line(x)).join("\n")}\n\n` : ""}Full list: ${SITE}/waivers\nOn Sleeper? Connect your league: ${SITE}/league\n\nUnsubscribe: ${unsubscribe}\n${address}\n`;
  return { subject, html, text };
}
