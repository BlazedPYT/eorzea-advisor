# 🌐 Deploying Eorzea Advisor as a website

The app is a Next.js app with **server API routes** (Lodestone sync, the YouTube
lookup, bestiary search, Market Board proxying). That means a **static-only host
like GitHub Pages can't run the full app** — you need a host that runs Next.js
serverless functions. The easiest, free, and recommended option is **Vercel**
(built by the Next.js team), which deploys straight from this GitHub repo.

---

## ✅ Recommended: Vercel (free, full features, auto-deploy)

1. Go to **https://vercel.com** and **Sign in with GitHub**.
2. **Add New… → Project** → **Import** `BlazedPYT/eorzea-advisor`.
3. Vercel auto-detects **Next.js**. Leave all defaults (no env vars needed) and
   click **Deploy**.
4. In ~2 minutes you get a live URL like **`eorzea-advisor.vercel.app`**.
5. **Every push to `main` auto-deploys** — same flow as your desktop releases.
   (Optional: add a custom domain in the Vercel project → Settings → Domains.)

Everything works on Vercel because the API routes run as serverless functions:
Lodestone character sync, the in-app YouTube showcase, the Market Board, the
bestiary/leves/mounts, crafting, and macros.

**Web vs desktop differences**
- Your **character profile is saved per browser** (in `localStorage`), not in a
  file. Clearing site data resets it; the **Demo** button and manual setup still
  work everywhere.
- No installer / auto-update banner on the web (you just refresh the page).

> Netlify and Cloudflare Pages also work (both support Next.js serverless). Vercel
> is the most zero-config for this stack.

---

## ⚠️ GitHub Pages (possible, but degraded — not recommended)

GitHub Pages only serves **static files**, so it can't run the API routes.
A static export (`next build` with `output: "export"`) would **lose**:
- Lodestone character sync (the browser can't scrape the Lodestone — no CORS),
- the in-app YouTube showcase (same reason),
- the server-side bestiary search/entry,
and would need the Market Board calls rewritten to run in the browser.

If you specifically want a free **GitHub-hosted** site without Vercel, the better
middle ground is **Cloudflare Pages** (free, supports the serverless functions)
pointed at this repo — you keep all features. Use plain GitHub Pages only if
you're OK with the reduced feature set above.

---

## TL;DR
- **Want the full app on the web, free, auto-deploying from GitHub?** → Vercel
  (or Cloudflare Pages). ~4 clicks, done.
- **Must be literally GitHub Pages?** → only a cut-down static version; not worth
  it given the lost features.
