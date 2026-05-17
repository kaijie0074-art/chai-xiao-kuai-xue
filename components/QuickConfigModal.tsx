"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import {
  ANTHROPIC_MODELS,
  DEEPSEEK_MODELS,
  MOONSHOT_MODELS,
  OPENAI_MODELS,
  PROVIDER_LABEL,
  PROVIDER_LABEL_EN,
  ZHIPU_MODELS,
  useSettings,
  type ProviderName,
} from "@/lib/store";
import { startOpenRouterAuth } from "@/lib/openrouter-oauth";
import { useLocale } from "@/lib/i18n";

/** 这个模态只覆盖最常见的 6 个 provider；custom（中转站）需要 baseURL 走 /settings */
const QUICK_PROVIDERS: ProviderName[] = [
  "openrouter",
  "anthropic",
  "openai",
  "deepseek",
  "moonshot",
  "zhipu",
];

const MODELS: Record<
  Exclude<ProviderName, "openrouter" | "custom">,
  readonly string[]
> = {
  anthropic: ANTHROPIC_MODELS,
  openai: OPENAI_MODELS,
  deepseek: DEEPSEEK_MODELS,
  moonshot: MOONSHOT_MODELS,
  zhipu: ZHIPU_MODELS,
};

/**
 * /analyze 页面的"快速配置"模态。让用户**不离开当前页**配 key。
 * 复杂场景（custom relay、GitHub Token）还得去 /settings 走完整路径。
 */
export function QuickConfigModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const settings = useSettings();
  const locale = useLocale();
  const isEn = locale === "en";
  const labels = isEn ? PROVIDER_LABEL_EN : PROVIDER_LABEL;

  const [provider, setProvider] = useState<ProviderName>(settings.provider);
  const [keyInput, setKeyInput] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);

  // 打开时同步当前 settings 值
  useEffect(() => {
    if (!open) return;
    setProvider(settings.provider);
    const p = settings.provider;
    if (p === "openrouter" || p === "custom") {
      setKeyInput("");
      setModel("");
    } else {
      const keys: Record<typeof p, string> = {
        anthropic: settings.anthropicKey,
        openai: settings.openaiKey,
        deepseek: settings.deepseekKey,
        moonshot: settings.moonshotKey,
        zhipu: settings.zhipuKey,
      };
      const models: Record<typeof p, string> = {
        anthropic: settings.anthropicModel,
        openai: settings.openaiModel,
        deepseek: settings.deepseekModel,
        moonshot: settings.moonshotModel,
        zhipu: settings.zhipuModel,
      };
      setKeyInput(keys[p]);
      setModel(models[p]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 切 provider 时也刷新 key/model 字段
  useEffect(() => {
    if (provider === "openrouter" || provider === "custom") return;
    const keys: Record<typeof provider, string> = {
      anthropic: settings.anthropicKey,
      openai: settings.openaiKey,
      deepseek: settings.deepseekKey,
      moonshot: settings.moonshotKey,
      zhipu: settings.zhipuKey,
    };
    const models: Record<typeof provider, string> = {
      anthropic: settings.anthropicModel,
      openai: settings.openaiModel,
      deepseek: settings.deepseekModel,
      moonshot: settings.moonshotModel,
      zhipu: settings.zhipuModel,
    };
    setKeyInput(keys[provider]);
    setModel(models[provider]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    settings.setProvider(provider);
    if (provider !== "openrouter" && provider !== "custom") {
      settings.setKey(provider, keyInput);
      if (model) settings.setModel(provider, model);
    }
    onSaved?.();
    onClose();
  };

  const handleSignIn = async () => {
    settings.setProvider("openrouter");
    try {
      await startOpenRouterAuth();
    } catch {}
  };

  const settingsHref = isEn ? "/en/settings" : "/settings";

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadein .15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--canvas)",
          border: "1px solid var(--border-strong)",
          borderRadius: 12,
          maxWidth: 540,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "var(--shadow-pop)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {isEn ? "Quick setup" : "快速配置 API Key"}
          </h3>
          <button
            onClick={onClose}
            className="icon-btn"
            type="button"
            aria-label={isEn ? "Close" : "关闭"}
          >
            <Icon.Close />
          </button>
        </div>
        <p
          style={{
            margin: "0 0 18px",
            fontSize: 12.5,
            color: "var(--fg-3)",
            lineHeight: 1.55,
          }}
        >
          {isEn
            ? "Configure the most common providers here without leaving the page. Custom relays / GitHub Token live in full Settings."
            : "在这里直接配最常用的 provider，不用离开当前页。中转站 / GitHub Token 等高级项去完整设置。"}
        </p>

        <div className="field">
          <label className="label">Provider</label>
          <div
            style={{
              display: "grid",
              gap: 6,
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            }}
          >
            {QUICK_PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className="mode-chip"
                style={
                  p === provider
                    ? {
                        background: "var(--accent-tint)",
                        borderColor: "var(--accent)",
                        color: "var(--accent-text)",
                        fontSize: 12,
                      }
                    : { fontSize: 12 }
                }
                type="button"
              >
                {labels[p]}
              </button>
            ))}
          </div>
        </div>

        {provider === "openrouter" ? (
          <div className="field">
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-3)",
                lineHeight: 1.6,
                margin: "0 0 12px",
              }}
            >
              {isEn
                ? "OAuth into OpenRouter — free-tier models cost nothing. (Will briefly leave this page for the OAuth handshake; your inputs are auto-saved.)"
                : "OAuth 登录 OpenRouter，免费模型零成本。（会暂时离开此页做 OAuth，你的输入已自动保存。）"}
            </p>
            <button
              className="btn btn-primary"
              onClick={handleSignIn}
              type="button"
              style={{ width: "100%" }}
            >
              Sign in with OpenRouter <Icon.ArrowRight />
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label className="label">API Key</label>
              <div className="key-row">
                <input
                  className="input mono"
                  type={showKey ? "text" : "password"}
                  placeholder={
                    provider === "anthropic" ? "sk-ant-api03-..." : "sk-..."
                  }
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoFocus
                />
                <button
                  className="toggle-eye"
                  onClick={() => setShowKey((v) => !v)}
                  type="button"
                >
                  {showKey ? (
                    <>
                      <Icon.EyeOff /> {isEn ? "Hide" : "隐藏"}
                    </>
                  ) : (
                    <>
                      <Icon.Eye /> {isEn ? "Show" : "显示"}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="field">
              <label className="label">Model</label>
              <select
                className="select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {(MODELS[provider as keyof typeof MODELS] ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={settingsHref}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12 }}
          >
            {isEn ? "Full settings →" : "完整设置 →"}
          </Link>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-ghost"
            onClick={onClose}
            type="button"
          >
            {isEn ? "Cancel" : "取消"}
          </button>
          {provider !== "openrouter" && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!keyInput || keyInput.length < 6}
              type="button"
            >
              {isEn ? "Save & use" : "保存并使用"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
