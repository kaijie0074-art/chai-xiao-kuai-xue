"use client";

import {
  fetchKeyFiles,
  fetchRepoBundle,
  type RepoBundle,
} from "./github";
import {
  buildStage1User,
  STAGE1_SYSTEM,
  type Stage1Output,
} from "./prompts/stage1";
import {
  buildStage2User,
  STAGE2_SYSTEM,
  type Module,
  type Stage2Output,
} from "./prompts/stage2";
import {
  buildSynthesizeUser,
  SYNTHESIZE_SYSTEM,
} from "./prompts/synthesize";
import {
  classifyLLMError,
  createProvider,
  type LLMProvider,
} from "./providers";
import type { ProviderName } from "./store";
import { parseLLMJson } from "./utils";

export type AnalyzePhase =
  | "idle"
  | "fetching"
  | "stage1"
  | "fetching_key_files"
  | "stage2"
  | "done"
  | "error";

export interface AnalyzeUpdate {
  phase: AnalyzePhase;
  message?: string;
  partialText?: string;
  bundles?: RepoBundle[];
  stage1?: Stage1Output;
  stage2?: Stage2Output;
  error?: string;
  errorKind?: string;
}

export interface AnalyzeRequest {
  /** One or more repos to dissect / compare */
  repos: Array<{ owner: string; repo: string }>;
  userProjectContext: string;
  selectedQuestions: string[];
  provider: ProviderName;
  apiKey: string;
  model: string;
  /** baseURL is only used for `provider === "custom"` (中转站) */
  baseURL?: string;
  signal?: AbortSignal;
}

async function consumeStream(
  iter: AsyncIterable<string>,
  onDelta?: (full: string) => void
): Promise<string> {
  let full = "";
  for await (const chunk of iter) {
    full += chunk;
    if (onDelta) onDelta(full);
  }
  return full;
}

/**
 * Parse a Stage 1 "files_to_read_next" entry. In multi-repo mode the LLM
 * is told to use "owner/repo:path"; in single-repo mode we treat the entry
 * as a bare path under the only repo.
 */
function parseRepoPath(
  entry: string,
  fallbackRepo: { owner: string; repo: string }
): { owner: string; repo: string; path: string } {
  const m = entry.match(/^([\w.-]+)\/([\w.-]+):(.+)$/);
  if (m) return { owner: m[1], repo: m[2], path: m[3] };
  return { owner: fallbackRepo.owner, repo: fallbackRepo.repo, path: entry };
}

export async function runAnalyze(
  req: AnalyzeRequest,
  onUpdate: (u: AnalyzeUpdate) => void
): Promise<void> {
  const {
    repos,
    userProjectContext,
    selectedQuestions,
    provider,
    apiKey,
    model,
    baseURL,
    signal,
  } = req;

  if (!repos.length) {
    onUpdate({ phase: "error", error: "至少需要一个 GitHub repo", errorKind: "bad_request" });
    return;
  }

  let llm: LLMProvider;
  try {
    llm = createProvider(provider, { apiKey, model, baseURL });
  } catch (e) {
    onUpdate({
      phase: "error",
      error: (e as Error).message,
      errorKind: "auth",
    });
    return;
  }

  // ---------- Fetch all repo bundles in parallel ----------
  let bundles: RepoBundle[];
  try {
    onUpdate({
      phase: "fetching",
      message:
        repos.length === 1
          ? `正在抓取 ${repos[0].owner}/${repos[0].repo} ...`
          : `正在并行抓取 ${repos.length} 个 repo ...`,
    });
    bundles = await Promise.all(repos.map((r) => fetchRepoBundle(r.owner, r.repo)));
    onUpdate({
      phase: "fetching",
      message: `抓取完成，进入侦察阶段（共 ${bundles.length} 个 repo）`,
      bundles,
    });
  } catch (e) {
    const err = e as { kind?: string; message?: string };
    onUpdate({
      phase: "error",
      error: err?.message || String(e),
      errorKind: err?.kind || "github",
    });
    return;
  }

  // ---------- Stage 1 ----------
  let stage1: Stage1Output;
  try {
    onUpdate({ phase: "stage1", message: "Stage 1：LLM 正在侦察项目结构 ..." });
    const user = buildStage1User({ bundles, userProjectContext });
    const text = await consumeStream(
      llm.stream({
        system: STAGE1_SYSTEM,
        messages: [{ role: "user", content: user }],
        jsonMode: true,
        signal,
        maxTokens: 2000,
      }),
      (partial) =>
        onUpdate({
          phase: "stage1",
          partialText: partial,
        })
    );
    stage1 = parseLLMJson<Stage1Output>(text);
    if (!Array.isArray(stage1.files_to_read_next))
      stage1.files_to_read_next = [];
    if (!Array.isArray(stage1.suggested_questions_if_dynamic_mode))
      stage1.suggested_questions_if_dynamic_mode = [];
    onUpdate({ phase: "stage1", message: "Stage 1 完成", stage1 });
  } catch (e) {
    const err = classifyLLMError(e);
    onUpdate({
      phase: "error",
      error:
        err.kind === "unknown"
          ? `Stage 1 输出无法解析为 JSON：${err.message}`
          : err.message,
      errorKind: err.kind,
    });
    return;
  }

  // ---------- Fetch key files (grouped by repo) ----------
  const keyFiles: Array<{ repo: string; path: string; content: string }> = [];
  try {
    onUpdate({
      phase: "fetching_key_files",
      message: `抓取 Stage 1 提名的关键文件：${stage1.files_to_read_next.join(", ")}`,
    });

    const grouped = new Map<string, { owner: string; repo: string; paths: string[] }>();
    const fallback = repos[0]; // for bare paths in single-repo mode
    for (const entry of stage1.files_to_read_next) {
      const parsed = parseRepoPath(entry, fallback);
      const slug = `${parsed.owner}/${parsed.repo}`;
      if (!grouped.has(slug)) {
        grouped.set(slug, { owner: parsed.owner, repo: parsed.repo, paths: [] });
      }
      grouped.get(slug)!.paths.push(parsed.path);
    }

    const bundlesBySlug = new Map(
      bundles.map((b) => [`${b.meta.owner}/${b.meta.repo}`, b])
    );
    // Cap total key files at 6 across all repos to keep token budget sane
    const perRepoCap = Math.max(1, Math.min(4, Math.ceil(6 / grouped.size)));

    for (const [slug, g] of grouped) {
      const bundle = bundlesBySlug.get(slug);
      if (!bundle) continue;
      try {
        const files = await fetchKeyFiles(
          g.owner,
          g.repo,
          bundle.meta.defaultBranch,
          g.paths,
          { maxFiles: perRepoCap, maxBytesPerFile: 40000 }
        );
        for (const f of files) {
          keyFiles.push({ repo: slug, path: f.path, content: f.content });
        }
      } catch {
        // soft-fail per repo
      }
    }
  } catch {
    // soft-fail; we can still run stage 2 with what we have
  }

  // ---------- Stage 2 ----------
  try {
    onUpdate({ phase: "stage2", message: "Stage 2：LLM 正在拆解模块 ..." });
    const user = buildStage2User({
      bundles,
      stage1,
      keyFiles,
      userProjectContext,
      selectedQuestions,
    });
    const text = await consumeStream(
      llm.stream({
        system: STAGE2_SYSTEM,
        messages: [{ role: "user", content: user }],
        jsonMode: true,
        signal,
        maxTokens: 4096,
      }),
      (partial) => onUpdate({ phase: "stage2", partialText: partial })
    );
    const parsed = parseLLMJson<Stage2Output>(text);
    if (!parsed || !Array.isArray(parsed.modules)) {
      throw new Error("Stage 2 输出缺少 modules 数组");
    }
    parsed.modules = parsed.modules.map((m, i) => sanitizeModule(m, i));
    onUpdate({ phase: "done", stage2: parsed });
  } catch (e) {
    const err = classifyLLMError(e);
    onUpdate({
      phase: "error",
      error:
        err.kind === "unknown"
          ? `Stage 2 失败：${err.message}`
          : err.message,
      errorKind: err.kind,
    });
    return;
  }
}

function sanitizeModule(m: Partial<Module>, idx: number): Module {
  return {
    id: m.id || `module-${idx + 1}`,
    title: m.title || `模块 ${idx + 1}`,
    what_it_is: m.what_it_is || "",
    why_useful_for_you: m.why_useful_for_you || "",
    how_to_steal: m.how_to_steal || "",
    code_snippet: m.code_snippet || "",
    source_files: Array.isArray(m.source_files) ? m.source_files : [],
  };
}

export function modulesToMarkdown(opts: {
  repos: Array<{ owner: string; repo: string }>;
  userContext: string;
  modules: Module[];
}): string {
  const { repos, userContext, modules } = opts;
  const repoList = repos.map((r) => `${r.owner}/${r.repo}`).join(" + ");
  const head = `# ${repoList} · 拆小块导出\n\n> 用户项目背景：${userContext.trim() || "（未填写）"}\n\n共 ${modules.length} 张卡片。\n`;
  const body = modules
    .map((m, i) => {
      const sources = m.source_files.length
        ? m.source_files.map((p) => `\`${p}\``).join(", ")
        : "（无）";
      const code = m.code_snippet
        ? "```\n" + m.code_snippet + "\n```"
        : "（无代码片段）";
      return `## ${i + 1}. ${m.title}

**是什么**：${m.what_it_is}

**对你为什么有用**：${m.why_useful_for_you}

**怎么搬过来**：

${m.how_to_steal}

**代码片段**：

${code}

**来源文件**：${sources}
`;
    })
    .join("\n---\n\n");
  return head + "\n" + body;
}

/* ---------------- Stage 3: 合成 AI 提示词 ---------------- */

export type SynthesizePhase = "idle" | "running" | "done" | "error";

export interface SynthesizeRequest {
  target: string;
  repos: Array<{ owner: string; repo: string }>;
  modules: Module[];
  provider: ProviderName;
  apiKey: string;
  model: string;
  baseURL?: string;
  signal?: AbortSignal;
}

export interface SynthesizeUpdate {
  phase: SynthesizePhase;
  partialText?: string;
  result?: string;
  error?: string;
  errorKind?: string;
}

export async function runSynthesize(
  req: SynthesizeRequest,
  onUpdate: (u: SynthesizeUpdate) => void
): Promise<void> {
  if (req.modules.length === 0) {
    onUpdate({ phase: "error", error: "没有可用的模块，先跑一次拆解" });
    return;
  }

  let llm: LLMProvider;
  try {
    llm = createProvider(req.provider, {
      apiKey: req.apiKey,
      model: req.model,
      baseURL: req.baseURL,
    });
  } catch (e) {
    onUpdate({
      phase: "error",
      error: (e as Error).message,
      errorKind: "auth",
    });
    return;
  }

  try {
    onUpdate({ phase: "running" });
    const user = buildSynthesizeUser({
      target: req.target,
      modules: req.modules,
      repos: req.repos,
    });
    const text = await consumeStream(
      // jsonMode 故意不打开 —— 这一阶段我们要的是 markdown，不是 JSON
      llm.stream({
        system: SYNTHESIZE_SYSTEM,
        messages: [{ role: "user", content: user }],
        signal: req.signal,
        maxTokens: 4096,
      }),
      (partial) => onUpdate({ phase: "running", partialText: partial })
    );
    // Strip a possible outer ```markdown ... ``` fence if the model still wrapped it
    const cleaned = text
      .trim()
      .replace(/^```(?:markdown|md)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    onUpdate({ phase: "done", result: cleaned });
  } catch (e) {
    const err = classifyLLMError(e);
    onUpdate({
      phase: "error",
      error: err.message,
      errorKind: err.kind,
    });
  }
}

export function moduleToMarkdown(m: Module): string {
  const sources = m.source_files.length
    ? m.source_files.map((p) => `\`${p}\``).join(", ")
    : "（无）";
  const code = m.code_snippet
    ? "```\n" + m.code_snippet + "\n```"
    : "（无代码片段）";
  return `## ${m.title}

**是什么**：${m.what_it_is}

**对你为什么有用**：${m.why_useful_for_you}

**怎么搬过来**：

${m.how_to_steal}

**代码片段**：

${code}

**来源文件**：${sources}
`;
}
