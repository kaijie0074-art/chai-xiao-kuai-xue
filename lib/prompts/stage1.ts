import type { RepoBundle } from "../github";
import { renderTreeOutline } from "../github";
import { truncate } from "../utils";
import type { Locale } from "../i18n";

export interface Stage1Output {
  project_type: string;
  core_value: string;
  files_to_read_next: string[];
  suggested_questions_if_dynamic_mode: string[];
}

export const STAGE1_SYSTEM = `你是一位资深开源软件考古专家。你的任务是"侦察"一组 GitHub 项目（1 个或多个），告诉下一阶段的"拆解 Agent"接下来应该深读哪些文件，以及面向用户当前项目可以问哪些有价值的针对性问题。

你必须严格输出一个 JSON 对象（不要任何 markdown 围栏、不要任何解释文字），格式如下：

{
  "project_type": "如果只有一个 repo：一句话说明类型。如果有多个 repo：要么概括它们共同的类型（例如『都是前端 AI Chat 应用』），要么分别列出每个的类型。",
  "core_value": "用 2-3 句话讲清楚这组 repo（尤其是放在一起对比时）最值得偷的核心价值。",
  "files_to_read_next": ["3-6 个相对路径"],
  "suggested_questions_if_dynamic_mode": ["5-7 个针对性问题"]
}

【关于 files_to_read_next 的格式】
- 单 repo 模式：直接写路径，例如 "src/api/chat.ts"
- 多 repo 模式：必须用 "owner/repo:path" 形式标明每个文件属于哪个 repo，例如 "vercel/ai-chatbot:components/message.tsx"

【约束】
- files_to_read_next 必须是你从文件树里看到的真实路径，不要瞎编。
- 在多 repo 场景里，挑文件时优先挑那些"能让 Stage 2 做有意义对比"的文件——比如几个 repo 都涉及同一个主题（流式渲染、状态管理）的实现。
- suggested_questions_if_dynamic_mode：5-7 个问题，必须高度针对【用户当前项目】描述与【这组 repo 的对比可能性】，不要重复"固定七问"那类通用问题。
- 不要解释、不要 markdown 围栏、不要任何 JSON 以外的字符。`;

export const STAGE1_SYSTEM_EN = `You are a senior open-source archaeologist. Your job is to "scout" a set of GitHub projects (1 or more) and tell the next-stage "dissection agent" which files to read next, plus suggest targeted questions tailored to the user's current project.

You MUST output a strict JSON object (no markdown fences, no explanatory prose) with this shape:

{
  "project_type": "If only one repo: a one-sentence type description. If multiple repos: either summarize their shared type (e.g., 'all frontend AI chat apps') OR list each.",
  "core_value": "2-3 sentences on the most stealable core value of this group (especially when compared side-by-side).",
  "files_to_read_next": ["3-6 relative paths"],
  "suggested_questions_if_dynamic_mode": ["5-7 targeted questions"]
}

[Format for files_to_read_next]
- Single-repo mode: bare path, e.g., "src/api/chat.ts"
- Multi-repo mode: MUST use "owner/repo:path" form to indicate which repo each file belongs to, e.g., "vercel/ai-chatbot:components/message.tsx"

[Constraints]
- files_to_read_next must be REAL paths from the file tree — do not invent paths.
- In multi-repo, prefer files that enable "meaningful comparison" — e.g., where several repos tackle the same topic (streaming, state, etc.).
- suggested_questions_if_dynamic_mode: 5-7 questions tightly tied to the [user's current project] AND [the comparative potential of these repos]. Avoid generic stuff already covered by the "fixed seven questions".
- No explanations, no markdown fences, no characters outside the JSON.
- Output language: ENGLISH.`;

export function buildStage1User(opts: {
  bundles: RepoBundle[];
  userProjectContext: string;
  locale?: Locale;
}): string {
  const { bundles, userProjectContext, locale = "zh" } = opts;
  const n = bundles.length;
  const isEn = locale === "en";

  const reposBlock = bundles
    .map((b, i) => {
      const slug = `${b.meta.owner}/${b.meta.repo}`;
      const tree = renderTreeOutline(b.tree, 200);
      const readme = b.readme
        ? truncate(b.readme.content, n === 1 ? 12000 : 6000)
        : isEn
        ? "(no README or fetch failed)"
        : "（这个 repo 没有 README 或抓取失败）";
      const manifests = b.manifests.length
        ? b.manifests
            .map((m) => `── ${m.path} ──\n${truncate(m.content, 3000)}`)
            .join("\n\n")
        : isEn
        ? "(no common manifest files found)"
        : "（未发现常见清单文件）";

      if (isEn) {
        return `## Repo ${i + 1}: ${slug}
- Default branch: ${b.meta.defaultBranch}
- Description: ${b.meta.description || "(none)"}
- Primary language: ${b.meta.language || "(unknown)"}
- Topics: ${b.meta.topics.join(", ") || "(none)"}
- Stars: ${b.meta.stars}

### README (possibly truncated)
${readme}

### Manifests / dependencies
${manifests}

### File tree (2 levels)
${tree}`;
      }

      return `## Repo ${i + 1}: ${slug}
- 默认分支：${b.meta.defaultBranch}
- 描述：${b.meta.description || "（无）"}
- 主语言：${b.meta.language || "（未知）"}
- 主题标签：${b.meta.topics.join(", ") || "（无）"}
- Stars：${b.meta.stars}

### README（可能已截断）
${readme}

### 依赖/清单文件
${manifests}

### 文件树（前 2 层）
${tree}`;
    })
    .join("\n\n---\n\n");

  if (isEn) {
    return `# User's current project
${userProjectContext.trim() || "(not provided — give general suggestions)"}

# Repos to scout (${n} total${n > 1 ? ", comparing them" : ""})

${reposBlock}

Return strict JSON per the STAGE1 system prompt${n > 1 ? '. files_to_read_next MUST use "owner/repo:path" form to indicate which repo each file belongs to' : ""}. No markdown fences.`;
  }

  return `# 用户当前项目背景
${userProjectContext.trim() || "（用户未提供，请尽量给通用建议）"}

# 待侦察的 Repos（共 ${n} 个${n > 1 ? "，需做对比" : ""}）

${reposBlock}

请严格按 STAGE1 系统提示的 JSON 结构返回${n > 1 ? "，且 files_to_read_next 必须用 owner/repo:path 形式标明每个文件属于哪个 repo" : ""}，不要 markdown 围栏。`;
}
