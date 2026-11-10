import type { MetadataRoute } from "next";
import { POSTS } from "@/data/blog";
import { HANDS } from "@/data/hands";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/kutuphane", "/alistirma", "/yapay-zeka", "/range", "/araclar", "/cash", "/turnuva", "/sozluk", "/blog", "/sorumlu-oyun", "/gizlilik"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...HANDS.map((h) => ({ url: `${base}/kutuphane/${h.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
