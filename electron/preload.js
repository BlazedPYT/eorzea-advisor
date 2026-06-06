// Bridges the launcher + auto-updater to the renderer (launcher.html and the
// Next app both read window.eorzea).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eorzea", {
  isDesktop: true,

  // app info + navigation
  getInfo: () => ipcRenderer.invoke("get-info"),
  launchApp: () => ipcRenderer.invoke("launch-app"),
  goLauncher: () => ipcRenderer.invoke("go-launcher"),
  quit: () => ipcRenderer.invoke("quit-app"),
  onServerStatus: (cb) => ipcRenderer.on("server-status", (_e, d) => cb(d)),

  // updates
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateChecking: (cb) => ipcRenderer.on("update-checking", (_e, d) => cb(d)),
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (_e, d) => cb(d)),
  onUpdateNone: (cb) => ipcRenderer.on("update-none", (_e, d) => cb(d)),
  onUpdateProgress: (cb) => ipcRenderer.on("update-progress", (_e, d) => cb(d)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", (_e, d) => cb(d)),
  onUpdateError: (cb) => ipcRenderer.on("update-error", (_e, d) => cb(d)),
});
