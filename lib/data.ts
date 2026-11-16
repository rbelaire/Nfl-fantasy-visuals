import raw from "@/public/data/season.json";
import type { Season } from "./types";

/** Server-side access to the season snapshot built by scripts/build-data.mjs. */
export const season = raw as unknown as Season;
export const playerById = new Map(season.players.map((p) => [p.id, p]));
