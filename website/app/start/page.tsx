import type { Metadata } from "next";
import { sampleJourneyOverview } from "../../content/zh";
import { startRouteCopy } from "../../content/zh/start";

export const metadata: Metadata = {
  title: "开始学习",
  description: "从生成、评价、训练三步认识 slime，再跟随一条 Sample 走完整个训练闭环。",
};

export default function StartPage() {
  return (
    <>
      <header className="beginner-hero">
        <div className="page-shell beginner-hero-grid">
          <div className="beginner-copy">
            <p className="eyebrow">{startRouteCopy.eyebrow}</p>
            <h1>
              {startRouteCopy.title}
              <span>{startRouteCopy.answer}</span>
            </h1>
            <p className="beginner-lead">{startRouteCopy.summary}</p>

            <ol className="beginner-loop" aria-label="slime 最小训练循环">
              {startRouteCopy.loop.map((step) => (
                <li key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </div>
                </li>
              ))}
            </ol>

            <p className="beginner-scroll-cue">
              继续往下，看三步如何展开成七个角色
              <span aria-hidden="true">↓</span>
            </p>

            <ul className="beginner-facts" aria-label="课程说明">
              {startRouteCopy.facts.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
          </div>

          <figure className="beginner-visual">
            <img
              src="/art/journey-dawn.webp"
              alt=""
              width="1440"
              height="810"
              loading="eager"
              decoding="async"
            />
            <figcaption>{startRouteCopy.imageCaption}</figcaption>
          </figure>
        </div>
      </header>

      <section className="page-shell beginner-detail">
        <header className="beginner-detail-heading">
          <p className="section-kicker">从三步到具体系统</p>
          <h2>三步展开后，才会看到七个具体角色</h2>
          <p>
            这些名字来自 slime 的真实工作流，但你现在不需要记住它们。先看清它们分别属于“生成、评价、训练”中的哪一步就够了。
          </p>
        </header>

        <div className="phase-grid" aria-label="slime 七个角色按三个阶段分组">
          {startRouteCopy.phases.map((phase, phaseIndex) => (
            <section className={`phase-card is-${phase.id}`} key={phase.id}>
              <header>
                <span>{phaseIndex + 1}</span>
                <div>
                  <h3>{phase.title}</h3>
                  <p>{phase.plainDescription}</p>
                </div>
              </header>
              <ol>
                {sampleJourneyOverview.steps
                  .filter((step) => phase.stepIds.some((stepId) => stepId === step.id))
                  .map((step) => (
                    <li key={step.id}>
                      <span>{String(step.order).padStart(2, "0")}</span>
                      <div>
                        <strong>{step.actor}</strong>
                        <small>{step.action}</small>
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>

        <aside className="beginner-lesson-note">
          <span aria-hidden="true">一条记录</span>
          <div>
            <h2>{startRouteCopy.sampleExplanation.title}</h2>
            <p>{startRouteCopy.sampleExplanation.body}</p>
          </div>
          <a className="button button-primary button-small" href={startRouteCopy.primaryCta.href}>
            {startRouteCopy.primaryCta.label} <span aria-hidden="true">→</span>
          </a>
        </aside>
      </section>
    </>
  );
}
