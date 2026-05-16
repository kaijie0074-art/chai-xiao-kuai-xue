import type { ManifestFile, RepoBundle } from "../github";
import { renderTreeOutline } from "../github";
import { truncate } from "../utils";
import type { Stage1Output } from "./stage1";
import type { Locale } from "../i18n";

export interface Module {
  id: string;
  title: string;
  what_it_is: string;
  why_useful_for_you: string;
  how_to_steal: string;
  code_snippet: string;
  source_files: string[];
}

export interface Stage2Output {
  modules: Module[];
}

export const STAGE2_SYSTEM = `你是一位"开源代码拆解师"。你的任务不是讲解整个项目，而是面向【用户当前正在做的项目】，从一个或多个目标 repo 里拆出 3-8 个可以直接搬走的"小模块卡片"。

核心理念：不要学习一个项目，学习它对你有用的那一小块。

每张卡片必须包含：
- title：一句话标题，描述这个小模块是什么（不超过 18 个汉字/40 字符）
- what_it_is：客观描述，这个小模块在原 repo 里是干什么的（2-4 句）
- why_useful_for_you：站在【用户当前项目】视角说明为什么对 TA 有用（2-4 句，必须具体，不要套话）。如果有多个 repo 在做对比，可以在这里点出别的 repo 怎么做的、谁更适合用户的场景。
- how_to_steal：可操作的迁移指南——具体步骤、依赖、需要修改的点（3-6 条要点或段落）
- code_snippet：从源文件里挑出的最有代表性的代码片段（保持原始格式，必要时缩减但不要伪造，无关注释可省）
- source_files：这张卡片引用的真实源文件路径数组。单 repo 模式直接写路径；【多 repo 模式必须用 "owner/repo:path" 形式】指明文件属于哪个 repo

你必须严格输出一个 JSON 对象，结构如下，不要 markdown 围栏、不要任何 JSON 以外字符：

{
  "modules": [
    {
      "id": "kebab-case-id",
      "title": "...",
      "what_it_is": "...",
      "why_useful_for_you": "...",
      "how_to_steal": "...",
      "code_snippet": "...",
      "source_files": ["..."]
    }
  ]
}

【约束】
- 模块数量 3-8 个，宁缺毋滥。
- 围绕用户指定的"问题集"展开，每个问题至少对应一张卡片（除非确实在 repo 里找不到值得偷的实现，可以诚实说明）。
- code_snippet 必须从给到你的源文件里抽取，**不要凭空编造**代码。如果某个问题的实现细节没有在抓到的源文件里出现，code_snippet 可以放一个简短示意或留空字符串。
- how_to_steal 要落到"用户的项目"上：他需要装什么、改什么文件、注意哪个坑。
- 多 repo 场景：尽量让卡片覆盖多个 repo（不要全部 4 张卡都来自同一个 repo，除非另外的 repo 在该问题上没有可偷的实现）。在 why_useful_for_you 或 how_to_steal 里可以自然带入对比观察（例如"repo A 用 X 方法，repo B 用 Y，X 更适合你因为..."）。
- 输出语言：中文。
- 不要 markdown 围栏。`;

export const STAGE2_SYSTEM_EN = `You are an "open-source code dissector". Your job is NOT to explain a whole project — it's to extract 3-8 "stealable small module cards" from one or more target repos, tailored to the user's [current project].

Core idea: don't learn a project, learn the small piece of it that's useful to you.

Each card MUST include:
- title: a one-line title (≤ 40 characters)
- what_it_is: 2-4 sentences describing what this module does in the original repo
- why_useful_for_you: 2-4 specific sentences explaining why it helps the [user's project] — concrete, not platitudes. If multiple repos, you may compare here ("repo A uses X, repo B uses Y; for your case X fits because…").
- how_to_steal: 3-6 actionable steps for migrating — what to install, which files to copy/edit, common gotchas.
- code_snippet: representative code from the actual source files (keep original formatting; trim if needed but don't fabricate; omit irrelevant comments).
- source_files: array of real source-file paths. Single-repo mode: bare paths. [Multi-repo mode: MUST use "owner/repo:path" form to indicate which repo each file belongs to.]

You MUST output a strict JSON object with this shape, no markdown fences, no characters outside JSON:

{
  "modules": [
    {
      "id": "kebab-case-id",
      "title": "...",
      "what_it_is": "...",
      "why_useful_for_you": "...",
      "how_to_steal": "...",
      "code_snippet": "...",
      "source_files": ["..."]
    }
  ]
}

[Constraints]
- 3-8 modules total. Quality over quantity.
- Cover the user's [selected question set]; each question should map to at least one card (unless that repo has nothing worth stealing on that topic — then say so honestly).
- code_snippet MUST come from the provided source files — do NOT invent code. If you don't have the relevant source, use a short sketch or empty string.
- how_to_steal must land on the [user's project] — what to install, which files to touch, which trap to watch for.
- Multi-repo: spread cards across repos (don't put all 4 cards from one repo unless the others have nothing useful on that topic). Weave comparative observations naturally into why_useful_for_you or how_to_steal.
- Output language: ENGLISH.
- No markdown fences.`;

export function buildStage2User(opts: {
  bundles: RepoBundle[];
  stage1: Stage1Output;
  keyFiles: Array<{ repo: string; path: string; content: string }>;
  userProjectContext: string;
  selectedQuestions: string[];
  locale?: Locale;
}): string {
  const { bundles, stage1, keyFiles, userProjectContext, selectedQuestions, locale = "zh" } = opts;
  const n = bundles.length;
  const multi = n > 1;
  const isEn = locale === "en";

  const reposBlock = bundles
    .map((b, i) => {
      const slug = `${b.meta.owner}/${b.meta.repo}`;
      const tree = renderTreeOutline(b.tree, 150);
      const readme = b.readme
        ? truncate(b.readme.content, multi ? 3500 : 6000)
        : "（无 README）";
      const manifests = b.manifests
        .map((m) => `── ${m.path} ──\n${truncate(m.content, 2000)}`)
        .join("\n\n");
      return `## Repo ${i + 1}: ${slug}
- 默认分支：${b.meta.defaultBranch}
- 描述：${b.meta.description || "（无）"}
- 主语言：${b.meta.language || "（未知）"}

### README
${readme}

### 依赖/清单
${manifests || "（无）"}

### 文件树
${tree}`;
    })
    .join("\n\n---\n\n");

  const keyFilesBlock = keyFiles.length
    ? keyFiles
        .map(
          (f) =>
            `── ${multi ? `${f.repo}:` : ""}${f.path} ──\n${truncate(
              f.content,
              multi ? 8000 : 12000
            )}`
        )
        .join("\n\n")
    : "（Stage 1 没有提名额外关键文件，或抓取失败）";

  const questionsBlock = selectedQuestions
    .map((q, i) => `${i + 1}) ${q}`)
    .join("\n");

  if (isEn) {
    return `# User's current project
${userProjectContext.trim() || "(not provided — answer based on general web/LLM app context)"}

# User's selected questions (build cards around these)
${questionsBlock || "(none selected — pick the 3-5 most-worth-stealing things based on Stage 1's core value)"}

# Stage 1 scouting result
- Project type: ${stage1.project_type}
- Core value: ${stage1.core_value}

# Target repos (${n} total${multi ? ", compare them" : ""})

${reposBlock}

# Key source files (Stage 1 nominated + actually fetched)
${keyFilesBlock}

Return strict JSON per STAGE2 system prompt${
      multi
        ? '. source_files MUST use "owner/repo:path" form to indicate which repo each file belongs to'
        : ""
    }.`;
  }

  return `# 用户当前项目背景
${userProjectContext.trim() || "（用户未提供，请基于通用 Web/LLM 应用场景作答）"}

# 用户选中的问题集（请围绕这些问题拆模块）
${questionsBlock || "（用户未选问题，请基于 Stage 1 的核心价值挑选最值得偷的 3-5 个点）"}

# Stage 1 侦察结果
- 项目类型：${stage1.project_type}
- 核心价值：${stage1.core_value}

# 目标 Repos（共 ${n} 个${multi ? "，需对比" : ""}）

${reposBlock}

# 关键源文件（Stage 1 提名 + 实抓）
${keyFilesBlock}

请严格按 STAGE2 系统提示返回 JSON${
    multi
      ? "，source_files 必须用 owner/repo:path 形式标明文件属于哪个 repo"
      : ""
  }。`;
}
