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
  PROVIDER_DESC,
  PROVIDER_LABEL,
  ZHIPU_MODELS,
  getActiveKey,
  getActiveModel,
  useSettings,
  type ProviderName,
} from "@/lib/store";
import { startOpenRouterAuth } from "@/lib/openrouter-oauth";

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

/** Provider 按"使用门槛"分组，新用户直觉路径：推荐 → 国内 → 官方 → 高级 */
const PROVIDER_GROUPS: { label: string; hint?: string; items: ProviderName[] }[] = [
  {
    label: "推荐 · 免费起步",
    hint: "OAuth 一键登录就能用，含免费模型",
    items: ["openrouter"],
  },
  {
    label: "国内可访问",
    hint: "无需国际网络，按 token 计费便宜",
    items: ["deepseek", "moonshot", "zhipu"],
  },
  {
    label: "直连官方",
    hint: "需国际网络 · 模型最稳",
    items: ["anthropic", "openai"],
  },
  {
    label: "高级",
    hint: "自定义 baseURL · 本地 / 第三方中转",
    items: ["custom"],
  },
];

const KEY_PLACEHOLDER: Record<ProviderName, string> = {
  anthropic: "sk-ant-api03-...",
  openai: "sk-...",
  openrouter: "sk-or-v1-...",
  deepseek: "sk-...",
  moonshot: "sk-...",
  zhipu: "...（GLM API Key）",
  custom: "对应中转站的 key",
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
      setToast("已通过 OpenRouter 登录 · key 已保存到本地");
    }
  }, [hydrated]);

  const activeProvider = settings.provider;
  const activeKey = hydrated ? getActiveKey(settings) : "";
  const activeModel = hydrated ? getActiveModel(settings) : "";

  const updateKey = (k: string) => settings.setKey(activeProvider, k);
  const updateModel = (m: string) => {
    settings.setModel(activeProvider, m);
    setToast(`已切换到 ${m}`);
  };

  // 包装一层 setProvider 给 ProviderOption 用 —— 改了就 toast
  const handleProviderChange = (p: ProviderName) => {
    if (p === settings.provider) return;
    settings.setProvider(p);
    setToast(`已切换 provider · ${PROVIDER_LABEL[p]}`);
  };

  const handleClear = () => {
    settings.setKey(activeProvider, "");
    setToast(`已清除 ${PROVIDER_LABEL[activeProvider]} 的 key`);
  };

  const handleOpenRouterSignIn = async () => {
    try {
      await startOpenRouterAuth();
    } catch (e) {
      setToast(`登录失败：${(e as Error).message}`);
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
          BYOK · Key 仅存本地浏览器
        </h3>
        <ul className="byok-list">
          <li>
            <code>localStorage</code> · 没有后端，物理上无法接收到 Key
          </li>
          <li>
            建议在 LLM 控制台设置较低支出限额 ·{" "}
            <Link
              href="/about"
              style={{ color: "var(--accent-text)", textDecoration: "underline" }}
            >
              完整隐私声明
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
                        title={PROVIDER_LABEL[p]}
                        desc={PROVIDER_DESC[p]}
                        active={activeProvider === p}
                        onSelect={handleProviderChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth area — varies by provider */}
          {activeProvider === "openrouter" ? (
            <OpenRouterAuth
              loggedInKey={settings.openrouterKey}
              onSignIn={handleOpenRouterSignIn}
              onSignOut={() => {
                settings.setKey("openrouter", "");
                setToast("已登出 OpenRouter");
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

          {/* Model picker */}
          <div className="field">
            <label className="label">Model</label>
            {activeProvider === "openrouter" ? (
              <select
                className="select"
                value={activeModel}
                onChange={(e) => updateModel(e.target.value)}
              >
                <optgroup label="免费（速率受限 · 零成本）">
                  {OPENROUTER_FREE_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
                <optgroup label="付费（需在 OpenRouter 充值）">
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
                  placeholder="例如 gpt-4o-mini, claude-3-5-sonnet, deepseek-chat ..."
                  list="custom-model-suggestions"
                />
                <datalist id="custom-model-suggestions">
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
                  中转站的 model 名取决于该 endpoint 暴露了哪些上游 ID，自由输入。
                </div>
              </>
            ) : (
              <select
                className="select"
                value={activeModel}
                onChange={(e) => updateModel(e.target.value)}
              >
                {PRESET_MODELS[activeProvider as keyof typeof PRESET_MODELS].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            {activeProvider !== "openrouter" && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleClear}
                disabled={!activeKey}
                type="button"
              >
                清除 {PROVIDER_LABEL[activeProvider]} Key
              </button>
            )}
            <div style={{ flex: 1 }} />
            {activeKey && (
              <Link href="/analyze" className="btn btn-primary">
                返回拆解 <Icon.ArrowRight />
              </Link>
            )}
          </div>
        </div>

        <aside>
          <div className="card-panel">
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>当前状态</h3>
            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
              }}
            >
              <Row k="provider" v={PROVIDER_LABEL[activeProvider]} />
              <Row k="model" v={activeModel || "(未设置)"} />
              {activeProvider === "custom" && (
                <Row
                  k="baseURL"
                  v={settings.customBaseURL || "(未填)"}
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
                    : "○ 未配置"
                }
                color={activeKey ? "var(--status-ok)" : "var(--status-warn)"}
              />
              <Row k="scope" v="localStorage" color="var(--status-ok)" />
              <Row
                k="github"
                v={settings.githubToken ? "● Token（5000/h）" : "○ 匿名（60/h）"}
                color={
                  settings.githubToken
                    ? "var(--status-ok)"
                    : "var(--fg-3)"
                }
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="card-panel" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 4 }}>GitHub Token（可选）</h3>
        <p className="panel-desc" style={{ marginBottom: 14 }}>
          匿名抓取 GitHub 公开 repo 每 IP 限 60 次/小时。填一个 token 后涨到 <strong style={{ color: "var(--fg)" }}>5000 次/小时</strong>。Token 同样只存在你浏览器 localStorage，不上传任何服务器。
        </p>

        <div className="field" style={{ marginBottom: 12 }}>
          <label className="label">
            Personal Access Token
            <span className="label-hint">
              ghp_... 或 github_pat_... 开头
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
                  <Icon.EyeOff /> 隐藏
                </>
              ) : (
                <>
                  <Icon.Eye /> 显示
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
          没 token？去{" "}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noopener"
            style={{ color: "var(--accent-text)", textDecoration: "underline" }}
          >
            github.com/settings/tokens
          </a>{" "}
          创建一个 Fine-grained PAT，**Repository access 选 Public Repositories**，权限全空着 → 仍能拿到 5000/h 限额。或用 Classic PAT，scope 全不勾也行。
        </div>

        {settings.githubToken && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              settings.setGitHubToken("");
              setToast("已清除 GitHub Token");
            }}
            type="button"
            style={{ marginTop: 12 }}
          >
            清除 Token
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

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
              <Icon.EyeOff /> 隐藏
            </>
          ) : (
            <>
              <Icon.Eye /> 显示
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
          没有 key？在{" "}
          <a
            href={applyHint.url}
            target="_blank"
            rel="noopener"
            style={{ color: "var(--accent-text)", textDecoration: "underline" }}
          >
            {applyHint.label}
          </a>{" "}
          申请。
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
      <label className="label">OpenRouter 账号</label>
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
            <span style={{ color: "var(--status-ok)" }}>● 已登录</span>
            <span style={{ color: "var(--fg-3)" }}>
              {loggedInKey.slice(0, 12)}…{loggedInKey.slice(-4)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onSignIn}
              type="button"
            >
              <Icon.Refresh /> 重新登录
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut} type="button">
              退出登录
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
            在下方 Model 里选一个 <strong style={{ color: "var(--accent-text)" }}>免费</strong> 分组的模型即可零成本拆解；要用 Claude / GPT 等付费模型，先到{" "}
            <a
              href="https://openrouter.ai/credits"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--accent-text)", textDecoration: "underline" }}
            >
              openrouter.ai/credits
            </a>{" "}
            充值。
          </>
        ) : (
          <>
            授权后 OpenRouter 会把一个作用域受限的 key 发回到你的浏览器。如果它跳出充值页，点底部的「Maybe later, I&apos;ll start with free models」即可——免费模型可零成本使用（有速率限制）。
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
          API Base URL <span className="label-hint">必填</span>
        </label>
        <input
          className="input mono"
          value={baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
          placeholder="http://localhost:3000/v1   或   https://api.your-relay.com/v1"
        />
        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            color: "var(--fg-4)",
            lineHeight: 1.6,
          }}
        >
          填一个 OpenAI 兼容的 baseURL——可以是本地起的 one-api / new-api / vllm，也可以是任何第三方 OpenAI 兼容代理。
          注意末尾通常要带 <code>/v1</code>（路径里包含 <code>/chat/completions</code> 的那个根）。
        </div>
      </div>

      <div className="field">
        <label className="label">API Key</label>
        <div className="key-row">
          <input
            type={showKey ? "text" : "password"}
            className="input mono"
            placeholder="对应中转站的 key（有的本地代理可以填 sk-anything）"
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
                <Icon.EyeOff /> 隐藏
              </>
            ) : (
              <>
                <Icon.Eye /> 显示
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
