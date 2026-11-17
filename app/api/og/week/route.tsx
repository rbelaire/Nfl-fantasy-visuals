import type { NextRequest } from "next/server";
import { season } from "@/lib/data";
import { C, Pulse, frame } from "@/lib/og";
import { fmt1, parseFmt, pts } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { weekSummary } from "@/lib/week";

const NAMES = { QB: "Quarterbacks", RB: "Running backs", WR: "Receivers", TE: "Tight ends" };

export async function GET(req: NextRequest) {
  const f = parseFmt(req.nextUrl.searchParams.get("s"));
  const w = weekSummary(season, f);
  const beat = (id: string) => {
    const p = season.players.find((x) => x.id === id)!;
    return Array.from({ length: season.week }, (_, i) => { const g = p.g.find((x) => x.w === i + 1); return g ? pts(g, f) : null; });
  };
  return frame(`Week ${w.week} in one picture`, (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ display: "flex", gap: 16 }}>
        {w.byPos.map(({ pos, top }) => (
          <div key={pos} style={{ display: "flex", flexDirection: "column", flex: 1, background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mute }}>{NAMES[pos]}</div>
            {top[0] && <Pulse values={beat(top[0].id)} w={232} h={64} color={team(top[0].team).color} />}
            {top.map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: i ? 6 : 8 }}>
                <div style={{ display: "flex", fontSize: i ? 22 : 26, color: i ? C.mute : C.chalk, maxWidth: 170, overflow: "hidden" }}>{p.name}</div>
                <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: i ? 28 : 36 }}>{fmt1(w.score(p))}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        {[["Out of nowhere", w.surprise], ["Flatline of the week", w.bust]].map(([label, p]) => p && typeof p !== "string" && (
          <div key={label as string} style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 14, padding: "12px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 20, color: C.mute }}>{label as string}</div>
              <div style={{ display: "flex", fontSize: 28 }}>{p.name}, {p.pos} {p.team}</div>
            </div>
            <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 44 }}>{fmt1(w.score(p))}</div>
          </div>
        ))}
      </div>
    </div>
  ), f);
}
