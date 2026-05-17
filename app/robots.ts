import type { MetadataRoute } from "next";

const SITE_URL = "https://chai-xiao-kuai-xue.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // OAuth 回调和动态生成的 OG image / icon 不需要被索引
        disallow: ["/oauth/", "/en/oauth/", "/opengraph-image", "/icon", "/en/opengraph-image"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
