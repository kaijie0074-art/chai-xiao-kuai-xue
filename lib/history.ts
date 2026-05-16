"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Stage1Output } from "./prompts/stage1";
import type { Module } from "./prompts/stage2";

export interface AnalysisBundle {
  id: string;
  createdAt: number;
  /** 用户那次拆解填的"我正在做什么" */
  target: string;
  /** 那次拆解涉及的 repos（1 个或多个） */
  repos: Array<{ owner: string; repo: string }>;
  /** Stage 1 的侦察结果（可选） */
  stage1: Stage1Output | null;
  /** Stage 2 拆出的模块 */
  modules: Module[];
  /** 合成出的 AI 提示词（如果用户点了"生成 AI 提示词"） */
  generatedPrompt?: string;
  promptCreatedAt?: number;
}

interface HistoryState {
  bundles: AnalysisBundle[];
  /** 被设为 /about 案例展示的 bundle id；null 表示未设置 */
  pinnedCaseId: string | null;
  save: (input: Omit<AnalysisBundle, "id" | "createdAt">) => AnalysisBundle;
  remove: (id: string) => void;
  setPrompt: (id: string, prompt: string) => void;
  setPinnedCase: (id: string | null) => void;
  clear: () => void;
}

const MAX_HISTORY = 30;

function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-6)
  );
}

export const useHistory = create<HistoryState>()(
  persist(
    (set, get) => ({
      bundles: [],
      pinnedCaseId: null,
      save: (input) => {
        const bundle: AnalysisBundle = {
          ...input,
          id: uid(),
          createdAt: Date.now(),
        };
        set({
          bundles: [bundle, ...get().bundles].slice(0, MAX_HISTORY),
        });
        return bundle;
      },
      remove: (id) => {
        const cur = get();
        set({
          bundles: cur.bundles.filter((b) => b.id !== id),
          // 删掉的恰好是 pinned 的就一起清掉
          pinnedCaseId: cur.pinnedCaseId === id ? null : cur.pinnedCaseId,
        });
      },
      setPrompt: (id, prompt) =>
        set({
          bundles: get().bundles.map((b) =>
            b.id === id
              ? { ...b, generatedPrompt: prompt, promptCreatedAt: Date.now() }
              : b
          ),
        }),
      setPinnedCase: (id) => set({ pinnedCaseId: id }),
      clear: () => set({ bundles: [], pinnedCaseId: null }),
    }),
    {
      name: "dissect-mvp-history",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage)
      ),
      version: 2,
      // 关键：版本升级时必须提供 migrate，不然 zustand 默认会把旧数据
      // 整个丢掉（用初始 state 覆盖），用户辛苦攒的历史就没了。
      migrate: (persistedState, fromVersion) => {
        const old = (persistedState ?? {}) as Partial<{
          bundles: AnalysisBundle[];
          pinnedCaseId: string | null;
        }>;
        if (fromVersion < 2) {
          return {
            bundles: Array.isArray(old.bundles) ? old.bundles : [],
            pinnedCaseId: null,
          };
        }
        return {
          bundles: Array.isArray(old.bundles) ? old.bundles : [],
          pinnedCaseId: old.pinnedCaseId ?? null,
        };
      },
    }
  )
);

export function formatBundleDate(ts: number): string {
  const d = new Date(ts);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}
