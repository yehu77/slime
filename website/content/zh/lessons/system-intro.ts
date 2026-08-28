import type { StructuredExercise } from "@/core/sample-to-generation";

export type SystemIntroEvidenceKind =
  | "author-intent"
  | "pinned-source"
  | "teaching-inference";

export type SystemIntroPhaseId =
  | "orient"
  | "model"
  | "verify"
  | "practice";

export type SystemIntroUnitId =
  | "loop-boundary"
  | "stable-skeleton"
  | "backend-roles"
  | "placement-and-time"
  | "sample-probe"
  | "architecture-reconstruction";

export interface SystemIntroSourceLink {
  title: string;
  href: string;
  accessedAt: string;
}

/**
 * A claim is deliberately smaller than a paragraph. The UI may attach its
 * provenance label and boundary directly to the sentence instead of moving
 * evidence into a detached bibliography.
 */
export interface SystemIntroClaim {
  id: string;
  evidenceKind: SystemIntroEvidenceKind;
  statement: string;
  scope: string;
  canConclude: string;
  cannotConclude: string;
  sourceRefIds: readonly string[];
  sourceLinks?: readonly SystemIntroSourceLink[];
}

export interface SystemIntroArchitectureCase {
  id: string;
  title: string;
  status: "hypothetical-incident" | "pinned-source-case";
  report: readonly string[];
  question: string;
  observation: string;
  firstBoundary: string;
  cannotInfer: string;
  sourceRefIds: readonly string[];
}

export interface SystemIntroTraceStation {
  id: string;
  actNumber: number;
  title: string;
  reads: readonly string[];
  produces: readonly string[];
  passesTo: string;
  visibleInSample: readonly string[];
  outsideSample: readonly string[];
  systemMeaning: string;
  sourceRefIds: readonly string[];
}

export interface SystemIntroUnit {
  id: SystemIntroUnitId;
  order: number;
  title: string;
  shortTitle: string;
  durationMinutes: number;
  visualForm:
    | "incident-sheet"
    | "skeleton-blueprint"
    | "role-production-sheet"
    | "two-axis-board"
    | "sample-probe-film"
    | "reconstruction-dossier";
  imageSlot:
    | "system-intro-unit-01"
    | "system-intro-unit-02"
    | "system-intro-unit-03"
    | "system-intro-unit-04"
    | "library-seven-act-set"
    | "system-intro-unit-06";
  phaseLabels: Readonly<Record<SystemIntroPhaseId, string>>;
  drivingQuestion: string;
  opening: string;
  model: readonly string[];
  verificationPrompt: string;
  practicePrompt: string;
  claims: readonly SystemIntroClaim[];
  architectureCase?: SystemIntroArchitectureCase;
  traceStationIds?: readonly string[];
  transition: string;
  sourceRefIds: readonly string[];
}

export interface SystemIntroAssessment {
  id: "core.sample-journey.architecture-v3";
  version: 3;
  exercises: readonly StructuredExercise[];
  completion: {
    minCorrect: 5;
    requiredQuestionIds: readonly ["system-intro-q1", "system-intro-q4", "system-intro-q6"];
    unlimitedRetries: true;
    passedResultIsSticky: true;
  };
}

export interface SystemIntroManifest {
  id: "core.sample-journey";
  route: "/learn/sample-journey";
  locale: "zh-CN";
  title: string;
  subtitle: string;
  summary: string;
  sourceBaseline: {
    repository: "THUDM/slime";
    commit: "06ffdbe22be068b52f9ed0fc318c473f7030197e";
    shortCommit: "06ffdbe2";
  };
  lessonRevision: 8;
  assessmentVersion: 3;
  duration: {
    core: "35–45 分钟";
    research: "约 60 分钟";
  };
  prerequisites: readonly string[];
  learningObjectives: readonly string[];
  exclusions: readonly string[];
  policyVersionLine: readonly {
    id: string;
    label: string;
    version: "actor@0" | "actor@1" | "boundary";
    sourceRefIds: readonly string[];
  }[];
  units: readonly SystemIntroUnit[];
  traceStations: readonly SystemIntroTraceStation[];
  finalAssessment: SystemIntroAssessment;
  handoff: {
    title: string;
    body: string;
    route: "/learn/sample-to-generation";
    curriculumRoute: "/learn";
  };
}

const authorTalk: SystemIntroSourceLink = {
  title: "朱子霖：slime——为 RL Scaling 设计的训练框架",
  href: "https://qingkeai.online/upload/pdf/20250802.pdf",
  accessedAt: "2026-08-28",
};

const teamLaunch: SystemIntroSourceLink = {
  title: "slime Team: Introducing slime",
  href: "https://www.lmsys.org/blog/2025-07-09-slime/",
  accessedAt: "2026-08-28",
};

export const systemIntroTraceStations = [
  {
    id: "dataset-to-sample",
    actNumber: 1,
    title: "Dataset 构造初始 Sample",
    reads: ["外部 row 中的 prompt、label 与 metadata"],
    produces: ["带语义输入、尚未生成的初始 Sample"],
    passesTo: "DataSource",
    visibleInSample: ["prompt", "label", "metadata", "status=pending"],
    outsideSample: ["模型回答", "reward", "trainer tensor"],
    systemMeaning: "外部记录先进入框架协议对象，而不是直接变成训练 batch。",
    sourceRefIds: ["dataset.read-file", "dataset.construct-sample", "sample.dataclass"],
  },
  {
    id: "datasource-to-group",
    actNumber: 2,
    title: "DataSource 建立候选组",
    reads: ["初始 Sample", "n_samples_per_prompt"],
    produces: ["同源但对象独立的候选", "group_index", "index"],
    passesTo: "SGLang rollout generation path",
    visibleInSample: ["候选共享的 group_index", "每个物理 Sample 唯一的 index"],
    outsideSample: ["回答是否正确", "optimizer 状态"],
    systemMeaning: "比较关系与对象独立性必须在生成前建立。",
    sourceRefIds: ["rollout.datasource-counter-init", "rollout.datasource-get-samples"],
  },
  {
    id: "generation-to-writeback",
    actNumber: 3,
    title: "SGLang generation 写回答案证据",
    reads: ["prompt tokens", "sampling parameters", "生成请求"],
    produces: ["response", "response token 证据", "terminal status", "weight version"],
    passesTo: "Reward path",
    visibleInSample: ["response", "tokens", "rollout_log_probs", "status", "weight_versions"],
    outsideSample: ["reward 是否认可答案", "SGLang 当前完整服务状态"],
    systemMeaning: "生成正常结束与回答得到正向评价是两个不同边界。",
    sourceRefIds: [
      "rollout.generate",
      "rollout.generate-response-decode",
      "sample.append-response-tokens",
      "sample.apply-terminal-info",
    ],
  },
  {
    id: "reward-to-collect",
    actNumber: 4,
    title: "Reward 评价并收回完整 group",
    reads: ["生成后的 Sample", "任务 reward 逻辑"],
    produces: ["raw reward", "可继续处理的完整候选组"],
    passesTo: "RolloutManager conversion path",
    visibleInSample: ["reward", "同组 Sample 是否齐备"],
    outsideSample: ["Megatron 是否已经训练", "新参数是否发布"],
    systemMeaning: "评价信号先依附生成结果，随后才可能形成训练输入。",
    sourceRefIds: ["rollout.generate-and-rm", "rollout.post-process-rewards", "rollout.get-data"],
  },
  {
    id: "sample-to-train-data",
    actNumber: 5,
    title: "Sample 被消费并派生 train data",
    reads: ["完整候选组中的 Sample", "转换与排程规则"],
    produces: ["独立 train-data 表示", "DP schedule"],
    passesTo: "Megatron actor",
    visibleInSample: ["转换所消费的 rollout 证据"],
    outsideSample: ["派生训练张量", "DP schedule", "trainer batch"],
    systemMeaning: "rollout 表示与训练表示在这里显式分界；这不是继续填写 Sample。",
    sourceRefIds: [
      "rollout.convert-train-data",
      "rollout.split-train-data",
      "schedule.build-dp-schedule",
    ],
  },
  {
    id: "train-actor",
    actNumber: 6,
    title: "Megatron actor 执行训练",
    reads: ["rollout 派生的训练数据", "当前 actor 参数与 optimizer 状态"],
    produces: ["完成一次训练更新的 actor 参数"],
    passesTo: "显式 weight update",
    visibleInSample: ["生成该数据时记录的历史 policy version"],
    outsideSample: ["模型参数张量", "梯度", "optimizer state"],
    systemMeaning: "数据流抵达训练侧，但闭环还没有回到下一次生成。",
    sourceRefIds: ["actor.consume-rollout-data", "actor.train"],
  },
  {
    id: "publish-weights",
    actNumber: 7,
    title: "新权重被发布给 rollout engines",
    reads: ["训练后的 actor 参数", "rollout engine 更新通道"],
    produces: ["可供后续 generation 使用的新 rollout 权重版本"],
    passesTo: "下一轮 DataSource / generation",
    visibleInSample: ["后续 generation 写下的 weight version"],
    outsideSample: ["发布操作本身", "服务端完整参数状态", "进行中请求的调度状态"],
    systemMeaning: "optimizer step 与生成侧看见新参数是两个边界。",
    sourceRefIds: ["actor.update-weights", "test.sample-weight-version"],
  },
] satisfies readonly SystemIntroTraceStation[];

const units = [
  {
    id: "loop-boundary",
    order: 1,
    title: "一次 optimizer step 之后，系统真的前进了吗？",
    shortTitle: "循环边界",
    durationMinutes: 5,
    visualForm: "incident-sheet",
    imageSlot: "system-intro-unit-01",
    phaseLabels: { orient: "现场", model: "边界", verify: "证据", practice: "首判" },
    drivingQuestion: "训练日志已经打印 completed，为什么下一批回答仍可能来自 actor@0？",
    opening:
      "这是一份教学事故记录，而不是固定源码的真实运行输出：训练侧报告 optimizer step completed，生成侧却仍报告 actor@0。我们先不追问哪个组件坏了，只追问每条日志实际跨过了哪一道边界。",
    model: [
      "生成完成、训练参数更新完成、权重发布完成、后续请求实际使用新版本，是四件可分别观察的事。",
      "同步循环把这些边界按顺序等待；异步循环可以让部分工作重叠，但不会让边界自动消失。",
      "要证明下一批 rollout 使用 actor@1，需要把发布记录与下一批 generation 的实际 weight version 连接起来。",
    ],
    verificationPrompt:
      "在 reward written、optimizer step completed、weight update completed、next generation reports actor@1 四条记录中，分别标出它们证明的边界。",
    practicePrompt:
      "只依据现有日志写一句判断：系统已经证明了什么，还没有证明什么？",
    architectureCase: {
      id: "actor-version-split",
      title: "训练完成，生成侧仍报告 actor@0",
      status: "hypothetical-incident",
      report: [
        "12:10:03 actor trainer: optimizer step completed",
        "12:10:04 rollout server: loaded policy actor@0",
        "12:10:05 next prompt group entered generation queue",
      ],
      question: "能否据此断言下一批回答来自 actor@1？",
      observation: "训练侧已经完成一次 optimizer step；生成侧仍报告 actor@0。",
      firstBoundary: "训练参数更新与 rollout 权重可见性之间的显式 weight update。",
      cannotInfer: "不能仅凭 optimizer 日志断言后续请求已经使用 actor@1。",
      sourceRefIds: ["actor.train", "actor.update-weights", "loop.sync"],
    },
    claims: [
      {
        id: "loop-boundary.train-is-not-publish",
        evidenceKind: "pinned-source",
        statement: "固定版本把 actor training 与 rollout weight update 实现为两个显式操作。",
        scope: "只描述 THUDM/slime@06ffdbe2 的训练与发布边界。",
        canConclude: "optimizer step 完成不能单独证明 SGLang 已装载新参数。",
        cannotConclude: "不能由此推出一次发布后所有进行中请求都立即切换版本。",
        sourceRefIds: ["actor.train", "actor.update-weights", "loop.sync"],
      },
      {
        id: "loop-boundary.next-request-is-proof",
        evidenceKind: "teaching-inference",
        statement: "后续 generation 记录的 policy version，是把发布动作与实际生成联系起来的观测证据。",
        scope: "这是本站用固定版本字段和调用边界组织出的诊断方法。",
        canConclude: "可以核对某条历史 Sample 究竟由哪个 rollout 权重版本生成。",
        cannotConclude: "单条 Sample 不能证明整个服务集群在同一时刻拥有完全一致的参数状态。",
        sourceRefIds: ["actor.update-weights", "test.sample-weight-version"],
      },
    ],
    transition: "既然闭环不能缩成一次 optimizer step，下一单元就要找出这套系统里哪些边界应保持稳定。",
    sourceRefIds: ["loop.sync", "actor.train", "actor.update-weights", "test.sample-weight-version"],
  },
  {
    id: "stable-skeleton",
    order: 2,
    title: "什么必须稳定，什么应该留给任务",
    shortTitle: "稳定骨架",
    durationMinutes: 7,
    visualForm: "skeleton-blueprint",
    imageSlot: "system-intro-unit-02",
    phaseLabels: { orient: "命题", model: "骨架", verify: "来源", practice: "归类" },
    drivingQuestion: "math、code 与 agent 需要不同生成逻辑时，框架究竟应该固定什么？",
    opening:
      "如果框架把某一种 prompt、reward 或 agent 写成唯一模板，它会很快失去任务自由；如果什么边界都不固定，训练侧与生成侧又无法可靠交接。slime 的设计问题首先是找到这两者之间的骨架。",
    model: [
      "稳定骨架组织 rollout 输入、生成、评价、训练数据转换、actor 更新和权重发布的交接边界。",
      "任务策略可以替换生成函数、reward、过滤与转换逻辑，但替换必须在明确的入口和输出契约上发生。",
      "稳定不等于永不变化的 API；这里描述的是作者设计层次与固定版本可核验的装配关系。",
    ],
    verificationPrompt: "将固定交接边界与可替换任务策略分开，并为每个判断附上一条来源。",
    practicePrompt:
      "归类 generation→train-data 交接、weight update、数学 reward、浏览器 agent 和 dynamic filter；说明其中哪项最容易被误当成框架骨架。",
    claims: [
      {
        id: "skeleton.author-design",
        evidenceKind: "author-intent",
        statement: "slime 的设计先确定不宜随任务任意变化的骨架，再降低用户在边界上替换逻辑的成本。",
        scope: "作者对框架设计问题的表述，用来解释取舍，不定义某个 Python API。",
        canConclude: "可以用稳定骨架与任务策略两层组织课程。",
        cannotConclude: "不能据此断言当前 hook 永不改名，或任意自定义逻辑都天然正确。",
        sourceRefIds: ["rollout.manager-init", "rollout.generate-and-rm"],
        sourceLinks: [authorTalk, teamLaunch],
      },
      {
        id: "skeleton.pinned-assembly",
        evidenceKind: "pinned-source",
        statement: "固定版本的 RolloutManager 装配 servers、Data Source、rollout function 与可选转换钩子。",
        scope: "只证明固定版本的装配位置和可替换入口。",
        canConclude: "默认骨架与用户函数不是同一个不可分割的实现块。",
        cannotConclude: "不能从装配器推出每个 custom function 内部的行为。",
        sourceRefIds: ["rollout.manager-init", "rollout.generate-and-rm", "rollout.manager-generate"],
      },
    ],
    transition: "骨架已经出现，但还没有执行者。下一单元把训练、生成和编排拆成三个不同责任面。",
    sourceRefIds: [
      "rollout.manager-init",
      "rollout.generate-and-rm",
      "rollout.manager-generate",
      "actor.update-weights",
    ],
  },
  {
    id: "backend-roles",
    order: 3,
    title: "Megatron、SGLang 与 Ray 为什么不能画成一个方框",
    shortTitle: "三类角色",
    durationMinutes: 8,
    visualForm: "role-production-sheet",
    imageSlot: "system-intro-unit-03",
    phaseLabels: { orient: "角色", model: "分工", verify: "源码", practice: "分派" },
    drivingQuestion: "训练与生成都运行模型，为什么 slime 仍然保留两套后端和一个编排层？",
    opening:
      "统一成一个“模型对象”会让图更简单，却会抹掉三类完全不同的状态：训练参数与 optimizer、在线生成服务，以及跨 GPU 的远程执行关系。",
    model: [
      "Megatron 训练侧主要拥有参数、梯度、optimizer state 与分布式训练过程。",
      "SGLang 生成侧主要拥有在线生成请求、服务端调度与推理时参数副本。",
      "Ray 提供 placement 与远程调用能力；具体何时启动、等待或重叠仍由 slime 控制流决定。",
      "reward 与任务判断不属于三者任一后端的天然职责，而是 rollout/任务逻辑。",
    ],
    verificationPrompt:
      "分别从资源图、数据图和权重图核对三类角色；禁止用同一根箭头同时表示 Sample、远程调用和参数传输。",
    practicePrompt:
      "为 optimizer step、/generate、GPU placement、答案判定和 ray.get 等待位置分派主要责任，并解释最后两项为什么不能只写后端名称。",
    claims: [
      {
        id: "roles.keep-native-strengths",
        evidenceKind: "author-intent",
        statement: "slime 选择保留 Megatron 与 SGLang 的原生能力，再在框架边界上连接训练和生成。",
        scope: "团队对性能、可维护性与可扩展性的设计说明。",
        canConclude: "训练后端与生成后端不是一个被框架重写的最小公分母。",
        cannotConclude: "不能据此承诺任意规模、任意配置都会达到某个性能数值。",
        sourceRefIds: ["actor.train", "rollout.server-start"],
        sourceLinks: [authorTalk, teamLaunch],
      },
      {
        id: "roles.pinned-responsibilities",
        evidenceKind: "pinned-source",
        statement: "固定入口分别创建训练 actors、RolloutManager 与 SGLang servers，并由 Ray placement 和远程调用组织它们。",
        scope: "描述固定版本默认系统构造，不枚举全部可选后端。",
        canConclude: "可以分别追踪训练状态、生成服务和编排控制流。",
        cannotConclude: "不能把 Ray 简化为自动异步，也不能把 reward 归给 SGLang。",
        sourceRefIds: ["loop.sync", "ray.placement-layout", "rollout.manager-init", "rollout.server-start", "actor.train"],
      },
    ],
    transition: "角色分清以后，还要把“住在哪里”和“何时等待”拆成两条互不替代的坐标轴。",
    sourceRefIds: [
      "loop.sync",
      "ray.placement-layout",
      "rollout.manager-init",
      "rollout.server-start",
      "actor.train",
    ],
  },
  {
    id: "placement-and-time",
    order: 4,
    title: "资源放置与时间重叠是两道不同的问题",
    shortTitle: "空间与时间",
    durationMinutes: 7,
    visualForm: "two-axis-board",
    imageSlot: "system-intro-unit-04",
    phaseLabels: { orient: "坐标", model: "四格", verify: "约束", practice: "判断" },
    drivingQuestion: "训推分离是否天然异步？训推 colocated 是否天然同步？",
    opening:
      "资源轴回答训练与 rollout 使用哪些 GPU；时间轴回答 generation 与 training 在何处发起、等待或重叠。两条轴概念上独立，具体版本却可能只实现其中一部分组合。",
    model: [
      "colocated / disaggregated 描述资源是否重叠；synchronous / asynchronous 描述控制流的等待关系。",
      "Ray 提供远程异步执行能力，但实际同步关系来自调用顺序与 ray.get 的位置。",
      "二维坐标用于拆开概念，不等于固定版本支持四格中的全部运行组合。",
      "在 06ffdbe2 的 train_async.py 中，入口显式执行 assert not args.colocate，因此 colocated + asynchronous 不能被本站描述为该固定入口支持的组合。",
    ],
    verificationPrompt:
      "阅读 placement layout 与 sync/async 入口：分别圈出资源轴证据、时间轴证据和固定版本的组合限制。",
    practicePrompt:
      "给四份运行描述分别标注资源轴和时间轴；遇到 colocated + asynchronous 时必须回答“概念可描述，但固定异步入口不支持”。",
    claims: [
      {
        id: "axes.are-distinct",
        evidenceKind: "pinned-source",
        statement: "资源放置由 placement 配置决定，时间关系由远程调用与等待位置决定；二者不是同义词。",
        scope: "以固定版本的 placement、train.py 与 train_async.py 为证据。",
        canConclude: "可以分别判断一份运行描述的资源布局和时序关系。",
        cannotConclude: "不能因为概念上存在二维坐标，就断言当前入口实现全部四种组合。",
        sourceRefIds: ["ray.placement-layout", "loop.sync", "loop.async"],
      },
      {
        id: "axes.async-colocate-unsupported",
        evidenceKind: "pinned-source",
        statement: "固定版本的 train_async.py 通过 `assert not args.colocate` 排除 colocated 异步入口。",
        scope: "严格限定于 THUDM/slime@06ffdbe2 的 train_async.py。",
        canConclude: "本站的固定版本案例不得把 colocated + asynchronous 标为可运行配置。",
        cannotConclude: "不能据此断言后续版本、其他入口或其他框架永远无法实现该组合。",
        sourceRefIds: ["loop.async"],
      },
    ],
    transition: "系统地图已有骨架、角色和两条坐标轴。现在才适合用一条 Sample 去核对数据边界。",
    sourceRefIds: ["ray.placement-layout", "loop.sync", "loop.async"],
  },
  {
    id: "sample-probe",
    order: 5,
    title: "一条 Sample 能看见什么，又看不见什么",
    shortTitle: "Sample 探针",
    durationMinutes: 12,
    visualForm: "sample-probe-film",
    imageSlot: "library-seven-act-set",
    phaseLabels: { orient: "探针", model: "七站", verify: "核对", practice: "复述" },
    drivingQuestion: "Sample 能否代表整个 slime 架构？",
    opening:
      "Sample 是一枚跨越多个数据边界的观测探针：它能记录一次生成的身份、结果、评价和部分训练元数据，却看不见 GPU placement、远程等待和参数传输的全部状态。",
    model: [
      "七个观察站只回答 read、produce、pass-to，不在系统导论展开字段账本。",
      "train-data conversion 消费 Sample 并派生独立表示，不是继续给 Sample 填字段。",
      "历史 Sample 可以记录生成时的 weight version，但 weight update 本身不是普通 Sample 字段赋值。",
    ],
    verificationPrompt:
      "沿七站 trace 核对每个生产者读什么、产生什么、交给谁，并指出哪些事实必须在 Sample 之外观察。",
    practicePrompt:
      "用七句话复述闭环，每句只允许使用“读取 → 产生 → 交给”结构；随后补一句 Sample 无法证明的系统事实。",
    traceStationIds: systemIntroTraceStations.map((station) => station.id),
    claims: [
      {
        id: "probe.sample-is-partial-view",
        evidenceKind: "teaching-inference",
        statement: "Sample 适合核对数据流，但不是资源编排、控制流和权重流的总和。",
        scope: "这是本站根据固定数据路径与系统级源码建立的教学模型。",
        canConclude: "可以用同一条 trace 检查组件间的数据交接。",
        cannotConclude: "不能仅从 Sample 字段重建 GPU placement、ray.get 等待或服务端完整参数状态。",
        sourceRefIds: ["sample.dataclass", "rollout.manager-generate", "actor.train", "actor.update-weights"],
      },
      {
        id: "probe.conversion-is-boundary",
        evidenceKind: "pinned-source",
        statement: "固定版本显式把 Sample 转换并拆分为训练侧数据，而不是把原始 Sample 直接交给 trainer。",
        scope: "描述默认转换与 DP split 路径。",
        canConclude: "rollout 表示与 trainer 表示存在明确交接边界。",
        cannotConclude: "不能由默认转换推断所有 custom convert function 产生相同字段。",
        sourceRefIds: ["rollout.convert-train-data", "rollout.split-train-data", "actor.consume-rollout-data"],
      },
    ],
    transition: "trace 已经验证了系统骨架。最后一步不是背诵字段，而是用陌生证据重建边界。",
    sourceRefIds: [...new Set(systemIntroTraceStations.flatMap((station) => station.sourceRefIds))],
  },
  {
    id: "architecture-reconstruction",
    order: 6,
    title: "从事故记录重建架构边界",
    shortTitle: "架构重建",
    durationMinutes: 6,
    visualForm: "reconstruction-dossier",
    imageSlot: "system-intro-unit-06",
    phaseLabels: { orient: "案卷", model: "重建", verify: "边界", practice: "交接" },
    drivingQuestion: "面对被打乱的运行日志，怎样避免只凭组件名猜故事？",
    opening:
      "结课任务不要求把日志强行排成唯一时间线。它要求把每条记录放回数据流或权重流，并用“观察 → 首个边界 → 不能推出”说明证据限度。",
    model: [
      "观察只陈述日志直接提供的事实。",
      "首个边界定位还未被跨过的系统交接。",
      "不能推出的结论防止把训练完成、发布完成和实际生成版本合并成一件事。",
    ],
    verificationPrompt:
      "把 actor@0、optimizer step、reward 与 train-data 四条记录分别放回数据流和权重流，不强行推断源码未给出的总顺序。",
    practicePrompt:
      "完成“观察 → 首个边界 → 不能推出”的结案报告，并说明要证明下一批回答来自 actor@1 还缺少哪条证据。",
    architectureCase: {
      id: "scrambled-loop-records",
      title: "被打乱的闭环案卷",
      status: "hypothetical-incident",
      report: [
        "A. rollout server 报告仍加载 actor@0",
        "B. actor@1 的 optimizer step 已完成",
        "C. 新一批回答已经进入 reward",
        "D. train data 已从上一批 Sample 转换完成",
      ],
      question: "要证明新一批回答来自 actor@1，还缺少什么证据？",
      observation: "训练侧已更新，生成、评价和 train-data 转换也各有局部记录；rollout server 仍报告 actor@0。",
      firstBoundary: "训练参数到 rollout engine 的显式发布，以及发布后 generation 的实际版本记录。",
      cannotInfer: "不能仅凭 optimizer 完成或 reward 出现，断言相应回答由 actor@1 生成。",
      sourceRefIds: ["rollout.manager-generate", "actor.train", "actor.update-weights", "test.sample-weight-version"],
    },
    claims: [
      {
        id: "reconstruction.no-single-log",
        evidenceKind: "teaching-inference",
        statement: "诊断跨后端闭环时，应分别追踪数据流、控制流与权重流，而不是让一条日志替三条流作证。",
        scope: "本站用于阅读固定版本运行证据的诊断框架。",
        canConclude: "可以把故障定位到尚未跨过的最小交接边界。",
        cannotConclude: "没有时间戳、调用关系和版本证据时，不能虚构唯一全局时序。",
        sourceRefIds: ["loop.sync", "loop.async", "rollout.manager-generate", "actor.update-weights"],
      },
    ],
    transition: "系统地图到此完成；下一门课将放大 Dataset row 到 SGLang 写回这一段机制。",
    sourceRefIds: ["loop.sync", "loop.async", "rollout.manager-generate", "actor.train", "actor.update-weights"],
  },
] satisfies readonly SystemIntroUnit[];

export const systemIntroFinalAssessment: readonly StructuredExercise[] = [
  {
    id: "system-intro-q1",
    kind: "choice",
    multiple: true,
    title: "新权重是否真的进入下一批生成",
    prompt: "哪些证据合在一起，才能证明下一批 rollout 实际使用了 actor@1？",
    instruction: "选择所有必要证据。",
    options: [
      { id: "optimizer", label: "actor@1 的 optimizer step 已完成" },
      { id: "publish", label: "actor@1 的 weight update 已完成" },
      { id: "next-version", label: "下一批 generation 记录的 weight version 为 actor@1" },
      { id: "reward", label: "上一批 Sample 已写入 reward" },
    ],
    correctOptionIds: ["publish", "next-version"],
    sourceRefIds: ["actor.train", "actor.update-weights", "test.sample-weight-version"],
    feedback: {
      correct: "正确。发布动作与下一批实际生成版本共同跨过了证据链。",
      incorrect: "optimizer 只证明训练侧更新；还需要显式发布和下一批 generation 的版本记录。",
    },
  },
  {
    id: "system-intro-q2",
    kind: "mapping",
    title: "骨架与任务策略",
    prompt: "将每项放入稳定交接边界或可替换任务策略。",
    instruction: "逐项选择最合适的层次。",
    items: [
      { id: "train-data-handoff", label: "generation 结果必须交接为 trainer 可消费的数据" },
      { id: "weight-publication", label: "训练更新后显式发布 rollout 权重" },
      { id: "math-reward", label: "判断数学答案是否正确的 reward" },
      { id: "browser-agent", label: "agent 是否调用浏览器工具" },
    ],
    targets: [
      { id: "skeleton", label: "稳定交接边界" },
      { id: "strategy", label: "可替换任务策略" },
    ],
    correctMapping: {
      "train-data-handoff": "skeleton",
      "weight-publication": "skeleton",
      "math-reward": "strategy",
      "browser-agent": "strategy",
    },
    sourceRefIds: ["rollout.manager-init", "rollout.generate-and-rm", "actor.update-weights"],
    feedback: {
      correct: "正确。骨架固定交接问题，策略决定具体任务行为。",
      incorrect: "不要把某个任务的 reward 或 agent 模板误写成整个框架骨架。",
    },
  },
  {
    id: "system-intro-q3",
    kind: "mapping",
    title: "三类角色与边界外责任",
    prompt: "为每项工作找到主要责任位置。",
    instruction: "reward 和等待关系不是某个后端名称的天然职责。",
    items: [
      { id: "optimizer-step", label: "执行 optimizer step" },
      { id: "generate", label: "响应在线生成请求" },
      { id: "placement", label: "组织训练与 rollout 的 GPU placement" },
      { id: "judge-answer", label: "判断任务答案是否正确" },
      { id: "wait-remote", label: "决定何时 ray.get 等待远程任务" },
    ],
    targets: [
      { id: "megatron", label: "Megatron training side" },
      { id: "sglang", label: "SGLang generation side" },
      { id: "ray", label: "Ray resource primitives" },
      { id: "task", label: "task / rollout logic" },
      { id: "control", label: "slime control flow" },
    ],
    correctMapping: {
      "optimizer-step": "megatron",
      generate: "sglang",
      placement: "ray",
      "judge-answer": "task",
      "wait-remote": "control",
    },
    sourceRefIds: ["actor.train", "rollout.server-start", "ray.placement-layout", "loop.sync"],
    feedback: {
      correct: "正确。你没有把资源能力、后端状态与框架控制流混成同一责任。",
      incorrect: "重新区分“谁提供能力”和“谁在控制流中决定何时调用或等待”。",
    },
  },
  {
    id: "system-intro-q4",
    kind: "mapping",
    title: "空间轴、时间轴与固定版本约束",
    prompt: "将运行描述映射到正确判断。",
    instruction: "固定版本限制必须优先于理论四格。",
    items: [
      { id: "different-gpu", label: "训练与 rollout 使用不同 GPU pool" },
      { id: "overlap", label: "下一轮 generation 在本轮 training 结束前开始" },
      { id: "same-gpu", label: "训练与 rollout 在不同阶段复用同一组 GPU" },
      { id: "async-colocate", label: "以 06ffdbe2 的 train_async.py 启动 colocated + asynchronous" },
    ],
    targets: [
      { id: "disaggregated", label: "资源轴：disaggregated" },
      { id: "asynchronous", label: "时间轴：asynchronous" },
      { id: "colocated", label: "资源轴：colocated" },
      { id: "unsupported", label: "概念可描述，但固定异步入口不支持" },
    ],
    correctMapping: {
      "different-gpu": "disaggregated",
      overlap: "asynchronous",
      "same-gpu": "colocated",
      "async-colocate": "unsupported",
    },
    sourceRefIds: ["ray.placement-layout", "loop.sync", "loop.async"],
    feedback: {
      correct: "正确。你把两个坐标轴分开，也保留了固定版本的实现边界。",
      incorrect: "二维概念图不是支持矩阵；06ffdbe2 的 train_async.py 明确 assert not args.colocate。",
    },
  },
  {
    id: "system-intro-q5",
    kind: "mapping",
    title: "Sample 的观测能力",
    prompt: "判断哪些事实可从 Sample trace 核对，哪些必须到 Sample 之外观察。",
    instruction: "按证据载体归类。",
    items: [
      { id: "response", label: "该 Sample 的 response 与 terminal status" },
      { id: "generation-version", label: "该 Sample 生成时记录的 weight version" },
      { id: "gpu-placement", label: "训练与 rollout engines 的 GPU placement" },
      { id: "optimizer-state", label: "Megatron optimizer state 的完整内容" },
      { id: "ray-wait", label: "控制流在哪个 ray.get 上等待" },
    ],
    targets: [
      { id: "sample-visible", label: "Sample trace 可核对" },
      { id: "outside-sample", label: "必须在 Sample 之外观察" },
    ],
    correctMapping: {
      response: "sample-visible",
      "generation-version": "sample-visible",
      "gpu-placement": "outside-sample",
      "optimizer-state": "outside-sample",
      "ray-wait": "outside-sample",
    },
    sourceRefIds: ["sample.dataclass", "ray.placement-layout", "loop.async", "actor.train"],
    feedback: {
      correct: "正确。Sample 是数据探针，不是整套分布式系统的快照。",
      incorrect: "把 Sample 字段与资源、控制流、参数状态三类系统事实分开。",
    },
  },
  {
    id: "system-intro-q6",
    kind: "field-entry",
    title: "重建 actor 版本事故",
    prompt:
      "已知 optimizer 完成但 rollout server 仍报告 actor@0。用“观察 → 首个边界 → 不能推出”完成结案。",
    instruction: "填写三个证据槽；允许等价的简短技术表述。",
    fields: [
      {
        id: "observation",
        label: "观察",
        acceptedAnswers: [
          "训练侧已完成更新，生成侧仍是 actor@0",
          "optimizer 已完成但 rollout server 仍加载 actor@0",
        ],
      },
      {
        id: "boundary",
        label: "首个边界",
        acceptedAnswers: [
          "显式 weight update 与后续 generation 版本核对",
          "训练参数到 rollout engine 的权重发布边界",
        ],
      },
      {
        id: "cannot-infer",
        label: "不能推出",
        acceptedAnswers: [
          "不能推出下一批回答已经来自 actor@1",
          "不能仅凭 optimizer 日志断言后续 generation 使用 actor@1",
        ],
      },
    ],
    sourceRefIds: ["actor.train", "actor.update-weights", "test.sample-weight-version"],
    feedback: {
      correct: "结案成立：你区分了观察、发布边界和证据缺口。",
      incorrect: "不要只写组件名；先陈述直接观察，再定位发布边界，最后写出尚不能断言的版本结论。",
    },
  },
];

export const systemIntroManifest = {
  id: "core.sample-journey",
  route: "/learn/sample-journey",
  locale: "zh-CN",
  title: "为什么 slime 不是一条训练脚本",
  subtitle: "从两套系统的矛盾，到一条 Sample 的完整闭环",
  summary:
    "从训练完成但生成侧仍停留在旧 policy 的矛盾出发，区分稳定骨架、后端职责、资源与时间两条轴，再用一条 Sample trace 核对数据边界。",
  sourceBaseline: {
    repository: "THUDM/slime",
    commit: "06ffdbe22be068b52f9ed0fc318c473f7030197e",
    shortCommit: "06ffdbe2",
  },
  lessonRevision: 8,
  assessmentVersion: 3,
  duration: {
    core: "35–45 分钟",
    research: "约 60 分钟",
  },
  prerequisites: [
    "知道语言模型会根据 prompt 生成回答",
    "知道训练会依据某种信号改变模型参数",
    "能区分 Python 函数、HTTP 请求和 GPU 资源",
  ],
  learningObjectives: [
    "解释为什么在线 RL 需要生成、训练与权重发布共同形成闭环。",
    "区分 slime 的稳定交接骨架与可替换任务策略。",
    "说明 Megatron、SGLang 与 Ray 的主要职责及责任边界。",
    "分别判断资源放置与时间关系，并保留固定版本的组合限制。",
    "说明 Sample 能核对哪些数据变化、又看不见哪些系统状态。",
    "用“观察 → 首个边界 → 不能推出”诊断 actor 版本事故。",
  ],
  exclusions: [
    "GRPO/PPO 的完整数学推导",
    "Megatron TP/PP/EP/CP 参数细节",
    "SGLang scheduler、KV cache 与 router 算法",
    "自定义 agent、reward 与 dynamic filter 实现",
    "异步训练正确性证明与真实 GPU 实验",
  ],
  policyVersionLine: [
    { id: "rollout-actor-0", label: "rollout 使用 actor@0 生成", version: "actor@0", sourceRefIds: ["rollout.generate"] },
    { id: "train-boundary", label: "Megatron 完成 actor 参数更新", version: "boundary", sourceRefIds: ["actor.train"] },
    { id: "publish-boundary", label: "显式 update_weights 发布参数", version: "boundary", sourceRefIds: ["actor.update-weights"] },
    { id: "rollout-actor-1", label: "后续 rollout 可核对 actor@1", version: "actor@1", sourceRefIds: ["test.sample-weight-version"] },
  ],
  units,
  traceStations: systemIntroTraceStations,
  finalAssessment: {
    id: "core.sample-journey.architecture-v3",
    version: 3,
    exercises: systemIntroFinalAssessment,
    completion: {
      minCorrect: 5,
      requiredQuestionIds: ["system-intro-q1", "system-intro-q4", "system-intro-q6"],
      unlimitedRetries: true,
      passedResultIsSticky: true,
    },
  },
  handoff: {
    title: "下一步：放大 Sample 到 generation 的机制",
    body: "系统导论给出整张地图；下一门课只放大 Dataset row → Sample → DataSource → SGLang 请求与写回。",
    route: "/learn/sample-to-generation",
    curriculumRoute: "/learn",
  },
} satisfies SystemIntroManifest;
