import { describe, expect, it } from "vitest";

import {
  gradeFinalAssessment,
  gradeStructuredExercise,
  type StructuredExercise,
  type StructuredExerciseAnswer,
} from "@/core/sample-to-generation";
import {
  systemIntroFinalAssessment,
  systemIntroManifest,
  systemIntroTraceStations,
} from "@/content/zh/lessons/system-intro";
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

describe("system intro authority and teaching contract", () => {
  it("publishes a six-unit continuous reader against the pinned source baseline", () => {
    expect(systemIntroManifest).toMatchObject({
      id: "core.sample-journey",
      route: "/learn/sample-journey",
      lessonRevision: 8,
      assessmentVersion: 3,
      duration: { core: "35–45 分钟", research: "约 60 分钟" },
      sourceBaseline: {
        shortCommit: "06ffdbe2",
        commit: "06ffdbe22be068b52f9ed0fc318c473f7030197e",
      },
    });
    expect(systemIntroManifest.units.map((unit) => unit.id)).toEqual([
      "loop-boundary",
      "stable-skeleton",
      "backend-roles",
      "placement-and-time",
      "sample-probe",
      "architecture-reconstruction",
    ]);
    expect(systemIntroManifest.units.map((unit) => unit.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      systemIntroManifest.units.reduce((minutes, unit) => minutes + unit.durationMinutes, 0),
    ).toBe(45);
    expect(new Set(systemIntroManifest.units.map((unit) => unit.visualForm)).size).toBe(6);
  });

  it("gives every unit four stable phases, bounded evidence and resolvable pinned refs", () => {
    const refIds = new Set(refsPayload.refs.map((ref) => ref.id));
    const anchorIds = new Set(anchorsPayload.anchors.map((anchor) => anchor.id));
    const expectedPhaseIds = ["orient", "model", "verify", "practice"];
    const evidenceKinds = new Set<string>();

    for (const unit of systemIntroManifest.units) {
      expect(Object.keys(unit.phaseLabels)).toEqual(expectedPhaseIds);
      expect(new Set(Object.values(unit.phaseLabels)).size).toBe(4);
      expect(unit.drivingQuestion.length).toBeGreaterThan(10);
      expect(unit.model.length).toBeGreaterThanOrEqual(3);
      expect(unit.claims.length).toBeGreaterThan(0);
      expect(unit.sourceRefIds.length).toBeGreaterThan(0);

      for (const claim of unit.claims) {
        evidenceKinds.add(claim.evidenceKind);
        expect(["author-intent", "pinned-source", "teaching-inference"]).toContain(
          claim.evidenceKind,
        );
        expect(claim.statement.length).toBeGreaterThan(15);
        expect(claim.scope.length).toBeGreaterThan(10);
        expect(claim.canConclude.length).toBeGreaterThan(10);
        expect(claim.cannotConclude.length).toBeGreaterThan(10);
        expect(claim.sourceRefIds.length).toBeGreaterThan(0);
        if (claim.evidenceKind === "author-intent") {
          expect(claim.sourceLinks?.length).toBeGreaterThan(0);
        }
        for (const sourceRefId of claim.sourceRefIds) {
          expect(refIds.has(sourceRefId), `missing claim source ref ${sourceRefId}`).toBe(true);
          expect(anchorIds.has(sourceRefId), `missing claim source anchor ${sourceRefId}`).toBe(true);
        }
      }

      for (const sourceRefId of unit.sourceRefIds) {
        expect(refIds.has(sourceRefId), `missing source ref ${sourceRefId}`).toBe(true);
        expect(anchorIds.has(sourceRefId), `missing source anchor ${sourceRefId}`).toBe(true);
      }
    }
    expect(evidenceKinds).toEqual(
      new Set(["author-intent", "pinned-source", "teaching-inference"]),
    );
  });

  it("keeps the placement/time axes separate without overclaiming the pinned matrix", () => {
    const unit = systemIntroManifest.units.find((candidate) => candidate.id === "placement-and-time");
    expect(unit).toBeDefined();
    expect(unit?.model.join(" ")).toContain("assert not args.colocate");
    expect(unit?.claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "axes.async-colocate-unsupported",
          evidenceKind: "pinned-source",
          sourceRefIds: ["loop.async"],
          cannotConclude: expect.stringContaining("后续版本"),
        }),
      ]),
    );

    const question = systemIntroFinalAssessment.find(
      (exercise) => exercise.id === "system-intro-q4",
    );
    expect(question).toMatchObject({ kind: "mapping" });
    if (!question || question.kind !== "mapping") {
      throw new Error("system-intro-q4 must be a mapping exercise");
    }
    expect(question.correctMapping["async-colocate"]).toBe("unsupported");
    expect(
      gradeStructuredExercise(question, {
        kind: "mapping",
        mapping: { ...question.correctMapping, "async-colocate": "asynchronous" },
      }),
    ).toMatchObject({ correct: false, fieldResults: { "async-colocate": false } });
  });

  it("compresses the seven-act fixture into read, produce and pass-to stations", () => {
    const refIds = new Set(refsPayload.refs.map((ref) => ref.id));
    expect(systemIntroTraceStations).toHaveLength(7);
    expect(systemIntroTraceStations.map((station) => station.actNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const station of systemIntroTraceStations) {
      expect(station.reads.length).toBeGreaterThan(0);
      expect(station.produces.length).toBeGreaterThan(0);
      expect(station.passesTo.length).toBeGreaterThan(0);
      expect(station.systemMeaning.length).toBeGreaterThan(15);
      expect(station.sourceRefIds.length).toBeGreaterThan(0);
      expect(station.sourceRefIds.every((sourceRefId) => refIds.has(sourceRefId))).toBe(true);
    }

    const conversion = systemIntroTraceStations.find(
      (station) => station.id === "sample-to-train-data",
    );
    expect(conversion).toMatchObject({
      produces: expect.arrayContaining(["独立 train-data 表示"]),
      outsideSample: expect.arrayContaining(["trainer batch"]),
      systemMeaning: expect.stringContaining("不是继续填写 Sample"),
    });

    const sampleProbe = systemIntroManifest.units.find((unit) => unit.id === "sample-probe");
    expect(sampleProbe?.traceStationIds).toEqual(
      systemIntroTraceStations.map((station) => station.id),
    );
  });

  it("requires five of six assessment answers and keeps questions 1, 4 and 6 mandatory", () => {
    expect(systemIntroManifest.finalAssessment).toMatchObject({
      id: "core.sample-journey.architecture-v3",
      version: 3,
      completion: {
        minCorrect: 5,
        requiredQuestionIds: ["system-intro-q1", "system-intro-q4", "system-intro-q6"],
        unlimitedRetries: true,
        passedResultIsSticky: true,
      },
    });
    expect(systemIntroFinalAssessment).toHaveLength(6);

    const correctAnswers = Object.fromEntries(
      systemIntroFinalAssessment.map((exercise) => [exercise.id, correctAnswer(exercise)]),
    );
    expect(
      gradeFinalAssessment(systemIntroFinalAssessment, correctAnswers, {
        minCorrect: 5,
        requiredQuestionIds: ["system-intro-q1", "system-intro-q4", "system-intro-q6"],
      }),
    ).toMatchObject({ score: 6, total: 6, passed: true });

    const missingRequired = { ...correctAnswers };
    delete missingRequired["system-intro-q4"];
    expect(
      gradeFinalAssessment(systemIntroFinalAssessment, missingRequired, {
        minCorrect: 5,
        requiredQuestionIds: ["system-intro-q1", "system-intro-q4", "system-intro-q6"],
      }),
    ).toMatchObject({
      score: 5,
      passed: false,
      missingRequiredCorrectIds: ["system-intro-q4"],
    });
  });

  it("keeps the final handoff narrow instead of repeating the whole curriculum", () => {
    expect(systemIntroManifest.handoff).toEqual({
      title: "下一步：放大 Sample 到 generation 的机制",
      body: expect.stringContaining("Dataset row → Sample → DataSource → SGLang"),
      route: "/learn/sample-to-generation",
      curriculumRoute: "/learn",
    });
  });
});
