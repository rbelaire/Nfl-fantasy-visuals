import type { Metadata } from "next";
import { RaceView } from "@/components/RaceView";

export const metadata: Metadata = {
  title: "Season race",
  description: "An animated race of the NFL fantasy scoring leaders, week by week.",
};
export default function Page() { return <RaceView />; }
