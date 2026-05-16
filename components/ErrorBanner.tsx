"use client";

import { Icon } from "./Icon";
import { useDict } from "@/lib/i18n";

export function ErrorBanner({
  msg,
  onRetry,
  onDismiss,
}: {
  msg: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const t = useDict();
  return (
    <div className="error-banner">
      <span className="err-icon">!</span>
      <div style={{ flex: 1 }}>
        <h5>{t.error.bannerTitle}</h5>
        <p>{msg}</p>
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
