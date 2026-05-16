import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a GitHub repo URL. Returns owner/repo or null.
 * Accepts forms like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/main/...
 *   github.com/owner/repo
 *   owner/repo
 */
export function parseGitHubUrl(
  input: string
): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // bare owner/repo
  const bare = trimmed.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  if (bare) {
    return { owner: bare[1], repo: bare[2] };
  }

  const m = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/i
  );
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

/**
 * Robust-ish JSON parser for LLM output that may wrap JSON in fences or
 * include trailing text.
 */
export function parseLLMJson<T = unknown>(text: string): T {
  // 1. direct
  try {
    return JSON.parse(text) as T;
  } catch {}

  // 2. fenced ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1]) as T;
    } catch {}
    try {
      return JSON.parse(stripTrailingCommas(fence[1])) as T;
    } catch {}
  }

  // 3. first { to last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {}
    try {
      return JSON.parse(stripTrailingCommas(slice)) as T;
    } catch {}
  }

  throw new Error("无法从 LLM 输出中解析出有效 JSON");
}

function stripTrailingCommas(s: string) {
  return s.replace(/,(\s*[}\]])/g, "$1");
}

export function downloadAsFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n) + `\n\n... [已截断 ${s.length - n} 字符]`;
}

/**
 * 从一段自由文本中提取所有 github.com/owner/repo 形式的链接。
 * 用于「粘 ChatGPT 回答 / 推文 / 文章片段 → 自动识别 repo」场景。
 *
 * - 自动跳过 settings / notifications / orgs 等 meta 路径
 * - 去掉末尾的 ".git" 和常见标点
 * - 同一 repo 只返回一次
 */
const NON_REPO_OWNER_PATHS = new Set([
  "settings",
  "notifications",
  "pulls",
  "issues",
  "marketplace",
  "explore",
  "search",
  "topics",
  "trending",
  "about",
  "features",
  "pricing",
  "sponsors",
  "security",
  "dashboard",
  "home",
  "login",
  "signup",
  "codespaces",
  "organizations",
  "orgs",
  "contact",
  "customer-stories",
  "customers",
  "enterprise",
  "education",
  "blog",
  "support",
  "careers",
  "site",
  "events",
  "git-guides",
  "advisories",
  "stars",
]);

export function extractGitHubRepos(
  text: string
): Array<{ owner: string; repo: string }> {
  if (!text) return [];
  const seen = new Set<string>();
  const out: Array<{ owner: string; repo: string }> = [];
  const regex =
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const owner = m[1];
    let repo = m[2].replace(/\.git$/i, "");
    if (!owner || !repo) continue;
    if (NON_REPO_OWNER_PATHS.has(owner.toLowerCase())) continue;
    // Strip trailing punctuation that snuck into the match
    repo = repo.replace(/[.,;:!?)\]}'"]+$/, "");
    if (!repo) continue;
    // 排除带前导点的非法 repo 名（"./" 这种）
    if (repo.startsWith(".") || owner.startsWith(".")) continue;
    const slug = `${owner}/${repo}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ owner, repo });
  }
  return out;
}
