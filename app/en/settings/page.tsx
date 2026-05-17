"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Toast } from "@/components/Toast";
import {
  ANTHROPIC_MODELS,
  DEEPSEEK_MODELS,
  MOONSHOT_MODELS,
  OPENAI_MODELS,
  OPENROUTER_FREE_MODELS,
  OPENROUTER_PAID_MODELS,
  ZHIPU_MODELS,
  getActiveKey,
  getActiveModel,
  useSettings,
  type ProviderName,
} from "@/lib/store";
import { startOpenRouterAuth } from "@/lib/openrouter-oauth";

const PROVIDER_LABEL_EN: Record<ProviderName, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  moonshot: "Kimi (Moonshot)",
  zhipu: "Zhipu GLM",
  custom: "Custom relay",
};

const PROVIDER_DESC_EN: Record<ProviderName, string> = {
  anthropic: "Official API",
  openai: "Official API",
  openrouter: "OAuth · multi-model",
  deepseek: "OpenAI-compatible",
  moonshot: "Long context",
  zhipu: "OpenAI-compatible",
  custom: "Self-hosted / 3rd-party relay",
};

const PRESET_MODELS: Record<
  Exclude<ProviderName, "openrouter" | "custom">,
  readonly string[]
> = {
  anthropic: ANTHROPIC_MODELS,
  openai: OPENAI_MODELS,
  deepseek: DEEPSEEK_MODELS,
  moonshot: MOONSHOT_MODELS,
  zhipu: ZHIPU_MODELS,
};

const PROVIDER_GROUPS: { label: string; hint?: string; items: ProviderName[] }[] = [
  {
    label: "Recommended · start free",
    hint: "OAuth sign-in, free-tier models available",
    items: ["openrouter"],
  },
  {
    label: "China-accessible",
    hint: "No international network needed · cheaper per token",
    items: ["deepseek", "moonshot", "zhipu"],
  },
  {
    label: "Direct official",
    hint: "International network · most stable models",
    items: ["anthropic", "openai"],
  },
  {
    label: "Advanced",
    hint: "Custom baseURL · self-hosted or 3rd-party relay",
    items: ["custom"],
  },
];

const KEY_PLACEHOLDER: Record<ProviderName, string> = {
  anthropic: "sk-ant-api03-...",
  openai: "sk-...",
  openrouter: "sk-or-v1-...",
  deepseek: "sk-...",
  moonshot: "sk-...",
  zhipu: "GLM API key",
  custom: "your relay's key",
};

const KEY_APPLY_HINT: Partial<Record<ProviderName, { url: string; label: string }>> = {
  anthropic: { url: "https://console.anthropic.com/settings/keys", label: "console.anthropic.com" },
  openai: { url: "https://platform.openai.com/api-keys", label: "platform.openai.com" },
  deepseek: { url: "https://platform.deepseek.com/api_keys", label: "platform.deepseek.com" },
  moonshot: { url: "https://platform.moonshot.cn/console/api-keys", label: "platform.moonshot.cn" },
  zhipu: { url: "https://bigmodel.cn/usercenter/apikeys", label: "bigmodel.cn" },
};

export default function SettingsPage() {
  const settings = useSettings();
  const [hydrated, setHydrated] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showGitHubToken, setShowGitHubToken] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    const signedIn = new URLSearchParams(window.location.search).get("signed_in");
    if (signedIn === "openrouter") {
      setToast("Signed in via OpenRouter · key saved locally");
    }
  }, [hydrated]);

  const activeProvider = settings.provider;
  const activeKey = hydrated ? getActiveKey(settings) : "";
  const activeModel = hydrated ? getActiveModel(settings) : "";

  const updateKey = (k: string) => settings.setKey(activeProvider, k);
  const updateModel = (m: string) => {
    settings.setModel(activeProvider, m);
    setToast(`Switched to ${m}`);
  };

  const handleProviderChange = (p: ProviderName) => {
    if (p === settings.provider) return;
    settings.setProvider(p);
    setToast(`Switched provider · ${PROVIDER_LABEL_EN[p]}`);
  };

  const handleClear = () => {
    settings.setKey(activeProvider, "");
    setToast(`Cleared ${PROVIDER_LABEL_EN[activeProvider]} key`);
  };

  const handleOpenRouterSignIn = async () => {
    try {
      await startOpenRouterAuth();
    } catch (e) {
      setToast(`Sign-in failed: ${(e as Error).message}`);
    }
  };

  const maskedKey =
    activeKey && !showKey
      ? activeKey.slice(0, 6) +
        "•".repeat(Math.max(activeKey.length - 10, 6)) +
        activeKey.slice(-4)
      : activeKey;

  if (!hydrated) {
    return <div className="page" style={{ minHeight: 400 }} />;
  }

  return (
    <div className="page">
      <Toast msg={toast} onDone={() => setToast(null)} />

      <div className="byok-banner" style={{ marginTop: 0, marginBottom: 24 }}>
        <h3>
          <Icon.Lock />
          BYOK · key stays in your browser
        </h3>
        <ul className="byok-list">
          <li>
            <code>localStorage</code> only · no backend, so we physically cannot receive your key
          </li>
          <li>
            Set a low spending cap on the provider console ·{" "}
            <Link
              href="/en/about"
              style={{ color: "var(--accent-text)", textDecoration: "underline" }}
            >
              full privacy statement
            </Link>
          </li>
        </ul>
      </div>

      <div className="settings-grid">
        <div className="card-panel">
          <div className="field">
            <label className="label">Provider</label>
            <div style={{ display: "grid", gap: 14 }}>
              {PROVIDER_GROUPS.map((g) => (
                <div key={g.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      marginBottom: 6,
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-4)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    <span>{g.label}</span>
                    {g.hint && (
                      <span style={{ color: "var(--fg-5)", textTransform: "none", letterSpacing: 0 }}>
                        · {g.hint}
                      </span>
                    )}
                  </div>
                  <div
                    className="provider-radio"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                  >
                    {g.items.map((p) => (
                      <ProviderOption
                        key={p}
                        value={p}
                        title={PROVIDER_LABEL_EN[p]}
                        desc={PROVIDER_DESC_EN[p]}
                        active={activeProvider === p}
                        onSelect={handleProviderChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeProvider === "openrouter" ? (
            <OpenRouterAuth
              loggedInKey={settings.openrouterKey}
              onSignIn={handleOpenRouterSignIn}
              onSignOut={() => {
                settings.setKey("openrouter", "");
                setToast("Signed out of OpenRouter");
              }}
            />
          ) : activeProvider === "custom" ? (
            <CustomAuth
              baseURL={settings.customBaseURL}
              setBaseURL={settings.setCustomBaseURL}
              apiKey={settings.customKey}
              setApiKey={(k) => settings.setKey("custom", k)}
              showKey={showKey}
              setShowKey={setShowKey}
            />
          ) : (
            <KeyInput
              provider={activeProvider}
              apiKey={activeKey}
              setApiKey={updateKey}
              showKey={showKey}
              setShowKey={setShowKey}
              masked={maskedKey}
            />
          )}

          <div className="field">
            <label className="label">Model</label>
            {activeProvider === "openrouter" ? (
              <select
                className="select"
                value={activeModel}
                onChange={(e) => updateModel(e.target.value)}
              >
                <optgroup label="Free (rate-limited · $0)">
                  {OPENROUTER_FREE_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
                <optgroup label="Paid (requires OpenRouter credit)">
                  {OPENROUTER_PAID_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              </select>
            ) : activeProvider === "custom" ? (
              <>
                <input
                  className="input mono"
                  value={activeModel}
                  onChange={(e) => updateModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet, deepseek-chat ..."
                  list="custom-model-suggestions-en"
                />
                <datalist id="custom-model-suggestions-en">
                  <option value="gpt-4o" />
                  <option value="gpt-4o-mini" />
                  <option value="claude-3-5-sonnet" />
                  <option value="claude-3-5-haiku" />
                  <option value="deepseek-chat" />
                  <option value="deepseek-reasoner" />
                  <option value="gemini-pro-1.5" />
                </datalist>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11.5,
                    color: "var(--fg-4)",
                    lineHeight: 1.5,
                  }}
                >
                  Model names depend on what your relay exposes — free text.
                </div>
              </>
            ) : (
              <select
                className="select"
                value={activeModel}
                onChange={(e) => updateModel(e.target.value)}
              >
                {(PRESET_MODELS[activeProvider as keyof typeof PRESET_MODELS] ?? []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          {activeProvider === "anthropic" && (
            <div className="field">
              <label className="label">
                Custom baseURL <span style={{ color: "var(--fg-4)", fontWeight: 400 }}>· optional</span>
              </label>
              <input
                className="input mono"
                value={settings.anthropicBaseURL}
                onChange={(e) => settings.setAnthropicBaseURL(e.target.value)}
                placeholder="Leave empty to use the official api.anthropic.com"
              />
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11.5,
                  color: "var(--fg-4)",
                  lineHeight: 1.5,
                }}
              >
                Set this to route through a Claude-compatible relay (e.g. https://your-claude-relay.com). The SDK appends /v1/messages itself — do not include the endpoint path.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            {activeProvider !== "openrouter" && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleClear}
                disabled={!activeKey}
                type="button"
              >
                Clear {PROVIDER_LABEL_EN[activeProvider]} key
              </button>
            )}
            <div style={{ flex: 1 }} />
            {activeKey && (
              <Link href="/en/analyze" className="btn btn-primary">
                Back to dissect <Icon.ArrowRight />
              </Link>
            )}
          </div>
        </div>

        <aside>
          <div className="card-panel">
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Status</h3>
            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
              }}
            >
              <Row k="provider" v={PROVIDER_LABEL_EN[activeProvider]} />
              <Row k="model" v={activeModel || "(unset)"} />
              {activeProvider === "custom" && (
                <Row
                  k="baseURL"
                  v={settings.customBaseURL || "(empty)"}
                  color={settings.customBaseURL ? "var(--fg)" : "var(--status-warn)"}
                />
              )}
              <Row
                k="auth"
                v={
                  activeKey
                    ? activeProvider === "openrouter"
                      ? "● OAuth"
                      : "● Key"
                    : "○ not set"
                }
                color={activeKey ? "var(--status-ok)" : "var(--status-warn)"}
              />
              <Row k="scope" v="localStorage" color="var(--status-ok)" />
              <Row
                k="github"
                v={settings.githubToken ? "● Token (5000/h)" : "○ Anon (60/h)"}
                color={settings.githubToken ? "var(--status-ok)" : "var(--fg-3)"}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="card-panel" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 4 }}>GitHub Token (optional)</h3>
        <p className="panel-desc" style={{ marginBottom: 14 }}>
          Anonymous GitHub API is capped at 60 requests/hour/IP. With a token (no scopes required), the limit jumps to <strong style={{ color: "var(--fg)" }}>5000/hour</strong>. Token stays in your browser&apos;s localStorage — never uploaded.
        </p>

        <div className="field" style={{ marginBottom: 12 }}>
          <label className="label">
            Personal Access Token
            <span className="label-hint">
              starts with ghp_... or github_pat_...
            </span>
          </label>
          <div className="key-row">
            <input
              type={showGitHubToken ? "text" : "password"}
              className="input mono"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={settings.githubToken}
              onChange={(e) => settings.setGitHubToken(e.target.value)}
            />
            <button
              className="toggle-eye"
              onClick={() => setShowGitHubToken((v) => !v)}
              type="button"
            >
              {showGitHubToken ? (
                <>
                  <Icon.EyeOff /> Hide
                </>
              ) : (
                <>
                  <Icon.Eye /> Show
                </>
              )}
            </button>
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--fg-4)",
            lineHeight: 1.65,
          }}
        >
          Don&apos;t have one? Create a Fine-grained PAT at{" "}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noopener"
            style={{ color: "var(--accent-text)", textDecoration: "underline" }}
          >
            github.com/settings/tokens
          </a>
          . **Set Repository access to Public Repositories**, leave all permissions empty — still gives you the 5000/h limit. Classic PAT with zero scopes also works.
        </div>

        {settings.githubToken && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              settings.setGitHubToken("");
              setToast("Cleared GitHub Token");
            }}
            type="button"
            style={{ marginTop: 12 }}
          >
            Clear token
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderOption({
  value,
  title,
  desc,
  active,
  onSelect,
}: {
  value: ProviderName;
  title: string;
  desc: string;
  active: boolean;
  onSelect: (p: ProviderName) => void;
}) {
  return (
    <label className={active ? "on" : ""}>
      <input
        type="radio"
        name="provider"
        checked={active}
        onChange={() => onSelect(value)}
      />
      <span className="pn">{title}</span>
      <span className="pd">{desc}</span>
      <span className="dot" />
    </label>
  );
}

function KeyInput({
  provider,
  apiKey,
  setApiKey,
  showKey,
  setShowKey,
  masked,
}: {
  provider: ProviderName;
  apiKey: string;
  setApiKey: (k: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  masked: string;
}) {
  const applyHint = KEY_APPLY_HINT[provider];
  return (
    <div className="field">
      <label className="label">API Key</label>
      <div className="key-row">
        <input
          type={showKey ? "text" : "password"}
          className="input mono"
          placeholder={KEY_PLACEHOLDER[provider]}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          className="toggle-eye"
          onClick={() => setShowKey(!showKey)}
          type="button"
        >
          {showKey ? (
            <>
              <Icon.EyeOff /> Hide
            </>
          ) : (
            <>
              <Icon.Eye /> Show
            </>
          )}
        </button>
      </div>
      {apiKey && !showKey && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--fg-4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {masked}
        </div>
      )}
      {applyHint && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--fg-4)",
            lineHeight: 1.5,
          }}
        >
          No key? Get one at{" "}
          <a
            href={applyHint.url}
            target="_blank"
            rel="noopener"
            style={{ color: "var(--accent-text)", textDecoration: "underline" }}
          >
            {applyHint.label}
          </a>
          .
        </div>
      )}
    </div>
  );
}

function OpenRouterAuth({
  loggedInKey,
  onSignIn,
  onSignOut,
}: {
  loggedInKey: string;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="field">
      <label className="label">OpenRouter account</label>
      {loggedInKey ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "var(--status-ok-bg)",
              border: "1px solid var(--status-ok-border)",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
            }}
          >
            <span style={{ color: "var(--status-ok)" }}>● Signed in</span>
            <span style={{ color: "var(--fg-3)" }}>
              {loggedInKey.slice(0, 12)}…{loggedInKey.slice(-4)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={onSignIn} type="button">
              <Icon.Refresh /> Re-authenticate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut} type="button">
              Sign out
            </button>
          </div>
        </>
      ) : (
        <button
          className="btn btn-primary"
          onClick={onSignIn}
          type="button"
          style={{ width: "100%" }}
        >
          Sign in with OpenRouter <Icon.ArrowRight />
        </button>
      )}
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "var(--fg-4)",
          lineHeight: 1.6,
        }}
      >
        {loggedInKey ? (
          <>
            Pick a <strong style={{ color: "var(--accent-text)" }}>Free</strong> model from the dropdown below to run at zero cost. For Claude / GPT etc., top up at{" "}
            <a
              href="https://openrouter.ai/credits"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--accent-text)", textDecoration: "underline" }}
            >
              openrouter.ai/credits
            </a>
            .
          </>
        ) : (
          <>
            OpenRouter will send a scoped key back to your browser after authorization. If a top-up screen appears, click &quot;Maybe later, I&apos;ll start with free models&quot; at the bottom — the free models work at $0 (rate-limited).
          </>
        )}
      </div>
    </div>
  );
}

function CustomAuth({
  baseURL,
  setBaseURL,
  apiKey,
  setApiKey,
  showKey,
  setShowKey,
}: {
  baseURL: string;
  setBaseURL: (u: string) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
}) {
  return (
    <>
      <div className="field">
        <label className="label">
          API Base URL <span className="label-hint">required</span>
        </label>
        <input
          className="input mono"
          value={baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
          placeholder="http://localhost:3000/v1   or   https://api.your-relay.com/v1"
        />
        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            color: "var(--fg-4)",
            lineHeight: 1.6,
          }}
        >
          Any OpenAI-compatible base URL — your local one-api / new-api / vllm, or any 3rd-party relay. Usually ends with <code>/v1</code> (the path that contains <code>/chat/completions</code>).
        </div>
      </div>

      <div className="field">
        <label className="label">API Key</label>
        <div className="key-row">
          <input
            type={showKey ? "text" : "password"}
            className="input mono"
            placeholder="your relay's key (some local proxies accept 'sk-anything')"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className="toggle-eye"
            onClick={() => setShowKey(!showKey)}
            type="button"
          >
            {showKey ? (
              <>
                <Icon.EyeOff /> Hide
              </>
            ) : (
              <>
                <Icon.Eye /> Show
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "baseline",
      }}
    >
      <span style={{ color: "var(--fg-4)", flexShrink: 0 }}>{k}</span>
      <span
        style={{
          color,
          textAlign: "right",
          wordBreak: "break-all",
          fontSize: 11.5,
        }}
      >
        {v}
      </span>
    </div>
  );
}
