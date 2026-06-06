// Safely bridges the auto-updater to the web UI. The Next renderer can read
// window.eorzea to show an update banner and trigger an install.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eorzea", {
  isDesktop: true,
  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update-available", (_e, data) => cb(data)),
  onUpdateProgress: (cb) =>
    ipcRenderer.on("update-progress", (_e, data) => cb(data)),
  onUpdateDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", (_e, data) => cb(data)),
  onUpdateError: (cb) => ipcRenderer.on("update-error", (_e, data) => cb(data)),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
});
