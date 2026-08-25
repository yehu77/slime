import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  gradeFinalAssessment,
  gradeStructuredExercise,
  sampleToGenerationFixture,
  seekSampleToGeneration,
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
import {
  hasChapterOneTranslationData,
  hasChapterThreeGroupingData,
  hasChapterTwoProvenanceData,
} from "@/components/mechanism/chapter-reader-contracts";

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

  it("models chapter one as four explicit translation lanes with unique targets", () => {
    const chapter = sampleToGenerationChapters[0];
    expect(chapter.slug).toBe("row-to-sample");
    expect(chapter.scopeLabel).toMatch(/教学基线/);
    expect(chapter.objective).toMatch(/初始 Sample 投影/);
    expect(chapter.stateTransition.after).toContain("loss_mask=None");
    expect(chapter.stateTransition.after).toContain("metadata 字段值来自 row");

    expect(chapter.mappingLanes?.map((lane) => lane.id)).toEqual([
      "prompt-lane",
      "label-lane",
      "metadata-lane",
      "defaults-lane",
    ]);
    const targets = chapter.mappingLanes?.flatMap((lane) => lane.target.fields) ?? [];
    expect(new Set(targets.map((target) => target.field)).size).toBe(targets.length);
    expect(Object.fromEntries(targets.map((target) => [target.field, target.value]))).toEqual({
      prompt: "\"3 + 2 = ?\"",
      label: "\"5\"",
      metadata: "{source_name: \"mechanism_course\", difficulty: \"warmup\"}",
      group_index: "None",
      index: "None",
      tokens: "[]",
      response: "\"\"",
      response_length: "0",
      reward: "None",
      loss_mask: "None",
      weight_versions: "[]",
      rollout_log_probs: "None",
      status: "pending",
      train_metadata: "None",
    });
    const fixtureRow = sampleToGenerationFixture.rows.find((row) => row.origin_id === "origin-a");
    expect(JSON.parse(chapter.tracePassport?.origin.rowCode ?? "null")).toEqual({
      text: fixtureRow?.text,
      label: fixtureRow?.label,
      metadata: fixtureRow?.metadata,
    });
    expect(chapter.tracePassport?.origin.rowShape).toBe("row{text, label, metadata}");

    const groups = chapter.defaultFieldGroups ?? [];
    expect(groups.map((group) => group.id)).toEqual(["dataset-explicit", "dataclass-default"]);
    expect(groups.find((group) => group.id === "dataset-explicit")?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "multimodal_inputs", value: "None" }),
        expect.objectContaining({
          field: "metadata",
          interpretation: expect.stringContaining("不追踪 Python 对象身份"),
        }),
      ]),
    );
    expect(chapter.tracePassport?.config.map((entry) => `${entry.key}=${entry.value}`).join(" ")).toMatch(
      /multimodal_keys \/ processor=None \/ None/,
    );
    const defaultFields = groups.find((group) => group.id === "dataclass-default")?.fields ?? [];
    expect(defaultFields.every((field) => Boolean(field.nextProducer))).toBe(true);
    expect(defaultFields.find((field) => field.field === "status")).toMatchObject({
      value: "pending",
      nextProducer: "generation 终止状态写回",
      interpretation: expect.stringContaining("不表示答案正确"),
    });
    expect(chapter.branch?.edgeCases.map((item) => item.behavior).join(" ")).toContain(
      "不会把编码写入 Sample.tokens",
    );

    const evidenceIds = [chapter.evidenceId, ...(chapter.additionalEvidenceIds ?? [])];
    for (const evidenceId of evidenceIds) {
      expect(
        sampleToGenerationSourceEvidence.some((evidence) => evidence.id === evidenceId),
        "missing chapter-one evidence " + evidenceId,
      ).toBe(true);
    }
  });

  it("selects dedicated readers only for complete chapter-one, chapter-two and chapter-three contracts", () => {
    const chapterOne = sampleToGenerationChapters[0];
    const chapterTwo = sampleToGenerationChapters[1];
    const chapterThree = sampleToGenerationChapters[2];

    expect(hasChapterOneTranslationData(chapterOne)).toBe(true);
    expect(hasChapterOneTranslationData({ ...chapterOne, mappingLanes: undefined })).toBe(false);
    expect(hasChapterOneTranslationData(chapterTwo)).toBe(false);

    expect(hasChapterTwoProvenanceData(chapterTwo)).toBe(true);
    expect(hasChapterTwoProvenanceData({
      ...chapterTwo,
      producerRelayStages: undefined,
    })).toBe(false);
    expect(hasChapterTwoProvenanceData(chapterOne)).toBe(false);

    expect(hasChapterThreeGroupingData(chapterThree)).toBe(true);
    expect(hasChapterThreeGroupingData({
      ...chapterThree,
      groupingAliasProbe: undefined,
    })).toBe(false);
    expect(hasChapterThreeGroupingData(chapterTwo)).toBe(false);
  });

  it("projects chapter three from the fixed 2×2 fixture without inventing identities", () => {
    const chapter = sampleToGenerationChapters[2];
    expect(chapter.slug).toBe("group-without-aliasing");
    expect(hasChapterThreeGroupingData(chapter)).toBe(true);
    if (!hasChapterThreeGroupingData(chapter)) {
      throw new Error("chapter three must provide its dedicated grouping contract");
    }

    const groupedState = seekSampleToGeneration(
      sampleToGenerationFixture,
      "groups-built",
    );
    expect(chapter.groupingLabGroups).toHaveLength(
      sampleToGenerationFixture.expected.groups,
    );
    expect(chapter.groupingLabGroups.map((group) => ({
      origin_id: group.originId,
      group_index: group.groupIndex,
      members: group.candidates.map((candidate) => ({
        sample_id: candidate.id,
        index: candidate.index,
      })),
    }))).toEqual(sampleToGenerationFixture.group_plan);

    for (const group of chapter.groupingLabGroups) {
      const row = sampleToGenerationFixture.rows.find(
        (candidate) => candidate.origin_id === group.originId,
      );
      expect(row).toBeDefined();
      expect(group).toMatchObject({
        prompt: row?.text,
        label: row?.label,
        metadata: row?.metadata,
      });
      for (const candidate of group.candidates) {
        expect(groupedState.samples[candidate.id]).toMatchObject({
          origin_id: group.originId,
          group_index: group.groupIndex,
          index: candidate.index,
          status: "pending",
          reward: null,
        });
      }
      expect(group.identityChecks).toHaveLength(2);
      expect(group.identityChecks.every((check) => check.result === false)).toBe(true);
      expect(group.identityChecks.map((check) => check.expression).join(" ")).not.toMatch(
        /Sample#|metadata#/,
      );
    }

    expect(chapter.groupingCounterFrames).toHaveLength(
      sampleToGenerationFixture.expected.physical_samples,
    );
    chapter.groupingCounterFrames.forEach((frame, index) => {
      const previous = chapter.groupingCounterFrames[index - 1];
      if (previous) {
        expect(frame.groupCounterBefore).toBe(previous.groupCounterAfter);
        expect(frame.sampleCounterBefore).toBe(previous.sampleCounterAfter);
      }
      expect(frame.sampleCounterAfter).toBe(frame.sampleCounterBefore + 1);
    });
    expect(chapter.groupingCounterFrames.at(-1)).toMatchObject({
      groupCounterAfter: 2,
      sampleCounterAfter: 4,
    });

    const probe = chapter.groupingAliasProbe;
    expect(probe.actualAfter).toEqual([
      expect.objectContaining({ sampleId: "a0", value: probe.mutatedValue }),
      expect.objectContaining({ sampleId: "a1", value: probe.fixtureValue }),
      expect.objectContaining({ sampleId: "origin-a seed", value: probe.fixtureValue }),
    ]);
    expect(probe.counterfactualAfter.every((item) => item.value === probe.mutatedValue)).toBe(true);

    expect(chapter.exercise).toMatchObject({
      id: "stg.chapter-3-identity-matrix-v2",
      kind: "field-entry",
    });
    expect(gradeStructuredExercise(chapter.exercise, correctAnswer(chapter.exercise)).correct).toBe(true);

    const refs = new Map(refsPayload.refs.map((ref) => [ref.id, ref]));
    const anchors = new Map(anchorsPayload.anchors.map((anchor) => [anchor.id, anchor]));
    expect(chapter.sourceRefIds).toEqual(expect.arrayContaining([
      "sample.identity-defaults",
      "rollout.datasource-counter-init",
      "rollout.datasource-get-samples",
    ]));
    for (const sourceRefId of chapter.sourceRefIds) {
      expect(refs.has(sourceRefId), `missing source ref ${sourceRefId}`).toBe(true);
      expect(anchors.has(sourceRefId), `missing source anchor ${sourceRefId}`).toBe(true);
    }
  });

  it("models chapter two as a fixed provenance relay with one lifecycle owner per raw field", () => {
    const chapter = sampleToGenerationChapters[1];
    expect(chapter.slug).toBe("field-ownership");
    expect(hasChapterTwoProvenanceData(chapter)).toBe(true);
    if (!hasChapterTwoProvenanceData(chapter)) {
      throw new Error("chapter two must provide its dedicated provenance contract");
    }

    expect(chapter.producerRelayStages.map((stage) => [stage.order, stage.id])).toEqual([
      [1, "dataset-construction"],
      [2, "datasource-fanout"],
      [3, "raw-generate"],
      [4, "reward-wrapper"],
      [5, "train-data-conversion"],
    ]);

    const fields = chapter.fieldLifecycleEntries;
    expect(new Set(fields.map((entry) => entry.id)).size).toBe(fields.length);
    expect(new Set(fields.map((entry) => entry.field)).size).toBe(fields.length);

    const allowedDefaultOnlyFields = fields.filter(
      (entry) => entry.firstNonDefaultProducer === null,
    );
    expect(allowedDefaultOnlyFields.length).toBeGreaterThan(0);
    expect(allowedDefaultOnlyFields.every((entry) => {
      const legalTerminal = entry.legalTerminal;
      return legalTerminal !== undefined &&
        legalTerminal.value === entry.dataclassDefault &&
        legalTerminal.condition.length > 0;
    })).toBe(true);

    const relayStageIds = new Set(
      chapter.producerRelayStages.map((stage) => stage.id),
    );
    for (const entry of fields) {
      expect(relayStageIds.has(entry.initializedBy.stageId)).toBe(true);
      const firstProducer = entry.firstNonDefaultProducer;
      if (firstProducer === null) continue;
      expect(firstProducer.mode).not.toBe("dataclass-default");
      expect(relayStageIds.has(firstProducer.stageId)).toBe(true);
    }

    const conversion = chapter.producerRelayStages.find(
      (stage) => stage.id === "train-data-conversion",
    );
    expect(conversion?.output.join(" ")).toMatch(/独立.*TrainData/);
    expect(conversion?.derivedOutputs?.map((output) => output.trainDataField)).toEqual([
      "tokens",
      "response_lengths",
      "rewards",
      "raw_reward",
      "truncated",
      "sample_indices",
      "rollout_ids",
      "loss_masks",
      "rollout_mask_sums",
      "rollout_log_probs",
      "metadata",
    ]);
    expect(conversion?.derivedOutputs?.find((output) => output.id === "train-rollout-ids")).toMatchObject({
      trainDataField: "rollout_ids",
      derivedFrom: ["Sample.rollout_id"],
    });
    const rawSampleFields = new Set(fields.map((entry) => entry.field));
    expect(
      [
        "response_lengths",
        "rewards",
        "raw_reward",
        "sample_indices",
        "rollout_ids",
        "loss_masks",
        "rollout_mask_sums",
      ].every((field) => !rawSampleFields.has(field)),
    ).toBe(true);
  });

  it("grades all three chapter-two early-read diagnostics and rejects partial or mismatched mappings", () => {
    const chapter = sampleToGenerationChapters[1];
    expect(hasChapterTwoProvenanceData(chapter)).toBe(true);
    if (!hasChapterTwoProvenanceData(chapter)) {
      throw new Error("chapter two must provide diagnostic cases");
    }
    const exercise = chapter.exercise;
    expect(exercise).toMatchObject({
      id: "stg.chapter-2-diagnosis-v2",
      kind: "mapping",
    });
    if (exercise.kind !== "mapping") throw new Error("unexpected chapter-two exercise kind");

    const expectedMapping = {
      "group-index-at-samples-constructed": "datasource-fanout",
      "status-at-groups-built": "raw-generate",
      "reward-at-responses-written": "reward-wrapper",
    };
    expect(chapter.earlyFieldDiagnosticCases.map((diagnosticCase) => [
      diagnosticCase.id,
      diagnosticCase.missingProducerStageId,
    ])).toEqual(Object.entries(expectedMapping));
    expect(exercise.items.map((item) => item.id)).toEqual(Object.keys(expectedMapping));
    expect(exercise.targets.map((target) => target.id)).toEqual(Object.values(expectedMapping));
    expect(exercise.correctMapping).toEqual(expectedMapping);

    expect(gradeStructuredExercise(exercise, {
      kind: "mapping",
      mapping: expectedMapping,
    })).toMatchObject({
      correct: true,
      fieldResults: {
        "group-index-at-samples-constructed": true,
        "status-at-groups-built": true,
        "reward-at-responses-written": true,
      },
    });
    expect(gradeStructuredExercise(exercise, {
      kind: "mapping",
      mapping: {
        "group-index-at-samples-constructed": "datasource-fanout",
        "status-at-groups-built": "raw-generate",
      },
    })).toMatchObject({
      correct: false,
      fieldResults: { "reward-at-responses-written": false },
    });
    expect(gradeStructuredExercise(exercise, {
      kind: "mapping",
      mapping: {
        "group-index-at-samples-constructed": "raw-generate",
        "status-at-groups-built": "datasource-fanout",
        "reward-at-responses-written": "reward-wrapper",
      },
    })).toMatchObject({
      correct: false,
      fieldResults: {
        "group-index-at-samples-constructed": false,
        "status-at-groups-built": false,
      },
    });
  });

  it("keeps every chapter-two relay, field, and diagnostic source ref resolvable", () => {
    const chapter = sampleToGenerationChapters[1];
    expect(hasChapterTwoProvenanceData(chapter)).toBe(true);
    if (!hasChapterTwoProvenanceData(chapter)) {
      throw new Error("chapter two must provide provenance sources");
    }
    const refs = new Map(refsPayload.refs.map((ref) => [ref.id, ref]));
    const anchors = new Map(
      anchorsPayload.anchors.map((anchor) => [anchor.id, anchor]),
    );
    const sourceRefIds = new Set([
      ...chapter.sourceRefIds,
      ...chapter.exercise.sourceRefIds,
      ...chapter.producerRelayStages.flatMap((stage) => stage.sourceRefIds),
      ...chapter.fieldLifecycleEntries.flatMap((entry) => entry.sourceRefIds),
      ...chapter.earlyFieldDiagnosticCases.flatMap((diagnosticCase) => diagnosticCase.sourceRefIds),
    ]);
    expect(sourceRefIds.has("rollout.convert-train-data")).toBe(true);
    for (const sourceRefId of sourceRefIds) {
      expect(refs.has(sourceRefId), `missing source ref ${sourceRefId}`).toBe(true);
      expect(anchors.has(sourceRefId), `missing generated anchor ${sourceRefId}`).toBe(true);
    }
  });

  it("grades the new row-schema migration exercise without inferring label", () => {
    const exercise = sampleToGenerationChapters[0].exercise;
    expect(exercise.kind).toBe("field-entry");
    if (exercise.kind !== "field-entry") throw new Error("unexpected exercise kind");
    const correct = gradeStructuredExercise(exercise, {
      kind: "field-entry",
      values: {
        prompt: "6 × 7 = ?",
        label: "None",
        metadata: '{"source":"transfer-check"}',
        tokens: "[]",
      },
    });
    expect(correct.correct).toBe(true);
    expect(gradeStructuredExercise(exercise, {
      kind: "field-entry",
      values: {
        prompt: "6 × 7 = ?",
        label: "None",
        metadata: "{source:transfer-check}",
        tokens: "[]",
      },
    })).toMatchObject({ correct: false, fieldResults: { metadata: false } });
    expect(gradeStructuredExercise(exercise, {
      kind: "field-entry",
      values: {
        prompt: "6 × 7 = ?",
        label: "42",
        metadata: '{"source":"transfer-check"}',
        tokens: "[]",
      },
    })).toMatchObject({ correct: false, fieldResults: { label: false } });
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
