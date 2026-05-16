"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "./Icon";
import { copyToClipboard, downloadAsFile } from "@/lib/utils";

export function SynthesizedPrompt({
  text,
  streaming,
  onRegenerate,
  filenameHint,
}: {
  text: string;
  streaming?: boolean;
  onRegenerate?: () => void;
  filenameHint?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    const name = filenameHint ? `${filenameHint}-prompt.md` : "ai-prompt.md";
    downloadAsFile(name, text, "text/markdown");
  };

  return (
    <article
      className="module-card"
      style={{
        borderColor: "var(--accent)",
        borderLeftWidth: 3,
      }}
    >
      <div className="card-head">
        <div>
          <div className="card-recipe-no" style={{ color: "var(--accent-text)" }}>
            SYNTHESIZED · STAGE 3
          </div>
          <h3 className="card-title">AI 提示词 · 合成版</h3>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={"tear-btn" + (copied ? " copied" : "")}
            onClick={handleCopy}
            type="button"
          >
            <Icon.Copy />
            {copied ? "已复制" : "复制 Prompt"}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ padding: "12px 22px 6px" }}>
        <div className="card-section">
          <div className="section-label">
            <span className="dot" /> 粘到 Claude / ChatGPT / Cursor 让它接着干
          </div>
          <div className="section-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || ""}</ReactMarkdown>
            {streaming && <span className="stream-caret" />}
          </div>
        </div>
      </div>

      <div className="card-foot">
        <div className="card-foot-hint">
          {streaming
            ? "生成中…"
            : "整合了上面所有卡片 · 一段 prompt 喂给下游 AI 完成你的项目"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!streaming && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDownload}
              type="button"
            >
              <Icon.Download /> .md
            </button>
          )}
          {!streaming && onRegenerate && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onRegenerate}
              type="button"
            >
              <Icon.Refresh /> 重新生成
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
