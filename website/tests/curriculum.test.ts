import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CurriculumPlan, deriveCurriculumLearnerStatus } from "@/components/curriculum";
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
});
