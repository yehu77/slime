import { describe, expect, it } from "vitest";

import { resolveSystemIntroLocation } from "../components/journey/system-intro-location";

describe("system intro legacy URL migration", () => {
  it("moves an event-only bookmark to the trace verification phase", () => {
    const location = resolveSystemIntroLocation(
      new URL("https://example.test/learn/sample-journey?event=train_data_built&sample=a0&timeline=sync"),
    );

    expect(location).toMatchObject({
      unitId: "sample-probe",
      phaseId: "verify",
      eventId: "train_data_built",
      sampleId: "a0",
      timelineMode: "sync",
      valid: true,
    });
  });

  it.each([
    ["act-1", "ready"],
    ["act-2", "group_built"],
    ["act-3", "request_prepared"],
    ["act-4", "rewarded_collected"],
    ["act-5", "train_data_built"],
    ["act-6", "trained"],
    ["act-7", "weights_synced"],
  ])("maps #%s to the first event from that act", (hash, eventId) => {
    const location = resolveSystemIntroLocation(
      new URL(`https://example.test/learn/sample-journey?event=ready#${hash}`),
    );

    expect(location).toMatchObject({
      unitId: "sample-probe",
      phaseId: "verify",
      eventId,
      valid: true,
    });
  });

  it("moves the old microscope anchor to the trace verification phase", () => {
    expect(resolveSystemIntroLocation(
      new URL("https://example.test/learn/sample-journey#sample-invariants"),
    )).toMatchObject({
      unitId: "sample-probe",
      phaseId: "verify",
      valid: true,
    });
  });

  it("normalizes the retired overview anchor and rejects unknown hashes", () => {
    expect(resolveSystemIntroLocation(
      new URL("https://example.test/learn/sample-journey#overview"),
    )).toMatchObject({ unitId: "loop-boundary", phaseId: "orient", valid: true });
    expect(resolveSystemIntroLocation(
      new URL("https://example.test/learn/sample-journey#unknown"),
    )).toMatchObject({ unitId: "loop-boundary", phaseId: "orient", valid: false });
  });
});
