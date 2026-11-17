import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { season } from "./data";
import { FMT_LABEL } from "./scoring";
import type { Fmt } from "./types";

export const C = {
  field: "#0b1730", panel: "#13213f", rule: "#2a3f6e", chalk: "#eef2f9", mute: "#b4c1dc", dim: "#8a9cc0",
  gold: "#ffd23f", s1: "#4a94ee", s2: "#e0632f", s3: "#1fae7c", s4: "#c98500", s5: "#dc5f8d",
};

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
export async function fonts() {
  const [display, body] = await Promise.all([font("BigShoulders-800.woff"), font("BarlowSemiCondensed-600.woff")]);
  return [
    { name: "Shoulders", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Barlow", data: body, weight: 600 as const, style: "normal" as const },
  ];
}

/** An EKG trace: one spike per value, flat where a value is null. */
export function ekg(values: (number | null)[], w: number, h: number, top?: number) {
  const max = top ?? Math.max(10, ...values.map((v) => v ?? 0)) * 1.08;
  const base = h - 8, step = w / Math.max(values.length, 1);
  const y = (v: number) => base - (Math.max(v, 0) / max) * (base - 6);
  let d = `M0,${base}`;
  const dots: { x: number; y: number; v: number }[] = [];
  values.forEach((v, i) => {
    const cx = step * (i + 0.5);
    if (v == null) return;
    d += ` L${cx - step * 0.2},${base} L${cx - step * 0.1},${base + 3} L${cx},${y(v)} L${cx + step * 0.1},${base + 5} L${cx + step * 0.2},${base}`;
    dots.push({ x: cx, y: y(v), v });
  });
  return { d: d + ` L${w},${base}`, dots, y };
}

export function Pulse({ values, w, h, color = C.chalk, line, top }: { values: (number | null)[]; w: number; h: number; color?: string; line?: number; top?: number }) {
  const { d, dots, y } = ekg(values, w, h, top);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {line != null && <path d={`M0,${y(line)} L${w},${y(line)}`} stroke={C.gold} strokeWidth={2} strokeDasharray="6 6" fill="none" />}
      <path d={d} stroke={color} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {dots.map((o, i) => <circle key={i} cx={o.x} cy={o.y} r={5} fill={line != null && o.v >= line ? C.gold : C.field} stroke={line != null && o.v >= line ? C.field : color} strokeWidth={2.5} />)}
    </svg>
  );
}

/** The shared 1200x630 frame: wordmark, title, body, footer. */
export async function frame(title: string, body: React.ReactNode, f: Fmt, sub?: string) {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: C.field, color: C.chalk, fontFamily: "Barlow", padding: "36px 48px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Shoulders", fontSize: 30 }}>
            <svg width="44" height="26" viewBox="0 0 34 20" style={{ marginRight: 10 }}>
              <path d="M1 12h8l2 3 4-13 4 16 3-6h11" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            Fantasy Pulse
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.dim }}>{season.season} through week {season.week}, {FMT_LABEL[f]}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 64, lineHeight: 1, marginTop: 22 }}>{title}</div>
        {sub && <div style={{ display: "flex", fontSize: 24, color: C.mute, marginTop: 8 }}>{sub}</div>}
        <div style={{ display: "flex", flex: 1, marginTop: 22 }}>{body}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await fonts(), headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
