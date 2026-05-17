import type { MetadataRoute } from "next";

const SITE_URL = "https://chai-xiao-kuai-xue.vercel.app";

const ROUTES_ZH = ["/", "/analyze", "/history", "/settings", "/about"];
const ROUTES_EN = [
  "/en",
  "/en/analyze",
  "/en/history",
  "/en/settings",
  "/en/about",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 一个页面只在 sitemap 里出现一次（按 zh 主路径），但通过 alternates
  // 把对应的 en URL 报给搜索引擎，避免被当作两个独立页面。
  const pairs: Array<{ zh: string; en: string; priority: number }> = [
    { zh: "/", en: "/en", priority: 1.0 },
    { zh: "/analyze", en: "/en/analyze", priority: 0.9 },
    { zh: "/about", en: "/en/about", priority: 0.7 },
    { zh: "/settings", en: "/en/settings", priority: 0.4 },
    { zh: "/history", en: "/en/history", priority: 0.3 },
  ];

  return pairs.map(({ zh, en, priority }) => ({
    url: `${SITE_URL}${zh}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority,
    alternates: {
      languages: {
        "zh-CN": `${SITE_URL}${zh}`,
        en: `${SITE_URL}${en}`,
      },
    },
  }));
}
