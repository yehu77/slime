import { sampleToGenerationCourse } from "./lessons/sample-to-generation";

export type CurriculumStageId =
  | "preflight"
  | "system-intro"
  | "core-mechanisms"
  | "comprehensive-trace-check"
  | "minimal-experiments"
  | "modify-slime"
  | "async-correctness-performance";

export type CurriculumCourseId =
  | "core.sample-to-generation"
  | "core.generation-to-reward"
  | "core.reward-to-train-data"
  | "core.train-data-to-parameter-update"
  | "core.weight-sync-to-next-rollout";

export type CurriculumProgressId = CurriculumStageId | CurriculumCourseId;
export type CurriculumAvailability = "available" | "planned";
export type CurriculumLearnerStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "review_required";

export type CurriculumLearnerStatusMap = Partial<
  Record<CurriculumProgressId, CurriculumLearnerStatus>
>;

export interface CurriculumCourse {
  id: CurriculumCourseId;
  order: number;
  title: string;
  question: string;
  duration: string;
  availability: CurriculumAvailability;
  route: string | null;
  prerequisiteCourseIds: CurriculumCourseId[];
  chapterTitles?: readonly string[];
}

export interface CurriculumStage {
  id: CurriculumStageId;
  order: number;
  mark: string;
  title: string;
  shortTitle: string;
  question: string;
  outcome: string;
  duration: string;
  availability: CurriculumAvailability;
  route: string | null;
  optional?: boolean;
  prerequisiteStageIds: CurriculumStageId[];
  topics: readonly string[];
  courses?: readonly CurriculumCourse[];
}

export interface Curriculum {
  id: "slime-lab.curriculum.v1";
  title: string;
  eyebrow: string;
  summary: string;
  readingRule: string;
  prerequisitePolicy: "advisory";
  prerequisiteNotice: string;
  experimentNotice: string;
  primaryCourseId: "core.sample-to-generation";
  stages: readonly CurriculumStage[];
}

const coreMechanismCourses = [
  {
    id: "core.sample-to-generation",
    order: 1,
    title: sampleToGenerationCourse.metadata.title,
    question: "两个 Dataset origin 如何变成候选组、SGLang 请求与最终 Sample？",
    duration: `${sampleToGenerationCourse.metadata.durationMinutes.total} 分钟`,
    availability: "available",
    route: sampleToGenerationCourse.metadata.route,
    prerequisiteCourseIds: [],
    chapterTitles: sampleToGenerationCourse.chapters.map((chapter) => chapter.title),
  },
  {
    id: "core.generation-to-reward",
    order: 2,
    title: "从生成完成到评价与按组收回",
    question: "生成结果何时被评价，为什么必须等完整 group 再继续？",
    duration: "计划 75–90 分钟",
    availability: "planned",
    route: null,
    prerequisiteCourseIds: ["core.sample-to-generation"],
  },
  {
    id: "core.reward-to-train-data",
    order: 3,
    title: "从评价结果到训练数据",
    question: "逐条结果怎样变成保持 group 与 rollout 身份的训练输入？",
    duration: "计划 60–75 分钟",
    availability: "planned",
    route: null,
    prerequisiteCourseIds: ["core.generation-to-reward"],
  },
  {
    id: "core.train-data-to-parameter-update",
    order: 4,
    title: "从训练数据到一次参数更新",
    question: "转换后的数据怎样排程并被 actor 真正消费一次？",
    duration: "计划 75–90 分钟",
    availability: "planned",
    route: null,
    prerequisiteCourseIds: ["core.reward-to-train-data"],
  },
  {
    id: "core.weight-sync-to-next-rollout",
    order: 5,
    title: "从新参数到下一轮可见",
    question: "训练结束后，新权重何时才会被后续 generation 看见？",
    duration: "计划 60–75 分钟",
    availability: "planned",
    route: null,
    prerequisiteCourseIds: ["core.train-data-to-parameter-update"],
  },
] as const satisfies readonly CurriculumCourse[];

export const slimeCurriculum = {
  id: "slime-lab.curriculum.v1",
  eyebrow: "课程总路线 · 先机制，后实验",
  title: "先把一条 Sample 的机制弄通，再让实验承担验证。",
  summary:
    "七个阶段沿真实学习顺序展开：可选诊断、系统定位、五门核心机制、综合检查、最小实验、框架修改，最后进入异步与性能诊断。",
  readingRule:
    "每门机制课只追踪一个输入对象和一个明确止线。学完要能根据字段、请求和源码说明因果，而不只是记住组件名称。",
  prerequisitePolicy: "advisory",
  prerequisiteNotice:
    "所有前置都只是建议，不设置硬锁。已开放内容始终可以直接进入；如果缺少背景，再按阶段提示回补。",
  experimentNotice:
    "实验安排在机制课与综合 trace 检查之后：届时配置、日志和异常现象都有可以回查的系统边界。",
  primaryCourseId: "core.sample-to-generation",
  stages: [
    {
      id: "preflight",
      order: 1,
      mark: "OPTIONAL / 03 MIN",
      title: "可选课前诊断",
      shortTitle: "课前诊断",
      question: "哪些基础概念值得先补三分钟？",
      outcome: "用四道题定位 dataclass、token 对齐与 batch 概念；结果不计分，也不阻止继续。",
      duration: "约 3 分钟",
      availability: "available",
      route: "/start#preflight",
      optional: true,
      prerequisiteStageIds: [],
      topics: ["Python 数据对象", "token 与 log-prob", "batch 基础", "训练信号边界"],
    },
    {
      id: "system-intro",
      order: 2,
      mark: "ORIENTATION",
      title: "系统总览：一条 Sample 的七幕旅程",
      shortTitle: "系统总览",
      question: "一次回答如何穿过生成、评价、训练与权重发布？",
      outcome: "建立全局地图；知道每个组件接收什么、改变什么、交给谁。",
      duration: "25–60 分钟",
      availability: "available",
      route: "/learn/sample-journey",
      prerequisiteStageIds: ["preflight"],
      topics: ["完整闭环", "Sample 状态", "源码锚点", "同步与异步总览"],
    },
    {
      id: "core-mechanisms",
      order: 3,
      mark: "CORE / FIVE COURSES",
      title: "核心机制：沿生产链逐段弄通",
      shortTitle: "五门机制课",
      question: "从输入到下一轮权重可见，每一段到底改变了什么？",
      outcome: "完成五门有固定 fixture、源码证据、结构化练习与止线的深度课。",
      duration: "5 门 · 分段完成",
      availability: "available",
      route: null,
      prerequisiteStageIds: ["system-intro"],
      topics: ["生成写回", "评价收回", "训练数据", "参数更新", "权重发布"],
      courses: coreMechanismCourses,
    },
    {
      id: "comprehensive-trace-check",
      order: 4,
      mark: "MECHANISM CHECK",
      title: "综合机制检查：读懂并诊断一条完整 trace",
      shortTitle: "综合 trace 诊断",
      question: "边界混在一起时，能否找到第一个错误状态？",
      outcome: "独立完成跨阶段字段审计、调用排序与首错定位，再进入真实实验。",
      duration: "计划 45–60 分钟",
      availability: "planned",
      route: null,
      prerequisiteStageIds: ["core-mechanisms"],
      topics: ["跨边界 trace", "首错定位", "因果解释", "综合终测"],
    },
    {
      id: "minimal-experiments",
      order: 5,
      mark: "LAB / CONTROLLED",
      title: "最小实验：从 CPU contract 到 0.5B smoke",
      shortTitle: "最小实验",
      question: "怎样让配置、日志与机制边界逐一对应？",
      outcome: "先用 CPU contract 验证数据契约，再跑 0.5B smoke，保留可复现配置、日志和产物。",
      duration: "计划 60–90 分钟",
      availability: "planned",
      route: null,
      prerequisiteStageIds: ["comprehensive-trace-check"],
      topics: ["CPU contract", "0.5B smoke", "配置对照", "产物复核"],
    },
    {
      id: "modify-slime",
      order: 6,
      mark: "BUILD / EXTEND",
      title: "修改 slime：在明确扩展点上动手",
      shortTitle: "修改 slime",
      question: "怎样扩展框架而不破坏已有数据契约？",
      outcome: "分别完成 reward、rollout/agent 与 dynamic filter 的最小改动和契约测试。",
      duration: "计划 · 三个专题",
      availability: "planned",
      route: null,
      prerequisiteStageIds: ["minimal-experiments"],
      topics: ["reward function", "rollout / agent", "dynamic filter", "契约测试"],
    },
    {
      id: "async-correctness-performance",
      order: 7,
      mark: "DIAGNOSE / ADVANCED",
      title: "异步、正确性与性能诊断",
      shortTitle: "高级诊断",
      question: "系统并发运行后，怎样区分时间问题、正确性问题与性能问题？",
      outcome: "用版本边界、in-flight trace、守恒条件和指标定位高阶故障。",
      duration: "计划 · 持续更新",
      availability: "planned",
      route: null,
      prerequisiteStageIds: ["modify-slime"],
      topics: ["异步时间线", "正确性不变量", "版本可见性", "性能诊断"],
    },
  ],
} satisfies Curriculum;
