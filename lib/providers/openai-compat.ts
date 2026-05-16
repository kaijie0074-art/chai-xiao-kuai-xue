import OpenAI from "openai";
import type { LLMProvider, ProviderConfig, StreamOpts } from "./index";
import { classifyLLMError } from "./index";
import type { ProviderName } from "../store";

/**
 * Generic OpenAI-compatible provider. Used for DeepSeek / Moonshot / 智谱 / 中转站,
 * basically anything that speaks the OpenAI chat/completions REST format.
 *
 * Two compatibility knobs:
 *   - supportsJsonMode: emit `response_format: { type: "json_object" }`. Many
 *     relays and older Chinese providers 400 on this. Off by default.
 *   - sendMaxTokens: emit `max_tokens`. Some relays cap at lower values than
 *     we want to send. Off by default for custom/中转站 — let them use their
 *     own server-side default.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: ProviderName;
  private client: OpenAI;
  private model: string;
  private supportsJsonMode: boolean;
  private sendMaxTokens: boolean;

  constructor(
    name: ProviderName,
    config: ProviderConfig,
    opts: {
      baseURL: string;
      defaultHeaders?: Record<string, string>;
      missingKeyMsg?: string;
      supportsJsonMode?: boolean;
      sendMaxTokens?: boolean;
    }
  ) {
    if (!config.apiKey) {
      throw new Error(opts.missingKeyMsg || `缺少 ${name} API Key`);
    }
    if (!opts.baseURL) {
      throw new Error(`${name} 的 baseURL 不能为空`);
    }
    this.name = name;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: opts.baseURL,
      dangerouslyAllowBrowser: true,
      defaultHeaders: opts.defaultHeaders,
    });
    this.model = config.model;
    this.supportsJsonMode = opts.supportsJsonMode ?? false;
    this.sendMaxTokens = opts.sendMaxTokens ?? true;
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
      const body: Record<string, unknown> = {
        model,
        messages,
        stream: true,
      };
      if (this.sendMaxTokens) body.max_tokens = max_tokens;
      if (opts.jsonMode && this.supportsJsonMode) {
        body.response_format = { type: "json_object" };
      }

      const stream = await this.client.chat.completions.create(
        body as unknown as Parameters<typeof this.client.chat.completions.create>[0],
        { signal: opts.signal }
      );

      for await (const chunk of stream as unknown as AsyncIterable<{
        choices?: { delta?: { content?: string } }[];
      }>) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (e) {
      // Log the raw error so devtools shows the upstream message
      if (typeof console !== "undefined") {
        console.error("[LLM stream error]", {
          provider: this.name,
          model,
          baseURL: this.client.baseURL,
          status: (e as { status?: number }).status,
          message: (e as Error).message,
          error: (e as { error?: unknown }).error,
        });
      }
      throw classifyLLMError(e);
    }
  }
}
