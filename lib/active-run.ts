"use client";

/**
 * 全局「正在跑的拆解任务」存储。
 *
 * 为什么需要：单纯放在 React 组件 local state 里，用户一切 Tab 组件 unmount，
 * UI 看着像取消了；切回来还得从头再来。把状态搬到 Zustand store + 模块作用域
 * 的 AbortController，组件 unmount 时任务和状态都还活着，回到 /analyze 时
 * 直接展示当前进度。
 */

import { create } from "zustand";
import {
  runAnalyze,
  runSynthesize,
  type AnalyzePhase,
  type AnalyzeRequest,
  type SynthesizePhase,
  type SynthesizeRequest,
} from "./analyze";
import { DEMO_EN, DEMO_ZH } from "./demo-data";
import { useHistory } from "./history";
import type { Locale } from "./i18n";
import type { Stage1Output } from "./prompts/stage1";
import type { Module } from "./prompts/stage2";

interface ActiveRunState {
  // 当前 run 的输入快照（在 startAnalyze 时冻结）
  target: string;
  repos: Array<{ owner: string; repo: string }>;
  /** 当前 run 是 demo 模拟（不调真实 API、不存历史） */
  isDemo: boolean;

  // Stage 1 / 2
  phase: AnalyzePhase;
  completed: string[];
  stage1Text: string;
  stage1Result: Stage1Output | null;
  stage2Text: string;
  modules: Module[];
  keyFiles: string[];
  error: string | null;
  /** error 的 kind（auth / rate_limit / not_found / 等），UI 用它做本地化 */
  errorKind: string | null;
  bundleId: string | null;

  // Stage 3
  synthPhase: SynthesizePhase;
  synthText: string;
  synthError: string | null;
  synthErrorKind: string | null;
}

const initialState: ActiveRunState = {
  target: "",
  repos: [],
  isDemo: false,
  phase: "idle",
  completed: [],
  stage1Text: "",
  stage1Result: null,
  stage2Text: "",
  modules: [],
  keyFiles: [],
  error: null,
  errorKind: null,
  bundleId: null,
  synthPhase: "idle",
  synthText: "",
  synthError: null,
  synthErrorKind: null,
};

export const useActiveRun = create<ActiveRunState>()(() => initialState);

// 模块作用域的 AbortController —— 跨组件 unmount 存活
const activeAborts: {
  run: AbortController | null;
  synth: AbortController | null;
} = { run: null, synth: null };

const RUNNING_PHASES: AnalyzePhase[] = [
  "fetching",
  "stage1",
  "fetching_key_files",
  "stage2",
];

export function isAnalyzing(state?: ActiveRunState): boolean {
  const phase = (state || useActiveRun.getState()).phase;
  return RUNNING_PHASES.includes(phase);
}

function dedup<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function resetActiveRun() {
  useActiveRun.setState(initialState);
}

/**
 * 启动拆解。如果已有运行中的任务先 abort 它。
 * 返回的 Promise 在任务完成（成功/失败）时 resolve。
 */
export async function startAnalyze(
  req: Omit<AnalyzeRequest, "signal">
): Promise<void> {
  // 先 abort 旧的（如果有）
  activeAborts.run?.abort();
  const ac = new AbortController();
  activeAborts.run = ac;

  useActiveRun.setState({
    ...initialState,
    target: req.userProjectContext,
    repos: req.repos,
    phase: "fetching",
  });

  try {
    await runAnalyze({ ...req, signal: ac.signal }, (u) => {
      // 任何时候都用 setState 函数式，保证读到最新 state
      useActiveRun.setState((s) => {
        const patch: Partial<ActiveRunState> = {};
        if (u.phase) patch.phase = u.phase;

        if (u.phase === "fetching") {
          patch.completed = [];
        }
        if (u.phase === "stage1") {
          if (u.partialText !== undefined) patch.stage1Text = u.partialText;
          if (u.stage1) {
            patch.stage1Result = u.stage1;
            patch.keyFiles = u.stage1.files_to_read_next || [];
            patch.completed = dedup([...s.completed, "fetching", "stage1"]);
          }
        }
        if (u.phase === "fetching_key_files") {
          patch.completed = dedup([...s.completed, "stage1"]);
        }
        if (u.phase === "stage2") {
          patch.completed = dedup([...s.completed, "fetching_key_files"]);
          if (u.partialText !== undefined) patch.stage2Text = u.partialText;
          if (u.stage2) {
            patch.modules = u.stage2.modules;
            patch.completed = dedup([...s.completed, "fetching_key_files", "stage2"]);
          }
        }
        if (u.phase === "done") {
          const modules = u.stage2?.modules || s.modules;
          patch.modules = modules;
          patch.completed = dedup([
            ...s.completed,
            "fetching_key_files",
            "stage2",
            "done",
          ]);
          // 自动保存到历史（每个 run 只存一次）
          if (!s.bundleId && modules.length > 0) {
            const saved = useHistory.getState().save({
              target: req.userProjectContext,
              repos: req.repos,
              stage1: u.stage1 ?? s.stage1Result ?? null,
              modules,
            });
            patch.bundleId = saved.id;
          }
        }
        if (u.phase === "error" && u.error) {
          patch.error = u.error;
          patch.errorKind = u.errorKind ?? "unknown";
        }
        return patch;
      });
    });
  } catch (e) {
    useActiveRun.setState({
      phase: "error",
      error: (e as Error).message || "未知错误",
      errorKind: "unknown",
    });
  } finally {
    if (activeAborts.run === ac) activeAborts.run = null;
  }
}

export function cancelAnalyze() {
  activeAborts.run?.abort();
  activeAborts.run = null;
  // 不重置已生成的数据 —— 用户手动 reset 才清
  useActiveRun.setState((s) => ({
    phase: s.phase === "done" ? "done" : "idle",
  }));
}

/**
 * Stage 3 合成。读 store 当前 run 的 target / repos / modules。
 */
export async function startSynthesize(opts: {
  provider: SynthesizeRequest["provider"];
  apiKey: string;
  model: string;
  baseURL?: string;
  locale?: Locale;
}): Promise<void> {
  activeAborts.synth?.abort();
  const ac = new AbortController();
  activeAborts.synth = ac;

  const s = useActiveRun.getState();
  if (s.modules.length === 0) {
    useActiveRun.setState({
      synthPhase: "error",
      synthError: "还没有拆出模块，先跑完 Stage 1/2",
      synthErrorKind: "bad_request",
    });
    return;
  }

  useActiveRun.setState({
    synthPhase: "running",
    synthText: "",
    synthError: null,
  });

  try {
    await runSynthesize(
      {
        target: s.target,
        repos: s.repos,
        modules: s.modules,
        provider: opts.provider,
        apiKey: opts.apiKey,
        model: opts.model,
        baseURL: opts.baseURL,
        locale: opts.locale,
        signal: ac.signal,
      },
      (u) => {
        useActiveRun.setState((cur) => {
          const patch: Partial<ActiveRunState> = {};
          if (u.partialText !== undefined) patch.synthText = u.partialText;
          if (u.phase === "done" && u.result) {
            patch.synthText = u.result;
            patch.synthPhase = "done";
            // 回写到历史 bundle
            if (cur.bundleId) {
              useHistory.getState().setPrompt(cur.bundleId, u.result);
            }
          }
          if (u.phase === "error" && u.error) {
            patch.synthError = u.error;
            patch.synthErrorKind = u.errorKind ?? "unknown";
            patch.synthPhase = "error";
          }
          return patch;
        });
      }
    );
  } finally {
    if (activeAborts.synth === ac) activeAborts.synth = null;
  }
}

export function cancelSynthesize() {
  activeAborts.synth?.abort();
  activeAborts.synth = null;
  useActiveRun.setState({
    synthPhase: "idle",
    synthText: "",
  });
}

/* ───────── Demo（模拟）模式 ───────── */

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

/**
 * 走一遍预设的拆解流程，不调任何 API。给没配 key 的访客体验产品全貌用。
 */
export async function startDemoAnalyze(opts: { locale: Locale }): Promise<void> {
  activeAborts.run?.abort();
  const ac = new AbortController();
  activeAborts.run = ac;

  const data = opts.locale === "en" ? DEMO_EN : DEMO_ZH;

  // 重置状态 + 标记 demo
  useActiveRun.setState({
    ...initialState,
    target: data.target,
    repos: [data.repo],
    isDemo: true,
    phase: "fetching",
  });

  try {
    // Phase 1: 抓取
    await abortableSleep(1500, ac.signal);
    useActiveRun.setState((s) => ({
      completed: dedup([...s.completed, "fetching"]),
      phase: "stage1",
    }));

    // Phase 2: Stage 1 流式
    let acc = "";
    for (const chunk of data.stage1Chunks) {
      await abortableSleep(50, ac.signal);
      acc += chunk;
      useActiveRun.setState({ stage1Text: acc });
    }
    useActiveRun.setState((s) => ({
      stage1Result: data.stage1Result,
      keyFiles: data.stage1Result.files_to_read_next,
      completed: dedup([...s.completed, "stage1"]),
      phase: "fetching_key_files",
    }));

    // Phase 3: 抓关键文件
    await abortableSleep(1500, ac.signal);
    useActiveRun.setState((s) => ({
      completed: dedup([...s.completed, "fetching_key_files"]),
      phase: "stage2",
    }));

    // Phase 4: Stage 2 流式 + 逐张揭示卡片
    acc = "";
    let revealed = 0;
    const total = data.modules.length;
    const revealEvery = Math.max(1, Math.floor(data.stage2Chunks.length / (total + 1)));

    for (let i = 0; i < data.stage2Chunks.length; i++) {
      await abortableSleep(50, ac.signal);
      acc += data.stage2Chunks[i];
      if (i > 0 && i % revealEvery === 0 && revealed < total) {
        revealed++;
        useActiveRun.setState({
          stage2Text: acc,
          modules: data.modules.slice(0, revealed),
        });
      } else {
        useActiveRun.setState({ stage2Text: acc });
      }
    }

    // 所有卡片揭完 + done
    useActiveRun.setState((s) => ({
      modules: data.modules,
      completed: dedup([...s.completed, "stage2", "done"]),
      phase: "done",
    }));
    // demo 不保存到历史
  } catch {
    // 被 cancel，无需处理
  } finally {
    if (activeAborts.run === ac) activeAborts.run = null;
  }
}

/**
 * Demo 合成 prompt，同样是流式模拟。
 */
export async function startDemoSynthesize(opts: { locale: Locale }): Promise<void> {
  activeAborts.synth?.abort();
  const ac = new AbortController();
  activeAborts.synth = ac;

  const data = opts.locale === "en" ? DEMO_EN : DEMO_ZH;

  useActiveRun.setState({
    synthPhase: "running",
    synthText: "",
    synthError: null,
    synthErrorKind: null,
  });

  try {
    let acc = "";
    for (const chunk of data.synthChunks) {
      await abortableSleep(30, ac.signal);
      acc += chunk;
      useActiveRun.setState({ synthText: acc });
    }
    useActiveRun.setState({
      synthPhase: "done",
    });
  } catch {
    // aborted
  } finally {
    if (activeAborts.synth === ac) activeAborts.synth = null;
  }
}
