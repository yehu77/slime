import { systemIntroManifest, type SystemIntroPhaseId, type SystemIntroUnitId } from "../../content/zh";
import { sampleTraceFixture } from "./SampleTraceLab";
import type { TimelineMode } from "./types";

export const systemIntroPhaseOrder: readonly SystemIntroPhaseId[] = [
  "orient",
  "model",
  "verify",
  "practice",
];

type StoredSystemIntroResume = {
  unit_id?: string;
  phase_id?: string;
  event_id?: string;
  selected_sample_id?: string;
  timeline_mode?: TimelineMode;
} | null;

export type ResolvedSystemIntroLocation = {
  unitId: SystemIntroUnitId;
  phaseId: SystemIntroPhaseId;
  eventId: string;
  sampleId: string;
  timelineMode: TimelineMode;
  valid: boolean;
};

/**
 * Resolve current and legacy system-intro URLs without granting progress for an
 * invalid location. Legacy act hashes point at the first event produced by that
 * act, so old bookmarks preserve their original observation rather than merely
 * landing somewhere inside the trace unit.
 */
export function resolveSystemIntroLocation(
  url: URL,
  resume: StoredSystemIntroResume = null,
): ResolvedSystemIntroLocation {
  const requestedUnit = url.searchParams.get("unit");
  const unitIds = new Set(systemIntroManifest.units.map((unit) => unit.id));
  const requestedEvent = url.searchParams.get("event");
  const eventIsValid = Boolean(
    requestedEvent && sampleTraceFixture.events.some((event) => event.id === requestedEvent),
  );
  const rawHash = url.hash.replace(/^#/, "");
  const legacyActMatch = /^act-([1-7])$/.exec(rawHash);
  const legacyActEvent = legacyActMatch
    ? sampleTraceFixture.events.find((event) => event.act === Number(legacyActMatch[1]))
    : undefined;

  let valid = true;
  let unitId: SystemIntroUnitId;
  if (requestedUnit && unitIds.has(requestedUnit as SystemIntroUnitId)) {
    unitId = requestedUnit as SystemIntroUnitId;
  } else if (!requestedUnit && eventIsValid) {
    unitId = "sample-probe";
  } else if (!requestedUnit && resume?.unit_id && unitIds.has(resume.unit_id as SystemIntroUnitId)) {
    unitId = resume.unit_id as SystemIntroUnitId;
  } else {
    unitId = "loop-boundary";
    if (requestedUnit) valid = false;
  }

  let phaseId: SystemIntroPhaseId = "orient";
  if (systemIntroPhaseOrder.includes(rawHash as SystemIntroPhaseId)) {
    phaseId = rawHash as SystemIntroPhaseId;
  } else if (legacyActEvent) {
    unitId = "sample-probe";
    phaseId = "verify";
  } else if (rawHash === "sample-invariants") {
    unitId = "sample-probe";
    phaseId = "verify";
  } else if (rawHash === "overview") {
    unitId = "loop-boundary";
  } else if (rawHash) {
    valid = false;
  } else if (!requestedUnit && eventIsValid) {
    phaseId = "verify";
  } else if (resume?.phase_id && systemIntroPhaseOrder.includes(resume.phase_id as SystemIntroPhaseId)) {
    phaseId = resume.phase_id as SystemIntroPhaseId;
  }

  const eventId = legacyActEvent?.id
    ?? (eventIsValid ? requestedEvent : null)
    ?? (resume?.event_id && sampleTraceFixture.events.some((event) => event.id === resume.event_id)
      ? resume.event_id
      : sampleTraceFixture.events[0].id);
  const requestedSample = url.searchParams.get("sample");
  const sampleId = requestedSample && sampleTraceFixture.initial_samples[requestedSample]
    ? requestedSample
    : resume?.selected_sample_id && sampleTraceFixture.initial_samples[resume.selected_sample_id]
      ? resume.selected_sample_id
      : "a0";
  const timelineMode: TimelineMode = url.searchParams.get("timeline") === "async"
    ? "async"
    : resume?.timeline_mode ?? "sync";

  return { unitId, phaseId, eventId, sampleId, timelineMode, valid };
}
