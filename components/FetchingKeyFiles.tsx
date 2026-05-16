import { Icon } from "./Icon";

export function FetchingKeyFiles({ files }: { files: string[] }) {
  return (
    <div className="stream-view" style={{ paddingBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "var(--fg-3)",
          marginBottom: 12,
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          className="spinner"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
        正在抓取 Stage 1 提名的关键文件…
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {files.map((f, i) => {
          const idx = f.indexOf(":");
          const looksLikeRepoPrefix =
            idx > 0 && /^[\w.-]+\/[\w.-]+$/.test(f.slice(0, idx));
          const repoPrefix = looksLikeRepoPrefix ? f.slice(0, idx) : null;
          const path = looksLikeRepoPrefix ? f.slice(idx + 1) : f;
          return (
            <span
              key={f}
              className="chip chip-file"
              style={{ animation: `fadein .3s ${i * 0.18}s both` }}
            >
              <Icon.Folder />
              {repoPrefix && (
                <span style={{ color: "var(--fg-4)" }}>{repoPrefix}:</span>
              )}{" "}
              {path}
            </span>
          );
        })}
      </div>
    </div>
  );
}
