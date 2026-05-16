import type { Module } from "./stage2";
import { truncate } from "../utils";
import type { Locale } from "../i18n";

/**
 * Stage 3 — 合成阶段。
 *
 * 输入：用户的项目目标 + 已拆出的模块卡片
 * 输出：一段可以直接复制粘贴给 Claude / ChatGPT / Cursor 等 AI 工具的
 *      markdown prompt，让那边的 AI 帮用户把这些可搬小块整合进他的项目。
 *
 * 不强制 JSON 输出——结果就是 markdown 文本。
 */
export const SYNTHESIZE_SYSTEM = `你是一位"实现方案合成专家"。用户已经从几个开源 repo 里拆出了一组"可搬走的小块卡片"。现在用户要把这些小块用在他自己的项目里。

你的任务：**输出一段 AI 提示词**——一段用户可以直接复制粘贴到 Claude / ChatGPT / Cursor 等 AI 编程工具里的指令，用来让那边的 AI 帮他把这些可搬小块整合进他的项目。

【输出格式】纯 markdown 文本，**不要任何 JSON 包装、不要任何 markdown 围栏（如 \`\`\`markdown）包整段**。

【理想结构】

# 项目目标
[一句话重申用户的项目目标，用第一人称"我"]

# 参考实现（从开源项目里挑出来的可搬部分）

## 1. [模块标题] · 来自 [repo 名]
- 关键文件：\`[文件路径]\`
- 核心方案：[2-3 句话概括思路]
- 代码示意：

\`\`\`[lang]
[关键 code snippet 的简洁版，必要时压缩，不要超过 15 行]
\`\`\`

## 2. ...

# 实现要求
- [基于用户项目背景推断出的具体技术栈/约束，例如 Next.js 14 + Claude API]
- [实现风格请参考上述各方案]

# 优先级建议
1. 先 [最重要的小块] —— 因为 ...
2. 再 [次要的]
3. 最后 [可选优化]

---

【硬性约束】
- 整段用第一人称"我"（这是用户写给 AI 的 prompt）。不要写"以下是几个开源项目的总结"那种第三人称口吻。
- 输出本身就是一份给 AI 用的 prompt，所以结尾应该自然过渡到"请帮我..."、"请按上面方案实现..."。
- code 示意必须简洁（≤15 行），重点说清思路；不要粘完整代码。
- 优先级要落到用户项目里可执行的步骤上。
- 不要 markdown 围栏（\`\`\`）包住整段输出。
- 输出语言：中文。`;

export const SYNTHESIZE_SYSTEM_EN = `You are an "implementation plan synthesizer". The user has dissected a few open-source repos into a set of "stealable small modules". Now they want to actually wire these into their own project.

Your task: **output an AI prompt** — a chunk of markdown the user can paste directly into Claude / ChatGPT / Cursor to have THAT AI help them integrate these stealable bits into their project.

[Output format] Plain markdown text. NO JSON wrapping, NO markdown fences wrapping the whole output.

[Ideal structure]

# Project goal
[One sentence restating the user's project goal, in first person ("I")]

# Reference implementations (stealable pieces from open-source projects)

## 1. [module title] · from [repo]
- Key file: \`[path]\`
- Core approach: [2-3 sentence summary]
- Code sketch:

\`\`\`[lang]
[concise version of key snippet, ≤15 lines]
\`\`\`

## 2. ...

# Implementation requirements
- [Tech stack / constraints inferred from the user's project context, e.g., Next.js 14 + Claude API]
- [Style: follow the patterns from the references above]

# Priority order
1. First [the most critical block] — because …
2. Then [secondary]
3. Finally [optional polish]

---

[Hard constraints]
- Use first person ("I") throughout — this is the user's prompt to another AI. Don't write in third person like "the user wants…".
- End by naturally transitioning to "Please help me…" or "Please implement based on the above…".
- Code sketches must be CONCISE (≤15 lines). Focus on conveying approach, not pasting full code.
- Priorities must map to concrete, executable steps in the user's project.
- Do NOT wrap the whole output in a markdown fence.
- Output language: ENGLISH.`;

export function buildSynthesizeUser(opts: {
  target: string;
  modules: Module[];
  repos: Array<{ owner: string; repo: string }>;
  locale?: Locale;
}): string {
  const { target, modules, repos, locale = "zh" } = opts;
  const repoList = repos.map((r) => `${r.owner}/${r.repo}`).join(", ");
  const isEn = locale === "en";

  const modulesBlock = modules
    .map((m, i) => {
      if (isEn) {
        return `## Card ${i + 1}: ${m.title}

**What it is**: ${m.what_it_is}

**Why it helps the user**: ${m.why_useful_for_you}

**How to steal**: ${m.how_to_steal}

**Code snippet**:

${m.code_snippet ? truncate(m.code_snippet, 1500) : "(none)"}

**Source files**: ${m.source_files.join(", ") || "(none)"}
`;
      }
      return `## 卡片 ${i + 1}: ${m.title}

**是什么**: ${m.what_it_is}

**对用户为什么有用**: ${m.why_useful_for_you}

**怎么搬过来**: ${m.how_to_steal}

**代码片段**:

${m.code_snippet ? truncate(m.code_snippet, 1500) : "（无）"}

**来源文件**: ${m.source_files.join(", ") || "（无）"}
`;
    })
    .join("\n\n");

  if (isEn) {
    return `# User's project goal
${target.trim() || "(not specified)"}

# Reference open-source projects
${repoList || "(none specified)"}

# Stealable cards (${modules.length} total)

${modulesBlock}

Per the SYNTHESIZE system prompt, roll these stealable bits into one AI-coding-tool prompt. Output markdown directly, no JSON wrapping.`;
  }

  return `# 用户的项目目标
${target.trim() || "（用户未明确说明）"}

# 参考的开源项目
${repoList || "（未指定）"}

# 拆出的可搬小块（共 ${modules.length} 张卡片）

${modulesBlock}

请按 SYNTHESIZE 系统提示的要求，把这些可搬小块整合成一份给 AI 编程工具用的 prompt。直接输出 markdown 内容，不要 JSON 包装。`;
}
