import OpenAI from "openai";
import type { LLMProvider, ProviderConfig, StreamOpts } from "./index";
import { classifyLLMError } from "./index";
import { DEFAULT_OPENAI_MODEL } from "../store";

export class OpenAIProvider implements LLMProvider {
  name = "openai" as const;
  private client: OpenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error("缺少 OpenAI API Key");
    }
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = config.model || DEFAULT_OPENAI_MODEL;
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
