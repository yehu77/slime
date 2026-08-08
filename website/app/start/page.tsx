import type { Metadata } from "next";
import Link from "next/link";
import { PrerequisiteCheck } from "../../components/start/PrerequisiteCheck";
import { sampleJourneyOverview } from "../../content/zh";
import { prerequisiteCheck, startRouteCopy } from "../../content/zh/start";

export const metadata: Metadata = {
  title: "开始学习",
  description: "90 秒建立 slime 训练闭环，再进入一条 Sample 的完整旅程。",
};

export default function StartPage() {
  const questions = prerequisiteCheck.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => option.label),
    answer: question.options.findIndex((option) => option.id === question.correctOptionId),
    termId: question.reviewLink.href.replace("/glossary#", ""),
    feedback: question.feedback.review,
  }));

  return (
    <>
      <header className="page-intro">
        <div className="page-shell page-intro-grid">
          <div>
            <p className="eyebrow">START / 90-second model</p>
            <h1>{startRouteCopy.title}</h1>
            <p className="lead">{startRouteCopy.summary}</p>
          </div>
          <div className="intro-meta">
            <div><span>默认路线</span><strong>CORE / 001</strong></div>
            <div><span>先修</span><strong>PYTHON + RL</strong></div>
            <div><span>运行要求</span><strong>BROWSER ONLY</strong></div>
          </div>
        </div>
      </header>

      <section className="page-shell content-section two-column">
        <div className="prose">
          <p className="section-kicker">The loop before the details</p>
          <h2>先把七个角色放对位置</h2>
          <p>
            下面只回答“谁把什么交给谁”。暂时不要背参数；首课会让同一条 Sample 在这些边界上逐步变化。
          </p>
          <div className="route-grid" aria-label="slime 七段闭环">
            {sampleJourneyOverview.steps.map((step) => (
              <div className="route-card" key={step.id}>
                <span>{String(step.order).padStart(2, "0")}</span>
                <div><strong>{step.actor}</strong><small>{step.action}</small></div>
                <span aria-hidden="true">↓</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="aside-card">
          <p className="section-kicker">Keep this invariant</p>
          <h2>Sample 是跨系统协议</h2>
          <p>
            它不只是模型回答的容器。身份、token 对齐、训练掩码、reward、状态和权重版本共同决定 trainer 怎样解释它。
          </p>
          <div className="notice"><strong>无需 GPU：</strong>本路线使用固定教学 fixture，不会发起真实训练。</div>
          <div className="button-row">
            <Link className="button button-primary button-small" href="/learn/sample-journey">进入完整首课 ↗</Link>
          </div>
        </aside>
      </section>

      <section className="page-shell content-section">
        <PrerequisiteCheck questions={questions} />
      </section>
    </>
  );
}
