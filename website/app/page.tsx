import type { Metadata } from "next";
import { learningIntents, siteCopy } from "../content/zh";

export const metadata: Metadata = {
  title: "理解 slime，从一条 Sample 开始",
};

const loop = [
  ["01", "Dataset", "一行问题"],
  ["02", "DataSource", "复制与编号"],
  ["03", "SGLang", "生成 response"],
  ["04", "Reward", "评价与收集"],
  ["05", "Megatron", "训练 actor"],
  ["06", "Weight sync", "发布新权重"],
];

export default function Home() {
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span>slime Lab</span> / interactive systems textbook</p>
          <h1>{siteCopy.headline}</h1>
          <p className="hero-lead">{siteCopy.summary}</p>
          <div className="button-row">
            <a className="button button-primary" href={siteCopy.primaryCta.href}>
              {siteCopy.primaryCta.label} <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-ghost" href={siteCopy.lessonCta.href}>
              {siteCopy.lessonCta.label}
            </a>
          </div>
          <ul className="hero-facts" aria-label="课程特点">
            <li><strong>30 min</strong><span>完整首课</span></li>
            <li><strong>0 GPU</strong><span>浏览器可学</span></li>
            <li><strong>06ffdbe2</strong><span>固定源码基线</span></li>
          </ul>
        </div>

        <div className="hero-system" aria-label="slime 训练闭环概览">
          <div className="system-caption">
            <span className="status-dot" />
            <span>LIVE MENTAL MODEL</span>
            <span>01 / 06</span>
          </div>
          <ol className="loop-list">
            {loop.map(([number, title, copy], index) => (
              <li className={index === 0 ? "is-active" : ""} key={title}>
                <span className="loop-number">{number}</span>
                <span className="loop-node">
                  <strong>{title}</strong>
                  <small>{copy}</small>
                </span>
                <span className="loop-arrow" aria-hidden="true">↓</span>
              </li>
            ))}
          </ol>
          <div className="sample-chip">
            <span>Sample</span>
            <code>status=PENDING</code>
          </div>
        </div>
      </section>

      <section className="statement-band">
        <div className="page-shell statement-grid">
          <p className="section-kicker">为什么不是另一份文档</p>
          <blockquote>
            官方文档告诉你“怎样运行”；slime Lab 帮你形成一套能解释、
            能验证、也能发现错误的系统模型。
          </blockquote>
          <p className="statement-note">
            所有技术结论都回到固定版本的源码、测试或明确标注的教学 fixture。
          </p>
        </div>
      </section>

      <section className="page-shell intent-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Choose your intent</p>
            <h2>你今天想弄懂什么？</h2>
          </div>
          <p>先选问题，再进入知识。尚未开放的路线只展示方向，不制造空页面。</p>
        </div>
        <div className="intent-grid">
          {learningIntents.map((intent, index) => {
            const number = String(index + 1).padStart(2, "0");
            const ready = intent.availability === "m1-ready";
            const content = (
              <>
                <div className="intent-topline">
                  <span>{number}</span>
                  <span className={ready ? "tag tag-ready" : "tag"}>{ready ? "现在可学" : "路线预告"}</span>
                </div>
                <h3>{intent.title}</h3>
                <p>{intent.description}</p>
                <span className="intent-arrow" aria-hidden="true">↗</span>
              </>
            );
            return (
              <a
                className={`intent-card ${ready ? "" : "is-planned"}`}
                href={intent.href}
                key={intent.id}
                aria-label={`${intent.title}：${intent.cta}`}
              >
                {content}
              </a>
            );
          })}
        </div>
      </section>

      <section className="page-shell featured-lesson">
        <div className="lesson-index">CORE / 001</div>
        <div className="featured-copy">
          <p className="section-kicker">首个完整纵向切片</p>
          <h2>一条 Sample 的旅程</h2>
          <p>
            从 dataset row 出生，到 actor 参数更新、权重回到 rollout engine。
            七幕、四个交互、一份确定性 fixture。
          </p>
          <div className="lesson-tags">
            <span>Sample 显微镜</span><span>Batch 计算器</span><span>同步 / 异步时间线</span>
          </div>
        </div>
        <div className="featured-action">
          <span className="duration">25–30 分钟</span>
          <a className="circle-link" href="/learn/sample-journey" aria-label="进入一条 Sample 的旅程">↗</a>
        </div>
      </section>
    </>
  );
}
