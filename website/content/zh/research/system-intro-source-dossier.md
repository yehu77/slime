# Stage 02 系统导论来源档案

> 目标课程：`core.sample-journey`
> 目标路由：`/learn/sample-journey`
> 档案状态：六单元课程脚本与 UI 已据此实现，等待分支预览复核
> 审查日期：2026-08-28
> 固定源码：`THUDM/slime@06ffdbe22be068b52f9ed0fc318c473f7030197e`

## 1. 本课必须回答的问题

系统导论不再从 `Sample` 字段开始。它首先要让第一次认识 slime 的读者回答：

1. 一次 RL 后训练为什么不是单独一次 `optimizer.step()`？
2. 训练、在线生成、评价与权重可见性为什么构成一个系统问题？
3. slime 选择 Megatron、SGLang 与 Ray，分别是在保护什么？
4. colocated / disaggregated 与 synchronous / asynchronous 是两组什么维度？
5. `Sample` 在框架中为什么适合作为观察探针，却不能代表整个架构？
6. 一轮训练完成后，为什么还需要显式的 weight update 才能影响后续生成？

若正文无法让读者独立回答以上问题，就不能进入视觉精修。

## 2. 一手来源摘记

### A1. 作者演讲：框架先确定骨架，再解决人与框架的交互

来源：[朱子霖《slime：为 RL Scaling 设计的训练框架——一个 infra 视角下的 RL 框架》](https://qingkeai.online/upload/pdf/20250802.pdf)

可用于课程的作者意图：

- 第 2 页把 AI Infra / MLSys 描述为连接物理世界与数学逻辑的桥梁，并将“正确”和“快”视为这座桥的基本要求。
- 第 6 页把框架设计概括为两件事：确定不能轻易改动的骨架；解决与人交互的问题。
- 第 7–9 页区分 pre-LLM、pretraining scaling 与 RL scaling：规模化带来高昂成本和正确性压力，RL 任务的领域形态又要求更高自由度。
- 第 9 页提出三个同时存在的目标：训练和推理都高效；在大规模场景下验证正确性；为领域变化保留足够自由度。
- 第 13–15 页说明 slime 的主要选择：SGLang + Megatron、参数透传、低侵入集成、自定义数据接口、server-based engine、Ray 资源分配，以及训推一体/分离和同步/异步。
- 第 16 页把单独调试训练/推理、保存 rollout 结果等列为正确性工具；这是“为验证提供工具”的设计，不是“框架天然正确”的承诺。

不得从这份演讲推导：

- 固定 commit 中某个字段的赋值时机；
- 任意部署一定达到某个性能数值；
- 所有同步/异步配置共享完全相同的数据语义；
- 2026 年当前 `main` 与演讲时版本完全一致。

### A2. 团队发布文章：自由、性能与可维护性

来源：[slime Team, “Introducing slime”](https://www.lmsys.org/blog/2025-07-09-slime/)

可用于课程的团队说明：

- slime 将自身定位为面向 RL scaling 的 post-training framework，并强调 versatile、performant、maintainable。
- 团队反对为每种 rollout 场景规定统一应用模板；框架管理 SGLang servers，同时向数据生成逻辑暴露接口。
- Ray 用于资源管理；同一框架支持 colocated / decoupled，并利用远程执行组织同步或异步关系。
- SGLang 以 server-based 模式运行，参数尽量透传；Megatron 承担训练并同样保留原生能力。
- weight update 是训练侧与推理侧之间的显式桥梁，不应被隐藏成“训练完成后自然生效”。

需要保留的限定：

- 发布文章描述产品设计与当时能力；课程中具体调用顺序仍以固定 commit 为准。
- “fast”“native”“lightweight”是设计目标或产品判断，不可改写成本站自行测得的 benchmark。
- 文章中的路线图不能当作当前已实现功能清单。

### A3. 当前官方文档：用于术语和后来演化，不倒灌历史实现

来源：

- [Usage Guide](https://thudm.github.io/slime/get_started/usage.html)
- [Quick Start](https://thudm.github.io/slime/get_started/quick_start.html)

可用于课程的当前解释：

- 当前文档仍将集群资源分为 actor training 与 rollout inference，并由 Ray 组织默认分离或 colocated 资源。
- 当前文档将 SGLang 描述为经 `HttpServerEngineAdapter` 使用的 server-based engine，并由 router 管理服务端点。
- Quick Start 把一次过程概括为 Data Sampling → Weight Update，并明确区分 optimizer step 与训练引擎发起的 weight sync。

版本处理：

- 文档在本档案审查时已晚于 `06ffdbe2`；router、多模型、外部 engine 等当前能力不进入固定版本导论主线。
- 当前术语与固定源码冲突时，课程使用固定版本事实，并在研究附录说明现状。

## 3. 专家导读摘记

来源：[赵晨阳《A Brief Code Walkthrough of slime》](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial/blob/main/rlhf/slime/code-walk-through/readme.md)

最值得借鉴的教学结构：

1. 先画 Training、Rollout 与数据管理的整体关系，再进入目录和函数。
2. 从 `train.py` / `train_async.py` 解释入口层，再进入 Ray placement、Data Source 和 generation。
3. 把资源流、数据流和权重流分开讲，不用一张箭头图承载全部语义。
4. 先说明一个组件在整条链中的职责，再展示它的源码。
5. 用 colocated / disaggregated、synchronous / asynchronous 等成对对比建立边界。

不可直接沿用的内容：

- 导读基于 slime commit `261ecee`，其 `Buffer`、Data Source 路径、字段和函数命名不代表 `06ffdbe2`。
- 导读中的架构图只能作为“应该画什么关系”的参照；本站应依据固定源码自行重画。
- 文中的判断性语言不能冒充 slime 团队的正式表述。

## 4. 固定源码证据表

以下链接全部固定到课程 commit，不随 `main` 漂移。

| 证据 ID | 固定源码 | 能证明的最小结论 | 不能证明的内容 |
| --- | --- | --- | --- |
| `loop.sync` | [`train()`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/train.py#L9-L94) | 默认同步入口先创建 placement、rollout manager 和 training models；循环按 generate → train → update weights 推进 | 异步入口时序；具体 Sample 字段 |
| `loop.async` | [`train_async.py`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/train_async.py#L10-L76) | 异步入口改变等待与重叠关系 | 任意异步配置都完全 on-policy |
| `ray.placement-layout` | [`_get_placement_group_layout`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/ray/placement_group.py#L100-L117) | 固定版本根据 debug、external 与 colocate 等分支计算 GPU 总量和 rollout offset | 同步或异步时序 |
| `rollout.manager-init` | [`RolloutManager.__init__`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/ray/rollout.py#L431-L478) | manager 装配 servers、Data Source、rollout function 与可选转换钩子 | 每个自定义函数内部行为 |
| `rollout.server-start` | [`start_rollout_servers`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/ray/rollout.py#L1092-L1231) | 固定版本建立 router 与 SGLang server groups，并暴露 router 地址 | 多模型、PD 等支线都是入门主路径 |
| `rollout.manager-generate` | [`RolloutManager.generate`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/ray/rollout.py#L553-L567) | manager 将 rollout data 获取、Sample→train data 转换和 DP split 串联 | generation 内部细节；actor 如何优化 |
| `rollout.get-data` | [`RolloutManager._get_rollout_data`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/ray/rollout.py#L634-L664) | 默认 rollout function 的输出在转换前被校验和展平 | reward 如何计算；网络请求格式 |
| `rollout.generate-and-rm` | [`generate_and_rm`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/rollout/sglang_rollout.py#L223-L287) | 默认路径把 generation、sample hooks 与 reward evaluation 串接，并允许 custom generate | group reward 的全部行为；训练数据转换 |
| `actor.train` | [`MegatronTrainRayActor.train_actor`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/backends/megatron_utils/actor.py#L418-L543) | actor 明确消费 rollout 派生数据并执行训练路径 | 新权重已经被 SGLang 使用 |
| `actor.update-weights` | [`MegatronTrainRayActor.update_weights`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/backends/megatron_utils/actor.py#L571-L632) | 权重通过显式 updater 发布给 rollout engines | 发布成功后的所有请求必然来自该版本；异步 in-flight 边界 |
| `sample.dataclass` | [`Sample`](https://github.com/THUDM/slime/blob/06ffdbe22be068b52f9ed0fc318c473f7030197e/slime/utils/types.py#L94-L443) | Sample 是跨多个生命周期阶段的协议对象 | Sample 本身就是完整框架架构 |

### 本轮新增的系统级源码 refs

原 ref 集合足以支持七幕局部事实，本轮又补充并生成了三个稳定 ref：

1. `ray.placement-layout` → `slime/ray/placement_group.py::_get_placement_group_layout / create_placement_groups`，证明 colocated 与分离资源布局的固定版本规则。
2. `rollout.manager-init` → `slime/ray/rollout.py::RolloutManager.__init__`，证明 server、Data Source、rollout function 在 manager 中的装配关系。
3. `rollout.server-start` → 固定版本的 router / SGLang engine 启动入口，证明 server-based generation 的本版本落点。

三个 ref 已通过现有 generator 生成行号与 hash，并由 `python3 scripts/generate-source-anchors.py --check` 验证。课程正文仍不得手工复制大段源码。

## 5. 核心结论账本

| 编号 | 课程结论 | 证据类型 | 主证据 | 边界 |
| --- | --- | --- | --- | --- |
| C01 | 框架设计首先是在确定不能轻易改变的骨架，同时降低人与框架交互的成本 | `AUTHOR_INTENT` | A1 第 6 页 | 是作者的设计观点，不是 Python API 定义 |
| C02 | RL scaling 对性能、规模化正确性和实验自由度提出同时存在的要求 | `AUTHOR_INTENT` | A1 第 9–13 页 | “要求”不等于自动达成 |
| C03 | slime 让 Megatron 与 SGLang 分别承担训练与生成，尽量保留二者的原生能力 | `AUTHOR_INTENT` + `PINNED_SOURCE` | A1/A2；固定入口与 actor/rollout refs | 不概括未来可能新增的后端 |
| C04 | Ray 在固定版本中负责把训练 actor、rollout manager 与 engines 放进可调用的远程执行关系 | `PINNED_SOURCE` | `loop.sync` + placement/manager refs | 不把 Ray 简化成“只是启动进程” |
| C05 | colocated/disaggregated 描述资源放置，sync/async 描述等待与时间关系；二者不是同一维度 | `AUTHOR_INTENT` + `PINNED_SOURCE` | A1/A2 + sync/async/placement refs | 具体合法组合仍受版本和参数约束 |
| C06 | 默认同步主循环的骨架是 generation → training → explicit weight update | `PINNED_SOURCE` | `loop.sync` | 省略了 eval、save、offload 等支线 |
| C07 | rollout manager 不只是“请求模型”，还负责将生成结果交接为训练数据并按 DP 拆分 | `PINNED_SOURCE` | `rollout.manager-generate` | generation 细节由 rollout function 决定 |
| C08 | optimizer step 与 rollout 侧看见新权重是两个边界 | `PINNED_SOURCE` + `OFFICIAL_CURRENT` | `actor.train`、`actor.update-weights`、Quick Start | 异步 in-flight 请求的版本可见性留给高级课 |
| C09 | `Sample` 适合追踪数据变化，但它只是观察探针，不是资源编排、控制流或权重流的总和 | `TEACHING_INFERENCE` | C03–C08 + `sample.dataclass` | 必须标为本站教学推论 |

## 6. 现有 `/learn/sample-journey` 内容去留

| 现有部分 | 决策 | 原因 |
| --- | --- | --- |
| 开场“本课只跟踪一个对象：Sample” | **替换** | 把观察工具误放成框架定义，缺失作者的问题意识 |
| “同样答对，为什么一个 Sample 不学习” hook | **移出开场** | 这是 loss mask / train-data 的局部机制问题，不是初识 slime 的首要矛盾 |
| 90 秒七步总览 | **后移并压缩** | 应在系统骨架之后作为复述，不应与七幕重复预告 |
| 第一幕 Dataset → Sample | **保留为 guided trace** | 用于验证输入边界，不再承担“slime 从哪里开始”的定义 |
| 第二幕 DataSource 分组 | **保留为 guided trace** | 展示候选关系；深入机制交给首门机制课 |
| 第三幕 SGLang 生成写回 | **保留为 guided trace** | 验证生成边界；不展开 payload/tuple 细节 |
| 第四幕 Reward / collect | **保留但重写连接** | 必须从“生成不等于评价”自然推出，而不是突然出现角色 |
| 第五幕 train-data conversion | **保留并强调表示边界** | 证明 Sample 不会直接变成 trainer batch |
| 第六幕 actor train | **保留并压缩** | 只证明训练消费与 optimizer step，不在导论讲 GRPO 数学 |
| 第七幕 weight publication | **提升为系统主问题的回答** | 显式说明训练结束与生成侧参数可见不是同一件事 |
| 当前章末选择题 | **重写** | 改为架构重建、双维度部署判断与首错边界解释 |

## 7. 版本漂移与措辞红线

- 课程说“固定版本中”时，只能引用 `06ffdbe2` 源码或其测试。
- 课程说“slime 的设计目标”时，应链接作者演讲或团队文章。
- 课程说“当前官方文档”时，必须记录访问日期，且不自动改写冻结课程。
- 不说“slime 保证大规模训练正确”；应说“作者将大规模正确性验证列为框架要求，并提供相应调试路径”。
- 不说“Ray 自动让训练异步”；应说“Ray 提供远程异步执行能力，实际同步关系由调用与等待位置决定”。
- 不说“Sample 穿过了所有系统”；train data 是显式派生表示，权重流也不存储在 Sample 中。
- 不说“SGLang 直接知道 reward、label 或 group”；跨网络字段必须由目标版本请求构造源码证明。

## 8. 来源档案结论

Stage 02 应讲述的不是“七个组件依次修改一条 Sample”，而是：

> RL scaling 要让两套擅长不同工作的系统在反复生成、学习和发布权重的闭环中保持高效、可验证且可扩展。slime 先固定这条骨架，再把具体数据生成逻辑留给用户。`Sample` 是我们用来核对这条骨架的观察探针。

这句话同时包含作者意图、固定源码和本站教学推论，因此正式页面必须把三层证据分开呈现。
