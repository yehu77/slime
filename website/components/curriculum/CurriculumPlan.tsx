import type {
  Curriculum,
  CurriculumCourse,
  CurriculumCourseId,
  CurriculumLearnerStatus,
  CurriculumLearnerStatusMap,
  CurriculumStage,
  CurriculumStageId,
} from "../../content/zh/curriculum";
import "./curriculum-plan.css";

export interface CurriculumPlanProps {
  curriculum: Curriculum;
  variant?: "full" | "compact";
  currentStageId?: CurriculumStageId;
  currentCourseId?: CurriculumCourseId;
  learnerStatusByUnit?: CurriculumLearnerStatusMap;
  headingId?: string;
}

const learnerStatusLabels: Record<CurriculumLearnerStatus, string> = {
  not_started: "尚未开始",
  in_progress: "学习中",
  completed: "已完成",
  review_required: "尚未开始",
};

function stageStateLabel(
  stage: CurriculumStage,
  learnerStatus: CurriculumLearnerStatus | undefined,
  current: boolean,
) {
  if (stage.availability === "planned") return "计划中";
  if (learnerStatus) return learnerStatusLabels[learnerStatus];
  if (current) return "当前所在";
  if (stage.optional) return "可选 · 已开放";
  if (stage.courses) {
    const available = stage.courses.filter((course) => course.availability === "available").length;
    return `${available} / ${stage.courses.length} 已开放`;
  }
  return "已开放";
}

function stageActionLabel(stage: CurriculumStage, learnerStatus?: CurriculumLearnerStatus) {
  if (learnerStatus === "completed") return "重新阅读";
  if (learnerStatus === "in_progress") return "继续学习";
  if (stage.id === "preflight") return "做可选诊断";
  if (stage.id === "system-intro") return "打开系统总览";
  return "进入阶段";
}

function courseActionLabel(course: CurriculumCourse, learnerStatus?: CurriculumLearnerStatus) {
  if (learnerStatus === "completed") return "重新阅读";
  if (learnerStatus === "in_progress") return "继续学习";
  if (course.id === "core.sample-to-generation") return "进入首门机制课";
  return "进入课程";
}

export function CurriculumPlan({
  curriculum,
  variant = "full",
  currentStageId,
  currentCourseId,
  learnerStatusByUnit = {},
  headingId = variant === "full" ? "curriculum-title" : "curriculum-compact-title",
}: CurriculumPlanProps) {
  const compact = variant === "compact";
  const stageById = new Map(curriculum.stages.map((stage) => [stage.id, stage]));

  return (
    <section
      className={`curriculum-plan is-${variant}`}
      aria-labelledby={headingId}
      data-curriculum-id={curriculum.id}
    >
      <header className="curriculum-plan-heading">
        <div className="curriculum-registration" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
        <div className="curriculum-heading-copy">
          <p>{curriculum.eyebrow}</p>
          {compact ? <h2 id={headingId}>完整路线，不在一门课里塞完</h2> : <h1 id={headingId}>{curriculum.title}</h1>}
          <p className="curriculum-summary">
            {compact
              ? "系统总览只负责定位；接下来按生产顺序进入机制课，实验排在机制与综合检查之后。"
              : curriculum.summary}
          </p>
        </div>
        {compact ? (
          <a className="curriculum-overview-link" href="/learn">
            查看课程总路线
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
          </a>
        ) : (
          <dl className="curriculum-production-facts" aria-label="路线规模">
            <div><dt>路线阶段</dt><dd>{curriculum.stages.length}</dd></div>
            <div><dt>核心机制课</dt><dd>{curriculum.stages.find((stage) => stage.id === "core-mechanisms")?.courses?.length ?? 0}</dd></div>
            <div><dt>实验起点</dt><dd>STAGE 05</dd></div>
          </dl>
        )}
      </header>

      {!compact ? (
        <div className="curriculum-reading-contract">
          <div>
            <span>READING RULE</span>
            <p>{curriculum.readingRule}</p>
          </div>
          <div>
            <span>PREREQUISITES / ADVISORY</span>
            <p>{curriculum.prerequisiteNotice}</p>
          </div>
          <div>
            <span>EXPERIMENT GATE</span>
            <p>{curriculum.experimentNotice}</p>
          </div>
        </div>
      ) : null}

      <div className="curriculum-exposure-sheet">
        {!compact ? (
          <header className="curriculum-sheet-labels" aria-hidden="true">
            <span>STAGE</span><span>PRODUCTION MARK</span><span>LEARNING EVIDENCE / CONTENT</span><span>STATE</span>
          </header>
        ) : null}
        <ol aria-label="slime Lab 七阶段课程顺序">
          {curriculum.stages.map((stage) => {
            const current = stage.id === currentStageId;
            const learnerStatus = learnerStatusByUnit[stage.id];
            const prerequisiteNames = stage.prerequisiteStageIds
              .map((id) => stageById.get(id)?.shortTitle)
              .filter((title): title is string => Boolean(title));

            return (
              <li
                className={`curriculum-unit is-${stage.availability} ${current ? "is-current" : ""} ${learnerStatus ? `is-${learnerStatus}` : ""}`}
                aria-current={current ? "step" : undefined}
                data-stage-id={stage.id}
                key={stage.id}
              >
                <span className="curriculum-sequence">{String(stage.order).padStart(2, "0")}</span>
                <div className="curriculum-phase-cell">
                  <span>{stage.mark}</span>
                  <strong>{stage.shortTitle}</strong>
                </div>
                <article>
                  <header>
                    <div className="curriculum-unit-flags">
                      {stage.optional ? <b>可选</b> : null}
                      {stage.id === "core-mechanisms" ? <b>五门深课</b> : null}
                      {current ? <b>当前阶段</b> : null}
                      <span>{stage.duration}</span>
                    </div>
                    {compact ? <h3>{stage.shortTitle}</h3> : <h2>{stage.title}</h2>}
                  </header>
                  {!compact ? (
                    <>
                      <p className="curriculum-question">{stage.question}</p>
                      <p className="curriculum-outcome"><strong>完成证据</strong>{stage.outcome}</p>
                      <ul className="curriculum-topic-strip" aria-label={`${stage.title}的内容范围`}>
                        {stage.topics.map((topic) => <li key={topic}>{topic}</li>)}
                      </ul>
                      <p className="curriculum-prerequisite">
                        <span>建议前置</span>
                        {prerequisiteNames.length ? prerequisiteNames.join(" · ") : "无需前置"}
                      </p>
                    </>
                  ) : (
                    <p>{stage.question}</p>
                  )}

                  {stage.courses ? (
                    <ol className="curriculum-course-runway" aria-label="五门核心机制课">
                      {stage.courses.map((course) => {
                        const courseCurrent = course.id === currentCourseId;
                        const courseStatus = learnerStatusByUnit[course.id];
                        return (
                          <li
                            className={`is-${course.availability} ${courseCurrent ? "is-current" : ""}`}
                            aria-current={courseCurrent ? "step" : undefined}
                            data-course-id={course.id}
                            key={course.id}
                          >
                            <span>{String(course.order).padStart(2, "0")}</span>
                            <div>
                              <small>MECHANISM COURSE · {course.duration}</small>
                              <strong>{course.title}</strong>
                              {!compact ? <p>{course.question}</p> : null}
                            </div>
                            <div className="curriculum-course-action">
                              <small>{course.availability === "planned" ? "计划中" : courseStatus ? learnerStatusLabels[courseStatus] : "已开放"}</small>
                              {course.route ? (
                                <a href={course.route}>{courseActionLabel(course, courseStatus)}</a>
                              ) : (
                                <span>尚未开放</span>
                              )}
                            </div>
                            {!compact && course.chapterTitles ? (
                              <ol className="curriculum-chapter-strip" aria-label={`${course.title}的六章`}>
                                {course.chapterTitles.map((chapter, chapterIndex) => (
                                  <li key={chapter}>
                                    <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
                                    <small>{chapter}</small>
                                  </li>
                                ))}
                              </ol>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>
                  ) : null}
                </article>
                <div className="curriculum-unit-state">
                  <small>{stageStateLabel(stage, learnerStatus, current)}</small>
                  {stage.route ? (
                    <a href={stage.route}>
                      {stageActionLabel(stage, learnerStatus)}
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
                    </a>
                  ) : stage.courses ? (
                    <span>从阶段内已开放课程进入</span>
                  ) : (
                    <span>路线开放后提供入口</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {!compact ? (
        <footer className="curriculum-plan-footer">
          <span>PATH NOTE / 07</span>
          <p>七个阶段会继续生长，但学习顺序不会倒置：先能解释机制，再用实验检验解释。</p>
        </footer>
      ) : null}
    </section>
  );
}
