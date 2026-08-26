import { describe, expect, it } from "vitest";

import { getDrawerFieldProvenance } from "@/components/mechanism/SampleStateDrawer";

describe("Sample state drawer provenance", () => {
  it("distinguishes Dataset arguments from dataclass defaults for the initial Sample", () => {
    expect(getDrawerFieldProvenance({
      observationId: "samples-constructed",
      field: "prompt",
      currentValue: "3 + 2 = ?",
      previousValue: undefined,
      hasPreviousSample: false,
    })).toBe("Dataset 显式传入");
    expect(getDrawerFieldProvenance({
      observationId: "samples-constructed",
      field: "multimodal_inputs",
      currentValue: null,
      previousValue: undefined,
      hasPreviousSample: false,
    })).toBe("Dataset 显式传入");
    expect(getDrawerFieldProvenance({
      observationId: "samples-constructed",
      field: "tokens",
      currentValue: [],
      previousValue: undefined,
      hasPreviousSample: false,
    })).toBe("dataclass 默认值");
    expect(getDrawerFieldProvenance({
      observationId: "samples-constructed",
      field: "status",
      currentValue: "pending",
      previousValue: undefined,
      hasPreviousSample: false,
    })).toBe("dataclass 默认值");
  });

  it("distinguishes unchanged values from fields updated by later observations", () => {
    expect(getDrawerFieldProvenance({
      observationId: "groups-built",
      field: "prompt",
      currentValue: "3 + 2 = ?",
      previousValue: "3 + 2 = ?",
      hasPreviousSample: true,
    })).toBe("保持不变");
    expect(getDrawerFieldProvenance({
      observationId: "groups-built",
      field: "group_index",
      currentValue: 0,
      previousValue: null,
      hasPreviousSample: true,
    })).toBe("本步更新");
  });

  it("marks tokens unchanged at tokenization and updated during request preparation", () => {
    expect(getDrawerFieldProvenance({
      observationId: "prompts-tokenized",
      field: "tokens",
      currentValue: [],
      previousValue: [],
      hasPreviousSample: true,
    })).toBe("保持不变");
    expect(getDrawerFieldProvenance({
      observationId: "requests-prepared",
      field: "tokens",
      currentValue: [11, 12, 13, 14, 15],
      previousValue: [],
      hasPreviousSample: true,
    })).toBe("本步更新");
  });

  it("marks exactly the writeback-owned fields at responses-written", () => {
    const updatedFields = [
      ["tokens", [11, 12, 13, 14, 15, 25, 27], [11, 12, 13, 14, 15]],
      ["response", "5", ""],
      ["response_length", 2, 0],
      ["loss_mask", [1, 1], null],
      ["rollout_log_probs", [-0.2, -1.1], null],
      ["weight_versions", ["actor@42"], []],
      ["status", "completed", "pending"],
    ] as const;
    for (const [field, currentValue, previousValue] of updatedFields) {
      expect(getDrawerFieldProvenance({
        observationId: "responses-written",
        field,
        currentValue,
        previousValue,
        hasPreviousSample: true,
      })).toBe("本步更新");
    }

    const unchangedFields = [
      ["group_index", 0],
      ["index", 0],
      ["prompt", "3 + 2 = ?"],
      ["multimodal_inputs", null],
      ["label", "5"],
      ["reward", null],
      ["metadata", { split: "train" }],
      ["train_metadata", null],
    ] as const;
    for (const [field, value] of unchangedFields) {
      expect(getDrawerFieldProvenance({
        observationId: "responses-written",
        field,
        currentValue: value,
        previousValue: value,
        hasPreviousSample: true,
      })).toBe("保持不变");
    }
  });
});
