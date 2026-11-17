import type { NextRequest } from "next/server";
import { playerById, season } from "@/lib/data";
import { C, Pulse, frame } from "@/lib/og";
import { fmt1, parseFmt, ppg, pts, total } from "@/lib/scoring";
import { team } from "@/lib/teams";
import type { Player } from "@/lib/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const f = parseFmt(q.get("s"));
  const a = playerById.get(q.get("a") ?? ""), b = playerById.get(q.get("b") ?? "");
  if (!a || !b) return new Response("Pick two players", { status: 404 });
  const beats = (p: Player) => Array.from({ length: season.week }, (_, i) => { const g = p.g.find((x) => x.w === i + 1); return g ? pts(g, f) : null; });
  const top = Math.max(10, ...[a, b].flatMap((p) => p.g.map((g) => pts(g, f)))) * 1.08;
  const side = (p: Player, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", width: 22, height: 6, borderRadius: 3, background: color, marginRight: 10 }} />
        <div style={{ display: "flex", fontSize: 22, color: C.mute }}>{p.pos}, {team(p.team).name}</div>
      </div>
      <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 50, lineHeight: 1.05, marginTop: 4 }}>{p.name}</div>
      <Pulse values={beats(p)} w={520} h={150} color={color} top={top} line={season.line[p.pos][f]} />
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        {[["Points", fmt1(total(p, f))], ["Per game", fmt1(ppg(p, f))], ["Rank", `${p.pos}${p.rk[f]}`]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", flex: 1, background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 12, padding: "8px 12px" }}>
            <div style={{ display: "flex", fontSize: 18, color: C.mute }}>{k}</div>
            <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 38 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
  return frame("Tale of the tape", (
    <div style={{ display: "flex", width: "100%", gap: 40 }}>
      {side(a, C.s1)}
      {side(b, C.s2)}
    </div>
  ), f);
}
