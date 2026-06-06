// Electron main process for Eorzea Advisor.
// In dev it loads the running `next dev` server. In production it spawns the
// bundled Next standalone server (resources/server/server.js) on a local port,
// then opens it in a window. Auto-updates run via electron-updater (GitHub).

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const net = require("net");
const fs = require("fs");
const { fork } = require("child_process");

const isDev = !app.isPackaged;
let mainWindow = null;
let serverProcess = null;

// --- pick a free localhost port -------------------------------------------
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

function waitForServer(port, timeoutMs = 30000) {
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

// --- start the bundled Next standalone server -----------------------------
async function startServer() {
  const port = await getFreePort();
  const serverDir = path.join(process.resourcesPath, "server");
  const serverEntry = path.join(serverDir, "server.js");

  // Persist the profile JSON in the user's writable app-data folder.
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

  await waitForServer(port);
  return `http://127.0.0.1:${port}`;
}

async function createWindow() {
  const iconPath = path.join(__dirname, "..", "build-assets", "icon.ico");
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: "#f6f3ff",
    title: "Eorzea Advisor",
    autoHideMenuBar: true,
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links (Universalis, Lodestone) in the real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = isDev ? "http://localhost:3000" : await startServer();
  await mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- auto-update (GitHub Releases) ----------------------------------------
function setupAutoUpdate() {
  if (isDev) return; // never auto-update in dev
  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch {
    return; // electron-updater not available
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (channel, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  };

  autoUpdater.on("update-available", (info) =>
    send("update-available", { version: info?.version })
  );
  autoUpdater.on("download-progress", (p) =>
    send("update-progress", { percent: Math.round(p?.percent ?? 0) })
  );
  autoUpdater.on("update-downloaded", (info) =>
    send("update-downloaded", { version: info?.version })
  );
  autoUpdater.on("error", (err) =>
    send("update-error", { message: String(err?.message ?? err) })
  );

  // The renderer asks us to install once the user clicks "Update now".
  ipcMain.handle("install-update", () => {
    autoUpdater.quitAndInstall(false, true);
  });
  ipcMain.handle("check-for-updates", () => autoUpdater.checkForUpdates().catch(() => {}));

  // Check on launch, then every 30 minutes.
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}

app.whenReady().then(async () => {
  await createWindow();
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
