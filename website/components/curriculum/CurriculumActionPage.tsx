import type {
  Curriculum,
  CurriculumLearnerStatusMap,
  CurriculumRecommendation,
  CurriculumRecommendations,
} from "../../content/zh";
import { CurriculumPlan } from "./CurriculumPlan";
import "./curriculum-action-page.css";

type CurriculumActionPageProps = {
  curriculum: Curriculum;
  recommendations: CurriculumRecommendations;
  learnerStatusByUnit: CurriculumLearnerStatusMap;
};

const statusLabels: Record<CurriculumRecommendation["status"], string> = {
  not_started: "尚未开始",
  in_progress: "学习中",
  completed: "已完成",
  review_required: "尚未开始",
};

function RecommendationSheet({
  recommendation,
  kind,
}: {
  recommendation: CurriculumRecommendation;
  kind: "continue" | "next";
}) {
  const indexLabel = {
    continue: "CONTINUE",
    next: "NEXT",
  }[kind];
  return (
    <article className={`curriculum-recommendation is-${kind}`}>
      <div className="curriculum-recommendation-index" aria-hidden="true">
        <span>{indexLabel}</span>
        <i /><i /><i />
      </div>
      <div className="curriculum-recommendation-copy">
        <div className="curriculum-recommendation-state">
          <span>{statusLabels[recommendation.status]}</span>
          <span>Stage {String(
            recommendation.stageId === "system-intro" ? 2 : 3,
          ).padStart(2, "0")}</span>
        </div>
        <h2>{recommendation.title}</h2>
        <p>{recommendation.description}</p>
        <strong>{recommendation.position}</strong>
      </div>
      <a className="curriculum-recommendation-action" href={recommendation.route}>
        {recommendation.actionLabel}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 7l5 5-5 5" />
        </svg>
      </a>
    </article>
  );
}

export function CurriculumActionPage({
  curriculum,
  recommendations,
  learnerStatusByUnit,
}: CurriculumActionPageProps) {
  return (
    <section className="curriculum-action-page" aria-labelledby="curriculum-action-title">
      <header className="curriculum-action-heading">
        <div>
          <h1 id="curriculum-action-title">先确认手里的这一页，再向前走。</h1>
          <p>
            这里分别显示上次学习位置与顺序中的下一项。课程更新时，旧修订进度会自动清除，不再要求你处理版本兼容。
          </p>
        </div>
        <dl aria-label="学习路线原则">
          <div><dt>当前原则</dt><dd>先讲透机制</dd></div>
          <div><dt>实验起点</dt><dd>Stage 05</dd></div>
        </dl>
      </header>

      <div className="curriculum-action-desk">
        <section aria-labelledby="curriculum-continue-title">
          <h2 id="curriculum-continue-title">继续上次学习</h2>
          {recommendations.continue ? (
            <RecommendationSheet recommendation={recommendations.continue} kind="continue" />
          ) : (
            <div className="curriculum-empty-now">
              <p>目前没有进行中的课程。右侧会显示顺序中第一项尚未开始、且已经开放的内容。</p>
            </div>
          )}
        </section>

        <section aria-labelledby="curriculum-next-title">
          <h2 id="curriculum-next-title">接下来</h2>
          {recommendations.next ? (
            <RecommendationSheet recommendation={recommendations.next} kind="next" />
          ) : (
            <div className="curriculum-no-next">
              <strong>暂时没有另一项已开放课程</strong>
              <p>
                {recommendations.continue
                  ? "先沿左侧精确位置继续；后续课程开放后会出现在这里。"
                  : "当前已开放内容均已完成；可以重新阅读课程或展开完整路线。"}
              </p>
            </div>
          )}
          <a className="curriculum-preflight-link" href="/start#preflight">
            不确定基础是否够用？做一次可选的 3 分钟课前诊断
          </a>
        </section>
      </div>

      <details className="curriculum-later">
        <summary>
          <span>以后</span>
          <strong>{recommendations.later.length} 个计划单元</strong>
          <small>只展示方向，不提供伪入口</small>
        </summary>
        <ol>
          {recommendations.later.map((item) => (
            <li key={item.id}>
              <span>{item.orderLabel}</span>
              <div><strong>{item.shortTitle}</strong><p>{item.question}</p><small>{item.context}</small></div>
              <small>计划中</small>
            </li>
          ))}
        </ol>
      </details>

      <details className="curriculum-full-route">
        <summary>展开完整七阶段路线</summary>
        <CurriculumPlan
          curriculum={curriculum}
          learnerStatusByUnit={learnerStatusByUnit}
        />
      </details>
    </section>
  );
}
