import type { MetadataRoute } from "next";
import { POSTS } from "@/data/blog";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/alistirma", "/ogren", "/yapay-zeka", "/range", "/araclar", "/cash", "/turnuva", "/sozluk", "/blog", "/sorumlu-oyun", "/gizlilik"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
