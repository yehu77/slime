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
  review_required: "内容已修订",
};

function RecommendationSheet({
  recommendation,
  kind,
}: {
  recommendation: CurriculumRecommendation;
  kind: "now" | "next";
}) {
  return (
    <article className={`curriculum-recommendation is-${kind}`}>
      <div className="curriculum-recommendation-index" aria-hidden="true">
        <span>{kind === "now" ? "NOW" : "NEXT"}</span>
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
  const primary = recommendations.now ?? recommendations.next;
  const nextIsPrimary = primary.id === recommendations.next.id;

  return (
    <section className="curriculum-action-page" aria-labelledby="curriculum-action-title">
      <header className="curriculum-action-heading">
        <div>
          <h1 id="curriculum-action-title">先确认手里的这一页，再向前走。</h1>
          <p>
            这里不要求你先读完整张路线图。它只保留当前坐标、下一项学习任务，以及尚未开放的远景。
          </p>
        </div>
        <dl aria-label="学习路线原则">
          <div><dt>当前原则</dt><dd>先讲透机制</dd></div>
          <div><dt>实验起点</dt><dd>Stage 05</dd></div>
        </dl>
      </header>

      <div className="curriculum-action-desk">
        <section aria-labelledby="curriculum-now-title">
          <h2 id="curriculum-now-title">现在</h2>
          {recommendations.now ? (
            <RecommendationSheet recommendation={recommendations.now} kind="now" />
          ) : (
            <div className="curriculum-empty-now">
              <p>还没有进行中的课程。第一条可学习路径已经替你定位好。</p>
            </div>
          )}
        </section>

        <section aria-labelledby="curriculum-next-title">
          <h2 id="curriculum-next-title">下一步</h2>
          {nextIsPrimary && recommendations.now ? (
            <p className="curriculum-same-next">
              先完成上方正在进行的内容；罗盘会在章节与阶段变化时自动更新精确位置。
            </p>
          ) : (
            <RecommendationSheet recommendation={recommendations.next} kind="next" />
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
