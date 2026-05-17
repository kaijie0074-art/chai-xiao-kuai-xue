/**
 * GitHub API client.
 *
 * - 匿名（无 token）：60 请求/小时/IP
 * - 带 PAT（即使无任何权限的空白 token）：5000 请求/小时
 *
 * Token 从 useSettings store 里读取，store 用户可在设置页填写。
 *
 * Caches per-repo bundles in sessionStorage for 1 hour.
 */

import { useSettings } from "./store";

function getGitHubToken(): string | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const t = useSettings.getState().githubToken;
    return t && t.trim() ? t.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Module-level request counter for the "0 server requests" trust badge.
 * Bumped on every github.com fetch (API + raw). Reset by active-run at start
 * of each new dissection. Module-level (not in any store) to avoid a circular
 * import between github.ts ↔ active-run.ts.
 */
let _ghFetchCount = 0;
export function resetGitHubFetchCount(): void {
  _ghFetchCount = 0;
}
export function getGitHubFetchCount(): number {
  return _ghFetchCount;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  htmlUrl: string;
  isPrivate: boolean;
}

export interface FileTreeEntry {
  path: string;
  type: "file" | "dir";
  size?: number;
}

export interface ManifestFile {
  path: string;
  content: string;
}

export interface RepoBundle {
  meta: RepoMeta;
  readme: { path: string; content: string } | null;
  tree: FileTreeEntry[]; // flat list, up to 2 levels deep
  manifests: ManifestFile[]; // package.json / requirements.txt / pyproject.toml / Cargo.toml / go.mod ...
  fetchedAt: number;
}

const CACHE_PREFIX = "repo-cache:";
const ONE_HOUR_MS = 60 * 60 * 1000;

export class GitHubError extends Error {
  status?: number;
  kind:
    | "not_found"
    | "rate_limit_github_anon"
    | "rate_limit_github_token"
    | "private"
    | "network"
    | "unknown";
  constructor(
    kind: GitHubError["kind"],
    message: string,
    status?: number
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

function cacheKey(owner: string, repo: string) {
  return `${CACHE_PREFIX}${owner}/${repo}`;
}

export function readCachedBundle(owner: string, repo: string): RepoBundle | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(owner, repo));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: RepoBundle; expiresAt: number };
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(cacheKey(owner, repo));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedBundle(bundle: RepoBundle) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      cacheKey(bundle.meta.owner, bundle.meta.repo),
      JSON.stringify({ data: bundle, expiresAt: Date.now() + ONE_HOUR_MS })
    );
  } catch {
    // quota exceeded — fine, we just skip caching
  }
}

async function ghFetch(url: string, init?: RequestInit): Promise<Response> {
  _ghFetchCount++;
  const token = getGitHubToken();
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch (e) {
    throw new GitHubError(
      "network",
      `网络错误：无法访问 GitHub API（${(e as Error).message}）`
    );
  }
  return res;
}

function handleStatus(res: Response, owner: string, repo: string): never | void {
  if (res.ok) return;
  if (res.status === 404) {
    throw new GitHubError(
      "not_found",
      `找不到这个 repo（${owner}/${repo}），请检查链接是否正确，或它可能是私有 repo（MVP 仅支持公开 repo）`,
      404
    );
  }
  if (res.status === 403 || res.status === 429) {
    const hasToken = !!getGitHubToken();
    throw new GitHubError(
      hasToken ? "rate_limit_github_token" : "rate_limit_github_anon",
      hasToken
        ? "GitHub 调用达到限额（5000 次/小时）。等一小时重置，或换一个 token。"
        : "GitHub 匿名调用已达限额（60 次/小时/IP）。\n解决：去设置页填一个 GitHub Token（不需要任何权限），抓取限额会涨到 5000 次/小时。创建：github.com/settings/tokens",
      res.status
    );
  }
  throw new GitHubError(
    "unknown",
    `GitHub API 错误（HTTP ${res.status}）`,
    res.status
  );
}

const MANIFEST_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "composer.json",
];

async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  const res = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);
  handleStatus(res, owner, repo);
  const j = await res.json();
  if (j.private) {
    throw new GitHubError("private", "这是一个私有 repo，MVP 仅支持公开 repo。");
  }
  return {
    owner,
    repo,
    defaultBranch: j.default_branch || "main",
    description: j.description || null,
    stars: j.stargazers_count || 0,
    language: j.language || null,
    topics: j.topics || [],
    htmlUrl: j.html_url,
    isPrivate: !!j.private,
  };
}

async function fetchReadme(
  owner: string,
  repo: string
): Promise<{ path: string; content: string } | null> {
  const res = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`
  );
  if (res.status === 404) return null;
  handleStatus(res, owner, repo);
  const j = await res.json();
  let content = "";
  if (j.encoding === "base64" && typeof j.content === "string") {
    try {
      content = decodeBase64Utf8(j.content);
    } catch {
      content = "";
    }
  }
  return { path: j.path || "README.md", content };
}

function decodeBase64Utf8(b64: string): string {
  const clean = b64.replace(/\s/g, "");
  if (typeof atob === "function") {
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8").decode(bytes);
    }
    return bin;
  }
  // very unlikely browser fallback
  return Buffer.from(clean, "base64").toString("utf-8");
}

async function fetchContents(
  owner: string,
  repo: string,
  path = ""
): Promise<Array<{ name: string; path: string; type: string; size?: number }>> {
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;
  const res = await ghFetch(url);
  if (res.status === 404) return [];
  handleStatus(res, owner, repo);
  const j = await res.json();
  if (!Array.isArray(j)) return [];
  return j;
}

async function fetchFileText(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  maxBytes = 60000
): Promise<string | null> {
  // Use raw.githubusercontent for less rate-limit pressure on individual files.
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  _ghFetchCount++;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const text = await res.text();
  if (text.length > maxBytes) {
    return text.slice(0, maxBytes) + `\n\n... [文件已截断，原始大小约 ${text.length} 字节]`;
  }
  return text;
}

/**
 * Build a 2-level deep flat tree.
 */
async function buildShallowTree(
  owner: string,
  repo: string
): Promise<FileTreeEntry[]> {
  const root = await fetchContents(owner, repo, "");
  const entries: FileTreeEntry[] = [];
  for (const item of root) {
    entries.push({
      path: item.path,
      type: item.type === "dir" ? "dir" : "file",
      size: item.size,
    });
  }
  // depth 2 — expand a limited number of directories to avoid burning the 60/h budget
  const dirs = entries.filter((e) => e.type === "dir").slice(0, 8);
  for (const d of dirs) {
    try {
      const sub = await fetchContents(owner, repo, d.path);
      for (const item of sub) {
        entries.push({
          path: item.path,
          type: item.type === "dir" ? "dir" : "file",
          size: item.size,
        });
      }
    } catch (e) {
      if (
        e instanceof GitHubError &&
        (e.kind === "rate_limit_github_anon" || e.kind === "rate_limit_github_token")
      ) {
        throw e;
      }
      // soft-fail per-dir
    }
  }
  return entries;
}

/** 抓取阶段的子步骤 ID —— UI 层把它映射成本地化文案 */
export type FetchStep = "cache" | "meta" | "content" | "manifests" | "done";

export async function fetchRepoBundle(
  owner: string,
  repo: string,
  opts?: { useCache?: boolean; onProgress?: (step: FetchStep) => void }
): Promise<RepoBundle> {
  const useCache = opts?.useCache !== false;
  const ping = (s: FetchStep) => opts?.onProgress?.(s);
  if (useCache) {
    const cached = readCachedBundle(owner, repo);
    if (cached) {
      ping("cache");
      return cached;
    }
  }

  ping("meta");
  const meta = await fetchRepoMeta(owner, repo);
  ping("content");
  const [readme, tree] = await Promise.all([
    fetchReadme(owner, repo),
    buildShallowTree(owner, repo),
  ]);

  // Manifests: only fetch the ones that actually exist at root
  const rootFiles = new Set(
    tree.filter((e) => e.type === "file" && !e.path.includes("/")).map((e) => e.path)
  );
  const manifests: ManifestFile[] = [];
  if ([...rootFiles].some((p) => MANIFEST_FILES.includes(p))) {
    ping("manifests");
  }
  for (const m of MANIFEST_FILES) {
    if (!rootFiles.has(m)) continue;
    try {
      const text = await fetchFileText(owner, repo, m, meta.defaultBranch, 30000);
      if (text) manifests.push({ path: m, content: text });
    } catch {
      // soft-fail
    }
  }

  const bundle: RepoBundle = {
    meta,
    readme,
    tree,
    manifests,
    fetchedAt: Date.now(),
  };
  writeCachedBundle(bundle);
  ping("done");
  return bundle;
}

/**
 * Stage-2 dynamic fetch of specific files identified by Stage 1.
 * Limits both count and size to keep token budgets sane.
 */
export async function fetchKeyFiles(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
  opts?: { maxFiles?: number; maxBytesPerFile?: number }
): Promise<ManifestFile[]> {
  const maxFiles = opts?.maxFiles ?? 4;
  const maxBytes = opts?.maxBytesPerFile ?? 40000;
  const chosen = paths.slice(0, maxFiles);
  const out: ManifestFile[] = [];
  for (const p of chosen) {
    const t = await fetchFileText(owner, repo, p, branch, maxBytes);
    if (t !== null) out.push({ path: p, content: t });
  }
  return out;
}

/**
 * Render the file tree as a compact text outline for LLM consumption.
 */
export function renderTreeOutline(tree: FileTreeEntry[], maxLines = 200): string {
  const sorted = [...tree].sort((a, b) => a.path.localeCompare(b.path));
  const lines = sorted.map((e) => `${e.type === "dir" ? "[D]" : "   "} ${e.path}`);
  if (lines.length > maxLines) {
    return (
      lines.slice(0, maxLines).join("\n") +
      `\n... 还有 ${lines.length - maxLines} 个条目未列出`
    );
  }
  return lines.join("\n");
}
