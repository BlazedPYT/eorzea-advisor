# ▶️ Resume here (pick up where we left off)

_Snapshot for restarting your computer. Everything below is committed & pushed —
nothing is lost on restart._

## Where things stand (as of v1.14.0)
- **Project:** `C:\Users\dcmlk\OneDrive\Desktop\FFXIV Eorzea Advisor`
- **Current version:** `1.14.0` — committed, pushed to `main`, and **published** as the
  latest GitHub release. Local = remote (clean tree).
- **GitHub repo:** https://github.com/BlazedPYT/eorzea-advisor (public)
- **App:** Next.js 14 + Electron desktop app + web build. "Eorzea Advisor" — a cozy
  FFXIV companion. Founder credit: **Daniel**. Demo character: **Aria Lumenfield**.

## ✅ What's built (feature tour)
- Character profile + **gear advisor** (live Market Board pricing, any job/level)
- **Leveling**: queues/roulettes + route; **Food** buff reminder; **Gil** warnings
- **Market Board**: item search (icons), cross-world cheapest, sale velocity, tax;
  **Marketplace settings** (home world, language, timezone, include-tax, hide-cents, left-nav)
- **Daily/weekly checklist** + **live reset clocks** (daily 15:00 UTC, weekly Tue 08:00 UTC)
- **Locator**: search any monster/NPC/vendor → zone map with ✕ + travel directions;
  **community pins** — for spawns we don't have coords for, players tap the map to pin
  the spot (saved locally + instant) and **Submit to the project** opens a pre-filled
  GitHub issue with a ready-to-merge `entries.json` snippet (label `coords`)
- **Leves**: all 1,757; filters, EXP/allowance "best for leveling", required items +
  materials with Market Board links, real craft levels
- **Crafting**: 11 jobs, EXP-to-next, best method + full route, **craft-by-level route**,
  **total-materials shopping list** for a level range
- **Macros**: build a rotation → ready-to-paste FFXIV macros (Teamcraft wait/15-line logic)
- **Mounts & Minions**: images, sources + entry level, live price, in-app YouTube,
  sort + Load more / Show all
- **News**: live Lodestone headlines + maintenance highlight
- **Dashboard**: searchable, tabbed, **split view**, dark mode, **backup codes**
  (export/import), **PWA** (installable + offline), **Share**, tab deep-links (`/#mounts`)
- **Experience tiers** (v1.14): Beginner→Intermediate→Experienced→Veteran→Endgame, set
  in the profile (level picks a default, user overrides). Drives tone/hand-holding
  (veterans get a terser dashboard), the default tab, and what-next advice.
- **Endgame (100+) section** (v1.14): tomestone gearing, raid→savage, extremes/unreal,
  relics & hunts, plus a weekly endgame checklist (auto-resets Tue 08:00 UTC).
- **My Board** (v1.14): free-form, drag + resize dashboard (`react-grid-layout`) — pick
  which sections show as panels, arrange them, layout saved per device.
- **Desktop**: launcher, fixed port 47591 (persistent localStorage), single-instance,
  **auto-update** via GitHub Releases + GitHub Action on version tags

## 🔑 Key commands
```bash
npm install                 # first time after a fresh clone/restart
npm run dev                 # web dev server (localhost:3000)
npm run desktop:dev         # electron + dev server
npm run desktop:build       # build the installer into "CLIENT FOR HALP/"
npm run data:bestiary       # refresh bestiary data (on a game patch)
npm run data:leves          # refresh leves data
npm run data:mounts         # refresh mounts/minions data
```
**Always run `rm -rf .next` (delete the `.next` folder) before `npm run dev` or any
build** — OneDrive trips Next's cleanup with an EINVAL/readlink error otherwise.

## 🚀 How to release an update (hands-off)
1. Bump `"version"` in `package.json`.
2. `git commit -am "vX.Y.Z" && git tag vX.Y.Z && git push origin main --tags`
3. The **GitHub Action** builds + publishes the release automatically; everyone's
   desktop app auto-updates. (See `PUBLISHING.md`.)

## ⏳ Pending / your move
- **Deploy the web version on Vercel** (4 clicks, free, full features) — see
  `DEPLOY-WEB.md`. Repo is ready; the PWA/Share shine on the live HTTPS site.
- After deploying, optionally add the Vercel URL into the desktop launcher.

## 🔭 Next feature (we picked Mobile/PWA — done). Good follow-ups:
- **Gatherer node maps + unspoiled/ephemeral timers + Eorzea weather clock** (sticky)
- **Crafting profit calculator** (live "what's worth crafting to sell")
- **Collection tracker** (mark mounts/minions owned)
- Full backlog in **`IDEAS.md`**.

## 🧰 Gotchas (so a fresh session doesn't relearn them)
- OneDrive + `.next`: delete `.next` before dev/build (readlink EINVAL).
- electron-builder once needed a one-time winCodeSign workaround on this machine
  (already applied; builds work now). See `PUBLISHING.md`.
- Desktop uses a **fixed port (47591)** so localStorage (theme/profile/settings) persists.
- `electron-updater` must stay in **dependencies** (not dev) so it's bundled.
- GitHub handle is **BlazedPYT** (not derived from the email).

## To continue with Claude after restart
Open this folder and say something like:
> "Read RESUME.md and let's continue — build the gatherer timers + weather clock."
