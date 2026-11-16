import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = {
  title: "Compare two players",
  description: "Put any two NFL players side by side: total points, weekly scores, startable weeks and where their fantasy points come from.",
};

export default function Page() {
  return <Suspense fallback={<p className="py-10 text-mute">Loading players…</p>}><CompareView /></Suspense>;
}
