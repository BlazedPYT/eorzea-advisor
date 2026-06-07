// Live FFXIV news by reading the public Lodestone news page (same safe,
// read-only approach as character sync — no API, no plugins).

const UA = "Mozilla/5.0 (compatible; EorzeaAdvisor/1.0; companion app)";

export type NewsCategory = "Topics" | "Notices" | "Maintenance" | "Updates" | "Status";

export interface NewsItem {
  title: string;
  url: string;
  ms: number; // publish time
  category: NewsCategory;
}

const CAT: Record<string, NewsCategory> = {
  topics: "Topics",
  headline: "Topics",
  info: "Notices",
  maintenance: "Maintenance",
  update: "Updates",
  updates: "Updates",
  obstacle: "Status",
};

export async function fetchNews(): Promise<NewsItem[]> {
  for (const region of ["na", "eu"] as const) {
    try {
      const res = await fetch(`https://${region}.finalfantasyxiv.com/lodestone/news/`, {
        headers: { "User-Agent": UA },
        next: { revalidate: 600 }, // 10 min
      });
      if (!res.ok) continue;
      const html = await res.text();
      const re =
        /href="(\/lodestone\/news\/detail\/[a-f0-9]+)" class="news__list--link ic__(\w+)--list">[\s\S]*?news__list--title">([^<]+)<\/p>[\s\S]*?ldst_strftime\((\d+),/g;
      const items: NewsItem[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) && items.length < 30) {
        const [, href, cat, title, time] = m;
        items.push({
          title: decode(title),
          url: `https://${region}.finalfantasyxiv.com${href}`,
          ms: Number(time) * 1000,
          category: CAT[cat] ?? "Notices",
        });
      }
      if (items.length) return items;
    } catch {
      /* try next region */
    }
  }
  return [];
}

function decode(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
