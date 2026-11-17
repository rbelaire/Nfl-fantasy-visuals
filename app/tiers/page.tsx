import type { Metadata } from "next";
import { TiersView } from "@/components/TiersView";

export const metadata: Metadata = {
  title: "Tier skyline",
  description: "NFL fantasy tiers drawn as a skyline: every quarterback, running back, receiver and tight end by points per game, with the drop-offs between tiers marked.",
  openGraph: { images: ["/api/og/tiers?pos=RB"] },
};
export default function Page() { return <TiersView />; }
