import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function LandingPage() {
  return (
    <div className="page">
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "112px 0 40px",
        }}
      >
        <h1
          style={{
            fontWeight: 600,
            fontSize: 56,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            margin: "0 0 14px",
            color: "var(--fg)",
          }}
        >
          拆小块学
        </h1>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--fg-3)",
            letterSpacing: 0.2,
            marginBottom: 36,
          }}
        >
          GitHub 项目拆解助手 · <span style={{ color: "var(--fg-4)" }}>MVP v0.1</span>
        </div>

        <p
          style={{
            fontSize: 16.5,
            color: "var(--fg-2)",
            lineHeight: 1.65,
            margin: "0 0 32px",
            maxWidth: 540,
          }}
        >
          贴一个 GitHub 链接 + 你正在做的项目，AI 拆出能直接<strong>搬走</strong>的小模块卡片。
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/analyze" className="btn btn-primary btn-lg">
            开始拆解 <Icon.ArrowRight />
          </Link>
          <Link href="/about" className="btn btn-secondary btn-lg">
            了解理念
          </Link>
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: "var(--fg-4)",
          }}
        >
          或者{" "}
          <Link
            href="/analyze?demo=1"
            style={{
              color: "var(--accent-text)",
              fontWeight: 500,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ▶ 先看 30 秒 demo
          </Link>
          {" "}—— 不用配 key，直接看完整流程
        </div>
      </section>
    </div>
  );
}
