import type { LearningIntent } from "./types";

export const siteCopy = {
  name: "slime Lab",
  eyebrow: "从可运行脚本到可验证系统模型",
  headline: "从训练脚本建立 slime 的可验证系统模型。",
  summary:
    "沿一条 Sample 检查字段、身份和权重版本的变化，并用固定源码锚点验证 rollout、训练与权重发布的边界。",
  primaryCta: { label: "开始理解 slime", href: "/start" },
  lessonCta: {
    label: "查看 Sample 的状态演化",
    href: "/learn/sample-journey",
  },
  baseline: "slime v0.3.1-1-g06ffdbe2",
  audience: "适合会 Python / PyTorch、了解基础 RL 的研究者与工程师",
} as const;

export const learningIntents: LearningIntent[] = [
  {
    id: "understand-slime",
    title: "我想先理解 slime",
    description: "先建立 Dataset、rollout、训练与权重回流的完整心智模型。",
    href: "/start",
    cta: "从 90 秒闭环开始",
    availability: "m1-ready",
    recommendation: "第一次接触 slime，或已经能运行脚本但说不清数据边界时，从这里开始。",
  },
  {
    id: "first-experiment",
    title: "我想跑通第一个实验",
    description: "理解配置、数据和训练日志在一次最小实验中怎样衔接。",
    href: "/learn/sample-journey",
    cta: "先理解 Sample 闭环",
    availability: "roadmap-preview",
    recommendation: "M1 先建立运行 recipe 所依赖的数据流与系统边界；完整实验路线将在后续里程碑加入。",
  },
  {
    id: "custom-reward-agent",
    title: "我想接入自己的 reward 或 agent",
    description: "找到生成、评价、过滤和自定义 hook 的职责边界。",
    href: "/learn/sample-journey#act-4",
    cta: "先看评价与收集边界",
    availability: "roadmap-preview",
    recommendation: "M1 只讲默认闭环和扩展点位置，不在首课展开自定义实现。",
  },
  {
    id: "source-performance",
    title: "我想理解源码、性能与扩展点",
    description: "从概念进入固定 commit 的 symbol、调用边界与契约测试。",
    href: "/source",
    cta: "打开最小源码地图",
    availability: "m1-ready",
    recommendation: "源码地图当前覆盖首课闭环；性能实验和完整扩展图谱将在后续补充。",
  },
  {
    id: "correctness-stability",
    title: "我遇到了训练正确性或稳定性问题",
    description: "用字段不变量、身份边界和权重版本定位问题属于哪一侧。",
    href: "/learn/sample-journey#sample-invariants",
    cta: "先检查三个不变量",
    availability: "roadmap-preview",
    recommendation: "M1 提供最小诊断框架；故障案例库和 correctness 中心将在后续里程碑加入。",
  },
];
