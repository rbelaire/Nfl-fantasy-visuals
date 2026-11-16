export interface Team { name: string; conf: "AFC" | "NFC"; div: "East" | "North" | "South" | "West"; color: string }
const t = (name: string, conf: Team["conf"], div: Team["div"], color: string): Team => ({ name, conf, div, color });
/** Colors are lightened where needed so they stay visible on the navy background. */
export const TEAMS: Record<string, Team> = {
  ARI: t("Arizona", "NFC", "West", "#c8234a"), ATL: t("Atlanta", "NFC", "South", "#d32f3f"),
  BAL: t("Baltimore", "AFC", "North", "#7b5fd6"), BUF: t("Buffalo", "AFC", "East", "#2f6fd6"),
  CAR: t("Carolina", "NFC", "South", "#1b9fd8"), CHI: t("Chicago", "NFC", "North", "#e2622a"),
  CIN: t("Cincinnati", "AFC", "North", "#fb5a1f"), CLE: t("Cleveland", "AFC", "North", "#e8601c"),
  DAL: t("Dallas", "NFC", "East", "#8fa3bf"), DEN: t("Denver", "AFC", "West", "#fb5a1f"),
  DET: t("Detroit", "NFC", "North", "#2f8fd6"), GB: t("Green Bay", "NFC", "North", "#f2b81e"),
  HOU: t("Houston", "AFC", "South", "#c8234a"), IND: t("Indianapolis", "AFC", "South", "#3a76c9"),
  JAX: t("Jacksonville", "AFC", "South", "#1f9aa3"), KC: t("Kansas City", "AFC", "West", "#e3323f"),
  LA: t("LA Rams", "NFC", "West", "#3a66d6"), LAC: t("LA Chargers", "AFC", "West", "#2ba3e8"),
  LV: t("Las Vegas", "AFC", "West", "#a5acaf"), MIA: t("Miami", "AFC", "East", "#1fa9a3"),
  MIN: t("Minnesota", "NFC", "North", "#8457d6"), NE: t("New England", "AFC", "East", "#d32f3f"),
  NO: t("New Orleans", "NFC", "South", "#d3bc8d"), NYG: t("NY Giants", "NFC", "East", "#3a5fd6"),
  NYJ: t("NY Jets", "AFC", "East", "#2f9a6a"), PHI: t("Philadelphia", "NFC", "East", "#1f8a80"),
  PIT: t("Pittsburgh", "AFC", "North", "#f2b81e"), SEA: t("Seattle", "NFC", "West", "#69be28"),
  SF: t("San Francisco", "NFC", "West", "#c8323a"), TB: t("Tampa Bay", "NFC", "South", "#d5343a"),
  TEN: t("Tennessee", "AFC", "South", "#4b92db"), WAS: t("Washington", "NFC", "East", "#b0304a"),
};
export const team = (abbr: string): Team => TEAMS[abbr] ?? { name: abbr, conf: "AFC", div: "East", color: "#8fa3bf" };
