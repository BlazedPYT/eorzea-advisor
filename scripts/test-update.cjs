// Diagnostic: does electron-updater find + download the published release?
// Forces currentVersion=1.0.0 so the latest release looks like an update.
const { app } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");

const LOG = path.join(__dirname, "..", "test-update.log");
fs.writeFileSync(LOG, "");
const log = (...a) => fs.appendFileSync(LOG, a.map(String).join(" ") + "\n");
const done = (code) => { log("=== exit", code, "==="); app.exit(code); };

autoUpdater.logger = { info: log, warn: log, error: log, debug: () => {} };
autoUpdater.forceDevUpdateConfig = true; // allow checks when not packaged
autoUpdater.autoDownload = true;
autoUpdater.currentVersion = "1.0.0";
autoUpdater.setFeedURL({ provider: "github", owner: "BlazedPYT", repo: "eorzea-advisor" });

autoUpdater.on("checking-for-update", () => log("CHECKING…"));
autoUpdater.on("update-available", (i) => log("AVAILABLE:", i.version));
autoUpdater.on("update-not-available", (i) => { log("NOT AVAILABLE:", i.version); done(0); });
autoUpdater.on("download-progress", (p) => log("PROGRESS:", Math.round(p.percent) + "%"));
autoUpdater.on("update-downloaded", (i) => { log("DOWNLOADED:", i.version); done(0); });
autoUpdater.on("error", (e) => { log("ERROR:", e == null ? "(null)" : (e.stack || e.message || e)); done(1); });

app.whenReady().then(() => {
  log("electron ready, checking feed github:BlazedPYT/eorzea-advisor (currentVersion=1.0.0)…");
  autoUpdater.checkForUpdates().catch((e) => { log("CHECK THREW:", e.message); done(1); });
});
setTimeout(() => { log("TIMEOUT"); done(2); }, 90000);
