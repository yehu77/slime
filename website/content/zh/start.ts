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
  eyebrow: "第一章 · 回答如何成为学习",
  title: ["一条回答，", "如何走进训练？"],
  answer: "slime 让一次次尝试被看见、被评价，并在合适的时候回到训练。",
  summary:
    "模型不会因为答对了一次题，就突然变得聪明。它需要一次次尝试，让结果被衡量，再让其中的得失参与下一次训练。slime 所做的，正是让这场循环稳定地发生。",
  loop: [
    { number: "1", title: "让模型先开口", description: "面对一批任务，模型写下自己的尝试" },
    { number: "2", title: "让回答接受判断", description: "结果被评分、比较，留下可以学习的信号" },
    { number: "3", title: "让反馈回到训练", description: "训练据此更新权重，下一轮从这里重新开始" },
  ],
  scrollCue: "接下来，跟着这条回答继续往下走",
  facts: ["先看旅程，再认术语", "无需 GPU", "首课约 25–30 分钟"],
  primaryCta: {
    label: "开始首课",
    href: "/learn/sample-journey",
  },
  imageCaption: "一条回答从诞生到参与训练，要穿过多个系统，也会在途中不断获得新的意义。",
  roleMap: {
    eyebrow: "一次回答背后的接力",
    title: "一场真正的训练循环，藏着七次接力",
    introduction:
      "不必急着记住这些名字。把它们看作一支接力队：有人准备题目，有人生成回答，有人判断得失，也有人把结果交给训练。先认清方向，术语会在旅途中逐一变得具体。",
  },
  phases: [
    {
      id: "generate",
      title: "生成",
      plainDescription: "题目被整理成记录，模型第一次为它写下回答",
      stepIds: ["overview-dataset", "overview-group", "overview-generate"],
    },
    {
      id: "evaluate",
      title: "评价与整理",
      plainDescription: "好坏被看见，零散的回答被整理成训练可读的形式",
      stepIds: ["overview-reward", "overview-convert"],
    },
    {
      id: "learn",
      title: "训练与继续",
      plainDescription: "反馈推动权重更新，新的权重版本开启下一轮任务",
      stepIds: ["overview-train", "overview-sync"],
    },
  ],
  sampleExplanation: {
    label: "旅程的主角",
    title: "接下来，我们只跟着一条记录走",
    bodyBefore:
      "在 slime 里，一条回答不会在生成之后便结束。它会带着题目、身份、token、评分与训练信号穿过整个系统。源码把这条不断变化的训练记录称作",
    codeLabel: "Sample",
    bodyAfter: "。首课会在需要时解释每一个新术语。",
  },
} as const;
