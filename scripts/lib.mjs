import { execFileSync } from "node:child_process";

export const BASE = "https://github.com/nflverse/nflverse-data/releases/download";
export const POSITIONS = ["QB", "RB", "WR", "TE"];

export async function download(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    // Some environments only allow traffic through a proxy that curl knows about.
    try {
      return execFileSync("curl", ["-sfL", url], { encoding: "utf8", maxBuffer: 1 << 29 });
    } catch {
      throw new Error(`Could not download ${url}: ${err.message}`);
    }
  }
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

export const n = (v) => (v === "" || v === "NA" || v == null ? 0 : Number(v));
export const r2 = (v) => Math.round(v * 100) / 100;
