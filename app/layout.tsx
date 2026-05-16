import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://chai-xiao-kuai-xue.vercel.app";
const SITE_TITLE = "拆小块学 · GitHub 项目拆解助手";
const SITE_DESC =
  "不要学习一个项目，学习它对你有用的那一小块。粘一个 GitHub 链接 + 你正在做的项目，AI 帮你拆出能直接搬走的小模块。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "拆小块学",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("dissect-mvp-theme");
    if (t !== "dark" && t !== "light") t = "light";
    document.documentElement.setAttribute("data-theme", t);
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="light" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        <div className="app-shell">
          <Nav />
          <main className="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
