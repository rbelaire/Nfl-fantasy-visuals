import type { NextRequest } from "next/server";
import { season } from "@/lib/data";
import { C, frame } from "@/lib/og";
import { POSITIONS, fmt1, parseFmt } from "@/lib/scoring";
import { TIER_RAMP, buildTiers } from "@/lib/tiers";
import type { Pos } from "@/lib/types";

const NAMES = { QB: "quarterback", RB: "running back", WR: "receiver", TE: "tight end" };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const f = parseFmt(q.get("s"));
  const pos = (POSITIONS.includes(q.get("pos") as Pos) ? q.get("pos") : "RB") as Pos;
  const groups = buildTiers(season.players, pos, f, season.week, pos === "QB" || pos === "TE" ? 16 : 24);
  const max = groups[0]?.[0]?.v || 1;
  const count = groups.reduce((t, g) => t + g.length, 0);
  const bw = Math.floor((1104 - groups.length * 18) / count) - 3;
  return frame(`The ${NAMES[pos]} skyline`, (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 250 }}>
        {groups.map((g, t) => (
          <div key={t} style={{ display: "flex", alignItems: "flex-end", gap: 3, borderBottom: `3px solid ${TIER_RAMP[t]}` }}>
            {g.map(({ p, v }) => <div key={p.id} style={{ display: "flex", width: bw, height: Math.max(8, (v / max) * 236), background: TIER_RAMP[t], borderRadius: "4px 4px 0 0" }} />)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 18, gap: 14 }}>
        {groups.slice(0, 4).map((g, t) => (
          <div key={t} style={{ display: "flex", flexDirection: "column", width: 255 }}>
            <div style={{ display: "flex", alignItems: "center", fontFamily: "Shoulders", fontSize: 28 }}>
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 3, background: TIER_RAMP[t], marginRight: 8 }} />
              Tier {t + 1}
            </div>
            <div style={{ display: "flex", fontSize: 19, color: C.mute, lineHeight: 1.3 }}>
              {g.slice(0, 4).map(({ p }) => p.name.split(" ").slice(-1)[0]).join(", ")}{g.length > 4 ? ` and ${g.length - 4} more` : ""}
            </div>
            <div style={{ display: "flex", fontSize: 19, color: C.dim }}>{fmt1(g[g.length - 1].v)} to {fmt1(g[0].v)} a game</div>
          </div>
        ))}
      </div>
    </div>
  ), f, "Points per game. Gaps mark the real drop-offs.");
}
