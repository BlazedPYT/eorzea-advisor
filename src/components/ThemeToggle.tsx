"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ea-theme");
    const prefers =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefers);
    document.documentElement.classList.toggle("dark", prefers);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ea-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="btn-ghost !rounded-full !px-3"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
