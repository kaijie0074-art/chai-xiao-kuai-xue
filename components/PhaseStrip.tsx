import React from "react";
import { Icon } from "./Icon";

const PHASE_PILLS: { key: string; label: string }[] = [
  { key: "fetching", label: "抓取" },
  { key: "stage1", label: "Stage 1 · 侦察" },
  { key: "fetching_key_files", label: "关键文件" },
  { key: "stage2", label: "Stage 2 · 拆解" },
  { key: "done", label: "完成" },
];

export function PhaseStrip({
  phase,
  completed,
}: {
  phase: string;
  completed: string[];
}) {
  return (
    <div className="phase-strip">
      {PHASE_PILLS.map((p, i) => {
        let state: "pending" | "active" | "done" = "pending";
        if (completed.includes(p.key)) state = "done";
        else if (p.key === phase) state = "active";
        return (
          <React.Fragment key={p.key}>
            <div className={"phase-pill " + state}>
              {state === "done" && <span className="check"><Icon.Check /></span>}
              {state === "active" && <span className="spinner" />}
              {state === "pending" && <span className="num">{i + 1}</span>}
              <span>{p.label}</span>
            </div>
            {i < PHASE_PILLS.length - 1 && <span className="phase-arrow">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
