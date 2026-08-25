import type {
  EarlyFieldDiagnosticCase,
  FieldLifecycleEntry,
  GroupingAliasProbe,
  GroupingComparisonRule,
  GroupingCounterFrame,
  GroupingLabGroup,
  ProducerRelayStage,
  RequestAssemblyStage,
  RequestFixturePacket,
  RequestManifestEntry,
  RequestSamplingParameter,
  ResponseDecodeStage,
  ResponseDiagnosticCase,
  ResponseEvidenceLane,
  ResponseFixtureReceipt,
  SampleToGenerationChapter,
  WritebackCalibrationStep,
  WritebackCoordinateRow,
  WritebackFailureBoundary,
  WritebackFixture,
  WritebackTerminalCase,
} from "../../content/zh/lessons/sample-to-generation";

export type ChapterOneTranslationChapter = SampleToGenerationChapter & {
  tracePassport: NonNullable<SampleToGenerationChapter["tracePassport"]>;
  mappingLanes: NonNullable<SampleToGenerationChapter["mappingLanes"]>;
  defaultFieldGroups: NonNullable<SampleToGenerationChapter["defaultFieldGroups"]>;
};

export type ChapterTwoProvenanceChapter = SampleToGenerationChapter & {
  producerRelayStages: readonly ProducerRelayStage[];
  fieldLifecycleEntries: readonly FieldLifecycleEntry[];
  earlyFieldDiagnosticCases: readonly EarlyFieldDiagnosticCase[];
};

export type ChapterThreeGroupingChapter = SampleToGenerationChapter & {
  groupingLabGroups: readonly GroupingLabGroup[];
  groupingCounterFrames: readonly GroupingCounterFrame[];
  groupingComparisonRules: readonly GroupingComparisonRule[];
  groupingAliasProbe: GroupingAliasProbe;
};

export type ChapterFourRequestBoundaryChapter = SampleToGenerationChapter & {
  requestAssemblyStages: readonly RequestAssemblyStage[];
  requestManifestEntries: readonly RequestManifestEntry[];
  requestSamplingParameters: readonly RequestSamplingParameter[];
  requestFixturePacket: RequestFixturePacket;
};

export type ChapterFiveResponseEvidenceChapter = SampleToGenerationChapter & {
  responseDecodeStages: readonly ResponseDecodeStage[];
  responseEvidenceLanes: readonly ResponseEvidenceLane[];
  responseFixtureReceipt: ResponseFixtureReceipt;
  responseDiagnosticCases: readonly ResponseDiagnosticCase[];
};

export type ChapterSixWritebackChapter = SampleToGenerationChapter & {
  writebackCalibrationSteps: readonly WritebackCalibrationStep[];
  writebackCoordinateRows: readonly WritebackCoordinateRow[];
  writebackTerminalCases: readonly WritebackTerminalCase[];
  writebackFailureBoundaries: readonly WritebackFailureBoundary[];
  writebackFixture: WritebackFixture;
};

export function hasChapterOneTranslationData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterOneTranslationChapter {
  return Boolean(
    chapter?.slug === "row-to-sample" &&
    chapter.tracePassport &&
    chapter.mappingLanes &&
    chapter.defaultFieldGroups,
  );
}

export function hasChapterTwoProvenanceData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterTwoProvenanceChapter {
  return Boolean(
    chapter?.slug === "field-ownership" &&
    chapter.producerRelayStages &&
    chapter.fieldLifecycleEntries &&
    chapter.earlyFieldDiagnosticCases,
  );
}

export function hasChapterThreeGroupingData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterThreeGroupingChapter {
  return Boolean(
    chapter?.slug === "group-without-aliasing" &&
    chapter.groupingLabGroups &&
    chapter.groupingCounterFrames &&
    chapter.groupingComparisonRules &&
    chapter.groupingAliasProbe,
  );
}

export function hasChapterFourRequestBoundaryData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterFourRequestBoundaryChapter {
  return Boolean(
    chapter?.slug === "sample-to-request" &&
    chapter.requestAssemblyStages &&
    chapter.requestManifestEntries &&
    chapter.requestSamplingParameters &&
    chapter.requestFixturePacket,
  );
}

export function hasChapterFiveResponseEvidenceData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterFiveResponseEvidenceChapter {
  return Boolean(
    chapter?.slug === "response-projection" &&
    chapter.responseDecodeStages &&
    chapter.responseEvidenceLanes &&
    chapter.responseFixtureReceipt &&
    chapter.responseDiagnosticCases,
  );
}

export function hasChapterSixWritebackData(
  chapter: SampleToGenerationChapter | undefined,
): chapter is ChapterSixWritebackChapter {
  return Boolean(
    chapter?.slug === "writeback-contract" &&
    chapter.writebackCalibrationSteps &&
    chapter.writebackCoordinateRows &&
    chapter.writebackTerminalCases &&
    chapter.writebackFailureBoundaries &&
    chapter.writebackFixture,
  );
}
