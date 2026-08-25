import type { StructuredExercise } from "@/core/sample-to-generation";

export type SampleToGenerationExplanation = {
  title: string;
  body: string;
};

export type SampleToGenerationMappingLane = {
  id: string;
  source: {
    label: string;
    code: string;
    value: string;
  };
  rule: {
    label: string;
    code: string;
    explanation: string;
  };
  target: {
    label: string;
    fields: readonly {
      field: string;
      value: string;
    }[];
  };
};

export type SampleToGenerationDefaultFieldGroup = {
  id: "dataset-explicit" | "dataclass-default";
  title: string;
  summary: string;
  fields: readonly {
    field: string;
    value: string;
    provenance: string;
    nextProducer?: string;
    interpretation: string;
  }[];
};

export type ProducerRelayStageId =
  | "dataset-construction"
  | "datasource-fanout"
  | "raw-generate"
  | "reward-wrapper"
  | "train-data-conversion";

export type ProducerRelayStage = {
  id: ProducerRelayStageId;
  order: number;
  title: string;
  producer: string;
  input: readonly string[];
  writes: readonly string[];
  output: readonly string[];
  trustworthyObservation: string;
  scope: string;
  caveat: string;
  sourceRefIds: readonly string[];
  derivedOutputs?: readonly {
    id: string;
    trainDataField: string;
    derivedFrom: readonly string[];
    rule: string;
    caveat?: string;
  }[];
};

export type FieldLifecycleProducer = {
  stageId: ProducerRelayStageId;
  producer: string;
  mode: "dataclass-default" | "explicit-initialization" | "runtime-write";
  value: string;
  condition: string;
};

export type FieldLifecycleEntry = {
  id: string;
  field: string;
  category: "input" | "identity" | "generation" | "evaluation" | "training";
  dataclassDefault: string;
  initializedBy: FieldLifecycleProducer;
  firstNonDefaultProducer: FieldLifecycleProducer | null;
  trustworthyFrom: {
    stageId: ProducerRelayStageId;
    observation: string;
  };
  legalTerminal?: {
    value: string;
    condition: string;
  };
  scope: string;
  caveat: string;
  sourceRefIds: readonly string[];
};

export type EarlyFieldDiagnosticCase = {
  id: string;
  title: string;
  snapshot: string;
  suspiciousField: string;
  observedValue: string;
  missingProducerStageId: ProducerRelayStageId;
  explanation: string;
  scope: string;
  caveat: string;
  sourceRefIds: readonly string[];
};

export type GroupingLabCandidate = {
  id: string;
  index: number;
};

export type GroupingLabGroup = {
  id: string;
  originId: string;
  prompt: string;
  label: string;
  metadata: Readonly<Record<string, string>>;
  groupIndex: number;
  candidates: readonly GroupingLabCandidate[];
  identityChecks: readonly {
    expression: string;
    result: boolean;
    meaning: string;
  }[];
};

export type GroupingCounterFrame = {
  id: string;
  order: number;
  operation: string;
  groupCounterBefore: number;
  sampleCounterBefore: number;
  writes: readonly string[];
  groupCounterAfter: number;
  sampleCounterAfter: number;
  explanation: string;
};

export type GroupingComparisonRule = {
  id: string;
  subject: string;
  withinGroup: string;
  objectContract: string;
  reason: string;
};

export type GroupingAliasProbe = {
  mutation: string;
  fixtureValue: string;
  mutatedValue: string;
  actualAfter: readonly {
    sampleId: string;
    value: string;
    explanation: string;
  }[];
  counterfactualAfter: readonly {
    sampleId: string;
    value: string;
    explanation: string;
  }[];
  boundary: string;
};

export type RequestAssemblyStageId =
  | "prepare-prompt"
  | "validate-budget"
  | "assemble-envelope"
  | "persist-prefix"
  | "dispatch-request";

export type RequestAssemblyStage = {
  id: RequestAssemblyStageId;
  order: number;
  title: string;
  producer: string;
  input: readonly string[];
  operation: string;
  output: readonly string[];
  callerEffect: string;
  networkEffect: string;
  sourceRefIds: readonly string[];
};

export type RequestManifestDestination =
  | "transformed"
  | "caller-ledger"
  | "json-body"
  | "not-produced"
  | "conditional-body"
  | "conditional-header";

export type RequestManifestEntry = {
  id: string;
  field: string;
  fixtureValue: string;
  origin: string;
  destination: RequestManifestDestination;
  path: string;
  reason: string;
  mainPath: boolean;
  sourceRefIds: readonly string[];
};

export type RequestSamplingParameter = {
  key: string;
  fixtureValue: string;
  runtimeArgument: string;
  role: string;
};

export type RequestFixturePacket = {
  sampleId: string;
  fromObservation: string;
  toObservation: string;
  prompt: string;
  promptIds: readonly number[];
  method: "POST";
  endpoint: "/generate";
  payload: {
    input_ids: readonly number[];
    sampling_params: Readonly<Record<string, unknown>>;
    return_logprob: true;
  };
};

export type SampleToGenerationTracePassport = {
  origin: {
    id: string;
    rowCode: string;
    rowShape: string;
  };
  config: readonly {
    key: string;
    value: string;
  }[];
  stopAt: string;
};

export type SampleToGenerationBranch = {
  title: string;
  body: string;
  edgeCases: readonly {
    condition: string;
    behavior: string;
  }[];
};

export type SampleToGenerationChapter = {
  id: string;
  number: number;
  slug: string;
  title: string;
  shortTitle: string;
  durationMinutes: number;
  drivingQuestion: string;
  imageSrc: string;
  imageAlt?: string;
  scopeLabel?: string;
  objective?: string;
  conclusion: string;
  boundary: {
    input: readonly string[];
    output: readonly string[];
    excluded: readonly string[];
  };
  stateTransition: {
    before: string;
    operation: string;
    after: string;
  };
  tracePassport?: SampleToGenerationTracePassport;
  mappingLanes?: readonly SampleToGenerationMappingLane[];
  defaultFieldGroups?: readonly SampleToGenerationDefaultFieldGroup[];
  producerRelayStages?: readonly ProducerRelayStage[];
  fieldLifecycleEntries?: readonly FieldLifecycleEntry[];
  earlyFieldDiagnosticCases?: readonly EarlyFieldDiagnosticCase[];
  groupingLabGroups?: readonly GroupingLabGroup[];
  groupingCounterFrames?: readonly GroupingCounterFrame[];
  groupingComparisonRules?: readonly GroupingComparisonRule[];
  groupingAliasProbe?: GroupingAliasProbe;
  requestAssemblyStages?: readonly RequestAssemblyStage[];
  requestManifestEntries?: readonly RequestManifestEntry[];
  requestSamplingParameters?: readonly RequestSamplingParameter[];
  requestFixturePacket?: RequestFixturePacket;
  branch?: SampleToGenerationBranch;
  explanation: readonly SampleToGenerationExplanation[];
  observationIds: readonly string[];
  sourceRefIds: readonly string[];
  evidenceId: string;
  additionalEvidenceIds?: readonly string[];
  exercise: StructuredExercise;
  misconception: {
    belief: string;
    correction: string;
  };
  takeaway: string;
  transition: string;
  advancedAside?: {
    title: string;
    body: string;
  };
};

export type SampleToGenerationSourceEvidence = {
  id: string;
  title: string;
  sourceRefId: string;
  claim: string;
  focus: readonly string[];
  boundary: string;
};

export type SampleToGenerationCourse = {
  metadata: {
    id: string;
    route: string;
    locale: string;
    title: string;
    summary: string;
    lessonRevision: number;
    assessmentVersion: number;
    durationMinutes: {
      chapters: number;
      assessment: number;
      total: number;
    };
    requiresGpu: boolean;
    sourceBaseline: {
      nearestTag: string;
      describe: string;
      commit: string;
    };
  };
  completion: {
    requiredChapterIds: readonly string[];
    minCorrect: number;
    requiredQuestionIds: readonly string[];
  };
  teachingValuesNotice: string;
  learningObjectives: readonly string[];
  chapters: readonly SampleToGenerationChapter[];
  finalAssessment: readonly StructuredExercise[];
  sourceEvidence: readonly SampleToGenerationSourceEvidence[];
};

/** Public course contract consumed by routes, progress, and curriculum views. */
export type CourseManifest = SampleToGenerationCourse;

export const sampleToGenerationSourceEvidence: readonly SampleToGenerationSourceEvidence[] = [
  {
    id: "evidence-row-to-sample",
    title: "源码核对：构造器没有接收生成结果",
    sourceRefId: "dataset.construct-sample",
    claim: "固定提交中，Dataset 显式传入 prompt=output_prompt、可选 label、metadata 与 multimodal_inputs；本章 processor=None，因此最后一项显式为 None。其余课程追踪字段不在这次调用中。",
    focus: [
      "output_prompt 是前面完成 schema 适配后的 prompt",
      "label 只有在 label_key 不为 None 时才从 row 读取",
      "未传入的生成与训练字段采用 Sample dataclass 的阶段默认值",
    ],
    boundary: "摘录只证明四个显式实参。metadata/chat-template 分支在同一 Dataset.__init__ 更早处；prompt_key/multimodal_keys 映射在 _build_messages。它不证明真实 token ID。",
  },
  {
    id: "evidence-sample-fields",
    title: "Sample 同时容纳多个生命周期阶段",
    sourceRefId: "sample.dataclass",
    claim: "Sample 的字段分属输入、身份、生成结果、后续评价与训练阶段；字段存在不等于字段已经产生。",
    focus: [
      "group_index 与 index 是可空身份字段",
      "tokens、response 与 response_length 描述生成前后状态",
      "reward、loss_mask 与 rollout_log_probs 初始都允许为空",
    ],
    boundary: "引导摘录集中展示 prompt、response、label、reward 与 response-space 默认值；group_index / index 位于类定义更前面，status=Sample.Status.PENDING 位于更后面，可由下方固定 commit 链接核对。dataclass 给出结构，不单独证明后续写入责任。",
  },
  {
    id: "evidence-deepcopy-groups",
    title: "DataSource 通过 deepcopy 建立独立候选",
    sourceRefId: "rollout.datasource-get-samples",
    claim: "每个 prompt_sample 被深拷贝 N 次；副本共享 group_index，但分别获得唯一 index。",
    focus: [
      "外层循环对应 prompt group",
      "内层循环次数由 n_samples_per_prompt 决定",
      "deepcopy 发生在写入 group_index 与 index 之前",
    ],
    boundary: "源码证明嵌套 fan-out、复制和递增规则；2×2 与从 0 开始的具体数值属于 fresh-counter 教学 fixture，不是每次调用都成立的框架常量。",
  },
  {
    id: "evidence-sample-identity-defaults",
    title: "候选身份在 DataSource 之前仍为空",
    sourceRefId: "sample.identity-defaults",
    claim: "Sample dataclass 把 group_index 与 index 初始化为 None；Dataset 创建 seed 时不会提前赋予本轮候选身份。",
    focus: [
      "group_index 与 index 是两个独立字段",
      "二者的默认值都是 None",
      "rollout_id 是另一种下游身份语义，本章不展开",
    ],
    boundary: "摘录只证明 dataclass 默认值，不证明 DataSource 的 fan-out 或计数器起点。",
  },
  {
    id: "evidence-datasource-counter-init",
    title: "fresh DataSource 的两个计数器从 0 起步",
    sourceRefId: "rollout.datasource-counter-init",
    claim: "新建 RolloutDataSource 时，sample_group_index 与 sample_index 都初始化为 0。",
    focus: [
      "组计数器与样本计数器分别保存",
      "本教学 fixture 使用 fresh DataSource",
      "计数器可以随调用推进，因此 0/1/2/3 不是全局常量",
    ],
    boundary: "本摘录只证明新实例的初始值；恢复状态和跨调用续接不属于本章主路径。",
  },
  {
    id: "evidence-prompt-request",
    title: "源码核对：prompt 先成为局部 token IDs",
    sourceRefId: "rollout.prepare-prompt-ids",
    claim: "纯文本默认路径由 checkpoint tokenizer 生成 prompt IDs；已有 token 或多模态输入会走其他分支。",
    focus: [
      "已有 tokens 在满足条件时可以复用",
      "多模态 processor 可能同时产生模型侧输入",
      "纯文本回退调用 tokenizer.encode(..., add_special_tokens=False)",
    ],
    boundary: "课程 fixture 使用教学 tokenizer；真实 token ID 必须由实际 checkpoint 决定。",
  },
  {
    id: "evidence-sampling-recipe",
    title: "源码核对：采样配方来自运行参数",
    sourceRefId: "rollout.generate-state-init",
    claim: "GenerateState 载入 checkpoint tokenizer / processor，并从 rollout 参数建立默认 sampling_params；提交任务时传给 generate 的是这份配置的副本。",
    focus: [
      "temperature、top_p、top_k 与 max_new_tokens 都来自运行配置",
      "sampling_params 描述生成策略，不是 Sample 的任务语义字段",
      "本课 fixture 固定一份可复算的配置，不声称与任意部署默认值相同",
    ],
    boundary: "摘录证明 GenerateState 的默认配方；具体 generate 调用接收的是调用链传入的 sampling_params，而不是教学页面中可变的共享对象。",
  },
  {
    id: "evidence-request-budget",
    title: "源码核对：零生成预算不会发出请求",
    sourceRefId: "rollout.generate-request-budget",
    claim: "generate 在 prompt_ids 准备完成后检查 max_new_tokens；负值无效，零值把 Sample 标记为 truncated 并直接返回，只有正值继续进入请求装配。",
    focus: [
      "预算检查发生在 payload/input_ids 与 POST 之前",
      "本课 fixture 固定 max_new_tokens=1，因此进入主路径",
      "truncated 描述生成终止边界，不判断答案正确性",
    ],
    boundary: "摘录同时露出 routing replay 对 payload 的条件扩展；该字段不属于本课默认 pure-text 三键 fixture。",
  },
  {
    id: "evidence-request-envelope",
    title: "源码底片：三键请求信封与前缀留档",
    sourceRefId: "rollout.generate-request-envelope",
    claim: "默认纯文本分支把 input_ids、sampling_params 与 return_logprob 放入 payload；随后在 Sample.tokens 为空时保存同一 prompt 前缀。",
    focus: [
      "return_logprob 是 payload 顶层协议开关，不在 sampling_params 内",
      "纯文本路径发送 input_ids，不发送原始 prompt 字段",
      "payload 与 Sample.tokens 保存相同的序列值，但承担网络输入与调用方状态两种职责",
    ],
    boundary: "三键白名单只适用于本课纯文本 fixture。多模态、routing replay 等条件分支会改变 envelope；源码也不保证两个列表具有独立 Python identity。",
  },
  {
    id: "evidence-request-dispatch",
    title: "源码核对：可选路由 header 与真实 POST",
    sourceRefId: "rollout.generate-request-dispatch",
    claim: "generate 只在特定 consistent-hashing 条件下从 session_id 构造路由 header，然后把 payload 发往 /generate。",
    focus: [
      "session_id 不会成为本课 JSON payload 字段",
      "header 分支是条件路径，不是所有请求都携带身份",
      "POST 之后才进入下一章的 response 投影",
    ],
    boundary: "本课 fixture 没有 session_id，也不运行真实服务器；request sidecar 是课程观察工具，不是 upstream Sample 字段。",
  },
  {
    id: "evidence-response-projection",
    title: "HTTP 响应先被投影为 token 与 log-prob 数组",
    sourceRefId: "rollout.generate",
    claim: "generate 从 output_token_logprobs 分别提取 token ID 与 log-prob，再交给 Sample 的写回方法。",
    focus: [
      "payload 明确请求 return_logprob",
      "tuple 的索引 1 是 token ID，索引 0 是 log-prob",
      "output.text 与 meta_info 仍是服务器返回，不是完整 Sample",
    ],
    boundary: "mock HTTP 响应只固定教学数据；tuple 的投影顺序由源码验证。",
  },
  {
    id: "evidence-atomic-writeback",
    title: "写回必须维持 response 空间长度契约",
    sourceRefId: "sample.validate-response-metadata-lengths",
    claim: "Sample 在写回后验证 loss_mask、rollout_log_probs 与 response_length 的对齐关系。",
    focus: [
      "tokens 保存 prompt 前缀与 response 后缀",
      "response_length 只统计 response token",
      "loss_mask 与 rollout_log_probs 只在 response 空间对齐",
    ],
    boundary: "课程 reducer 在写入前预检以展示原子失败；生产方法的最终防线是长度校验。",
  },
];

export const producerRelayStages: readonly ProducerRelayStage[] = [
  {
    id: "dataset-construction",
    order: 1,
    title: "Dataset 建立初始协议对象",
    producer: "Dataset.__init__ → Sample(...) / dataclass defaults",
    input: ["外部 row", "prompt_key / label_key / metadata_key", "chat template 与 processor 配置"],
    writes: ["prompt", "label", "metadata", "multimodal_inputs", "其余未传字段的 dataclass 默认值"],
    output: ["seed Sample", "可解释的显式值", "仍精确保留生命周期空白的默认值"],
    trustworthyObservation: "Sample(...) 返回后，才可把 prompt、label、metadata 与 multimodal_inputs 解释为 Dataset 决策结果。",
    scope: "固定 commit 06ffdbe2；本课主路径为纯文本、processor=None、apply_chat_template=False。",
    caveat: "label 与 multimodal_inputs 都是显式实参，但其值可以是 None；显式初始化不等于非空，也不承诺后续一定会改写。",
    sourceRefIds: ["dataset.construct-sample", "sample.dataclass"],
  },
  {
    id: "datasource-fanout",
    order: 2,
    title: "DataSource 复制并编号候选",
    producer: "RolloutDataSource.get_samples",
    input: ["seed Sample", "n_samples_per_prompt", "DataSource 的 group/sample 计数器"],
    writes: ["group_index", "index"],
    output: ["按 prompt 成组的 deepcopy 候选", "每组共享 group_index", "每个物理 Sample 拥有唯一 index"],
    trustworthyObservation: "get_samples() 返回后，group_index 与 index 才能作为本轮物理候选的可信身份。",
    scope: "固定 commit 的默认 RolloutDataSource.get_samples；教学 fixture 使用 2 prompts × 2 candidates。",
    caveat: "Sample.rollout_id 不在这里写入；不能把 group_index、index 与 conversion 派生的 train_data.rollout_ids 混为一谈。",
    sourceRefIds: ["rollout.datasource-get-samples", "sample.dataclass"],
  },
  {
    id: "raw-generate",
    order: 3,
    title: "原始 generate 写回生成证据",
    producer: "slime.rollout.sglang_rollout.generate",
    input: ["已编号的 pending Sample", "checkpoint tokenizer", "sampling_params", "SGLang HTTP response"],
    writes: ["tokens", "response", "response_length", "loss_mask", "rollout_log_probs", "weight_versions", "status"],
    output: ["仍是同一个 Sample", "prompt+response token 序列", "回答空间 mask/log-prob", "终止状态与权重版本"],
    trustworthyObservation: "await generate(...) 返回后，才能把 response-side 字段解释为默认 SGLang 写回结果。",
    scope: "固定 commit 的默认纯文本分支：multimodal_inputs=None，custom_generate_function_path=None。",
    caveat: "generate() 不计算 reward；max_new_tokens=0 会直接标记 truncated，未必产生非空 response 或 loss_mask。",
    sourceRefIds: ["rollout.generate", "rollout.prepare-prompt-ids", "sample.append-response-tokens", "sample.apply-meta-info"],
  },
  {
    id: "reward-wrapper",
    order: 4,
    title: "generate_and_rm 包装生成与评价",
    producer: "slime.rollout.sglang_rollout.generate_and_rm",
    input: ["raw generate 返回的 Sample", "rollout sample hooks", "async reward model"],
    writes: ["reward（仅在仍为 None 且默认非 group-RM 路径时）", "全局 abort 分支可在进入 raw generate 前写 status=aborted"],
    output: ["带生成结果的 Sample", "默认非 group-RM 路径下已评价的 reward"],
    trustworthyObservation: "await generate_and_rm(...) 返回后，才可在本课默认非 group-RM 路径要求 reward 已经过 wrapper 检查或计算。",
    scope: "固定 commit；reward 主路径限定 custom_generate_function_path=None、group_rm=False 且非 aborted；同一 wrapper 的 pre-generate global abort guard 只写 status=aborted，不运行 reward。",
    caveat: "custom generate 或 hook 可以预先写 reward；group_rm 会把评价推迟到 generate_and_rm_group。全局 abort guard 还可在调用 raw generate 前写 ABORTED；这条条件分支不属于本课实际进入的 raw generate trace。",
    sourceRefIds: ["rollout.generate-and-rm", "rollout.generate"],
  },
  {
    id: "train-data-conversion",
    order: 5,
    title: "conversion 派生 TrainData 语义",
    producer: "RolloutManager._convert_samples_to_train_data",
    input: ["已收集并 flatten 的 Sample 列表", "reward post-process 配置", "rollout / batch 配置"],
    writes: ["新的 train_data 映射", "必要时回写 Sample.loss_mask fallback 或 remove_sample 零 mask"],
    output: ["独立命名的 TrainData 语义产物", "训练侧字段名、奖励视图、训练身份与 mask 聚合"],
    trustworthyObservation: "_convert_samples_to_train_data(...) 返回后，才可读取 train_data.*；这些键不是 Sample dataclass 字段。",
    scope: "固定 commit 的默认 conversion；未启用 custom_convert_samples_to_train_data_path。",
    caveat: "“独立产物”指新建 train_data 映射与新的字段语义，不表示对所有嵌套 list 做 deepcopy；conversion 还会按规则修改 sample.loss_mask。",
    sourceRefIds: ["rollout.convert-train-data", "rollout.post-process-rewards"],
    derivedOutputs: [
      { id: "train-tokens", trainDataField: "tokens", derivedFrom: ["Sample.tokens"], rule: "逐 Sample 收集完整 token 序列。" },
      { id: "train-response-lengths", trainDataField: "response_lengths", derivedFrom: ["Sample.response_length"], rule: "把单数形式字段投影为 batch 列表。" },
      { id: "train-rewards", trainDataField: "rewards", derivedFrom: ["Sample.reward", "reward post-process"], rule: "保存训练使用的 reward 视图；可能经过组内中心化/标准化。" },
      { id: "train-raw-reward", trainDataField: "raw_reward", derivedFrom: ["Sample.reward", "Sample.metadata.raw_reward（若存在）"], rule: "保留评价原值；metadata.raw_reward 可按源码规则覆盖对应项。" },
      { id: "train-truncated", trainDataField: "truncated", derivedFrom: ["Sample.status"], rule: "把 TRUNCATED 映射为 1，其余状态映射为 0。" },
      { id: "train-sample-indices", trainDataField: "sample_indices", derivedFrom: ["Sample.index"], rule: "保留物理 Sample 身份。" },
      { id: "train-rollout-ids", trainDataField: "rollout_ids", derivedFrom: ["Sample.rollout_id"], rule: "对 None 分配本批次临时唯一 id，且不回写 Sample.rollout_id。", caveat: "固定 commit 的实现不是直接复制 index。" },
      { id: "train-loss-masks", trainDataField: "loss_masks", derivedFrom: ["Sample.loss_mask", "Sample.response_length", "Sample.remove_sample"], rule: "loss_mask=None 时先回写全 1；remove_sample=True 时再回写同长度全 0；最后收集。" },
      { id: "train-rollout-mask-sums", trainDataField: "rollout_mask_sums", derivedFrom: ["train_data.rollout_ids", "train_data.loss_masks"], rule: "按 rollout id 聚合 mask 总和，再广播回每个 Sample 位置。" },
      { id: "train-rollout-log-probs", trainDataField: "rollout_log_probs", derivedFrom: ["Sample.rollout_log_probs"], rule: "仅当首个 Sample 的值非 None 时加入 train_data。" },
      { id: "train-metadata", trainDataField: "metadata", derivedFrom: ["Sample.train_metadata"], rule: "仅当首个 Sample.train_metadata 非 None 时投影；conversion 不生产 train_metadata。" },
    ],
  },
];

export const fieldLifecycleEntries: readonly FieldLifecycleEntry[] = [
  {
    id: "lifecycle-prompt",
    field: "prompt",
    category: "input",
    dataclassDefault: '""',
    initializedBy: { stageId: "dataset-construction", producer: "Dataset → Sample(prompt=output_prompt)", mode: "explicit-initialization", value: '"3 + 2 = ?"', condition: "本课 row 与 prompt_key=\"text\"" },
    firstNonDefaultProducer: { stageId: "dataset-construction", producer: "Dataset", mode: "explicit-initialization", value: "output_prompt", condition: "data.get(prompt_key) 得到非空教学 prompt" },
    trustworthyFrom: { stageId: "dataset-construction", observation: "Sample(...) 返回后，prompt 已完成外部 schema → 内部协议翻译。" },
    scope: "本课默认纯文本教学 row。",
    caveat: "data.get(prompt_key) 缺键时可得到 None；dataclass 类型标注本身不替 Dataset 做 schema 校验。",
    sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
  },
  {
    id: "lifecycle-label",
    field: "label",
    category: "input",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Dataset → Sample(label=...)", mode: "explicit-initialization", value: '"5"（本 fixture）或 None', condition: "label_key 非 None 时索引 row；否则显式传 None" },
    firstNonDefaultProducer: { stageId: "dataset-construction", producer: "Dataset", mode: "explicit-initialization", value: "data[label_key]", condition: "只有显式配置 label_key 且 row 存在该列" },
    trustworthyFrom: { stageId: "dataset-construction", observation: "Sample(...) 返回后，label 的值或 None 都是 Dataset 配置决策。" },
    legalTerminal: { value: "None", condition: "label_key=None 的无标签任务；后续阶段没有义务补写 label。" },
    scope: "Dataset 的显式 label 实参与默认 rollout 路径。",
    caveat: "label=None 不等于字段漏产；reward model 是否需要参考标签由任务实现决定。",
    sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
  },
  {
    id: "lifecycle-metadata",
    field: "metadata",
    category: "input",
    dataclassDefault: "{}（default_factory）",
    initializedBy: { stageId: "dataset-construction", producer: "Dataset → Sample(metadata=metadata)", mode: "explicit-initialization", value: "data.get(metadata_key) or {}", condition: "每个 Dataset row 都显式传入计算结果" },
    firstNonDefaultProducer: { stageId: "dataset-construction", producer: "Dataset", mode: "explicit-initialization", value: "row metadata", condition: "对应 row 值为 truthy" },
    trustworthyFrom: { stageId: "dataset-construction", observation: "Sample(...) 返回后，可把 metadata 内容解释为 Dataset 选择结果。" },
    legalTerminal: { value: "{}", condition: "row 没有 truthy metadata，且后续 hook 不追加。" },
    scope: "固定 commit 的 Dataset 构造。",
    caveat: "固定源码未在这次传参前显式 deepcopy metadata；这里追踪字段语义，不承诺对象身份。",
    sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
  },
  {
    id: "lifecycle-multimodal-inputs",
    field: "multimodal_inputs",
    category: "input",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Dataset → Sample(multimodal_inputs=multimodal_inputs)", mode: "explicit-initialization", value: "None", condition: "本课 processor=None 的纯文本路径" },
    firstNonDefaultProducer: null,
    trustworthyFrom: { stageId: "dataset-construction", observation: "Sample(...) 返回后，None 已可信地表示本路径无原始媒体输入。" },
    legalTerminal: { value: "None", condition: "纯文本 rollout 全程合法保持 None。" },
    scope: "本课固定 processor=None、multimodal_keys=None。",
    caveat: "多模态分支可由 Dataset 显式写入字典，但它不属于本章默认文本路径。",
    sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
  },
  {
    id: "lifecycle-group-index",
    field: "group_index",
    category: "identity",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "None", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "datasource-fanout", producer: "RolloutDataSource.get_samples", mode: "runtime-write", value: "sample_group_index", condition: "deepcopy 每个 prompt_sample 后" },
    trustworthyFrom: { stageId: "datasource-fanout", observation: "get_samples() 返回后才可用它建立候选比较关系。" },
    scope: "固定 commit 默认 DataSource。",
    caveat: "它表达组关系，不是物理 Sample id，也不是 TrainData rollout_ids。",
    sourceRefIds: ["sample.dataclass", "rollout.datasource-get-samples"],
  },
  {
    id: "lifecycle-index",
    field: "index",
    category: "identity",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "None", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "datasource-fanout", producer: "RolloutDataSource.get_samples", mode: "runtime-write", value: "sample_index", condition: "每个 deepcopy 副本写入后递增" },
    trustworthyFrom: { stageId: "datasource-fanout", observation: "get_samples() 返回后才是可信的物理 Sample 身份。" },
    scope: "固定 commit 默认 DataSource。",
    caveat: "conversion 同时派生 sample_indices 与 rollout_ids；二者用途不同。",
    sourceRefIds: ["sample.dataclass", "rollout.datasource-get-samples", "rollout.convert-train-data"],
  },
  {
    id: "lifecycle-tokens",
    field: "tokens",
    category: "generation",
    dataclassDefault: "[]（default_factory）",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "[]", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "generate", mode: "runtime-write", value: "prompt_ids，随后追加 response token IDs", condition: "默认纯文本 generate 且 Sample.tokens 为空" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后才可把 tokens 解释为 generation 所用前缀与已写回回答。" },
    scope: "默认文本 generate；教学 token IDs 不是真实 checkpoint 输出。",
    caveat: "Dataset 的 max_length tokenizer 检查不会写 Sample.tokens。",
    sourceRefIds: ["sample.dataclass", "rollout.prepare-prompt-ids", "rollout.generate", "sample.append-response-tokens"],
  },
  {
    id: "lifecycle-response",
    field: "response",
    category: "generation",
    dataclassDefault: '""',
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: '""', condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "generate → append_response_tokens", mode: "runtime-write", value: "output.text", condition: "SGLang 返回非空文本并完成写回" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后才可读取默认 SGLang response。" },
    legalTerminal: { value: '""', condition: "max_new_tokens=0、空输出或无回答文本的合法分支。" },
    scope: "固定 commit raw generate。",
    caveat: "response 文本不等于 reward，也不能替代 token/log-prob 证据。",
    sourceRefIds: ["sample.dataclass", "rollout.generate", "sample.append-response-tokens"],
  },
  {
    id: "lifecycle-response-length",
    field: "response_length",
    category: "generation",
    dataclassDefault: "0",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "0", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "append_response_tokens", mode: "runtime-write", value: "response token 数", condition: "写回至少一个 token" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后与 response-side 数组一起验证。" },
    legalTerminal: { value: "0", condition: "没有生成 response token。" },
    scope: "回答 token 空间，不含 prompt 前缀。",
    caveat: "不能用 len(tokens) 替代；tokens 同时包含 prompt。",
    sourceRefIds: ["sample.dataclass", "sample.append-response-tokens", "sample.validate-response-metadata-lengths"],
  },
  {
    id: "lifecycle-loss-mask",
    field: "loss_mask",
    category: "generation",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "None", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "append_response_tokens", mode: "runtime-write", value: "每个默认模型 response token 对应 1", condition: "raw generate 写回至少一个 token" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后先按 response_length 验证；若仍为 None，conversion 才应用 fallback。" },
    legalTerminal: { value: "None", condition: "生成阶段没有 response token；进入 conversion 时仍可合法为 None。" },
    scope: "默认 raw generate 与默认 conversion。",
    caveat: "conversion 会把 None 回写为全 1，并把 remove_sample=True 的 mask 回写为全 0；这不是 dataclass 初始化。",
    sourceRefIds: ["sample.dataclass", "sample.append-response-tokens", "rollout.convert-train-data"],
  },
  {
    id: "lifecycle-rollout-log-probs",
    field: "rollout_log_probs",
    category: "generation",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "None", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "generate → append_response_tokens", mode: "runtime-write", value: "output_token_logprobs 的 item[0] 列表", condition: "默认请求返回 response token log-prob" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回且长度与 response_length 一致后。" },
    legalTerminal: { value: "None", condition: "没有写回 response token。" },
    scope: "默认 generate 请求 return_logprob=True。",
    caveat: "HTTP tuple 只是材料；可信 Sample 字段要等 append_response_tokens 校验完成。",
    sourceRefIds: ["sample.dataclass", "rollout.generate", "sample.validate-response-metadata-lengths"],
  },
  {
    id: "lifecycle-weight-versions",
    field: "weight_versions",
    category: "generation",
    dataclassDefault: "[]（default_factory）",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "[]", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "Sample._apply_meta_info", mode: "runtime-write", value: "meta_info.weight_version", condition: "SGLang meta_info 包含 weight_version" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后，可把已追加值解释为生成权重来源。" },
    legalTerminal: { value: "[]", condition: "meta_info 不包含 weight_version。" },
    scope: "固定 commit 的 meta_info 写回。",
    caveat: "空列表不证明生成失败，只说明没有收到该可选元数据。",
    sourceRefIds: ["sample.dataclass", "sample.apply-meta-info"],
  },
  {
    id: "lifecycle-status",
    field: "status",
    category: "generation",
    dataclassDefault: "pending",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "pending", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "raw-generate", producer: "generate / Sample._apply_meta_info", mode: "runtime-write", value: "completed / truncated / aborted", condition: "本课 trace 已实际进入 raw generate；finish_reason 的 stop / length / abort 分别映射终态，max_new_tokens=0 直接写 truncated" },
    trustworthyFrom: { stageId: "raw-generate", observation: "generate 返回后才可把终态解释为生成终止原因。" },
    scope: "固定 commit 默认生成状态映射。",
    caveat: "completed 只表示 stop 终止，不表示答案正确。ABORTED 有两条互斥来源：进入 raw generate 后由 finish_reason=abort 写回，或在此前由 generate_and_rm 的 global abort guard 提前写入。",
    sourceRefIds: ["sample.dataclass", "rollout.generate", "sample.apply-meta-info"],
  },
  {
    id: "lifecycle-reward",
    field: "reward",
    category: "evaluation",
    dataclassDefault: "None",
    initializedBy: { stageId: "dataset-construction", producer: "Sample dataclass", mode: "dataclass-default", value: "None", condition: "Dataset 的 Sample(...) 未传此字段" },
    firstNonDefaultProducer: { stageId: "reward-wrapper", producer: "generate_and_rm → async_rm", mode: "runtime-write", value: "reward model 返回值", condition: "默认非 aborted、非 group-RM，且 hook/custom generate 尚未填 reward" },
    trustworthyFrom: { stageId: "reward-wrapper", observation: "generate_and_rm 返回后；raw generate 返回还不够。" },
    scope: "custom_generate_function_path=None、group_rm=False 的默认 wrapper 路径。",
    caveat: "custom generate/hook 可提前填 reward，group_rm 则推迟到 group wrapper；都不改变 raw generate 不负责评价。",
    sourceRefIds: ["sample.dataclass", "rollout.generate", "rollout.generate-and-rm"],
  },
];

export const earlyFieldDiagnosticCases: readonly EarlyFieldDiagnosticCase[] = [
  {
    id: "group-index-at-samples-constructed",
    title: "samples-constructed 提前出现组号",
    snapshot: "samples-constructed：Dataset 刚完成 Sample(...)，DataSource.get_samples 尚未运行。",
    suspiciousField: "group_index",
    observedValue: "0",
    missingProducerStageId: "datasource-fanout",
    explanation: "group_index 的非默认值只能在默认 DataSource deepcopy 候选时首次写入；它出现在 samples-constructed，说明未来身份被提前放进了 Dataset snapshot。",
    scope: "固定 commit 的 Dataset → RolloutDataSource 默认路径。",
    caveat: "group_index=None 才是 samples-constructed 的正确阶段值。",
    sourceRefIds: ["dataset.construct-sample", "rollout.datasource-get-samples"],
  },
  {
    id: "status-at-groups-built",
    title: "groups-built 提前宣称生成完成",
    snapshot: "groups-built：DataSource 已复制并编号候选，但 raw generate 尚未运行。",
    suspiciousField: "status",
    observedValue: "completed",
    missingProducerStageId: "raw-generate",
    explanation: "completed 依赖 raw generate 的 finish_reason 写回；在 groups-built 出现说明把未来终止状态冒充为分组阶段事实。",
    scope: "默认纯文本 SGLang generate。",
    caveat: "pending 才是 groups-built 的正确状态；completed 也只表示 stop，不表示答案正确。",
    sourceRefIds: ["rollout.datasource-get-samples", "rollout.generate", "sample.apply-meta-info"],
  },
  {
    id: "reward-at-responses-written",
    title: "responses-written 提前宣称已评价",
    snapshot: "responses-written（raw generate trace）：generate 已写回 response，但 generate_and_rm 的 reward 分支尚未运行。",
    suspiciousField: "reward",
    observedValue: "1",
    missingProducerStageId: "reward-wrapper",
    explanation: "raw responses-written 只证明生成结果已落回 Sample；默认路径要等 generate_and_rm 在 hooks 之后调用 async_rm，reward 才首次成为可信评价结果。",
    scope: "custom generate=None、group_rm=False 的默认单 Sample wrapper。",
    caveat: "若 custom generate 或 hook 显式预填 reward，必须另行标注该非默认生产者，不能归因给 raw generate。",
    sourceRefIds: ["rollout.generate", "rollout.generate-and-rm"],
  },
];

const chapterOneExercise = {
  id: "stg.chapter-1-gate",
  kind: "field-entry",
  title: "迁移练习：换一套 row schema，重新翻译",
  prompt: "迁移到 row={question, answer, context}：question=\"6 × 7 = ?\"，answer=\"42\"，context.source=\"transfer-check\"。",
  instruction: "配置 question → prompt、context → metadata、label_key=None。填写 prompt、label、metadata、tokens；停在 Dataset 构造边界。",
  fields: [
    { id: "prompt", label: "prompt", acceptedAnswers: ["6 × 7 = ?", "\"6 × 7 = ?\""], placeholder: "例如：\"...\"" },
    { id: "label", label: "label", acceptedAnswers: ["None", "null"], placeholder: "Python/JSON 空值" },
    { id: "metadata", label: "metadata", acceptedAnswers: ["{\"source\":\"transfer-check\"}", "{'source':'transfer-check'}"], placeholder: "紧凑对象" },
    { id: "tokens", label: "tokens", acceptedAnswers: ["[]"], placeholder: "列表" },
  ],
  sourceRefIds: ["dataset.construct-sample", "sample.dataclass"],
  feedback: {
    correct: "迁移成立：question 被翻译为 prompt；label_key=None 阻止 answer 进入 label；context 成为 metadata；tokens 仍等待 generation 路径。",
    incorrect: "沿四条 lane 重算：先看配置选择哪个 row 字段，再区分 Sample(...) 显式参数与 dataclass 默认值。",
  },
} as const satisfies StructuredExercise;

const chapterTwoExercise = {
  id: "stg.chapter-2-diagnosis-v2",
  kind: "mapping",
  title: "过早字段诊断：缺席的是哪一棒",
  prompt: "三张 snapshot 都出现了尚不该可信的非默认字段。把异常映射到仍未运行的生产者阶段。",
  instruction: "按固定 commit 06ffdbe2 的默认纯文本路径判断；选择首次能生产该值的接力阶段。",
  items: [
    { id: "group-index-at-samples-constructed", label: "samples-constructed：group_index=0" },
    { id: "status-at-groups-built", label: "groups-built：status=completed" },
    { id: "reward-at-responses-written", label: "raw responses-written：reward=1" },
  ],
  targets: [
    { id: "datasource-fanout", label: "DataSource 复制与编号" },
    { id: "raw-generate", label: "原始 generate 写回" },
    { id: "reward-wrapper", label: "generate_and_rm reward wrapper" },
  ],
  correctMapping: {
    "group-index-at-samples-constructed": "datasource-fanout",
    "status-at-groups-built": "raw-generate",
    "reward-at-responses-written": "reward-wrapper",
  },
  sourceRefIds: ["dataset.construct-sample", "rollout.datasource-get-samples", "rollout.generate", "rollout.generate-and-rm"],
  feedback: {
    correct: "三处异常都定位到了缺席的生产者。字段声明、未来 fixture 与可信当前状态没有被混在一起。",
    incorrect: "先读取 snapshot 的停止点，再沿接力台找该字段的 firstNonDefaultProducer；不要把 dataclass 声明当作运行时写入。",
  },
} as const satisfies StructuredExercise;

export const groupingLabGroups: readonly GroupingLabGroup[] = [
  {
    id: "group-a",
    originId: "origin-a",
    prompt: "3 + 2 = ?",
    label: "5",
    metadata: { source_name: "mechanism_course", difficulty: "warmup" },
    groupIndex: 0,
    candidates: [
      { id: "a0", index: 0 },
      { id: "a1", index: 1 },
    ],
    identityChecks: [
      { expression: "a0 is a1", result: false, meaning: "两个候选不是同一个 Sample 对象" },
      { expression: "a0.metadata is a1.metadata", result: false, meaning: "两个可变 metadata 容器没有别名" },
    ],
  },
  {
    id: "group-b",
    originId: "origin-b",
    prompt: "4 + 3 = ?",
    label: "7",
    metadata: { source_name: "mechanism_course", difficulty: "warmup" },
    groupIndex: 1,
    candidates: [
      { id: "b0", index: 2 },
      { id: "b1", index: 3 },
    ],
    identityChecks: [
      { expression: "b0 is b1", result: false, meaning: "两个候选不是同一个 Sample 对象" },
      { expression: "b0.metadata is b1.metadata", result: false, meaning: "两个可变 metadata 容器没有别名" },
    ],
  },
] as const;

export const groupingCounterFrames: readonly GroupingCounterFrame[] = [
  {
    id: "copy-a0",
    order: 1,
    operation: "deepcopy(origin-a) → a0",
    groupCounterBefore: 0,
    sampleCounterBefore: 0,
    writes: ["a0.group_index = 0", "a0.index = 0"],
    groupCounterAfter: 0,
    sampleCounterAfter: 1,
    explanation: "还在处理 origin-a，所以组计数器不动；每产出一个物理副本，sample_index 立即加一。",
  },
  {
    id: "copy-a1",
    order: 2,
    operation: "deepcopy(origin-a) → a1",
    groupCounterBefore: 0,
    sampleCounterBefore: 1,
    writes: ["a1.group_index = 0", "a1.index = 1"],
    groupCounterAfter: 1,
    sampleCounterAfter: 2,
    explanation: "内层循环完成 N=2 次后，origin-a 的 group 才封口；随后 sample_group_index 加一。",
  },
  {
    id: "copy-b0",
    order: 3,
    operation: "deepcopy(origin-b) → b0",
    groupCounterBefore: 1,
    sampleCounterBefore: 2,
    writes: ["b0.group_index = 1", "b0.index = 2"],
    groupCounterAfter: 1,
    sampleCounterAfter: 3,
    explanation: "新的 prompt group 使用新的 group_index；sample_index 沿本批候选继续递增，不在组边界归零。",
  },
  {
    id: "copy-b1",
    order: 4,
    operation: "deepcopy(origin-b) → b1",
    groupCounterBefore: 1,
    sampleCounterBefore: 3,
    writes: ["b1.group_index = 1", "b1.index = 3"],
    groupCounterAfter: 2,
    sampleCounterAfter: 4,
    explanation: "第二个 group 封口后，本次教学调用累计得到 2 个 group、4 个物理 Sample。",
  },
] as const;

export const groupingComparisonRules: readonly GroupingComparisonRule[] = [
  {
    id: "prompt-label",
    subject: "prompt / label",
    withinGroup: "值相同",
    objectContract: "只要求语义值一致；字符串对象身份不是本课契约",
    reason: "候选必须在同一道题、同一个参考答案条件下开始，后续差异才可归因于生成。",
  },
  {
    id: "metadata",
    subject: "metadata",
    withinGroup: "初始内容相同",
    objectContract: "容器对象必须独立",
    reason: "后续 hook 修改 a0.metadata 时，不得通过别名污染 a1。",
  },
  {
    id: "group-index",
    subject: "group_index",
    withinGroup: "相同",
    objectContract: "表示比较关系，不表示对象身份",
    reason: "a0 与 a1 必须被识别为同一 prompt 的候选；b0 与 b1 属于另一个比较组。",
  },
  {
    id: "sample-index",
    subject: "index",
    withinGroup: "不同",
    objectContract: "每个物理 Sample 唯一",
    reason: "四次生成必须能够独立记录、定位和写回，不能只凭 group_index 区分。",
  },
  {
    id: "future-fields",
    subject: "response / log-prob / status / reward",
    withinGroup: "此刻仍是默认值或空值",
    objectContract: "未来必须能够各自变化",
    reason: "DataSource 只建立候选集合；生成与评价尚未运行，不能提前填入结果。",
  },
] as const;

export const groupingAliasProbe: GroupingAliasProbe = {
  mutation: 'a0.metadata.difficulty = "audited"',
  fixtureValue: "warmup",
  mutatedValue: "audited",
  actualAfter: [
    { sampleId: "a0", value: "audited", explanation: "目标副本接收本地修改。" },
    { sampleId: "a1", value: "warmup", explanation: "独立 metadata 容器保持原值。" },
    { sampleId: "origin-a seed", value: "warmup", explanation: "原始 seed 也未被副本修改。" },
  ],
  counterfactualAfter: [
    { sampleId: "a0", value: "audited", explanation: "目标对象被修改。" },
    { sampleId: "a1", value: "audited", explanation: "若共享引用，a1 会被静默污染。" },
    { sampleId: "origin-a seed", value: "audited", explanation: "浅复制还会把修改反向泄漏到 seed。" },
  ],
  boundary: "audited 是页面内的反事实探针值，不属于固定 fixture。它只演示对象别名后果；生产源码是否使用 deepcopy 由固定 commit 摘录证明。",
};

const chapterThreeExercise = {
  id: "stg.chapter-3-identity-matrix-v2",
  kind: "field-entry",
  title: "2×2 身份矩阵",
  prompt: "固定 P=2、N=2，且调用前 sample_group_index=0、sample_index=0。补全四个候选的身份字段。",
  instruction: "每格输入一个十进制整数；fixture ID 只用于课程关联，不是 upstream Sample 字段。",
  fields: [
    { id: "a0-group", label: "a0.group_index", acceptedAnswers: ["0"] },
    { id: "a0-index", label: "a0.index", acceptedAnswers: ["0"] },
    { id: "a1-group", label: "a1.group_index", acceptedAnswers: ["0"] },
    { id: "a1-index", label: "a1.index", acceptedAnswers: ["1"] },
    { id: "b0-group", label: "b0.group_index", acceptedAnswers: ["1"] },
    { id: "b0-index", label: "b0.index", acceptedAnswers: ["2"] },
    { id: "b1-group", label: "b1.group_index", acceptedAnswers: ["1"] },
    { id: "b1-index", label: "b1.index", acceptedAnswers: ["3"] },
  ],
  sourceRefIds: ["rollout.datasource-get-samples"],
  feedback: {
    correct: "矩阵正确。同一 seed 的候选共享组号，四个物理候选 Sample 拥有独立 index；metadata 隔离还要由上方别名探针和源码共同证明。",
    incorrect: "沿 DataSource 的两个计数器检查：sample counter 每个副本加一，group counter 只在整组完成后加一。",
  },
} as const satisfies StructuredExercise;

export const requestAssemblyStages: readonly RequestAssemblyStage[] = [
  {
    id: "prepare-prompt",
    order: 1,
    title: "准备局部 prompt_ids",
    producer: "_prepare_prompt_ids",
    input: ['a0.prompt = "3 + 2 = ?"', "a0.tokens = []", "checkpoint tokenizer / processor"],
    operation: "默认纯文本分支调用 tokenizer.encode(sample.prompt, add_special_tokens=False)。",
    output: ["局部 prompt_ids = [11, 12, 13, 14, 15]（教学 tokenizer）"],
    callerEffect: "此时只是得到局部变量；Sample.tokens 仍为空。",
    networkEffect: "尚未构造 payload，也没有网络请求。",
    sourceRefIds: ["rollout.prepare-prompt-ids"],
  },
  {
    id: "validate-budget",
    order: 2,
    title: "检查生成预算",
    producer: "generate",
    input: ["sampling_params.max_new_tokens = 1"],
    operation: "负数触发断言；0 会把 Sample 标记为 truncated 并直接返回；本 fixture 的 1 通过检查。",
    output: ["继续装配请求"],
    callerEffect: "a0.status 仍为 pending。",
    networkEffect: "只有通过该检查的路径才会抵达 /generate。",
    sourceRefIds: ["rollout.generate-request-budget"],
  },
  {
    id: "assemble-envelope",
    order: 3,
    title: "装配最小请求信封",
    producer: "generate",
    input: ["prompt_ids", "调用链传入的 sampling_params 副本", "return_logprob=True"],
    operation: "建立 payload；纯文本分支把 prompt_ids 放入 input_ids。",
    output: ["payload.input_ids", "payload.sampling_params", "payload.return_logprob"],
    callerEffect: "完整 Sample 仍由调用方持有；label 与身份没有被序列化。",
    networkEffect: "payload 只在内存中完成，尚未 POST。",
    sourceRefIds: ["rollout.generate-request-envelope", "rollout.generate-state-init"],
  },
  {
    id: "persist-prefix",
    order: 4,
    title: "在 Sample 留下同一前缀",
    producer: "generate",
    input: ["a0.tokens = []", "prompt_ids = [11, 12, 13, 14, 15]"],
    operation: "若 Sample.tokens 为空，将 prompt_ids 保存为调用方的完整序列前缀。",
    output: ["a0.tokens = [11, 12, 13, 14, 15]"],
    callerEffect: "Sample 获得 prompt 前缀；response、reward 与 status 仍未变化。",
    networkEffect: "payload.input_ids 与 Sample.tokens 的序列值一致，职责不同。",
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "dispatch-request",
    order: 5,
    title: "越过网络边界",
    producer: "post",
    input: ["url = http://…/generate", "payload", "可选 consistent-hashing header"],
    operation: "调用 post(url, payload, headers=headers)；等待真实 SGLang response。",
    output: ["HTTP request 已发出；response 尚未投影"],
    callerEffect: "调用方继续保有 a0，并等待把返回材料写回同一对象。",
    networkEffect: "本课 pure-text fixture 的 JSON body 只有三个顶层键。",
    sourceRefIds: ["rollout.generate-request-dispatch"],
  },
] as const;

export const requestManifestEntries: readonly RequestManifestEntry[] = [
  {
    id: "prompt",
    field: "Sample.prompt",
    fixtureValue: '"3 + 2 = ?"',
    origin: "Dataset 提供的任务输入",
    destination: "transformed",
    path: "prompt → tokenizer → prompt_ids",
    reason: "默认纯文本请求发送 token IDs，而不是原始 prompt 字段。",
    mainPath: true,
    sourceRefIds: ["rollout.prepare-prompt-ids"],
  },
  {
    id: "prompt-ids",
    field: "局部 prompt_ids",
    fixtureValue: "[11, 12, 13, 14, 15]",
    origin: "教学 tokenizer 对 a0.prompt 的确定性编码",
    destination: "transformed",
    path: "prompt_ids → payload.input_ids + Sample.tokens",
    reason: "同一序列值同时服务于网络输入和调用方前缀账本。",
    mainPath: true,
    sourceRefIds: ["rollout.prepare-prompt-ids", "rollout.generate-request-envelope"],
  },
  {
    id: "tokens",
    field: "Sample.tokens",
    fixtureValue: "[] → [11, 12, 13, 14, 15]",
    origin: "generate 在 POST 前保存 prompt 前缀",
    destination: "caller-ledger",
    path: "留在调用方；不作为名为 tokens 的 JSON 字段",
    reason: "后续 response token 要追加在这个前缀之后。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "input-ids",
    field: "payload.input_ids",
    fixtureValue: "[11, 12, 13, 14, 15]",
    origin: "局部 prompt_ids",
    destination: "json-body",
    path: "POST /generate JSON body",
    reason: "它是本课纯文本路径的模型输入表示。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "sampling-params",
    field: "payload.sampling_params",
    fixtureValue: "9 项固定教学配置",
    origin: "rollout 运行参数形成的调用副本",
    destination: "json-body",
    path: "POST /generate JSON body",
    reason: "它规定如何生成，不描述题目的正确答案或候选身份。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-state-init", "rollout.generate-request-envelope"],
  },
  {
    id: "return-logprob",
    field: "payload.return_logprob",
    fixtureValue: "true",
    origin: "generate 的协议开关",
    destination: "json-body",
    path: "POST /generate JSON body 顶层",
    reason: "请求服务器返回所选 token 的概率证据；它不运行 reward，也不判断正确性。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "label",
    field: "Sample.label",
    fixtureValue: '"5"',
    origin: "Dataset 任务语义",
    destination: "caller-ledger",
    path: "留在调用方",
    reason: "生成服务器只负责续写；答案比较属于后续 reward 机制。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "identity",
    field: "group_index / index",
    fixtureValue: "0 / 0",
    origin: "DataSource 候选身份",
    destination: "caller-ledger",
    path: "留在调用方",
    reason: "调用方以自己保有的 Sample 关联 response，不需要把比较身份交给 SGLang。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "metadata",
    field: "Sample.metadata",
    fixtureValue: '{source_name: "mechanism_course", difficulty: "warmup"}',
    origin: "Dataset 任务上下文",
    destination: "caller-ledger",
    path: "留在调用方",
    reason: "默认纯文本 generate 路径不会把该任意字典放入 JSON body。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "reward",
    field: "Sample.reward",
    fixtureValue: "null",
    origin: "Reward 尚未运行",
    destination: "not-produced",
    path: "本章不存在可发送的 reward 结果",
    reason: "null 不是“已计算后被拦截”；它表示生产者尚未运行。",
    mainPath: true,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "multimodal",
    field: "image_data + text",
    fixtureValue: "本 fixture 不存在",
    origin: "多模态条件分支",
    destination: "conditional-body",
    path: "有 images 时替代纯文本 input_ids 分支",
    reason: "因此“三键 payload”是本课主路径事实，不是 slime 的无条件全局规则。",
    mainPath: false,
    sourceRefIds: ["rollout.generate-request-envelope"],
  },
  {
    id: "session-header",
    field: "session_id → X-SMG-Routing-Key",
    fixtureValue: "本 fixture 不存在",
    origin: "consistent-hashing 条件分支",
    destination: "conditional-header",
    path: "HTTP header，不是 JSON payload",
    reason: "只有 session_id 存在且 router_policy=consistent_hashing 时才建立。",
    mainPath: false,
    sourceRefIds: ["rollout.generate-request-dispatch"],
  },
] as const;

export const requestSamplingParameters: readonly RequestSamplingParameter[] = [
  { key: "temperature", fixtureValue: "0", runtimeArgument: "--rollout-temperature", role: "关闭随机温度，便于固定教学输出" },
  { key: "top_p", fixtureValue: "1", runtimeArgument: "--rollout-top-p", role: "保留完整 nucleus 范围" },
  { key: "top_k", fixtureValue: "-1", runtimeArgument: "--rollout-top-k", role: "不启用 top-k 截断" },
  { key: "max_new_tokens", fixtureValue: "1", runtimeArgument: "--rollout-max-response-len", role: "本课只生成一个回答 token；大于 0 才会发请求" },
  { key: "stop", fixtureValue: "[]", runtimeArgument: "--rollout-stop", role: "不增加字符串停止条件" },
  { key: "stop_token_ids", fixtureValue: "[]", runtimeArgument: "--rollout-stop-token-ids", role: "不增加 token 停止条件" },
  { key: "skip_special_tokens", fixtureValue: "true", runtimeArgument: "--rollout-skip-special-tokens", role: "控制返回文本解码" },
  { key: "no_stop_trim", fixtureValue: "true", runtimeArgument: "generate 固定协议值", role: "保留停止内容处理策略" },
  { key: "spaces_between_special_tokens", fixtureValue: "false", runtimeArgument: "generate 固定协议值", role: "控制 special token 之间的文本空格" },
] as const;

export const requestFixturePacket: RequestFixturePacket = {
  sampleId: "a0",
  fromObservation: "groups-built",
  toObservation: "requests-prepared",
  prompt: "3 + 2 = ?",
  promptIds: [11, 12, 13, 14, 15],
  method: "POST",
  endpoint: "/generate",
  payload: {
    input_ids: [11, 12, 13, 14, 15],
    sampling_params: {
      temperature: 0,
      top_p: 1,
      top_k: -1,
      max_new_tokens: 1,
      stop: [],
      stop_token_ids: [],
      skip_special_tokens: true,
      no_stop_trim: true,
      spaces_between_special_tokens: false,
    },
    return_logprob: true,
  },
};

const chapterFourExercise = {
  id: "stg.chapter-4-request-boundary-v2",
  kind: "mapping",
  title: "边境复核：每项材料究竟去哪里",
  prompt: "为本课默认纯文本 fixture 逐项选择实际目的地。不要把 Sample 任务字段误当成生成协议。",
  instruction: "每项只能选择一个目的地；条件分支按题目写明的部署条件判断。",
  items: [
    { id: "prompt-ids", label: "prompt_ids 在 pure-text 请求中的字段名" },
    { id: "prefix-ledger", label: "同一 prompt IDs 写入 Sample.tokens" },
    { id: "sampling-config", label: "temperature / max_new_tokens 等调用配置" },
    { id: "logprob-switch", label: "return_logprob = true" },
    { id: "label", label: "Sample.label = \"5\"" },
    { id: "identity", label: "group_index = 0 / index = 0" },
    { id: "reward-null", label: "Sample.reward = null" },
    { id: "session-id", label: "consistent-hashing 下存在的 session_id" },
  ],
  targets: [
    { id: "payload-input", label: "成为 payload.input_ids" },
    { id: "payload-params", label: "成为 payload.sampling_params" },
    { id: "payload-logprob", label: "成为 payload 顶层 return_logprob" },
    { id: "caller-only", label: "留在调用方 Sample" },
    { id: "not-produced", label: "生产者尚未运行，不存在可发送结果" },
    { id: "conditional-header", label: "条件性 HTTP header（非 JSON）" },
  ],
  correctMapping: {
    "prompt-ids": "payload-input",
    "prefix-ledger": "caller-only",
    "sampling-config": "payload-params",
    "logprob-switch": "payload-logprob",
    label: "caller-only",
    identity: "caller-only",
    "reward-null": "not-produced",
    "session-id": "conditional-header",
  },
  sourceRefIds: [
    "rollout.prepare-prompt-ids",
    "rollout.generate-state-init",
    "rollout.generate-request-envelope",
    "rollout.generate-request-dispatch",
  ],
  feedback: {
    correct: "边境申报正确。完整 Sample 留在调用方；只有生成服务器执行任务所需的最小投影进入协议。",
    incorrect: "逐项问两个问题：SGLang 生成 token 是否需要它？它属于 JSON body、条件 header，还是尚未产生的下游状态？",
  },
} as const satisfies StructuredExercise;

const chapterFiveExercise = {
  id: "stg.chapter-5-gate",
  kind: "mapping",
  title: "tuple 解码：服务器证据怎样投影",
  prompt: "将 output_token_logprobs 中的 tuple 位置映射到本地变量。",
  instruction: "以教学响应 [-0.356675, 25] 为例。",
  items: [
    { id: "tuple-0", label: "item[0] = -0.356675" },
    { id: "tuple-1", label: "item[1] = 25" },
    { id: "output-text", label: "output.text = \"5\"" },
    { id: "finish", label: "meta_info.finish_reason.type = \"stop\"" },
  ],
  targets: [
    { id: "logprob", label: "new_response_log_probs" },
    { id: "token", label: "new_response_tokens" },
    { id: "text", label: "response 文本" },
    { id: "terminal", label: "终止原因" },
  ],
  correctMapping: {
    "tuple-0": "logprob",
    "tuple-1": "token",
    "output-text": "text",
    finish: "terminal",
  },
  sourceRefIds: ["rollout.generate"],
  feedback: {
    correct: "解码正确。HTTP response 提供写回材料，但仍没有 Sample 的身份、label 或 reward。",
    incorrect: "直接检查两个列表推导式：item[1] 取 token ID，item[0] 取 log-prob。",
  },
} as const satisfies StructuredExercise;

const chapterSixExercise = {
  id: "stg.chapter-6-gate",
  kind: "choice",
  multiple: false,
  title: "首错定位：拒绝半写入",
  prompt: "a0 将追加 2 个 token，却只带来 1 个 log-prob。最早应在哪条边界拒绝它？",
  instruction: "选择最接近错误来源、且能避免半写入的检查。",
  options: [
    { id: "preflight", label: "追加 tokens 之前校验 token/log-prob 长度" },
    { id: "reward", label: "等待 reward 阶段判断答案是否正确" },
    { id: "trainer", label: "等 trainer 构造 batch 时再修补长度" },
    { id: "status", label: "把 status 改成 completed 即可" },
  ],
  correctOptionIds: ["preflight"],
  sourceRefIds: ["sample.append-response-tokens", "sample.validate-response-metadata-lengths"],
  feedback: {
    correct: "正确。对齐是写回契约，必须在修改 Sample 之前拒绝不完整响应。",
    incorrect: "reward 与正确性无关，trainer 又太晚；错误必须在 response 写回边界被隔离。",
  },
} as const satisfies StructuredExercise;

export const sampleToGenerationChapters: readonly SampleToGenerationChapter[] = [
  {
    id: "stg.chapter-1",
    number: 1,
    slug: "row-to-sample",
    title: "一行数据怎样成为 Sample",
    shortTitle: "构造",
    durationMinutes: 11,
    drivingQuestion: "当 read_file() 交出一个 Python dict 时，slime 得到的是训练样本，还是一份尚待演化的协议对象？",
    imageSrc: "/art/library-act-01-v1.webp",
    imageAlt: "资料库原画台上一名在层叠档案之间核对记录的研究者",
    scopeLabel: "教学基线 · 纯文本 JSONL · 不应用 chat template · 不启用 processor",
    objective: "给定任意 row schema 与 Dataset 的键配置，写出本课追踪字段的初始 Sample 投影，并指出哪些值此时不可能已经产生。",
    conclusion: "构造完成时，origin-a 已有 prompt、label 与 metadata；tokens=[]、group_index=None、response=\"\"、reward=None、status=pending。",
    boundary: {
      input: [
        "read_file() 产出的有效 Python dict",
        "prompt_key=\"text\"、label_key=\"label\"、metadata_key=\"metadata\" 的教学配置",
        "apply_chat_template=False、processor=None、max_length=None 的研究条件",
      ],
      output: [
        "prompt、label、metadata 已确定的 origin Sample 教学投影",
        "status=pending，以及仍处于默认值的身份、生成、评价与训练字段",
      ],
      excluded: [
        "DataSource 分组与 group_index / index",
        "真实 checkpoint tokenizer 的 token ID",
        "SGLang response、reward 与 trainer batch",
      ],
    },
    stateTransition: {
      before: "data = {text: \"3 + 2 = ?\", label: \"5\", metadata: {source_name: \"mechanism_course\", difficulty: \"warmup\"}}",
      operation: "output_prompt = data.get(\"text\"); Sample(prompt=output_prompt, label=data[\"label\"], metadata=data.get(\"metadata\") or {}, multimodal_inputs=None)",
      after: "prompt=\"3 + 2 = ?\"；label=\"5\"；metadata 字段值来自 row；tokens=[]；response=\"\"；response_length=0；group_index=None；reward=None；loss_mask=None；status=pending",
    },
    tracePassport: {
      origin: {
        id: "origin-a",
        rowCode: "{\"text\":\"3 + 2 = ?\",\"label\":\"5\",\"metadata\":{\"source_name\":\"mechanism_course\",\"difficulty\":\"warmup\"}}",
        rowShape: "row{text, label, metadata}",
      },
      config: [
        { key: "schema keys", value: "prompt=\"text\" · label=\"label\" · metadata=\"metadata\"" },
        { key: "apply_chat_template", value: "False" },
        { key: "multimodal_keys / processor", value: "None / None" },
        { key: "max_length", value: "None" },
      ],
      stopAt: "Dataset 已完成 Sample(...) 构造；DataSource 分组、tokenizer、SGLang、reward 与 trainer 均未运行。",
    },
    mappingLanes: [
      {
        id: "prompt-lane",
        source: {
          label: "row 字段",
          code: "text",
          value: "\"3 + 2 = ?\"",
        },
        rule: {
          label: "Dataset 取值规则",
          code: "data.get(prompt_key)",
          explanation: "prompt_key=\"text\"，所以外部 text 获得内部 prompt 语义。",
        },
        target: {
          label: "initial Sample 投影",
          fields: [{ field: "prompt", value: "\"3 + 2 = ?\"" }],
        },
      },
      {
        id: "label-lane",
        source: {
          label: "row 字段",
          code: "label",
          value: "\"5\"",
        },
        rule: {
          label: "Dataset 取值规则",
          code: "label_key 非 None 时读取",
          explanation: "label_key=\"label\" 是教学配置；若为 None，即使 row 有 answer/label 也不读取。",
        },
        target: {
          label: "initial Sample 投影",
          fields: [{ field: "label", value: "\"5\"" }],
        },
      },
      {
        id: "metadata-lane",
        source: {
          label: "row 字段",
          code: "metadata",
          value: "{source_name, difficulty}",
        },
        rule: {
          label: "Dataset 取值规则",
          code: "data.get(metadata_key) or {}",
          explanation: "取到 truthy 对象时直接传入；键缺失或值为 falsy 时回退为空字典。",
        },
        target: {
          label: "initial Sample 投影",
          fields: [{ field: "metadata", value: "{source_name: \"mechanism_course\", difficulty: \"warmup\"}" }],
        },
      },
      {
        id: "defaults-lane",
        source: {
          label: "构造调用",
          code: "Sample(...) 未传入",
          value: "身份、生成、评价与训练字段",
        },
        rule: {
          label: "Python dataclass",
          code: "dataclass defaults",
          explanation: "参数缺席不是 UI 猜测，而是 dataclass 定义给出的确定初始状态。",
        },
        target: {
          label: "本课追踪的其余 Sample 字段",
          fields: [
            { field: "group_index", value: "None" },
            { field: "index", value: "None" },
            { field: "tokens", value: "[]" },
            { field: "response", value: "\"\"" },
            { field: "response_length", value: "0" },
            { field: "reward", value: "None" },
            { field: "loss_mask", value: "None" },
            { field: "weight_versions", value: "[]" },
            { field: "rollout_log_probs", value: "None" },
            { field: "status", value: "pending" },
            { field: "train_metadata", value: "None" },
          ],
        },
      },
    ],
    defaultFieldGroups: [
      {
        id: "dataset-explicit",
        title: "Dataset 显式传入",
        summary: "这些值已经越过外部 schema → 内部协议的翻译边界。",
        fields: [
          {
            field: "prompt",
            value: "\"3 + 2 = ?\"",
            provenance: "output_prompt",
            interpretation: "任务文本已经就绪。",
          },
          {
            field: "label",
            value: "\"5\"",
            provenance: "data[\"label\"]",
            interpretation: "参考信息已就绪，但尚未产生 reward。",
          },
          {
            field: "metadata",
            value: "{source_name: \"mechanism_course\", difficulty: \"warmup\"}",
            provenance: "data.get(metadata_key) or {}",
            interpretation: "固定 upstream 对 truthy metadata 未显式 deepcopy；本课账本只追踪字段值，不追踪 Python 对象身份。",
          },
          {
            field: "multimodal_inputs",
            value: "None",
            provenance: "Dataset 显式传入",
            interpretation: "processor=None 的纯文本路径。",
          },
        ],
      },
      {
        id: "dataclass-default",
        title: "dataclass 默认值",
        summary: "这些空白精确标记生产链尚未抵达的位置；每一项都能指出下一生产者。",
        fields: [
          { field: "group_index", value: "None", provenance: "dataclass 默认值", nextProducer: "DataSource 分组", interpretation: "尚未建立候选比较组。" },
          { field: "index", value: "None", provenance: "dataclass 默认值", nextProducer: "DataSource 分组", interpretation: "尚未分配物理 Sample 身份。" },
          { field: "tokens", value: "[]", provenance: "dataclass default_factory", nextProducer: "generation 准备 prompt IDs", interpretation: "长度检查即便调用 tokenizer，也不会写入这里。" },
          { field: "response", value: "\"\"", provenance: "dataclass 默认值", nextProducer: "SGLang response 写回", interpretation: "模型尚未生成文本。" },
          { field: "response_length", value: "0", provenance: "dataclass 默认值", nextProducer: "response 写回", interpretation: "回答空间仍为空。" },
          { field: "reward", value: "None", provenance: "dataclass 默认值", nextProducer: "reward 计算", interpretation: "label 存在不等于答案已被评价。" },
          { field: "loss_mask", value: "None", provenance: "dataclass 默认值", nextProducer: "response 写回", interpretation: "尚无回答 token 可对齐。" },
          { field: "weight_versions", value: "[]", provenance: "dataclass default_factory", nextProducer: "generation meta_info 写回", interpretation: "尚无生成权重来源。" },
          { field: "rollout_log_probs", value: "None", provenance: "dataclass 默认值", nextProducer: "SGLang log-prob 写回", interpretation: "尚无 rollout 概率证据。" },
          { field: "status", value: "pending", provenance: "dataclass 默认值", nextProducer: "generation 终止状态写回", interpretation: "pending 只表示尚未处理，不表示答案正确。" },
          { field: "train_metadata", value: "None", provenance: "dataclass 默认值", nextProducer: "本课外 custom rollout / hook（若使用）", interpretation: "默认路径可合法保持 None；conversion 只在非空时消费并投影，不生产 train_metadata。" },
        ],
      },
    ],
    branch: {
      title: "支线：chat template、多模态、坏行与长度过滤在哪里分叉",
      body: "这些分支会改变 prompt 的具体形态、是否附带多模态输入，或一条记录能否保留；它们不改变本章责任边界：Dataset 仍未生成 response、reward 或 trainer batch。",
      edgeCases: [
        {
          condition: "JSONL 空行或无法解析",
          behavior: "空行被跳过；JSONDecodeError 被报告后该行继续被跳过，因此它不会产生 Sample。",
        },
        {
          condition: "没有显式设置 label_key",
          behavior: "参数默认值为 None，Sample.label 也保持 None；字段名叫 label 并不会触发自动推断。",
        },
        {
          condition: "配置键与 row 不匹配",
          behavior: "data.get(prompt_key) 在缺键时得到 None，并不会自动完成 schema 校验；若 label_key 已显式配置但对应列缺失，data[label_key] 会抛出 KeyError。",
        },
        {
          condition: "max_length 不为 None",
          behavior: "纯文本分支可能调用 tokenizer 计算 prompt 长度并过滤候选 Sample，但这一步仍不会把编码写入 Sample.tokens；list prompt 在未应用 chat template 时会跳过这项长度检查。",
        },
        {
          condition: "multimodal_keys is not None",
          behavior: "这一条件使 _build_messages 采用 conversation 形态；只有 truthy 的键映射才会把指定 row 媒体字段替换进消息占位符。它本身不执行图像或视频预处理。",
        },
        {
          condition: "apply_chat_template=True",
          behavior: "tokenizer.apply_chat_template(..., tokenize=False) 把 conversation 渲染为 output_prompt，但不写 Sample.tokens。",
        },
        {
          condition: "processor 非空",
          behavior: "Dataset 要求预模板 prompt 已是 list，调用 process_vision_info，并把返回的原始媒体字典显式传为 Sample.multimodal_inputs；processor 单独配合字符串 prompt 会触发断言，也不会产生 multimodal_train_inputs。",
        },
        {
          condition: "从常用 CLI 参数进入",
          behavior: "Dataset 自身默认 prompt_key=\"text\"；常用训练参数的 --input-key 默认通常是 \"input\"，DataSource 会将它转传为 prompt_key。本章值是明确教学配置。",
        },
      ],
    },
    explanation: [
      {
        title: "Dataset 默认值与 CLI 默认值不是同一层",
        body: "Dataset 类自身的 prompt_key 默认是 text；常用训练入口的 --input-key 默认通常是 input，DataSource 再把它转传为 prompt_key。两者并不矛盾：前者是 Python 构造器默认值，后者是上层调用配置。本章显式固定 --input-key text，因此所有结论只对这条教学路径负责。",
      },
      {
        title: "调用 tokenizer 做长度检查，也不等于写入 Sample.tokens",
        body: "若启用 max_length，filter_long_prompt 可能调用 tokenizer 计算纯文本 prompt 的长度，再决定是否保留候选 Sample；它并不会把得到的 input IDs 写入 Sample.tokens。因此正确的边界不是“Dataset 永远不调用 tokenizer”，而是“Dataset 的长度检查不生产 generation 路径使用的 token 状态”。",
      },
      {
        title: "label 的出现由配置决定，reward 的出现由计算决定",
        body: "label_key 的默认值是 None；只有任务显式声明标签列，Dataset 才把参考答案带入 Sample。reward 无法以同样方式从 row“顺手取得”，因为它必须针对某个具体 response 运行评价函数。此时 label=\"5\" 与 reward=None 同时成立，恰好说明输入语义已经就绪，而评价边界尚未发生。",
      },
      {
        title: "成为 Sample 不等于成为 trainer batch",
        body: "Sample 是跨组件传递的 Python 协议对象，不是已经排布好的训练张量。当前对象尚无 token 序列、候选组身份、回答、loss mask 或 rollout log-prob。只有后续组件逐项补齐这些状态，并经过显式转换，trainer 才会收到可消费的数据结构。",
      },
    ],
    observationIds: ["rows-read", "samples-constructed"],
    sourceRefIds: ["dataset.read-file", "dataset.construct-sample", "sample.dataclass"],
    evidenceId: "evidence-row-to-sample",
    additionalEvidenceIds: ["evidence-sample-fields"],
    exercise: chapterOneExercise,
    misconception: {
      belief: "Dataset 返回了 Sample，所以这条记录已经完成 tokenization，可以直接交给 trainer。",
      correction: "Dataset 只建立统一协议对象。此时 tokens 仍是默认空列表，group_index 与 index 尚未分配，response、reward、loss_mask 与 rollout_log_probs 也没有生产者运行。训练张量还要等待生成、评价、收集与显式转换。",
    },
    takeaway: "Dataset 的产物不是训练张量，而是一份有明确空白的协议对象：每个已填字段有来源，每个空字段有等待的生产者。",
    transition: "下一章将把这些生产者逐一标到 Sample 字段上；在此之前，不让任何空值冒充已经完成的计算。",
  },
  {
    id: "stg.chapter-2",
    number: 2,
    slug: "field-ownership",
    title: "字段生命周期接力台",
    shortTitle: "生命周期",
    durationMinutes: 12,
    drivingQuestion: "字段存在，是否意味着它已经由正确的生产者计算出来？",
    imageSrc: "/art/library-act-02-v1.webp",
    imageAlt: "资料库接力台上，字段卡片依次经过构造、分组、生成、评价与转换工位",
    scopeLabel: "固定 commit 06ffdbe2 · 默认纯文本 rollout · custom generate / group RM / custom conversion 均关闭",
    objective: "给定任意阶段 snapshot，区分 dataclass 默认、构造器显式初始化、首次非默认生产者与可信观察点，并定位过早出现的字段。",
    conclusion: "Sample 字段不是一次填满的表：构造、分组、raw generate 与 reward wrapper 依次接棒；conversion 再派生独立的 TrainData 语义，而不是把 Sample 改名。",
    boundary: {
      input: ["Sample dataclass 默认值", "Dataset 的四个显式 Sample(...) 实参", "固定 commit 的默认文本 rollout 调用链"],
      output: ["五棒 Producer relay", "逐字段 lifecycle 账本", "三个过早字段的首个缺席生产者", "TrainData derived outputs"],
      excluded: ["custom generate / group RM / custom conversion 的具体实现", "reward 算法内部", "trainer tensor 布局与 optimizer step"],
    },
    stateTransition: {
      before: "只看到字段声明与当前值，容易把 None 当缺失、把未来 fixture 当成当前状态",
      operation: "依次记录 dataclassDefault → initializedBy → firstNonDefaultProducer → trustworthyFrom，并核对每棒 scope/caveat",
      after: "能解释 label=None 与 multimodal_inputs=None 的合法终态，区分 raw generate / reward wrapper，并确认 train_data 是 conversion 派生语义",
    },
    explanation: [
      {
        title: "默认值、显式初始化与非默认值是三件事",
        body: "dataclass 声明给出构造时 fallback；Dataset 的 Sample(...) 又显式传入 prompt、label、metadata 与 multimodal_inputs。显式实参仍可等于默认值：processor=None 时 multimodal_inputs 被明确传为 None，label_key=None 时 label 也被明确传为 None。它们已经是可信决策结果，不是等待某个必然生产者来“补空”。",
      },
      {
        title: "首次非默认生产者必须晚于可信初始化",
        body: "Dataset 返回后，prompt/label/metadata 已可信，但 group_index 与 index 仍要等 DataSource deepcopy 并编号。raw generate 再写 tokens、response、response_length、loss_mask、rollout_log_probs、status 与可选 weight_versions。字段在 Sample 类中可见，只证明协议容纳它，不证明对应生产者已经运行。",
      },
      {
        title: "raw generate 与 reward wrapper 是相邻但不同的棒",
        body: "generate() 准备纯文本 prompt IDs、请求 SGLang，并通过 append_response_tokens 写回生成证据；它不会计算 reward。默认 generate_and_rm() 在 generate 和 sample hooks 之后，才在 reward 仍为 None 时调用 async_rm。custom generate、hook 或 group RM 会改变评价落点，所以本章结论严格限定默认非 group-RM 路径。",
      },
      {
        title: "conversion 产生新的 TrainData 语义",
        body: "_convert_samples_to_train_data() 新建 train_data 映射，把 Sample 字段投影为 tokens、response_lengths、reward 视图、sample_indices、rollout_ids 与 mask 聚合等训练键。它不是继续给 Sample 添加 trainer 字段，也不把 train_metadata 当作自己的产物：只有上游已显式提供 train_metadata 时，它才投影为 train_data.metadata。",
      },
      {
        title: "loss_mask 同时展示 fallback 与副作用边界",
        body: "进入 conversion 时 Sample.loss_mask 可以仍是 None；默认 conversion 会按 response_length 回写全 1。若 remove_sample=True，它再回写同长度全 0，然后把结果收集为 train_data.loss_masks。因此 TrainData 在语义上是独立产物，但不能误称 conversion 对 Sample 完全无修改或对嵌套列表做了深拷贝。",
      },
    ],
    producerRelayStages,
    fieldLifecycleEntries,
    earlyFieldDiagnosticCases,
    observationIds: ["samples-constructed"],
    sourceRefIds: [
      "sample.dataclass",
      "dataset.construct-sample",
      "rollout.datasource-get-samples",
      "rollout.generate",
      "sample.append-response-tokens",
      "sample.apply-meta-info",
      "rollout.generate-and-rm",
      "rollout.post-process-rewards",
      "rollout.convert-train-data",
    ],
    evidenceId: "evidence-sample-fields",
    exercise: chapterTwoExercise,
    misconception: {
      belief: "字段一旦是 None 就表示漏产；conversion 之后它们都会在同一个 Sample 上补齐。",
      correction: "None 可能是合法终态，也可能只是在等待首个非默认生产者。必须结合 trustworthyFrom 判断；conversion 的主要产物是新的 train_data 映射，不是“填满 Sample”。",
    },
    takeaway: "判断字段可靠性要同时问四件事：默认是什么、谁初始化、谁首次改成非默认、从哪个返回边界起可以相信。",
    transition: "接力关系固定后，下一章放大第二棒：DataSource 如何让同组候选共享比较条件，却保持对象身份完全独立。",
  },
  {
    id: "stg.chapter-3",
    number: 3,
    slug: "group-without-aliasing",
    title: "成组，但不粘连",
    shortTitle: "分组",
    durationMinutes: 14,
    drivingQuestion: "同一道题的两个候选为什么既要相同，又必须是两个独立对象？",
    imageSrc: "/art/library-act-03-v1.webp",
    imageAlt: "动画制作工作台上并列的屏幕与透明操作面板，暗示同一底稿被复制为可独立修改的候选。",
    scopeLabel: "固定 commit 06ffdbe2 · fresh DataSource counters · 2 seeds × 2 candidates · 停在 groups-built",
    objective: "给定 seed 数 P、n_samples_per_prompt=N 与调用前两个计数器，推导嵌套输出形状和每个候选的 group_index/index，并用 metadata 突变判断候选之间是否存在对象别名。",
    conclusion: "相同的是 seed 内容与组归属；不同的是 Sample 身份、唯一 index，以及每条候选各自拥有的可变状态。",
    boundary: {
      input: ["samples-constructed 的 origin-a / origin-b 两个 seed Sample", "n_samples_per_prompt=2", "fresh counters：sample_group_index=0、sample_index=0"],
      output: ["嵌套形状 [[a0, a1], [b0, b1]]", "2×2 身份矩阵", "四个独立 Sample 与 metadata 容器"],
      excluded: ["tokenizer / SGLang / response 写回", "reward 与 TrainData", "rollout_id 与 partial rollout"],
    },
    stateTransition: {
      before: "P=2 个未分组 seed Sample；group_index=None、index=None；计数器 G₀=0、I₀=0",
      operation: "对每个 seed 分别执行 N=2 次 deepcopy；副本写入当前 group counter 与 sample counter",
      after: "返回 [[a0,a1],[b0,b1]]；group_index=0/0/1/1，index=0/1/2/3；seed 不被改写",
    },
    explanation: [
      {
        title: "P 决定组数，N 决定每组宽度",
        body: "get_samples(num_samples) 先取得 P 个 seed；内层 range(n_samples_per_prompt) 再为每个 seed 产生 N 个候选。因此返回的是 list[group][sample]：P 组、每组 N 条、总计 P×N 个物理候选 Sample。组按 seed occurrence 建立，不按 prompt 文本哈希。",
      },
      {
        title: "两个计数器回答两个不同问题",
        body: "group_index 回答“这条候选和谁比较”；index 回答“这是哪一个物理候选 Sample”。在 fresh-counter fixture 中，a0/a1 的组号同为 0，而四条 index 为 0、1、2、3。恢复状态或后续调用可以从非零计数器继续，所以这些数字不是框架常量。",
      },
      {
        title: "值相同不等于对象相同",
        body: "deepcopy 为 Sample 及其普通可变容器建立独立对象图。a0.metadata 与 a1.metadata 初始值相等，但不是同一个容器；修改 a0 不会污染 a1。不可变字符串等叶子无需承诺不同的 Python identity，本章验证的是可变状态隔离。",
      },
    ],
    groupingLabGroups,
    groupingCounterFrames,
    groupingComparisonRules,
    groupingAliasProbe,
    observationIds: ["groups-built"],
    sourceRefIds: ["sample.identity-defaults", "rollout.datasource-counter-init", "rollout.datasource-get-samples"],
    evidenceId: "evidence-deepcopy-groups",
    additionalEvidenceIds: ["evidence-sample-identity-defaults", "evidence-datasource-counter-init"],
    exercise: chapterThreeExercise,
    misconception: {
      belief: "同组候选的 prompt 与 metadata 值一样，因此 a0 和 a1 可以共享同一个 Sample 或 metadata 对象。",
      correction: "它们共享比较条件与 group_index，不共享可变对象。index 标识各自的物理候选；未来的 response、log-prob、status 与 reward 也必须能够独立变化。",
    },
    takeaway: "group_index 表示关系；index 表示身份；deepcopy 保证状态隔离。",
    transition: "四条 Sample 已经各自就位。下一章检查它们如何被翻译成四个 SGLang 请求。",
  },
  {
    id: "stg.chapter-4",
    number: 4,
    slug: "sample-to-request",
    title: "请求装配与边境检查台",
    shortTitle: "请求",
    durationMinutes: 14,
    drivingQuestion: "为什么完整 Sample 不应原样成为 HTTP payload？",
    imageSrc: "/art/library-act-04-v1.webp",
    imageAlt: "植物与玻璃瓶环绕的工作台上，一名角色用天平称量材料；画面被用作请求字段逐项称量的章节关键帧。",
    scopeLabel: "固定 commit 06ffdbe2 · a0 pure-text path · groups-built → requests-prepared · 不读取真实 response",
    objective: "给定一条已分组的 pending Sample，按真实源码顺序重建 prompt_ids、生成预算检查、三键 payload、Sample.tokens 前缀留档与 POST；并能把每个字段判为 JSON、条件 header、调用方留置或尚未产生。",
    conclusion: "Sample 并没有“变成”请求。调用方仍持有完整对象，只把生成服务器需要的最小投影送过网络。",
    boundary: {
      input: ["groups-built 的 a0：prompt、label、group/index 已存在，tokens=[]", "checkpoint tokenizer/processor", "调用链传入的 sampling_params 副本"],
      output: ["Sample.tokens 中保存的 prompt 前缀", "POST /generate 的课程 request sidecar：input_ids、sampling_params、return_logprob"],
      excluded: ["真实服务器 response", "reward 与答案正确性", "把课程 sidecar 说成 upstream Sample 字段"],
    },
    stateTransition: {
      before: "a0.tokens=[]，prompt=\"3 + 2 = ?\"，status=pending",
      operation: "准备局部 prompt_ids → 检查 max_new_tokens → 构造 payload/input_ids → 若 tokens 为空则保存前缀 → POST /generate",
      after: "a0.tokens=[11,12,13,14,15]；pure-text fixture payload 顶层恰为 input_ids、sampling_params、return_logprob",
    },
    explanation: [
      {
        title: "先做投影，不做整对象序列化",
        body: "默认纯文本路径先用 checkpoint tokenizer 得到局部 prompt_ids，再把它放进 payload.input_ids。label、metadata 和 group/index 对 SGLang 的 token 生成没有必要，因此留在调用方。这里的 [11,12,13,14,15] 是可复算的教学 tokenizer 结果，不冒充真实 checkpoint。",
      },
      {
        title: "采样配方属于运行策略",
        body: "GenerateState 从 rollout 参数建立默认 sampling_params，任务提交时把配置副本传入 generate。temperature、top_p、top_k 与 max_new_tokens 告诉服务器如何生成，不描述这道题的正确答案，也不是 Sample 身份字段。",
      },
      {
        title: "return_logprob 是协议开关，不是评价器",
        body: "顶层 return_logprob=true 请求 SGLang 返回所选 token 的 log-prob 证据，供后续 response 投影与训练链路使用。它不会比较 response 与 label，不会运行 reward，也不会让服务器知道答案是否正确。",
      },
      {
        title: "同一前缀，两种职责",
        body: "源码先把 prompt_ids 放入 payload.input_ids，随后在 Sample.tokens 为空时保存同一序列值，再发出 POST。payload 是即将跨网的输入；Sample.tokens 是调用方保留的完整序列前缀。课程只声称值相等，不声称两个列表具有独立 Python 对象身份。",
      },
    ],
    requestAssemblyStages,
    requestManifestEntries,
    requestSamplingParameters,
    requestFixturePacket,
    observationIds: ["prompts-tokenized", "requests-prepared"],
    sourceRefIds: [
      "rollout.prepare-prompt-ids",
      "rollout.generate-state-init",
      "rollout.generate-request-budget",
      "rollout.generate-request-envelope",
      "rollout.generate-request-dispatch",
    ],
    evidenceId: "evidence-request-envelope",
    additionalEvidenceIds: ["evidence-prompt-request", "evidence-request-budget", "evidence-sampling-recipe", "evidence-request-dispatch"],
    exercise: chapterFourExercise,
    misconception: {
      belief: "把完整 Sample JSON 发给 SGLang，信息更全，因而接口更可靠。",
      correction: "可靠性来自可审计的最小协议：只发送生成所需投影，并让任务语义、候选身份和下游状态继续由调用方负责。这里是职责边界，不额外声称隐私或鉴权保证。",
    },
    takeaway: "payload 是生成协议，不是 Sample 的网络序列化。",
    transition: "a0 仍在调用方等待，三键请求刚刚越过边界。下一章只检查返回材料，暂不写回 Sample。",
    advancedAside: {
      title: "条件支线：多模态、已有 tokens、零预算与路由 header",
      body: "多模态路径可发送 image_data 与 text；满足条件时 _prepare_prompt_ids 会复用已有 tokens；max_new_tokens=0 会标记 truncated 并在 POST 前返回；routing replay 可增加 return_routed_experts；session_id 只在 consistent-hashing 条件下派生 HTTP header。本课主路径固定 pure text、tokens=[]、max_new_tokens=1 且无 session_id。",
    },
  },
  {
    id: "stg.chapter-5",
    number: 5,
    slug: "response-projection",
    title: "HTTP 响应为什么还不是 Sample",
    shortTitle: "响应",
    durationMinutes: 12,
    drivingQuestion: "服务器已经返回文本“5”，为什么 generate 还不能直接 return？",
    imageSrc: "/art/library-act-05-v1.webp",
    conclusion: "HTTP response 只提供新文本、token/log-prob tuple 与终止元数据；调用方必须把这些材料投影回原来的 Sample。",
    boundary: {
      input: ["SGLang output.text", "meta_info.output_token_logprobs", "finish_reason 与 weight_version"],
      output: ["response token IDs", "response log-prob 数组", "待写回的 response projection"],
      excluded: ["原始 prompt、label 与 group/index", "reward", "训练 mask 的最终验证"],
    },
    stateTransition: {
      before: "HTTP 响应包含 text=\"5\" 与 output_token_logprobs=[[-0.356675,25]]",
      operation: "分别以 item[1]、item[0] 投影 token ID 与 log-prob，并保留终止元数据",
      after: "projection={tokens:[25], log_probs:[-0.356675], text:\"5\", finish_reason:stop}",
    },
    explanation: [
      {
        title: "服务器不知道调用方的完整对象",
        body: "SGLang 接收到的是 payload，而不是带有 label、group_index 和 metadata 的 Sample。因此 response 不可能自行成为 Sample；它只能作为生成结果被合并回调用方仍持有的对象。",
      },
      {
        title: "tuple 顺序必须由源码而不是直觉决定",
        body: "output_token_logprobs 的每项在默认路径中以 item[1] 取 token ID、item[0] 取 log-prob。教学值把这种投影变得可见，但真正的契约来自 generate 的两条列表推导式。",
      },
      {
        title: "text 与 token evidence 各有用途",
        body: "text 供人和任务逻辑读取；token ID 用于拼接完整序列；log-prob 记录 rollout policy 对已选 token 的概率证据。三者相关，却不能互相替代。",
      },
      {
        title: "stop 只回答为什么结束",
        body: "finish_reason=stop 表明生成按正常停止条件终止。它没有比较 response 与 label，更没有运行 reward 函数，所以它不能证明“5”正确，也不能证明“6”错误。",
      },
    ],
    observationIds: ["responses-received"],
    sourceRefIds: ["rollout.generate"],
    evidenceId: "evidence-response-projection",
    exercise: chapterFiveExercise,
    misconception: {
      belief: "output.text 就是完整结果，token 和 log-prob 只是可选日志。",
      correction: "对训练链路而言，response token 与 rollout log-prob 是协议证据；只有文本无法建立正确的 response-space 对齐。",
    },
    takeaway: "HTTP response 是写回材料，不是 Sample 本身。",
    transition: "最后一章执行合并，并用三条长度关系验证 Sample 没有在边界上被写坏。",
  },
  {
    id: "stg.chapter-6",
    number: 6,
    slug: "writeback-contract",
    title: "写回怎样维持数据契约",
    shortTitle: "写回",
    durationMinutes: 15,
    drivingQuestion: "response 只有一个 token 时，为什么 tokens 长度是 6，而 mask 和 log-prob 长度都是 1？",
    imageSrc: "/art/library-act-06-v1.webp",
    conclusion: "tokens 位于完整序列空间；response_length、loss_mask 和 rollout_log_probs 位于回答空间。写回必须同时维护两套坐标。",
    boundary: {
      input: ["已保存 prompt tokens 的 Sample", "response projection", "finish_reason=stop 与 actor@0"],
      output: ["prompt+response 完整 tokens", "对齐的 response-side arrays", "status=completed 与 weight_versions=[actor@0]"],
      excluded: ["reward 与答案正确性", "collect", "训练数据转换与 optimizer step"],
    },
    stateTransition: {
      before: "a0.tokens 长度 5；response_length=0；loss_mask/log_probs=null；reward=null",
      operation: "预检 tuple 长度，追加 token 25，建立 mask/log-prob，应用 meta_info，再验证长度",
      after: "tokens 长度 6；response_length=1；loss_mask=[1]；log_probs=[-0.356675]；status=completed",
    },
    explanation: [
      {
        title: "完整序列与回答空间不可混用",
        body: "Sample.tokens 保留 5 个 prompt tokens，并在尾部追加 1 个 response token，所以长度为 6。response_length 只计新生成部分，因此为 1；loss_mask 和 rollout_log_probs 同样只为回答 token 提供一项。",
      },
      {
        title: "写回是一组不可分割的状态变化",
        body: "若 token 有两项而 log-prob 只有一项，继续追加会制造无法解释的 Sample。课程 reducer 因而在任何字段修改前完成预检，并在构造四条 next Sample 全部成功后才替换 batch。失败时旧 state 保持不变。",
      },
      {
        title: "meta_info 补充来源与终止状态",
        body: "weight_version=actor@0 说明这一段 response 由哪版 rollout 权重生成；finish_reason=stop 映射为 completed。两者都描述生成过程，不评价内容质量。",
      },
      {
        title: "四条 completed 中仍有两个错误答案",
        body: "a0 与 b0 分别回答 5 和 7，a1 与 b1 分别回答 6 和 8。四条都正常停止，因此全部 completed；但 reward 仍为 null。这个反例直接排除了 completed=正确的误读。",
      },
      {
        title: "课程边界在 generate 返回处闭合",
        body: "此刻我们已经解释了输入如何成为请求、响应如何成为 Sample。Reward、collect、训练转换和权重更新属于下一批机制课；在这里提前加入它们会破坏可验证的因果边界。",
      },
    ],
    observationIds: ["responses-written"],
    sourceRefIds: ["sample.append-response-tokens", "sample.apply-meta-info", "sample.validate-response-metadata-lengths"],
    evidenceId: "evidence-atomic-writeback",
    exercise: chapterSixExercise,
    misconception: {
      belief: "status=completed 表示模型给出了正确答案，可以直接训练。",
      correction: "completed 只表示生成正常终止。正确性要等待 reward；能否训练还要等待收集、转换与排程。",
    },
    takeaway: "一次可靠写回同时保留 prompt 前缀、对齐 response 元数据，并记录生成来源；它仍不产生 reward。",
    transition: "六章机制到此闭合。终测将给出一条新 trace，要求你定位第一个被破坏的边界。",
    advancedAside: {
      title: "支线：prefix cache 与 custom generate",
      body: "prefix cache 统计、top-p replay、工具调用和 custom generate 会增加元数据，但不能取消 response-space 数组必须对齐的基本契约。",
    },
  },
];

export const sampleToGenerationFinalAssessment: readonly StructuredExercise[] = [
  {
    id: "stg.final-q1",
    kind: "choice",
    multiple: false,
    title: "外部记录与内部协议",
    prompt: "下面哪句话最准确地区分 Dataset row 与 Sample？",
    instruction: "选择一个答案。",
    options: [
      { id: "contract", label: "row 属于外部 schema；Sample 是 slime 内跨阶段演化的协议对象" },
      { id: "same", label: "两者完全相同，只是变量名不同" },
      { id: "tensor", label: "Sample 是已经上 GPU 的训练 tensor" },
    ],
    correctOptionIds: ["contract"],
    sourceRefIds: ["dataset.construct-sample", "sample.dataclass"],
    feedback: { correct: "正确。", incorrect: "区分文件 schema、协议对象与训练 batch。" },
  },
  {
    id: "stg.final-q2",
    kind: "field-entry",
    title: "身份推导（必答）",
    prompt: "3 个 prompt、每个复制 4 次。填写 group 数和物理 Sample 数。",
    instruction: "输入十进制整数。",
    fields: [
      { id: "groups", label: "group 数", acceptedAnswers: ["3"] },
      { id: "samples", label: "物理 Sample 数", acceptedAnswers: ["12"] },
    ],
    sourceRefIds: ["rollout.datasource-get-samples"],
    feedback: { correct: "正确。", incorrect: "group 数由 prompt 数决定，总记录数再乘每组候选数。" },
  },
  {
    id: "stg.final-q3",
    kind: "choice",
    multiple: true,
    title: "网络边界",
    prompt: "默认纯文本教学路径的 SGLang payload 必须包含哪些顶层字段？",
    instruction: "选择所有正确项。",
    options: [
      { id: "input", label: "input_ids" },
      { id: "params", label: "sampling_params" },
      { id: "logprob", label: "return_logprob" },
      { id: "label", label: "label" },
      { id: "identity", label: "group_index / index" },
    ],
    correctOptionIds: ["input", "params", "logprob"],
    sourceRefIds: ["rollout.generate-request-envelope"],
    feedback: { correct: "正确。", incorrect: "只保留服务器执行生成所需的字段。" },
  },
  {
    id: "stg.final-q4",
    kind: "ordering",
    title: "端到端调用链（必答）",
    prompt: "排列从外部记录到 response 写回的顺序。",
    instruction: "从最早到最晚排序。",
    items: [
      { id: "dataset", label: "Dataset 构造 seed Sample" },
      { id: "group", label: "DataSource deepcopy 并编号" },
      { id: "tokenize", label: "准备 prompt IDs" },
      { id: "request", label: "POST /generate" },
      { id: "project", label: "投影 token/log-prob tuple" },
      { id: "append", label: "append_response_tokens 写回" },
    ],
    correctOrder: ["dataset", "group", "tokenize", "request", "project", "append"],
    sourceRefIds: ["dataset.construct-sample", "rollout.datasource-get-samples", "rollout.generate-request-dispatch", "sample.append-response-tokens"],
    feedback: { correct: "正确。", incorrect: "按对象边界与网络边界逐步重建调用链。" },
  },
  {
    id: "stg.final-q5",
    kind: "mapping",
    title: "响应投影",
    prompt: "把 response 的三种证据映射到用途。",
    instruction: "每项选择一个用途。",
    items: [
      { id: "text", label: "output.text" },
      { id: "token", label: "item[1]" },
      { id: "logprob", label: "item[0]" },
    ],
    targets: [
      { id: "readable", label: "可读 response" },
      { id: "append", label: "追加的 token ID" },
      { id: "policy", label: "rollout policy 概率证据" },
    ],
    correctMapping: { text: "readable", token: "append", logprob: "policy" },
    sourceRefIds: ["rollout.generate"],
    feedback: { correct: "正确。", incorrect: "回到两个列表推导式与 text 参数。" },
  },
  {
    id: "stg.final-q6",
    kind: "field-entry",
    title: "长度坐标（必答）",
    prompt: "prompt 有 5 个 token，response 有 2 个 token。写回后填写四个长度。",
    instruction: "输入十进制整数。",
    fields: [
      { id: "tokens", label: "len(tokens)", acceptedAnswers: ["7"] },
      { id: "response", label: "response_length", acceptedAnswers: ["2"] },
      { id: "mask", label: "len(loss_mask)", acceptedAnswers: ["2"] },
      { id: "logprob", label: "len(rollout_log_probs)", acceptedAnswers: ["2"] },
    ],
    sourceRefIds: ["sample.append-response-tokens", "sample.validate-response-metadata-lengths"],
    feedback: { correct: "正确。", incorrect: "tokens 在完整序列空间，另外三项在 response 空间。" },
  },
  {
    id: "stg.final-q7",
    kind: "choice",
    multiple: false,
    title: "终止不等于正确",
    prompt: "response 与 label 不同，但 finish_reason.type=stop。generate 返回时 status 和 reward 应是什么？",
    instruction: "选择一个答案。",
    options: [
      { id: "completed-null", label: "status=completed，reward=null" },
      { id: "failed-zero", label: "status=failed，reward=0" },
      { id: "completed-one", label: "status=completed，reward=1" },
    ],
    correctOptionIds: ["completed-null"],
    sourceRefIds: ["sample.apply-meta-info"],
    feedback: { correct: "正确。", incorrect: "stop 描述终止原因；reward 尚未运行。" },
  },
  {
    id: "stg.final-q8",
    kind: "choice",
    multiple: true,
    title: "课程边界（必答）",
    prompt: "generate 刚返回、reward 尚未执行。哪些状态此时应当仍未产生？",
    instruction: "选择所有正确项。",
    options: [
      { id: "reward", label: "reward" },
      { id: "train", label: "trainer batch / train_metadata" },
      { id: "optimizer", label: "optimizer step" },
      { id: "response", label: "response" },
      { id: "status", label: "terminal status" },
    ],
    correctOptionIds: ["reward", "train", "optimizer"],
    sourceRefIds: ["rollout.generate", "sample.append-response-tokens"],
    feedback: { correct: "正确。", incorrect: "本课只到生成写回；response 和 terminal status 已经产生。" },
  },
];

export const sampleToGenerationCourse: SampleToGenerationCourse = {
  metadata: {
    id: "core.sample-to-generation",
    route: "/learn/sample-to-generation",
    locale: "zh-CN",
    title: "Sample 如何得到回答——从一行输入到 SGLang 写回",
    summary: "沿固定 2×2 trace 逐边界验证 Dataset、Sample、DataSource 与 SGLang generation 的数据契约。",
    lessonRevision: 6,
    assessmentVersion: 1,
    durationMinutes: { chapters: 78, assessment: 10, total: 88 },
    requiresGpu: false,
    sourceBaseline: {
      nearestTag: "v0.3.1",
      describe: "v0.3.1-1-g06ffdbe2",
      commit: "06ffdbe22be068b52f9ed0fc318c473f7030197e",
    },
  },
  completion: {
    requiredChapterIds: sampleToGenerationChapters.map((chapter) => chapter.id),
    minCorrect: 7,
    requiredQuestionIds: ["stg.final-q2", "stg.final-q4", "stg.final-q6", "stg.final-q8"],
  },
  teachingValuesNotice:
    "课程中的 token ID、采样输出与 log-prob 是确定性的教学 fixture，不来自真实 checkpoint；系统边界与调用关系由固定 commit 的源码证据验证。",
  learningObjectives: [
    "区分 Dataset row、Sample 与 trainer batch",
    "根据 n_samples_per_prompt 推导 group_index 与 index",
    "逐键说明 SGLang payload 的输入边界",
    "把 output_token_logprobs 投影为 response token 与 log-prob",
    "验证完整 token 序列与 response-space 元数据的长度关系",
    "解释 completed 为什么不代表答案正确",
  ],
  chapters: sampleToGenerationChapters,
  finalAssessment: sampleToGenerationFinalAssessment,
  sourceEvidence: sampleToGenerationSourceEvidence,
};
