/**
 * 固定七问 — 硬编码版本。
 * 这些问题是经过精挑的"普适性高、可迁移性强"的工程问题。
 */
export const SEVEN_QUESTIONS: { id: string; text: string }[] = [
  { id: "llm_abstraction", text: "这个项目的 LLM 调用层是怎么抽象的？多 provider/多 model 如何切换？" },
  { id: "streaming", text: "流式响应 / 分块渲染是怎么处理的？前后端是怎么衔接的？" },
  { id: "markdown", text: "Markdown 与代码块渲染方案？有没有处理流式 markdown 的边角案例？" },
  { id: "prompt_mgmt", text: "Prompt 是怎么管理和版本化的？有没有 prompt 模板/变量注入机制？" },
  { id: "state_persist", text: "状态管理与会话持久化方案是什么？多 tab、刷新、跨设备如何处理？" },
  { id: "errors_retries", text: "错误处理、限流、重试与降级策略是怎么做的？" },
  { id: "auth_apikey", text: "鉴权与 API Key 管理的 UX 是怎么设计的？BYOK / 服务端代理如何取舍？" },
];

export function sevenQuestionsAsText(): string {
  return SEVEN_QUESTIONS.map((q, i) => `${i + 1}) ${q.text}`).join("\n");
}
