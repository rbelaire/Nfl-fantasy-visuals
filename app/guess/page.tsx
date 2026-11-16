import type { Metadata } from "next";
import { GuessView } from "@/components/GuessView";

export const metadata: Metadata = {
  title: "Daily guess",
  description: "Name the mystery NFL player from his fantasy heartbeat. Six guesses, a new player every day.",
};
export default function Page() { return <GuessView />; }
