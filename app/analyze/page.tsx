"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Toast } from "@/components/Toast";
import { ModuleCard } from "@/components/ModuleCard";
import { PhaseStrip } from "@/components/PhaseStrip";
import { StreamView } from "@/components/StreamView";
import { Stage1Summary } from "@/components/Stage1Summary";
import { FetchingKeyFiles } from "@/components/FetchingKeyFiles";
import { ErrorBanner } from "@/components/ErrorBanner";
import { SynthesizedPrompt } from "@/components/SynthesizedPrompt";
import { QuickConfigModal } from "@/components/QuickConfigModal";
import {
  modulesToMarkdown,
  type SynthesizePhase,
} from "@/lib/analyze";
import {
  cancelAnalyze,
  cancelSynthesize,
  isAnalyzing,
  resetActiveRun,
  startAnalyze,
  startDemoAnalyze,
  startDemoSynthesize,
  startSynthesize,
  useActiveRun,
} from "@/lib/active-run";
import { SEVEN_QUESTIONS } from "@/lib/prompts/seven-questions";
import {
  getActiveBaseURL,
  getActiveKey,
  getActiveModel,
  PROVIDER_LABEL,
  useSettings,
} from "@/lib/store";
import { downloadAsFile, extractGitHubRepos, parseGitHubUrl } from "@/lib/utils";
import { useInputDraft } from "@/lib/input-draft";

type Mode = "fixed" | "custom";

interface UrlRow {
  id: string;
  value: string;
}

function newRow(value = ""): UrlRow {
  return { id: Math.random().toString(36).slice(2), value };
}

export default function AnalyzePage() {
  const [hydrated, setHydrated] = useState(false);
  const settings = useSettings();
  // 整个 run 状态从全局 store 来——切 Tab 不丢
  const run = useActiveRun();
  // 输入草稿持久化到 localStorage —— 刷新/切 tab 不丢
  const draft = useInputDraft();

  // 本地 UrlRow 维护（带 id），从 draft.urls 派生
  const [urlRows, setUrlRowsLocal] = useState<UrlRow[]>(() =>
    (draft.urls.length > 0 ? draft.urls : [""]).map((v) => newRow(v))
  );
  const [toast, setToast] = useState<string | null>(null);
  const [stream1Open, setStream1Open] = useState(false);
  const [stream2Open, setStream2Open] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [extractOpen, setExtractOpen] = useState(false);
  const [quickConfigOpen, setQuickConfigOpen] = useState(false);

  // 通过 draft store 直接读写 ctx/modes/customQ
  const ctx = draft.ctx;
  const setCtx = draft.setCtx;
  const modes = draft.modes;
  const setModes = (next: Mode[]) => draft.setModes(next);
  const customQ = draft.customQ;
  const setCustomQ = draft.setCustomQ;

  // 包一层 setUrlRows，自动把当前 url 值同步进 draft
  const setUrlRows: (
    updater: UrlRow[] | ((rows: UrlRow[]) => UrlRow[])
  ) => void = (updater) => {
    setUrlRowsLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      draft.setUrls(next.map((r) => r.value));
      return next;
    });
  };

  useEffect(() => {
    setHydrated(true);
    // 切回来时若 store 里有运行/刚完成的 run，恢复输入框内容（优先于 draft）
    const r = useActiveRun.getState();
    if (r.phase !== "idle" && r.repos.length > 0) {
      const rows = r.repos.map((rr) => newRow(`${rr.owner}/${rr.repo}`));
      setUrlRowsLocal(rows);
      draft.setUrls(rows.map((rr) => rr.value));
      draft.setCtx(r.target);
    } else {
      // draft 已 hydrate；如果 draft.urls 跟当前 rows 不一致（hydration 后），同步过来
      if (
        draft.urls.length > 0 &&
        draft.urls.join("|") !== urlRows.map((r) => r.value).join("|")
      ) {
        setUrlRowsLocal((draft.urls.length > 0 ? draft.urls : [""]).map((v) => newRow(v)));
      }
    }
    // 落地页 → /analyze?demo=1 自动启动 demo
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1" && useActiveRun.getState().phase === "idle") {
        // 清理 URL 避免刷新二次触发
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", clean);
        // 异步触发 demo，让组件先 mount 完
        setTimeout(() => void startDemoAnalyze({ locale: "zh" }), 100);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动展开当前阶段的 stream view
  useEffect(() => {
    if (run.phase === "stage1") setStream1Open(true);
    if (run.phase === "stage2") setStream2Open(true);
  }, [run.phase]);

  const parsedRepos = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ owner: string; repo: string }> = [];
    for (const row of urlRows) {
      const p = parseGitHubUrl(row.value);
      if (!p) continue;
      const slug = `${p.owner}/${p.repo}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push(p);
    }
    return out;
  }, [urlRows]);

  const apiKey = hydrated ? getActiveKey(settings) : "";
  const model = hydrated ? getActiveModel(settings) : "";
  const baseURL = hydrated ? getActiveBaseURL(settings) : undefined;
  const apiKeyReady =
    apiKey.length > 6 &&
    (settings.provider !== "custom" || (baseURL && baseURL.length > 8));

  const running = isAnalyzing(run);
  const canStart =
    parsedRepos.length > 0 &&
    ctx.trim().length >= 8 &&
    modes.length > 0 &&
    apiKeyReady &&
    !running;

  const updateRow = (id: string, value: string) =>
    setUrlRows((rows) => rows.map((r) => (r.id === id ? { ...r, value } : r)));
  const removeRow = (id: string) =>
    setUrlRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)
    );
  const addRow = () => setUrlRows((rows) => [...rows, newRow("")]);

  const handleExtract = () => {
    const found = extractGitHubRepos(extractText);
    if (found.length === 0) {
      setToast("没在这段文字里找到 github.com 链接");
      return;
    }

    // 现有行里已经识别出来的 slug，避免重复
    const existing = new Set(
      urlRows
        .map((r) => parseGitHubUrl(r.value))
        .filter((p): p is { owner: string; repo: string } => !!p)
        .map((p) => `${p.owner}/${p.repo}`)
    );
    const fresh = found.filter(
      (r) => !existing.has(`${r.owner}/${r.repo}`)
    );

    if (fresh.length === 0) {
      setToast(`找到 ${found.length} 个，但都已经在列表里了`);
      return;
    }

    setUrlRows((rows) => {
      const updated = [...rows];
      let i = 0;
      // 先填空行
      for (let r = 0; r < updated.length && i < fresh.length; r++) {
        if (!updated[r].value.trim()) {
          updated[r] = {
            ...updated[r],
            value: `https://github.com/${fresh[i].owner}/${fresh[i].repo}`,
          };
          i++;
        }
      }
      // 剩余的追加新行
      while (i < fresh.length) {
        updated.push(
          newRow(`https://github.com/${fresh[i].owner}/${fresh[i].repo}`)
        );
        i++;
      }
      return updated;
    });

    const skipped = found.length - fresh.length;
    setToast(
      skipped > 0
        ? `已导入 ${fresh.length} 个 repo · ${skipped} 个已存在跳过`
        : `已导入 ${fresh.length} 个 repo`
    );
    setExtractText("");
    setExtractOpen(false);
  };

  const buildSelectedQuestions = (): string[] => {
    const out: string[] = [];
    if (modes.includes("fixed")) {
      out.push(...SEVEN_QUESTIONS.map((q) => q.text));
    }
    if (modes.includes("custom")) {
      for (const line of customQ.split(/\r?\n/)) {
        const t = line.trim();
        if (t) out.push(t);
      }
    }
    return Array.from(new Set(out));
  };

  const handleStart = () => {
    if (running) {
      cancelAnalyze();
      setToast("已取消");
      return;
    }
    if (parsedRepos.length === 0 || !apiKey || !model) return;
    void startAnalyze({
      repos: parsedRepos,
      userProjectContext: ctx,
      selectedQuestions: buildSelectedQuestions(),
      provider: settings.provider,
      apiKey,
      model,
      baseURL,
    });
  };

  const handleReset = () => {
    if (running) cancelAnalyze();
    resetActiveRun();
  };

  const handleSynthesize = () => {
    // demo 模式下走 canned synth；真实模式才打 LLM
    if (run.isDemo) {
      void startDemoSynthesize({ locale: "zh" });
      return;
    }
    void startSynthesize({
      provider: settings.provider,
      apiKey,
      model,
      baseURL,
    });
  };

  const handleDemo = () => {
    void startDemoAnalyze({ locale: "zh" });
  };

  const handleExport = () => {
    if (run.repos.length === 0 || run.modules.length === 0) return;
    const md = modulesToMarkdown({
      repos: run.repos,
      userContext: run.target,
      modules: run.modules,
    });
    const filename =
      run.repos.length === 1
        ? `${run.repos[0].owner}-${run.repos[0].repo}-dissect.md`
        : `compare-${run.repos.length}-repos-dissect.md`;
    downloadAsFile(filename, md, "text/markdown");
    setToast(`已下载 ${filename}`);
  };

  const onCardTear = (m: { title: string }) => {
    const title = m.title.split("：")[0] || m.title;
    setToast(`「${title}」已复制为 Markdown`);
  };

  const handleRetry = () => {
    handleReset();
    setTimeout(handleStart, 0);
  };

  const toggleMode = (m: Mode) => {
    setModes(modes.includes(m) ? modes.filter((x) => x !== m) : [...modes, m]);
  };

  return (
    <div className="page">
      <Toast msg={toast} onDone={() => setToast(null)} />
      <QuickConfigModal
        open={quickConfigOpen}
        onClose={() => setQuickConfigOpen(false)}
        onSaved={() => setToast("已保存 · 现在可以开始拆解")}
      />

      <div className="analyze-grid">
        <aside className="input-panel">
          <div className="field">
            <label className="label">
              GitHub 链接{" "}
              <span className="label-hint">
                {parsedRepos.length > 1
                  ? `对比 ${parsedRepos.length} 个 repo`
                  : urlRows.length > 1
                  ? "多个会做对比"
                  : "可加多个做对比"}
              </span>
            </label>

            <details
              open={extractOpen}
              onToggle={(e) =>
                setExtractOpen((e.target as HTMLDetailsElement).open)
              }
              style={{
                marginBottom: 10,
                padding: "8px 12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  listStyle: "none",
                  userSelect: "none",
                }}
              >
                📋 从一段文字里批量提取链接
              </summary>
              <textarea
                className="textarea"
                rows={4}
                style={{ marginTop: 10, fontSize: 13 }}
                placeholder={
                  "把 ChatGPT 回答 / 推文 / 文章片段 / 任何包含 github.com/owner/repo 的文字粘进来，点「提取并导入」自动识别"
                }
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => {
                    setExtractText("");
                  }}
                  disabled={!extractText}
                >
                  清空
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={handleExtract}
                  disabled={!extractText.trim()}
                >
                  提取并导入
                </button>
              </div>
            </details>

            <div style={{ display: "grid", gap: 6 }}>
              {urlRows.map((row, i) => {
                const parsed = parseGitHubUrl(row.value);
                return (
                  <div
                    key={row.id}
                    style={{ display: "flex", gap: 6, alignItems: "stretch" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        className="input mono"
                        placeholder={
                          i === 0
                            ? "owner/repo 或 https://github.com/..."
                            : "另一个相关 repo"
                        }
                        value={row.value}
                        onChange={(e) => updateRow(row.id, e.target.value)}
                      />
                      {parsed && (
                        <div
                          className="repo-confirm"
                          style={{ marginTop: 4, fontSize: 11.5 }}
                        >
                          <Icon.Check />{" "}
                          <span style={{ color: "var(--accent-text)" }}>
                            {parsed.owner}/{parsed.repo}
                          </span>
                        </div>
                      )}
                    </div>
                    {urlRows.length > 1 && (
                      <button
                        className="icon-btn"
                        onClick={() => removeRow(row.id)}
                        title="移除这个 repo"
                        type="button"
                        style={{ alignSelf: "flex-start" }}
                      >
                        <Icon.Close />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={addRow}
              type="button"
              style={{ marginTop: 8, fontSize: 12 }}
            >
              + 再加一个相关 repo
            </button>
            {urlRows.length >= 6 && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11.5,
                  color: "var(--fg-4)",
                  lineHeight: 1.5,
                }}
              >
                提示：repo 越多 prompt 越大，可能撞模型 token 上限或 GitHub
                每小时 60 次匿名抓取限额。
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">你正在做什么</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="例如：我在做一个面向中文播客的 AI 摘要工具，Next.js + Claude API"
              value={ctx}
              onChange={(e) => setCtx(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">问题模式</label>
            <div className="mode-chips">
              {(
                [
                  { id: "fixed", label: "固定七问" },
                  { id: "custom", label: "自己出题" },
                ] as { id: Mode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  className={"mode-chip" + (modes.includes(m.id) ? " on" : "")}
                  onClick={() => toggleMode(m.id)}
                  type="button"
                >
                  <span className="mode-chip-check">
                    {modes.includes(m.id) ? <Icon.Check /> : "+"}
                  </span>
                  {m.label}
                </button>
              ))}
            </div>
            {modes.includes("custom") && (
              <textarea
                className="textarea"
                rows={2}
                style={{ marginTop: 10, fontSize: 13 }}
                placeholder={"一行一个问题"}
                value={customQ}
                onChange={(e) => setCustomQ(e.target.value)}
              />
            )}
          </div>

          {hydrated && apiKeyReady ? (
            <div className="provider-status">
              <div>
                <span className="ready-dot" />
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {PROVIDER_LABEL[settings.provider]} · {model}
                </span>
              </div>
              <Link
                href="/settings"
                style={{ color: "var(--accent-text)", fontSize: 12 }}
              >
                更换
              </Link>
            </div>
          ) : hydrated ? (
            <div className="provider-status warn">
              <div>
                <span className="ready-dot" />
                <span style={{ color: "var(--status-warn)" }}>
                  请先配置 API Key
                </span>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setQuickConfigOpen(true)}
                type="button"
              >
                快速配置 →
              </button>
            </div>
          ) : null}

          {running ? (
            <button
              className="btn btn-danger btn-lg"
              style={{ width: "100%", marginTop: 18 }}
              onClick={handleStart}
              type="button"
            >
              <Icon.Stop /> 取消
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: 18 }}
              disabled={!canStart}
              onClick={handleStart}
              type="button"
            >
              <Icon.Sparkle />{" "}
              {parsedRepos.length > 1
                ? `对比拆解 ${parsedRepos.length} 个 repo`
                : "开始拆解"}
            </button>
          )}

          {/* Demo 试用按钮：只在 idle 时显示，让访客零成本体验完整流程 */}
          {!running && run.phase === "idle" && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleDemo}
              type="button"
              title="用预设数据走一遍完整流程，不消耗任何配额"
            >
              🎬 试一下 demo · 不需 Key
            </button>
          )}

          {(run.phase === "done" || run.phase === "error") && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleReset}
              type="button"
            >
              清空结果
            </button>
          )}
        </aside>

        <section className="results-panel">
          {run.phase === "idle" && hydrated && !apiKeyReady && (
            <FirstRunWizard
              onDemo={handleDemo}
              onQuickConfig={() => setQuickConfigOpen(true)}
            />
          )}

          {run.phase === "idle" && (!hydrated || apiKeyReady) && (
            <div className="results-empty">
              <div className="empty-illo">
                <Icon.Magnify />
              </div>
              <h3>等着拆 repo</h3>
              <p style={{ maxWidth: 360, margin: "0 auto" }}>
                填好链接和你的项目背景，点开始。可以加多个相关 repo 一起做对比。
              </p>
            </div>
          )}

          {run.phase === "error" && run.error && (
            <>
              <ErrorBanner
                msg={run.error}
                kind={run.errorKind}
                onRetry={handleRetry}
                onDismiss={handleReset}
              />
              {run.modules.length > 0 ? (
                <>
                  <div className="cards-header" style={{ marginTop: 14 }}>
                    <div className="count">
                      抢救出 <span className="accent">{run.modules.length}</span> 张卡片
                      <span
                        style={{
                          color: "var(--fg-4)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          marginLeft: 10,
                        }}
                      >
                        · 中途出错，但已生成的部分仍可用
                      </span>
                    </div>
                  </div>
                  <div className="cards-list">
                    {run.modules.map((m, i) => (
                      <div key={m.id || i} style={{ animation: "fadein .5s both" }}>
                        <ModuleCard module={m} index={i} onTear={onCardTear} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="results-empty" style={{ height: 240 }}>
                  <p>修一下重试就好——输入都还在。</p>
                </div>
              )}
            </>
          )}

          {run.phase !== "idle" && run.phase !== "error" && (
            <>
              {run.isDemo && (
                <div
                  style={{
                    background: "var(--accent-tint)",
                    border: "1px solid var(--accent-soft)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>
                      🎬 Demo 模式
                    </span>
                    <span style={{ color: "var(--fg-3)", marginLeft: 8 }}>
                      这些是预设数据，不是真拆解。想真拆一个 repo？
                    </span>
                  </div>
                  <Link
                    href="/settings"
                    style={{
                      color: "var(--accent-text)",
                      textDecoration: "underline",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    去设置配 API Key →
                  </Link>
                </div>
              )}

              <PhaseStrip phase={run.phase} completed={run.completed} />

              {run.phase === "fetching" && (
                <div className="stream-view">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "var(--fg-2)",
                      fontFamily: "var(--font-mono)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="spinner"
                      style={{
                        borderColor: "var(--accent)",
                        borderTopColor: "transparent",
                      }}
                    />
                    抓取{" "}
                    {run.repos.map((r, i) => (
                      <span key={i} style={{ color: "var(--accent-text)" }}>
                        {r.owner}/{r.repo}
                        {i < run.repos.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </div>
                  {run.fetchProgress && (
                    <FetchProgressLine progress={run.fetchProgress} />
                  )}
                </div>
              )}

              {(run.phase === "stage1" ||
                (run.completed.includes("stage1") && run.phase !== "done")) &&
                run.stage1Text && (
                  <StreamView
                    stage="STAGE 1"
                    text={run.stage1Text}
                    open={stream1Open && run.phase === "stage1"}
                    onToggle={setStream1Open}
                  />
                )}

              {run.stage1Result &&
                (run.phase === "fetching_key_files" ||
                  run.phase === "stage2" ||
                  run.phase === "done") && (
                  <Stage1Summary result={run.stage1Result} />
                )}

              {run.phase === "fetching_key_files" && run.keyFiles.length > 0 && (
                <FetchingKeyFiles files={run.keyFiles} />
              )}

              {(run.phase === "stage2" ||
                (run.completed.includes("stage2") && run.phase !== "done")) &&
                run.stage2Text && (
                  <StreamView
                    stage="STAGE 2"
                    text={run.stage2Text}
                    open={stream2Open && run.phase === "stage2"}
                    onToggle={setStream2Open}
                  />
                )}

              {(run.phase === "stage2" || run.phase === "done") &&
                run.modules.length > 0 && (
                  <>
                    <div className="cards-header">
                      <div className="count">
                        共 <span className="accent">{run.modules.length}</span>{" "}
                        张可搬卡片
                        {run.phase === "stage2" && (
                          <span
                            style={{
                              color: "var(--fg-4)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              marginLeft: 10,
                            }}
                          >
                            …还在拆
                          </span>
                        )}
                      </div>
                      {run.phase === "done" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              handleReset();
                              setTimeout(handleStart, 0);
                            }}
                            type="button"
                          >
                            <Icon.Refresh /> 重新拆
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleExport}
                            type="button"
                          >
                            <Icon.Download /> 导出 Markdown
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 0-server 凭据：让 BYOK 信任可见 */}
                    {run.phase === "done" && !run.isDemo && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: "8px 12px",
                          background: "var(--status-ok-bg)",
                          border: "1px solid var(--status-ok-border)",
                          borderRadius: 6,
                          fontFamily: "var(--font-mono)",
                          fontSize: 11.5,
                          color: "var(--fg-3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ color: "var(--status-ok)" }}>✓ 本次拆解</span>
                        <span>{run.githubRequests} 次 → GitHub API</span>
                        <span>·</span>
                        <span>{run.llmRequests} 次 → {settings.provider} 官方接口</span>
                        <span>·</span>
                        <span style={{ color: "var(--status-ok)" }}>
                          0 次 → 拆小块学 服务器
                        </span>
                      </div>
                    )}

                    <div className="cards-list">
                      {run.modules.map((m, i) => (
                        <div
                          key={m.id || i}
                          style={{ animation: "fadein .5s both" }}
                        >
                          <ModuleCard
                            module={m}
                            index={i}
                            onTear={onCardTear}
                          />
                        </div>
                      ))}
                    </div>

                    {run.phase === "done" && (
                      <SynthesizeSection
                        phase={run.synthPhase}
                        text={run.synthText}
                        error={run.synthError}
                        errorKind={run.synthErrorKind}
                        onStart={handleSynthesize}
                        onCancel={cancelSynthesize}
                        onRegenerate={handleSynthesize}
                      />
                    )}
                  </>
                )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * 拆 "owner/repo:step" 进度字符串，把 step 翻译成本地化文案。
 */
function FetchProgressLine({ progress }: { progress: string }) {
  // 期待格式 "owner/repo:step"
  const lastColon = progress.lastIndexOf(":");
  const slug = lastColon > 0 ? progress.slice(0, lastColon) : "";
  const step = lastColon > 0 ? progress.slice(lastColon + 1) : progress;
  const stepLabels: Record<string, string> = {
    cache: "从缓存读取",
    meta: "项目元信息",
    content: "README + 文件树",
    manifests: "依赖清单",
    done: "✓ 完成",
  };
  const label = stepLabels[step] || step;
  return (
    <div
      style={{
        marginTop: 8,
        marginLeft: 22,
        fontSize: 11.5,
        color: "var(--fg-4)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {slug && <span style={{ color: "var(--fg-5)" }}>{slug}: </span>}
      {label}
    </div>
  );
}

function FirstRunWizard({
  onDemo,
  onQuickConfig,
}: {
  onDemo: () => void;
  onQuickConfig: () => void;
}) {
  return (
    <div
      style={{
        padding: "32px 28px",
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          👋 第一次来？
        </h3>
        <span
          style={{
            color: "var(--fg-3)",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
          }}
        >
          三条路径
        </span>
      </div>
      <p
        style={{
          color: "var(--fg-3)",
          fontSize: 13.5,
          lineHeight: 1.65,
          margin: "0 0 22px",
        }}
      >
        别急着填 key——先选一条体验完整流程。
      </p>

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <div
          style={{
            padding: 18,
            background: "var(--canvas)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 24 }}>🎬</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>试一下 demo</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            用 <code>vercel/ai-chatbot</code> 走一遍完整两阶段拆解 +
            AI 提示词合成，预设数据，<strong>不需要任何 key</strong>。
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={onDemo}
            type="button"
          >
            开始 demo →
          </button>
        </div>

        <div
          style={{
            padding: 18,
            background: "var(--canvas)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 24 }}>🆓</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>OpenRouter 免费模型</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            一键 OAuth 登录，免费模型零成本，**真拆**任何公开 repo。
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onQuickConfig}
            type="button"
          >
            登录 OpenRouter →
          </button>
        </div>

        <div
          style={{
            padding: 18,
            background: "var(--canvas)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 24 }}>🔑</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>用你自己的 Key</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            Claude / GPT / DeepSeek / Kimi / 智谱 都行 ·{" "}
            <strong>不离开此页</strong>，弹窗里填好就用。
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onQuickConfig}
            type="button"
          >
            快速配置 →
          </button>
        </div>
      </div>
    </div>
  );
}

function SynthesizeSection({
  phase,
  text,
  error,
  errorKind,
  onStart,
  onCancel,
  onRegenerate,
}: {
  phase: SynthesizePhase;
  text: string;
  error: string | null;
  errorKind: string | null;
  onStart: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div style={{ marginTop: 22 }}>
      {phase === "idle" && (
        <div
          className="stage1-summary"
          style={{ borderLeftColor: "var(--accent)" }}
        >
          <h4 style={{ marginBottom: 8 }}>合成下一步 · 生成 AI 提示词</h4>
          <p
            style={{
              margin: "0 0 14px",
              color: "var(--fg-3)",
              fontSize: 13.5,
              lineHeight: 1.65,
            }}
          >
            把上面这些卡片整合成一段可直接粘到 Claude / ChatGPT / Cursor 的 prompt——让下游 AI 接着帮你把这些可搬小块落到你自己的项目里。
          </p>
          <button className="btn btn-primary" onClick={onStart} type="button">
            生成 AI 提示词 →
          </button>
        </div>
      )}

      {phase === "running" && (
        <>
          <SynthesizedPrompt text={text} streaming />
          <div
            style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={onCancel}
              type="button"
            >
              取消生成
            </button>
          </div>
        </>
      )}

      {phase === "done" && (
        <SynthesizedPrompt text={text} onRegenerate={onRegenerate} />
      )}

      {phase === "error" && error && (
        <ErrorBanner
          msg={error}
          kind={errorKind}
          title="合成失败"
          onRetry={onRegenerate}
        />
      )}
    </div>
  );
}
