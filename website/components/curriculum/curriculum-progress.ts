import {
  courseProgressManifests,
  sampleToGenerationCourse,
  slimeCurriculum,
  type Curriculum,
  type CurriculumLearnerStatusMap,
  type CurriculumRecommendation,
  type CurriculumRecommendations,
} from "../../content/zh";
import {
  evaluateLessonProgressV2,
  type LocalProgressV2,
} from "../../core/progress";

export function deriveCurriculumLearnerStatus(
  progress: LocalProgressV2,
): CurriculumLearnerStatusMap {
  const introStatus = evaluateLessonProgressV2(
    progress.lessons["core.sample-journey"],
    courseProgressManifests["core.sample-journey"],
  ).status;
  const generationStatus = evaluateLessonProgressV2(
    progress.lessons["core.sample-to-generation"],
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
  const lesson = progress.lessons["core.sample-journey"];
  const resume = lesson?.resume?.kind === "sample-journey" ? lesson.resume : null;
  const route = resume
    ? appendQueryAndHash("/learn/sample-journey", {
        event: resume.event_id,
        sample: resume.selected_sample_id,
        timeline: resume.timeline_mode,
      })
    : "/learn/sample-journey";
  return {
    id: "system-intro",
    stageId: "system-intro",
    title: "系统导论：一条 Sample 的七幕旅程",
    description: "先建立完整闭环地图，知道生成、评价、训练与权重发布各自接住什么。",
    position: resume ? `继续到事件 ${resume.event_id}` : "从第一幕建立全局坐标",
    actionLabel: status === "review_required" ? "按新版复习系统导论" : status === "in_progress" ? "继续系统导论" : "进入系统导论",
    route,
    status,
  };
}

function generationRecommendation(
  progress: LocalProgressV2,
  status: CurriculumRecommendation["status"],
): CurriculumRecommendation {
  const lesson = progress.lessons["core.sample-to-generation"];
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
  const position = chapter
    ? `第 ${chapter.number} 章 / ${chapter.title}${resume?.section_id ? ` / ${resume.section_id}` : ""}`
    : "从课程封面选择第一章";
  return {
    id: "core.sample-to-generation",
    stageId: "core-mechanisms",
    courseId: "core.sample-to-generation",
    title: sampleToGenerationCourse.metadata.title,
    description: "沿 Dataset、DataSource 与 SGLang 的真实边界，重建一条 Sample 得到回答的机制。",
    position,
    actionLabel: status === "review_required" ? "按新版继续这门课" : status === "in_progress" ? "继续精确位置" : "开始首门机制课",
    route,
    status,
  };
}

function activityTime(progress: LocalProgressV2, lessonId: string) {
  const timestamp = progress.lessons[lessonId]?.updated_at;
  return timestamp ? Date.parse(timestamp) : Number.NEGATIVE_INFINITY;
}

/**
 * Derive the learner's action queue without inventing routes for planned work.
 * Optional preflight remains available elsewhere but never outranks core study.
 */
export function deriveCurriculumRecommendations(
  progress: LocalProgressV2,
  curriculum: Curriculum = slimeCurriculum,
): CurriculumRecommendations {
  const status = deriveCurriculumLearnerStatus(progress);
  const intro = introRecommendation(progress, status["system-intro"] ?? "not_started");
  const generation = generationRecommendation(
    progress,
    status["core.sample-to-generation"] ?? "not_started",
  );
  const active = [intro, generation]
    .filter((item) => item.status === "in_progress" || item.status === "review_required")
    .sort((left, right) => {
      const leftLesson = left.courseId ?? "core.sample-journey";
      const rightLesson = right.courseId ?? "core.sample-journey";
      return activityTime(progress, rightLesson) - activityTime(progress, leftLesson);
    });
  const ordered = [intro, generation];
  const next = ordered.find((item) => item.status !== "completed") ?? generation;
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
    now: active[0] ?? null,
    next,
    later,
  };
}
