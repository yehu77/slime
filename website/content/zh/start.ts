import type { PrerequisiteQuestion } from "./types";

export const foundationReview = {
  title: "学完后，再检查四个基础概念",
  description: "这是可选回顾，不影响课程完成状态。答错时，我们会指出适合复习的术语。",
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
        ready: "很好。第二幕把这个直觉用于同组候选的独立身份。",
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
        review: "关键直觉是：动作的 log-prob 按 response 位置记录；可以回看第三幕。",
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
        review: "不要把 reward 和 mask 合并成一个概念；课程中的 Sample 对比展示了两者的区别。",
      },
      reviewLink: { label: "查看 loss mask", href: "/glossary#loss-mask" },
    },
  ] satisfies PrerequisiteQuestion[],
} as const;

export const startRouteCopy = {
  eyebrow: "第一次认识 slime",
  title: "slime 到底是做什么的？",
  answer: "它把模型的尝试、评价与学习连成一条流水线。",
  summary:
    "slime 不是一个新模型。它是一套训练框架，负责组织“让模型回答、判断回答好不好、再用结果更新模型”这套可以反复运行的循环。",
  loop: [
    { number: "1", title: "生成回答", description: "让模型尝试完成一批任务" },
    { number: "2", title: "评价回答", description: "判断结果好不好，并整理反馈" },
    { number: "3", title: "更新模型", description: "用反馈训练模型，再开始下一轮" },
  ],
  facts: ["先懂整体", "无需 GPU", "首课约 25–30 分钟"],
  primaryCta: {
    label: "开始首课",
    href: "/learn/sample-journey",
  },
  imageCaption: "你会跟着一条训练记录，看它怎样获得回答、评分，并最终推动模型更新。",
  phases: [
    {
      id: "generate",
      title: "生成",
      plainDescription: "准备任务，并让模型产出候选回答",
      stepIds: ["overview-dataset", "overview-group", "overview-generate"],
    },
    {
      id: "evaluate",
      title: "评价与整理",
      plainDescription: "给结果打分，再把记录整理成训练能使用的批次",
      stepIds: ["overview-reward", "overview-convert"],
    },
    {
      id: "learn",
      title: "训练与继续",
      plainDescription: "更新模型，并把新版本交给下一轮生成",
      stepIds: ["overview-train", "overview-sync"],
    },
  ],
  sampleExplanation: {
    title: "这门首课只追踪一个主角：Sample",
    body: "先把 Sample 理解成“一条正在被处理的训练记录”。它起初只有题目，随后逐渐得到候选回答、评分和训练信息。课程会在需要时解释每个新术语。",
  },
} as const;
