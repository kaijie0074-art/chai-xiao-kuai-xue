"use client";

import { Icon } from "./Icon";
import { useDict } from "@/lib/i18n";

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
  const resolved = resolveErrorMessage(t, msg, kind);
  return (
    <div className="error-banner">
      <span className="err-icon">!</span>
      <div style={{ flex: 1 }}>
        <h5>{title ?? t.error.bannerTitle}</h5>
        <p>{resolved}</p>
      </div>
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
  );
}
