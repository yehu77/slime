import type { PrerequisiteQuestion } from "./types";

export const prerequisiteCheck = {
  title: "开始前，花一分钟检查四个先修概念",
  description: "不计分、不阻断。答错只会告诉你先补哪个概念。",
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
        ready: "很好。第二幕会把这个直觉用于同组候选的独立身份。",
        review: "先记住：deepcopy 的目标是避免可变字段彼此 alias。课程会在分组阶段再次演示。",
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
        ready: "正确。第三幕会把 response_length、loss_mask 和 rollout_log_probs 放到同一坐标系。",
        review: "本课只需要一个直觉：动作的 log-prob 按 response 位置记录。",
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
        ready: "正确：4 ÷ 2 = 2。第五幕会继续区分 prompt group、逻辑 rollout 与物理记录。",
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
        review: "先不要把 reward 和 mask 合并成一个概念；首课开场会用两条相同 reward 的 Sample 对比。",
      },
      reviewLink: { label: "查看 loss mask", href: "/glossary#loss-mask" },
    },
  ] satisfies PrerequisiteQuestion[],
} as const;

export const startRouteCopy = {
  title: "先看清闭环，再决定深入哪一层",
  summary:
    "90 秒建立角色顺序，随后用 25–30 分钟跟完一条 Sample；无需 GPU，也不会连接真实训练后端。",
  reassurance: "先修自测不计分。你可以直接进入课程，并在遇到陌生词时回到术语表。",
  primaryCta: { label: "进入一条 Sample 的旅程", href: "/learn/sample-journey" },
} as const;
