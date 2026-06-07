import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Resolve the top YouTube video id for a query (no API key) by reading the
// public search results HTML. Used to embed an in-app showcase video.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ videoId: null });
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 86400 }, // a mount's video doesn't change — cache a day
      }
    );
    if (!res.ok) return NextResponse.json({ videoId: null });
    const html = await res.text();
    const m = html.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
    return NextResponse.json({ videoId: m ? m[1] : null });
  } catch {
    return NextResponse.json({ videoId: null });
  }
}
