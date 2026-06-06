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

  // updates — unified state model
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  getUpdateState: () => ipcRenderer.invoke("get-update-state"),
  onUpdateState: (cb) => ipcRenderer.on("update-state", (_e, d) => cb(d)),
});
