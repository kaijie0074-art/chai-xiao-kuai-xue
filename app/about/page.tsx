"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ModuleCard } from "@/components/ModuleCard";
import { SAMPLE_MODULES } from "@/lib/sample-modules";

const TOC = [
  { id: "idea", label: "为什么做这个" },
  { id: "howto", label: "怎么用" },
  { id: "compare", label: "和别的工具不一样" },
  { id: "flow", label: "AI 是怎么思考的" },
  { id: "demo", label: "一个真实示例" },
  { id: "case-douyin", label: "案例 · 抖音数据抓取" },
  { id: "privacy", label: "完整隐私声明" },
  { id: "faq", label: "常见问题" },
  { id: "credits", label: "致谢" },
];

export default function AboutPage() {
  const [section, setSection] = useState("idea");

  useEffect(() => {
    const onScroll = () => {
      let cur = "idea";
      for (const { id } of TOC) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 120) cur = id;
      }
      setSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title" style={{ fontSize: 36, marginBottom: 6 }}>
          关于
        </h2>
        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14 }}>
          理念 · 怎么用 · 隐私 · 常见问题
        </p>
      </div>

      <div className="about-grid">
        <main>
          {/* IDEA */}
          <section id="idea" className="about-block">
            <h2>为什么做这个</h2>
            <p className="about-pull">不要学习一个项目，学习它对你有用的那一小块。</p>

            <p>
              市面上已经有 DeepWiki、GitHub Copilot Workspace、各种 repo 总结工具。它们解决一个共同的问题：「这个 repo 在干嘛」。
            </p>
            <p>
              但<strong>独立开发者</strong>的真实使用瞬间往往不是这样的——你正在做某个具体项目，刷推看到一个开源 repo，心想&quot;它的某块我能不能搬&quot;。你<em>不需要</em>知道这个 repo 全貌，你需要知道<em>能偷的那一块</em>。
            </p>
            <p>
              拆小块学的输入有<strong>两件东西</strong>：一个 GitHub 链接，一句「你正在做什么」。输出永远是<strong>卡片</strong>——是什么 / 对你为什么有用 / 怎么搬过来。
            </p>

            <h3>它不是什么</h3>
            <ul>
              <li>不是「项目摘要」工具——不写 README 的复读机版本</li>
              <li>不是「代码生成」工具——输出永远是「拆解卡片」，不是「帮你写新代码」</li>
              <li>不是 SaaS——没有账号、没有云端、没有付费墙</li>
            </ul>
          </section>

          {/* HOWTO */}
          <section id="howto" className="about-block">
            <h2>怎么用 · 4 步</h2>
            <p>
              设计目标是让你在刷推看到一个 repo、心想「它的某块我能不能搬」时，能在一杯咖啡之内拿到答案。
            </p>

            <div className="steps" style={{ marginTop: 20 }}>
              {[
                { no: "01", title: "贴一个 GitHub 链接", desc: "完整 URL 或 owner/repo 简写都行。匿名抓取，仅公开 repo。" },
                { no: "02", title: "一句话说你在做什么", desc: "越具体越好——「我在做面向中文播客的 AI 摘要」比「我在做 AI 应用」管用一万倍。" },
                { no: "03", title: "选问题模式", desc: "固定七问 · AI 动态出题 · 自己出题。可叠加，至少一项。" },
                { no: "04", title: "拿到可搬卡片", desc: "每张卡片都写明「是什么 / 对你为什么有用 / 怎么搬过来」+ 代码片段 + 来源文件。" },
              ].map((s) => (
                <div key={s.no} className="step">
                  <div className="step-no">{s.no}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* COMPARE */}
          <section id="compare" className="about-block">
            <h2>和别的工具不一样</h2>
            <div className="compare">
              <div className="compare-cell them">
                <span className="compare-tag">常见做法</span>
                <h3>给整个 repo 写一份摘要</h3>
                <p>
                  「这个项目是一个 AI 聊天应用，用 Next.js 14、AI SDK、shadcn/ui 构建，支持流式渲染、工具调用、多模型……」
                </p>
                <span className="frag">信息量大，但不知道从哪下手</span>
              </div>
              <div className="compare-cell us">
                <span className="compare-tag">拆小块学</span>
                <h3>「你在做 X，这 5 块可以搬」</h3>
                <p>
                  结合你的项目背景，输出 5 张「即拿即用」的卡片：流式分块渲染、Markdown 增量、Abort/Retry、多模型路由、工具→UI 绑定。
                </p>
                <span className="frag">复制粘贴即可，不需读完整个 repo</span>
              </div>
            </div>
          </section>

          {/* FLOW */}
          <section id="flow" className="about-block">
            <h2>AI 是怎么思考的</h2>
            <p>两阶段工作流，让 AI 先「侦察」再「拆解」——你能在拆解页一直看到这两个阶段的进度。</p>

            <div className="flow-diagram">
              <div className="flow-stage">
                <div className="stage-no">STAGE 1</div>
                <h4>侦察</h4>
                <div className="io">
                  <b>输入</b>
                  <span>README · 文件树 · package.json / requirements.txt</span>
                </div>
                <div className="io">
                  <b>输出</b>
                  <span>项目类型 · 核心价值 · 该看哪些文件 · 建议问题</span>
                </div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-no">STAGE 2</div>
                <h4>拆解</h4>
                <div className="io">
                  <b>输入</b>
                  <span>Stage 1 结果 · 关键文件内容 · 你的项目背景 · 选中问题</span>
                </div>
                <div className="io">
                  <b>输出</b>
                  <span>3-8 张可搬卡片（is / why / how / code / files）</span>
                </div>
              </div>
            </div>

            <p>这种「先看大局再下钻」的方式，比一次性把整个 repo 灌给模型更稳——上下文窗口不会爆，输出也更结构化。</p>
          </section>

          {/* DEMO */}
          <section id="demo" className="about-block">
            <h2>一个真实示例</h2>
            <p>
              假设你在做「中文播客 AI 摘要工具」，需要把生成结果流式渲染到长文档里。以下是 AI 从{" "}
              <code>vercel/ai-chatbot</code> 拆出的两张样例卡片——这就是你「能搬」的那部分。
            </p>

            <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
              <ModuleCard module={SAMPLE_MODULES[0]} index={0} />
              <ModuleCard module={SAMPLE_MODULES[1]} index={1} />
            </div>
          </section>

          {/* CASE · 抖音带货数据采集（基于真实拆解结果） */}
          <section id="case-douyin" className="about-block">
            <h2>案例 · 抖音带货数据采集</h2>
            <p className="about-pull">
              我用这个工具对 <strong style={{ color: "var(--fg)" }}>6 个</strong> 抖音爬虫开源项目做了对比拆解，拿到 6 张可搬卡片——覆盖从签名生成到浏览器自动化的完整链路。
            </p>

            <h3>背景</h3>
            <p>
              我在做一个<strong>抖音博主带货数据采集</strong>的小工具——主要要拿三类数：博主<strong>粉丝量</strong>、视频<strong>点赞量</strong>、商品<strong>购买量</strong>（特别是带货耳机品类）。但抖音的反爬一年比一年狠，签名机制（<code>X-Bogus</code> / <code>msToken</code>）、风控、限频，开源项目里每家都做了一套，水准参差不齐。直接挑一个抄太冒险，全读完时间不够。
            </p>

            <h3>对比拆解的 6 个 repo</h3>
            <ul>
              <li>
                <a
                  href="https://github.com/NanmiCoder/MediaCrawler"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>NanmiCoder/MediaCrawler</code>
                </a>{" "}
                · 多平台爬虫框架 · 配置驱动 + 浏览器自动化路线
              </li>
              <li>
                <a
                  href="https://github.com/Evil0ctal/Douyin_TikTok_Download_API"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>Evil0ctal/Douyin_TikTok_Download_API</code>
                </a>{" "}
                · 异步 FastAPI 风格 · 请求基类最完整
              </li>
              <li>
                <a
                  href="https://github.com/reader0421/FetchFans"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>reader0421/FetchFans</code>
                </a>{" "}
                · 策略模式 · 多平台扩展性最好
              </li>
              <li>
                <a
                  href="https://github.com/erma0/douyin"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>erma0/douyin</code>
                </a>{" "}
                · 带前端 · SSE 实时事件推送
              </li>
              <li>
                <a
                  href="https://github.com/RookieDevp/douyin-reptiles"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>RookieDevp/douyin-reptiles</code>
                </a>{" "}
                · 签名服务独立成 HTTP 服务，最干净
              </li>
              <li>
                <a
                  href="https://github.com/Bowenwin/MediaCrawler_MCP_Server"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "var(--accent-text)", textDecoration: "underline" }}
                >
                  <code>Bowenwin/MediaCrawler_MCP_Server</code>
                </a>{" "}
                · MediaCrawler 的 MCP 服务封装
              </li>
            </ul>

            <p>
              一句话项目背景：<em>「爬抖音博主的粉丝量、视频的点赞量，商品购买量（能带货耳机的）」</em>
            </p>

            <h3>拆出来的 6 张可搬卡片</h3>
            <ol style={{ paddingLeft: 22 }}>
              <li>
                <strong>抖音 X-Bogus 签名生成服务</strong> · 来自{" "}
                <code>RookieDevp/douyin-reptiles</code> · 独立 Flask 包装 JS 脚本，HTTP 调用即可拿签名，业务逻辑跟签名彻底解耦
              </li>
              <li>
                <strong>异步爬虫基类：连接池/重试/限流</strong> · 来自{" "}
                <code>Evil0ctal</code> · <code>httpx</code> + <code>asyncio.Semaphore</code> + 重试，处理空响应/超时/代理常见坑
              </li>
              <li>
                <strong>配置驱动的采集参数管理</strong> · 来自{" "}
                <code>NanmiCoder/MediaCrawler</code> · 一个 config 文件管目标博主列表，支持 URL / 短链接 / 纯 sec_user_id 多种输入格式
              </li>
              <li>
                <strong>策略模式的多平台粉丝抓取</strong> · 来自{" "}
                <code>FetchFans</code> · Base 抽象类 + Douyin/Bilibili 实现，未来要加 B 站/小红书等不用重写主流程
              </li>
              <li>
                <strong>SSE 实时事件推送架构</strong> · 来自{" "}
                <code>erma0/douyin</code> · 长跑任务的进度往前端推，<code>EventSource</code> 接收，不用轮询
              </li>
              <li>
                <strong>浏览器自动化免逆向方案</strong> · 来自{" "}
                <code>NanmiCoder/MediaCrawler</code> · Playwright 保留登录态 + JS 表达式取签名，比直接 API 调用稳得多
              </li>
            </ol>

            <h3>对比下来的判断</h3>
            <p>
              6 个项目对比完，两个关键决策：
            </p>
            <ul>
              <li>
                <strong>签名生成走 RookieDevp 的独立服务最干净</strong>——业务代码不碰 JS 逆向，要换签名算法时只动一个服务
              </li>
              <li>
                <strong>整体框架学 MediaCrawler 的浏览器自动化路线</strong>——API 直调遇风控就死，浏览器路线带登录态稳得多
              </li>
            </ul>
            <p>
              其他 4 个 repo 各取一小块：异步基类 from Evil0ctal、配置组织 from MediaCrawler、扩展性思路 from FetchFans、前端推送 from erma0。
            </p>

            <p style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 18 }}>
              如果让我手动从 6 个 repo 里读源码挑出可搬的部分，至少 1-2 天。这次拆解 5 分钟 + 看一遍卡片 30 分钟就搞定——而且<em>每一块的来源清清楚楚</em>，哪天出问题能精确定位到上游 repo。这就是这个工具的真实价值：不是省时间，是<strong>看得见每一块从哪来</strong>。
            </p>
          </section>

          {/* PRIVACY */}
          <section id="privacy" className="about-block">
            <h2>完整隐私声明</h2>
            <div className="privacy-stamp">
              <Icon.Lock />
              <span>API Key 仅 localStorage · 无 cookie · 无埋点 · 无第三方追踪</span>
            </div>

            <h3>API Key</h3>
            <p>
              你填的 API Key 只写入 <code>localStorage</code>，本工具<strong>没有后端服务器</strong>，物理上无法接收到 Key。每次拆解时，LLM 请求由<strong>你的浏览器</strong>直连 Anthropic / OpenAI 官方接口。
            </p>

            <h3>GitHub 抓取</h3>
            <p>
              抓 repo 使用 GitHub 匿名 API（无 token），仅能访问公开 repo。匿名调用限额 60 次/小时/IP，超限时会友好提示。
            </p>

            <h3>
              <code>dangerouslyAllowBrowser</code> 是什么
            </h3>
            <p>
              这是 Anthropic / OpenAI SDK 的一个开关，开启后 SDK 允许在浏览器里使用 API Key。<strong>&quot;危险&quot;指的是</strong>：如果你的网页被第三方脚本注入或者代码托管被劫持，Key 可能被偷。<strong>缓解办法</strong>：
            </p>
            <ul>
              <li>本工具不引入任何第三方分析脚本——你可以打开 DevTools 验证</li>
              <li>给你的 API Key 设置较低的支出限额</li>
              <li>不要在公共电脑使用</li>
            </ul>

            <h3>追踪</h3>
            <ul>
              <li>无 Cookie</li>
              <li>无 Google Analytics / Plausible / 任何统计 SDK</li>
              <li>字体通过 Next.js 自托管（不连第三方 CDN）</li>
            </ul>

            <h3>开源</h3>
            <p>
              本项目源码：{" "}
              <a
                href="https://github.com/kaijie0074-art/chai-xiao-kuai-xue"
                target="_blank"
                rel="noopener"
                style={{ color: "var(--accent-text)", textDecoration: "underline" }}
              >
                github.com/kaijie0074-art/chai-xiao-kuai-xue
              </a>
              。欢迎审计——尤其是 <code>lib/providers/*</code> 和 <code>lib/openrouter-oauth.ts</code>，所有跟 API Key 相关的代码都在那里，没有任何上传到第三方服务器的逻辑。
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="about-block">
            <h2>常见问题</h2>

            <h3>会不会有人截到我的 Key？</h3>
            <p>
              本工具是纯前端、没后端，<code>localStorage</code> 只有本浏览器能读。但浏览器扩展能读 localStorage——别装来路不明的扩展。
            </p>

            <h3>为什么不做服务端代理？</h3>
            <p>那样我们就要持有你的 Key，违背 BYOK 初衷。</p>

            <h3>用 Claude 还是 OpenAI 好？</h3>
            <p>拆解任务上 Claude Opus / Sonnet 表现更稳；预算紧用 Haiku 或 gpt-4o-mini 也行。</p>

            <h3>GitHub 60 次/小时怎么办？</h3>
            <p>
              同一 repo 抓取结果会在 sessionStorage 缓存 1 小时，期内重复拆解不耗配额。下个版本会支持填 GitHub Token 解锁更高限额。
            </p>

            <h3>大型 repo 会爆 token 吗？</h3>
            <p>
              不会。文件树最多取 2 层、至多展开 8 个子目录、关键文件每个最多 40KB、README 最多 12000 字符，超过会截断。
            </p>
          </section>

          {/* CREDITS */}
          <section id="credits" className="about-block">
            <h2>致谢 · 灵感来源</h2>
            <p>
              产品名「拆小块学」的灵感来自一句不知道谁说的话：<em>&ldquo;你不需要读完整本书，你需要的是那一页。&rdquo;</em>
            </p>
            <p>
              设计上参考了 Linear / Vercel 的克制感，但把卡片做成「食谱卡」——因为我们要的就是「材料 + 步骤 + 撕下来带走」的那种<strong>实用感</strong>，而不是「AI 玩具」的花哨感。
            </p>
            <p
              style={{
                marginTop: 32,
                color: "var(--fg-4)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              — 拆小块学 MVP v0.1
              <br />— 用爱发电，不收订阅，
              <br />
              &nbsp;&nbsp;&nbsp; 你的 Key 你的事。
            </p>
          </section>
        </main>

        <aside className="about-side">
          <h5>本页目录</h5>
          {TOC.map((t) => (
            <a
              key={t.id}
              className={"toc-link" + (section === t.id ? " on" : "")}
              onClick={(e) => {
                e.preventDefault();
                tocClick(t.id);
              }}
              role="button"
            >
              {t.label}
            </a>
          ))}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <Link
              href="/analyze"
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              开始拆解 <Icon.ArrowRight />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

