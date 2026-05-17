"use client";

/**
 * Lightweight bilingual dict (zh-CN + en).
 *
 * - `/...` 路由用 zh
 * - `/en/...` 路由用 en
 * - 组件用 `useDict()` 拿当前 locale 的字符串
 * - 服务端组件可以接收 `locale` prop 直接选 zh/en
 */

import { usePathname } from "next/navigation";

export type Locale = "zh" | "en";

export const zh = {
  nav: {
    brand: "拆小块学",
    home: "首页",
    analyze: "拆解",
    history: "历史",
    settings: "设置",
    about: "关于",
    switchLang: "EN",
    themeToggleLight: "切换到明亮模式",
    themeToggleDark: "切换到暗色模式",
  },
  footer: {
    byok: "BYOK · 你的 API Key 仅存在本地浏览器，永不上传服务器",
    privacy: "隐私与开源声明 →",
    source: "源码",
    sourceTitle: "GitHub 源码",
  },
  card: {
    no: "NO.",
    isWhat: "是什么",
    whyUseful: "对你为什么有用",
    howToSteal: "怎么搬过来",
    copyCode: "复制代码",
    codeCopied: "✓ 代码已复制",
    hint: "复制为 Markdown，粘到你的项目里",
    tear: "撕下来",
    torn: "已复制",
    tornStamp: "已复制",
  },
  phase: {
    fetching: "抓取",
    stage1: "Stage 1 · 侦察",
    fetchingKeyFiles: "关键文件",
    stage2: "Stage 2 · 拆解",
    done: "完成",
  },
  error: {
    bannerTitle: "拆解失败",
    retry: "重试",
    synthFailedTitle: "合成失败",
  },
  synth: {
    badge: "SYNTHESIZED · STAGE 3",
    title: "AI 提示词 · 合成版",
    copyPrompt: "复制 Prompt",
    copied: "已复制",
    sectionLabel: "粘到 Claude / ChatGPT / Cursor 让它接着干",
    streaming: "生成中…",
    description: "整合了上面所有卡片 · 一段 prompt 喂给下游 AI 完成你的项目",
    regenerate: "重新生成",
    pitchTitle: "合成下一步 · 生成 AI 提示词",
    pitchBody:
      "把上面这些卡片整合成一段可直接粘到 Claude / ChatGPT / Cursor 的 prompt——让下游 AI 接着帮你把这些可搬小块落到你自己的项目里。",
    pitchButton: "生成 AI 提示词 →",
    cancel: "取消生成",
  },
  stage1Summary: {
    title: "✓ AI 已识别项目",
    type: "类型",
    coreValue: "核心价值",
    drillDown: "下钻方向",
  },
  fetchingKeyFiles: "正在抓取 Stage 1 提名的关键文件…",
  fetching: {
    label: "抓取",
  },
  llmError: {
    auth: "API Key 似乎无效或权限不足，请到「设置」检查。Key 仅存在你本地浏览器。",
    rateLimit:
      "LLM 服务返回限额错误（429）。请稍候再试，或到控制台检查账户余额/配额。",
    badRequest400Hint:
      "排查：① 设置页里 model 名字是否中转站认识；② 打开 DevTools → Network，看失败请求的 Response Body 里 error.message。",
    badRequestPrefix: "LLM 请求被拒绝（HTTP 400）：",
    networkPrefix: "网络错误：",
  },
  githubError: {
    notFound: (slug: string) =>
      `找不到这个 repo（${slug}），请检查链接是否正确，或它可能是私有 repo（MVP 仅支持公开 repo）`,
    private: "这是一个私有 repo，MVP 仅支持公开 repo。",
    rateLimitNoToken:
      "GitHub 匿名调用已达限额（60 次/小时/IP）。\n解决：去设置页填一个 GitHub Token（不需要任何权限），抓取限额会涨到 5000 次/小时。创建：github.com/settings/tokens",
    rateLimitWithToken:
      "GitHub 调用达到限额（5000 次/小时）。等一小时重置，或换一个 token。",
    networkPrefix: "网络错误：无法访问 GitHub API（",
  },
  /** 按 errorKind 翻译的错误总览 — UI 层用 */
  errorByKind: {
    auth: "API Key 似乎无效或权限不足。请到「设置」检查。",
    rate_limit: "服务返回限额错误。请稍候再试，或检查账户余额/配额。",
    rate_limit_github_anon:
      "GitHub 匿名调用达到限额（60 次/小时）。去设置页填一个 GitHub Token，限额会涨到 5000/小时。",
    rate_limit_github_token:
      "GitHub 限额到顶（5000/小时）。等一小时重置，或换一个 token。",
    not_found: "找不到这个 repo。请检查链接是否正确，或它可能是私有 repo（MVP 仅支持公开 repo）。",
    private: "这是一个私有 repo。MVP 仅支持公开 repo。",
    bad_request: "请求被拒绝（HTTP 400）。该 provider / model 可能不支持本工具发送的某些参数，可换 model / provider 试试。",
    network: "网络错误。请检查网络连接。",
    unknown: "未知错误。",
  },
  demo: {
    tryButton: "🎬 试一下 demo · 不需 Key",
    tryButtonHint: "用预设数据走一遍完整流程，不消耗任何配额",
    bannerTitle: "Demo 模式",
    bannerBody: "上面这些卡片是预设数据，不是真拆解。想真拆？",
    bannerCta: "去设置配 API Key →",
  },
};

type Dict = typeof zh;

export const en: Dict = {
  nav: {
    brand: "Dissect",
    home: "Home",
    analyze: "Dissect",
    history: "History",
    settings: "Settings",
    about: "About",
    switchLang: "中",
    themeToggleLight: "Switch to light mode",
    themeToggleDark: "Switch to dark mode",
  },
  footer: {
    byok: "BYOK · Your API key lives only in your browser. We never see it.",
    privacy: "Privacy & open-source →",
    source: "Source",
    sourceTitle: "GitHub source",
  },
  card: {
    no: "NO.",
    isWhat: "What it is",
    whyUseful: "Why it helps you",
    howToSteal: "How to steal it",
    copyCode: "Copy code",
    codeCopied: "✓ Code copied",
    hint: "Copy as Markdown, paste into your project",
    tear: "Tear it off",
    torn: "Copied",
    tornStamp: "COPIED",
  },
  phase: {
    fetching: "Fetch",
    stage1: "Stage 1 · Scout",
    fetchingKeyFiles: "Key files",
    stage2: "Stage 2 · Dissect",
    done: "Done",
  },
  error: {
    bannerTitle: "Dissection failed",
    retry: "Retry",
    synthFailedTitle: "Synthesis failed",
  },
  synth: {
    badge: "SYNTHESIZED · STAGE 3",
    title: "AI prompt · synthesized",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    sectionLabel: "Paste into Claude / ChatGPT / Cursor and let it run",
    streaming: "Generating…",
    description:
      "Synthesizes all the cards above · paste this prompt into a downstream AI to ship your project",
    regenerate: "Regenerate",
    pitchTitle: "Stage 3 · Synthesize an AI prompt",
    pitchBody:
      "Roll all the cards above into one prompt you can drop into Claude / ChatGPT / Cursor — let that AI wire the stealable bits into your actual project.",
    pitchButton: "Generate AI prompt →",
    cancel: "Cancel",
  },
  stage1Summary: {
    title: "✓ AI has identified the project",
    type: "Type",
    coreValue: "Core value",
    drillDown: "Drill into",
  },
  fetchingKeyFiles: "Fetching key files nominated by Stage 1…",
  fetching: {
    label: "Fetching",
  },
  llmError: {
    auth: "API key seems invalid or unauthorized. Check Settings. Your key never leaves your browser.",
    rateLimit:
      "LLM provider returned rate-limit (429). Wait a bit, or check your quota/balance.",
    badRequest400Hint:
      "Debug: ① Verify the model name in Settings matches what your relay accepts; ② Open DevTools → Network and inspect the failed response body's error.message.",
    badRequestPrefix: "LLM rejected the request (HTTP 400): ",
    networkPrefix: "Network error: ",
  },
  githubError: {
    notFound: (slug: string) =>
      `Can't find repo (${slug}). Check the URL — it may also be private (MVP supports public repos only).`,
    private: "This is a private repo. MVP supports public repos only.",
    rateLimitNoToken:
      "GitHub anonymous quota exhausted (60/hour/IP).\nFix: paste a GitHub Token in Settings (no scopes needed) to raise the limit to 5000/hour. Create one: github.com/settings/tokens",
    rateLimitWithToken:
      "GitHub quota exhausted (5000/hour). Wait an hour or swap your token.",
    networkPrefix: "Network error: couldn't reach GitHub API (",
  },
  errorByKind: {
    auth: "API key seems invalid or unauthorized. Check Settings.",
    rate_limit: "Provider returned rate-limit. Wait a bit or check your quota/balance.",
    rate_limit_github_anon:
      "GitHub anonymous quota exhausted (60/hour). Paste a GitHub Token in Settings — limit becomes 5000/hour.",
    rate_limit_github_token:
      "GitHub quota exhausted (5000/hour). Wait an hour or swap your token.",
    not_found: "Can't find the repo. Check the URL — it may be private (MVP supports public repos only).",
    private: "This is a private repo. MVP supports public repos only.",
    bad_request: "Request rejected (HTTP 400). Your provider/model may not accept some params we send — try a different model or provider.",
    network: "Network error. Check your connection.",
    unknown: "Unknown error.",
  },
  demo: {
    tryButton: "🎬 Try a demo · No key needed",
    tryButtonHint: "Runs through the full flow with prefab data — costs nothing",
    bannerTitle: "Demo mode",
    bannerBody: "These cards are prefab data, not a real dissection. Want the real thing?",
    bannerCta: "Set up your API key →",
  },
};

const DICTS = { zh, en };

export function useLocale(): Locale {
  const pathname = usePathname();
  if (!pathname) return "zh";
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
}

export function useDict(): Dict {
  return DICTS[useLocale()];
}

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** 把当前路径切到另一个 locale 的对应路径 */
export function swapLocalePath(pathname: string, target: Locale): string {
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  if (target === "en") {
    if (isEn) return pathname;
    if (pathname === "/") return "/en";
    return "/en" + pathname;
  } else {
    if (!isEn) return pathname;
    if (pathname === "/en") return "/";
    return pathname.replace(/^\/en/, "") || "/";
  }
}
