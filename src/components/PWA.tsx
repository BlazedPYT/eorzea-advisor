"use client";

import { useEffect } from "react";

// Registers the service worker so the web app is installable + offline-able.
// Skipped in the desktop app (it updates via electron-updater, not a SW).
export function PWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { eorzea?: { isDesktop?: boolean } }).eorzea?.isDesktop) return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}
