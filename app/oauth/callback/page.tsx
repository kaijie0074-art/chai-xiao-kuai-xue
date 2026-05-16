"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exchangeOpenRouterCode } from "@/lib/openrouter-oauth";
import { useSettings } from "@/lib/store";
import { Icon } from "@/components/Icon";

type Status = "exchanging" | "ok" | "error";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const setKey = useSettings((s) => s.setKey);
  const setProvider = useSettings((s) => s.setProvider);
  const [status, setStatus] = useState<Status>("exchanging");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setStatus("error");
      setError("回调 URL 中没有 code 参数。可能你直接打开了这个页面，或 OpenRouter 拒绝了授权。");
      return;
    }

    (async () => {
      try {
        const key = await exchangeOpenRouterCode(code);
        setKey("openrouter", key);
        setProvider("openrouter");
        setStatus("ok");
        // brief pause so user sees the success state, then bounce
        setTimeout(() => router.replace("/settings?signed_in=openrouter"), 800);
      } catch (e) {
        setStatus("error");
        setError((e as Error).message);
      }
    })();
  }, [router, setKey, setProvider]);

  return (
    <div className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginTop: 64, textAlign: "center" }}>
        {status === "exchanging" && (
          <>
            <div
              className="spinner"
              style={{
                width: 28,
                height: 28,
                borderColor: "var(--accent)",
                borderTopColor: "transparent",
                margin: "0 auto 16px",
              }}
            />
            <h2 className="section-title" style={{ fontSize: 22 }}>
              正在完成 OpenRouter 登录…
            </h2>
            <p style={{ color: "var(--fg-3)", fontSize: 13 }}>
              正在用授权码换取 API key——别关闭这个标签页。
            </p>
          </>
        )}

        {status === "ok" && (
          <>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 99,
                background: "var(--status-ok-bg)",
                color: "var(--status-ok)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <Icon.Check />
            </div>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              登录成功
            </h2>
            <p style={{ color: "var(--fg-3)", fontSize: 13 }}>
              即将返回设置页…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-banner" style={{ textAlign: "left" }}>
              <span className="err-icon">!</span>
              <div style={{ flex: 1 }}>
                <h5>OpenRouter 登录失败</h5>
                <p>{error}</p>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
              <Link href="/settings" className="btn btn-secondary">
                返回设置
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
