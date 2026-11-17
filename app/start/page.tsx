import type { Metadata } from "next";
import { Suspense } from "react";
import { StartView } from "@/components/StartView";

export const metadata: Metadata = {
  title: "Who should I start?",
  description: "Put two or three NFL players side by side for next week: recent form, workload, season average and matchup, with a simple lean on who to start.",
};

export default function Page() {
  return <Suspense fallback={<p className="py-10 text-mute">Loading players…</p>}><StartView /></Suspense>;
}
