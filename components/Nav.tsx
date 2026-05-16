"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";

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
  // Initialize to "light" to match server render; sync from localStorage post-mount.
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

  const links = [
    { id: "home", label: "首页", href: "/" },
    { id: "analyze", label: "拆解", href: "/analyze" },
    { id: "history", label: "历史", href: "/history" },
    { id: "settings", label: "设置", href: "/settings" },
    { id: "about", label: "关于", href: "/about" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => router.push("/")} role="button" tabIndex={0}>
        <div className="nav-mark" style={{ color: "var(--fg-3)" }}>
          <Icon.Logo />
        </div>
        <div className="nav-title">
          <h1>拆小块学</h1>
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
        <span className="nav-divider" />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "切换到明亮模式" : "切换到暗色模式"}
          title={theme === "dark" ? "切换到明亮模式" : "切换到暗色模式"}
          suppressHydrationWarning
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
    </nav>
  );
}
