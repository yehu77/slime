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

  "sample-journey.event.ready.title": "构造：外部记录被映射为 Sample",
  "sample-journey.event.ready.narration":
    "Dataset 将外部记录映射为 `Sample`。语义输入已经保存，生成、评价与训练字段仍为空。",
  "sample-journey.event.ready.transcript":
    "输入行提供 `text`、`label` 和 `metadata`，Dataset 用它们构造初始 `Sample`。此时 `tokens=[]`、`response=\"\"`、`reward=None`、`loss_mask=None`，状态是 `PENDING`。它已经能在 rollout 流程里继续传递，却还不是 trainer 可直接消费的 batch。",

  "sample-journey.event.group_built.title": "分组：为同一 prompt 建立两个独立候选",
  "sample-journey.event.group_built.narration":
    "DataSource 深拷贝同一 prompt，构造 a0 与 a1。二者共享 `group_index=0`，但拥有不同 `index`。",
  "sample-journey.event.group_built.transcript":
    "本课一次取 2 道 prompt，每道题安排 2 个候选，因此形成两组、四条物理 Sample。a0/a1 的 prompt、label、metadata 内容相同，group_index 同为 0；index 分别为 0 和 1。deepcopy 使两条候选的可变字段彼此独立。普通路径此时还没有 Sample.rollout_id，response 也仍为空。",

  "sample-journey.event.request_prepared.title": "生成 1/3：为 a0 构造 SGLang 请求",
  "sample-journey.event.request_prepared.narration":
    "生成尚未开始。请求准备阶段记录 session-a0，并将 `3 + 2 = ?` 表示为 5 个 prompt token。",
  "sample-journey.event.request_prepared.transcript":
    "此刻 a0.tokens 是 [11, 12, 13, 14, 15]，它们全部属于输入前缀，所以 response 仍为空、response_length 仍为 0。本教学 fixture 使用稳定的 session-a0 与 token ID 便于重放；真实值取决于请求路由、checkpoint 与 tokenizer。",

  "sample-journey.event.generating.title": "生成 2/3：回答“5”被写回 a0",
  "sample-journey.event.generating.narration":
    "SGLang 返回 token 25，解码结果为“5”。该 token 被追加到 5 个 prompt token 后，并记录 mask 1 与 log-prob -0.08。",
  "sample-journey.event.generating.transcript":
    "写回后，a0.tokens 一共有 6 项，但 response_length 只有 1：前 5 项是 prompt，最后 1 项才是 response。append_response_tokens 让 loss_mask 与 rollout_log_probs 都在 response 空间逐位置对齐。工具或环境 observation 可使用 mask 0 与占位 log-prob；本播放器只是教学回放，不宣称生产请求必然逐 token 流式返回。",

  "sample-journey.event.terminal.title": "生成 3/3：记录终止状态与权重版本",
  "sample-journey.event.terminal.narration":
    "finish reason 为 stop，因此 a0 的状态映射为 COMPLETED；weight version 记录该 response 由 actor@0 生成。",
  "sample-journey.event.terminal.transcript":
    "stop、length、abort 分别对应 COMPLETED、TRUNCATED、ABORTED。选中的 a0 在 actor@0 下生成 response 5，并以 COMPLETED 结束；后续权重更新不会改写这段历史。",

  "sample-journey.event.rewarded_collected.title": "评价与收集：写入 reward 并保留完整 group",
  "sample-journey.event.rewarded_collected.narration":
    "a0/a1 得到 1/0，b0/b1 也得到 1/0；零分候选没有消失，两组仍然保持完整。",
  "sample-journey.event.rewarded_collected.transcript":
    "本教学 fixture 用正确 1、错误 0 固定四条 raw reward，不调用网络 reward service。四条 status 都保持 COMPLETED，因为 status 只描述生成怎样结束。collect 把候选数量齐全的 group 0 与 group 1 加入 rollout 结果；reward=0 不是删除指令。只有显式配置的 dynamic filter 才会在完整 group 层做 keep / drop。",

  "sample-journey.event.train_data_built.title": "转换 1/2：从 Sample 显式构造训练字段",
  "sample-journey.event.train_data_built.narration":
    "converter 保留原始 reward，并显式构造组内训练信号、身份字段与 mask。",
  "sample-journey.event.train_data_built.transcript":
    "四条 raw reward [1,0,1,0] 被保存为 raw_reward；两组各减去均值 0.5，得到 rewards [0.5,-0.5,0.5,-0.5]。sample_indices 与派生 rollout_ids 都是 [0,1,2,3]，四条 loss_masks 都是 [1]。这些字段由 converter 显式构造，Megatron 不会从 Sample dataclass 自动获得它们。",

  "sample-journey.event.scheduled.title": "转换 2/2：四条 rollout 构成两个 training step",
  "sample-journey.event.scheduled.narration":
    "global batch 每次包含两条 logical rollout：step 0 为 a0/a1，step 1 为 b0/b1，本例没有裁剪记录。",
  "sample-journey.event.scheduled.transcript":
    "本 fixture 没有 fan-out，所以四条 physical Sample 各自对应 rollout id 0、1、2、3。global batch size 为 2，因此 step 0 放置 a0/a1，step 1 放置 b0/b1；used_rollouts=4、trimmed_rollouts=0。rollout id 表示 logical rollout，group_index 表示组内比较集合，二者语义不同。",

  "sample-journey.event.trained.title": "训练：Megatron 消费两个 step 并得到 actor@1",
  "sample-journey.event.trained.narration":
    "Megatron 按 schedule 消费 per-DP train data；optimizer 改变了 actor，却没有改写四条历史 Sample。",
  "sample-journey.event.trained.transcript":
    "DP rank 0 依次处理 a0/a1 与 b0/b1；本例四个 response mask 都是 [1]。播放器用 actor@0 → actor@1 表示训练侧参数版本变化，不模拟真实 loss 或张量。此刻 weights_published=false，SGLang 与历史 Sample 都仍记录 actor@0。",

  "sample-journey.event.weights_synced.title": "发布 1/2：actor@1 被同步到 rollout engines",
  "sample-journey.event.weights_synced.narration":
    "update_weights 把新参数交给 rollout engines；发布完成后，SGLang 才从 actor@0 切到 actor@1。",
  "sample-journey.event.weights_synced.transcript":
    "默认同步循环在当前训练结束后显式调用 actor_model.update_weights()，再进入下一轮 generation。具体 transport 可以变化，但训练完成与生成侧发布仍是两个边界；同步只改变 rollout engine 持有的权重，不回写 a0/a1/b0/b1。",

  "sample-journey.event.next_cycle_ready.title": "发布 2/2：后续 generation 可以使用 actor@1",
  "sample-journey.event.next_cycle_ready.narration":
    "发布边界已经完成。旧 Sample 继续记录 actor@0；发布后启动的新 generation 可以使用 actor@1。",
  "sample-journey.event.next_cycle_ready.transcript":
    "Sample 记录生成时使用的 policy 版本；weight sync 决定发布后启动的 generation 可以使用哪一版。异步路径可能提前启动 rollout(i+1)，使其仍由 actor@i 生成；发布前会等待进行中的 generation，避免单次请求中途切换权重。",
};
