import type { Module } from "./prompts/stage2";

/**
 * 静态示例卡片，仅用于落地页演示。
 * 字段形状与真实 Stage 2 输出一致（与 lib/prompts/stage2.ts:Module 对齐）。
 */
export const SAMPLE_MODULES_EN: Module[] = [
  {
    id: "stream-render",
    title: "Streaming chunk rendering without flicker",
    what_it_is:
      "Treat the LLM token stream as a **continuously growing substring**, not React state that re-renders from zero every time. The component subscribes to a `readableStream` and only appends — never re-renders the whole thing.",
    why_useful_for_you:
      "If you're building a **podcast summarizer**, the summary can be 800-2000 words. Naive `setState` concat triggers a full React diff per token — long-form output **flickers and jumps**. This pattern drops in directly.",
    how_to_steal:
      "1. Lift the `streamText()` wrapper from `app/(chat)/api/chat/route.ts`\n2. On the client, use `useChat` (or roll your own) to subscribe to `response.body`\n3. Split the partial string into 'stabilized chunks' + 'currently generating chunk' in the render layer\n4. Memoize the stabilized chunks (`useMemo` + key), render only the live chunk freshly",
    code_snippet:
      "// app/api/summarize/route.ts\nexport async function POST(req: Request) {\n  const { transcript } = await req.json();\n  const result = streamText({\n    model: anthropic('claude-opus-4-7'),\n    system: SUMMARY_SYSTEM,\n    prompt: transcript,\n  });\n  return result.toDataStreamResponse();\n}",
    source_files: [
      "app/(chat)/api/chat/route.ts",
      "components/message.tsx",
      "lib/streaming/data-stream-handler.ts",
    ],
  },
  {
    id: "md-increment",
    title: "Incremental markdown rendering — avoid re-parsing on every token",
    what_it_is:
      "**Memoized markdown subtrees** + segment-level diffing: split streaming markdown by paragraph; only the last paragraph is dynamic, everything before is a frozen React node. Pair with `react-markdown` + `remark` plugins.",
    why_useful_for_you:
      "Your **podcast summary** is markdown. At 1k+ characters, re-parsing the entire string on each token spikes CPU. Drop in segment-level freezing and a 5000-word summary streams smoothly.",
    how_to_steal:
      "1. Read `components/markdown.tsx` for the `memo()` wrapping\n2. Split streaming text by `\\n\\n`; render the last segment fresh\n3. Front segments use stable keys (hash the first line) + `React.memo`\n4. Add `remark-gfm` for tables / task lists",
    code_snippet:
      "// components/Markdown.tsx\nconst MemoBlock = memo(({ src }: { src: string }) => (\n  <ReactMarkdown remarkPlugins={[remarkGfm]}>{src}</ReactMarkdown>\n));\n\nexport function StreamingMarkdown({ text }: { text: string }) {\n  const blocks = text.split(/\\n{2,}/);\n  return blocks.map((b, i) =>\n    <MemoBlock key={i + ':' + hash(b)} src={b} />);\n}",
    source_files: ["components/markdown.tsx", "components/message.tsx"],
  },
  {
    id: "abort-retry",
    title: "Abort & retry — let users stop mid-generation",
    what_it_is:
      "Pipe an `AbortSignal` end-to-end; the UI calls `stop()` exposed by `useChat` to abort, then `reload()` to resend the last message.",
    why_useful_for_you:
      "**Podcast summarization** takes 30s–2min. Users change their mind often. Surfacing stop / reload massively reduces 'wait wait wait, close tab' drop-off.",
    how_to_steal:
      "1. Frontend: hold a controller in `useState<AbortController>`\n2. Switch the button to 'Stop' during streaming, wired to `controller.abort()`\n3. Backend: pass `req.signal` into `streamText({ abortSignal })`\n4. After abort, KEEP what's been generated — let users resume",
    code_snippet:
      "// hooks/useSummary.ts\nconst [ctrl, setCtrl] = useState<AbortController | null>(null);\n\nasync function start() {\n  const c = new AbortController();\n  setCtrl(c);\n  await fetch('/api/summarize', { signal: c.signal });\n}\n\nconst stop = () => ctrl?.abort();",
    source_files: ["hooks/use-chat.ts", "components/chat.tsx"],
  },
];

export const SAMPLE_MODULES: Module[] = [
  {
    id: "stream-render",
    title: "流式分块渲染：让 partial 文本不闪烁",
    what_it_is:
      "把 LLM 的 token 流当成**持续到达的子串**，而不是 React 状态每次都从 0 重排。组件订阅一个 `readableStream`，每次只 append，避免整段重新渲染。",
    why_useful_for_you:
      "你做**播客摘要工具**，摘要可能 800–2000 字，如果用普通 `setState` 拼接，每来一个 token 就触发 React diff 整段重排，长文会肉眼可见地**闪烁与抖动**。这套方案直接能搬。",
    how_to_steal:
      "1. 把 `app/(chat)/api/chat/route.ts` 里的 `streamText()` 包装抄走\n2. 前端用 `useChat`（或自己写）订阅 `response.body`\n3. 渲染层把 partial 字符串切成「已稳定段」+「正在生成段」\n4. 已稳定段记忆化（`useMemo` + key），正在生成段单独渲染",
    code_snippet:
      "// app/api/summarize/route.ts\nexport async function POST(req: Request) {\n  const { transcript } = await req.json();\n  const result = streamText({\n    model: anthropic('claude-opus-4-7'),\n    system: SUMMARY_SYSTEM,\n    prompt: transcript,\n  });\n  return result.toDataStreamResponse();\n}",
    source_files: [
      "app/(chat)/api/chat/route.ts",
      "components/message.tsx",
      "lib/streaming/data-stream-handler.ts",
    ],
  },
  {
    id: "md-increment",
    title: "Markdown 增量渲染，避免每个 token 都全文重排",
    what_it_is:
      "用**记忆化的 markdown 子树**+ 段级 diff：把流式 markdown 按段落切，只有「最后一段」是动态的，前面所有段都是冻结的 React 节点。配合 `react-markdown` 的 remark 插件。",
    why_useful_for_you:
      "你的**播客摘要**是 markdown，长 1k+ 字时如果整段 reparse，CPU 直接爆掉。把这套段级冻结的方案搬过去，能让 5000 字摘要边生成边丝滑。",
    how_to_steal:
      "1. 看 `components/markdown.tsx` 里 `memo()` 的 wrapping\n2. 把流式文本按 `\\n\\n` 切段、最后一段单独渲染\n3. 前面的段用稳定 key（hash 一下首行）+ `React.memo`\n4. 插一个 `remark-gfm` 用于表格 / 任务列表",
    code_snippet:
      "// components/Markdown.tsx\nconst MemoBlock = memo(({ src }: { src: string }) => (\n  <ReactMarkdown remarkPlugins={[remarkGfm]}>{src}</ReactMarkdown>\n));\n\nexport function StreamingMarkdown({ text }: { text: string }) {\n  const blocks = text.split(/\\n{2,}/);\n  return blocks.map((b, i) =>\n    <MemoBlock key={i + ':' + hash(b)} src={b} />);\n}",
    source_files: ["components/markdown.tsx", "components/message.tsx"],
  },
  {
    id: "abort-retry",
    title: "中断与重试：让用户能在生成中按下停止",
    what_it_is:
      "请求侧透传 `AbortSignal`，UI 层用 `useChat` 暴露的 `stop()` 把当前生成中断，再用 `reload()` 拿最后一条消息重发。",
    why_useful_for_you:
      "**播客摘要**耗时长（30s–2min），用户开了之后想反悔很常见。把 stop / reload 暴露出来，能极大降低「等着等着干脆关页面」的流失。",
    how_to_steal:
      "1. 前端：用 `useState<AbortController>` 持有 controller\n2. 进入流式状态时给按钮换文案为「停止」并 wire 到 `controller.abort()`\n3. 后端：把 `req.signal` 透传给 `streamText({ abortSignal })`\n4. 停止后保留已生成内容（不要清空），可一键继续",
    code_snippet:
      "// hooks/useSummary.ts\nconst [ctrl, setCtrl] = useState<AbortController | null>(null);\n\nasync function start() {\n  const c = new AbortController();\n  setCtrl(c);\n  await fetch('/api/summarize', { signal: c.signal });\n}\n\nconst stop = () => ctrl?.abort();",
    source_files: ["hooks/use-chat.ts", "components/chat.tsx"],
  },
];
