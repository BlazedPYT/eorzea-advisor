import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";

const display = Quicksand({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const sans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Eorzea Advisor · your cozy FFXIV companion",
  description:
    "A cute, modern FFXIV helper: gear, food, roulettes, Market Board deals and gil-saving advice for any job and any level — story-skip friendly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        {/* soft aurora backdrop */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-cream-100/40 dark:to-black/40" />
        {children}
      </body>
    </html>
  );
}
