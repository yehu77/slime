import type { JourneyState } from "./reducer";

export type InvariantStatus = "pass" | "fail" | "not_applicable";

export type InvariantResult = {
  id: string;
  status: InvariantStatus;
  message: string;
  sample_id?: string;
  expected?: unknown;
  actual?: unknown;
};

function lengthInvariant(
  id: string,
  label: string,
  sampleId: string,
  value: unknown[] | null,
  responseLength: number,
): InvariantResult {
  if (value === null) {
    return {
      id,
      status: "not_applicable",
      sample_id: sampleId,
      message: `${label} has not been produced in this phase`,
    };
  }
  return value.length === responseLength
    ? {
        id,
        status: "pass",
        sample_id: sampleId,
        message: `${label} aligns with response_length`,
      }
    : {
        id,
        status: "fail",
        sample_id: sampleId,
        message: `${label} must align with response_length`,
        expected: responseLength,
        actual: value.length,
      };
}

export function checkJourneyInvariants(state: JourneyState): InvariantResult[] {
  const results: InvariantResult[] = [];

  for (const [sampleId, sample] of Object.entries(state.raw_samples)) {
    results.push(
      sample.tokens.length >= sample.response_length
        ? {
            id: "sample.tokens-contain-response",
            status: "pass",
            sample_id: sampleId,
            message: "tokens contain a response suffix",
          }
        : {
            id: "sample.tokens-contain-response",
            status: "fail",
            sample_id: sampleId,
            message: "tokens must contain at least response_length suffix tokens",
            expected: `>= ${sample.response_length}`,
            actual: sample.tokens.length,
          },
      lengthInvariant(
        "sample.loss-mask-length",
        "loss_mask",
        sampleId,
        sample.loss_mask,
        sample.response_length,
      ),
      lengthInvariant(
        "sample.rollout-log-probs-length",
        "rollout_log_probs",
        sampleId,
        sample.rollout_log_probs,
        sample.response_length,
      ),
    );
  }

  const assignedSamples = Object.values(state.raw_samples).filter(
    (sample) => sample.index !== null,
  );
  if (assignedSamples.length === 0) {
    results.push({
      id: "identity.sample-index-unique",
      status: "not_applicable",
      message: "Sample indices have not been assigned in this phase",
    });
  } else {
    const indices = assignedSamples.map((sample) => sample.index);
    results.push(
      new Set(indices).size === indices.length
        ? {
            id: "identity.sample-index-unique",
            status: "pass",
            message: "Every physical Sample has a unique index",
          }
        : {
            id: "identity.sample-index-unique",
            status: "fail",
            message: "Physical Sample indices must be unique",
            expected: indices.length,
            actual: new Set(indices).size,
          },
    );
  }

  const trainData = state.derived.train_data;
  if (trainData === null) {
    results.push({
      id: "derived.columns-aligned",
      status: "not_applicable",
      message: "Train data has not been built in this phase",
    });
  } else {
    const columnLengths = [
      trainData.tokens.length,
      trainData.response_lengths.length,
      trainData.raw_reward.length,
      trainData.rewards.length,
      trainData.truncated.length,
      trainData.sample_indices.length,
      trainData.rollout_ids.length,
      trainData.loss_masks.length,
      trainData.rollout_mask_sums.length,
    ];
    results.push(
      columnLengths.every((length) => length === trainData.sample_ids.length)
        ? {
            id: "derived.columns-aligned",
            status: "pass",
            message: "All derived train-data columns align with sample_ids",
          }
        : {
            id: "derived.columns-aligned",
            status: "fail",
            message: "All derived train-data columns must have equal length",
            expected: trainData.sample_ids.length,
            actual: columnLengths,
          },
    );
    trainData.loss_masks.forEach((mask, index) => {
      const responseLength = trainData.response_lengths[index];
      results.push(
        mask.length === responseLength
          ? {
              id: "derived.loss-mask-length",
              status: "pass",
              sample_id: trainData.sample_ids[index],
              message: "Derived loss mask aligns with response length",
            }
          : {
              id: "derived.loss-mask-length",
              status: "fail",
              sample_id: trainData.sample_ids[index],
              message: "Derived loss mask must align with response length",
              expected: responseLength,
              actual: mask.length,
            },
      );
    });
  }

  const schedule = state.derived.schedule;
  if (schedule === null) {
    results.push({
      id: "schedule.rollouts-conserved",
      status: "not_applicable",
      message: "A training schedule has not been built in this phase",
    });
  } else {
    const scheduledIds = schedule.steps.flatMap((step) => step.rollout_ids);
    const distinctIds = new Set(scheduledIds);
    results.push(
      distinctIds.size === scheduledIds.length &&
        scheduledIds.length === schedule.used_rollouts
        ? {
            id: "schedule.rollouts-conserved",
            status: "pass",
            message: "Every used logical rollout is scheduled exactly once",
          }
        : {
            id: "schedule.rollouts-conserved",
            status: "fail",
            message: "Used logical rollouts must be scheduled exactly once",
            expected: schedule.used_rollouts,
            actual: distinctIds.size,
          },
    );
  }

  results.push(
    state.system.weights_published &&
      state.system.actor_version !== state.system.rollout_version
      ? {
          id: "system.published-version-aligned",
          status: "fail",
          message: "Published rollout weights must match the trained actor version",
          expected: state.system.actor_version,
          actual: state.system.rollout_version,
        }
      : state.system.weights_published
        ? {
            id: "system.published-version-aligned",
            status: "pass",
            message: "Published rollout weights match the actor version",
          }
        : {
            id: "system.published-version-aligned",
            status: "not_applicable",
            message: "New actor weights have not been published in this phase",
          },
  );

  return results;
}

export function getFailedJourneyInvariants(
  state: JourneyState,
): InvariantResult[] {
  return checkJourneyInvariants(state).filter((result) => result.status === "fail");
}
