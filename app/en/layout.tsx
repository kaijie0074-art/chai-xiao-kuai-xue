import type { Metadata } from "next";

const SITE_URL = "https://chai-xiao-kuai-xue.vercel.app";
const EN_TITLE = "Dissect · GitHub project dissection helper";
const EN_DESC =
  "Don't learn a project. Learn the small piece of it that's useful to you. Paste a GitHub link + what you're building, and AI returns stealable module cards.";

/**
 * EN sub-layout — override metadata so /en/* pages get English OG + Twitter cards
 * even though the root layout's <html> is still emitted server-side.
 * The HTML `lang` attribute is corrected client-side via the inline script in root layout.
 */
export const metadata: Metadata = {
  title: EN_TITLE,
  description: EN_DESC,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/en`,
    siteName: "Dissect",
    title: EN_TITLE,
    description: EN_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: EN_TITLE,
    description: EN_DESC,
  },
  alternates: {
    languages: {
      en: `${SITE_URL}/en`,
      "zh-CN": SITE_URL,
    },
  },
};

export default function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
