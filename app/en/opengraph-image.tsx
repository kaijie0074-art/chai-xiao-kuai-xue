import { ImageResponse } from "next/og";

export const alt = "Dissect · GitHub project dissection helper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * English OG image — Latin script only, no CJK font fetch needed.
 * Satori's default Inter font handles English fine.
 */
export default async function OGImage() {
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
          fontFamily: "Inter, sans-serif",
          color: "#0d0d12",
        }}
      >
        {/* Top: brand */}
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
            Dissect
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
            GitHub project dissection · MVP v0.1
          </div>
        </div>

        {/* Main message */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: "#0d0d12",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ display: "flex" }}>Don&apos;t learn a project.</span>
            <span style={{ display: "flex", alignItems: "baseline" }}>
              Learn the{" "}
              <span style={{ color: "#4954B8", margin: "0 0.12em" }}>
                small piece
              </span>{" "}
              of it
            </span>
            <span style={{ display: "flex" }}>that&apos;s useful to you.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#3f3f46",
              lineHeight: 1.5,
              maxWidth: 920,
              display: "flex",
            }}
          >
            Paste a GitHub link + tell us what you&apos;re building. The AI
            returns stealable module cards you can drop right in.
          </div>
        </div>

        {/* Bottom: file chips + URL */}
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
            chai-xiao-kuai-xue.vercel.app/en
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
