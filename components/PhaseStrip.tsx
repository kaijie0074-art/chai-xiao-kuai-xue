"use client";

import React from "react";
import { Icon } from "./Icon";
import { useDict } from "@/lib/i18n";

export function PhaseStrip({
  phase,
  completed,
}: {
  phase: string;
  completed: string[];
}) {
  const t = useDict();
  const pills: { key: string; label: string }[] = [
    { key: "fetching", label: t.phase.fetching },
    { key: "stage1", label: t.phase.stage1 },
    { key: "fetching_key_files", label: t.phase.fetchingKeyFiles },
    { key: "stage2", label: t.phase.stage2 },
    { key: "done", label: t.phase.done },
  ];

  return (
    <div className="phase-strip">
      {pills.map((p, i) => {
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
            {i < pills.length - 1 && <span className="phase-arrow">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
