/**
 * Demo 模式的硬编码内容——供 `/analyze` 页面的「试一下」按钮使用。
 *
 * 让没配 API Key 的访客也能体验完整拆解流程：phase 推进 → 流式文本 →
 * Stage 1 摘要 → 模块卡片 → AI 提示词合成。
 *
 * 全部数据是预设的，不会发任何网络请求。
 */

import type { Stage1Output } from "./prompts/stage1";
import type { Module } from "./prompts/stage2";
import { SAMPLE_MODULES, SAMPLE_MODULES_EN } from "./sample-modules";

export interface DemoData {
  target: string;
  repo: { owner: string; repo: string };
  stage1Chunks: string[];
  stage1Result: Stage1Output;
  stage2Chunks: string[];
  modules: Module[];
  synthChunks: string[];
}

function chunkify(text: string, size = 4): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

/* ───────── 中文 demo ───────── */

const STAGE1_TEXT_ZH = `正在读取 README.md 和根目录文件树…

→ 检测到 Next.js 14 App Router
→ 检测到 AI SDK (\`ai\` package)
→ 检测到 shadcn/ui 组件库

项目类型识别：前端 AI 聊天应用（带工具调用、流式渲染、多模型路由）

核心价值：把 LLM 的流式输出做成一个生产级别的对话 UI，支持工具调用、附件、多人会话与持久化。

结合用户的「AI 文档助手」场景推荐下钻：
  · 流式分块渲染（streamText / partial 文本）
  · Markdown 增量渲染（避免重排闪烁）
  · 中断与重试 (abort signal)
`;

const STAGE2_TEXT_ZH = `拆解第 1 块：「流式分块渲染」—— 关键在 \`components/message.tsx\` 与 \`lib/streaming/\`…

拆解第 2 块：「Markdown 增量渲染（不闪烁）」—— 用 \`react-markdown\` + 段级 memo 化…

拆解第 3 块：「Abort 信号与重试」—— \`useChat\` 暴露 \`stop()\` 与 \`reload()\`…

→ 3 张卡片已拆完，整理 JSON 中…
`;

const SYNTH_TEXT_ZH = `# 项目目标
我在做一个 AI 文档助手 —— 基于 Next.js + Claude API，要支持流式输出长文档（800-2000 字摘要），并允许用户中途停止与重试。

# 参考实现（从 vercel/ai-chatbot 拆出来的可搬部分）

## 1. 流式分块渲染 · 来自 vercel/ai-chatbot
- 关键文件：\`components/message.tsx\` / \`app/(chat)/api/chat/route.ts\`
- 核心方案：服务端用 \`streamText()\` 返回 \`toDataStreamResponse()\`，前端 \`useChat\` 订阅 \`response.body\`，渲染层把 partial 字符串切成「已稳定段」+「正在生成段」分别渲染
- 代码示意：

\`\`\`ts
// app/api/summarize/route.ts
export async function POST(req: Request) {
  const { transcript } = await req.json();
  const result = streamText({
    model: anthropic('claude-opus-4-7'),
    system: SUMMARY_SYSTEM,
    prompt: transcript,
  });
  return result.toDataStreamResponse();
}
\`\`\`

## 2. Markdown 增量渲染 · 来自 vercel/ai-chatbot
- 关键文件：\`components/markdown.tsx\`
- 核心方案：按 \`\\n\\n\` 切段，每段独立 \`memo()\`，只有最后一段是动态的——避免长文流式时整段重新 reparse
- 代码示意：

\`\`\`tsx
const MemoBlock = memo(({ src }: { src: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{src}</ReactMarkdown>
));
\`\`\`

## 3. Abort / Retry · 来自 vercel/ai-chatbot
- 关键文件：\`hooks/use-chat.ts\`
- 核心方案：前端持有 \`AbortController\`，按钮 wire 到 \`controller.abort()\`；后端把 \`req.signal\` 透传给 \`streamText({ abortSignal })\`

# 实现要求
- 框架：Next.js 14 App Router + TypeScript
- LLM：Claude（Anthropic SDK）
- 用法风格请参考上述方案
- 中文文档输出，2000 字以内

# 优先级建议
1. 先把 streaming pipeline 跑通（方案 1）
2. 再加 markdown 增量渲染（方案 2）—— 这是用户体验的关键
3. 最后接 abort/retry（方案 3）—— 用户体验的"逃生通道"

请按上述方案帮我搭出 MVP 骨架，优先实现流式路由 + 一个基础的 \`<StreamingMarkdown>\` 组件。
`;

export const DEMO_ZH: DemoData = {
  target: "我在做一个 AI 文档助手（Next.js + Claude API），需要把生成的长摘要流式渲染到文档里，最好用户能随时停止。",
  repo: { owner: "vercel", repo: "ai-chatbot" },
  stage1Chunks: chunkify(STAGE1_TEXT_ZH),
  stage1Result: {
    project_type: "前端 AI 聊天应用",
    core_value:
      "把 LLM 流式输出做成生产级对话 UI；带工具调用、附件、多人会话与持久化",
    files_to_read_next: [
      "components/message.tsx",
      "app/(chat)/api/chat/route.ts",
      "lib/streaming/data-stream-handler.ts",
      "components/markdown.tsx",
      "hooks/use-chat.ts",
    ],
    suggested_questions_if_dynamic_mode: [
      "它怎么把 partial 文本流到组件里、又不闪？",
      "Markdown 增量渲染的核心技巧？",
      "中断与重试是怎么实现的？",
    ],
  },
  stage2Chunks: chunkify(STAGE2_TEXT_ZH),
  modules: SAMPLE_MODULES,
  synthChunks: chunkify(SYNTH_TEXT_ZH, 6),
};

/* ───────── 英文 demo ───────── */

const STAGE1_TEXT_EN = `Reading README.md and the root file tree…

→ Detected Next.js 14 App Router
→ Detected AI SDK (\`ai\` package)
→ Detected shadcn/ui components

Project type: frontend AI chat application (with tool calls, streaming render, multi-model routing)

Core value: production-grade conversational UI on top of LLM streaming — handles tool calls, attachments, multi-user sessions, and persistence.

Given your "AI doc assistant" context, drill into:
  · Streaming chunked render (streamText / partial text)
  · Incremental markdown render (no reflow flicker)
  · Abort & retry (AbortSignal piping)
`;

const STAGE2_TEXT_EN = `Card 1: "Streaming chunked render" — key files in \`components/message.tsx\` and \`lib/streaming/\`…

Card 2: "Incremental markdown render (no flicker)" — \`react-markdown\` + segment-level \`memo()\`…

Card 3: "Abort & retry" — \`useChat\` exposes \`stop()\` and \`reload()\`…

→ 3 cards ready, structuring JSON…
`;

const SYNTH_TEXT_EN = `# Project goal
I'm building an AI doc assistant on Next.js + Claude API. It needs to stream long summaries (800-2000 words) and let users abort mid-generation.

# Reference implementations (from vercel/ai-chatbot)

## 1. Streaming chunked render · from vercel/ai-chatbot
- Key files: \`components/message.tsx\` / \`app/(chat)/api/chat/route.ts\`
- Approach: server uses \`streamText()\` → \`toDataStreamResponse()\`; client \`useChat\` subscribes to \`response.body\`; render layer splits the partial string into "stabilized chunks" + "live chunk"
- Sketch:

\`\`\`ts
// app/api/summarize/route.ts
export async function POST(req: Request) {
  const { transcript } = await req.json();
  const result = streamText({
    model: anthropic('claude-opus-4-7'),
    system: SUMMARY_SYSTEM,
    prompt: transcript,
  });
  return result.toDataStreamResponse();
}
\`\`\`

## 2. Incremental markdown · from vercel/ai-chatbot
- Key file: \`components/markdown.tsx\`
- Approach: split by \`\\n\\n\`, each segment is a memoized \`<ReactMarkdown>\`; only the last segment is live — long documents don't re-parse the whole tree on each token
- Sketch:

\`\`\`tsx
const MemoBlock = memo(({ src }: { src: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{src}</ReactMarkdown>
));
\`\`\`

## 3. Abort / Retry · from vercel/ai-chatbot
- Key file: \`hooks/use-chat.ts\`
- Approach: client holds an \`AbortController\`; button wired to \`controller.abort()\`; server pipes \`req.signal\` into \`streamText({ abortSignal })\`

# Requirements
- Stack: Next.js 14 App Router + TypeScript
- LLM: Claude (Anthropic SDK)
- Style: follow the above
- Output: ≤ 2000 words, markdown

# Priorities
1. Streaming pipeline (#1) — get tokens flowing
2. Incremental markdown render (#2) — this is the UX-make-or-break
3. Abort/retry (#3) — the user's escape hatch

Please scaffold an MVP per the above, prioritizing the streaming route + a basic \`<StreamingMarkdown>\` component.
`;

export const DEMO_EN: DemoData = {
  target: "I'm building an AI doc assistant on Next.js + Claude API. It needs to stream long summaries and let users abort mid-generation.",
  repo: { owner: "vercel", repo: "ai-chatbot" },
  stage1Chunks: chunkify(STAGE1_TEXT_EN),
  stage1Result: {
    project_type: "Frontend AI chat application",
    core_value:
      "Production-grade conversational UI on top of LLM streaming — with tool calls, attachments, multi-user sessions, persistence",
    files_to_read_next: [
      "components/message.tsx",
      "app/(chat)/api/chat/route.ts",
      "lib/streaming/data-stream-handler.ts",
      "components/markdown.tsx",
      "hooks/use-chat.ts",
    ],
    suggested_questions_if_dynamic_mode: [
      "How does it stream partial text into components without flickering?",
      "What's the trick for incremental markdown rendering?",
      "How is abort & retry implemented?",
    ],
  },
  stage2Chunks: chunkify(STAGE2_TEXT_EN),
  modules: SAMPLE_MODULES_EN,
  synthChunks: chunkify(SYNTH_TEXT_EN, 6),
};
