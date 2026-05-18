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
import {
  getActiveBaseURL,
  getActiveKey,
  getActiveModel,
  useSettings,
  type ProviderName,
} from "@/lib/store";
import { downloadAsFile, extractGitHubRepos, parseGitHubUrl } from "@/lib/utils";
import { useInputDraft } from "@/lib/input-draft";

const PROVIDER_LABEL_EN: Record<ProviderName, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  moonshot: "Kimi",
  zhipu: "Zhipu GLM",
  custom: "Custom relay",
};

const SEVEN_QUESTIONS_EN = [
  "How is the LLM call layer abstracted? How are multiple providers/models switched?",
  "How is streaming response / chunked rendering handled? How are frontend and backend wired together?",
  "Markdown and code-block rendering approach? Any handling of streaming markdown edge cases?",
  "How are prompts managed and versioned? Is there a prompt template / variable injection mechanism?",
  "State management and session persistence approach? How are multi-tab, refresh, cross-device handled?",
  "Error handling, rate limiting, retry, and degradation strategies?",
  "UX design for auth and API key management? BYOK vs server-side proxy trade-offs?",
];

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
  const run = useActiveRun();
  const draft = useInputDraft();

  const [urlRows, setUrlRowsLocal] = useState<UrlRow[]>(() =>
    (draft.urls.length > 0 ? draft.urls : [""]).map((v) => newRow(v))
  );
  const [toast, setToast] = useState<string | null>(null);
  const [stream1Open, setStream1Open] = useState(false);
  const [stream2Open, setStream2Open] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [extractOpen, setExtractOpen] = useState(false);
  const [quickConfigOpen, setQuickConfigOpen] = useState(false);

  const ctx = draft.ctx;
  const setCtx = draft.setCtx;
  const modes = draft.modes;
  const setModes = (next: Mode[]) => draft.setModes(next);
  const customQ = draft.customQ;
  const setCustomQ = draft.setCustomQ;

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
    const r = useActiveRun.getState();
    if (r.phase !== "idle" && r.repos.length > 0) {
      const rows = r.repos.map((rr) => newRow(`${rr.owner}/${rr.repo}`));
      setUrlRowsLocal(rows);
      draft.setUrls(rows.map((rr) => rr.value));
      draft.setCtx(r.target);
    } else {
      if (
        draft.urls.length > 0 &&
        draft.urls.join("|") !== urlRows.map((r) => r.value).join("|")
      ) {
        setUrlRowsLocal((draft.urls.length > 0 ? draft.urls : [""]).map((v) => newRow(v)));
      }
    }
    // Landing → /en/analyze?demo=1 auto-start demo
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1" && useActiveRun.getState().phase === "idle") {
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", clean);
        setTimeout(() => void startDemoAnalyze({ locale: "en" }), 100);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setUrlRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  const addRow = () => setUrlRows((rows) => [...rows, newRow("")]);

  const handleExtract = () => {
    const found = extractGitHubRepos(extractText);
    if (found.length === 0) {
      setToast("No github.com links found in this text");
      return;
    }
    const existing = new Set(
      urlRows
        .map((r) => parseGitHubUrl(r.value))
        .filter((p): p is { owner: string; repo: string } => !!p)
        .map((p) => `${p.owner}/${p.repo}`)
    );
    const fresh = found.filter((r) => !existing.has(`${r.owner}/${r.repo}`));
    if (fresh.length === 0) {
      setToast(`Found ${found.length}, all already in list`);
      return;
    }
    setUrlRows((rows) => {
      const updated = [...rows];
      let i = 0;
      for (let r = 0; r < updated.length && i < fresh.length; r++) {
        if (!updated[r].value.trim()) {
          updated[r] = {
            ...updated[r],
            value: `https://github.com/${fresh[i].owner}/${fresh[i].repo}`,
          };
          i++;
        }
      }
      while (i < fresh.length) {
        updated.push(newRow(`https://github.com/${fresh[i].owner}/${fresh[i].repo}`));
        i++;
      }
      return updated;
    });
    const skipped = found.length - fresh.length;
    setToast(skipped > 0 ? `Imported ${fresh.length} repo(s) · ${skipped} duplicates skipped` : `Imported ${fresh.length} repo(s)`);
    setExtractText("");
    setExtractOpen(false);
  };

  const buildSelectedQuestions = (): string[] => {
    const out: string[] = [];
    if (modes.includes("fixed")) out.push(...SEVEN_QUESTIONS_EN);
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
      setToast("Cancelled");
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
      locale: "en",
    });
  };

  const handleReset = () => {
    if (running) cancelAnalyze();
    resetActiveRun();
  };

  const handleSynthesize = () => {
    if (run.isDemo) {
      void startDemoSynthesize({ locale: "en" });
      return;
    }
    void startSynthesize({
      provider: settings.provider,
      apiKey,
      model,
      baseURL,
      locale: "en",
    });
  };

  const handleDemo = () => {
    void startDemoAnalyze({ locale: "en" });
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
    setToast(`Downloaded ${filename}`);
  };

  const onCardTear = (m: { title: string }) => {
    const title = m.title.split(":")[0]?.split("：")[0] || m.title;
    setToast(`"${title}" copied as Markdown`);
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
        onSaved={() => setToast("Saved · ready to dissect")}
      />

      <div className="analyze-grid">
        <aside className="input-panel">
          <div className="field">
            <label className="label">
              GitHub URLs{" "}
              <span className="label-hint">
                {parsedRepos.length > 1
                  ? `Comparing ${parsedRepos.length} repos`
                  : urlRows.length > 1
                  ? "Multiple = compare"
                  : "Add more for comparison"}
              </span>
            </label>

            <details
              open={extractOpen}
              onToggle={(e) => setExtractOpen((e.target as HTMLDetailsElement).open)}
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
                📋 Extract URLs from a chunk of text
              </summary>
              <textarea
                className="textarea"
                rows={4}
                style={{ marginTop: 10, fontSize: 13 }}
                placeholder={
                  "Paste ChatGPT replies / tweets / articles / anything containing github.com/owner/repo and click Import"
                }
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => setExtractText("")}
                  disabled={!extractText}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={handleExtract}
                  disabled={!extractText.trim()}
                >
                  Import
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
                            ? "owner/repo or https://github.com/..."
                            : "another related repo"
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
                        title="Remove"
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
              + Add another repo
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
                Heads up: more repos = bigger prompt, may hit model token limits or
                GitHub&apos;s 60/h anonymous quota.
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">What are you building?</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="e.g., I'm building an AI podcast summarizer in Next.js + Claude API"
              value={ctx}
              onChange={(e) => setCtx(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Question modes</label>
            <div className="mode-chips">
              {(
                [
                  { id: "fixed", label: "Fixed seven" },
                  { id: "custom", label: "Your own" },
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
                placeholder={"One question per line"}
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
                  {PROVIDER_LABEL_EN[settings.provider]} · {model}
                </span>
              </div>
              <Link href="/en/settings" style={{ color: "var(--accent-text)", fontSize: 12 }}>
                Change
              </Link>
            </div>
          ) : hydrated ? (
            <div className="provider-status warn">
              <div>
                <span className="ready-dot" />
                <span style={{ color: "var(--status-warn)" }}>
                  Set up an API key first
                </span>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setQuickConfigOpen(true)}
                type="button"
              >
                Quick setup →
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
              <Icon.Stop /> Cancel
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
                ? `Compare ${parsedRepos.length} repos`
                : "Start dissecting"}
            </button>
          )}

          {/* Demo button: visible only when idle */}
          {!running && run.phase === "idle" && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleDemo}
              type="button"
              title="Walk through the full flow with prefab data — costs nothing"
            >
              🎬 Try a demo · No key needed
            </button>
          )}

          {(run.phase === "done" || run.phase === "error") && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleReset}
              type="button"
            >
              Clear results
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
              <h3>Ready when you are</h3>
              <p style={{ maxWidth: 360, margin: "0 auto" }}>
                Fill in the inputs on the left and hit Start. Add more repos for side-by-side comparison.
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
                      Salvaged <span className="accent">{run.modules.length}</span> card{run.modules.length === 1 ? "" : "s"}
                      <span
                        style={{
                          color: "var(--fg-4)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          marginLeft: 10,
                        }}
                      >
                        · stream died mid-way, but what we got is usable
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
                  <p>Tweak and retry — your inputs are still here.</p>
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
                      🎬 Demo mode
                    </span>
                    <span style={{ color: "var(--fg-3)", marginLeft: 8 }}>
                      These cards are prefab. Want to dissect a real repo?
                    </span>
                  </div>
                  <Link
                    href="/en/settings"
                    style={{
                      color: "var(--accent-text)",
                      textDecoration: "underline",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Set up API key →
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
                    Fetching{" "}
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
                  run.phase === "done") && <Stage1Summary result={run.stage1Result} />}

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
                        {run.modules.length}{" "}
                        <span className="accent">stealable card{run.modules.length === 1 ? "" : "s"}</span>
                        {run.phase === "stage2" && (
                          <span
                            style={{
                              color: "var(--fg-4)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              marginLeft: 10,
                            }}
                          >
                            …still dissecting
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
                            <Icon.Refresh /> Re-dissect
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleExport}
                            type="button"
                          >
                            <Icon.Download /> Export Markdown
                          </button>
                        </div>
                      )}
                    </div>

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
                        <span style={{ color: "var(--status-ok)" }}>✓ this run</span>
                        <span>{run.githubRequests} → GitHub API</span>
                        <span>·</span>
                        <span>{run.llmRequests} → {settings.provider} official</span>
                        <span>·</span>
                        <span style={{ color: "var(--status-ok)" }}>
                          0 → our server
                        </span>
                      </div>
                    )}

                    <div className="cards-list">
                      {run.modules.map((m, i) => (
                        <div key={m.id || i} style={{ animation: "fadein .5s both" }}>
                          <ModuleCard module={m} index={i} onTear={onCardTear} />
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

function FetchProgressLine({ progress }: { progress: string }) {
  const lastColon = progress.lastIndexOf(":");
  const slug = lastColon > 0 ? progress.slice(0, lastColon) : "";
  const step = lastColon > 0 ? progress.slice(lastColon + 1) : progress;
  const stepLabels: Record<string, string> = {
    cache: "from cache",
    meta: "repo metadata",
    content: "README + file tree",
    manifests: "manifest files",
    done: "✓ done",
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
          👋 First time here?
        </h3>
        <span
          style={{
            color: "var(--fg-3)",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
          }}
        >
          three paths
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
        Don&apos;t bother with API keys yet — try the flow first.
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
          <div style={{ fontWeight: 600, fontSize: 15 }}>Try a demo</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            Walk through the full 2-stage dissection + AI prompt synthesis. Prefab data, <strong>no key required</strong>.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={onDemo}
            type="button"
          >
            Start demo →
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
          <div style={{ fontWeight: 600, fontSize: 15 }}>OpenRouter free trial</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            One-tap OAuth · zero spend on free models —{" "}
            <strong>~200 req/day</strong>, enough to try 1-2 repos and feel the product.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onQuickConfig}
            type="button"
          >
            Sign in with OpenRouter →
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
          <div style={{ fontWeight: 600, fontSize: 15 }}>Use your own key · daily use</div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--fg-3)",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            Claude / GPT — or <strong>DeepSeek / Kimi / Zhipu</strong> if
            you&apos;re in mainland China (no VPN; $5 ≈ 50 dissects).
            Paste a key in the modal, <strong>without leaving this page</strong>.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onQuickConfig}
            type="button"
          >
            Quick setup →
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
        <div className="stage1-summary" style={{ borderLeftColor: "var(--accent)" }}>
          <h4 style={{ marginBottom: 8 }}>Stage 3 · Synthesize an AI prompt</h4>
          <p
            style={{
              margin: "0 0 14px",
              color: "var(--fg-3)",
              fontSize: 13.5,
              lineHeight: 1.65,
            }}
          >
            Roll all the cards above into a prompt you can drop into Claude / ChatGPT / Cursor — let the downstream AI wire these stealable bits into your actual project.
          </p>
          <button className="btn btn-primary" onClick={onStart} type="button">
            Generate AI prompt →
          </button>
        </div>
      )}

      {phase === "running" && (
        <>
          <SynthesizedPrompt text={text} streaming />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">
              Cancel
            </button>
          </div>
        </>
      )}

      {phase === "done" && <SynthesizedPrompt text={text} onRegenerate={onRegenerate} />}

      {phase === "error" && error && (
        <ErrorBanner
          msg={error}
          kind={errorKind}
          title="Synthesis failed"
          onRetry={onRegenerate}
        />
      )}
    </div>
  );
}
