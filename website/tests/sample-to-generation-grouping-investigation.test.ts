import { describe, expect, it } from "vitest";

import {
  buildGroupingExpectedValues,
  gradeGroupingInitialJudgement,
  gradeGroupingInvestigation,
  simulateGroupingInvestigation,
  type GroupingInvestigationExpectedValues,
  type GroupingInvestigationSubmission,
  type GroupingFaultCardAnswer,
  type GroupingSeedOccurrence,
} from "@/core/sample-to-generation";
import {
  applyLessonProgressEvent,
  createEmptyLocalProgressV2,
} from "@/core/progress";
import { sampleToGenerationProgressManifest } from "@/content/zh";
import {
  groupingColdCaseSimulation,
  groupingInvestigationFaultCards,
  groupingInvestigationManifest,
  sampleToGenerationChapters,
  sampleToGenerationCourse,
} from "@/content/zh/lessons/sample-to-generation";

function seeds(count: number): GroupingSeedOccurrence[] {
  return Array.from({ length: count }, (_, index) => ({
    occurrenceId: `seed-${index}`,
    prompt: index < 2 ? "identical text" : `prompt-${index}`,
    label: null,
    metadata: { nested: { notes: [] as string[] } },
    tokens: [100 + index],
    weight_versions: [`actor@${index}`],
  }));
}

function correctSubmission(
  expected: GroupingInvestigationExpectedValues,
): GroupingInvestigationSubmission {
  return {
    initialJudgement: expected.initialJudgement,
    matrix: Object.fromEntries(
      expected.matrix.map((entry) => [
        entry.candidateId,
        {
          groupIndex: entry.groupIndex,
          sampleIndex: entry.sampleIndex,
        },
      ]),
    ),
    countersAfter: expected.countersAfter,
    aliasProbe: expected.aliasProbe,
    sourceMapping: expected.sourceMapping,
    faultClassifications: expected.faultClassifications,
    caseReport: expected.caseReport,
  };
}

function faultAnswersFromManifest(): Readonly<
  Record<string, GroupingFaultCardAnswer>
> {
  return Object.fromEntries(
    groupingInvestigationFaultCards.map((fault) => [
      fault.id,
      {
        dimension:
          groupingInvestigationManifest.expectedValues.faultClassifications[
            fault.id
          ],
        ...groupingInvestigationManifest.expectedValues.caseReport[
          fault.symptom.id
        ],
      },
    ]),
  );
}

describe("chapter-three grouping investigation domain", () => {
  it("simulates arbitrary positive fan-out from non-zero counters", () => {
    const simulation = simulateGroupingInvestigation({
      seedOccurrences: seeds(4),
      nSamplesPerPrompt: 3,
      groupIndexStart: 9,
      sampleIndexStart: 41,
    });

    expect(simulation.parameters).toEqual({ P: 4, N: 3, G0: 9, I0: 41 });
    expect(simulation.groups.map((group) => group.group_index)).toEqual([
      9, 10, 11, 12,
    ]);
    expect(
      simulation.groups.flatMap((group) =>
        group.candidates.map((candidate) => candidate.index),
      ),
    ).toEqual(Array.from({ length: 12 }, (_, index) => 41 + index));
    expect(simulation.trace).toHaveLength(16);
    expect(simulation.countersAfter).toEqual({
      groupIndex: 13,
      sampleIndex: 53,
    });
    expect(simulation.trace[1].countersAfter.groupIndex).toBe(9);
    expect(simulation.trace[2].countersAfter.groupIndex).toBe(9);
    expect(simulation.trace[3]).toMatchObject({
      operation: "close-group",
      countersBefore: { groupIndex: 9, sampleIndex: 44 },
      countersAfter: { groupIndex: 10, sampleIndex: 44 },
    });
  });

  it("keeps equal-text seed occurrences in distinct groups with unique identities", () => {
    const simulation = simulateGroupingInvestigation({
      seedOccurrences: seeds(2),
      nSamplesPerPrompt: 2,
      groupIndexStart: 4,
      sampleIndexStart: 30,
    });

    expect(simulation.groups[0].candidates[0].prompt).toBe(
      simulation.groups[1].candidates[0].prompt,
    );
    expect(simulation.groups.map((group) => group.seedOccurrenceId)).toEqual([
      "seed-0",
      "seed-1",
    ]);
    expect(simulation.groups.map((group) => group.group_index)).toEqual([4, 5]);
    const indexes = simulation.groups.flatMap((group) =>
      group.candidates.map((candidate) => candidate.index),
    );
    expect(new Set(indexes).size).toBe(4);
  });

  it("deep-clones nested metadata and mutable Sample arrays", () => {
    const inputSeeds = seeds(1);
    const simulation = simulateGroupingInvestigation({
      seedOccurrences: inputSeeds,
      nSamplesPerPrompt: 2,
      groupIndexStart: 1,
      sampleIndexStart: 1,
    });
    const first = simulation.groups[0].candidates[0];
    const sibling = simulation.groups[0].candidates[1];
    const firstMetadata = first.metadata as { nested: { notes: string[] } };
    const siblingMetadata = sibling.metadata as { nested: { notes: string[] } };
    const seedMetadata = inputSeeds[0].metadata as { nested: { notes: string[] } };

    firstMetadata.nested.notes.push("first-only");
    first.tokens.push(999);
    first.weight_versions.push("actor@local");

    expect(siblingMetadata.nested.notes).toEqual([]);
    expect(seedMetadata.nested.notes).toEqual([]);
    expect(sibling.tokens).toEqual([100]);
    expect(inputSeeds[0].tokens).toEqual([100]);
    expect(sibling.weight_versions).toEqual(["actor@0"]);
    expect(inputSeeds[0].weight_versions).toEqual(["actor@0"]);
    expect(first.metadata).not.toBe(sibling.metadata);
    expect(firstMetadata.nested).not.toBe(siblingMetadata.nested);
    expect(first.tokens).not.toBe(sibling.tokens);
    expect(first.weight_versions).not.toBe(sibling.weight_versions);
  });

  it("publishes the exact x/y/z cold case without merging repeated text", () => {
    expect(groupingColdCaseSimulation.parameters).toEqual({
      P: 3,
      N: 2,
      G0: 4,
      I0: 30,
    });
    expect(
      groupingColdCaseSimulation.groups.flatMap((group) =>
        group.candidates.map((candidate) => [
          candidate.id,
          candidate.group_index,
          candidate.index,
        ]),
      ),
    ).toEqual([
      ["x0", 4, 30],
      ["x1", 4, 31],
      ["y0", 5, 32],
      ["y1", 5, 33],
      ["z0", 6, 34],
      ["z1", 6, 35],
    ]);
    expect(groupingColdCaseSimulation.countersAfter).toEqual({
      groupIndex: 7,
      sampleIndex: 36,
    });
  });

  it("classifies four fault cards at explicit first-error boundaries", () => {
    expect(groupingInvestigationFaultCards).toHaveLength(4);
    expect(
      new Set(
        Object.values(
          groupingInvestigationManifest.expectedValues.faultClassifications,
        ),
      ),
    ).toEqual(
      new Set(["relationship", "identity", "aliasing", "counterTiming"]),
    );
    expect(
      Object.values(groupingInvestigationManifest.expectedValues.caseReport)
        .every(
          (report) =>
            report.firstErrorBoundary.length > 0 &&
            report.downstreamConsequenceId.length > 0,
        ),
    ).toBe(true);
    expect(JSON.stringify(groupingInvestigationFaultCards)).not.toContain(
      "firstErrorBoundary",
    );
  });

  it("grades all four misconception dimensions and pinpoints a wrong boundary", () => {
    const expected = buildGroupingExpectedValues(
      groupingColdCaseSimulation,
      groupingInvestigationFaultCards,
      faultAnswersFromManifest(),
    );
    const submission = correctSubmission(expected);
    expect(gradeGroupingInvestigation(expected, submission)).toMatchObject({
      correct: true,
      score: 6,
      total: 6,
      initialJudgementCorrect: true,
      sourceVerificationCorrect: true,
      caseReportCorrect: true,
      dimensionGrades: {
        relationship: { correct: true },
        identity: { correct: true },
        aliasing: { correct: true },
        counterTiming: { correct: true },
      },
    });

    const wrong: GroupingInvestigationSubmission = {
      ...submission,
      caseReport: {
        ...submission.caseReport,
        "group-index-shifted": {
          firstErrorBoundary: "candidate-identity-assignment",
          downstreamConsequenceId: "all-group-indices-shifted",
        },
      },
    };
    const grade = gradeGroupingInvestigation(expected, wrong);
    expect(grade.correct).toBe(false);
    expect(grade.caseReportCorrect).toBe(false);
    expect(grade.dimensionGrades.counterTiming.correct).toBe(true);
  });

  it("grades a different P/N/G0/I0 case with the same deterministic contract", () => {
    const simulation = simulateGroupingInvestigation({
      seedOccurrences: seeds(2),
      nSamplesPerPrompt: 3,
      groupIndexStart: 17,
      sampleIndexStart: 80,
    });
    const expected = buildGroupingExpectedValues(
      simulation,
      groupingInvestigationFaultCards,
      faultAnswersFromManifest(),
    );

    expect(
      gradeGroupingInvestigation(expected, correctSubmission(expected)),
    ).toMatchObject({ correct: true, score: 6, total: 6 });
  });

  it("keeps the orient judgement informational instead of gating completion", () => {
    const expected = groupingInvestigationManifest.expectedValues;
    const submission = correctSubmission(expected);
    const withoutOrient: GroupingInvestigationSubmission = {
      ...submission,
      initialJudgement: undefined,
    };

    expect(gradeGroupingInvestigation(expected, withoutOrient)).toMatchObject({
      correct: true,
      score: 6,
      total: 6,
      initialJudgementCorrect: false,
    });
    expect(
      gradeGroupingInitialJudgement(
        expected.initialJudgement,
        submission.initialJudgement,
      ),
    ).toMatchObject({ correct: true, blastRadiusCorrect: true });
  });

  it("rejects invalid cardinalities and duplicate occurrence IDs", () => {
    expect(() =>
      simulateGroupingInvestigation({
        seedOccurrences: seeds(1),
        nSamplesPerPrompt: 0,
        groupIndexStart: 0,
        sampleIndexStart: 0,
      }),
    ).toThrow(/N must be a positive integer/);
    expect(() =>
      simulateGroupingInvestigation({
        seedOccurrences: [seeds(1)[0], seeds(1)[0]],
        nSamplesPerPrompt: 1,
        groupIndexStart: 0,
        sampleIndexStart: 0,
      }),
    ).toThrow(/occurrence IDs must be non-empty and unique/);
  });
});

describe("chapter-three grouping investigation content", () => {
  it("exposes four ordered phases and keeps orient answers hidden", () => {
    expect(groupingInvestigationManifest.phases.map((phase) => phase.id)).toEqual([
      "orient",
      "model",
      "verify",
      "practice",
    ]);
    const orient = groupingInvestigationManifest.phases[0];
    const serializedOrient = JSON.stringify(orient);
    expect(orient.judgement.id).toBe("stg.chapter-3-first-judgement-v1");
    expect(orient.judgement.categoryOptions).toHaveLength(4);
    expect(orient.judgement.symptoms).toHaveLength(4);
    expect(orient.incident.report[0]).toBe(
      "[[a0(g=0,i=0),a1(g=1,i=1)],[b0(g=2,i=0),b1(g=3,i=1)]]",
    );
    expect(serializedOrient).not.toContain("symptomClassifications");
    expect(serializedOrient).not.toContain("sample.identity-defaults");
    expect(serializedOrient).not.toContain("rollout.datasource-get-samples");
    expect(serializedOrient).not.toContain('"local"');
    expect(serializedOrient).not.toContain('"unchanged"');
    expect(serializedOrient).not.toContain('"x0"');
  });

  it("shows four clone assignments and two explicit group-close steps in the model", () => {
    const model = groupingInvestigationManifest.phases[1];
    expect(model.workedTrace.map((step) => step.operation)).toEqual([
      "deepcopy-and-assign",
      "deepcopy-and-assign",
      "close-group",
      "deepcopy-and-assign",
      "deepcopy-and-assign",
      "close-group",
    ]);
  });

  it("publishes structured prompt and separately-addressable expected values", () => {
    const practice = groupingInvestigationManifest.phases[3];
    expect(practice.parameters).toEqual({ P: 3, N: 2, G0: 4, I0: 30 });
    expect(practice.prompt.matrixFields).toHaveLength(12);
    expect(practice.prompt.counterFields).toHaveLength(2);
    expect(groupingInvestigationManifest.expectedValues.matrix).toHaveLength(6);
    expect(groupingInvestigationManifest.expectedValues.sourceMapping).toEqual({
      "identity-defaults": "sample.identity-defaults",
      "counter-initialization": "rollout.datasource-counter-init",
      "fanout-and-deepcopy": "rollout.datasource-get-samples",
    });
  });

  it("updates the public chapter and derives the 114-minute metadata total", () => {
    const chapter = sampleToGenerationChapters[2];
    expect(chapter.durationMinutes).toBe(40);
    expect(chapter.groupingInvestigation).toBe(groupingInvestigationManifest);
    expect(chapter.exercise.id).toBe(
      "stg.chapter-3-grouping-investigation-v3",
    );
    expect(sampleToGenerationCourse.metadata).toMatchObject({
      lessonRevision: 9,
      assessmentVersion: 2,
      durationMinutes: { chapters: 104, assessment: 10, total: 114 },
      sourceBaseline: {
        describe: "v0.3.1-1-g06ffdbe2",
        commit: "06ffdbe22be068b52f9ed0fc318c473f7030197e",
      },
    });
  });

  it("counts investigation retries while keeping a successful pass sticky", () => {
    const correct = correctSubmission(groupingInvestigationManifest.expectedValues);
    const wrong: GroupingInvestigationSubmission = {
      ...correct,
      aliasProbe: { ...correct.aliasProbe, sibling: "local" },
    };
    const response = (submission: GroupingInvestigationSubmission) => ({
      type: "field-entry" as const,
      values: { grouping_investigation_v3: JSON.stringify(submission) },
    });
    const exerciseId = "stg.chapter-3-grouping-investigation-v3";
    let progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: exerciseId,
        response: response(wrong),
        passed: false,
      },
      () => "2026-08-26T08:00:00.000Z",
    );
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: exerciseId,
        response: response(correct),
        passed: true,
      },
      () => "2026-08-26T08:01:00.000Z",
    );
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: exerciseId,
        response: response(wrong),
        passed: false,
      },
      () => "2026-08-26T08:02:00.000Z",
    );

    expect(
      progress.lessons["core.sample-to-generation"]?.exercise_attempts[exerciseId],
    ).toMatchObject({
      attempt_count: 3,
      passed: true,
      passed_at: "2026-08-26T08:01:00.000Z",
      last_attempt_at: "2026-08-26T08:02:00.000Z",
      last_response: response(wrong),
    });
  });
});
