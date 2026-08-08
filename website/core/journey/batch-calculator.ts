export type BatchCalculationInput = {
  prompt_groups: number;
  samples_per_prompt: number;
  global_batch_size?: number;
  num_steps_per_rollout?: number;
  mode?: "global_batch_size" | "num_steps";
  physical_samples?: number;
  dp_size?: number;
};

export type BatchFeedback = {
  code: string;
  message: string;
};

export type BatchCalculation = {
  valid: boolean;
  prompt_groups: number;
  samples_per_prompt: number;
  logical_rollouts: number;
  physical_samples: number;
  global_batch_size: number;
  requested_steps: number | null;
  train_steps: number;
  used_rollouts: number;
  trimmed_rollouts: number;
  dp_size: number;
  warnings: BatchFeedback[];
  errors: BatchFeedback[];
};

function positiveIntegerError(field: string, value: number): BatchFeedback | null {
  return Number.isInteger(value) && value > 0
    ? null
    : {
        code: `invalid-${field}`,
        message: `${field} 只接受大于 0 的整数（当前值：${String(value)}）。`,
      };
}

export function calculateBatch(input: BatchCalculationInput): BatchCalculation {
  const mode = input.mode ?? "global_batch_size";
  const physicalSamples = input.physical_samples ??
    input.prompt_groups * input.samples_per_prompt;
  const dpSize = input.dp_size ?? 1;
  const requestedSteps =
    mode === "num_steps" ? (input.num_steps_per_rollout ?? Number.NaN) : null;

  const requiredValues: Array<[string, number]> = [
    ["prompt_groups", input.prompt_groups],
    ["samples_per_prompt", input.samples_per_prompt],
    ["physical_samples", physicalSamples],
    ["dp_size", dpSize],
  ];
  if (mode === "global_batch_size") {
    requiredValues.push([
      "global_batch_size",
      input.global_batch_size ?? Number.NaN,
    ]);
  } else {
    requiredValues.push(["num_steps_per_rollout", requestedSteps ?? Number.NaN]);
  }

  const errors = requiredValues
    .map(([field, value]) => positiveIntegerError(field, value))
    .filter((error): error is BatchFeedback => error !== null);

  const logicalRollouts =
    Number.isFinite(input.prompt_groups) &&
    Number.isFinite(input.samples_per_prompt)
      ? input.prompt_groups * input.samples_per_prompt
      : 0;
  const globalBatchSize =
    mode === "num_steps"
      ? requestedSteps && requestedSteps > 0
        ? Math.floor(logicalRollouts / requestedSteps)
        : 0
      : (input.global_batch_size ?? 0);

  if (
    errors.length === 0 &&
    mode === "num_steps" &&
    globalBatchSize === 0
  ) {
    errors.push({
      code: "zero-global-batch",
      message: "请求的 step 数大于 logical rollout 数，整数计算会得到无效的 global batch size 0。",
    });
  }
  if (errors.length === 0 && globalBatchSize > logicalRollouts) {
    errors.push({
      code: "global-batch-exceeds-rollouts",
      message: "global batch size 大于本轮 logical rollout 数，无法形成完整 training step。",
    });
  }

  const canCalculate = errors.length === 0 && globalBatchSize > 0;
  const trainSteps = canCalculate
    ? Math.floor(logicalRollouts / globalBatchSize)
    : 0;
  const usedRollouts = trainSteps * globalBatchSize;
  const trimmedRollouts = canCalculate ? logicalRollouts - usedRollouts : 0;
  const warnings: BatchFeedback[] = [];

  if (canCalculate && trimmedRollouts > 0) {
    warnings.push({
      code: "trailing-rollouts-trimmed",
      message: `尾部 ${trimmedRollouts} 个 logical rollout 不足一个完整 step，会被 scheduler trimming。`,
    });
  }
  if (
    canCalculate &&
    logicalRollouts > 0 &&
    (physicalSamples * globalBatchSize) / logicalRollouts < dpSize
  ) {
    warnings.push({
      code: "physical-samples-below-dp-size",
      message: "每个 step 的物理 sample 数少于 dp_size；每个 DP rank 至少需要一条 sample。",
    });
  }
  if (
    canCalculate &&
    requestedSteps !== null &&
    trainSteps !== requestedSteps
  ) {
    warnings.push({
      code: "requested-steps-not-met",
      message: `整数计算后实际形成 ${trainSteps} 个 step，与请求的 ${requestedSteps} 个不同。`,
    });
  }

  return {
    valid: errors.length === 0,
    prompt_groups: input.prompt_groups,
    samples_per_prompt: input.samples_per_prompt,
    logical_rollouts: logicalRollouts,
    physical_samples: physicalSamples,
    global_batch_size: globalBatchSize,
    requested_steps: requestedSteps,
    train_steps: trainSteps,
    used_rollouts: usedRollouts,
    trimmed_rollouts: trimmedRollouts,
    dp_size: dpSize,
    warnings,
    errors,
  };
}
