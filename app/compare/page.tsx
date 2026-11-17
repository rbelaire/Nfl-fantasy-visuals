import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { playerById } from "@/lib/data";

const description = "Put any two NFL players side by side: total points, weekly scores, startable weeks and where their fantasy points come from.";

export async function generateMetadata({ searchParams }: PageProps<"/compare">): Promise<Metadata> {
  const q = await searchParams;
  const a = typeof q.a === "string" ? playerById.get(q.a) : undefined;
  const b = typeof q.b === "string" ? playerById.get(q.b) : undefined;
  if (!a || !b) return { title: "Compare two players", description };
  return {
    title: `${a.name} vs ${b.name}`,
    description,
    openGraph: { images: [`/api/og/compare?a=${a.id}&b=${b.id}`] },
  };
}

export default function Page() {
  return <Suspense fallback={<p className="py-10 text-mute">Loading players…</p>}><CompareView /></Suspense>;
}
