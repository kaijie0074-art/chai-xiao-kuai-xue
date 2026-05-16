import OpenAI from "openai";
import type { LLMProvider, ProviderConfig, StreamOpts } from "./index";
import { classifyLLMError } from "./index";
import { DEFAULT_OPENROUTER_MODEL } from "../store";

/**
 * OpenRouter is OpenAI-compatible. We reuse the `openai` SDK with a
 * different baseURL and OpenRouter etiquette headers (HTTP-Referer + X-Title).
 *
 * The apiKey here can come from two paths:
 *  - User pasted `sk-or-v1-...` manually
 *  - OAuth PKCE flow returned a scoped key into localStorage
 *
 * Either way, requests go browser-direct to api.openrouter.ai.
 */
export class OpenRouterProvider implements LLMProvider {
  name = "openrouter" as const;
  private client: OpenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error("缺少 OpenRouter API Key（请通过 OAuth 登录或粘贴 sk-or-...）");
    }
    const referer =
      typeof window !== "undefined" ? window.location.origin : "https://dissect.local";
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": referer,
        "X-Title": "拆小块学",
      },
    });
    this.model = config.model || DEFAULT_OPENROUTER_MODEL;
  }

  async *stream(opts: StreamOpts): AsyncIterable<string> {
    const model = opts.model || this.model;
    const max_tokens = opts.maxTokens ?? 4096;
    try {
      const messages = [
        { role: "system" as const, content: opts.system },
        ...opts.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];
      const stream = await this.client.chat.completions.create(
        {
          model,
          messages,
          stream: true,
          max_tokens,
          // OpenRouter forwards response_format to upstream models that
          // support it; for others it's ignored.
          response_format: opts.jsonMode ? { type: "json_object" } : undefined,
        },
        { signal: opts.signal }
      );

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (e) {
      throw classifyLLMError(e);
    }
  }
}
