import {
  LEARNING_COMPASS_PHASES,
  type LearningCompassPhaseId,
} from "../site/learning-compass-store";

export const SAMPLE_TO_GENERATION_PHASE_SELECTORS: Record<
  string,
  Record<LearningCompassPhaseId, string>
> = {
  "row-to-sample": {
    orient: "#mechanism-chapter-title",
    model: "#translation-desk-title",
    verify: "#translation-sources-title",
    practice: ".mechanism-exercise",
  },
  "field-ownership": {
    orient: "#mechanism-chapter-title",
    model: "#provenance-relay-title",
    verify: "#provenance-sources-title",
    practice: ".mechanism-exercise",
  },
  "group-without-aliasing": {
    orient: "#mechanism-chapter-title",
    model: "#grouping-inference-desk-title",
    verify: "#grouping-source-court-title",
    practice: "#grouping-case-report-title",
  },
  "sample-to-request": {
    orient: "#mechanism-chapter-title",
    model: "#request-assembly-title",
    verify: "#request-sources-title",
    practice: ".mechanism-exercise",
  },
  "response-projection": {
    orient: "#mechanism-chapter-title",
    model: "#response-decode-title",
    verify: "#response-sources-title",
    practice: ".mechanism-exercise",
  },
  "writeback-contract": {
    orient: "#mechanism-chapter-title",
    model: "#writeback-calibration-title",
    verify: "#writeback-sources-title",
    practice: ".mechanism-exercise",
  },
  assessment: {
    orient: "#mechanism-assessment-title",
    model: "#final-trace-passport-title",
    verify: "#final-trace-evidence",
    practice: "#final-trace-answer-title",
  },
};

export const SAMPLE_TO_GENERATION_PHASE_LABELS: Record<
  string,
  readonly [string, string, string, string]
> = {
  "row-to-sample": ["定位", "翻译", "核证", "迁移"],
  "field-ownership": ["交接", "接力", "诊断", "迁移"],
  "group-without-aliasing": ["现场", "推演", "裁判", "结案"],
  "sample-to-request": ["入境前", "装配", "申报", "核证"],
  "response-projection": ["收件", "解码", "取证", "诊断"],
  "writeback-contract": ["交接", "校准", "失败边界", "迁移"],
  assessment: ["案卷", "定位", "作答", "判卷"],
};

export function sampleToGenerationPhasesFor(slug: string) {
  const labels = SAMPLE_TO_GENERATION_PHASE_LABELS[slug] ??
    LEARNING_COMPASS_PHASES.map((phase) => phase.label);
  return LEARNING_COMPASS_PHASES.map((phase, index) => ({
    id: phase.id,
    label: labels[index],
  }));
}
