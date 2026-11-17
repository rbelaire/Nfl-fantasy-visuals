# Fantasy Pulse

NFL fantasy performances, visualized. Look up any quarterback, running back, receiver or tight end and see his season as a heartbeat.

## What's in it

- **Player pages** (`/player/[id]`): season heartbeat, weekly positional finishes, where the points come from, workload against output, game log, and a downloadable trading card.
- **Compare** (`/compare?a=&b=`): a tale of the tape for any two players. The URL is shareable.
- **Tier skyline** (`/tiers`): each position by points per game, split at the biggest drop-offs.
- **Season race** (`/race`): animated running totals, week by week.
- **Heartbeat twins** (on every player page): the five past seasons since 2012 whose opening games looked most like this one, drawn through to the end of the year.
- **Points allowed** (`/defense`): a heat map of what every defense gives up to each position, week by week, with next week's opponents.
- **Workload watch** (home page): buy-low and sell-high lists comparing each player's last 3 games with what his targets and carries usually earn. Snap share comes from nflverse snap counts.
- **Share images**: every page has a downloadable image that also shows as the link preview (`/api/og/week`, `/api/og/compare`, `/api/og/tiers`, `/api/og/defense`, `/api/card/[id]`).
- **Who should I start?** (`/start?p=id,id,id`): two or three players for next week, with a lean built from the last 3 games, what that workload usually earns, the season average and the opponent's points allowed. Every input is shown.
- **Daily guess** (`/guess`): name the mystery player from his heartbeat. Same player for everyone each day, with puzzle numbers, streaks, win stats and a result grid to paste into a group chat. History stays in the visitor's browser.
- **Analytics**: Vercel Web Analytics (`@vercel/analytics`). Turn it on under the project's Analytics tab in Vercel.
- **Scoring toggle**: Standard, Half-PPR or PPR, remembered per visitor.

## Data

Stats come from the open [nflverse](https://github.com/nflverse/nflverse-data) project. `scripts/build-data.mjs` downloads the weekly player stats and writes one compact file, `public/data/season.json`.

- `npm run data` refreshes it by hand. `SEASON=2025 npm run data` builds another year.
- It also runs before every build, and keeps the committed snapshot if the download fails.
- `.github/workflows/refresh-data.yml` runs it daily and commits when the numbers change, which redeploys the site.

`scripts/build-history.mjs` (`npm run history`) builds `public/data/history.json`, the past seasons used for heartbeat twins. Run it once each offseason to add the season that just ended.

No database or API keys are needed.

## Run it

```bash
npm install
npm run dev
```

Deploy by importing the repo into Vercel with the default Next.js settings.

## Stack

Next.js (App Router), Tailwind CSS, hand-drawn SVG charts with no chart library. Player pages are statically generated; the trading card is rendered on demand by `app/api/card/[id]/route.tsx`.

Player photos and team logos are deliberately left out. Jersey-number badges in team colors stand in for them.
