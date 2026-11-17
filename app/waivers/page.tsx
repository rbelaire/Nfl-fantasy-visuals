import type { Metadata } from "next";
import { WaiversView } from "@/components/WaiversView";

export const metadata: Metadata = {
  title: "Who should I pick up?",
  description: "A ranked waiver wire list for NFL fantasy football with the reason for every pickup in plain words. Mark players taken in your league and the next best moves up.",
};
export default function Page() { return <WaiversView />; }
