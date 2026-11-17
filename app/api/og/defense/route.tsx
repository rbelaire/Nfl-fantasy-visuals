import type { NextRequest } from "next/server";
import { season } from "@/lib/data";
import { C, frame } from "@/lib/og";
import { POSITIONS, defenseTable, fmt1, parseFmt } from "@/lib/scoring";
import { team } from "@/lib/teams";
import type { Pos } from "@/lib/types";

const NAMES = { QB: "quarterbacks", RB: "running backs", WR: "receivers", TE: "tight ends" };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const f = parseFmt(q.get("s"));
  const pos = (POSITIONS.includes(q.get("pos") as Pos) ? q.get("pos") : "WR") as Pos;
  const rows = defenseTable(season.defense, pos, f);
  const max = rows[0].avg || 1;
  const col = (label: string, list: typeof rows, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 14, padding: "16px 20px" }}>
      <div style={{ display: "flex", fontFamily: "Shoulders", fontSize: 32 }}>{label}</div>
      {list.map((r) => {
        const opp = season.next?.opp[r.team];
        return (
          <div key={r.team} style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", width: 150, fontSize: 24 }}>{team(r.team).name}</div>
            <div style={{ display: "flex", flex: 1, height: 22 }}>
              <div style={{ display: "flex", width: `${(r.avg / max) * 100}%`, background: color, borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", width: 64, justifyContent: "flex-end", fontFamily: "Shoulders", fontSize: 32 }}>{fmt1(r.avg)}</div>
            {season.next && <div style={{ display: "flex", width: 96, justifyContent: "flex-end", fontSize: 19, color: C.dim }}>{opp ? `${opp.startsWith("@") ? "at" : "vs"} ${opp.replace("@", "")}` : "Bye"}</div>}
          </div>
        );
      })}
    </div>
  );
  return frame(`Points allowed to ${NAMES[pos]}`, (
    <div style={{ display: "flex", gap: 20, width: "100%" }}>
      {col("Softest defenses", rows.slice(0, 6), "#cde2fb")}
      {col("Toughest defenses", rows.slice(-6).reverse(), "#3987e5")}
    </div>
  ), f, `Average per game${season.next ? `, with week ${season.next.week} opponents` : ""}.`);
}
