"use client";

import { useEffect, useState } from "react";

// Share the app — uses the native share sheet on mobile, falls back to copying
// the link. Hidden in the desktop app (its URL is a local port, not shareable).
export function ShareButton() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsDesktop(!!(window as unknown as { eorzea?: { isDesktop?: boolean } }).eorzea?.isDesktop);
  }, []);
  if (isDesktop) return null;

  async function share() {
    const url = window.location.href;
    const data = { title: "Eorzea Advisor", text: "A cozy FFXIV companion — gear, leves, crafting, mounts & more.", url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="btn-ghost" onClick={share} title="Share Eorzea Advisor">
      {copied ? "✓ Link copied" : "🔗 Share"}
    </button>
  );
}
