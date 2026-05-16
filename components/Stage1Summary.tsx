"use client";

import type { Stage1Output } from "@/lib/prompts/stage1";
import { useDict } from "@/lib/i18n";

export function Stage1Summary({ result }: { result: Stage1Output }) {
  const t = useDict();
  const dynamicQs = result.suggested_questions_if_dynamic_mode || [];
  return (
    <div className="stage1-summary">
      <h4>{t.stage1Summary.title}</h4>
      <div className="stage1-grid">
        <div className="row">
          <div className="key">{t.stage1Summary.type}</div>
          <div>{result.project_type}</div>
        </div>
        <div className="row">
          <div className="key">{t.stage1Summary.coreValue}</div>
          <div>{result.core_value}</div>
        </div>
        {dynamicQs.length > 0 && (
          <div className="row">
            <div className="key">{t.stage1Summary.drillDown}</div>
            <div>
              {dynamicQs.slice(0, 3).map((q, i) => (
                <span key={i} className="chip" style={{ margin: "0 6px 6px 0" }}>
                  · {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
