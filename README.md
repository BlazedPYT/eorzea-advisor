# 🎀 Eorzea Advisor

A cute, modern, cozy **Final Fantasy XIV companion app**. Tell it your character —
job, level, gil, world, story-skip status and goal — and it recommends what gear to
buy, what food to eat, what to queue, what Market Board items are worth it, and what
gil traps to avoid.

Works for **any combat job and any level** (not just the demo Scholar 54). It is
built around real FFXIV reality: it tracks your **combat level, job, MSQ progression,
story-skip status, dungeon unlocks, item level and gil separately**, so a player who
used a story skip but has a low-level job gets correct advice.

> Gilbo, the lavender advisor sprite, is original art — no official FFXIV names,
> art, or assets are used.

## ✨ Features

- **Character Profile Setup** — job/class, level, gil, world, expansion access, MSQ
  status (incl. every story-skip tier), goal and playstyle.
- **Lodestone Gear Sync** — paste a Lodestone URL or use name + world to read your
  **public** equipped gear. Clearly flagged as a possibly-stale snapshot; fully
  overridable. No plugins, no memory readers — 100% within the FFXIV third-party rules.
- **Manual Character Mode** — enter everything by hand if Lodestone fails.
- **Dynamic Gear Advisor** — for any job + level it detects your role, resolves the
  right gear per slot from XIVAPI game data, and prices it live via Universalis with
  Buy / Skip / Later / Replace-soon / Goblin-tax / Worth-it labels.
- **Dynamic Leveling Advisor** — Daily Leveling Roulette first, the highest useful
  leveling dungeon, Wondrous Tails, Allied Society dailies, cheap EXP food, and a big
  **“What should I do next?”** card with one clear action.
- **Story-Skip Logic** — if your story is ahead of your job level, it says so and
  filters advice to what your job can actually do now.
- **Market Board pricing**, **Food advisor**, **gil-saving warnings**, **luxury /
  glam / mount** suggestions, and a disabled **“Screenshot Gear Import”** preview.

## 🖥️ Desktop app (.exe for your friends)

Eorzea Advisor ships as a one-click Windows installer with **built-in auto-updates** —
no command line for your friends. Build it with:

```bash
npm run desktop:build
```

The installer appears in the **`CLIENT FOR HALP/`** folder:

```
CLIENT FOR HALP/Eorzea Advisor Setup 1.0.0.exe   ← send this to friends
```

When you ship a new version, friends' apps detect it (GitHub Releases) and show an
in-app **"Update ready → Update now"** banner. Full instructions — including the
one-time GitHub setup and the publish command — are in **[PUBLISHING.md](PUBLISHING.md)**.

For local desktop development with hot reload: `npm run desktop:dev`.

## 🧰 Tech stack

- **Next.js 14** (App Router, `standalone` output) + **TypeScript**
- **Tailwind CSS** (cozy glassy theme, dark mode, framer-motion animations)
- **Electron** + **electron-builder** (installer) + **electron-updater** (auto-update)
- A tiny **JSON file store** for the saved profile (no native DB to bundle)
- Server API routes for Lodestone sync, gear advice and pricing
- **XIVAPI v2** — static game data (item names, item levels, equip slots, job/level)
- **Universalis** — live Market Board: cross-world cheapest price + which world, sale
  velocity, last-sale, and per-city tax rates (the real "goblin tax")
- **Lodestone** — public character gear snapshots (HTML, read-only)

## 🚀 Setup

```bash
# 1. install
npm install

# 2. run the web app
npm run dev
# open http://localhost:3000
```

No API keys or database setup are required — XIVAPI v2 and Universalis are keyless, and
the single saved profile is kept in a small JSON file (`./data/eorzea.json` in dev, or
`%AppData%\eorzea-advisor\eorzea.json` in the desktop app). Tap **🎀 Demo** in the app to
load the Scholar-54 example.

### Handy scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the web dev server |
| `npm run build` / `npm start` | Production web build / serve |
| `npm run desktop:dev` | Run the Electron desktop app with hot reload |
| `npm run desktop:build` | Build the Windows installer into `CLIENT FOR HALP/` |
| `npm run desktop:publish` | Build + publish an auto-update to GitHub Releases |

## 🗂️ Project structure

```
electron/
  main.js                  # spawns the bundled Next server, opens window, auto-update
  preload.js               # exposes window.eorzea (update bridge) to the UI
scripts/
  assemble-standalone.mjs  # copies public/ + static into the standalone bundle
src/
  app/
    page.tsx               # main dashboard / setup flow (client)
    layout.tsx, globals.css
    api/
      profile/route.ts        # save/load the profile (JSON file store)
      lodestone/route.ts      # public Lodestone gear sync
      advisor/gear/route.ts   # resolve gear (XIVAPI) + price (Universalis)
      universalis/tax/route.ts# live Market Board tax rates
  components/               # CharacterCard, GearSlotCard, JobSelector,
                            # LevelSelector, PriceDisplay, RecLabelChip,
                            # ProfileForm, GearAdvisor, AdviceSections, MarketTax,
                            # UpdateBanner, Mascot…
  lib/
    types.ts               # domain types
    jobs.ts                # every job → role + Market Board stat suffix
    brackets.ts            # level brackets + Poetics catch-up + iLvl estimate
    dungeons.ts            # leveling dungeons by unlock level
    advisor.ts             # queue / route / story / gil / food / what-next engine
    gear.ts                # dynamic per-slot gear engine + price judgement
    xivapi.ts              # XIVAPI v2 client (static data)
    universalis.ts         # Universalis client (cross-world price, velocity, tax)
    lodestone.ts           # public Lodestone parser
    store.ts               # tiny JSON profile store
    food.ts, labels.ts, demo.ts
CLIENT FOR HALP/           # built installer output (send the Setup .exe to friends)
```

## ⚠️ FFXIV data caveats

- **There is no official live gear API.** Lodestone only updates when a character
  logs out, so a synced snapshot can be hours/days old — the app says so and lets you
  override every slot.
- The dynamic gear engine resolves real, priceable items for armor/accessories. For
  **Poetics-cap levels** (50/60/70/80/90) it tells you to use tomestones instead of
  gil, and for early levels it points you at free dungeon drops — which is the correct
  in-game advice, not a missing feature.
- Item-level estimates are approximate (FFXIV item levels are non-linear).

## 🔮 Roadmap

- Screenshot Gear Import (read your Character window from an image — a safer
  alternative to a plugin). Placeholder is visible but disabled.
- Per-world vs. cross-DC price shopping toggle.
- Glamour wardrobe planner.
