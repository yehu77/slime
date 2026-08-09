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
              <span className="beginner-question">
                <span>{startRouteCopy.title[0]}</span>
                <wbr />
                <span>{startRouteCopy.title[1]}</span>
              </span>
              <span className="beginner-answer">{startRouteCopy.answer}</span>
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
              {startRouteCopy.scrollCue}
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
          <p className="section-kicker">{startRouteCopy.roleMap.eyebrow}</p>
          <h2>{startRouteCopy.roleMap.title}</h2>
          <p>{startRouteCopy.roleMap.introduction}</p>
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
          <span aria-hidden="true">{startRouteCopy.sampleExplanation.label}</span>
          <div>
            <h2>{startRouteCopy.sampleExplanation.title}</h2>
            <p>
              {startRouteCopy.sampleExplanation.bodyBefore} <code>{startRouteCopy.sampleExplanation.codeLabel}</code>
              {startRouteCopy.sampleExplanation.bodyAfter}
            </p>
          </div>
          <a className="button button-primary button-small" href={startRouteCopy.primaryCta.href}>
            {startRouteCopy.primaryCta.label} <span aria-hidden="true">→</span>
          </a>
        </aside>
      </section>
    </>
  );
}
