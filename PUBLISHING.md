# 📦 Building & publishing Eorzea Advisor (desktop)

This is the cozy desktop app: an installer `.exe` your friends run, with built-in
auto-updates. When you publish a new version, their app shows a **"Update ready"**
banner they click to update. No retyping, no command line for them.

---

## TL;DR — publishing an update (recommended: GitHub Action)

You don't need a token or a local build. Just bump the version and push a tag:

```bash
# 1. bump "version" in package.json (e.g. 1.2.0 -> 1.2.1)
# 2. commit it
git commit -am "v1.2.1"
# 3. tag with the SAME version and push the tag
git tag v1.2.1
git push origin main --tags
```

GitHub then builds the Windows installer on its own runner and **publishes the
release automatically** (see `.github/workflows/release.yml`). Within ~30 minutes
(or on next launch) every friend's app shows the **"Update & restart"** banner.

The thing you send NEW friends is still the installer file:

```
CLIENT FOR HALP/Eorzea Advisor Setup <version>.exe
```
(produced by `npm run desktop:build`, or downloadable from the GitHub Release).

---

## How the auto-publish works

`.github/workflows/release.yml` runs on any `v*` tag and:
1. checks the tag matches `package.json` version (fails loudly if not),
2. `npm ci` + `npm run desktop:assemble` (Next standalone build),
3. `electron-builder --publish always` using the workflow's built-in
   `GITHUB_TOKEN` — no personal token, no secrets to manage,
4. flips the release from draft → published and marks it **latest**.

The build config (`package.json → build.publish`) targets your public repo:
```json
"publish": [{ "provider": "github", "owner": "BlazedPYT", "repo": "eorzea-advisor" }]
```

> The repo must be **public** so friends' apps can fetch updates without a token.

---

## Manual publish (fallback, needs a token)

If you ever want to publish from your own machine instead of via a tag:

1. Bump `"version"` in `package.json` (must be higher than the last release).
2. Create a GitHub personal access token (Settings → Developer settings → Tokens
   (classic) → scope **repo**).
3. ```bash
   $env:GH_TOKEN = "<your-token>"   # PowerShell
   npm run desktop:publish
   ```
4. Repo → **Releases** → publish the drafted release. Then revoke the token.

---

## What your friends do

1. You send them `Eorzea Advisor Setup <version>.exe` (one file).
2. They double-click it. Windows SmartScreen may say *"Windows protected your PC"*
   because the app isn't code-signed — they click **More info → Run anyway**. (This is
   normal for indie apps. To remove the warning you'd need a paid code-signing cert.)
3. It installs, makes a desktop + Start-menu shortcut, and opens.
4. From then on, updates are automatic — they just click **Update now** when prompted.

Their saved character lives in
`%AppData%\eorzea-advisor\eorzea.json` and survives updates.

---

## Local desktop dev (no packaging)

```bash
npm run desktop:dev
```

Runs `next dev` + Electron together, pointing the window at the live dev server with
hot reload. Auto-update is disabled in dev.

---

## Build internals (FYI)

- `npm run desktop:assemble` → `next build` (with `output: "standalone"`) then
  `scripts/assemble-standalone.mjs` copies `public/` and `.next/static/` into the
  standalone bundle so it's fully runnable.
- electron-builder packages that bundle into `resources/server/` and ships
  `electron/main.js`, which spawns the Next server on a free localhost port and loads
  it in the window.
- Output dir is **`CLIENT FOR HALP/`** (set in `package.json → build.directories.output`).

### Known build gotcha (Windows, non-admin)

electron-builder's `winCodeSign` archive contains macOS symlinks that 7-Zip can't
create without admin/Developer Mode, failing with *"A required privilege is not held
by the client."* Workaround (already applied once on this machine): pre-extract it so
the cache exists, then builds reuse it:

```powershell
$c="$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
& "node_modules\7zip-bin\win\x64\7za.exe" x "$c\<any>.7z" "-o$c\winCodeSign-2.6.0" -y -snld
# the 2 darwin .dylib symlink errors are harmless on Windows
```
