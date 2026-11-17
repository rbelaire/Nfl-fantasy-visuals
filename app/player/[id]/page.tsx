import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerView } from "@/components/PlayerView";
import { playerById, season } from "@/lib/data";
import { team } from "@/lib/teams";
import { touchValues } from "@/lib/scoring";

const values = ([0, 1, 2] as const).map((f) => touchValues(season.players, f));
const known = season.players.map((p) => p.id);

export function generateStaticParams() {
  return season.players.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/player/[id]">): Promise<Metadata> {
  const p = playerById.get((await params).id);
  if (!p) return {};
  const title = `${p.name} fantasy stats, ${season.season}`;
  const description = `${p.name} (${p.pos}, ${team(p.team).name}) week-by-week fantasy points, weekly finishes and scoring breakdown through week ${season.week}.`;
  return { title, description, openGraph: { title, description, images: [`/api/card/${p.id}`] } };
}

export default async function Page({ params }: PageProps<"/player/[id]">) {
  const player = playerById.get((await params).id);
  if (!player) notFound();
  return <PlayerView player={player} week={season.week} line={season.line} season={season.season} defense={season.defense} next={season.next} values={values} known={known} />;
}
