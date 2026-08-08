import {
  DerivedJourneyStateSchema,
  SampleSnapshotSchema,
  SystemJourneyStateSchema,
  type DerivedJourneyState,
  type JourneyActor,
  type JourneyPhase,
  type RuntimeJourneyEvent,
  type RuntimeJourneyFixture,
  type SampleSnapshot,
  type SystemJourneyState,
} from "./schema";

export type ChangedField = {
  sample_id: string;
  path: string;
  before: unknown;
  after: unknown;
};

export type JourneyState = {
  fixture_id: string;
  event_id: string;
  event_index: number;
  phase: JourneyPhase;
  act: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  actor: JourneyActor;
  title: string;
  narration: string;
  transcript: string;
  selected_sample_id: string;
  raw_samples: Record<string, SampleSnapshot>;
  derived: DerivedJourneyState;
  system: SystemJourneyState;
  changed_fields: ChangedField[];
};

export type JourneyAction =
  | { type: "next" }
  | { type: "previous" }
  | { type: "seek"; event_id: string }
  | { type: "reset" }
  | { type: "select_sample"; sample_id: string };

function applyEvent(
  state: JourneyState,
  event: RuntimeJourneyEvent,
  eventIndex: number,
): JourneyState {
  if (state.system.raw_samples_frozen && event.sample_patches.length > 0) {
    throw new Error(`Event ${event.id} attempts to mutate frozen raw Samples`);
  }
  const rawSamples = { ...state.raw_samples };
  const changedFields: ChangedField[] = [];

  for (const patch of event.sample_patches) {
    const currentSample = rawSamples[patch.sample_id];
    if (!currentSample) {
      throw new Error(`Event ${event.id} targets unknown sample ${patch.sample_id}`);
    }

    const field = patch.path.slice(1) as keyof SampleSnapshot;
    const nextSample = SampleSnapshotSchema.parse({
      ...currentSample,
      [field]: patch.value,
    });
    rawSamples[patch.sample_id] = nextSample;
    changedFields.push({
      sample_id: patch.sample_id,
      path: patch.path,
      before: currentSample[field],
      after: nextSample[field],
    });
  }

  const derived = event.derived_patch
    ? DerivedJourneyStateSchema.parse({
        ...state.derived,
        ...event.derived_patch,
      })
    : state.derived;
  const system = event.system_patch
    ? SystemJourneyStateSchema.parse({
        ...state.system,
        ...event.system_patch,
      })
    : state.system;

  return {
    ...state,
    event_id: event.id,
    event_index: eventIndex,
    phase: event.phase,
    act: event.act,
    actor: event.actor,
    title: event.title,
    narration: event.narration,
    transcript: event.transcript,
    raw_samples: rawSamples,
    derived,
    system,
    changed_fields: changedFields,
  };
}

function createBaseJourneyState(
  fixture: RuntimeJourneyFixture,
  selectedSampleId: string,
): JourneyState {
  if (!fixture.initial_samples[selectedSampleId]) {
    throw new Error(`Unknown selected sample ${selectedSampleId}`);
  }

  return {
    fixture_id: fixture.fixture_id,
    event_id: "",
    event_index: -1,
    phase: "ready",
    act: 1,
    actor: "dataset",
    title: "",
    narration: "",
    transcript: "",
    selected_sample_id: selectedSampleId,
    raw_samples: Object.fromEntries(
      Object.entries(fixture.initial_samples).map(([sampleId, sample]) => [
        sampleId,
        SampleSnapshotSchema.parse(sample),
      ]),
    ),
    derived: DerivedJourneyStateSchema.parse(fixture.initial_derived),
    system: SystemJourneyStateSchema.parse(fixture.initial_system),
    changed_fields: [],
  };
}

export function seekJourney(
  fixture: RuntimeJourneyFixture,
  eventId: string,
  selectedSampleId = "a0",
): JourneyState {
  const targetIndex = fixture.events.findIndex((event) => event.id === eventId);
  if (targetIndex < 0) {
    throw new Error(`Unknown journey event ${eventId}`);
  }

  let state = createBaseJourneyState(fixture, selectedSampleId);
  for (let index = 0; index <= targetIndex; index += 1) {
    state = applyEvent(state, fixture.events[index], index);
  }
  return state;
}

export function createInitialJourneyState(
  fixture: RuntimeJourneyFixture,
  selectedSampleId = "a0",
): JourneyState {
  const firstEvent = fixture.events[0];
  if (!firstEvent) {
    throw new Error(`Fixture ${fixture.fixture_id} has no events`);
  }
  return seekJourney(fixture, firstEvent.id, selectedSampleId);
}

export function reduceJourney(
  state: JourneyState,
  action: JourneyAction,
  fixture: RuntimeJourneyFixture,
): JourneyState {
  if (state.fixture_id !== fixture.fixture_id) {
    throw new Error(
      `State fixture ${state.fixture_id} does not match ${fixture.fixture_id}`,
    );
  }

  switch (action.type) {
    case "next": {
      const nextIndex = Math.min(state.event_index + 1, fixture.events.length - 1);
      return seekJourney(
        fixture,
        fixture.events[nextIndex].id,
        state.selected_sample_id,
      );
    }
    case "previous": {
      const previousIndex = Math.max(state.event_index - 1, 0);
      return seekJourney(
        fixture,
        fixture.events[previousIndex].id,
        state.selected_sample_id,
      );
    }
    case "seek":
      return seekJourney(fixture, action.event_id, state.selected_sample_id);
    case "reset":
      return createInitialJourneyState(fixture, state.selected_sample_id);
    case "select_sample": {
      if (!state.raw_samples[action.sample_id]) {
        throw new Error(`Unknown selected sample ${action.sample_id}`);
      }
      return { ...state, selected_sample_id: action.sample_id };
    }
  }
}

export function materializeJourneyStates(
  fixture: RuntimeJourneyFixture,
  selectedSampleId = "a0",
): JourneyState[] {
  let state = createBaseJourneyState(fixture, selectedSampleId);
  return fixture.events.map((event, index) => {
    state = applyEvent(state, event, index);
    return state;
  });
}

function sortForStableSerialization(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableSerialization);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortForStableSerialization(child)]),
    );
  }
  return value;
}

export function getJourneyStateHash(state: JourneyState): string {
  const serialized = JSON.stringify(sortForStableSerialization(state));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
