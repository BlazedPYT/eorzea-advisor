# 📦 Building & publishing Eorzea Advisor (desktop)

This is the cozy desktop app: an installer `.exe` your friends run, with built-in
auto-updates. When you publish a new version, their app shows a **"Update ready"**
banner they click to update. No retyping, no command line for them.

---

## TL;DR

```bash
# Build the installer (output lands in the "CLIENT FOR HALP" folder)
npm run desktop:build

# Publish an update so friends get the in-app update banner
#   1. bump "version" in package.json (e.g. 1.0.0 -> 1.0.1)
#   2. set your GitHub token (see below), then:
npm run desktop:publish
```

The thing you send friends is:

```
CLIENT FOR HALP/Eorzea Advisor Setup <version>.exe
```

---

## One-time setup for auto-updates (GitHub Releases)

Auto-updates are wired to **GitHub Releases** (free, reliable).

1. **Create a free GitHub repo** named `eorzea-advisor` (can be private — see note).
2. **`package.json` → `build.publish`** is already set to your account:
   ```json
   "publish": [
     { "provider": "github", "owner": "BlazedPYT", "repo": "eorzea-advisor" }
   ]
   ```
3. **Create a GitHub personal access token** with `repo` scope:
   GitHub → Settings → Developer settings → Personal access tokens → *Tokens (classic)* →
   Generate new token → tick **repo** → copy it.
4. **Set the token** in your terminal before publishing:
   - PowerShell: `$env:GH_TOKEN = "ghp_yourtokenhere"`
   - (electron-builder reads `GH_TOKEN` automatically.)

> **Private repo note:** auto-update from a *private* repo needs the client to send
> the token too, which you don't want to ship. For sending to friends, use a
> **public** repo for releases (the code can stay private elsewhere). Simplest path:
> make `eorzea-advisor` public — it only needs to hold the release files.

---

## Publishing a new version (the friend-facing update)

1. Make your changes.
2. Bump `"version"` in `package.json` (must be higher than the last release, e.g.
   `1.0.0` → `1.0.1`). **Auto-update only triggers when the version goes up.**
3. Run:
   ```bash
   npm run desktop:publish
   ```
   This rebuilds the app and uploads `Eorzea Advisor Setup <v>.exe`, its `.blockmap`,
   and `latest.yml` to a GitHub Release (created as a draft).
4. Go to your repo → **Releases**, and **publish** the draft release.
5. Done. Within ~30 minutes (or on next launch) every friend's app detects the new
   version, downloads it in the background, and shows the **"Update ready → Update now"**
   banner. Clicking it installs and relaunches.

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
