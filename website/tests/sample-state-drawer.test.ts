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
});
