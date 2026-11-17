import type { Metadata } from "next";
import { Suspense } from "react";
import { DefenseView } from "@/components/DefenseView";

export async function generateMetadata({ searchParams }: PageProps<"/defense">): Promise<Metadata> {
  const pos = (await searchParams).pos;
  const p = typeof pos === "string" && ["QB", "RB", "WR", "TE"].includes(pos) ? pos : "WR";
  return {
    title: "Points allowed by defense",
    description: "A heat map of the fantasy points every NFL defense has allowed to quarterbacks, running backs, receivers and tight ends, week by week, with next week's matchups.",
    openGraph: { images: [`/api/og/defense?pos=${p}`] },
  };
}

export default function Page() {
  return <Suspense fallback={<p className="py-10 text-mute">Loading defenses…</p>}><DefenseView /></Suspense>;
}
