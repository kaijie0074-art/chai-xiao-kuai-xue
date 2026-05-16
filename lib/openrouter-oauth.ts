/**
 * OpenRouter OAuth PKCE flow — purely browser-side.
 *
 *   1. startOpenRouterAuth() — generates PKCE pair, stashes the verifier in
 *      sessionStorage, then redirects to https://openrouter.ai/auth.
 *   2. OpenRouter authorizes the user and redirects back to /oauth/callback
 *      with ?code=...
 *   3. exchangeOpenRouterCode(code) — POSTs { code, code_verifier } to
 *      https://openrouter.ai/api/v1/auth/keys and returns a scoped sk-or-v1-key.
 *
 * No server involved. The verifier lives only in sessionStorage during the
 * round-trip. The returned key is persisted via the Zustand settings store.
 */

const VERIFIER_KEY = "openrouter_oauth_verifier";
const AUTH_URL = "https://openrouter.ai/auth";
const EXCHANGE_URL = "https://openrouter.ai/api/v1/auth/keys";

function base64url(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(text: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return new Uint8Array(buf);
}

export async function startOpenRouterAuth(): Promise<void> {
  if (typeof window === "undefined") return;

  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);
  const challenge = base64url(await sha256(verifier));

  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const callbackUrl = `${window.location.origin}/oauth/callback`;
  const url = new URL(AUTH_URL);
  url.searchParams.set("callback_url", callbackUrl);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.href = url.toString();
}

export async function exchangeOpenRouterCode(code: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("exchangeOpenRouterCode 必须在浏览器中调用");
  }
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) {
    throw new Error(
      "找不到 OAuth code_verifier。可能你换了浏览器/标签页，或 session 已过期，请重新发起登录。"
    );
  }

  const res = await fetch(EXCHANGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      code_challenge_method: "S256",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter 授权换取失败（HTTP ${res.status}）${text ? "：" + text.slice(0, 200) : ""}`
    );
  }

  const data = (await res.json()) as { key?: string; user_id?: string };
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!data.key) {
    throw new Error("OpenRouter 返回结果中没有 key 字段");
  }
  return data.key;
}
