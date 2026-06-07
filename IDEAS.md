# 💡 Eorzea Advisor — ideas backlog

The app already covers a LOT: profile + gear advisor, leveling/queues/route, food,
gil warnings, full Market Board (search, cross‑world prices, tax), daily/weekly
checklist, Locator (mobs/NPCs/vendors with maps + travel), Leves (with materials +
Market Board), Crafting (route, EXP, shopping list), Macro maker, Mounts & Minions
(images, sources, level, price, in‑app video), split view, dark mode, settings,
auto‑update, and a web build.

Below are ideas to grow it, roughly sized **S/M/L** and grouped by theme.

## 🥇 High‑value quick wins (do next)
- **Export / Import backup code** (S) — copy a code to move profile + settings to
  another device/browser without accounts.
- **Live reset clock widget** (S) — daily (15:00 UTC) + weekly (Tue 08:00 UTC)
  countdowns pinned near the top; ties into the checklist.
- **Copy shopping list + gil total** (S) — on the crafting mats list, a "copy all"
  button and a live total cost using Market Board prices.
- **Eorzea time + weather clock** (M) — current Eorzea time and upcoming weather
  (computable from the game's weather algorithm) for fishing/FATEs/Hunts.
- **"What should I do next?" everywhere** (S) — expand the hero card to weigh
  dailies, gear, leves, and goal into one ranked to‑do list.

## 🎣 Gathering & crafting depth
- **Gatherer specifics** (M) — node locations on the map (reuse the Locator), plus
  timed **unspoiled/ephemeral node timers** with countdowns.
- **Collectables + scrip planner** (M) — what to gather/craft for scrips at your level.
- **Crafting profit calculator** (M) — buy mats vs. sell product using live prices +
  sale velocity; surface "what's worth crafting to sell."
- **Full recipe browser** (M) — search any recipe, see mats (with MB links) and the
  craft level, not just leve items.
- **Crafting solver** (L) — stat‑based optimal rotation for your Craftsmanship/
  Control/CP + recipe (the heavy ffxiv‑craft/Raphael feature) feeding the macro maker.
- **Gatherer macros** (S) — collectable gathering macro presets in the macro maker.

## 🗺️ Content & activities
- **Hunt helper** (M) — B/A/S mark locations + spawn windows (reuse maps).
- **Beast Tribe / Allied Society tracker** (M) — which tribes are unlocked at your
  level, daily allowances, and best rewards (EXP/mounts/minions).
- **Treasure maps & Custom Deliveries** (S–M) — where to use maps, weekly delivery tracker.
- **Relic weapon step‑by‑step** (L) — guided grind per expansion.
- **Roulette/duty info** (S) — expand the leveling tab with per‑roulette rewards/levels.

## 🌐 Live game info
- **Lodestone news / maintenance feed** (S) — patch notes, events, server status, and
  a maintenance banner ("servers down at …").
- **Server status** (S) — congested/standard/new world flags (Lodestone/worlds API).

## 🎀 Collection & cosmetics
- **Collection tracker** (M) — mark mounts/minions owned, see % complete and what's
  left, with filters (saved in localStorage).
- **Glamour helper** (M) — search gear by look, dyeable flag, where to obtain.
- **Triple Triad / Fashion Report / Cactpot** (S each) — small fun helpers.

## 🚀 Reach & polish
- **PWA / installable web app** (S) — "Add to home screen", offline cache for the
  static data; makes the Vercel site feel app‑like on phones.
- **Localization** (M) — UI in 日本語 / Deutsch / Français (item names already localize).
- **Shareable links** (S) — share a rotation/macro or a mount lookup via URL.
- **Daily tip from Gilbo** (S) — a rotating cozy tip on the dashboard.
- **Performance** (S) — lazy‑load heavy tabs, trim the bestiary payload.

## 🤔 Bigger / later
- **Accounts + cloud sync** (L) — only when sharing/cross‑device sync clearly beats
  signup friction; if so, **Sign in with Discord** + a free Postgres (Supabase/Neon).
- **Analytics** (S, optional) — if you ever want usage/error visibility, wire hosted
  dashboards (Vercel Analytics + PostHog) rather than building one. (Deliberately
  skipped for now to keep things simple & private.)

---
*Created by Daniel · Founder. Pick any item and say the word — most "S" ideas are an
afternoon each.*
