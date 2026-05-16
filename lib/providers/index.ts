import type { ProviderName } from "../store";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";
import { OpenAICompatibleProvider } from "./openai-compat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamOpts {
  system: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  /** model name override; if omitted, provider uses its configured default */
  model?: string;
  /** abort signal */
  signal?: AbortSignal;
  /** max output tokens */
  maxTokens?: number;
}

export interface LLMProvider {
  name: ProviderName;
  stream(opts: StreamOpts): AsyncIterable<string>;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  /** Only used by `custom`; ignored by named providers. */
  baseURL?: string;
}

export function createProvider(
  name: ProviderName,
  config: ProviderConfig
): LLMProvider {
  switch (name) {
    case "anthropic":
      return new AnthropicProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "openrouter":
      return new OpenRouterProvider(config);
    case "deepseek":
      return new OpenAICompatibleProvider("deepseek", config, {
        baseURL: "https://api.deepseek.com/v1",
        missingKeyMsg: "缺少 DeepSeek API Key（在 platform.deepseek.com 申请）",
        supportsJsonMode: true,
      });
    case "moonshot":
      return new OpenAICompatibleProvider("moonshot", config, {
        baseURL: "https://api.moonshot.cn/v1",
        missingKeyMsg: "缺少 Moonshot Kimi API Key（在 platform.moonshot.cn 申请）",
        supportsJsonMode: true,
      });
    case "zhipu":
      return new OpenAICompatibleProvider("zhipu", config, {
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        missingKeyMsg: "缺少 智谱 GLM API Key（在 bigmodel.cn 申请）",
        // 智谱 GLM 早期模型不支持 response_format，关掉更稳；prompt 已强制 JSON
        supportsJsonMode: false,
      });
    case "custom":
      if (!config.baseURL) {
        throw new Error("中转站需要填写 API Base URL，例如 http://localhost:3000/v1");
      }
      return new OpenAICompatibleProvider("custom", config, {
        baseURL: config.baseURL,
        missingKeyMsg: "缺少中转站 API Key",
        // 中转站背后的实现千差万别，参数全部走保守路线
        supportsJsonMode: false,
        sendMaxTokens: false,
      });
  }
  throw new Error(`未知 provider: ${name}`);
}

export class LLMError extends Error {
  kind: "auth" | "rate_limit" | "network" | "bad_request" | "unknown";
  status?: number;
  constructor(
    kind: LLMError["kind"],
    message: string,
    status?: number
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

export function classifyLLMError(e: unknown): LLMError {
  // Don't re-wrap an already-classified error — that's what caused the doubled
  // "LLM 请求被拒绝：LLM 请求被拒绝：..." message.
  if (e instanceof LLMError) return e;

  const err = e as {
    status?: number;
    message?: string;
    name?: string;
    error?: { message?: string; type?: string; code?: string };
  };
  const status = err?.status;
  // Prefer upstream error body's message — many providers stuff the actual
  // diagnostic there while the top-level message is just "400 Bad Request".
  const upstreamMsg = err?.error?.message;
  const upstreamCode = err?.error?.code || err?.error?.type;
  const msg =
    upstreamMsg && upstreamMsg !== err?.message
      ? `${err?.message} · ${upstreamMsg}${upstreamCode ? ` (${upstreamCode})` : ""}`
      : err?.message || String(e);
  if (status === 401 || /unauthorized|invalid.*key|incorrect api key/i.test(msg)) {
    return new LLMError(
      "auth",
      "API Key 似乎无效或权限不足，请到「设置」检查。Key 仅存在你本地浏览器。",
      status
    );
  }
  if (status === 429 || /rate.?limit/i.test(msg)) {
    return new LLMError(
      "rate_limit",
      "LLM 服务返回限额错误（429）。请稍候再试，或到控制台检查账户余额/配额。",
      status
    );
  }
  if (status === 400 || /bad request|invalid|param incorrect/i.test(msg)) {
    return new LLMError(
      "bad_request",
      `LLM 请求被拒绝（HTTP 400）：${msg}\n排查：① 设置页里 model 名字是否中转站认识；② 打开 DevTools → Network，看失败请求的 Response Body 里 error.message。`,
      status
    );
  }
  if (/fetch|network|ECONN|ENOTFOUND/i.test(msg)) {
    return new LLMError("network", `网络错误：${msg}`);
  }
  return new LLMError("unknown", msg);
}
