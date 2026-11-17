"use client";
import type { Fmt, Player } from "@/lib/types";
import { fmt1, pts } from "@/lib/scoring";

export function GameLog({ player, fmt }: { player: Player; fmt: Fmt }) {
  const qb = player.pos === "QB", rb = player.pos === "RB";
  const cols = qb
    ? ["Cmp/Att", "Pass yds", "Pass TD", "Int", "Rush yds", "Rush TD"]
    : rb ? ["Carries", "Rush yds", "Rush TD", "Targets", "Rec", "Rec yds", "Rec TD"]
    : ["Targets", "Rec", "Rec yds", "Rec TD", "Carries", "Rush yds"];
  return (
    <div className="overflow-x-auto">
      <table className="stat w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-mute">
            <th className="py-2 pr-3 font-medium">Week</th>
            <th className="py-2 pr-3 font-medium">Opp</th>
            <th className="py-2 pr-3 text-right font-medium">Points</th>
            <th className="py-2 pr-3 text-right font-medium">Finish</th>
            <th className="py-2 pr-3 text-right font-medium">Snaps</th>
            {cols.map((c) => <th key={c} className="py-2 pl-3 text-right font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {player.g.map((g) => {
            const cells = qb
              ? [`${g.cmp}/${g.att}`, g.py, g.ptd, g.int, g.ry, g.rtd]
              : rb ? [g.car, g.ry, g.rtd, g.tgt, g.rec, g.recy, g.rectd]
              : [g.tgt, g.rec, g.recy, g.rectd, g.car, g.ry];
            return (
              <tr key={g.w} className="border-b border-rule/50">
                <td className="py-1.5 pr-3">{g.w}</td>
                <td className="py-1.5 pr-3 text-mute">{g.opp}</td>
                <td className="py-1.5 pr-3 text-right font-semibold">{fmt1(pts(g, fmt))}</td>
                <td className="py-1.5 pr-3 text-right text-mute">{player.pos}{g.rk[fmt]}</td>
                <td className="py-1.5 pr-3 text-right text-mute">{g.sn != null ? `${g.sn}%` : "–"}</td>
                {cells.map((c, i) => <td key={i} className="py-1.5 pl-3 text-right">{c}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
