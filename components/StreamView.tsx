"use client";

export function StreamView({
  stage,
  text,
  open,
  onToggle,
}: {
  stage: string;
  text: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <details
      className="stream-view"
      open={open}
      onToggle={(e) => onToggle && onToggle((e.target as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="arrow">▶</span>
        <span className="stream-stage-tag">{stage}</span>
        <span style={{ color: "var(--fg-3)" }}>正在思考… {text.length} 字</span>
      </summary>
      <div className="stream-body">
        {text}
        <span className="stream-caret" />
      </div>
    </details>
  );
}
