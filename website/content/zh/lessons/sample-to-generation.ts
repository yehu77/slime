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

export type ResponseDecodeStageId =
  | "http-json"
  | "output-mapping"
  | "tuple-split"
  | "candidate-package"
  | "writeback-gate";

export type ResponseDecodeStage = {
  id: ResponseDecodeStageId;
  order: number;
  title: string;
  input: readonly string[];
  operation: string;
  output: readonly string[];
  proof: string;
  notYet: string;
  sourceRefIds: readonly string[];
};

export type ResponseEvidenceLane = {
  id: string;
  kind: "server-field" | "caller-association" | "decoded-evidence" | "deferred-write";
  label: string;
  sourcePath: string;
  fixtureValue: string;
  projectedAs: string;
  proves: string;
  doesNotProve: string;
  sourceRefIds: readonly string[];
};

export type ResponseFixtureReceipt = {
  sampleId: string;
  fromObservation: string;
  toObservation: string;
  rawBody: {
    text: string;
    metaInfo: {
      outputTokenLogprobs: readonly (readonly [number, number])[];
      finishReason: { type: "stop" | "length" | "abort" };
      weightVersion: string;
    };
  };
  decoded: {
    responseTokenIds: readonly number[];
    responseLogProbs: readonly number[];
    text: string;
    metaInfoKept: boolean;
  };
  sampleBeforeWrite: {
    tokens: readonly number[];
    response: string;
    responseLength: number;
    lossMask: null;
    rolloutLogProbs: null;
    weightVersions: readonly string[];
    status: "pending";
    reward: null;
  };
};

export type ResponseDiagnosticCase = {
  id: string;
  title: string;
  snapshot: string;
  firstErrorBoundary: string;
  explanation: string;
};

export type WritebackCalibrationStepId =
  | "call-entry"
  | "preflight"
  | "text-append"
  | "token-mask-append"
  | "logprob-append"
  | "terminal-meta"
  | "late-audit";

export type WritebackCalibrationStep = {
  id: WritebackCalibrationStepId;
  order: number;
  title: string;
  sourceOperation: string;
  reads: readonly string[];
  writes: readonly {
    field: string;
    before: string;
    after: string;
  }[];
  proves: string;
  doesNotProve: string;
  failureTiming: "no-mutation" | "pre-mutation" | "post-mutation";
  sourceRefIds: readonly string[];
};

export type WritebackCoordinateRow = {
  id: string;
  field: string;
  coordinateSpace: "full-sequence" | "response" | "text" | "terminal" | "outside-course";
  before: string;
  incoming: string;
  after: string;
  indexRule: string;
  invariant: string;
  caveat: string;
};

export type WritebackTerminalCase = {
  id: string;
  incoming: string;
  statusAfter: string;
  weightVersionAfter: string;
  reason: string;
};

export type WritebackFailureBoundary = {
  id: string;
  title: string;
  condition: string;
  boundary: "preflight" | "late-validation" | "course-reducer";
  sampleMutation: string;
  explanation: string;
  sourceRefIds: readonly string[];
};

export type WritebackFixture = {
  sampleId: string;
  fromObservation: string;
  toObservation: string;
  prefixLength: number;
  before: {
    tokens: readonly number[];
    response: string;
    responseLength: number;
    lossMask: null;
    rolloutLogProbs: null;
    weightVersions: readonly string[];
    status: "pending";
    reward: null;
  };
  incoming: {
    tokens: readonly number[];
    logProbs: readonly number[];
    trainable: true;
    text: string;
    metaInfo: {
      finishReason: { type: "stop" };
      weightVersion: string;
    };
  };
  after: {
    tokens: readonly number[];
    response: string;
    responseLength: number;
    lossMask: readonly number[];
    rolloutLogProbs: readonly number[];
    weightVersions: readonly string[];
    status: "completed";
    reward: null;
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
  responseDecodeStages?: readonly ResponseDecodeStage[];
  responseEvidenceLanes?: readonly ResponseEvidenceLane[];
  responseFixtureReceipt?: ResponseFixtureReceipt;
  responseDiagnosticCases?: readonly ResponseDiagnosticCase[];
  writebackCalibrationSteps?: readonly WritebackCalibrationStep[];
  writebackCoordinateRows?: readonly WritebackCoordinateRow[];
  writebackTerminalCases?: readonly WritebackTerminalCase[];
  writebackFailureBoundaries?: readonly WritebackFailureBoundary[];
  writebackFixture?: WritebackFixture;
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
    id: "evidence-http-json-decode",
    title: "源码底片：HTTP bytes 先通过 JSON 解码",
    sourceRefId: "http.post-json-decode",
    claim: "_post 对成功 response 读取 bytes，并优先通过 json.loads 建立 generate 随后访问的 output 值。",
    focus: [
      "raise_for_status 先于 body 解析",
      "aread 取得 response bytes",
      "非 JSON body 会回退为 decoded string，因此本课 nested mapping 是固定主路径，不是 helper 的唯一返回类型",
    ],
    boundary: "摘录只证明传输层到 Python 值的第一层解码；它不证明 SGLang response 的完整 schema，也不涉及 Sample。",
  },
  {
    id: "evidence-response-decode",
    title: "源码底片：同一 tuple 分出 token 与 log-prob 两条轨",
    sourceRefId: "rollout.generate-response-decode",
    claim: "generate 在 output_token_logprobs 存在时以 item[1] 投影 token ID、item[0] 投影 log-prob；字段缺失时两者都回退为空数组。",
    focus: [
      "tuple 的索引 1 是 token ID，索引 0 是 log-prob",
      "列表推导式维持输入 tuple 的顺序与数量",
      "真实 tuple 可以带未被本路径读取的尾随元素；课程二元值只覆盖前两个位置",
    ],
    boundary: "output.text 没有在这里重新 tokenizer，也没有与 tokens 互证；return_logprob=true 是请求意图，不是强制客户端 schema。",
  },
  {
    id: "evidence-response-handoff",
    title: "源码边界：证据怎样站到写回方法门前",
    sourceRefId: "rollout.generate-writeback-handoff",
    claim: "generate 把 tokens、log_probs、text、meta_info 与调用方常量 trainable=True 一并交给 append_response_tokens。",
    focus: [
      "trainable=True 来自调用方代码，不来自 HTTP response",
      "原始 meta_info 被整体交接，终止状态与权重版本尚未在本章兑现",
      "方法调用是第五章的停止线，也是第六章的起点",
    ],
    boundary: "摘录展示参数交接与方法调用，但第五章课程观察点冻结在调用发生之前；Sample 字段变化由第六章负责解释。",
  },
  {
    id: "evidence-writeback-preflight",
    title: "源码底片：哪些错误确实在原地修改前被拒绝",
    sourceRefId: "sample.append-preflight",
    claim: "append_response_tokens 先规范化 token/log-prob 输入，并在写 response 文本之前完成三类局部 preflight。",
    focus: [
      "token 与 log-prob 数量不等会立刻抛错",
      "非空 trainable token 必须携带 log-prob",
      "非空 non-trainable token 不接受调用方传入的 log-prob，而会在通过后自行补 0.0",
    ],
    boundary: "这些检查只覆盖调用入口的局部数组契约；既有 log-prob 连续性、top-p、routed experts 与最终 response metadata 长度在后面检查。",
  },
  {
    id: "evidence-writeback-core",
    title: "源码底片：两套坐标按怎样的顺序被原地推进",
    sourceRefId: "sample.append-core-coordinates",
    claim: "生产方法先拼接 response 文本，再尾部追加完整 tokens、增长 response_length、扩展 loss_mask，最后处理 rollout_log_probs。",
    focus: [
      "response 字符串先于 token 变化，且不与 token IDs 互证",
      "tokens 是完整序列；loss_mask 与 rollout_log_probs 以 previous_response_length 为回答坐标基准",
      "既有 response 缺少历史 rollout_log_probs 的连续性错误发生在核心 mutation 之后",
    ],
    boundary: "摘录证明固定源码的原地执行顺序；它没有存储 prefix_length，也不承诺 late failure 自动回滚。",
  },
  {
    id: "evidence-writeback-terminal",
    title: "源码底片：terminal gate 怎样处理版本与状态",
    sourceRefId: "sample.apply-terminal-info",
    claim: "只有 terminal update 被允许且 meta_info 含 finish_reason 时，固定源码才继续累计统计、追加存在的 weight_version 并映射已知 finish type。",
    focus: [
      "缺 finish_reason 或 update_terminal_info=False 会提前 return",
      "weight_version 按键存在追加，不是每次调用的必然结果",
      "stop / length / abort 分别映射 completed / truncated / aborted；未知值保持原 status",
    ],
    boundary: "这些字段描述生成来源与结束方式，不包含 label 比较、reward 或训练可用性判断。",
  },
  {
    id: "evidence-writeback-length-defense",
    title: "源码底片：写回末端的 response-space 长度防线",
    sourceRefId: "sample.validate-response-metadata-full",
    claim: "生产方法在若干原地修改之后，才验证 loss_mask、rollout_log_probs 与 top-p replay 元数据是否和 response_length 对齐。",
    focus: [
      "loss_mask 与 rollout_log_probs 只有在非 None 时才要求等于 response_length",
      "top-p replay 用扁平 token IDs 与 response_length+1 个 offsets 表示 ragged spans",
      "这是一道 late validation 防线，不是事务回滚机制",
    ],
    boundary: "课程 reducer 采用 copy-on-write 与整批替换，能在教学 trace 中避免半发布；固定源码的 Sample.append_response_tokens 原地修改 self，晚期校验失败时不承诺回滚。",
  },
  {
    id: "evidence-writeback-top-p",
    title: "进阶源码底片：ragged top-p replay 怎样占用回答坐标",
    sourceRefId: "sample.top-p-extract-contract",
    claim: "top-p replay 用一列扁平 token IDs 和一列 offsets 表示每个 response position 的变长 nucleus；新 chunk 的 offsets 数量必须是新 token 数加一。",
    focus: [
      "token IDs 与 offsets 必须成对出现",
      "chunk offsets 从 0 开始，末项等于扁平 token ID 数",
      "累计 Sample 的 offsets 还要在最终 validator 中与 response_length+1 对齐",
    ],
    boundary: "本课 a0 fixture 未启用 top-p replay；该证据用于解释最终 validator 为什么不只检查 loss_mask 与 rollout_log_probs。",
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

export const responseDecodeStages: readonly ResponseDecodeStage[] = [
  {
    id: "http-json",
    order: 1,
    title: "HTTP bytes 先成为 Python 值",
    input: ["成功响应的 body bytes", "HTTP status"],
    operation: "_post() 先执行 raise_for_status()，读取 body，再尝试 json.loads(content)。",
    output: ["output mapping", "或非 JSON 时的 decoded string fallback"],
    proof: "固定源码能证明 JSON 解码发生在 generate 取得 output 之前。",
    notYet: "这一层还没有读取 text、tuple，也不知道 response 属于哪条 Sample。",
    sourceRefIds: ["http.post-json-decode"],
  },
  {
    id: "output-mapping",
    order: 2,
    title: "generate 取得 text 与 meta_info",
    input: ["output[\"text\"]", "output[\"meta_info\"]"],
    operation: "调用方把返回 mapping 当作两类材料读取：人类可读文本，以及生成过程元数据。",
    output: ["text=\"5\"", "nested meta_info"],
    proof: "generate 直接访问这两个键；课程只重建固定路径访问到的最小 shape，不冒充完整 SGLang schema。",
    notYet: "text 没有被重新 tokenizer，也没有与 token IDs 做一致性验证。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "tuple-split",
    order: 3,
    title: "同一 tuple 序列分成两条等长轨",
    input: ["meta_info.output_token_logprobs[*]", "教学 tuple [-0.356675, 25]"],
    operation: "逐项以 item[1] 取 response token ID，以 item[0] 取 rollout log-prob；字段缺失时两条轨都回退为空数组。",
    output: ["response_token_ids=[25]", "response_log_probs=[-0.356675]"],
    proof: "两条列表推导式共享同一输入顺序，因此课程 fixture 的投影长度与顺序可以确定性复算。",
    notYet: "真实 tuple 可以带尾随元素；本课严格二元教学值不是完整 wire schema。return_logprob=true 也不等于客户端强制收到该字段。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "candidate-package",
    order: 4,
    title: "调用方补上关联键，形成候写证据包",
    input: ["sample_id=a0（调用方）", "text / token IDs / log-probs / meta_info（服务器与解码器）"],
    operation: "课程把各来源并列保存为 response evidence sidecar，便于在写回前逐项核对。",
    output: ["a0 的候写证据", "原始 meta_info 未丢弃"],
    proof: "sample_id 只负责课程关联；它既不在 HTTP body 内，也不是新写入的 upstream Sample 字段。",
    notYet: "候写证据包是教学观察工具，不是 slime 中命名为 ResponseProjection 的正式持久对象。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "writeback-gate",
    order: 5,
    title: "停在 append_response_tokens 调用之前",
    input: ["tokens", "log_probs", "text", "meta_info", "trainable=True"],
    operation: "下一行源码将这些参数交给 Sample.append_response_tokens；本章在方法真正执行前冻结观察。",
    output: ["可交接的调用参数", "未改变的 a0"],
    proof: "源码底片能看见参数交接位置；trainable=True 来自调用方代码，不来自 HTTP response。",
    notYet: "response、status、weight_versions、loss_mask 与 response_length 都必须等第六章的写回方法处理。",
    sourceRefIds: ["rollout.generate-writeback-handoff"],
  },
] as const;

export const responseEvidenceLanes: readonly ResponseEvidenceLane[] = [
  {
    id: "text-evidence",
    kind: "server-field",
    label: "人类可读文本",
    sourcePath: "output.text",
    fixtureValue: '"5"',
    projectedAs: "text argument",
    proves: "服务器返回了一段可读续写。",
    doesNotProve: "不证明 token 对齐，也不证明答案正确。源码没有在这里重新 tokenizer 文本。",
    sourceRefIds: ["rollout.generate-response-decode", "rollout.generate-writeback-handoff"],
  },
  {
    id: "token-evidence",
    kind: "decoded-evidence",
    label: "response token 身份",
    sourcePath: "output.meta_info.output_token_logprobs[*][1]",
    fixtureValue: "25",
    projectedAs: "tokens=[25]",
    proves: "固定 tuple 的第二个位置被 generate 当作 token ID。",
    doesNotProve: "token ID 依赖实际 tokenizer；25 只是明确标注的教学值，也不表达 reward。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "logprob-evidence",
    kind: "decoded-evidence",
    label: "rollout policy 概率证据",
    sourcePath: "output.meta_info.output_token_logprobs[*][0]",
    fixtureValue: "-0.356675",
    projectedAs: "log_probs=[-0.356675]",
    proves: "固定 tuple 的第一个位置被 generate 当作已选 token 的 log-prob。",
    doesNotProve: "log-prob 不是 reward，也不衡量数学答案是否正确。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "terminal-evidence",
    kind: "server-field",
    label: "终止原因",
    sourcePath: "output.meta_info.finish_reason.type",
    fixtureValue: '"stop"',
    projectedAs: "meta_info（原样交接）",
    proves: "服务器报告这次生成因 stop 条件正常结束。",
    doesNotProve: "第五章尚未把 stop 映射为 Sample.status；正常结束也不等于内容正确。",
    sourceRefIds: ["rollout.generate-writeback-handoff", "sample.apply-meta-info"],
  },
  {
    id: "version-evidence",
    kind: "server-field",
    label: "生成权重来源",
    sourcePath: "output.meta_info.weight_version",
    fixtureValue: '"actor@0"',
    projectedAs: "meta_info（原样交接）",
    proves: "教学响应声明自己由 actor@0 生成。",
    doesNotProve: "第五章尚未把它追加到 Sample.weight_versions；版本号也不代表质量。",
    sourceRefIds: ["rollout.generate-writeback-handoff", "sample.apply-meta-info"],
  },
  {
    id: "sample-association",
    kind: "caller-association",
    label: "调用方关联键",
    sourcePath: "course receipt.sample_id",
    fixtureValue: '"a0"',
    projectedAs: "把返回值与原 Sample 对上",
    proves: "课程知道这份 output 要交回哪条物理候选。",
    doesNotProve: "sample_id 不来自 HTTP JSON，也不是本步新写入的 Sample 字段。",
    sourceRefIds: ["rollout.generate-response-decode"],
  },
  {
    id: "caller-constant",
    kind: "caller-association",
    label: "调用方策略常量",
    sourcePath: "generate call site",
    fixtureValue: "trainable=True",
    projectedAs: "append_response_tokens argument",
    proves: "默认 generate 路径选择以可训练 response 交接。",
    doesNotProve: "这个布尔值不是服务器返回字段；如何形成 loss_mask 要等写回方法。",
    sourceRefIds: ["rollout.generate-writeback-handoff"],
  },
  {
    id: "deferred-sample-write",
    kind: "deferred-write",
    label: "尚未出现的 Sample 结果",
    sourcePath: "Sample.response / status / weight_versions / loss_mask",
    fixtureValue: '"" / pending / [] / None',
    projectedAs: "第六章写回后才改变",
    proves: "responses-received 观察点只新增课程 sidecar，原 Sample 仍保持请求后的状态。",
    doesNotProve: "不能把候写材料提前显示成已写入字段，更不能在本章出现 reward。",
    sourceRefIds: ["rollout.generate-writeback-handoff", "sample.append-response-tokens", "sample.apply-meta-info"],
  },
] as const;

export const responseFixtureReceipt: ResponseFixtureReceipt = {
  sampleId: "a0",
  fromObservation: "requests-prepared",
  toObservation: "responses-received",
  rawBody: {
    text: "5",
    metaInfo: {
      outputTokenLogprobs: [[-0.356675, 25]],
      finishReason: { type: "stop" },
      weightVersion: "actor@0",
    },
  },
  decoded: {
    responseTokenIds: [25],
    responseLogProbs: [-0.356675],
    text: "5",
    metaInfoKept: true,
  },
  sampleBeforeWrite: {
    tokens: [11, 12, 13, 14, 15],
    response: "",
    responseLength: 0,
    lossMask: null,
    rolloutLogProbs: null,
    weightVersions: [],
    status: "pending",
    reward: null,
  },
};

export const responseDiagnosticCases: readonly ResponseDiagnosticCase[] = [
  {
    id: "tuple-order-inverted",
    title: "把 -0.356675 当成 token ID",
    snapshot: "decoder → tokens=[-0.356675], log_probs=[25]",
    firstErrorBoundary: "tuple decoder",
    explanation: "错误最早发生在位置语义被倒置：固定源码明确以 item[1] 取 token ID、item[0] 取 log-prob。",
  },
  {
    id: "stop-means-correct",
    title: "把 stop 当成答案正确",
    snapshot: "finish_reason.type=stop → correct=true",
    firstErrorBoundary: "evidence classification",
    explanation: "stop 只解释生成为什么结束；没有 label 比较和 reward producer，就没有正确性结论。",
  },
  {
    id: "response-written-too-early",
    title: "收到响应时就显示 Sample.response=\"5\"",
    snapshot: "responses-received → Sample.response=\"5\"",
    firstErrorBoundary: "writeback boundary",
    explanation: "课程在 append_response_tokens 执行前切开观察缝隙；此时只允许 sidecar 新增，Sample 必须保持未写回状态。",
  },
] as const;

export const writebackFixture: WritebackFixture = {
  sampleId: "a0",
  fromObservation: "responses-received",
  toObservation: "responses-written",
  prefixLength: 5,
  before: {
    tokens: [11, 12, 13, 14, 15],
    response: "",
    responseLength: 0,
    lossMask: null,
    rolloutLogProbs: null,
    weightVersions: [],
    status: "pending",
    reward: null,
  },
  incoming: {
    tokens: [25],
    logProbs: [-0.356675],
    trainable: true,
    text: "5",
    metaInfo: {
      finishReason: { type: "stop" },
      weightVersion: "actor@0",
    },
  },
  after: {
    tokens: [11, 12, 13, 14, 15, 25],
    response: "5",
    responseLength: 1,
    lossMask: [1],
    rolloutLogProbs: [-0.356675],
    weightVersions: ["actor@0"],
    status: "completed",
    reward: null,
  },
};

export const writebackCalibrationSteps: readonly WritebackCalibrationStep[] = [
  {
    id: "call-entry",
    order: 1,
    title: "候写证据抵达同一个 Sample",
    sourceOperation: "sample.append_response_tokens(tokens, log_probs, trainable=True, meta_info, text)",
    reads: ["a0 的 pending Sample", "tokens=[25]", "log_probs=[-0.356675]", "text=\"5\"", "meta_info"],
    writes: [],
    proves: "第五章的课程 sidecar 已经成为方法实参；调用入口本身还没有证明任何字段修改成功。",
    doesNotProve: "实参齐全不等于写回已通过，也不等于这段 response 正确。",
    failureTiming: "no-mutation",
    sourceRefIds: ["rollout.generate-writeback-handoff"],
  },
  {
    id: "preflight",
    order: 2,
    title: "先规范化，再做真正的前置拒绝",
    sourceOperation: "_to_int_list / _to_float_list → length 与 trainable checks",
    reads: ["tokens", "log_probs", "trainable"],
    writes: [],
    proves: "本 fixture 的 1 个 token 与 1 个 log-prob 等长；trainable=True 且 log-prob 存在，因此可以继续。",
    doesNotProve: "这组检查没有覆盖 top-p、routed experts、既有 log-prob 连续性或最终 metadata 长度。",
    failureTiming: "pre-mutation",
    sourceRefIds: ["sample.append-preflight"],
  },
  {
    id: "text-append",
    order: 3,
    title: "文本轨先推进",
    sourceOperation: "self.response += text",
    reads: ["response=\"\"", "text=\"5\""],
    writes: [{ field: "response", before: "\"\"", after: "\"5\"" }],
    proves: "response 是独立累计的文本字段；固定源码在 token 写入之前直接拼接 text。",
    doesNotProve: "源码没有重新 tokenize 文本，也没有检查 text 与 token IDs 是否逐项一致。",
    failureTiming: "post-mutation",
    sourceRefIds: ["sample.append-core-coordinates"],
  },
  {
    id: "token-mask-append",
    order: 4,
    title: "完整序列与回答时钟同时走一格",
    sourceOperation: "self.tokens += tokens; response_length += len(tokens); loss_mask += trainable bits",
    reads: ["prompt prefix=[11,12,13,14,15]", "incoming token=[25]", "trainable=True"],
    writes: [
      { field: "tokens", before: "[11,12,13,14,15]", after: "[11,12,13,14,15,25]" },
      { field: "response_length", before: "0", after: "1" },
      { field: "loss_mask", before: "None", after: "[1]" },
    ],
    proves: "完整 tokens 尾部新增 R0；回答空间从空集增长到一个位置，trainable=True 使该位置的 mask 为 1。",
    doesNotProve: "append_response_tokens 只做尾部追加；它没有保存 prefix_length，也没有单独验证旧 prompt 前缀。",
    failureTiming: "post-mutation",
    sourceRefIds: ["sample.append-core-coordinates"],
  },
  {
    id: "logprob-append",
    order: 5,
    title: "概率证据对齐同一个回答位置",
    sourceOperation: "self.rollout_log_probs += log_probs",
    reads: ["previous_response_length=0", "rollout_log_probs=None", "log_probs=[-0.356675]"],
    writes: [{ field: "rollout_log_probs", before: "None", after: "[-0.356675]" }],
    proves: "R0 的 rollout log-prob 与 loss_mask[R0]、response token R0 共用回答坐标。",
    doesNotProve: "若已有 response token 却没有既有 rollout_log_probs，生产方法会在前面若干字段已经改变后才拒绝新的 trainable log-probs。",
    failureTiming: "post-mutation",
    sourceRefIds: ["sample.append-core-coordinates"],
  },
  {
    id: "terminal-meta",
    order: 6,
    title: "终止原因与权重来源盖章",
    sourceOperation: "_apply_meta_info(..., update_terminal_info=True)",
    reads: ["finish_reason.type=stop", "weight_version=actor@0"],
    writes: [
      { field: "weight_versions", before: "[]", after: "[actor@0]" },
      { field: "status", before: "pending", after: "completed" },
    ],
    proves: "在默认 terminal gate 成立时，stop 映射为 completed，存在的 weight_version 被追加。",
    doesNotProve: "completed 只描述生成正常停止；缺少 finish_reason 或 update_terminal_info=False 时，terminal bookkeeping 会被推迟。",
    failureTiming: "post-mutation",
    sourceRefIds: ["sample.apply-terminal-info"],
  },
  {
    id: "late-audit",
    order: 7,
    title: "最后才执行完整 metadata 长度审计",
    sourceOperation: "self._validate_response_metadata_lengths()",
    reads: ["response_length=1", "loss_mask=[1]", "rollout_log_probs=[-0.356675]", "可选 top-p replay"],
    writes: [],
    proves: "本 fixture 的 response-side arrays 都有 1 项，满足最终长度防线。",
    doesNotProve: "这是 late validation，不是数据库事务；失败时生产 Sample 可能已经被部分修改。",
    failureTiming: "post-mutation",
    sourceRefIds: ["sample.append-finalize", "sample.validate-response-metadata-full"],
  },
] as const;

export const writebackCoordinateRows: readonly WritebackCoordinateRow[] = [
  {
    id: "full-tokens",
    field: "tokens",
    coordinateSpace: "full-sequence",
    before: "[11,12,13,14,15]",
    incoming: "[25]",
    after: "[11,12,13,14,15,25]",
    indexRule: "tokens[prefix_length + r]；本 fixture 的 r=0 对应 tokens[5]",
    invariant: "默认调用路径以尾部追加保留 prompt prefix。",
    caveat: "prefix_length 不存于 Sample；该关系由调用约定与 fixture 验证，不是 append 方法独自校验。",
  },
  {
    id: "response-text",
    field: "response",
    coordinateSpace: "text",
    before: "\"\"",
    incoming: "\"5\"",
    after: "\"5\"",
    indexRule: "字符串累计，不使用 response token 下标",
    invariant: "text is not None 时直接拼接。",
    caveat: "源码不验证字符串字符数、token 数或 token IDs 彼此一致。",
  },
  {
    id: "response-length",
    field: "response_length",
    coordinateSpace: "response",
    before: "0",
    incoming: "+1 token",
    after: "1",
    indexRule: "回答位置 r ∈ [0, response_length)",
    invariant: "统计所有 response-side token，包括 trainable=False 的工具或环境 token。",
    caveat: "它不等于 len(tokens)，也不等于 response 字符串长度。",
  },
  {
    id: "loss-mask",
    field: "loss_mask",
    coordinateSpace: "response",
    before: "None",
    incoming: "trainable=True → [1]",
    after: "[1]",
    indexRule: "loss_mask[r] 对应回答位置 r",
    invariant: "若非 None，最终长度必须等于 response_length。",
    caveat: "无 token 时可以保持 None；trainable=False 的新位置写 0，不能概括为永远全 1。",
  },
  {
    id: "rollout-logprobs",
    field: "rollout_log_probs",
    coordinateSpace: "response",
    before: "None",
    incoming: "[-0.356675]",
    after: "[-0.356675]",
    indexRule: "rollout_log_probs[r] 对应回答位置 r",
    invariant: "若非 None，最终长度必须等于 response_length。",
    caveat: "fresh 空-token fallback 可得到 []；已有 trainable response 却缺旧 log-prob 时不能用 0 冒充历史 policy 证据。",
  },
  {
    id: "terminal-bookkeeping",
    field: "status / weight_versions",
    coordinateSpace: "terminal",
    before: "pending / []",
    incoming: "stop / actor@0",
    after: "completed / [actor@0]",
    indexRule: "由 terminal gate 处理，不与 token 下标逐项对应",
    invariant: "finish_reason gate 成立后，已识别类型更新 status，存在的 weight_version 追加。",
    caveat: "版本号不代表质量；缺 finish_reason 或禁用 terminal update 时，两者都可能不变。",
  },
  {
    id: "reward-outside",
    field: "reward",
    coordinateSpace: "outside-course",
    before: "None",
    incoming: "—",
    after: "None",
    indexRule: "下一门 Reward 机制课才解释 producer",
    invariant: "generate 写回不计算答案正确性。",
    caveat: "completed 与 reward 是不同生产者、不同时间点的状态。",
  },
] as const;

export const writebackTerminalCases: readonly WritebackTerminalCase[] = [
  {
    id: "stop",
    incoming: "finish_reason.type=stop + weight_version=actor@0",
    statusAfter: "completed",
    weightVersionAfter: "追加 actor@0",
    reason: "主路径 gate 成立；stop 表示正常停止，不表示回答正确。",
  },
  {
    id: "length",
    incoming: "finish_reason.type=length + weight_version=actor@3",
    statusAfter: "truncated",
    weightVersionAfter: "追加 actor@3",
    reason: "达到生成长度边界，仍记录实际生成权重来源。",
  },
  {
    id: "abort",
    incoming: "finish_reason.type=abort，无 weight_version",
    statusAfter: "aborted",
    weightVersionAfter: "保持原列表",
    reason: "终止类型改变 status；版本键不存在时不能伪造来源。",
  },
  {
    id: "deferred",
    incoming: "缺 finish_reason，或 update_terminal_info=False",
    statusAfter: "保持原 status",
    weightVersionAfter: "即使键存在也暂不追加",
    reason: "固定源码在 terminal gate 处提前 return，bookkeeping 被推迟。",
  },
  {
    id: "unknown",
    incoming: "finish_reason.type=未知值",
    statusAfter: "保持原 status",
    weightVersionAfter: "键存在时已可能追加",
    reason: "match 没有 default 报错；不能把未知类型擅自映射成 completed。",
  },
] as const;

export const writebackFailureBoundaries: readonly WritebackFailureBoundary[] = [
  {
    id: "length-mismatch",
    title: "2 个 token 只有 1 个 log-prob",
    condition: "len(log_probs) != len(tokens)",
    boundary: "preflight",
    sampleMutation: "没有字段改变",
    explanation: "生产方法在 response 文本与 token 追加之前拒绝数组长度不等。",
    sourceRefIds: ["sample.append-preflight"],
  },
  {
    id: "missing-trainable-logprobs",
    title: "trainable token 没有 policy 概率证据",
    condition: "tokens 非空、trainable=True、log_probs=None",
    boundary: "preflight",
    sampleMutation: "没有字段改变",
    explanation: "可训练 token 不能在缺少 rollout log-prob 时进入主写回。",
    sourceRefIds: ["sample.append-preflight"],
  },
  {
    id: "missing-history",
    title: "已有 response，却缺少既有 rollout_log_probs",
    condition: "previous_response_length>0、rollout_log_probs=None，再追加 trainable log-probs",
    boundary: "late-validation",
    sampleMutation: "response、tokens、response_length、loss_mask 可能已经改变",
    explanation: "连续性检查位于核心 mutation 之后；固定源码不承诺自动回滚这些原地修改。",
    sourceRefIds: ["sample.append-core-coordinates"],
  },
  {
    id: "top-p-offsets",
    title: "top-p offsets 与 response_length 对不上",
    condition: "offsets 数量不等于 response_length+1，或末 offset 不等于扁平 token IDs 数",
    boundary: "late-validation",
    sampleMutation: "核心 response 字段和 terminal metadata 可能已经改变",
    explanation: "最终 validator 在方法末尾运行；它是错误探测器，不是事务撤销器。",
    sourceRefIds: ["sample.validate-response-metadata-full"],
  },
  {
    id: "teaching-copy-on-write",
    title: "课程 trace 如何避免展示半成品",
    condition: "课程 reducer 先构造完整 next Sample，并在四条记录全部成功后替换 map",
    boundary: "course-reducer",
    sampleMutation: "失败时课程 previous state 保持不变",
    explanation: "这是本站确定性教学模型的 copy-on-write 保证；它帮助观察边界，但不能倒推生产方法具有事务语义。",
    sourceRefIds: ["sample.append-response-tokens", "sample.validate-response-metadata-full"],
  },
] as const;

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
  id: "stg.chapter-5-response-decoder-v2",
  kind: "field-entry",
  title: "迁移解码：两枚 token，仍停在写回门外",
  prompt: "新响应为 text=\"57\"、output_token_logprobs=[[-0.2,25],[-1.1,27]]、finish_reason.type=\"length\"、weight_version=\"actor@3\"。请重建候写证据，并保持 Sample 的微观观察状态。",
  instruction: "数组用英文逗号分隔；空字符串可填写 \"\"；None 按字面填写。不要把 length 提前映射进 Sample.status。",
  fields: [
    { id: "response-tokens", label: "new_response_tokens", placeholder: "25,27", acceptedAnswers: ["25,27", "25, 27", "[25,27]", "[25, 27]"] },
    { id: "response-logprobs", label: "new_response_log_probs", placeholder: "-0.2,-1.1", acceptedAnswers: ["-0.2,-1.1", "-0.2, -1.1", "[-0.2,-1.1]", "[-0.2, -1.1]"] },
    { id: "sample-response", label: "本章观察点的 Sample.response", placeholder: '""', acceptedAnswers: ['""', "''", "空字符串"] },
    { id: "sample-status", label: "本章观察点的 Sample.status", placeholder: "pending", acceptedAnswers: ["pending"] },
    { id: "sample-reward", label: "本章观察点的 Sample.reward", placeholder: "None", acceptedAnswers: ["None", "null"] },
  ],
  sourceRefIds: ["rollout.generate-response-decode", "rollout.generate-writeback-handoff"],
  feedback: {
    correct: "证据包已经重建，观察边界也守住了：tuple 可以解码，meta_info 可以交接，但原 Sample 仍未被写回。",
    incorrect: "先逐 tuple 读取 item[1] 与 item[0]；再把观察点钉在 append_response_tokens 调用之前，此时 response、status 与 reward 都不能越界。",
  },
} as const satisfies StructuredExercise;

const chapterSixExercise = {
  id: "stg.chapter-6-writeback-contract-v2",
  kind: "mapping",
  title: "坐标归档：每个字段在哪本账上",
  prompt: "把写回后的字段映射到它真正使用的坐标或职责。这里不是按字段类型猜测，而是按固定源码的更新规则归档。",
  instruction: "每项选择一个最精确的坐标空间；同一个目标可以被多次使用。",
  items: [
    { id: "tokens", label: "Sample.tokens" },
    { id: "response", label: "Sample.response" },
    { id: "response-length", label: "Sample.response_length" },
    { id: "loss-mask", label: "Sample.loss_mask" },
    { id: "rollout-logprobs", label: "Sample.rollout_log_probs" },
    { id: "terminal", label: "Sample.status / weight_versions" },
    { id: "reward", label: "Sample.reward" },
  ],
  targets: [
    { id: "full-sequence", label: "完整序列坐标：prompt prefix + response suffix" },
    { id: "text-stream", label: "独立文本累计：源码不与 token 数互证" },
    { id: "response-counter", label: "回答计数：定义 response position 的范围" },
    { id: "response-space", label: "回答坐标：每个 response position 一项" },
    { id: "terminal-meta", label: "terminal bookkeeping：终止原因与生成版本" },
    { id: "later-producer", label: "本课边界外：等待 reward producer" },
  ],
  correctMapping: {
    tokens: "full-sequence",
    response: "text-stream",
    "response-length": "response-counter",
    "loss-mask": "response-space",
    "rollout-logprobs": "response-space",
    terminal: "terminal-meta",
    reward: "later-producer",
  },
  sourceRefIds: [
    "sample.append-core-coordinates",
    "sample.apply-terminal-info",
    "sample.validate-response-metadata-full",
  ],
  feedback: {
    correct: "两只时钟已经对齐：tokens 维护完整序列；mask 与 log-prob 维护回答位置；文本、terminal metadata 与 reward 各有独立职责。",
    incorrect: "先找唯一的计数基准：response_length 定义回答位置；再问字段是否逐 response token 对齐。response 字符串、terminal metadata 与 reward 都不在这条数组坐标上。",
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
    title: "响应分轨场",
    shortTitle: "响应",
    durationMinutes: 12,
    drivingQuestion: "在 output = await post(...) 之后、append_response_tokens(...) 之前，哪些事实已经成立，哪些仍未成立？",
    imageSrc: "/art/library-act-05-v1.webp",
    imageAlt: "少女站在长满植物的铁轨旁，电线与轨道向远处汇流，像一份返回信号正在分轨。",
    scopeLabel: "固定源码的微观观察缝隙 · response 已返回 · Sample 尚未写回",
    objective: "把真实 HTTP body、调用方关联、tuple 解码与写回参数分成四本账；能够判断每条证据证明什么、不证明什么。",
    conclusion: "HTTP output 可以被确定性解码成 text、response token IDs、rollout log-probs 与原始 meta_info；但这些仍只是调用方持有的候写证据，原 Sample 没有因此自动改变。",
    boundary: {
      input: ["成功 HTTP response bytes", "SGLang output.text 与 nested meta_info", "调用方仍持有的 a0"],
      output: ["response token ID 与 log-prob 两条等长轨", "保留原始 meta_info 的课程 response evidence sidecar", "明确属于 a0 的待调用参数"],
      excluded: ["任何 Sample 字段写入", "finish_reason 到 status 的映射", "loss_mask / response_length 最终验证", "reward 与正确性判断"],
    },
    stateTransition: {
      before: "a0 仍为 response=\"\"、status=pending；HTTP body 已返回 text=\"5\" 与 nested meta_info",
      operation: "_post 解析 JSON；generate 按 item[1]/item[0] 分离 tuple，并把调用方 sample_id 与响应材料并列为课程 sidecar",
      after: "response evidence={sample_id:a0, text:\"5\", response_token_ids:[25], response_log_probs:[-0.356675], meta_info:{...}}；a0 本身保持不变",
    },
    explanation: [
      {
        title: "第一层解码属于 HTTP helper",
        body: "成功响应先经过 raise_for_status、aread 与 json.loads，generate 得到的 output 已经是 Python mapping。若 body 不是 JSON，helper 还有 decoded string fallback；默认 generate 随后按 mapping 访问，所以本课主路径只讨论结构化 JSON。",
      },
      {
        title: "第二层解码属于 generate",
        body: "generate 不靠字段名猜 tuple 顺序，而是明确以 item[1] 取 token ID、item[0] 取 log-prob。真实 tuple 可能带尾随元素；课程只固定前两个被本路径读取的位置。字段缺失时源码回退为两个空数组，并不会在这几行自动宣告异常。",
      },
      {
        title: "text、token 与 log-prob 是并列证据",
        body: "text 供人类与任务逻辑阅读；token ID 标识模型实际选择的离散动作；rollout log-prob 记录生成时 policy 对该动作的概率证据。固定源码没有把 output.text 重新 tokenizer，也没有在此处验证 text 与 token IDs 是否互相一致。",
      },
      {
        title: "meta_info 可以交接，但意义不能提前兑现",
        body: "finish_reason=stop 与 weight_version=actor@0 都是可携带的生成元数据。它们要到下一章由 _apply_meta_info 解释为 Sample.status 与 weight_versions；stop 只回答为什么结束，actor@0 只回答来自哪版权重，两者都不回答内容是否正确。",
      },
    ],
    responseDecodeStages,
    responseEvidenceLanes,
    responseFixtureReceipt,
    responseDiagnosticCases,
    observationIds: ["responses-received"],
    sourceRefIds: ["http.post-json-decode", "rollout.generate-response-decode", "rollout.generate-writeback-handoff"],
    evidenceId: "evidence-response-decode",
    additionalEvidenceIds: ["evidence-http-json-decode", "evidence-response-handoff"],
    exercise: chapterFiveExercise,
    misconception: {
      belief: "服务器返回了 text=\"5\"，说明 a0.response 已经是 5，stop 也说明答案正确。",
      correction: "收到 output、整理候写证据、修改 Sample、评价答案是四条不同边界。本章只完成前两条；a0.response 仍为空，status 仍为 pending，reward 仍为 None。",
    },
    takeaway: "候写证据已经齐备；Sample 尚未改变。",
    transition: "下一章打开写回闸门：append_response_tokens 怎样消费这份证据，并维持 prompt 前缀与 response-space 数组的契约。",
    advancedAside: {
      title: "支线：缺失 output_token_logprobs 时会怎样",
      body: "固定源码在该键缺失时令 new_response_tokens=[]、new_response_log_probs=[]。这只描述默认路径的局部回退，不等于本 fixture 已具备单 token 训练证据，也不等于所有下游 metadata 检查必然通过。return_logprob=true 是请求意图，不是客户端强制响应 schema。",
    },
  },
  {
    id: "stg.chapter-6",
    number: 6,
    slug: "writeback-contract",
    title: "写回双时钟",
    shortTitle: "写回",
    durationMinutes: 15,
    drivingQuestion: "同一枚 response token，为什么在 tokens 中位于第 6 格，在 loss_mask 与 rollout_log_probs 中却位于第 1 格？",
    imageSrc: "/art/library-act-06-v1.webp",
    imageAlt: "巨大钟表与齿轮前站着一名角色；画面作为完整序列与回答坐标同步推进的章节关键帧",
    scopeLabel: "默认纯文本 generate · trainable=True · 单次 terminal writeback · 固定 commit 06ffdbe2",
    objective: "给定任意 prompt 前缀、response token、trainable 标记与 terminal meta_info，重建写回后的两个坐标空间，并判断错误是在原地修改前还是修改后才被发现。",
    conclusion: "a0 写回后，完整 tokens 从 5 格增至 6 格；response_length、loss_mask 与 rollout_log_probs 只在回答坐标中各占 1 格。文本、terminal metadata 与 reward 另有独立职责。",
    boundary: {
      input: [
        "已保存 prompt tokens 的 pending Sample a0",
        "第五章解码出的 tokens=[25]、log_probs=[-0.356675] 与 text=\"5\"",
        "调用方常量 trainable=True，以及 stop / actor@0 的 meta_info",
      ],
      output: [
        "尾部追加 response 的完整 token 序列",
        "以 response_length 为基准的 loss_mask 与 rollout_log_probs",
        "terminal gate 处理后的 completed 与 weight_versions=[actor@0]",
      ],
      excluded: [
        "reward、label 比较与答案正确性",
        "collect、训练数据转换与 optimizer step",
        "把课程 copy-on-write reducer 冒充为生产方法的事务保证",
      ],
    },
    stateTransition: {
      before: "a0.tokens=[11,12,13,14,15]；response_length=0；loss_mask/rollout_log_probs=None；status=pending；reward=None",
      operation: "规范化并前置校验 token/log-prob 数组；按源码顺序写 text、tokens/mask、log-probs、terminal meta；最后执行 response metadata 长度审计",
      after: "tokens=[11,12,13,14,15,25]；response_length=1；loss_mask=[1]；rollout_log_probs=[-0.356675]；status=completed；reward=None",
    },
    explanation: [
      {
        title: "两套坐标共享一枚 response token",
        body: "本 fixture 的 response position r=0 对应 tokens[prefix_length+r]=tokens[5]，同时对应 loss_mask[0] 与 rollout_log_probs[0]。tokens 记录完整序列；另外两条数组只记录回答位置。",
      },
      {
        title: "生产写回是原地 mutation，不是事务",
        body: "token/log-prob 长度等局部错误会在 mutation 前被拒绝；但 log-prob 连续性、top-p/routed-experts 与最终长度错误可能在 response、tokens 或 mask 已改变后才抛出。最终 validator 负责发现错位，不负责自动回滚。",
      },
      {
        title: "课程 reducer 另有 copy-on-write 保护",
        body: "本站为确定性 trace 先构造完整 next Sample，并在四条记录都成功后替换 map，因此页面不会展示半发布状态。这是教学模拟的观察保证，不是对 upstream Sample API 的等价复刻。",
      },
      {
        title: "response 文本不在 token 坐标中",
        body: "固定源码先执行 self.response += text，再追加 token；它不重新 tokenizer，也不验证字符串与 token IDs 一致。因此 response 是人类可读累计值，不是 response_length 的另一种写法。",
      },
      {
        title: "terminal bookkeeping 不评价答案",
        body: "主路径中 stop→completed、length→truncated、abort→aborted；存在的 weight_version 记录生成来源。缺 finish_reason 或 update_terminal_info=False 会推迟这组更新。无论哪种 status，reward 此时仍为 None。",
      },
    ],
    writebackCalibrationSteps,
    writebackCoordinateRows,
    writebackTerminalCases,
    writebackFailureBoundaries,
    writebackFixture,
    observationIds: ["responses-written"],
    sourceRefIds: [
      "sample.append-preflight",
      "sample.append-core-coordinates",
      "sample.append-finalize",
      "sample.apply-terminal-info",
      "sample.validate-response-metadata-full",
      "sample.validate-top-p-tail",
    ],
    evidenceId: "evidence-writeback-length-defense",
    additionalEvidenceIds: [],
    exercise: chapterSixExercise,
    misconception: {
      belief: "append_response_tokens 要么整体成功、要么自动回滚；写回后 len(tokens) 也应等于 response_length。",
      correction: "生产方法原地修改 self，只有部分 preflight 错误保证发生在 mutation 前；tokens 与 response_length 又属于两套坐标。课程 reducer 的 copy-on-write 只是本站观察模型的额外保护。",
    },
    takeaway: "写回可信，不是因为字段都变了，而是每个字段在自己的坐标与失败时机里都能被解释。",
    transition: "六章到这里闭合：终测不再给熟悉的 a0，而会让你在一条新 trace 中找到最早被破坏的边界。",
    advancedAside: {
      title: "进阶支线：non-trainable token、top-p replay 与 routed experts 不共用一套坐标",
      body: "trainable=False 的 response-side token 仍增加 response_length，但 loss_mask 写 0，log-prob 自动补 0.0。top-p replay 用 response_length+1 个 offsets 表示每个回答位置的 ragged nucleus；routed experts 则按完整 token 序列的 next-token transition rows 校验。它们都经过 _apply_meta_info，却不能被笼统称为同一种 response-space 数组。",
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
    lessonRevision: 8,
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
