import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ScoringProvider } from "@/components/Scoring";
import { season } from "@/lib/data";

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title: { default: "Fantasy Pulse: NFL fantasy performances, visualized", template: "%s | Fantasy Pulse" },
  description: "See any NFL player's fantasy season as a heartbeat. Weekly scores, boom-or-bust weeks, where the points come from, and head-to-head comparisons.",
};
export const viewport: Viewport = { themeColor: "#0b1730" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="yardlines flex min-h-full flex-col">
        <ScoringProvider>
          <Header />
          <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 pb-16 pt-6">{children}</main>
          <footer className="border-t border-rule px-4 py-6 text-center text-sm text-dim">
            {season.season} season through week {season.week}. Stats from the open nflverse project, updated {season.updated}.
            Not affiliated with the NFL or any team.
          </footer>
        </ScoringProvider>
      </body>
    </html>
  );
}
