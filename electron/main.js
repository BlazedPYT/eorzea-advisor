// Electron main process for Eorzea Advisor.
//
// Flow: open a beautiful LAUNCHER (static, instant) → boot the bundled Next
// server in the background → user clicks START → load the app in the same
// window. Auto-updates run via electron-updater (GitHub). The launcher also
// exposes manual "Check for updates" + "Update & restart".

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const net = require("net");
const fs = require("fs");
const { fork } = require("child_process");

const isDev = !app.isPackaged;
let mainWindow = null;
let serverProcess = null;
let appUrl = null;

// Resolve once the app is reachable.
let resolveReady;
const serverReady = new Promise((res) => (resolveReady = res));

// --- helpers ---------------------------------------------------------------
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("server timeout"));
        else setTimeout(tryOnce, 250);
      });
    };
    tryOnce();
  });
}

function notify(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// --- start the bundled Next standalone server ------------------------------
async function startServer() {
  if (isDev) {
    appUrl = "http://localhost:3000";
    try {
      await waitForServer(3000);
    } catch {
      /* dev server may already be up via another check */
    }
    resolveReady();
    notify("server-status", { ready: true });
    return;
  }

  const port = await getFreePort();
  const serverDir = path.join(process.resourcesPath, "server");
  const serverEntry = path.join(serverDir, "server.js");
  const dataFile = path.join(app.getPath("userData"), "eorzea.json");

  serverProcess = fork(serverEntry, [], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      EORZEA_DATA_FILE: dataFile,
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  serverProcess.stdout?.on("data", (d) => console.log("[next]", d.toString().trim()));
  serverProcess.stderr?.on("data", (d) => console.error("[next]", d.toString().trim()));

  try {
    await waitForServer(port);
    appUrl = `http://127.0.0.1:${port}`;
    resolveReady();
    notify("server-status", { ready: true });
  } catch (err) {
    notify("server-status", { ready: false, error: String(err) });
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, "..", "build-assets", "icon.ico");
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 420,
    minHeight: 640,
    backgroundColor: "#15121f",
    title: "Eorzea Advisor",
    autoHideMenuBar: true,
    show: false,
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // External links open in the real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadFile(path.join(__dirname, "launcher.html"));
  mainWindow.on("closed", () => (mainWindow = null));
}

// --- IPC for the launcher --------------------------------------------------
ipcMain.handle("get-info", () => ({
  version: app.getVersion(),
  name: "Eorzea Advisor",
  dev: isDev,
}));

ipcMain.handle("launch-app", async () => {
  await serverReady;
  if (appUrl && mainWindow) await mainWindow.loadURL(appUrl);
  return true;
});

ipcMain.handle("go-launcher", async () => {
  if (mainWindow) await mainWindow.loadFile(path.join(__dirname, "launcher.html"));
  return true;
});

ipcMain.handle("quit-app", () => app.quit());

// --- auto-update (GitHub Releases) ----------------------------------------
// We track the latest update state in the MAIN process and let the renderer
// pull it on load (get-update-state). That fixes the race where the launcher
// page subscribes to events AFTER the on-launch check already fired them.
let updateState = { status: "idle", version: null, percent: 0, message: "" };

function setState(patch) {
  updateState = { ...updateState, ...patch };
  notify("update-state", updateState);
}

function setupAutoUpdate() {
  // expose state + actions even in dev (dev just reports "disabled")
  ipcMain.handle("get-update-state", () => updateState);

  if (isDev) {
    updateState = { status: "dev", version: null, percent: 0, message: "Updates are disabled in dev." };
    ipcMain.handle("install-update", () => {});
    ipcMain.handle("check-for-updates", () => {});
    return;
  }

  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch {
    return;
  }

  // Log to a file so update problems are diagnosable: %AppData%/eorzea-advisor/update.log
  const logFile = path.join(app.getPath("userData"), "update.log");
  const ulog = (...a) => {
    try {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${a.map(String).join(" ")}\n`);
    } catch {}
  };
  autoUpdater.logger = { info: ulog, warn: ulog, error: ulog, debug: () => {} };

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => setState({ status: "checking", message: "Checking for updates…" }));
  autoUpdater.on("update-available", (info) =>
    setState({ status: "downloading", version: info?.version, percent: 0 })
  );
  autoUpdater.on("update-not-available", (info) =>
    setState({ status: "none", version: info?.version, message: "You're on the latest version." })
  );
  autoUpdater.on("download-progress", (p) =>
    setState({ status: "downloading", percent: Math.round(p?.percent ?? 0) })
  );
  autoUpdater.on("update-downloaded", (info) =>
    setState({ status: "downloaded", version: info?.version, percent: 100 })
  );
  autoUpdater.on("error", (err) =>
    setState({ status: "error", message: String(err?.message ?? err) })
  );

  ipcMain.handle("install-update", () => {
    ulog("user requested install");
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (e) {
      ulog("quitAndInstall failed:", e?.message);
    }
  });

  ipcMain.handle("check-for-updates", async () => {
    // If we already have an update downloaded, just re-broadcast so a freshly
    // loaded page shows the install button immediately.
    if (updateState.status === "downloaded") {
      notify("update-state", updateState);
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      setState({ status: "error", message: String(e?.message ?? e) });
    }
  });

  autoUpdater.checkForUpdates().catch((e) => setState({ status: "error", message: String(e?.message ?? e) }));
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}

app.whenReady().then(() => {
  createWindow();
  startServer(); // boot in background while the launcher shows
  setupAutoUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("quit", () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
