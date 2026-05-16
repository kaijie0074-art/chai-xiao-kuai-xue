import Link from "next/link";
import { Icon } from "./Icon";

const SOURCE_URL = "https://github.com/kaijie0074-art/chai-xiao-kuai-xue";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-byok">
        <span className="lock-dot" />
        <span>BYOK · 你的 API Key 仅存在本地浏览器，永不上传服务器</span>
      </div>
      <div
        className="footer-right"
        style={{ display: "flex", alignItems: "center", gap: 14 }}
      >
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener"
          title="GitHub 源码"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-3)",
          }}
        >
          <Icon.Github />
          <span style={{ fontSize: 12 }}>源码</span>
        </a>
        <Link href="/about">隐私与开源声明 →</Link>
      </div>
    </footer>
  );
}
