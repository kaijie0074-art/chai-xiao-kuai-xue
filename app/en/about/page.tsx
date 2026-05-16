"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ModuleCard } from "@/components/ModuleCard";
import { SAMPLE_MODULES_EN } from "@/lib/sample-modules";

const TOC = [
  { id: "idea", label: "Why this exists" },
  { id: "howto", label: "How it works" },
  { id: "compare", label: "Different from other tools" },
  { id: "flow", label: "How the AI thinks" },
  { id: "demo", label: "A real example" },
  { id: "case-douyin", label: "Case · TikTok scraper" },
  { id: "contact", label: "Contact" },
  { id: "privacy", label: "Privacy" },
  { id: "faq", label: "FAQ" },
  { id: "credits", label: "Credits" },
];

export default function AboutPage() {
  const [section, setSection] = useState("idea");

  useEffect(() => {
    const onScroll = () => {
      let cur = "idea";
      for (const { id } of TOC) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 120) cur = id;
      }
      setSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title" style={{ fontSize: 36, marginBottom: 6 }}>
          About
        </h2>
        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14 }}>
          Idea · how it works · privacy · FAQ
        </p>
      </div>

      <div className="about-grid">
        <main>
          <section id="idea" className="about-block">
            <h2>Why this exists</h2>
            <p className="about-pull">
              Don&apos;t learn a project. Learn the small piece of it that&apos;s useful to you.
            </p>

            <p>
              DeepWiki, GitHub Copilot Workspace, all the repo summarizers — they answer one question: <em>&quot;what is this repo?&quot;</em>
            </p>
            <p>
              But the real moment for an <strong>independent dev</strong> is different. You&apos;re building a specific project (an AI doc helper, a side blog, an internal RAG tool). You scroll past a repo on X and think: <em style={{ color: "var(--accent-text)" }}>&quot;can I steal that one piece they did for streaming?&quot;</em>. You <em>don&apos;t need</em> the full picture. You need <em>the part you can take.</em>
            </p>
            <p>
              This tool takes <strong>two inputs</strong>: a GitHub link, and one line about what you&apos;re building. Output is always <strong>cards</strong> — what it is / why it helps you / how to steal it.
            </p>

            <h3>What it&apos;s NOT</h3>
            <ul>
              <li>Not a project summarizer — README parrots are already a solved problem</li>
              <li>Not a code generator — output is always &quot;dissection cards&quot;, not new code</li>
              <li>Not SaaS — no accounts, no cloud, no paywall</li>
            </ul>
          </section>

          <section id="howto" className="about-block">
            <h2>How it works · 4 steps</h2>
            <p>
              The design goal: when you scroll past a repo and wonder &quot;can I steal that one piece?&quot;, you should be able to find out before your coffee cools.
            </p>

            <div className="steps" style={{ marginTop: 20 }}>
              {[
                { no: "01", title: "Paste a GitHub URL", desc: "Full URL or owner/repo shorthand both work. Anonymous fetch, public repos only." },
                { no: "02", title: "Say what you're building", desc: "More specific is better — \"AI podcast summarizer\" beats \"AI app\" by an order of magnitude." },
                { no: "03", title: "Pick question mode", desc: "Fixed seven · AI-suggested · your own. Stackable." },
                { no: "04", title: "Take the cards", desc: "Each card has: what it is / why it helps you / how to steal + code snippet + source files." },
              ].map((s) => (
                <div key={s.no} className="step">
                  <div className="step-no">{s.no}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="compare" className="about-block">
            <h2>Different from other tools</h2>
            <div className="compare">
              <div className="compare-cell them">
                <span className="compare-tag">Usual approach</span>
                <h3>Summarize the whole repo</h3>
                <p>
                  &quot;This is an AI chat app built on Next.js 14, the AI SDK, and shadcn/ui, supporting streaming, tool calls, multi-model…&quot;
                </p>
                <span className="frag">Lots of info, no clue where to start</span>
              </div>
              <div className="compare-cell us">
                <span className="compare-tag">Dissect</span>
                <h3>&quot;You&apos;re building X — here are 5 stealable bits&quot;</h3>
                <p>
                  Given your project context, output 5 ready-to-paste cards: streaming chunk rendering, incremental markdown, abort/retry, multi-model routing, tool→UI binding.
                </p>
                <span className="frag">Copy-paste and ship; skip reading the whole repo</span>
              </div>
            </div>
          </section>

          <section id="flow" className="about-block">
            <h2>How the AI thinks</h2>
            <p>Two-stage pipeline. The AI &quot;scouts&quot; first, then &quot;dissects&quot; — you see both stages stream live on the Dissect page.</p>

            <div className="flow-diagram">
              <div className="flow-stage">
                <div className="stage-no">STAGE 1</div>
                <h4>Scout</h4>
                <div className="io">
                  <b>Input</b>
                  <span>README · file tree · package.json / requirements.txt</span>
                </div>
                <div className="io">
                  <b>Output</b>
                  <span>project type · core value · which files to read · suggested questions</span>
                </div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-no">STAGE 2</div>
                <h4>Dissect</h4>
                <div className="io">
                  <b>Input</b>
                  <span>Stage 1 result · key file contents · your project context · selected questions</span>
                </div>
                <div className="io">
                  <b>Output</b>
                  <span>3-8 stealable cards (is / why / how / code / files)</span>
                </div>
              </div>
            </div>

            <p>
              Two-stage scaffolding beats &quot;dump everything into the prompt at once&quot; — context windows don&apos;t blow up, and the output is more structured.
            </p>
          </section>

          <section id="demo" className="about-block">
            <h2>A real example</h2>
            <p>
              Suppose you&apos;re building an AI podcast summarizer that needs to stream summaries into a long document. Here are two sample cards from{" "}
              <code>vercel/ai-chatbot</code> — exactly the parts you can lift.
            </p>

            <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
              <ModuleCard module={SAMPLE_MODULES_EN[0]} index={0} />
              <ModuleCard module={SAMPLE_MODULES_EN[1]} index={1} />
            </div>
          </section>

          <section id="case-douyin" className="about-block">
            <h2>Case · Douyin (TikTok) scraper</h2>
            <p className="about-pull">
              I used this tool on <strong style={{ color: "var(--fg)" }}>6</strong> open-source Douyin scrapers, got back 6 stealable cards covering the full pipeline from signing to browser automation.
            </p>

            <h3>Context</h3>
            <p>
              Building a <strong>Douyin influencer data crawler</strong> — fan counts, video likes, product purchase counts (specifically headphones in the affiliate category). Douyin is China&apos;s TikTok (same parent: ByteDance). Anti-bot has gotten harsh: signature schemes (<code>X-Bogus</code> / <code>msToken</code>), risk-control, rate-limits — each open-source project rolls its own at varying quality. Copying any single one whole-cloth feels risky; reading all of them takes days.
            </p>

            <h3>The 6 repos compared</h3>
            <ul>
              <li>
                <a
                  href="https://github.com/NanmiCoder/MediaCrawler"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>NanmiCoder/MediaCrawler</code>
                </a>{" "}
                · Multi-platform · config-driven + browser automation
              </li>
              <li>
                <a
                  href="https://github.com/Evil0ctal/Douyin_TikTok_Download_API"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>Evil0ctal/Douyin_TikTok_Download_API</code>
                </a>{" "}
                · Async FastAPI · most complete request base class
              </li>
              <li>
                <a
                  href="https://github.com/reader0421/FetchFans"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>reader0421/FetchFans</code>
                </a>{" "}
                · Strategy pattern · best multi-platform extensibility
              </li>
              <li>
                <a
                  href="https://github.com/erma0/douyin"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>erma0/douyin</code>
                </a>{" "}
                · Has frontend · SSE for real-time event push
              </li>
              <li>
                <a
                  href="https://github.com/RookieDevp/douyin-reptiles"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>RookieDevp/douyin-reptiles</code>
                </a>{" "}
                · Cleanest: signature service as a standalone HTTP service
              </li>
              <li>
                <a
                  href="https://github.com/Bowenwin/MediaCrawler_MCP_Server"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>Bowenwin/MediaCrawler_MCP_Server</code>
                </a>{" "}
                · MCP wrapper around MediaCrawler
              </li>
            </ul>

            <h3>6 stealable cards</h3>
            <ol style={{ paddingLeft: 22 }}>
              <li>
                <strong>Douyin X-Bogus signature service</strong> · from{" "}
                <code>RookieDevp/douyin-reptiles</code> · Standalone Flask wrapping the JS script, callable via HTTP — business logic stays decoupled from signing internals
              </li>
              <li>
                <strong>Async crawler base: connection pool, retries, rate-limit</strong> · from{" "}
                <code>Evil0ctal</code> · <code>httpx</code> + <code>asyncio.Semaphore</code> + retries, handles empty responses / timeouts / proxies
              </li>
              <li>
                <strong>Config-driven target management</strong> · from{" "}
                <code>NanmiCoder/MediaCrawler</code> · One config file for target influencer list, accepts URL / short link / raw sec_user_id
              </li>
              <li>
                <strong>Strategy pattern for multi-platform fans data</strong> · from{" "}
                <code>FetchFans</code> · Base abstract + Douyin/Bilibili impls; adding Xiaohongshu later means no main-flow rewrite
              </li>
              <li>
                <strong>SSE real-time event push</strong> · from{" "}
                <code>erma0/douyin</code> · Long-running task progress pushed to frontend via <code>EventSource</code>, no polling
              </li>
              <li>
                <strong>Browser automation, no reverse-engineering</strong> · from{" "}
                <code>NanmiCoder/MediaCrawler</code> · Playwright keeps session state + JS expression to grab signatures, more stable than direct API
              </li>
            </ol>

            <h3>Key decisions from the comparison</h3>
            <p>After comparing all six, two architectural decisions stood out:</p>
            <ul>
              <li>
                <strong>Use RookieDevp&apos;s standalone signature service</strong> — business code never touches JS reversing; if the signing algorithm changes, only one service needs updating
              </li>
              <li>
                <strong>Use MediaCrawler&apos;s browser-automation approach for the overall framework</strong> — direct API calls die under risk-control; the browser path keeps session state and is far more stable
              </li>
            </ul>
            <p>
              The other 4 repos contribute smaller bits each: async base from Evil0ctal, config layout from MediaCrawler, extensibility patterns from FetchFans, event push from erma0.
            </p>

            <p style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 18 }}>
              Reading source from 6 repos by hand would take 1-2 days. This took 5 minutes to dissect + 30 minutes to review the cards — and <em>every block&apos;s origin is traceable</em>, so when something breaks I know exactly which upstream to look at. That&apos;s the real value: not time saved, but <strong>knowing where every piece came from</strong>.
            </p>
          </section>

          <section id="contact" className="about-block">
            <h2>Contact</h2>
            <p>
              This is a solo side project — bugs, ideas, repos you want to dissect but can&apos;t crack are all welcome:
            </p>

            <ul>
              <li>
                <a
                  href="https://github.com/kaijie0074-art/chai-xiao-kuai-xue/issues"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  GitHub Issues
                </a>{" "}
                — for bug reports, feature requests, repo suggestions
              </li>
              <li>
                Chinese-speaking users: scan the QR codes on the{" "}
                <Link
                  href="/about#contact"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  Chinese About page
                </Link>{" "}
                for WeChat / community group
              </li>
            </ul>
          </section>

          <section id="privacy" className="about-block">
            <h2>Privacy statement</h2>
            <div className="privacy-stamp">
              <Icon.Lock />
              <span>API key in localStorage only · no cookies · no telemetry · no third-party tracking</span>
            </div>

            <h3>API Key</h3>
            <p>
              Your API key is written to <code>localStorage</code> only. This tool has <strong>no backend server</strong> — physically, we cannot receive your key. Every LLM call goes from <strong>your browser</strong> straight to Anthropic / OpenAI&apos;s official endpoints.
            </p>

            <h3>GitHub fetching</h3>
            <p>
              Repos are fetched via GitHub&apos;s anonymous API (no token), public repos only. Anon limit is 60/hour/IP — UI surfaces this when hit.
            </p>

            <h3>
              About <code>dangerouslyAllowBrowser</code>
            </h3>
            <p>
              That&apos;s a flag on Anthropic / OpenAI SDKs to permit using API keys from the browser. The &quot;danger&quot; is: if your page is compromised (injected script, hijacked host), the key could leak. <strong>Mitigations</strong>:
            </p>
            <ul>
              <li>This tool injects zero third-party analytics — DevTools-verifiable</li>
              <li>Set a low spending cap on your provider console</li>
              <li>Don&apos;t use this on public computers</li>
            </ul>

            <h3>Tracking</h3>
            <ul>
              <li>No cookies</li>
              <li>No GA / Plausible / any analytics SDK</li>
              <li>Fonts self-hosted via Next.js (no third-party font CDN)</li>
            </ul>

            <h3>Open source</h3>
            <p>
              Source:{" "}
              <a
                href="https://github.com/kaijie0074-art/chai-xiao-kuai-xue"
                target="_blank"
                rel="noopener"
                style={{ color: "var(--accent-text)", textDecoration: "underline" }}
              >
                github.com/kaijie0074-art/chai-xiao-kuai-xue
              </a>
              . Audit welcome — especially <code>lib/providers/*</code> and <code>lib/openrouter-oauth.ts</code> (all the key-handling lives there; no &quot;upload to a third-party server&quot; logic exists).
            </p>
          </section>

          <section id="faq" className="about-block">
            <h2>FAQ</h2>

            <h3>Can someone sniff my key?</h3>
            <p>
              Pure frontend, no backend; <code>localStorage</code> is browser-isolated. But browser extensions CAN read localStorage — don&apos;t install sketchy extensions.
            </p>

            <h3>Why not server-side proxy?</h3>
            <p>That would mean we hold your key, which defeats BYOK.</p>

            <h3>Claude or OpenAI for dissection?</h3>
            <p>Claude Opus / Sonnet performs more consistently on dissection. On a budget, Haiku or gpt-4o-mini also work.</p>

            <h3>What about GitHub&apos;s 60/h cap?</h3>
            <p>
              Same-repo fetches are cached in sessionStorage for 1 hour. Want more? Add a GitHub token in Settings — limit jumps to 5000/hour.
            </p>

            <h3>Large repos blow up the token budget?</h3>
            <p>
              No. File tree capped at 2 levels deep, up to 8 subdirs expanded, key files capped at 40KB each, README at 12000 chars — over that, truncated.
            </p>
          </section>

          <section id="credits" className="about-block">
            <h2>Credits / inspiration</h2>
            <p>
              The name <em>拆小块学</em> (&quot;dissect into small bits, study them&quot;) comes from a line attributed to nobody in particular:{" "}
              <em style={{ color: "var(--accent-text)" }}>&quot;You don&apos;t need the whole book. You need the page that helps.&quot;</em>
            </p>
            <p>
              Design takes cues from Linear / Vercel&apos;s restraint, but with recipe-card layouts — because what we want is the <strong>practical, tear-it-out-and-take-it-with-you</strong> feel, not the &quot;AI toy&quot; gloss.
            </p>
            <p
              style={{
                marginTop: 32,
                color: "var(--fg-4)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              — Dissect MVP v0.1
              <br />— Built solo, no subscription,
              <br />
              &nbsp;&nbsp;&nbsp; your key your business.
            </p>
          </section>
        </main>

        <aside className="about-side">
          <h5>On this page</h5>
          {TOC.map((t) => (
            <a
              key={t.id}
              className={"toc-link" + (section === t.id ? " on" : "")}
              onClick={(e) => {
                e.preventDefault();
                tocClick(t.id);
              }}
              role="button"
            >
              {t.label}
            </a>
          ))}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <Link
              href="/en/analyze"
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Start dissecting <Icon.ArrowRight />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
