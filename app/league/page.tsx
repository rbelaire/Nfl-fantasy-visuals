import type { Metadata } from "next";
import { LeagueView } from "@/components/LeagueView";

export const metadata: Metadata = {
  title: "Connect your Sleeper league",
  description: "Connect your Sleeper league to see only the players who are free in your league, and start-or-sit picks from your own roster.",
};
export default function Page() { return <LeagueView />; }
