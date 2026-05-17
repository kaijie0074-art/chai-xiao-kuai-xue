"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProviderName =
  | "anthropic"
  | "openai"
  | "openrouter"
  | "deepseek"
  | "moonshot"
  | "zhipu"
  | "custom";

export const ANTHROPIC_MODELS = [
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-latest",
] as const;

export const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
] as const;

export const OPENROUTER_FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
] as const;

export const OPENROUTER_PAID_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-pro-1.5",
  "deepseek/deepseek-chat",
] as const;

export const OPENROUTER_MODELS = [
  ...OPENROUTER_FREE_MODELS,
  ...OPENROUTER_PAID_MODELS,
] as const;

export const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-reasoner"] as const;

export const MOONSHOT_MODELS = [
  "kimi-latest",
  "moonshot-v1-128k",
  "moonshot-v1-32k",
  "moonshot-v1-8k",
] as const;

export const ZHIPU_MODELS = [
  "glm-4-plus",
  "glm-4",
  "glm-4-air",
  "glm-4-flash",
  "glm-4-long",
] as const;

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-7";
export const DEFAULT_OPENAI_MODEL = "gpt-4o";
export const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
export const DEFAULT_MOONSHOT_MODEL = "moonshot-v1-32k";
export const DEFAULT_ZHIPU_MODEL = "glm-4-plus";
export const DEFAULT_CUSTOM_MODEL = "gpt-4o-mini";

export const PROVIDER_LABEL: Record<ProviderName, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  moonshot: "Kimi",
  zhipu: "智谱 GLM",
  custom: "中转站",
};

export const PROVIDER_LABEL_EN: Record<ProviderName, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  moonshot: "Kimi",
  zhipu: "Zhipu GLM",
  custom: "Custom relay",
};

export const PROVIDER_DESC: Record<ProviderName, string> = {
  anthropic: "直连官方 API",
  openai: "直连官方 API",
  openrouter: "OAuth 登录 · 多家模型",
  deepseek: "深度求索 · OpenAI 兼容",
  moonshot: "月之暗面 · 长上下文",
  zhipu: "智谱 · OpenAI 兼容",
  custom: "自定义 baseURL · 本地中转",
};

export interface SettingsState {
  provider: ProviderName;
  anthropicKey: string;
  openaiKey: string;
  openrouterKey: string;
  deepseekKey: string;
  moonshotKey: string;
  zhipuKey: string;
  customKey: string;
  anthropicModel: string;
  openaiModel: string;
  openrouterModel: string;
  deepseekModel: string;
  moonshotModel: string;
  zhipuModel: string;
  customModel: string;
  customBaseURL: string;
  /** GitHub Personal Access Token (可选)，无任何权限的空白 token 即可把抓取限额从 60 涨到 5000/小时 */
  githubToken: string;
  acknowledgedRisk: boolean;
  setProvider: (p: ProviderName) => void;
  setKey: (provider: ProviderName, k: string) => void;
  setModel: (provider: ProviderName, m: string) => void;
  setCustomBaseURL: (u: string) => void;
  setGitHubToken: (t: string) => void;
  setAcknowledgedRisk: (v: boolean) => void;
  clearKeys: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      provider: "anthropic",
      anthropicKey: "",
      openaiKey: "",
      openrouterKey: "",
      deepseekKey: "",
      moonshotKey: "",
      zhipuKey: "",
      customKey: "",
      anthropicModel: DEFAULT_ANTHROPIC_MODEL,
      openaiModel: DEFAULT_OPENAI_MODEL,
      openrouterModel: DEFAULT_OPENROUTER_MODEL,
      deepseekModel: DEFAULT_DEEPSEEK_MODEL,
      moonshotModel: DEFAULT_MOONSHOT_MODEL,
      zhipuModel: DEFAULT_ZHIPU_MODEL,
      customModel: DEFAULT_CUSTOM_MODEL,
      customBaseURL: "",
      githubToken: "",
      acknowledgedRisk: false,
      setProvider: (p) => set({ provider: p }),
      setKey: (provider, k) => {
        const map: Record<ProviderName, keyof SettingsState> = {
          anthropic: "anthropicKey",
          openai: "openaiKey",
          openrouter: "openrouterKey",
          deepseek: "deepseekKey",
          moonshot: "moonshotKey",
          zhipu: "zhipuKey",
          custom: "customKey",
        };
        set({ [map[provider]]: k } as Partial<SettingsState>);
      },
      setModel: (provider, m) => {
        const map: Record<ProviderName, keyof SettingsState> = {
          anthropic: "anthropicModel",
          openai: "openaiModel",
          openrouter: "openrouterModel",
          deepseek: "deepseekModel",
          moonshot: "moonshotModel",
          zhipu: "zhipuModel",
          custom: "customModel",
        };
        set({ [map[provider]]: m } as Partial<SettingsState>);
      },
      setCustomBaseURL: (u) => set({ customBaseURL: u }),
      setGitHubToken: (t) => set({ githubToken: t }),
      setAcknowledgedRisk: (v) => set({ acknowledgedRisk: v }),
      clearKeys: () =>
        set({
          anthropicKey: "",
          openaiKey: "",
          openrouterKey: "",
          deepseekKey: "",
          moonshotKey: "",
          zhipuKey: "",
          customKey: "",
        }),
    }),
    {
      name: "dissect-mvp-settings",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage)
      ),
      version: 4,
    }
  )
);

export function getActiveKey(s: SettingsState): string {
  switch (s.provider) {
    case "anthropic": return s.anthropicKey;
    case "openai": return s.openaiKey;
    case "openrouter": return s.openrouterKey;
    case "deepseek": return s.deepseekKey;
    case "moonshot": return s.moonshotKey;
    case "zhipu": return s.zhipuKey;
    case "custom": return s.customKey;
  }
}

export function getActiveModel(s: SettingsState): string {
  switch (s.provider) {
    case "anthropic": return s.anthropicModel;
    case "openai": return s.openaiModel;
    case "openrouter": return s.openrouterModel;
    case "deepseek": return s.deepseekModel;
    case "moonshot": return s.moonshotModel;
    case "zhipu": return s.zhipuModel;
    case "custom": return s.customModel;
  }
}

/** baseURL is meaningful only for "custom"; other providers hardcode their endpoint */
export function getActiveBaseURL(s: SettingsState): string | undefined {
  if (s.provider === "custom") return s.customBaseURL || undefined;
  return undefined;
}
