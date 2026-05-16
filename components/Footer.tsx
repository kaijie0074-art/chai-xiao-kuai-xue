"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useDict, useLocale } from "@/lib/i18n";

const SOURCE_URL = "https://github.com/kaijie0074-art/chai-xiao-kuai-xue";

export function Footer() {
  const t = useDict();
  const locale = useLocale();
  const aboutHref = locale === "en" ? "/en/about" : "/about";

  return (
    <footer className="footer">
      <div className="footer-byok">
        <span className="lock-dot" />
        <span>{t.footer.byok}</span>
      </div>
      <div
        className="footer-right"
        style={{ display: "flex", alignItems: "center", gap: 14 }}
      >
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener"
          title={t.footer.sourceTitle}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-3)",
          }}
        >
          <Icon.Github />
          <span style={{ fontSize: 12 }}>{t.footer.source}</span>
        </a>
        <Link href={aboutHref}>{t.footer.privacy}</Link>
      </div>
    </footer>
  );
}
