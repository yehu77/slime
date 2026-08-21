import type { Metadata } from "next";
import { ConceptReview } from "../../components/lesson/ConceptReview";
import { foundationReview, sampleJourneyOverview } from "../../content/zh";
import { startRouteCopy } from "../../content/zh/start";
import "../studio.css";

export const metadata: Metadata = {
  title: "开始学习",
  description: "先用一张七幕总览理解 slime，再通过可选课前诊断进入 Sample 状态演化首课。",
};

const reviewRoutes: Record<string, { href: string; label: string }> = {
  "pre-1": { href: "/learn/sample-journey?event=group_built&sample=a0&timeline=sync", label: "进入第二幕：分组" },
  "pre-2": { href: "/learn/sample-journey?event=generating&sample=a0&timeline=sync", label: "进入第三幕：生成" },
  "pre-3": { href: "/learn/sample-journey?event=train_data_built&sample=a0&timeline=sync", label: "进入第五幕：转换与排程" },
  "pre-4": { href: "/learn/sample-journey?event=rewarded_collected&sample=a0&timeline=sync", label: "进入第四幕：评价与收集" },
} as const;

export default function StartPage() {
  const questions = foundationReview.questions.map((question) => {
    const route = reviewRoutes[question.id];
    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => option.label),
      answer: question.options.findIndex((option) => option.id === question.correctOptionId),
      correctFeedback: question.feedback.ready,
      feedback: question.feedback.review,
      reviewHref: route.href,
      reviewLabel: route.label,
    };
  });

  return (
    <div className="studio-start">
      <section className="studio-start-keyframe" aria-labelledby="start-title">
        <figure>
          <span className="studio-cel-holes" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <img
            src="/art/start-horizon-v1.webp"
            alt="清晨的研究台上，一条 Sample 即将进入完整的训练闭环"
            width="1920"
            height="1080"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>{startRouteCopy.imageCaption}</figcaption>
        </figure>

        <article className="studio-start-cover-sheet">
          <div className="studio-sheet-fields" aria-hidden="true"><span>第零幕</span><span>领样本</span><span>SC. 00</span></div>
          <h1 id="start-title"><span>{startRouteCopy.title[0]}</span><span>{startRouteCopy.title[1]}</span></h1>
          <p className="studio-start-answer">{startRouteCopy.answer}</p>
          <p className="studio-start-summary">{startRouteCopy.summary}</p>
          <ul className="studio-start-facts" aria-label="课程说明">
            {startRouteCopy.facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
          <p className="studio-start-scroll-cue">
            <span>{startRouteCopy.scrollCue}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6" /></svg>
          </p>
        </article>
      </section>

      <article className="studio-start-handout">
        <header className="studio-start-handout-heading">
          <h2>{startRouteCopy.roleMap.title}</h2>
          <p>{startRouteCopy.roleMap.introduction}</p>
        </header>

        <section className="studio-lifecycle" aria-label="slime 七个角色按三个阶段分组">
          <div className="studio-lifecycle-spine" aria-hidden="true"><span>INPUT</span><i /><strong>NEW WEIGHT</strong></div>
          <div className="studio-lifecycle-phases">
            {startRouteCopy.phases.map((phase, phaseIndex) => (
              <section className={`studio-lifecycle-phase is-${phase.id}`} key={phase.id}>
                <header>
                  <span>{String(phaseIndex + 1).padStart(2, "0")}</span>
                  <div><h3>{phase.title}</h3><p>{phase.plainDescription}</p></div>
                </header>
                <ol>
                  {sampleJourneyOverview.steps
                    .filter((step) => phase.stepIds.some((stepId) => stepId === step.id))
                    .map((step) => (
                      <li key={step.id}>
                        <span>{String(step.order).padStart(2, "0")}</span>
                        <div><strong>{step.actor}</strong><small>{step.action}</small></div>
                      </li>
                    ))}
                </ol>
              </section>
            ))}
          </div>
        </section>

        <section id="preflight" className="studio-preflight" aria-labelledby="preflight-review-title">
          <details>
            <summary>
              <span className="studio-preflight-code" aria-hidden="true">CHECK / 04</span>
              <span className="studio-preflight-copy">
                <strong id="preflight-review-title">{foundationReview.title}</strong>
                <small>{foundationReview.description}</small>
              </span>
              <span className="studio-preflight-toggle" aria-hidden="true">
                <span className="when-closed">展开四题</span><span className="when-open">收起诊断</span>
                <svg viewBox="0 0 20 20"><path d="m5 8 5 5 5-5" /></svg>
              </span>
            </summary>
            <div className="studio-preflight-body">
              <ConceptReview compact title={foundationReview.title} description={foundationReview.description} questions={questions} />
            </div>
          </details>
        </section>

        <footer className="studio-start-handoff">
          <div className="studio-start-sample-note">
            <span>{startRouteCopy.sampleExplanation.label}</span>
            <div>
              <h2>{startRouteCopy.sampleExplanation.title}</h2>
              <p>
                {startRouteCopy.sampleExplanation.bodyBefore} <code>{startRouteCopy.sampleExplanation.codeLabel}</code>
                {startRouteCopy.sampleExplanation.bodyAfter}
              </p>
            </div>
          </div>
          <a className="studio-primary-action" href={startRouteCopy.primaryCta.href}>
            <span>开始首课前：先读系统总览</span>
            <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 14h17M16 8l6 6-6 6" /></svg>
          </a>
        </footer>
      </article>
    </div>
  );
}
