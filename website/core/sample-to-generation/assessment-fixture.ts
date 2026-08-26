import rawAssessmentFixture from "@/data/fixtures/sample-to-generation/assessment-orion-v1.json";

import {
  ComprehensiveAssessmentFixtureSchema,
  type ComprehensiveAssessmentFixture,
} from "./schema";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

const parsedAssessmentFixture: ComprehensiveAssessmentFixture =
  ComprehensiveAssessmentFixtureSchema.parse(rawAssessmentFixture);

/** A validated, immutable transfer trace used only by the terminal assessment. */
export const comprehensiveAssessmentFixture = deepFreeze(
  parsedAssessmentFixture,
);
