"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { swapLocalePath, useDict, useLocale } from "@/lib/i18n";

const THEME_KEY = "dissect-mvp-theme";
type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "dark" || t === "light") return t;
  } catch {}
  return "light";
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useDict();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
        document.documentElement.setAttribute("data-theme", next);
      } catch {}
      return next;
    });
  }, []);

  const langTarget = locale === "en" ? "zh" : "en";
  const langSwitchHref = swapLocalePath(pathname, langTarget);

  const prefix = locale === "en" ? "/en" : "";
  const links = [
    { id: "home", label: t.nav.home, href: locale === "en" ? "/en" : "/" },
    { id: "analyze", label: t.nav.analyze, href: `${prefix}/analyze` },
    { id: "history", label: t.nav.history, href: `${prefix}/history` },
    { id: "settings", label: t.nav.settings, href: `${prefix}/settings` },
    { id: "about", label: t.nav.about, href: `${prefix}/about` },
  ];
  const contactHref = `${prefix}/about#contact`;

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // exact /en or / should not be active for sub-routes
    if (href === "/" || href === "/en") return false;
    return pathname.startsWith(href + "/") || pathname === href;
  };

  return (
    <nav className="nav">
      <div
        className="nav-brand"
        onClick={() => router.push(locale === "en" ? "/en" : "/")}
        role="button"
        tabIndex={0}
      >
        <div className="nav-mark" style={{ color: "var(--fg-3)" }}>
          <Icon.Logo />
        </div>
        <div className="nav-title">
          <h1>{t.nav.brand}</h1>
          <span className="nav-version">v0.1</span>
        </div>
      </div>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.id}
            href={l.href}
            className={"nav-link" + (isActive(l.href) ? " active" : "")}
          >
            {l.label}
          </Link>
        ))}
        {/* 联系 tab：加粗 + 紫色，更显眼。点了跳到 /about 的 #contact 锚点 */}
        <Link
          href={contactHref}
          className="nav-link"
          style={{
            fontWeight: 600,
            color: "var(--accent-text)",
          }}
        >
          {t.nav.contact}
        </Link>
        <span className="nav-divider" />
        <Link
          href={langSwitchHref}
          className="nav-link"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          title={locale === "en" ? "切换到中文" : "Switch to English"}
        >
          {t.nav.switchLang}
        </Link>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? t.nav.themeToggleLight : t.nav.themeToggleDark
          }
          title={
            theme === "dark" ? t.nav.themeToggleLight : t.nav.themeToggleDark
          }
          suppressHydrationWarning
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
    </nav>
  );
}
