"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Toast } from "@/components/Toast";
import { ModuleCard } from "@/components/ModuleCard";
import { SynthesizedPrompt } from "@/components/SynthesizedPrompt";
import {
  formatBundleDate,
  useHistory,
  type AnalysisBundle,
} from "@/lib/history";
import { modulesToMarkdown } from "@/lib/analyze";
import { downloadAsFile } from "@/lib/utils";

export default function HistoryPage() {
  const bundles = useHistory((s) => s.bundles);
  const remove = useHistory((s) => s.remove);
  const clear = useHistory((s) => s.clear);
  // 关键：用 zustand persist 的 hasHydrated/onFinishHydration 来精确判断
  // 是否「localStorage 真正读完了」，避免 SSR → CSR 那一瞬间把『还没读到』
  // 误显示成『历史为空』。
  const [hydrated, setHydrated] = useState(() =>
    typeof window !== "undefined" ? useHistory.persist.hasHydrated() : false
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (useHistory.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useHistory.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return unsub;
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("删除这条历史？")) return;
    remove(id);
    setToast("已删除");
  };

  const handleClearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("清空所有历史？")) return;
    clear();
    setToast("已清空");
  };

  const handleExport = (b: AnalysisBundle) => {
    const md = modulesToMarkdown({
      repos: b.repos,
      userContext: b.target,
      modules: b.modules,
    });
    const filename =
      b.repos.length === 1
        ? `${b.repos[0].owner}-${b.repos[0].repo}-dissect.md`
        : `compare-${b.repos.length}-repos-dissect.md`;
    downloadAsFile(filename, md, "text/markdown");
    setToast(`已下载 ${filename}`);
  };

  if (!hydrated) {
    return <div className="page" style={{ minHeight: 400 }} />;
  }

  return (
    <div className="page">
      <Toast msg={toast} onDone={() => setToast(null)} />
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 6 }}>
            历史记录
          </h2>
          <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14 }}>
            共 {bundles.length} 个项目包 · 仅存本地浏览器
          </p>
        </div>
        {bundles.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearAll} type="button">
            清空全部
          </button>
        )}
      </div>

      {bundles.length === 0 ? (
        <div className="results-empty" style={{ height: 320 }}>
          <div className="empty-illo">
            <Icon.Folder />
          </div>
          <h3>还没有历史记录</h3>
          <p>
            去{" "}
            <Link href="/analyze" style={{ color: "var(--accent-text)" }}>
              拆解
            </Link>{" "}
            一个 repo，结果会自动保存在这里。
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {bundles.map((b) => (
            <BundleCard
              key={b.id}
              bundle={b}
              isExpanded={expanded.has(b.id)}
              onToggle={() => toggle(b.id)}
              onDelete={() => handleDelete(b.id)}
              onExport={() => handleExport(b)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BundleCard({
  bundle: b,
  isExpanded,
  onToggle,
  onDelete,
  onExport,
}: {
  bundle: AnalysisBundle;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const targetPreview =
    b.target.length > 80 ? b.target.slice(0, 80) + "…" : b.target;

  return (
    <article className="module-card">
      <div
        className="card-head"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-recipe-no" style={{ color: "var(--fg-4)" }}>
            {formatBundleDate(b.createdAt)} · {b.modules.length} 张卡片{" "}
            {b.generatedPrompt && (
              <span style={{ color: "var(--accent-text)" }}>· + AI 提示词</span>
            )}
          </div>
          <h3 className="card-title" style={{ fontSize: 16 }}>
            {targetPreview || "（未填项目背景）"}
          </h3>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{ fontSize: 16 }}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      <div className="card-files">
        {b.repos.map((r) => (
          <span key={`${r.owner}/${r.repo}`} className="chip chip-file">
            <Icon.Folder /> {r.owner}/{r.repo}
          </span>
        ))}
      </div>

      {isExpanded && (
        <>
          <div className="card-body">
            {b.target && (
              <div className="card-section">
                <div className="section-label">
                  <span className="dot" /> 项目目标
                </div>
                <div
                  className="section-body"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {b.target}
                </div>
              </div>
            )}

            <div className="card-section">
              <div className="section-label">
                <span className="dot" /> 拆出的模块（{b.modules.length}）
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                {b.modules.map((m, i) => (
                  <ModuleCard key={m.id || i} module={m} index={i} />
                ))}
              </div>
            </div>

            {b.generatedPrompt && (
              <div className="card-section">
                <div className="section-label">
                  <span className="dot" /> AI 提示词（合成）
                </div>
                <div style={{ marginTop: 8 }}>
                  <SynthesizedPrompt
                    text={b.generatedPrompt}
                    filenameHint={b.repos.map((r) => r.repo).join("-")}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card-foot">
            <div className="card-foot-hint">id: {b.id.slice(0, 12)}…</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onExport}
                type="button"
              >
                <Icon.Download /> 导出 .md
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onDelete}
                type="button"
                style={{ color: "var(--status-danger)" }}
              >
                删除
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
