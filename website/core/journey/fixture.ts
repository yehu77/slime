import { LocaleMessagesSchema, type LocaleMessages } from "@/content/schema";
import rawMath2x2Fixture from "@/data/fixtures/sample-journey/math-2x2-v1.json";

import { getFailedJourneyInvariants } from "./invariants";
import { materializeJourneyStates } from "./reducer";
import {
  JourneyFixtureSchema,
  SampleSnapshotSchema,
  type JourneyFixture,
  type RuntimeJourneyFixture,
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

function readMessage(messages: LocaleMessages, copyKey: string): string {
  const value = messages[copyKey];
  if (!value) {
    throw new Error(`Missing locale message: ${copyKey}`);
  }
  return value;
}

export const math2x2Fixture: JourneyFixture = deepFreeze(
  JourneyFixtureSchema.parse(rawMath2x2Fixture),
);

export function materializeJourneyFixture(
  fixture: JourneyFixture,
  messagesInput: Record<string, string>,
): RuntimeJourneyFixture {
  const messages = LocaleMessagesSchema.parse(messagesInput);
  const initialSamples = Object.fromEntries(
    Object.entries(fixture.initial_samples).map(([sampleId, sample]) => [
      sampleId,
      SampleSnapshotSchema.parse({
        ...sample,
        prompt: readMessage(messages, sample.prompt.copy_key),
      }),
    ]),
  );
  const events = fixture.events.map((event) => ({
    ...event,
    title: readMessage(messages, event.title_key),
    narration: readMessage(messages, event.narration_key),
    transcript: readMessage(messages, event.transcript_key),
  }));
  const runtime: RuntimeJourneyFixture = {
    ...fixture,
    teaching_values_notice: readMessage(
      messages,
      fixture.teaching_values_notice_key,
    ),
    initial_samples: initialSamples,
    events,
  };

  const states = materializeJourneyStates(runtime);
  const failures = states.flatMap((state) =>
    getFailedJourneyInvariants(state).map(
      (failure) => `${state.event_id}: ${failure.id}`,
    ),
  );
  if (failures.length > 0) {
    throw new Error(`Journey fixture violates invariants: ${failures.join(", ")}`);
  }

  const finalState = states.at(-1);
  const finalSchedule = finalState?.derived.schedule;
  if (
    !finalSchedule ||
    finalSchedule.steps.length !== fixture.expected.train_steps ||
    finalSchedule.trimmed_rollouts !== fixture.expected.trimmed_rollouts
  ) {
    throw new Error("Journey fixture does not match its expected schedule");
  }

  return deepFreeze(runtime);
}
