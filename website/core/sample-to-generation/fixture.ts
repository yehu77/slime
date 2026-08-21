import rawFixture from "@/data/fixtures/sample-to-generation/sample-to-generation-2x2-v1.json";

import { getFailedSampleToGenerationInvariants } from "./invariants";
import { materializeSampleToGenerationStates } from "./reducer";
import {
  SampleToGenerationFixtureSchema,
  type SampleToGenerationFixture,
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

const parsedFixture: SampleToGenerationFixture =
  SampleToGenerationFixtureSchema.parse(rawFixture);

const failures = materializeSampleToGenerationStates(parsedFixture).flatMap(
  (state) =>
    getFailedSampleToGenerationInvariants(state, parsedFixture).map(
      (failure) => `${state.observation_id}: ${failure.id}`,
    ),
);

if (failures.length > 0) {
  throw new Error(
    `Sample-to-generation fixture violates invariants: ${failures.join(", ")}`,
  );
}

export const sampleToGenerationFixture = deepFreeze(parsedFixture);
