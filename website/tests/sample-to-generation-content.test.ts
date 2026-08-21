import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  gradeFinalAssessment,
  gradeStructuredExercise,
  type StructuredExercise,
  type StructuredExerciseAnswer,
} from "@/core/sample-to-generation";
import {
  sampleToGenerationChapters,
  sampleToGenerationCourse,
  sampleToGenerationFinalAssessment,
  sampleToGenerationSourceEvidence,
} from "@/content/zh/lessons/sample-to-generation";
import anchorsPayload from "@/data/source-refs/slime-06ffdbe2.anchors.generated.json";
import refsPayload from "@/data/source-refs/slime-06ffdbe2.refs.json";

function correctAnswer(exercise: StructuredExercise): StructuredExerciseAnswer {
  switch (exercise.kind) {
    case "choice":
      return { kind: "choice", selectedOptionIds: exercise.correctOptionIds };
    case "ordering":
      return { kind: "ordering", orderedItemIds: exercise.correctOrder };
    case "mapping":
      return { kind: "mapping", mapping: exercise.correctMapping };
    case "field-entry":
      return {
        kind: "field-entry",
        values: Object.fromEntries(
          exercise.fields.map((field) => [field.id, field.acceptedAnswers[0]]),
        ),
      };
  }
}

describe("sample-to-generation course contract", () => {
  it("publishes six detailed chapters totaling 78 minutes plus a 10-minute assessment", () => {
    expect(sampleToGenerationChapters).toHaveLength(6);
    expect(
      sampleToGenerationChapters.reduce(
        (total, chapter) => total + chapter.durationMinutes,
        0,
      ),
    ).toBe(78);
    expect(sampleToGenerationCourse.metadata.durationMinutes).toEqual({
      chapters: 78,
      assessment: 10,
      total: 88,
    });
    expect(sampleToGenerationCourse.metadata.requiresGpu).toBe(false);
    expect(sampleToGenerationCourse.metadata.sourceBaseline.commit).toBe(
      "06ffdbe22be068b52f9ed0fc318c473f7030197e",
    );
  });

  it("gives every chapter the same evidence-first teaching sequence", () => {
    for (const [index, chapter] of sampleToGenerationChapters.entries()) {
      expect(chapter.number).toBe(index + 1);
      expect(chapter.conclusion.length).toBeGreaterThan(20);
      expect(chapter.boundary.input.length).toBeGreaterThan(0);
      expect(chapter.boundary.output.length).toBeGreaterThan(0);
      expect(chapter.boundary.excluded.length).toBeGreaterThan(0);
      expect(chapter.stateTransition.before.length).toBeGreaterThan(0);
      expect(chapter.stateTransition.operation.length).toBeGreaterThan(0);
      expect(chapter.stateTransition.after.length).toBeGreaterThan(0);
      expect(chapter.explanation.length).toBeGreaterThanOrEqual(3);
      expect(chapter.sourceRefIds.length).toBeGreaterThan(0);
      expect(gradeStructuredExercise(chapter.exercise, correctAnswer(chapter.exercise)).correct).toBe(true);
      expect(chapter.misconception.correction.length).toBeGreaterThan(20);
      expect(chapter.takeaway.length).toBeGreaterThan(10);
      expect(chapter.transition.length).toBeGreaterThan(10);
    }
    expect(new Set(sampleToGenerationChapters.map((chapter) => chapter.exercise.kind))).toEqual(
      new Set(["choice", "ordering", "mapping", "field-entry"]),
    );
  });

  it("requires 7/8 with q2, q4, q6 and q8 all correct", () => {
    expect(sampleToGenerationFinalAssessment).toHaveLength(8);
    const allCorrect = Object.fromEntries(
      sampleToGenerationFinalAssessment.map((exercise) => [
        exercise.id,
        correctAnswer(exercise),
      ]),
    );
    const perfect = gradeFinalAssessment(
      sampleToGenerationFinalAssessment,
      allCorrect,
      sampleToGenerationCourse.completion,
    );
    expect(perfect).toMatchObject({ score: 8, total: 8, passed: true });

    const optionalMiss = {
      ...allCorrect,
      "stg.final-q1": { kind: "choice", selectedOptionIds: ["same"] } as const,
    };
    expect(
      gradeFinalAssessment(
        sampleToGenerationFinalAssessment,
        optionalMiss,
        sampleToGenerationCourse.completion,
      ),
    ).toMatchObject({ score: 7, passed: true });

    const requiredMiss = {
      ...allCorrect,
      "stg.final-q2": {
        kind: "field-entry",
        values: { groups: "12", samples: "3" },
      } as const,
    };
    expect(
      gradeFinalAssessment(
        sampleToGenerationFinalAssessment,
        requiredMiss,
        sampleToGenerationCourse.completion,
      ),
    ).toMatchObject({
      score: 7,
      passed: false,
      missingRequiredCorrectIds: ["stg.final-q2"],
    });
  });

  it("resolves every course evidence ref and verifies generated 8–20 line excerpts", () => {
    const refs = new Map(refsPayload.refs.map((ref) => [ref.id, ref]));
    const anchors = new Map(
      anchorsPayload.anchors.map((anchor) => [anchor.id, anchor]),
    );
    const usedRefIds = new Set([
      ...sampleToGenerationChapters.flatMap((chapter) => chapter.sourceRefIds),
      ...sampleToGenerationFinalAssessment.flatMap(
        (exercise) => exercise.sourceRefIds,
      ),
    ]);
    for (const refId of usedRefIds) {
      expect(refs.has(refId), `missing source ref ${refId}`).toBe(true);
      expect(anchors.has(refId), `missing generated anchor ${refId}`).toBe(true);
    }

    for (const evidence of sampleToGenerationSourceEvidence) {
      const anchor = anchors.get(evidence.sourceRefId);
      expect(anchor, `missing anchor ${evidence.sourceRefId}`).toBeDefined();
      expect(anchor).toHaveProperty("guided_excerpt");
      const excerpt = (anchor as NonNullable<typeof anchor> & {
        guided_excerpt: {
          code: string;
          start_line: number;
          end_line: number;
          snippet_sha256: string;
        };
      }).guided_excerpt;
      expect(excerpt.end_line - excerpt.start_line + 1).toBeGreaterThanOrEqual(8);
      expect(excerpt.end_line - excerpt.start_line + 1).toBeLessThanOrEqual(20);
      expect(createHash("sha256").update(excerpt.code).digest("hex")).toBe(
        excerpt.snippet_sha256,
      );
    }
  });

  it("labels every deterministic model-dependent value as teaching data", () => {
    expect(sampleToGenerationCourse.teachingValuesNotice).toMatch(
      /教学 fixture|不来自真实 checkpoint/,
    );
    expect(sampleToGenerationCourse.metadata.summary).toMatch(/固定 2×2 trace/);
  });
});
