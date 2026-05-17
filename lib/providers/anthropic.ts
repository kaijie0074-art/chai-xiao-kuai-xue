import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ProviderConfig, StreamOpts } from "./index";
import { classifyLLMError } from "./index";
import { DEFAULT_ANTHROPIC_MODEL } from "../store";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic" as const;
  private client: Anthropic;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error("缺少 Anthropic API Key");
    }
    // Optional custom baseURL lets users point at Anthropic-format relays
    // (common in mainland China for Claude access).
    const baseURL = config.baseURL?.trim() || undefined;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
      ...(baseURL ? { baseURL } : {}),
    });
    this.model = config.model || DEFAULT_ANTHROPIC_MODEL;
  }

  async *stream(opts: StreamOpts): AsyncIterable<string> {
    const model = opts.model || this.model;
    const max_tokens = opts.maxTokens ?? 4096;
    // Anthropic doesn't enforce a strict "json mode" header in messages API;
    // we steer with system prompt instead. Caller is responsible for asking
    // for JSON in the prompt.
    try {
      const stream = this.client.messages.stream(
        {
          model,
          system: opts.system,
          max_tokens,
          messages: opts.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { signal: opts.signal }
      );

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta &&
          event.delta.type === "text_delta"
        ) {
          const txt = (event.delta as { text?: string }).text;
          if (txt) yield txt;
        }
      }
    } catch (e) {
      throw classifyLLMError(e);
    }
  }
}
