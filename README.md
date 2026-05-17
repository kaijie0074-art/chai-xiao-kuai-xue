# Dissect · 拆小块学

> Don&apos;t learn a project. Learn the small piece of it that&apos;s useful to you.
> 不要学一个项目，学它对你有用的那一小块。

🇺🇸 **English** · [🇨🇳 中文](./README.zh-CN.md)

🌐 **Live**: https://chai-xiao-kuai-xue.vercel.app (bilingual, BYOK, no signup)

---

## What it is

A pure-frontend GitHub project dissector. Paste a repo link + tell it what *you&apos;re* building, and a 2-stage LLM pipeline returns 3-8 stealable module cards — each with what it is, why it helps your project, how to migrate it, plus the actual source code snippet.

Unlike DeepWiki / Copilot Workspace which summarize the whole repo, this tool **uses your project context** to surface only the parts you can actually take.

Optional Stage 3 (one click): roll all the cards into an AI prompt you paste into Claude / ChatGPT / Cursor to have the downstream AI integrate the bits into your project.

## Highlights

- **BYOK**: bring your own key — keys never leave your browser
- **Multi-repo comparison**: stack 1-N GitHub URLs to compare side-by-side
- **6 LLM providers**: Anthropic / OpenAI / OpenRouter (OAuth) / DeepSeek / Kimi / Zhipu GLM / custom relay (any OpenAI-compatible base URL)
- **Bilingual**: full Chinese + English UI (`/` ZH, `/en` EN) including prompts
- **Local history**: dissection results auto-save to localStorage
- **Two-stage prompt design**: scout → dissect, so context windows don&apos;t blow up
- **Zero backend**: pure static prerender, deploys to any CDN

## Stack

- **Next.js 14** App Router · TypeScript · static prerender
- **Tailwind config + hand-written CSS** (no shadcn dependency)
- **Zustand** + persist (localStorage)
- **`@anthropic-ai/sdk`** + **`openai`** SDKs (both with `dangerouslyAllowBrowser`)
- **`react-markdown` + `remark-gfm`** for card rendering
- Self-hosted Geist font via `geist` package, Noto Sans SC for OG images
- **OpenRouter OAuth PKCE** — browser-only sign-in, no backend needed

## Local development

```bash
cd web
npm install
npm run dev    # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

No `.env` setup needed — every API key is configured in-browser at `/settings`.

## Project structure

```
web/
├─ app/
│  ├─ page.tsx              # landing /
│  ├─ analyze/              # /analyze (core)
│  ├─ history/              # /history (local bundle store)
│  ├─ settings/             # /settings (BYOK)
│  ├─ about/                # /about (philosophy + privacy)
│  ├─ oauth/callback/       # OpenRouter PKCE callback
│  ├─ en/                   # entire English mirror under /en/*
│  ├─ layout.tsx            # nav + footer + theme + no-flash inline script
│  ├─ opengraph-image.tsx   # ZH OG image (1200x630, Noto Sans SC)
│  ├─ en/opengraph-image.tsx # EN OG image
│  ├─ icon.tsx              # favicon
│  ├─ sitemap.ts            # sitemap.xml (with hreflang)
│  └─ robots.ts             # robots.txt
├─ components/              # ModuleCard / PhaseStrip / Stage1Summary / ...
├─ lib/
│  ├─ analyze.ts            # 2-stage pipeline orchestration
│  ├─ active-run.ts         # global run state (Zustand, survives route changes)
│  ├─ history.ts            # bundle persistence
│  ├─ github.ts             # GitHub public API + optional Token
│  ├─ store.ts              # settings store (provider/key/model/baseURL)
│  ├─ i18n.ts               # bilingual dict + useLocale/useDict
│  ├─ openrouter-oauth.ts   # browser-side PKCE flow
│  ├─ providers/            # AnthropicProvider / OpenAIProvider /
│  │                        # OpenRouterProvider / OpenAICompatibleProvider
│  └─ prompts/              # stage1 / stage2 / synthesize (ZH + EN system prompts)
└─ public/contact/          # contact QR codes
```

## Data flow

```
User input (URLs + context + modes)
        │
        ▼
runAnalyze() ── lib/active-run.ts ─── Zustand store
        │
        ├─ 1. fetchRepoBundle()           (GitHub public API, anon or token)
        ├─ 2. Stage 1 LLM stream          → project_type / core_value /
        │                                   files_to_read_next / questions
        ├─ 3. fetchKeyFiles()              (raw.githubusercontent.com)
        ├─ 4. Stage 2 LLM stream          → modules[]
        │
        ▼
ResultsPanel → ModuleCard × N
        │
        └─ optional Stage 3: runSynthesize() → markdown prompt
```

## Privacy / BYOK

- API key in `localStorage` only (key name: `dissect-mvp-settings`)
- LLM calls go browser-direct to provider APIs (`dangerouslyAllowBrowser` flag)
- GitHub fetched via anonymous public API (60/h limit) or your own token
- No cookies, no analytics, no third-party trackers
- Audit: `lib/providers/*` + `lib/openrouter-oauth.ts` is where all key handling lives

Full privacy statement: `/about` page or `/en/about`.

## i18n

URLs:
- `/` — Chinese (default)
- `/en` — English

Both share localStorage and history. Switching language via the nav toggle preserves the current page (e.g., `/analyze` ⟷ `/en/analyze`).

Stage prompts are emitted in the active locale — Chinese pages produce Chinese cards, English pages produce English cards.

## Deploy your own

The site is a pure static export. Push to Vercel / Cloudflare Pages / Netlify and it just works. No env vars, no database, no serverless functions.

```bash
# Vercel one-click
vercel
```

## License

MIT (see `LICENSE` — TODO add one).

## Contact / contribute

- Bugs / features: [GitHub Issues](https://github.com/kaijie0074-art/chai-xiao-kuai-xue/issues)
- Chinese users: WeChat QR codes on the `/about` page

Pull requests welcome — especially for additional LLM providers, prompt improvements, or English UX polish.

---

Built solo, no subscription, your key your business.
