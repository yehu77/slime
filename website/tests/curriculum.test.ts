import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CurriculumActionPage,
  CurriculumPlan,
  deriveCurriculumLearnerStatus,
  deriveCurriculumRecommendations,
} from "@/components/curriculum";
import { courseProgressManifests } from "@/content/zh";
import { slimeCurriculum } from "@/content/zh/curriculum";
import { sampleToGenerationCourse } from "@/content/zh/lessons/sample-to-generation";
import { applyLessonProgressEvent, createEmptyLocalProgressV2 } from "@/core/progress";

describe("global curriculum contract", () => {
  it("keeps the learner-locked seven-stage order", () => {
    expect(slimeCurriculum.stages.map((stage) => stage.id)).toEqual([
      "preflight",
      "system-intro",
      "core-mechanisms",
      "comprehensive-trace-check",
      "minimal-experiments",
      "modify-slime",
      "async-correctness-performance",
    ]);
    expect(slimeCurriculum.stages.map((stage) => stage.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(slimeCurriculum.stages[0]).toMatchObject({
      optional: true,
      route: "/start#preflight",
    });
    expect(slimeCurriculum.stages[4].topics).toEqual(
      expect.arrayContaining(["CPU contract", "0.5B smoke"]),
    );
  });

  it("places five courses in stage three and opens only the first mechanism course", () => {
    const coreStage = slimeCurriculum.stages.find((stage) => stage.id === "core-mechanisms");
    const availableCourses = coreStage?.courses?.filter(
      (course) => course.availability === "available",
    );
    const primary = coreStage?.courses?.find(
      (course) => course.id === slimeCurriculum.primaryCourseId,
    );

    expect(coreStage?.courses).toHaveLength(5);
    expect(availableCourses).toHaveLength(1);
    expect(primary).toMatchObject({
      id: "core.sample-to-generation",
      order: 1,
      route: "/learn/sample-to-generation",
    });
    expect(primary?.chapterTitles).toEqual(
      sampleToGenerationCourse.chapters.map((chapter) => chapter.title),
    );
    expect(primary?.chapterTitles).toHaveLength(6);
  });

  it("keeps prerequisites advisory, backward-only, and planned entries unlinkable", () => {
    const stageOrder = new Map(
      slimeCurriculum.stages.map((stage) => [stage.id, stage.order]),
    );
    const coreStage = slimeCurriculum.stages.find((stage) => stage.id === "core-mechanisms");
    const courseOrder = new Map(
      coreStage?.courses?.map((course) => [course.id, course.order]) ?? [],
    );

    expect(slimeCurriculum.prerequisitePolicy).toBe("advisory");
    for (const stage of slimeCurriculum.stages) {
      for (const prerequisiteId of stage.prerequisiteStageIds) {
        expect(stageOrder.get(prerequisiteId)).toBeLessThan(stage.order);
      }
      if (stage.availability === "planned") expect(stage.route).toBeNull();
    }
    for (const course of coreStage?.courses ?? []) {
      for (const prerequisiteId of course.prerequisiteCourseIds) {
        expect(courseOrder.get(prerequisiteId)).toBeLessThan(course.order);
      }
      if (course.availability === "planned") expect(course.route).toBeNull();
    }

    const html = renderToStaticMarkup(
      createElement(CurriculumPlan, { curriculum: slimeCurriculum }),
    );
    expect(html.match(/<a\b/g) ?? []).toHaveLength(3);
    expect(html).toContain("综合机制检查：读懂并诊断一条完整 trace");
    expect(html).toContain("路线开放后提供入口");
    expect(html).toContain("尚未开放");
  });

  it("renders all seven stages compactly and accepts injected learner status", () => {
    const html = renderToStaticMarkup(
      createElement(CurriculumPlan, {
        curriculum: slimeCurriculum,
        variant: "compact",
        currentStageId: "system-intro",
        learnerStatusByUnit: {
          "system-intro": "completed",
          "core.sample-to-generation": "review_required",
        },
      }),
    );

    expect(html).toContain('data-curriculum-id="slime-lab.curriculum.v1"');
    expect(html).toContain('data-stage-id="system-intro"');
    expect(html).toContain('data-course-id="core.sample-to-generation"');
    expect(html).toContain("重新阅读");
    expect(html).toContain("内容已修订 · 建议复习");
    expect(html).toContain("按新版本复习");
    expect(html).toContain('href="/learn"');
    expect(html.match(/data-stage-id=/g) ?? []).toHaveLength(7);
    expect(html.match(/data-course-id=/g) ?? []).toHaveLength(5);
  });

  it("derives route labels from lesson-keyed v2 progress", () => {
    const progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      courseProgressManifests["core.sample-to-generation"],
      { type: "section-visited", section_id: sampleToGenerationCourse.chapters[0].id },
      () => "2026-08-21T00:00:00.000Z",
    );

    expect(deriveCurriculumLearnerStatus(progress)).toMatchObject({
      "system-intro": "not_started",
      "core.sample-to-generation": "in_progress",
      "core-mechanisms": "in_progress",
    });
  });

  it("derives an exact Now resume and keeps planned work unlinkable", () => {
    let progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      courseProgressManifests["core.sample-to-generation"],
      { type: "section-visited", section_id: "stg.chapter-3" },
      () => "2026-08-25T12:00:00.000Z",
    );
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      courseProgressManifests["core.sample-to-generation"],
      {
        type: "resume-updated",
        resume: {
          kind: "chaptered",
          chapter_id: "stg.chapter-3",
          section_id: "model",
        },
      },
      () => "2026-08-25T12:01:00.000Z",
    );

    const recommendations = deriveCurriculumRecommendations(progress);
    expect(recommendations.now).toMatchObject({
      id: "core.sample-to-generation",
      position: expect.stringContaining("第 3 章"),
      route:
        "/learn/sample-to-generation?chapter=group-without-aliasing#model",
    });
    expect(recommendations.next.id).toBe("system-intro");
    expect(recommendations.later.map((item) => item.id)).toEqual([
      "core.generation-to-reward",
      "core.reward-to-train-data",
      "core.train-data-to-parameter-update",
      "core.weight-sync-to-next-rollout",
      "comprehensive-trace-check",
      "minimal-experiments",
      "modify-slime",
      "async-correctness-performance",
    ]);
    expect(recommendations.later.every((item) => !("route" in item))).toBe(true);
  });

  it("chooses Now by latest activity but keeps Next in curriculum order", () => {
    let progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-journey",
      courseProgressManifests["core.sample-journey"],
      { type: "section-visited", section_id: "act-1" },
      () => "2026-08-25T12:00:00.000Z",
    );
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      courseProgressManifests["core.sample-to-generation"],
      { type: "section-visited", section_id: "stg.chapter-1" },
      () => "2026-08-25T12:05:00.000Z",
    );

    const recommendations = deriveCurriculumRecommendations(progress);
    expect(recommendations.now?.id).toBe("core.sample-to-generation");
    expect(recommendations.next.id).toBe("system-intro");
  });

  it("starts the action queue at the non-optional system introduction", () => {
    const recommendations = deriveCurriculumRecommendations(
      createEmptyLocalProgressV2(),
    );
    expect(recommendations.now).toBeNull();
    expect(recommendations.next).toMatchObject({
      id: "system-intro",
      route: "/learn/sample-journey",
    });

    const html = renderToStaticMarkup(
      createElement(CurriculumActionPage, {
        curriculum: slimeCurriculum,
        recommendations,
        learnerStatusByUnit: {},
      }),
    );
    expect(html).toContain("现在");
    expect(html).toContain("下一步");
    expect(html).toContain("展开完整七阶段路线");
    expect(html).toContain('href="/learn/sample-journey"');
    expect(html).toContain("从生成完成到评价与按组收回");
    expect(html).toContain("计划中");
    expect(html).not.toContain('href="/learn/reward');
    expect(html).not.toContain('href="null"');
  });
});
