export const GROUPING_MISCONCEPTION_DIMENSION_IDS = [
  "relationship",
  "identity",
  "aliasing",
  "counterTiming",
] as const;

export type GroupingMisconceptionDimensionId =
  (typeof GROUPING_MISCONCEPTION_DIMENSION_IDS)[number];

export type GroupingSeedOccurrence = {
  /** Stable occurrence identity. Equal prompt text must not collapse two seeds. */
  occurrenceId: string;
  prompt: string;
  label: string | null;
  metadata: Readonly<Record<string, unknown>>;
  tokens: readonly number[];
  weight_versions: readonly string[];
};

export type GroupingSimulationInput = {
  seedOccurrences: readonly GroupingSeedOccurrence[];
  nSamplesPerPrompt: number;
  groupIndexStart: number;
  sampleIndexStart: number;
};

export type GroupingCandidate = {
  id: string;
  seedOccurrenceId: string;
  seedPosition: number;
  candidatePosition: number;
  prompt: string;
  label: string | null;
  metadata: Record<string, unknown>;
  tokens: number[];
  weight_versions: string[];
  group_index: number;
  index: number;
};

type GroupingCandidateTraceStep = {
  id: string;
  order: number;
  seedOccurrenceId: string;
  seedPosition: number;
  candidatePosition: number;
  operation: "deepcopy-and-assign";
  countersBefore: {
    groupIndex: number;
    sampleIndex: number;
  };
  assignment: {
    candidateId: string;
    group_index: number;
    index: number;
  };
  countersAfter: {
    groupIndex: number;
    sampleIndex: number;
  };
};

type GroupingCloseTraceStep = {
  id: string;
  order: number;
  seedOccurrenceId: string;
  seedPosition: number;
  operation: "close-group";
  countersBefore: {
    groupIndex: number;
    sampleIndex: number;
  };
  assignment: null;
  countersAfter: {
    groupIndex: number;
    sampleIndex: number;
  };
};

export type GroupingTraceStep =
  | GroupingCandidateTraceStep
  | GroupingCloseTraceStep;

export type GroupingSimulation = {
  parameters: {
    P: number;
    N: number;
    G0: number;
    I0: number;
  };
  groups: readonly {
    seedOccurrenceId: string;
    seedPosition: number;
    group_index: number;
    candidates: readonly GroupingCandidate[];
  }[];
  trace: readonly GroupingTraceStep[];
  countersAfter: {
    groupIndex: number;
    sampleIndex: number;
  };
};

export type GroupingMisconceptionDimension = {
  id: GroupingMisconceptionDimensionId;
  label: string;
  diagnosticQuestion: string;
  correctPrinciple: string;
};

export type GroupingFaultBoundary =
  | "seed-occurrence-group-assignment"
  | "candidate-clone"
  | "candidate-identity-assignment"
  | "group-counter-read";

export type GroupingFaultCard = {
  id: string;
  title: string;
  counterfactualRule: string;
  symptom: {
    id: string;
    label: string;
  };
  boundaryOptions: readonly {
    id: GroupingFaultBoundary;
    label: string;
  }[];
  consequenceOptions: readonly {
    id: string;
    label: string;
  }[];
};

export type GroupingFaultCardAnswer = {
  dimension: GroupingMisconceptionDimensionId;
  firstErrorBoundary: GroupingFaultBoundary;
  downstreamConsequenceId: string;
};

export type GroupingMatrixEntry = {
  candidateId: string;
  seedOccurrenceId: string;
  candidatePosition: number;
  groupIndex: number;
  sampleIndex: number;
};

export type GroupingInvestigationPrompt = {
  matrixFields: readonly {
    id: string;
    candidateId: string;
    field: "groupIndex" | "sampleIndex";
    label: string;
  }[];
  counterFields: readonly {
    id: "groupIndexAfter" | "sampleIndexAfter";
    label: string;
  }[];
  aliasProbe: {
    mutation: string;
    fields: readonly {
      id: "target" | "sibling" | "seed";
      label: string;
    }[];
  };
};

export type GroupingInvestigationExpectedValues = {
  initialJudgement: {
    symptomClassifications: Readonly<
      Record<string, GroupingMisconceptionDimensionId>
    >;
    correctBlastRadius: readonly string[];
  };
  matrix: readonly GroupingMatrixEntry[];
  countersAfter: {
    groupIndex: number;
    sampleIndex: number;
  };
  aliasProbe: {
    target: string;
    sibling: string;
    seed: string;
  };
  sourceMapping: Readonly<Record<string, string>>;
  faultClassifications: Readonly<
    Record<string, GroupingMisconceptionDimensionId>
  >;
  caseReport: Readonly<
    Record<
      string,
      {
        firstErrorBoundary: GroupingFaultBoundary;
        downstreamConsequenceId: string;
      }
    >
  >;
};

export type GroupingInitialJudgementSubmission = {
  symptomClassifications?: Readonly<Record<string, string>>;
  correctBlastRadius?: readonly string[];
};

export type GroupingInitialJudgementGrade = {
  correct: boolean;
  symptomResults: Readonly<Record<string, boolean>>;
  blastRadiusCorrect: boolean;
};

export type GroupingInvestigationSubmission = {
  initialJudgement?: GroupingInitialJudgementSubmission;
  matrix?: Readonly<
    Record<
      string,
      {
        groupIndex?: number;
        sampleIndex?: number;
      }
    >
  >;
  countersAfter?: {
    groupIndex?: number;
    sampleIndex?: number;
  };
  aliasProbe?: {
    target?: string;
    sibling?: string;
    seed?: string;
  };
  sourceMapping?: Readonly<Record<string, string>>;
  faultClassifications?: Readonly<Record<string, string>>;
  caseReport?: Readonly<
    Record<
      string,
      {
        firstErrorBoundary?: string;
        downstreamConsequenceId?: string;
      }
    >
  >;
};

export type GroupingInvestigationGrade = {
  correct: boolean;
  score: number;
  total: 6;
  initialJudgementCorrect: boolean;
  sourceVerificationCorrect: boolean;
  caseReportCorrect: boolean;
  dimensionGrades: Readonly<
    Record<
      GroupingMisconceptionDimensionId,
      {
        correct: boolean;
        checks: Readonly<Record<string, boolean>>;
      }
    >
  >;
};

type GroupingOrientPhase = {
  id: "orient";
  title: string;
  incident: {
    id: string;
    title: string;
    report: readonly string[];
  };
  judgement: {
    id: string;
    prompt: string;
    symptoms: readonly {
      id: string;
      report: string;
    }[];
    categoryOptions: readonly {
      id: GroupingMisconceptionDimensionId;
      label: string;
    }[];
    blastRadius: {
      prompt: string;
      candidateOptions: readonly string[];
    };
  };
};

type GroupingModelPhase = {
  id: "model";
  title: string;
  notation: readonly {
    symbol: "P" | "N" | "G" | "I";
    meaning: string;
  }[];
  rules: readonly string[];
  workedTrace: readonly GroupingTraceStep[];
  dimensions: readonly GroupingMisconceptionDimension[];
};

type GroupingVerifyPhase = {
  id: "verify";
  title: string;
  claims: readonly {
    id: string;
    label: string;
  }[];
  sourceCards: readonly {
    sourceRefId: string;
    label: string;
  }[];
  faultCards: readonly GroupingFaultCard[];
};

type GroupingPracticePhase = {
  id: "practice";
  title: string;
  caseId: string;
  parameters: GroupingSimulation["parameters"];
  seedOccurrences: readonly GroupingSeedOccurrence[];
  prompt: GroupingInvestigationPrompt;
};

export type GroupingInvestigationManifest = {
  id: "stg.chapter-3-grouping-investigation-v3";
  phases: readonly [
    GroupingOrientPhase,
    GroupingModelPhase,
    GroupingVerifyPhase,
    GroupingPracticePhase,
  ];
  /** Kept outside `phases[0]` so the orient screen cannot reveal answers. */
  expectedValues: GroupingInvestigationExpectedValues;
};

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertNonnegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative integer`);
  }
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Reproduce the source fan-out rules without mutating input seeds.
 *
 * Seed position, not prompt equality, defines a group. This makes repeated
 * prompt text two distinct occurrences while preserving deterministic IDs.
 */
export function simulateGroupingInvestigation(
  input: GroupingSimulationInput,
): GroupingSimulation {
  assertPositiveInteger("P", input.seedOccurrences.length);
  assertPositiveInteger("N", input.nSamplesPerPrompt);
  assertNonnegativeInteger("G0", input.groupIndexStart);
  assertNonnegativeInteger("I0", input.sampleIndexStart);

  const occurrenceIds = input.seedOccurrences.map((seed) => seed.occurrenceId);
  if (
    occurrenceIds.some((occurrenceId) => occurrenceId.length === 0) ||
    new Set(occurrenceIds).size !== occurrenceIds.length
  ) {
    throw new Error("seed occurrence IDs must be non-empty and unique");
  }

  let groupIndex = input.groupIndexStart;
  let sampleIndex = input.sampleIndexStart;
  const trace: GroupingTraceStep[] = [];
  const groups: GroupingSimulation["groups"][number][] = [];

  input.seedOccurrences.forEach((seed, seedPosition) => {
    const candidates: GroupingCandidate[] = [];
    for (
      let candidatePosition = 0;
      candidatePosition < input.nSamplesPerPrompt;
      candidatePosition += 1
    ) {
      const candidateId = `${seed.occurrenceId}${candidatePosition}`;
      const groupIndexBefore = groupIndex;
      const sampleIndexBefore = sampleIndex;
      const candidate: GroupingCandidate = {
        id: candidateId,
        seedOccurrenceId: seed.occurrenceId,
        seedPosition,
        candidatePosition,
        prompt: seed.prompt,
        label: seed.label,
        metadata: cloneValue(seed.metadata),
        tokens: [...seed.tokens],
        weight_versions: [...seed.weight_versions],
        group_index: groupIndexBefore,
        index: sampleIndexBefore,
      };
      candidates.push(candidate);
      sampleIndex += 1;
      trace.push({
        id: `copy-${candidateId}`,
        order: trace.length + 1,
        seedOccurrenceId: seed.occurrenceId,
        seedPosition,
        candidatePosition,
        operation: "deepcopy-and-assign",
        countersBefore: {
          groupIndex: groupIndexBefore,
          sampleIndex: sampleIndexBefore,
        },
        assignment: {
          candidateId,
          group_index: candidate.group_index,
          index: candidate.index,
        },
        countersAfter: { groupIndex, sampleIndex },
      });
    }
    const groupIndexBeforeClose = groupIndex;
    groupIndex += 1;
    trace.push({
      id: `close-${seed.occurrenceId}`,
      order: trace.length + 1,
      seedOccurrenceId: seed.occurrenceId,
      seedPosition,
      operation: "close-group",
      countersBefore: {
        groupIndex: groupIndexBeforeClose,
        sampleIndex,
      },
      assignment: null,
      countersAfter: { groupIndex, sampleIndex },
    });
    groups.push({
      seedOccurrenceId: seed.occurrenceId,
      seedPosition,
      group_index: candidates[0].group_index,
      candidates,
    });
  });

  return {
    parameters: {
      P: input.seedOccurrences.length,
      N: input.nSamplesPerPrompt,
      G0: input.groupIndexStart,
      I0: input.sampleIndexStart,
    },
    groups,
    trace,
    countersAfter: { groupIndex, sampleIndex },
  };
}

export function buildGroupingInvestigationPrompt(
  simulation: GroupingSimulation,
  aliasProbeSeedOccurrenceId = simulation.groups[0]?.seedOccurrenceId,
): GroupingInvestigationPrompt {
  const aliasGroup = simulation.groups.find(
    (group) => group.seedOccurrenceId === aliasProbeSeedOccurrenceId,
  ) ?? simulation.groups[0];
  const target = aliasGroup.candidates[0];
  const sibling = aliasGroup.candidates[1];
  const matrixFields = simulation.groups.flatMap((group) =>
    group.candidates.flatMap((candidate) => [
      {
        id: `${candidate.id}-group`,
        candidateId: candidate.id,
        field: "groupIndex" as const,
        label: `${candidate.id}.group_index`,
      },
      {
        id: `${candidate.id}-index`,
        candidateId: candidate.id,
        field: "sampleIndex" as const,
        label: `${candidate.id}.index`,
      },
    ]),
  );
  return {
    matrixFields,
    counterFields: [
      { id: "groupIndexAfter", label: "调用后的 G" },
      { id: "sampleIndexAfter", label: "调用后的 I" },
    ],
    aliasProbe: {
      mutation: `${target.id}.metadata.audit.notes.push("local")`,
      fields: [
        { id: "target", label: `${target.id} 的 notes` },
        {
          id: "sibling",
          label: sibling
            ? `${sibling.id} 的 notes`
            : "N=1，本组没有 sibling（应保持 unchanged）",
        },
        { id: "seed", label: `seed ${target.seedOccurrenceId} 的 notes` },
      ],
    },
  };
}

export function buildGroupingExpectedValues(
  simulation: GroupingSimulation,
  faults: readonly GroupingFaultCard[],
  faultAnswers: Readonly<Record<string, GroupingFaultCardAnswer>>,
): GroupingInvestigationExpectedValues {
  for (const fault of faults) {
    if (!faultAnswers[fault.id]) {
      throw new Error(`Missing answer for grouping fault ${fault.id}`);
    }
  }
  return {
    initialJudgement: {
      symptomClassifications: {
        "split-group-members": "relationship",
        "reused-physical-index": "identity",
        "shared-mutable-state": "aliasing",
        "advanced-group-per-copy": "counterTiming",
      },
      correctBlastRadius: ["a0"],
    },
    matrix: simulation.groups.flatMap((group) =>
      group.candidates.map((candidate) => ({
        candidateId: candidate.id,
        seedOccurrenceId: candidate.seedOccurrenceId,
        candidatePosition: candidate.candidatePosition,
        groupIndex: candidate.group_index,
        sampleIndex: candidate.index,
      })),
    ),
    countersAfter: simulation.countersAfter,
    aliasProbe: { target: "local", sibling: "unchanged", seed: "unchanged" },
    sourceMapping: {
      "identity-defaults": "sample.identity-defaults",
      "counter-initialization": "rollout.datasource-counter-init",
      "fanout-and-deepcopy": "rollout.datasource-get-samples",
    },
    faultClassifications: Object.fromEntries(
      faults.map((fault) => [fault.id, faultAnswers[fault.id].dimension]),
    ),
    caseReport: Object.fromEntries(
      faults.map((fault) => [
        fault.symptom.id,
        {
          firstErrorBoundary: faultAnswers[fault.id].firstErrorBoundary,
          downstreamConsequenceId:
            faultAnswers[fault.id].downstreamConsequenceId,
        },
      ]),
    ),
  };
}

function faultCheck(
  expected: GroupingInvestigationExpectedValues,
  submission: GroupingInvestigationSubmission,
  dimension: GroupingMisconceptionDimensionId,
): boolean {
  const entries = Object.entries(expected.faultClassifications).filter(
    ([, value]) => value === dimension,
  );
  return entries.every(
    ([faultId, value]) => submission.faultClassifications?.[faultId] === value,
  );
}

function sameStringSet(
  left: readonly string[] | undefined,
  right: readonly string[],
): boolean {
  return Boolean(
    left &&
      left.length === right.length &&
      left.every((value) => right.includes(value)) &&
      right.every((value) => left.includes(value)),
  );
}

export function gradeGroupingInitialJudgement(
  expected: GroupingInvestigationExpectedValues["initialJudgement"],
  submission: GroupingInitialJudgementSubmission | undefined,
): GroupingInitialJudgementGrade {
  const symptomResults = Object.fromEntries(
    Object.entries(expected.symptomClassifications).map(
      ([symptomId, dimension]) => [
        symptomId,
        submission?.symptomClassifications?.[symptomId] === dimension,
      ],
    ),
  );
  const blastRadiusCorrect = sameStringSet(
    submission?.correctBlastRadius,
    expected.correctBlastRadius,
  );
  return {
    correct:
      Object.values(symptomResults).every(Boolean) && blastRadiusCorrect,
    symptomResults,
    blastRadiusCorrect,
  };
}

export function gradeGroupingInvestigation(
  expected: GroupingInvestigationExpectedValues,
  submission: GroupingInvestigationSubmission,
): GroupingInvestigationGrade {
  const groupAssignments = expected.matrix.every(
    (entry) =>
      submission.matrix?.[entry.candidateId]?.groupIndex === entry.groupIndex,
  );
  const sampleAssignments = expected.matrix.every(
    (entry) =>
      submission.matrix?.[entry.candidateId]?.sampleIndex === entry.sampleIndex,
  );
  const submittedIndexes = expected.matrix.map(
    (entry) => submission.matrix?.[entry.candidateId]?.sampleIndex,
  );
  const uniqueIndexes =
    submittedIndexes.every((index) => index !== undefined) &&
    new Set(submittedIndexes).size === submittedIndexes.length;

  const initialJudgementCorrect = gradeGroupingInitialJudgement(
    expected.initialJudgement,
    submission.initialJudgement,
  ).correct;
  const aliasValues =
    submission.aliasProbe?.target === expected.aliasProbe.target &&
    submission.aliasProbe.sibling === expected.aliasProbe.sibling &&
    submission.aliasProbe.seed === expected.aliasProbe.seed;
  const counters =
    submission.countersAfter?.groupIndex === expected.countersAfter.groupIndex &&
    submission.countersAfter.sampleIndex === expected.countersAfter.sampleIndex;
  const sourceVerificationCorrect = Object.entries(expected.sourceMapping).every(
    ([claimId, sourceRefId]) =>
      submission.sourceMapping?.[claimId] === sourceRefId,
  );
  const caseReportCorrect = Object.entries(expected.caseReport).every(
    ([symptomId, report]) => {
      const actual = submission.caseReport?.[symptomId];
      return (
        actual?.firstErrorBoundary === report.firstErrorBoundary &&
        actual.downstreamConsequenceId === report.downstreamConsequenceId
      );
    },
  );

  const dimensionGrades: GroupingInvestigationGrade["dimensionGrades"] = {
    relationship: {
      correct:
        groupAssignments &&
        faultCheck(expected, submission, "relationship"),
      checks: {
        groupAssignments,
        faultClassification: faultCheck(expected, submission, "relationship"),
      },
    },
    identity: {
      correct:
        sampleAssignments &&
        uniqueIndexes &&
        faultCheck(expected, submission, "identity"),
      checks: {
        sampleAssignments,
        uniqueIndexes,
        faultClassification: faultCheck(expected, submission, "identity"),
      },
    },
    aliasing: {
      correct: aliasValues && faultCheck(expected, submission, "aliasing"),
      checks: {
        aliasProbe: aliasValues,
        faultClassification: faultCheck(expected, submission, "aliasing"),
      },
    },
    counterTiming: {
      correct: counters && faultCheck(expected, submission, "counterTiming"),
      checks: {
        finalCounters: counters,
        faultClassification: faultCheck(expected, submission, "counterTiming"),
      },
    },
  };
  const correctDimensions = Object.values(dimensionGrades).filter(
    (dimension) => dimension.correct,
  ).length;
  const score =
    correctDimensions +
    Number(sourceVerificationCorrect) +
    Number(caseReportCorrect);
  return {
    correct: score === 6,
    score,
    total: 6,
    initialJudgementCorrect,
    sourceVerificationCorrect,
    caseReportCorrect,
    dimensionGrades,
  };
}
