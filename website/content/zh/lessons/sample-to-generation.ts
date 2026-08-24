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
    boundary: "源码证明复制和编号规则；2×2 的具体数值是教学 fixture，而不是框架常量。",
  },
  {
    id: "evidence-prompt-request",
    title: "prompt IDs 与 sampling params 在请求边界汇合",
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
  id: "stg.chapter-2-gate",
  kind: "mapping",
  title: "责任边界：谁第一次写入这些字段",
  prompt: "把字段放到本课所讨论的首个负责阶段。",
  instruction: "这里问的是默认路径中的首次写入者，不是字段最后的消费者。",
  items: [
    { id: "field-prompt", label: "prompt / label / metadata" },
    { id: "field-identity", label: "group_index / index" },
    { id: "field-response", label: "response / rollout_log_probs" },
    { id: "field-reward", label: "reward" },
  ],
  targets: [
    { id: "owner-dataset", label: "Dataset" },
    { id: "owner-datasource", label: "DataSource" },
    { id: "owner-generation", label: "SGLang generation 写回" },
    { id: "owner-later", label: "本课边界之后" },
  ],
  correctMapping: {
    "field-prompt": "owner-dataset",
    "field-identity": "owner-datasource",
    "field-response": "owner-generation",
    "field-reward": "owner-later",
  },
  sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
  feedback: {
    correct: "责任划分正确。一个字段在 dataclass 中存在，并不意味着 Dataset 已经写入它。",
    incorrect: "先区分“结构允许这个字段”和“当前边界产生这个字段”。",
  },
} as const satisfies StructuredExercise;

const chapterThreeExercise = {
  id: "stg.chapter-3-gate",
  kind: "field-entry",
  title: "2×2 身份矩阵",
  prompt: "补全 a0、a1、b0、b1 的 group_index 与 index。",
  instruction: "每格输入一个十进制整数。",
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
    correct: "矩阵正确。同一 prompt 的候选共享组号，四次物理生成拥有独立 index。",
    incorrect: "沿 DataSource 的两个计数器检查：group counter 每组加一，sample counter 每个副本加一。",
  },
} as const satisfies StructuredExercise;

const chapterFourExercise = {
  id: "stg.chapter-4-gate",
  kind: "ordering",
  title: "调用顺序：请求发出之前发生什么",
  prompt: "按默认纯文本 generate 路径排列四个动作。",
  instruction: "从最早发生的动作排到最晚。",
  items: [
    { id: "prepare", label: "_prepare_prompt_ids 取得 prompt IDs" },
    { id: "payload", label: "构造包含 sampling_params 的 payload" },
    { id: "persist-prefix", label: "若 Sample.tokens 为空则保存 prompt IDs" },
    { id: "post", label: "POST /generate" },
  ],
  correctOrder: ["prepare", "payload", "persist-prefix", "post"],
  sourceRefIds: ["rollout.prepare-prompt-ids", "rollout.generate-state-init", "rollout.generate"],
  feedback: {
    correct: "顺序正确。请求出发时，Sample 已保存了与 input_ids 相同的 prompt 前缀。",
    incorrect: "对照 generate：先准备 prompt_ids，再构造 payload，再保存 tokens，最后调用 post。",
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
          { field: "train_metadata", value: "None", provenance: "dataclass 默认值", nextProducer: "训练数据转换", interpretation: "尚未进入 trainer 边界。" },
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
    title: "Sample 的字段由谁负责",
    shortTitle: "字段责任",
    durationMinutes: 12,
    drivingQuestion: "Sample 有二十多个字段，为什么初学者不该把它当成一张同时填写的表？",
    imageSrc: "/art/library-act-02-v1.webp",
    conclusion: "Sample 是跨阶段协议。理解它的关键不是背字段列表，而是知道每个字段第一次在哪个系统边界变得有意义。",
    boundary: {
      input: ["Sample dataclass 的结构与默认值", "Dataset 构造后的初始快照"],
      output: ["输入、身份、生成、评价、训练五类字段责任", "哪些空值属于当前阶段的正常状态"],
      excluded: ["具体 reward 算法", "trainer tensor 的布局", "异步权重一致性"],
    },
    stateTransition: {
      before: "看到 reward、loss_mask、weight_versions 等字段，却不知道何时读取",
      operation: "按首次写入边界划分字段，而非按 dataclass 声明顺序背诵",
      after: "能判断 prompt 已就绪，而 group_index、response、reward 仍分别等待后续组件",
    },
    explanation: [
      {
        title: "输入字段保存任务语义",
        body: "prompt、label 与 metadata 描述模型面对什么问题、任务提供什么参考，以及这条记录携带哪些上下文。它们通常由 Dataset 构造，并在后续阶段被保留而不是反复重建。",
      },
      {
        title: "身份字段建立可追踪关系",
        body: "group_index 表示比较集合，index 表示具体物理 Sample。它们在 DataSource 复制候选时写入；在此之前为 null 是正确的，因为记录还没有被放进 rollout 分组。",
      },
      {
        title: "生成字段既保存结果，也保存证据",
        body: "response 是可读文本，tokens 是 prompt 与 response 的完整 token 序列，response_length、loss_mask 与 rollout_log_probs 则只在回答空间对齐。weight_versions 和 status 记录回答来自哪个版本的权重，以及为何终止。",
      },
      {
        title: "评价与训练字段故意留到边界之外",
        body: "reward 必须观察具体 response 才能产生；train_metadata 与 trainer batch 更晚。本课截止在 generate 返回，因此任何 observation 中 reward 都必须仍为 null。",
      },
    ],
    observationIds: ["samples-constructed"],
    sourceRefIds: ["sample.dataclass", "dataset.construct-sample"],
    evidenceId: "evidence-sample-fields",
    exercise: chapterTwoExercise,
    misconception: {
      belief: "字段既然定义在 Sample 上，就应在对象构造时全部有值。",
      correction: "dataclass 定义的是跨阶段契约。空值经常是精确的阶段标记，而不是缺失数据。",
    },
    takeaway: "判断字段是否可靠，先问它的生产者是否已经运行。",
    transition: "责任表建立后，DataSource 才能安全地把两个 origin 扩展成四次独立生成。",
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
    conclusion: "DataSource 用 deepcopy 保存共同输入，用 group_index 表达比较关系，再用唯一 index 保持每次物理生成可独立追踪。",
    boundary: {
      input: ["origin-a 与 origin-b 两个初始 Sample", "n_samples_per_prompt=2 的教学配置"],
      output: ["group 0: a0/a1", "group 1: b0/b1", "四个独立 metadata 对象与唯一 index"],
      excluded: ["四条 response 会是什么", "组内 reward 如何归一化", "rollout_id 的训练语义"],
    },
    stateTransition: {
      before: "2 个未分组 seed Sample；group_index=null、index=null",
      operation: "每个 seed deepcopy 两次，先写共享 group_index，再写递增 index",
      after: "2 groups × 2 Samples；组号为 0/0/1/1，index 为 0/1/2/3",
    },
    explanation: [
      {
        title: "复制建立同条件比较",
        body: "同一 prompt 生成多个候选，才可能在后续比较它们的行为。共享 prompt 和 label 不是无意义重复，而是控制实验条件：变化来自生成，而不是输入题目。",
      },
      {
        title: "两个计数器回答两个不同问题",
        body: "group_index 回答“这条记录和谁比较”，所以 a0 与 a1 都是 0；index 回答“这是哪一次物理生成”，所以四条记录必须分别为 0、1、2、3。把两个编号合并会丢失一种关系。",
      },
      {
        title: "deepcopy 阻断可变对象别名",
        body: "若候选共享同一个 metadata 对象，a0 的后续 hook 修改会悄悄污染 a1。deepcopy 保证内容起点相同、对象身份不同，使每条生成可以独立演化。",
      },
    ],
    observationIds: ["groups-built"],
    sourceRefIds: ["rollout.datasource-get-samples"],
    evidenceId: "evidence-deepcopy-groups",
    exercise: chapterThreeExercise,
    misconception: {
      belief: "同组候选 prompt 一样，因此 a0 和 a1 可以共享同一个对象。",
      correction: "它们共享比较条件，不共享可变状态。response、log-prob、status 与后续 reward 都必须能独立变化。",
    },
    takeaway: "group_index 表示关系；index 表示身份；deepcopy 保证状态隔离。",
    transition: "四条 Sample 已经各自就位。下一章检查它们如何被翻译成四个 SGLang 请求。",
    advancedAside: {
      title: "支线：partial rollout",
      body: "partial rollout 可能让可恢复的 group 再次进入队列，但“同组关系与对象独立性分开表达”的契约仍然成立。",
    },
  },
  {
    id: "stg.chapter-4",
    number: 4,
    slug: "sample-to-request",
    title: "Sample 怎样变成 SGLang 请求",
    shortTitle: "请求",
    durationMinutes: 14,
    drivingQuestion: "SGLang 需要生成输入；为什么 label、group_index 和 reward 不应出现在 HTTP payload？",
    imageSrc: "/art/library-act-04-v1.webp",
    conclusion: "请求边界只传生成所需的 input_ids、sampling_params 与返回证据开关；Sample 的任务语义和身份留在调用方。",
    boundary: {
      input: ["pending Sample", "checkpoint tokenizer/processor", "GenerateState.sampling_params"],
      output: ["Sample.tokens 中保存的 prompt 前缀", "POST /generate 的独立 request sidecar"],
      excluded: ["label、reward、group_index、index", "真实服务器响应", "答案正确性"],
    },
    stateTransition: {
      before: "a0.tokens=[]，prompt=\"3 + 2 = ?\"，status=pending",
      operation: "准备 prompt_ids，构造 payload，将 prompt_ids 保存到 Sample.tokens，再 POST /generate",
      after: "a0.tokens=[11,12,13,14,15]；payload 只含 input_ids、sampling_params、return_logprob",
    },
    explanation: [
      {
        title: "tokenizer 属于部署模型，而非课程常量",
        body: "默认纯文本路径调用所选 checkpoint 的 tokenizer，并显式关闭额外 special tokens。教学 fixture 用 [11,12,13,14,15] 让状态变化可复算；这些数值绝不能被理解成任何真实 tokenizer 的输出。",
      },
      {
        title: "GenerateState 汇总运行参数",
        body: "temperature、top_p、top_k、max_new_tokens、stop 等参数来自运行配置。它们描述服务器如何采样，不描述这条 Sample 的 label 或分组身份。",
      },
      {
        title: "请求 sidecar 保持边界可审计",
        body: "课程把 payload 单独保存为 sidecar，而不是塞回 Sample。这让学习者能逐键验证跨网络的数据，同时保留调用方的完整 Sample。return_logprob=true 很关键，因为后续训练需要知道生成时的 token 概率证据。",
      },
      {
        title: "prompt 前缀在发请求前落入 Sample",
        body: "若 Sample.tokens 为空，generate 会在 POST 前保存 prompt_ids。服务器只返回新生成部分；没有这个前缀，写回后就无法形成 prompt+response 的完整 token 序列。",
      },
    ],
    observationIds: ["prompts-tokenized", "requests-prepared"],
    sourceRefIds: ["rollout.prepare-prompt-ids", "rollout.generate-state-init", "rollout.generate"],
    evidenceId: "evidence-prompt-request",
    exercise: chapterFourExercise,
    misconception: {
      belief: "把整个 Sample JSON 发给 SGLang 最完整，也最安全。",
      correction: "网络接口应只包含生成所需字段。label 与身份留在调用方，既避免泄漏，也使组件边界明确。",
    },
    takeaway: "payload 是生成协议，不是 Sample 的网络序列化。",
    transition: "请求已经发出。下一章先停在 HTTP response，看看它距离完整 Sample 还差什么。",
    advancedAside: {
      title: "支线：多模态与 prefix reuse",
      body: "多模态路径可以发送 image_data 与 text；已有 token 也可能被复用。本课主路径固定纯文本和空 tokens，以便只研究默认边界。",
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
    sourceRefIds: ["rollout.generate"],
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
    sourceRefIds: ["dataset.construct-sample", "rollout.datasource-get-samples", "rollout.generate", "sample.append-response-tokens"],
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
    lessonRevision: 3,
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
