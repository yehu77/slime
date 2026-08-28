import {
  courseProgressManifests,
  sampleJourneyMessages,
  sampleToGenerationCourse,
  slimeCurriculum,
  systemIntroManifest,
  type Curriculum,
  type CurriculumLearnerStatusMap,
  type CurriculumRecommendation,
  type CurriculumRecommendations,
} from "../../content/zh";
import {
  discardOutdatedLessonProgressV2,
  evaluateLessonProgressV2,
  type LocalProgressV2,
} from "../../core/progress";

export function deriveCurriculumLearnerStatus(
  progress: LocalProgressV2,
): CurriculumLearnerStatusMap {
  const currentProgress = discardOutdatedLessonProgressV2(
    progress,
    courseProgressManifests,
  );
  const introStatus = evaluateLessonProgressV2(
    currentProgress.lessons["core.sample-journey"],
    courseProgressManifests["core.sample-journey"],
  ).status;
  const generationStatus = evaluateLessonProgressV2(
    currentProgress.lessons["core.sample-to-generation"],
    courseProgressManifests["core.sample-to-generation"],
  ).status;

  return {
    "system-intro": introStatus,
    "core.sample-to-generation": generationStatus,
    "core-mechanisms": generationStatus === "completed" ? "in_progress" : generationStatus,
  };
}

function appendQueryAndHash(
  route: string,
  query: Record<string, string>,
  hash?: string | null,
) {
  const search = new URLSearchParams(query).toString();
  return `${route}${search ? `?${search}` : ""}${hash ? `#${encodeURIComponent(hash)}` : ""}`;
}

function introRecommendation(
  progress: LocalProgressV2,
  status: CurriculumRecommendation["status"],
): CurriculumRecommendation {
  const lesson = status === "not_started"
    ? undefined
    : progress.lessons["core.sample-journey"];
  const resume = lesson?.resume?.kind === "sample-journey" ? lesson.resume : null;
  const unitId = resume?.unit_id ?? "loop-boundary";
  const unit = systemIntroManifest.units.find((candidate) => candidate.id === unitId);
  const route = resume
    ? appendQueryAndHash(
        "/learn/sample-journey",
        unitId === "sample-probe"
          ? {
              unit: unitId,
              event: resume.event_id,
              sample: resume.selected_sample_id,
              timeline: resume.timeline_mode,
            }
          : { unit: unitId },
        resume.phase_id ?? "orient",
      )
    : "/learn/sample-journey";
  const eventTitle = resume && unitId === "sample-probe"
    ? sampleJourneyMessages[`sample-journey.event.${resume.event_id}.title`]
    : null;
  return {
    id: "system-intro",
    stageId: "system-intro",
    title: "系统导论：为什么 slime 不是一条训练脚本",
    description: "先区分控制骨架、后端职责、空间与时间，再用 Sample trace 核对系统边界。",
    position: eventTitle ? `上次停在：${eventTitle}` : unit ? `上次停在：${unit.title}` : "从一次权重版本事故建立系统边界",
    actionLabel: status === "in_progress" ? "继续系统导论" : "进入系统导论",
    route,
    status,
  };
}

function generationRecommendation(
  progress: LocalProgressV2,
  status: CurriculumRecommendation["status"],
): CurriculumRecommendation {
  const lesson = status === "not_started"
    ? undefined
    : progress.lessons["core.sample-to-generation"];
  const resume = lesson?.resume?.kind === "chaptered" ? lesson.resume : null;
  const chapter = resume
    ? sampleToGenerationCourse.chapters.find((item) => item.id === resume.chapter_id)
    : undefined;
  const route = chapter
    ? appendQueryAndHash(
        sampleToGenerationCourse.metadata.route,
        { chapter: chapter.slug },
        resume?.section_id,
      )
    : sampleToGenerationCourse.metadata.route;
  const phaseLabel = {
    orient: "章节开场",
    model: "机制讲解",
    verify: "源码核证",
    practice: "练习与迁移",
  }[resume?.section_id ?? ""];
  const position = chapter
    ? `第 ${chapter.number} 章 · ${chapter.title}${phaseLabel ? ` · ${phaseLabel}` : ""}`
    : "从课程封面选择第一章";
  return {
    id: "core.sample-to-generation",
    stageId: "core-mechanisms",
    courseId: "core.sample-to-generation",
    title: sampleToGenerationCourse.metadata.title,
    description: "沿 Dataset、DataSource 与 SGLang 的真实边界，重建一条 Sample 得到回答的机制。",
    position,
    actionLabel: status === "in_progress" ? "继续上次位置" : "开始首门机制课",
    route,
    status,
  };
}

function activityTime(progress: LocalProgressV2, lessonId: string) {
  const timestamp = progress.lessons[lessonId]?.updated_at;
  return timestamp ? Date.parse(timestamp) : Number.NEGATIVE_INFINITY;
}

/**
 * Derive two deliberately separate queues:
 * - continue: the most recently active current-version lesson;
 * - next: the first not-started open lesson after `continue`, or the first one when idle;
 *
 * Outdated lesson records are discarded before recommendations are derived.
 * Optional preflight remains available elsewhere but never outranks core study.
 */
export function deriveCurriculumRecommendations(
  progress: LocalProgressV2,
  curriculum: Curriculum = slimeCurriculum,
): CurriculumRecommendations {
  const currentProgress = discardOutdatedLessonProgressV2(
    progress,
    courseProgressManifests,
  );
  const status = deriveCurriculumLearnerStatus(currentProgress);
  const intro = introRecommendation(currentProgress, status["system-intro"] ?? "not_started");
  const generation = generationRecommendation(
    currentProgress,
    status["core.sample-to-generation"] ?? "not_started",
  );
  const ordered = [intro, generation];
  const active = ordered
    .filter((item) => item.status === "in_progress")
    .sort((left, right) => {
      const leftLesson = left.courseId ?? "core.sample-journey";
      const rightLesson = right.courseId ?? "core.sample-journey";
      return (
        activityTime(currentProgress, rightLesson) - activityTime(currentProgress, leftLesson) ||
        ordered.findIndex((item) => item.id === right.id) -
          ordered.findIndex((item) => item.id === left.id)
      );
    });
  const continueRecommendation = active[0] ?? null;
  const continueIndex = continueRecommendation
    ? ordered.findIndex((item) => item.id === continueRecommendation.id)
    : -1;
  const furthestTouchedIndex = ordered.reduce(
    (furthest, item, index) => item.status === "not_started" ? furthest : index,
    -1,
  );
  const routeAnchorIndex = Math.max(continueIndex, furthestTouchedIndex);
  const nextCandidates = ordered.slice(routeAnchorIndex + 1);
  const next = nextCandidates.find(
    (item) => item.status === "not_started",
  ) ?? null;
  const later = curriculum.stages.flatMap((stage) => [
    ...(stage.courses ?? [])
      .filter((course) => course.availability === "planned")
      .map((course) => ({
        id: course.id,
        orderLabel: `${String(stage.order).padStart(2, "0")}.${course.order}`,
        shortTitle: course.title,
        question: course.question,
        context: stage.shortTitle,
      })),
    ...(stage.availability === "planned"
      ? [{
          id: stage.id,
          orderLabel: String(stage.order).padStart(2, "0"),
          shortTitle: stage.shortTitle,
          question: stage.question,
          context: "课程阶段",
        }]
      : []),
  ]);

  return {
    continue: continueRecommendation,
    next,
    later,
  };
}
