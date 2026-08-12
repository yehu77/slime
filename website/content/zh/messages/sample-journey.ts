/**
 * `math-2x2-v1` 的 zh-CN 文案覆盖层。
 *
 * fixture 只保存稳定 ID、数值、patch 和 copy key；这里保存所有中文 prompt、
 * notice、narration 与 transcript。缺失 key 应由 runtime materializer 直接报错。
 */
export const sampleJourneyMessages: Record<string, string> = {
  "sample-journey.notice.teaching-values":
    "教学 fixture：字段形状与变化遵循固定源码基线；token ID、session ID 和时间长度是为了稳定讲解而固定的值，不是 tokenizer 实测结果或性能 benchmark。",
  "sample-journey.prompt.a": "3 + 2 = ? 只输出整数。",
  "sample-journey.prompt.b": "4 + 3 = ? 只输出整数。",

  "sample-journey.event.ready.title": "出生：一行数据有了框架内的形状",
  "sample-journey.event.ready.narration":
    "Dataset 把外部的一行记录整理成 `Sample`。题目已经留下，回答与评价仍是一片空白。",
  "sample-journey.event.ready.transcript":
    "输入行提供 `text`、`label` 和 `metadata`，Dataset 用它们构造初始 `Sample`。此时 `tokens=[]`、`response=\"\"`、`reward=None`、`loss_mask=None`，状态是 `PENDING`。它已经能在 rollout 流程里继续传递，却还不是 trainer 可直接消费的 batch。",

  "sample-journey.event.group_built.title": "分组：给同一道题安排两个回答席位",
  "sample-journey.event.group_built.narration":
    "`3 + 2 = ?` 没有被改写，只是成为 a0 与 a1 两次独立尝试：它们同属 group 0，却各有自己的 index。",
  "sample-journey.event.group_built.transcript":
    "本课一次取 2 道 prompt，每道题安排 2 个候选，因此形成两组、四条物理 Sample。a0/a1 的 prompt、label、metadata 内容相同，group_index 同为 0；index 分别为 0 和 1。deepcopy 使两条候选的可变字段彼此独立。普通路径此时还没有 Sample.rollout_id，response 也仍为空。",

  "sample-journey.event.request_prepared.title": "生成 1/3：a0 带着 prompt 进入 SGLang",
  "sample-journey.event.request_prepared.narration":
    "回答还没开始。生成路径先留下 session-a0，并把 `3 + 2 = ?` 准备成 5 个 prompt token。",
  "sample-journey.event.request_prepared.transcript":
    "此刻 a0.tokens 是 [11, 12, 13, 14, 15]，它们全部属于输入前缀，所以 response 仍为空、response_length 仍为 0。本教学 fixture 使用稳定的 session-a0 与 token ID 便于重放；真实值取决于请求路由、checkpoint 与 tokenizer。",

  "sample-journey.event.generating.title": "生成 2/3：回答“5”被写回 a0",
  "sample-journey.event.generating.narration":
    "SGLang 返回 token 25，也就是“5”。它被接在 5 个 prompt token 后面，同时留下 mask 1 与 log-prob -0.08。",
  "sample-journey.event.generating.transcript":
    "写回后，a0.tokens 一共有 6 项，但 response_length 只有 1：前 5 项是 prompt，最后 1 项才是 response。append_response_tokens 让 loss_mask 与 rollout_log_probs 都在 response 空间逐位置对齐。工具或环境 observation 可使用 mask 0 与占位 log-prob；本播放器只是教学回放，不宣称生产请求必然逐 token 流式返回。",

  "sample-journey.event.terminal.title": "生成 3/3：为这次回答盖上完成章",
  "sample-journey.event.terminal.narration":
    "finish reason 是 stop，因此 a0 成为 COMPLETED；actor@0 也被留下，说明这段回答由哪一版 policy 生成。",
  "sample-journey.event.terminal.transcript":
    "stop、length、abort 分别对应 COMPLETED、TRUNCATED、ABORTED。选中的 a0 在 actor@0 下生成 response 5，并以 COMPLETED 结束；后续权重更新不会改写这段历史。",

  "sample-journey.event.rewarded_collected.title": "评价与收集：判完四条回答，按两组收回",
  "sample-journey.event.rewarded_collected.narration":
    "a0/a1 得到 1/0，b0/b1 也得到 1/0；零分候选没有消失，两组仍然保持完整。",
  "sample-journey.event.rewarded_collected.transcript":
    "本教学 fixture 用正确 1、错误 0 固定四条 raw reward，不调用网络 reward service。四条 status 都保持 COMPLETED，因为 status 只描述生成怎样结束。collect 把候选数量齐全的 group 0 与 group 1 加入 rollout 结果；reward=0 不是删除指令。只有显式配置的 dynamic filter 才会在完整 group 层做 keep / drop。",

  "sample-journey.event.train_data_built.title": "交接：Sample 转成 train data",
  "sample-journey.event.train_data_built.narration":
    "converter 冻结 raw Sample 语义，显式构造 trainer 需要的派生字段。",
  "sample-journey.event.train_data_built.transcript":
    "raw reward 被保留为 raw_reward；本 fixture 关闭 std normalization，因此 rewards 展示 reward 减组均值后的组内中心化 reward。sample_indices、rollout_ids、loss_masks 和 rollout_mask_sums 都在转换边界被显式准备，不会自动写回原 Sample。",

  "sample-journey.event.scheduled.title": "排程：四个 rollout 分成两个 step",
  "sample-journey.event.scheduled.narration":
    "scheduler 按 logical rollout 守恒地构造 training step 与 microbatch。",
  "sample-journey.event.scheduled.transcript":
    "本 fixture 有 2 个 prompt group、每组 2 个同组候选，共 4 个 logical rollout。global batch size 为 2，因此得到 2 个 training step；每条记录只放置一次。",

  "sample-journey.event.trained.title": "训练：actor 参数更新",
  "sample-journey.event.trained.narration":
    "Megatron 消费 per-DP train data；有效 mask 位置参与 loss，actor 从 actor@0 训练到 actor@1。",
  "sample-journey.event.trained.transcript":
    "训练侧接收的是 converter 和 scheduler 交付的 batch，而不是 Sample dataclass。optimizer step 改变 actor 参数，但 actor@1 此时尚未发布到 SGLang；历史 Sample 仍记录 actor@0。",

  "sample-journey.event.weights_synced.title": "权重回流：发布 actor@1",
  "sample-journey.event.weights_synced.narration":
    "显式 weight sync 完成后，SGLang 才切换到新 actor 权重。",
  "sample-journey.event.weights_synced.transcript":
    "默认同步循环在训练后调用 update_weights，再进入下一轮生成。transport 可以变化，但协调、发布、等待完成这个系统边界不能被省略。同步不会回写历史 Sample。",

  "sample-journey.event.next_cycle_ready.title": "下一轮：新 Sample 使用新版本",
  "sample-journey.event.next_cycle_ready.narration":
    "闭环重新回到 DataSource；下一轮生成才会记录 actor@1。",
  "sample-journey.event.next_cycle_ready.transcript":
    "Sample 记录模型在某个 policy 版本下做了什么；train data 规定 trainer 怎样聚合它；weight sync 决定下一条 Sample 由哪个 policy 产生。异步路径可能让重叠中的下一批仍由旧版本生成，但会在发布边界等待进行中的 generation。",
};
