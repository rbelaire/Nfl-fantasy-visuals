import { ImageResponse } from "next/og";
import { fonts } from "@/lib/og";
import type { NextRequest } from "next/server";
import { playerById, season } from "@/lib/data";
import { ANATOMY_PARTS, FMT_LABEL, anatomy, archetype, fmt1, parseFmt, ppg, pts, rarity, total } from "@/lib/scoring";
import { team } from "@/lib/teams";

const W = 600, H = 840;
const SERIES = ["#4a94ee", "#e0632f", "#1fae7c", "#c98500", "#dc5f8d"];

export async function GET(req: NextRequest, ctx: RouteContext<"/api/card/[id]">) {
  const { id } = await ctx.params;
  const p = playerById.get(id);
  if (!p) return new Response("No such player", { status: 404 });
  const f = parseFmt(req.nextUrl.searchParams.get("s"));
  const t = team(p.team), rare = rarity(p, f);

  // Heartbeat trace
  const cw = 520, ch = 130, weeks = season.week, step = cw / weeks;
  const by = new Map(p.g.map((g) => [g.w, pts(g, f)]));
  const top = Math.max(10, ...by.values()) * 1.1, base = ch - 12;
  const yv = (v: number) => base - (Math.max(v, 0) / top) * (base - 8);
  let d = `M0,${base}`;
  const dots: { x: number; y: number; hit: boolean }[] = [];
  const starter = season.line[p.pos][f];
  for (let w = 1; w <= weeks; w++) {
    const v = by.get(w), cx = step * (w - 0.5);
    if (v == null) continue;
    d += ` L${cx - step * 0.2},${base} L${cx - step * 0.1},${base + 4} L${cx},${yv(v)} L${cx + step * 0.1},${base + 7} L${cx + step * 0.2},${base}`;
    dots.push({ x: cx, y: yv(v), hit: v >= starter });
  }
  d += ` L${cw},${base}`;

  const a = anatomy(p.g, f);
  const parts = ANATOMY_PARTS.map((x, i) => ({ label: x.label, v: Math.max(0, a[x.key]), color: SERIES[i] })).filter((x) => x.v > 0.05);
  const sum = parts.reduce((s, x) => s + x.v, 0) || 1;
  const best = Math.max(...by.values());
  const stats = [
    ["Points", fmt1(total(p, f))],
    ["Per game", fmt1(ppg(p, f))],
    ["Rank", `${p.pos}${p.rk[f]}`],
    ["Best week", fmt1(best)],
  ];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0b1730", color: "#eef2f9", fontFamily: "Barlow", border: `10px solid ${rare.color}`, borderRadius: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", background: t.color, padding: "26px 30px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 14, top: -50, fontFamily: "Shoulders", fontSize: 300, lineHeight: 1, color: "rgba(255,255,255,0.2)", display: "flex" }}>{p.num ?? ""}</div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.92)" }}>{p.pos}, {t.name}</div>
          <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: p.name.length > 18 ? 62 : 78, lineHeight: 1, marginTop: 56, color: "#fff", textShadow: "0 2px 0 rgba(0,0,0,0.3)" }}>{p.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 30px 0", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 40 }}>{archetype(p)}</div>
            <div style={{ display: "flex", background: rare.color, color: "#0b1730", fontSize: 24, padding: "4px 14px", borderRadius: 8 }}>{rare.name}</div>
          </div>
          <div style={{ display: "flex", marginTop: 18, gap: 12 }}>
            {stats.map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", flex: 1, background: "#13213f", border: "1px solid #2a3f6e", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ display: "flex", fontSize: 19, color: "#b4c1dc" }}>{k}</div>
                <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 44, lineHeight: 1.05 }}>{v}</div>
              </div>
            ))}
          </div>
          <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} style={{ marginTop: 22 }}>
            <path d={`M0,${yv(starter)} L${cw},${yv(starter)}`} stroke="#ffd23f" strokeWidth={2} strokeDasharray="6 6" fill="none" />
            <path d={d} stroke="#eef2f9" strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {dots.map((o, i) => (
              <circle key={i} cx={o.x} cy={o.y} r={6} fill={o.hit ? "#ffd23f" : "#0b1730"} stroke={o.hit ? "#0b1730" : "#eef2f9"} strokeWidth={2.5} />
            ))}
          </svg>
          <div style={{ display: "flex", height: 22, marginTop: 20, borderRadius: 6, overflow: "hidden" }}>
            {parts.map((x) => (
              <div key={x.label} style={{ display: "flex", width: `${(x.v / sum) * 100}%`, background: x.color, marginRight: 2 }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10, fontSize: 19, color: "#b4c1dc" }}>
            {parts.filter((x) => x.v / sum >= 0.02).map((x) => (
              <div key={x.label} style={{ display: "flex", alignItems: "center", marginRight: 18, marginBottom: 4 }}>
                <div style={{ display: "flex", width: 12, height: 12, borderRadius: 3, background: x.color, marginRight: 6 }} />
                {x.label} {Math.round((x.v / sum) * 100)}%
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 30px 20px", fontSize: 19, color: "#8a9cc0" }}>
          <div style={{ display: "flex" }}>Fantasy Pulse</div>
          <div style={{ display: "flex" }}>{season.season} through week {season.week}, {FMT_LABEL[f]}</div>
        </div>
      </div>
    ),
    {
      width: W, height: H,
      fonts: await fonts(),
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
