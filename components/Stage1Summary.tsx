import type { Stage1Output } from "@/lib/prompts/stage1";

export function Stage1Summary({ result }: { result: Stage1Output }) {
  const dynamicQs = result.suggested_questions_if_dynamic_mode || [];
  return (
    <div className="stage1-summary">
      <h4>✓ AI 已识别项目</h4>
      <div className="stage1-grid">
        <div className="row">
          <div className="key">类型</div>
          <div>{result.project_type}</div>
        </div>
        <div className="row">
          <div className="key">核心价值</div>
          <div>{result.core_value}</div>
        </div>
        {dynamicQs.length > 0 && (
          <div className="row">
            <div className="key">下钻方向</div>
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
