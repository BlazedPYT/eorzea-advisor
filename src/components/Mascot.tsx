"use client";

import { motion } from "framer-motion";

// "Gilbo" — an original, cozy fantasy advisor sprite. A round lavender helper
// with a glowing pom-pom antenna (moogle-ish vibe) and big friendly eyes.
// No official FFXIV art, names, or assets are used.

export function Mascot({
  size = 72,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id="gilbo-body" cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#efeafc" />
            <stop offset="100%" stopColor="#c4b5f0" />
          </radialGradient>
          <radialGradient id="gilbo-pom" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff3c9" />
            <stop offset="100%" stopColor="#eec45c" />
          </radialGradient>
        </defs>

        {/* antenna */}
        <path d="M50 24 C 50 12, 56 8, 60 6" stroke="#a78bea" strokeWidth="3" strokeLinecap="round" fill="none" />
        <motion.circle
          cx="62" cy="6" r="7" fill="url(#gilbo-pom)"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />

        {/* body */}
        <ellipse cx="50" cy="58" rx="34" ry="32" fill="url(#gilbo-body)" />
        {/* ears */}
        <ellipse cx="22" cy="46" rx="9" ry="13" fill="#c4b5f0" transform="rotate(-18 22 46)" />
        <ellipse cx="78" cy="46" rx="9" ry="13" fill="#c4b5f0" transform="rotate(18 78 46)" />

        {/* cheeks */}
        <circle cx="34" cy="64" r="5" fill="#f7c6d9" opacity="0.7" />
        <circle cx="66" cy="64" r="5" fill="#f7c6d9" opacity="0.7" />

        {/* eyes */}
        <circle cx="40" cy="54" r="5.5" fill="#3a3357" />
        <circle cx="60" cy="54" r="5.5" fill="#3a3357" />
        <circle cx="42" cy="52" r="1.8" fill="#fff" />
        <circle cx="62" cy="52" r="1.8" fill="#fff" />

        {/* smile */}
        <path d="M44 66 Q 50 72 56 66" stroke="#3a3357" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* tiny tuft */}
        <path d="M50 26 q -3 -5 -7 -6 q 5 -1 7 2 q 2 -3 7 -2 q -4 1 -7 6" fill="#a78bea" />
      </svg>
    </motion.div>
  );
}

export function MascotBubble({
  children,
  size = 64,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div className="flex items-end gap-3">
      <Mascot size={size} className="shrink-0 drop-shadow" />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass relative max-w-md rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100"
      >
        <span className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 border-b border-l border-white/60 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/[0.06]" />
        {children}
      </motion.div>
    </div>
  );
}
