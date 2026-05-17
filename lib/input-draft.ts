"use client";

/**
 * 拆解页输入草稿 · 持久化到 localStorage。
 *
 * 用户填了一长串 URL + 项目背景，刷新或切到设置页配 key 再回来，
 * 内容不能丢。zh/en 两边共享同一份草稿（同一个用户的同一个想法）。
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DraftMode = "fixed" | "custom";

interface InputDraftState {
  /** 不存 row id，只存 url 文字。组件 mount 时把它们映射回 UrlRow */
  urls: string[];
  ctx: string;
  modes: DraftMode[];
  customQ: string;

  setUrls: (urls: string[]) => void;
  setCtx: (s: string) => void;
  setModes: (ms: DraftMode[]) => void;
  setCustomQ: (s: string) => void;
  reset: () => void;
}

const initial = {
  urls: [""],
  ctx: "",
  modes: ["fixed"] as DraftMode[],
  customQ: "",
};

export const useInputDraft = create<InputDraftState>()(
  persist(
    (set) => ({
      ...initial,
      setUrls: (urls) => set({ urls }),
      setCtx: (ctx) => set({ ctx }),
      setModes: (modes) => set({ modes }),
      setCustomQ: (customQ) => set({ customQ }),
      reset: () => set(initial),
    }),
    {
      name: "dissect-mvp-input-draft",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage)
      ),
      version: 1,
    }
  )
);
