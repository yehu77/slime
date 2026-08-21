import type { PrerequisiteQuestion } from "./types";

export const foundationReview = {
  title: "3 分钟课前诊断",
  description: "这是四道可选题，不计分，也不影响开始首课。答错后会先给出短解释，再带你进入对应幕次。",
  questions: [
    {
      id: "pre-1",
      concept: "Python 数据对象",
      prompt: "一个 dataclass 实例被 deepcopy 后，两个实例中的可变 metadata 应是什么关系？",
      options: [
        { id: "independent", label: "内容可以相同，但修改其中一个不应影响另一个" },
        { id: "aliased", label: "必须共享同一个 dict，才能保持一致" },
        { id: "immutable", label: "dict 会自动变成不可变对象" },
      ],
      correctOptionId: "independent",
      feedback: {
        ready: "正确。第二幕将对象独立性用于同组候选的身份构造。",
        review: "deepcopy 的目标是避免可变字段彼此 alias；可以回看第二幕的分组过程。",
      },
      reviewLink: { label: "查看同组候选", href: "/glossary#prompt-group" },
    },
    {
      id: "pre-2",
      concept: "token 与 log probability",
      prompt: "模型对 response 中每个动作 token 的 log probability，最自然与什么对齐？",
      options: [
        { id: "response", label: "response token 位置" },
        { id: "prompt", label: "只与 prompt token 位置" },
        { id: "batch", label: "只与整个 batch 一个标量" },
      ],
      correctOptionId: "response",
      feedback: {
        ready: "正确。第三幕把 response_length、loss_mask 和 rollout_log_probs 放到同一坐标系。",
        review: "关键原则是：动作的 log-prob 按 response 位置对齐；可以回看第三幕。",
      },
      reviewLink: { label: "查看 rollout log-prob", href: "/glossary#rollout-log-prob" },
    },
    {
      id: "pre-3",
      concept: "batch 与 optimizer step",
      prompt: "若一次收集 4 个逻辑 rollout，global batch size 为 2，至少需要几个 training step？",
      options: [
        { id: "one", label: "1" },
        { id: "two", label: "2" },
        { id: "four", label: "4" },
      ],
      correctOptionId: "two",
      feedback: {
        ready: "正确：4 ÷ 2 = 2。第五幕进一步区分了 prompt group、逻辑 rollout 与物理记录。",
        review: "把 global batch size 暂时理解为每个 training step 消费的逻辑 rollout 数。",
      },
      reviewLink: { label: "查看 training step", href: "/glossary#training-step" },
    },
    {
      id: "pre-4",
      concept: "rollout、reward 与训练",
      prompt: "一条 response 的 reward 很高，是否足以保证它的每个 token 都参与策略梯度？",
      options: [
        { id: "no", label: "不能，还要看 loss_mask 等训练信号" },
        { id: "yes", label: "能，高 reward 会自动打开所有 token" },
        { id: "status", label: "只由 terminal status 决定" },
      ],
      correctOptionId: "no",
      feedback: {
        ready: "正确。reward 评价结果，loss_mask 决定哪些 response 位置可训练。",
        review: "需要区分 reward 与 mask：前者评价结果，后者控制哪些位置参与训练。",
      },
      reviewLink: { label: "查看 loss mask", href: "/glossary#loss-mask" },
    },
  ] satisfies PrerequisiteQuestion[],
} as const;

export const startRouteCopy = {
  title: ["一次模型回答，", "如何转化为参数更新？"],
  answer: "slime 是用于大语言模型强化学习后训练的框架。",
  summary:
    "它把高性能训练与可定制的数据生成连接在同一条 RL 数据流中：SGLang 负责 rollout，Megatron 更新 actor；中间的 Sample 保存生成、评价与训练所需状态。",
  scrollCue: "下面只保留一张闭环总览；每个术语会在首课中按需解释",
  facts: ["核心阅读 25–30 分钟", "完整研究模式约 60 分钟", "无需 GPU", "固定源码基线"],
  primaryCta: {
    label: "开始首课",
    href: "/learn/sample-journey",
  },
  imageCaption: "同一条 Sample 在不同系统边界上获得新的字段、身份与版本信息。",
  roleMap: {
    title: "七幕，只回答一个问题：每个系统边界改变了什么？",
    introduction:
      "这是入课前唯一一张完整总览。先看每个组件接收什么、产生什么以及把结果交给谁；进入课程后，我们不再重复这张图，而是逐幕检查 Sample 的状态变化。",
  },
  phases: [
    {
      id: "generate",
      title: "生成",
      plainDescription: "构造 Sample、建立同组候选并记录模型生成",
      stepIds: ["overview-dataset", "overview-group", "overview-generate"],
    },
    {
      id: "evaluate",
      title: "评价与整理",
      plainDescription: "计算 reward，并显式转换为 trainer 所需字段",
      stepIds: ["overview-reward", "overview-convert"],
    },
    {
      id: "learn",
      title: "训练与继续",
      plainDescription: "消费 train data 更新 actor，并发布新权重版本",
      stepIds: ["overview-train", "overview-sync"],
    },
  ],
  sampleExplanation: {
    label: "核心观察对象",
    title: "全课持续跟踪同一条 Sample",
    bodyBefore:
      "在 slime 中，生成结果及其身份、token、评价与版本信息保存在统一记录中。源码将这一数据对象定义为",
    codeLabel: "Sample",
    bodyAfter: "。首课将逐一说明它在各系统边界上的字段变化。",
  },
} as const;
