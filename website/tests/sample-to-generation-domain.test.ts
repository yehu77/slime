import { describe, expect, it } from "vitest";

import {
  SAMPLE_TO_GENERATION_OBSERVATIONS,
  SampleToGenerationFixtureSchema,
  SampleToGenerationSampleSchema,
  appendResponseAtomically,
  checkSampleToGenerationInvariants,
  cloneSeedSamplesIntoGroups,
  decodeSglangResponseEvidence,
  materializeSampleToGenerationStates,
  reduceSampleToGeneration,
  sampleToGenerationFixture,
  seekSampleToGeneration,
  type ResponseReceipt,
  type ResponseWrite,
  type SampleToGenerationFixture,
} from "@/core/sample-to-generation";

describe("sample-to-generation deterministic trace", () => {
  it("accepts an explicitly unlabeled Sample projection", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    expect(
      SampleToGenerationSampleSchema.parse({
        ...state.seed_samples["origin-a"],
        label: null,
      }).label,
    ).toBeNull();
  });

  it("materializes the seven fixed observation points in order", () => {
    const states = materializeSampleToGenerationStates(
      sampleToGenerationFixture,
    );
    expect(states.map((state) => state.observation_id)).toEqual(
      SAMPLE_TO_GENERATION_OBSERVATIONS,
    );
    for (const state of states) {
      expect(
        checkSampleToGenerationInvariants(state, sampleToGenerationFixture).filter(
          (check) => check.status === "fail",
        ),
      ).toEqual([]);
    }
  });

  it("constructs two seed Samples without inventing generation values", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    expect(state.seed_samples["origin-a"]).toMatchObject({
      prompt: "3 + 2 = ?",
      label: "5",
      tokens: [],
      multimodal_inputs: null,
      response: "",
      response_length: 0,
      reward: null,
      loss_mask: null,
      rollout_log_probs: null,
      status: "pending",
    });
    expect(state.samples).toEqual({});
  });

  it("forms a 2×2 identity matrix with independent clones", () => {
    const seedState = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    const clones = cloneSeedSamplesIntoGroups(
      sampleToGenerationFixture,
      seedState.seed_samples,
    );
    expect(
      Object.fromEntries(
        Object.entries(clones).map(([sampleId, sample]) => [
          sampleId,
          [sample.group_index, sample.index],
        ]),
      ),
    ).toEqual({ a0: [0, 0], a1: [0, 1], b0: [1, 2], b1: [1, 3] });
    expect(clones.a0).not.toBe(clones.a1);
    expect(clones.a0.metadata).not.toBe(clones.a1.metadata);
    clones.a0.metadata.only_a0 = true;
    expect(clones.a1.metadata).not.toHaveProperty("only_a0");
  });

  it("isolates nested metadata and mutable arrays from siblings and the seed", () => {
    const seedState = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    const seedA = {
      ...seedState.seed_samples["origin-a"],
      metadata: {
        ...seedState.seed_samples["origin-a"].metadata,
        audit: { notes: [] as string[] },
      },
    };
    const seeds = { ...seedState.seed_samples, "origin-a": seedA };
    const clones = cloneSeedSamplesIntoGroups(sampleToGenerationFixture, seeds);
    const a0Metadata = clones.a0.metadata as { audit: { notes: string[] } };
    const a1Metadata = clones.a1.metadata as { audit: { notes: string[] } };
    const seedMetadata = seedA.metadata as { audit: { notes: string[] } };

    a0Metadata.audit.notes.push("a0-only");
    clones.a0.tokens.push(999);
    clones.a0.weight_versions.push("actor@test");

    expect(a0Metadata.audit.notes).toEqual(["a0-only"]);
    expect(a1Metadata.audit.notes).toEqual([]);
    expect(seedMetadata.audit.notes).toEqual([]);
    expect(clones.a0.metadata).not.toBe(clones.a1.metadata);
    expect(a0Metadata.audit).not.toBe(a1Metadata.audit);
    expect(clones.a0.tokens).not.toBe(clones.a1.tokens);
    expect(clones.a1.tokens).toEqual([]);
    expect(seedA.tokens).toEqual([]);
    expect(clones.a0.weight_versions).not.toBe(clones.a1.weight_versions);
    expect(clones.a1.weight_versions).toEqual([]);
  });

  it("rejects a group plan whose distinct seeds reuse one group_index", () => {
    const invalidFixture = structuredClone(sampleToGenerationFixture);
    invalidFixture.group_plan[1].group_index = invalidFixture.group_plan[0].group_index;
    expect(() => SampleToGenerationFixtureSchema.parse(invalidFixture)).toThrow(
      /group indices must be unique/,
    );
  });

  it("persists prompt tokens only while preparing isolated request snapshots", () => {
    const tokenized = seekSampleToGeneration(
      sampleToGenerationFixture,
      "prompts-tokenized",
    );
    expect(
      Object.fromEntries(
        Object.entries(tokenized.samples).map(([sampleId, sample]) => [
          sampleId,
          sample.tokens,
        ]),
      ),
    ).toEqual({ a0: [], a1: [], b0: [], b1: [] });
    expect(tokenized.changed_sample_ids).toEqual([]);

    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    expect(prepared.changed_sample_ids).toEqual(["a0", "a1", "b0", "b1"]);
    for (const [sampleId, sample] of Object.entries(prepared.samples)) {
      const request = prepared.requests[sampleId];
      const before = tokenized.samples[sampleId];

      expect(request.payload.input_ids).toEqual(sample.tokens);
      expect(request.payload.input_ids).not.toBe(sample.tokens);
      expect(sample).toEqual({ ...before, tokens: request.payload.input_ids });
      expect(Object.keys(request.payload).sort()).toEqual([
        "input_ids",
        "return_logprob",
        "sampling_params",
      ]);
      expect(request.payload.sampling_params).toEqual(
        sampleToGenerationFixture.sampling_params,
      );
      expect(request.payload.sampling_params).not.toBe(
        sampleToGenerationFixture.sampling_params,
      );
      expect(request.payload.sampling_params.max_new_tokens).toBe(1);
      expect(request.payload.return_logprob).toBe(true);
      expect(request.payload).not.toHaveProperty("sample_id");
      expect(JSON.stringify(request.payload)).not.toMatch(
        /"(?:origin_id|group_index|index|prompt|tokens|multimodal_inputs|response|response_length|label|reward|loss_mask|weight_versions|rollout_log_probs|status|metadata|train_metadata|sample_id)"/,
      );
      expect(sample).toMatchObject({
        response: "",
        response_length: 0,
        reward: null,
        loss_mask: null,
        weight_versions: [],
        rollout_log_probs: null,
        status: "pending",
        train_metadata: null,
      });
    }
  });

  it("receives raw HTTP bodies, decodes course evidence, and leaves Samples unchanged", () => {
    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    const received = seekSampleToGeneration(
      sampleToGenerationFixture,
      "responses-received",
    );
    expect(received.changed_sample_ids).toEqual([]);
    expect(received.samples).toEqual(prepared.samples);
    expect(received.requests).toEqual(prepared.requests);
    expect(Object.keys(received.response_receipts).sort()).toEqual(["a0", "a1", "b0", "b1"]);
    expect(Object.keys(received.response_evidence).sort()).toEqual(["a0", "a1", "b0", "b1"]);

    expect(received.response_receipts.a0).toEqual({
      sample_id: "a0",
      raw_body: {
        text: "5",
        meta_info: {
          output_token_logprobs: [[-0.356675, 25]],
          finish_reason: { type: "stop" },
          weight_version: "actor@0",
        },
      },
    });
    expect(received.response_receipts.a0.raw_body).not.toHaveProperty("sample_id");
    expect(received.response_receipts.a0).not.toBe(
      sampleToGenerationFixture.response_receipts[0],
    );
    expect(received.response_evidence.a0).toEqual({
      sample_id: "a0",
      text: "5",
      tokens: [25],
      log_probabilities: [-0.356675],
      meta_info: {
        output_token_logprobs: [[-0.356675, 25]],
        finish_reason: { type: "stop" },
        weight_version: "actor@0",
      },
    });
    for (const sample of Object.values(received.samples)) {
      expect(sample).toMatchObject({
        response: "",
        response_length: 0,
        reward: null,
        loss_mask: null,
        rollout_log_probs: null,
        weight_versions: [],
        status: "pending",
      });
    }
  });

  it("decodes tuple positions and preserves the source fallback when log-probs are absent", () => {
    const receipt = sampleToGenerationFixture.response_receipts[0];
    expect(decodeSglangResponseEvidence(receipt)).toEqual({
      sample_id: "a0",
      text: "5",
      tokens: [25],
      log_probabilities: [-0.356675],
      meta_info: {
        output_token_logprobs: [[-0.356675, 25]],
        finish_reason: { type: "stop" },
        weight_version: "actor@0",
      },
    });

    const noLogprobReceipt = structuredClone(receipt) as ResponseReceipt;
    delete noLogprobReceipt.raw_body.meta_info.output_token_logprobs;
    const beforeDecode = JSON.stringify(noLogprobReceipt);
    expect(decodeSglangResponseEvidence(noLogprobReceipt)).toEqual({
      sample_id: "a0",
      text: "5",
      tokens: [],
      log_probabilities: [],
      meta_info: {
        finish_reason: { type: "stop" },
        weight_version: "actor@0",
      },
    });
    expect(JSON.stringify(noLogprobReceipt)).toBe(beforeDecode);

    const extendedTupleReceipt = structuredClone(receipt) as ResponseReceipt;
    extendedTupleReceipt.raw_body.meta_info.output_token_logprobs = [
      [-0.356675, 25, { top_logprobs: [[25, -0.356675]] }],
    ];
    const withoutWeightVersion = structuredClone(extendedTupleReceipt) as ResponseReceipt;
    delete withoutWeightVersion.raw_body.meta_info.weight_version;
    expect(decodeSglangResponseEvidence(withoutWeightVersion)).toEqual({
      sample_id: "a0",
      text: "5",
      tokens: [25],
      log_probabilities: [-0.356675],
      meta_info: {
        output_token_logprobs: [
          [-0.356675, 25, { top_logprobs: [[25, -0.356675]] }],
        ],
        finish_reason: { type: "stop" },
      },
    });

    const lengthReceipt = structuredClone(receipt) as ResponseReceipt;
    lengthReceipt.raw_body.meta_info.finish_reason = {
      type: "length",
      matched_stop: false,
    };
    expect(decodeSglangResponseEvidence(lengthReceipt).meta_info.finish_reason).toEqual({
      type: "length",
      matched_stop: false,
    });
  });

  it("retains every server meta_info field through decode and Chapter 6 consumption", () => {
    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    const receipt = structuredClone(
      sampleToGenerationFixture.response_receipts[0],
    ) as ResponseReceipt;
    receipt.raw_body.meta_info.cache_hit = true;
    receipt.raw_body.meta_info.server_trace = {
      request_id: "sgl-42",
      timings_ms: [2, 7],
    };
    receipt.raw_body.meta_info.finish_reason = {
      type: "stop",
      matched_stop: "<eos>",
    };
    const receiptBeforeDecode = structuredClone(receipt);

    const evidence = decodeSglangResponseEvidence(receipt);
    expect(evidence.meta_info).toEqual(receipt.raw_body.meta_info);
    expect(receipt).toEqual(receiptBeforeDecode);

    const evidenceBeforeWrite = structuredClone(evidence);
    const written = appendResponseAtomically(prepared.samples.a0, evidence);
    expect(evidence).toEqual(evidenceBeforeWrite);
    expect(evidence.meta_info.cache_hit).toBe(true);
    expect(evidence.meta_info.server_trace).toEqual({
      request_id: "sgl-42",
      timings_ms: [2, 7],
    });
    expect(written.status).toBe("completed");
  });

  it.each(["missing", "empty"] as const)(
    "keeps loss_mask null while exposing [] rollout log-probs when output_token_logprobs is %s",
    (kind) => {
      const prepared = seekSampleToGeneration(
        sampleToGenerationFixture,
        "requests-prepared",
      );
      const receipt = structuredClone(
        sampleToGenerationFixture.response_receipts[0],
      ) as ResponseReceipt;
      if (kind === "missing") {
        delete receipt.raw_body.meta_info.output_token_logprobs;
      } else {
        receipt.raw_body.meta_info.output_token_logprobs = [];
      }

      const evidence = decodeSglangResponseEvidence(receipt);
      const written = appendResponseAtomically(prepared.samples.a0, evidence);

      expect(evidence.tokens).toEqual([]);
      expect(evidence.log_probabilities).toEqual([]);
      expect(written.tokens).toEqual(prepared.samples.a0.tokens);
      expect(written.response).toBe("5");
      expect(written.response_length).toBe(0);
      expect(written.loss_mask).toBeNull();
      expect(written.rollout_log_probs).toEqual([]);
      expect(written.status).toBe("completed");
      expect(written.weight_versions).toEqual(["actor@0"]);
    },
  );

  it("does not publish partial response sidecars when one receipt is malformed", () => {
    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    const before = structuredClone(prepared);
    const malformedFixture = structuredClone(sampleToGenerationFixture);
    malformedFixture.response_receipts[2].raw_body.meta_info.weight_version =
      42 as unknown as string;

    expect(() => reduceSampleToGeneration(
      prepared,
      { type: "next" },
      malformedFixture as SampleToGenerationFixture,
    )).toThrow(/expected string/i);
    expect(prepared).toEqual(before);
    expect(prepared.response_receipts).toEqual({});
    expect(prepared.response_evidence).toEqual({});
  });

  it("writes four terminal responses while preserving prompt prefixes and null rewards", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "responses-written",
    );
    expect(
      Object.fromEntries(
        Object.entries(state.samples).map(([id, sample]) => [
          id,
          {
            response: sample.response,
            logProb: sample.rollout_log_probs?.[0],
            status: sample.status,
            reward: sample.reward,
          },
        ]),
      ),
    ).toEqual({
      a0: { response: "5", logProb: -0.356675, status: "completed", reward: null },
      a1: { response: "6", logProb: -1.609438, status: "completed", reward: null },
      b0: { response: "7", logProb: -0.430783, status: "completed", reward: null },
      b1: { response: "8", logProb: -1.386294, status: "completed", reward: null },
    });

    for (const sample of Object.values(state.samples)) {
      const prefix =
        sampleToGenerationFixture.tokenizer.prompt_encodings[sample.origin_id];
      expect(sample.tokens.slice(0, prefix.length)).toEqual(prefix);
      expect(sample.response_length).toBe(1);
      expect(sample.loss_mask).toHaveLength(sample.response_length);
      expect(sample.rollout_log_probs).toHaveLength(sample.response_length);
      expect(sample.weight_versions).toEqual(["actor@0"]);
      expect(sample.train_metadata).toBeNull();
    }
    expect(state.samples.a1.response).not.toBe(state.samples.a1.label);
    expect(state.samples.a1.status).toBe("completed");
  });

  it.each([
    { finishReason: "stop" as const, expectedStatus: "completed" as const, weightVersion: "actor@1" },
    { finishReason: "stop" as const, expectedStatus: "completed" as const, weightVersion: undefined },
    { finishReason: "length" as const, expectedStatus: "truncated" as const, weightVersion: "actor@1" },
    { finishReason: "length" as const, expectedStatus: "truncated" as const, weightVersion: undefined },
    { finishReason: "abort" as const, expectedStatus: "aborted" as const, weightVersion: "actor@1" },
    { finishReason: "abort" as const, expectedStatus: "aborted" as const, weightVersion: undefined },
  ])(
    "copy-on-write projects a two-token continuation for $finishReason with weight version $weightVersion",
    ({ finishReason, expectedStatus, weightVersion }) => {
      const prepared = seekSampleToGeneration(
        sampleToGenerationFixture,
        "requests-prepared",
      );
      const promptPrefix =
        sampleToGenerationFixture.tokenizer.prompt_encodings["origin-a"];
      const original = SampleToGenerationSampleSchema.parse({
        ...prepared.samples.a0,
        tokens: [...promptPrefix, 25],
        response: "5",
        response_length: 1,
        loss_mask: [1],
        rollout_log_probs: [-0.356675],
        weight_versions: ["actor@0"],
        status: "pending",
      });
      const evidence = {
        sample_id: "a0",
        text: "67",
        tokens: [26, 27],
        log_probabilities: [-0.7, -0.8],
        meta_info: {
          finish_reason: { type: finishReason },
          ...(weightVersion === undefined
            ? {}
            : { weight_version: weightVersion }),
        },
      } satisfies ResponseWrite;
      const originalBefore = structuredClone(original);
      const evidenceBefore = structuredClone(evidence);

      const written = appendResponseAtomically(original, evidence);

      expect(written).not.toBe(original);
      expect(written.tokens).toEqual([...promptPrefix, 25, 26, 27]);
      expect(written.tokens.slice(0, promptPrefix.length)).toEqual(promptPrefix);
      expect(written.response).toBe("567");
      expect(written.response_length).toBe(3);
      expect(written.loss_mask).toEqual([1, 1, 1]);
      expect(written.rollout_log_probs).toEqual([
        -0.356675,
        -0.7,
        -0.8,
      ]);
      expect(written.weight_versions).toEqual(
        weightVersion === undefined
          ? ["actor@0"]
          : ["actor@0", weightVersion],
      );
      expect(written.status).toBe(expectedStatus);
      expect(original).toEqual(originalBefore);
      expect(evidence).toEqual(evidenceBefore);
    },
  );

  it("rejects a trainable continuation when existing response tokens have no rollout log-probs", () => {
    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    const original = SampleToGenerationSampleSchema.parse({
      ...prepared.samples.a0,
      tokens: [...prepared.samples.a0.tokens, 25],
      response: "5",
      response_length: 1,
      loss_mask: [1],
      rollout_log_probs: null,
      status: "pending",
    });
    const evidence = {
      sample_id: "a0",
      text: "6",
      tokens: [26],
      log_probabilities: [-0.7],
      meta_info: {
        finish_reason: { type: "stop" },
        weight_version: "actor@1",
      },
    } satisfies ResponseWrite;
    const originalBefore = structuredClone(original);
    const evidenceBefore = structuredClone(evidence);

    expect(() => appendResponseAtomically(original, evidence)).toThrow(
      /existing response tokens have no rollout log-probs/,
    );
    expect(original).toEqual(originalBefore);
    expect(evidence).toEqual(evidenceBefore);
  });

  it("rejects mismatched response metadata before mutating the original Sample", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    const original = state.samples.a0;
    const malformed = {
      sample_id: "a0",
      text: "56",
      tokens: [25, 26],
      log_probabilities: [-0.356675],
      meta_info: {
        finish_reason: { type: "stop" },
        weight_version: "actor@0",
      },
    } satisfies ResponseWrite;
    const originalBefore = structuredClone(original);
    const malformedBefore = structuredClone(malformed);

    expect(() => appendResponseAtomically(original, malformed)).toThrow(
      /token\/log-prob lengths differ/,
    );
    expect(original).toEqual(originalBefore);
    expect(malformed).toEqual(malformedBefore);
  });
});
