"use client";

import { Icon } from "./Icon";

export function ErrorBanner({
  msg,
  onRetry,
  onDismiss,
}: {
  msg: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="error-banner">
      <span className="err-icon">!</span>
      <div style={{ flex: 1 }}>
        <h5>拆解失败</h5>
        <p>{msg}</p>
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-danger" onClick={onRetry} type="button">
          <Icon.Refresh /> 重试
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
