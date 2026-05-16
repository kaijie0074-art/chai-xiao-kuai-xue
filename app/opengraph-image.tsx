import { ImageResponse } from "next/og";

export const alt = "拆小块学 · GitHub 项目拆解助手";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 中文需要单独 fetch 字体——Satori 默认字体不含 CJK。
 * 用 jsdelivr 镜像 fontsource 的 Noto Sans SC，构建期一次性拉取。
 */
async function loadFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[]
> {
  const sources = [
    {
      weight: 400 as const,
      url: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.5/files/noto-sans-sc-chinese-simplified-400-normal.woff",
    },
    {
      weight: 600 as const,
      url: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.5/files/noto-sans-sc-chinese-simplified-700-normal.woff",
    },
  ];
  const results = await Promise.allSettled(
    sources.map((s) => fetch(s.url).then((r) => (r.ok ? r.arrayBuffer() : null)))
  );
  const out: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 600;
    style: "normal";
  }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({
        name: "Noto Sans SC",
        data: r.value,
        weight: sources[i].weight,
        style: "normal",
      });
    }
  });
  return out;
}

export default async function OGImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          fontFamily: "Noto Sans SC, sans-serif",
          color: "#0d0d12",
        }}
      >
        {/* 顶部品牌 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#5E6AD2",
              borderRadius: 6,
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            拆小块学
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#6b7280",
              fontFamily: "ui-monospace, monospace",
              marginLeft: 6,
              marginTop: 6,
              display: "flex",
            }}
          >
            GitHub 项目拆解助手 · MVP v0.1
          </div>
        </div>

        {/* 主标语 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: "#0d0d12",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ display: "flex" }}>不要学一个项目，</span>
            <span style={{ display: "flex", alignItems: "baseline" }}>
              学它对
              <span style={{ color: "#4954B8", margin: "0 0.05em" }}>你</span>
              有用的
            </span>
            <span style={{ display: "flex" }}>那一小块。</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#3f3f46",
              lineHeight: 1.5,
              maxWidth: 900,
              display: "flex",
            }}
          >
            贴一个 GitHub 链接 + 你正在做的项目，AI 拆出能直接搬走的小模块卡片。
          </div>
        </div>

        {/* 底部：源文件 chip + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[
              "lib/streaming.ts",
              "app/api/chat.ts",
              "components/markdown.tsx",
            ].map((p) => (
              <div
                key={p}
                style={{
                  fontSize: 15,
                  fontFamily: "ui-monospace, monospace",
                  color: "#3f3f46",
                  background: "#fafafa",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 5,
                  padding: "5px 11px",
                  display: "flex",
                }}
              >
                {p}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 16,
              fontFamily: "ui-monospace, monospace",
              color: "#9aa0a8",
              display: "flex",
            }}
          >
            chai-xiao-kuai-xue.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
