"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useDict, useLocale } from "@/lib/i18n";

/**
 * Resolve user-facing error text from kind + locale, falling back to raw msg.
 * 优先用 dict 翻译 kind；kind 不在 dict 里就显示原始 msg（拿到啥显示啥）。
 */
function resolveErrorMessage(
  dict: ReturnType<typeof useDict>,
  msg: string,
  kind: string | null | undefined
): string {
  if (kind && kind in dict.errorByKind) {
    const translated = (dict.errorByKind as Record<string, string>)[kind];
    return translated;
  }
  return msg;
}

/**
 * 根据 error kind 给出具体可点的下一步建议。
 * 这是错误信息从「告诉你哪里坏了」升级到「告诉你怎么修」的关键。
 */
function ErrorActions({
  kind,
  locale,
}: {
  kind: string | null | undefined;
  locale: "zh" | "en";
}) {
  if (!kind) return null;
  const settingsHref = locale === "en" ? "/en/settings" : "/settings";
  const isEn = locale === "en";

  // GitHub 匿名限额：核心建议是填 token
  if (kind === "rate_limit_github_anon") {
    return (
      <Link
        href={settingsHref}
        className="btn btn-sm btn-secondary"
        style={{ whiteSpace: "nowrap" }}
      >
        {isEn ? "Add GitHub Token →" : "去填 GitHub Token →"}
      </Link>
    );
  }

  // GitHub 带 token 限额：建议换 token 或等
  if (kind === "rate_limit_github_token") {
    return (
      <Link
        href={settingsHref}
        className="btn btn-sm btn-ghost"
        style={{ whiteSpace: "nowrap" }}
      >
        {isEn ? "Manage token →" : "管理 Token →"}
      </Link>
    );
  }

  // LLM 401 / auth：去设置
  if (kind === "auth") {
    return (
      <Link
        href={settingsHref}
        className="btn btn-sm btn-secondary"
        style={{ whiteSpace: "nowrap" }}
      >
        {isEn ? "Open Settings →" : "去设置 →"}
      </Link>
    );
  }

  // LLM 429
  if (kind === "rate_limit") {
    return (
      <Link
        href={settingsHref}
        className="btn btn-sm btn-ghost"
        style={{ whiteSpace: "nowrap" }}
      >
        {isEn ? "Switch model →" : "换个 model →"}
      </Link>
    );
  }

  // 400 bad_request：参数不兼容，建议换 model / provider
  if (kind === "bad_request") {
    return (
      <Link
        href={settingsHref}
        className="btn btn-sm btn-ghost"
        style={{ whiteSpace: "nowrap" }}
      >
        {isEn ? "Try different model →" : "试换 model / provider →"}
      </Link>
    );
  }

  return null;
}

export function ErrorBanner({
  msg,
  kind,
  onRetry,
  onDismiss,
  title,
}: {
  msg: string;
  kind?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
}) {
  const t = useDict();
  const locale = useLocale();
  const resolved = resolveErrorMessage(t, msg, kind);
  return (
    <div className="error-banner" style={{ flexWrap: "wrap" }}>
      <span className="err-icon">!</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h5>{title ?? t.error.bannerTitle}</h5>
        <p>{resolved}</p>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <ErrorActions kind={kind} locale={locale} />
        {onRetry && (
          <button className="btn btn-sm btn-danger" onClick={onRetry} type="button">
            <Icon.Refresh /> {t.error.retry}
          </button>
        )}
        {onDismiss && (
          <button className="icon-btn" onClick={onDismiss} type="button">
            <Icon.Close />
          </button>
        )}
      </div>
    </div>
  );
}
