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

  "sample-journey.event.group_built.title": "分组：建立同组候选的身份",
  "sample-journey.event.group_built.narration":
    "每个 prompt 复制成两个同组候选：group_index 相同，index 各不相同。",
  "sample-journey.event.group_built.transcript":
    "rollout_batch_size 为 2，n_samples_per_prompt 为 2，因此形成两组、四条物理 Sample。同组候选保留相同输入内容，但通过 deepcopy 避免可变 metadata 相互 alias。普通路径此时还没有 Sample.rollout_id。",

  "sample-journey.event.request_prepared.title": "生成：准备 SGLang 请求",
  "sample-journey.event.request_prepared.narration":
    "生成侧为选中的 Sample 建立 session，并准备 prompt token 前缀。",
  "sample-journey.event.request_prepared.transcript":
    "本教学 fixture 使用稳定 session-a0 和 prompt token ID，便于重放与测试。真实 session 通常是动态生成的 UUID，真实 token ID 取决于 checkpoint 与 tokenizer。",

  "sample-journey.event.generating.title": "生成：追加 response token",
  "sample-journey.event.generating.narration":
    "模型 token 被追加到 prompt 前缀之后；mask 与 log-prob 在 response 空间逐位置对齐。",
  "sample-journey.event.generating.transcript":
    "append_response_tokens 更新 response、response_length、loss_mask 与 rollout_log_probs。模型动作位置的 mask 为 1；工具或环境观察位置可用 mask 0 与占位 log-prob 表示。播放器动画是教学回放，不宣称生产请求必然逐 token 流式返回。",

  "sample-journey.event.terminal.title": "生成：记录终止状态",
  "sample-journey.event.terminal.narration":
    "finish reason 被映射为 Sample status，并保留本次生成使用的权重版本。",
  "sample-journey.event.terminal.transcript":
    "stop、length、abort 分别对应 COMPLETED、TRUNCATED、ABORTED。选中的 a0 在 actor@0 下生成 response 5，并以 COMPLETED 结束；后续权重更新不会改写这段历史。",

  "sample-journey.event.rewarded_collected.title": "评价与收集：reward 各归其位",
  "sample-journey.event.rewarded_collected.narration":
    "四条 Sample 获得 raw reward，并以完整 group 为单位进入收集结果。",
  "sample-journey.event.rewarded_collected.transcript":
    "a0、b0 的 raw reward 为 1，a1、b1 为 0。reward 评价轨迹结果，loss_mask 选择可训练 response 位置，status 描述终止方式；三者不能互相替代。dynamic filter 的细节属于进阶路线。",

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
