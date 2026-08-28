# Stage 02 系统导论无 UI 课程脚本

> 工作标题：**为什么 slime 不是一条训练脚本**
> 副标题：**从两套系统的矛盾，到一条 Sample 的完整闭环**
> 路由沿用：`/learn/sample-journey`
> 建议时长：核心阅读 35–45 分钟；含源码与支线约 60 分钟
> 内容状态：技术审查已闭合，六单元 UI 已实现并通过本地验收
> 证据档案：[system-intro-source-dossier.md](./system-intro-source-dossier.md)

## 0. 课程契约

### 读者进入前

读者只需知道：

- 语言模型可以根据 prompt 生成回答；
- 训练会根据某种信号改变模型参数；
- Python 函数、HTTP 请求和 GPU 是不同层次的事物。

不要求读者已经理解 GRPO、Megatron 并行、Ray actor 或 SGLang 内部调度。

### 本课结束时

读者应能独立回答：

1. 为什么 RL 后训练同时需要生成系统和训练系统？
2. slime 的稳定骨架是什么，哪些部分允许用户替换？
3. Megatron、SGLang 和 Ray 分别负责什么？
4. colocated/disaggregated 与 sync/async 为什么是两组不同问题？
5. 一条 Sample 能展示哪些数据变化，又看不见哪些系统状态？
6. 为什么 optimizer step 结束后仍需要 weight update？

### 本课明确不教

- GRPO/PPO 的完整数学推导；
- Megatron 的 TP/PP/EP/CP 配置细节；
- SGLang scheduler、KV cache 或 router 算法；
- 自定义 agent/reward 的实现；
- 异步训练的正确性证明；
- 真实 GPU 实验命令。

这些内容只在本课末尾获得清楚的后续位置。

## 1. 开场：一次 optimizer step 之后，系统真的前进了吗？

**建议时长：5 分钟**

### 驱动问题

训练日志刚刚打印：

```text
optimizer step completed
```

与此同时，提供回答的 SGLang server 仍在使用更新前的 actor 参数。下一批 prompt 已经开始进入生成队列。

问题不是“训练有没有成功”，而是：**这次 RL 循环究竟推进到哪里了？**

### 正文脚本

监督学习的常见示意图会在 loss 与参数更新处结束。在线 RL 不能在那里结束，因为下一批训练数据不是预先静止在磁盘里：它要由某个 policy 先生成回答，再经过评价，最后才成为训练输入。actor 更新之后，提供下一批回答的推理系统还必须看见新参数。

于是，一次循环至少出现三条彼此相关、却不能混为一谈的事实：

1. 生成侧完成了一批回答；
2. 训练侧完成了一次参数更新；
3. 新参数已经对后续生成可见。

三者可以按顺序发生，也可能在异步系统中部分重叠。任何一条被省略，日志都可能“看起来在运行”，而系统实际停留在另一个 policy 版本或数据边界。

slime 要组织的，正是这条跨越生成、训练和权重可见性的闭环。

### 首次判断

给出以下四条日志，让读者选出能证明“下一批 rollout 已使用新权重”的最小证据：

- reward 已写入；
- optimizer step 已完成；
- weight update 已完成；
- 下一批 generation 的 weight version 与发布版本一致。

正确答案最后才显示：前三条分别证明评价、训练和发布边界；只有第四条把“发布”与“后续请求实际使用”连接起来。本课只建立这种边界意识，不在此处证明异步 in-flight 请求的完整语义。

### 证据

- 作者意图：框架的正确性与速度要求；性能、正确性与自由度三目标。
- 固定源码：`loop.sync`、`actor.train`、`actor.update-weights`。

### 过渡

既然一次 RL 更新不是单个函数，下一步就要找出这套系统中不能随任务一起随意变化的骨架。

## 2. 骨架：什么必须稳定，什么应该留给用户

**建议时长：7 分钟**

### 驱动问题

如果 math、code、tool use 和 agent 都需要不同的数据生成逻辑，框架是否应该为每一种任务规定一套完整模板？

### 正文脚本

朱子霖在框架设计演讲中把问题拆成两部分：先确定不能轻易改动的骨架，再解决人与框架如何交互。对 slime 而言，稳定骨架不是某一份 reward 函数，也不是某一种 prompt 格式，而是下面这组边界：

```text
获得 rollout 输入
    ↓
生成回答
    ↓
评价并形成可训练信号
    ↓
转换/排程为训练侧数据
    ↓
actor 参数更新
    ↓
把新参数发布给生成侧
```

具体任务可以改变如何生成、怎样评价、是否过滤、是否多轮交互；但这些变化不能让训练侧猜测输入格式，也不能让生成侧悄悄使用不明版本的参数。

这解释了 slime 为什么同时追求两件看似相反的事：骨架要少而清楚，任务逻辑要能够大幅替换。自由不是让所有代码互相知道一切，而是让自定义逻辑在明确边界上进入和退出。

### 骨架与扩展点归类

让读者把以下项目分为“骨架边界”与“任务策略”：

- generation 结果必须交接为训练可消费的数据；
- reward 判断数学答案是否正确；
- actor 更新后需要对 rollout 侧发布权重；
- agent 是否调用浏览器工具；
- 数据生成与训练如何等待彼此；
- dynamic filter 丢弃哪些 group。

反馈要指出：前述分类并非“永远不可修改的 API 列表”，而是本课用来理解作者设计的系统层次。具体 hook 与参数以目标版本源码为准。

### 证据

- 作者演讲第 6、9、13–16 页。
- 团队发布文章的 Customizability、Lightweight and Extensible 部分。
- 固定源码的 `RolloutManager`、custom rollout/reward/convert 入口。

### 过渡

骨架已经出现，但它还没有执行者。下一节回答为什么 slime 不自己重写训练和推理引擎。

## 3. 三个角色：Megatron、SGLang 与 Ray

**建议时长：8 分钟**

### 驱动问题

为什么不把训练和生成包进一个统一的“模型对象”，让课程只画一个方框？

### 正文脚本

训练和生成都执行模型计算，却在系统层面追求不同的工作状态。

- **Megatron 训练侧**关心参数、梯度、optimizer step 和分布式训练效率。
- **SGLang 生成侧**关心请求并发、token 生成、服务端调度和推理吞吐。
- **Ray 编排层**把训练 actors、rollout manager 与 SGLang engines 放到指定资源上，并让远程工作可以被启动、等待或重叠。

slime 的选择不是把两套后端抹平成一个最小公分母，而是尽量让它们保持各自的能力：参数透传、低侵入集成和 server-based generation 都服务于这个目标。框架负责将边界接起来，不替后端重新实现已经成熟的训练或推理能力。

### 三张图，而不是一张万能架构图

课程正式实现时应依据固定源码自行绘制三张不同关系图：

1. **资源图**：哪些 GPU 放训练 actors，哪些放 rollout engines；colocated 时哪些资源重叠。
2. **数据图**：prompt/Sample 如何生成、评价、转换并交给 trainer。
3. **权重图**：actor 参数如何从训练侧发布到生成侧。

图上不得用一根双向箭头同时表示数据、远程调用和参数传输。

### 小检查

逐项判断由谁主要负责：

- 执行 optimizer step；
- 响应 `/generate`；
- 分配训练与 rollout 的 GPU 位置；
- 决定某道题答案是否正确；
- 决定何时等待一个远程任务完成。

最后两项用于防止过度简化：reward 是任务/rollout 逻辑，等待位置由 slime 的控制流决定，不能全推给某个后端名称。

### 证据

- 作者演讲第 13–15 页。
- 团队发布文章 Built for Performance。
- 固定源码 `loop.sync`、`ray.placement-layout`、`rollout.manager-init`。

### 过渡

角色清楚之后，还需要把“住在哪里”和“何时等待”分开。很多初学者正是在这里把两组概念混成一组。

## 4. 两个坐标轴：资源放置与时间关系

**建议时长：7 分钟**

### 驱动问题

“训推分离”是否天然意味着“异步训练”？“训推 colocated”是否天然意味着“同步训练”？

### 正文脚本

不是。它们分别回答两个问题：

| 坐标轴 | 问题 | 两个基本端点 |
| --- | --- | --- |
| 资源放置 | 训练与生成使用哪些 GPU？ | colocated / disaggregated |
| 时间关系 | 生成与训练是否等待对方完成？ | synchronous / asynchronous |

colocated 让训练和生成共享或重叠使用资源，因此需要考虑 offload/onload 与工作阶段；disaggregated 让它们位于不同资源池。同步循环在进入下一阶段前等待当前结果；异步循环通过改变远程任务的发起和 `ray.get` 时机，让工作重叠。

“能够组合”不代表任意组合都在固定版本中同样成熟或拥有相同正确性条件。本课只建立二维坐标，不给部署建议。

### 四格判断

给出四个运行描述，让读者分别标注资源轴与时间轴。例如：

> actor 与 rollout 使用不同 GPU；rollout_id=k+1 的生成在 rollout_id=k 的训练尚未结束时已经开始。

答案应为 `disaggregated + asynchronous`，并要求读者分别指出文本中哪一部分证明两个判断。

### 证据

- 作者演讲第 15 页。
- 团队发布文章 Customizability。
- 固定源码 `loop.sync`、`loop.async` 与 `ray.placement-layout`。

### 过渡

系统地图现在已有骨架、角色和两个坐标轴。此时再跟随一条 Sample，字段变化才不会被误认成框架的全部。

## 5. 一条 Sample：用数据变化验证系统骨架

**建议时长：12–15 分钟**

### 驱动问题

当系统从生成走到权重发布时，哪些变化能在 Sample 上看到，哪些变化只能在 Sample 之外观察？

### 阅读规则

沿用现有七幕 fixture，但每幕只回答三句话：

1. 当前生产者读到什么；
2. 它产生或派生什么；
3. 下一位消费者是谁。

详细字段、源码和异常分支交给后续机制课。

### 七个观察站

#### 站 1：Dataset 构造初始 Sample

- 看得见：prompt、label、metadata 与初始状态。
- 看不见：模型回答、reward、trainer tensor。
- 系统意义：外部记录先进入统一协议对象，而不是直接进入训练。

#### 站 2：DataSource 建立候选组

- 看得见：同源候选、group relation、物理 Sample identity。
- 看不见：生成结果与答案优劣。
- 系统意义：比较关系与对象独立性必须在生成前建立。

#### 站 3：SGLang generation 写回回答证据

- 看得见：response、tokens、生成时 log-prob、terminal status、weight version 等目标版本字段。
- 看不见：reward 是否认可答案。
- 系统意义：生成完成与评价完成是两个边界。

#### 站 4：Reward 与 collect

- 看得见：raw reward；完整 group 是否收齐。
- 看不见：Megatron 已经执行训练。
- 系统意义：评价信号先依附于生成结果，随后才可能形成训练输入。

#### 站 5：Sample 被消费并派生 train data

- 看得见：独立 train-data 表示、DP schedule 与 batch 关系。
- 必须纠正：不是继续给 Sample 填几个字段，也不是把 Sample 原样发给 trainer。
- 系统意义：rollout 表示和训练表示在这里显式分界。

#### 站 6：Megatron actor 执行训练

- 看得见：训练侧消费数据并推进 optimizer step。
- Sample 看不见：模型参数张量本身的变化。
- 系统意义：数据流抵达训练侧，但闭环还没有结束。

#### 站 7：权重发布

- 看得见：训练侧显式调用 weight updater；后续 generation 可以使用新版本。
- Sample 看不见：发布操作本身不是某个普通字段赋值。
- 系统意义：optimizer step 与推理侧参数可见性是两个边界。

### 关键总结

Sample 能记录一次生成在何种身份和 policy 版本下产生了什么，也能承载部分评价与训练元数据；它不能单独展示 GPU 如何放置、远程任务是否等待、actor 参数怎样传输或 SGLang server 当前装载了什么。

所以，本课跟踪 Sample，不是因为 slime “本质上就是 Sample 生命周期”，而是因为它是一枚适合穿过数据边界的探针。

### 证据

- 现有七幕 fixed refs、fixture 与测试。
- 系统层由 `rollout.manager-generate`、`actor.train`、`actor.update-weights` 补足。

### 过渡

一条 trace 已经验证了系统骨架。最后一步不是再复述字段，而是划清读者现在能做什么，以及下一门课将放大哪一段。

## 6. 结课：重建架构，而不是背诵七个名词

**建议时长：6 分钟**

### 综合任务

给出一份被打乱的事故记录：

```text
A. rollout server 报告仍加载 actor@0
B. actor@1 的 optimizer step 已完成
C. 新一批回答已经进入 reward
D. train data 已从上一批 Sample 转换完成
```

要求读者完成三件事：

1. 把记录放回数据流和权重流，而不是强行排成唯一时间顺序；
2. 指出哪条记录说明训练完成、哪条说明生成侧仍未使用新权重；
3. 写出要证明下一批回答来自 actor@1 还缺少什么证据。

评分不接受只写组件名；必须使用“观察 → 边界 → 不能推出的结论”句式。

### 课程地图交接

读者完成本课后得到的是系统地图，不是假装掌握所有机制。后续按以下问题继续：

1. **Sample → generation**：一行输入怎样成为独立候选、请求并完成写回？
2. **generation → reward**：回答何时被评价，为什么 group 完整性重要？
3. **reward → train data**：评价结果怎样成为 trainer 可消费的表示？
4. **train data → update**：Megatron 真正消费什么并执行一次更新？
5. **weight sync**：新参数怎样被发布，异步请求如何讨论版本边界？

### 最终记忆

> slime 不是把训练、推理和用户逻辑揉成一个对象；它用一条明确骨架连接各自擅长的系统，并让可替换逻辑在边界上进入。Sample 帮助我们核对数据流，显式 weight update 让闭环真正回到下一次生成。

## 7. 现有内容迁移清单

### 保留

- `math-2x2-v1` fixture 及其“教学数据”标注；
- 七幕 observation IDs 与固定源码 anchors；
- Sample 状态抽屉，但只在第五单元启用；
- 同步/异步时间线工具，移动到第四单元；
- 权重发布与 optimizer step 的边界；
- 深入证据模式。

### 重写

- 课程标题、摘要、开场和 learning objectives；
- 90 秒总览与七幕之间的重复文案；
- Reward/collect、train data、actor train 的突然转场；
- 章末终测；
- “Sample 是唯一主角”相关措辞。

### 后移或转交后续课程

- `loss_mask=[0]` 的悬念：移到 train-data 机制课或系统导论第五单元之后的可选深挖；
- payload、tuple、response-space 数组：留给 Sample → generation；
- reward normalization：留给 generation → reward / reward → train data；
- DP schedule 计算：留给 train-data 机制课；
- async in-flight policy staleness：留给异步与正确性课程。

## 8. 技术审查清单

在把脚本写入 TypeScript 内容数据之前，必须完成：

- [x] 新增 `ray.placement-layout` 固定 ref 与 hash；
- [x] 新增 `rollout.manager-init` 固定 ref 与 hash；
- [x] 新增 `rollout.server-start` 固定 ref 与 hash；
- [x] 核对 sync/async 四格案例在 `06ffdbe2` 中的合法边界；固定异步入口以 `assert not args.colocate` 明确排除 colocated；
- [x] 确认七幕字段名仍与 `math-2x2-v1` fixture 和课程所声明的 `Sample` 投影一致；
- [x] 把作者意图、固定事实和本站推论存为不同 evidence kind，并为每条结论保留适用边界；
- [x] assessment 更新为六题、版本 `3`，lesson revision 更新为 `8`，旧系统导论进度按单课静默清理；
- [x] 在写入 TypeScript 前完成纸面脚本审读；UI 实现后又通过源码锚点、内容测试与浏览验收复核。

> 技术审查于 2026-08-28 闭合；后续若更换固定 commit，以上项目必须重新打开。
