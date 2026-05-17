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
          Dissect
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
          GitHub project dissection helper ·{" "}
          <span style={{ color: "var(--fg-4)" }}>MVP v0.1</span>
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
          Paste a GitHub link + tell us what you&apos;re building. The AI returns
          a handful of <strong>small, stealable module cards</strong> you can drop
          right into your project.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/en/analyze" className="btn btn-primary btn-lg">
            Start dissecting <Icon.ArrowRight />
          </Link>
          <Link href="/en/about" className="btn btn-secondary btn-lg">
            Why this exists
          </Link>
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: "var(--fg-4)",
          }}
        >
          or{" "}
          <Link
            href="/en/analyze?demo=1"
            style={{
              color: "var(--accent-text)",
              fontWeight: 500,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ▶ watch a 30s demo first
          </Link>
          {" "}— no key needed, full flow
        </div>
      </section>
    </div>
  );
}
