"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Module } from "@/lib/prompts/stage2";
import { moduleToMarkdown } from "@/lib/analyze";
import { copyToClipboard } from "@/lib/utils";
import { useDict } from "@/lib/i18n";
import { Icon } from "./Icon";

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p>{children}</p>,
      }}
    >
      {children || ""}
    </ReactMarkdown>
  );
}

function CodeBlock({
  code,
  filename,
  onCopy,
  title,
}: {
  code: string;
  filename: string;
  onCopy: () => void;
  title: string;
}) {
  return (
    <div className="code-block">
      <div className="code-block-head">
        <span className="filename">{filename}</span>
        <button className="icon-btn" title={title} onClick={onCopy} type="button">
          <Icon.Copy />
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ModuleCard({
  module: m,
  index,
  onTear,
}: {
  module: Module;
  index: number;
  onTear?: (m: Module) => void;
}) {
  const t = useDict();
  const [torn, setTorn] = useState(false);
  const [tearing, setTearing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const num = String(index + 1).padStart(2, "0");
  const snippetFile = m.source_files[0] || "snippet.txt";

  const handleTear = async () => {
    if (tearing) return;
    setTearing(true);
    const md = moduleToMarkdown(m);
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopied(true);
      onTear?.(m);
    }
    setTimeout(() => {
      setTearing(false);
      if (ok) setTorn(true);
    }, 500);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCodeCopy = async () => {
    const ok = await copyToClipboard(m.code_snippet || "");
    if (ok) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    }
  };

  return (
    <article className={"module-card" + (tearing ? " tearing" : "")}>
      <div className="card-head">
        <div>
          <div className="card-recipe-no">
            {t.card.no}<span>{num}</span>
          </div>
          <h3 className="card-title">{m.title}</h3>
        </div>
        {torn && <div className="torn-stamp">{t.card.tornStamp}</div>}
      </div>

      {m.source_files.length > 0 && (
        <div className="card-files">
          {m.source_files.map((f) => {
            const idx = f.indexOf(":");
            const looksLikeRepoPrefix =
              idx > 0 && /^[\w.-]+\/[\w.-]+$/.test(f.slice(0, idx));
            const repoPrefix = looksLikeRepoPrefix ? f.slice(0, idx) : null;
            const path = looksLikeRepoPrefix ? f.slice(idx + 1) : f;
            return (
              <span key={f} className="chip chip-file">
                <Icon.Folder />
                {repoPrefix && (
                  <span style={{ color: "var(--fg-4)" }}>{repoPrefix}:</span>
                )}{" "}
                {path}
              </span>
            );
          })}
        </div>
      )}

      <div className="card-body">
        <div className="card-section">
          <div className="section-label">
            <span className="dot" /> {t.card.isWhat}
          </div>
          <div className="section-body">
            <Md>{m.what_it_is}</Md>
          </div>
        </div>
        <div className="card-section">
          <div className="section-label">
            <span className="dot" /> {t.card.whyUseful}
          </div>
          <div className="section-body">
            <Md>{m.why_useful_for_you}</Md>
          </div>
        </div>
        <div className="card-section">
          <div className="section-label">
            <span className="dot" /> {t.card.howToSteal}
          </div>
          <div className="section-body">
            <Md>{m.how_to_steal}</Md>
          </div>
        </div>
      </div>

      {m.code_snippet && (
        <CodeBlock
          code={m.code_snippet}
          filename={snippetFile}
          onCopy={handleCodeCopy}
          title={t.card.copyCode}
        />
      )}

      <div className="card-foot">
        <div className="card-foot-hint">
          {codeCopied ? t.card.codeCopied : t.card.hint}
        </div>
        <button
          className={"tear-btn" + (copied ? " copied" : "")}
          onClick={handleTear}
          disabled={tearing}
          type="button"
        >
          <Icon.Scissors />
          {copied ? t.card.torn : t.card.tear}
        </button>
      </div>
    </article>
  );
}
