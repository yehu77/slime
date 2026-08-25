# slime 教学网站总体路线

> 这是一份持续维护的项目路线文档，也是我们后续协作时共同参考的主文档。
>
> 它描述“为什么做、为谁做、教什么、怎样教、先做什么以及怎样判断完成”。具体页面文案、课程脚本和技术实现应另建文档，不在这里无限展开。

| 项目项 | 当前值 |
| --- | --- |
| 文档状态 | Draft / Living document |
| 当前阶段 | M1：第一个纵向切片（已公网发布，进入内容深化与目标用户验收） |
| 建立日期 | 2026-08-08 |
| 最近更新 | 2026-08-25 |
| slime 调研基线 | `v0.3.1-1-g06ffdbe2` |
| 产品工作名 | `slime Lab` |
| 当前共同维护者 | 项目发起人 + Codex |
| 公网网站 | [slime Lab](https://slime-lab.hunyu6792.workers.dev)（Cloudflare Workers） |
| 公网源码 | [yehu77/slime](https://github.com/yehu77/slime)（个人 fork） |
| 下一份产物 | 机制课第四章“Sample 怎样变成 SGLang 请求”的请求边界重构 |

## 0. 当前焦点

**现在：** M1 已完成公网纵向切片，并进入“先讲透机制，再运行实验”的内容深化阶段。首门 88 分钟机制课《Sample 如何得到回答》的前三章已经完成实现与本地验收：第一章用“连续翻译台”解释 `external row → Dataset rule → initial Sample`，第二章用“字段生命周期接力台”区分 dataclass 声明、构造初始化、首次非默认生产和下游消费，第三章用“分组实验台”解释 `P × n_samples_per_prompt` 的嵌套形状、两个计数器和 `deepcopy` 的对象隔离契约。

前三章都固定到源码 commit `06ffdbe2`，共享同一套 2×2 教学 fixture，并把源码证据、诊断练习和按课程隔离的 v2 进度纳入自动验证。第二章明确说明 conversion 的主要产物是独立 TrainData 语义，而不是继续“填满 Sample”；第三章进一步区分“同组候选共享比较条件”和“每个候选拥有独立可变对象图”。

**接下来：** 建设第四章“Sample 怎样变成 SGLang 请求”，重点讲透 prompt tokenization、sampling params、HTTP payload 与请求边界；随后继续响应与写回两章。Cloudflare 分支预览和合并发布在本地内容验收之后进行。

**暂时不做：** 大规模铺课程、账号系统、真实在线训练、全量英文内容和高级 recipe explorer。

## 1. 如何使用这份文档

1. 每次开始一轮较大的产品、内容或实现工作前，先读“当前阶段”“已确认决策”和“下一步”。
2. 方向性决定写入“决策记录”，不要只留在聊天记录里。
3. 每完成一个里程碑，更新状态、验收结果、遗留问题和下一阶段范围。
4. 新想法先进入 backlog；除非它服务于当前里程碑，否则不立即扩张范围。
5. 当源码或官方文档变化导致课程失效时，将内容标记为 `stale`，而不是假装它仍然正确。

这份文档是教学网站的路线图，不是 slime 框架本身的研发 roadmap，也不代表上游维护团队的承诺。

## 2. 愿景

### 2.1 一句话愿景

建立一套以交互式系统图、源码导读和可验证实验为核心的 slime 教材，帮助学习者从“会运行脚本”走到“能解释、能扩展、能判断正确性”。

### 2.2 核心承诺

学习者完成核心路线后，应该能够：

- 用自己的话解释 Ray、SGLang、Megatron、DataSource 和 `Sample` 的职责边界；
- 跟踪一条 prompt 从 rollout、reward、训练到权重同步的完整生命周期；
- 读懂同步与异步主循环，并理解两者在吞吐和策略陈旧度上的取舍；
- 判断一个新任务应该接入 custom generate、reward、rollout function 还是其他 hook；
- 识别 batch 不守恒、loss mask 错误、训推 log-prob 不一致、权重版本错误等静默正确性问题；
- 从源码、参数、测试、trace 和官方文档中继续独立学习。

### 2.3 不做什么

至少在前期，我们不做：

- 官方文档的完整复制品或换皮版本；
- 从零开始覆盖全部机器学习、深度学习和强化学习基础的百科全书；
- 在浏览器中承诺真实运行大模型 RL 训练；
- 未经验证的性能估算器、GPU 容量承诺或“一键生产配置”；
- 与 slime 核心无关的通用 agent framework；
- 账号、证书、排行榜、社区积分等尚未证明必要的产品系统；
- 为追求内容数量而自动生成大量未经源码核验的文章。

## 3. 为什么值得单独做一个教学网站

slime 已经有较完整的官方资料，但现有资料主要解决“知道自己要找什么之后，如何配置和运行”的问题。教学网站需要补齐的是认知路径。

当前仓库提供了非常好的教学素材：

- [`train.py`](./train.py) 只有约 100 行，完整展示同步的 rollout → train → update weights 闭环；
- [`train_async.py`](./train_async.py) 只有约 80 行，适合和同步循环做逐行、逐时间段对照；
- [`Sample`](./slime/utils/types.py) 是贯穿 prompt、token、reward、loss mask、log-prob、状态和 metadata 的统一对象；
- [`RolloutManager`](./slime/ray/rollout.py) 明确展示 sample 如何变为训练数据并分配到训练 rank；
- [`sglang_rollout.py`](./slime/rollout/sglang_rollout.py) 包含生成、奖励、动态采样、abort 和 partial rollout 的关键路径；
- `tests/` 中已有大量无需 GPU 的行为与契约测试，可改造成低门槛实验；
- `examples/` 中已有 Search-R1、coding agent、multi-agent、fully async、VLM、OPD 等进阶案例。

同时也存在明确的教学缺口：

- [`Quick Start`](./docs/zh/get_started/quick_start.md) 很快进入 Docker、模型下载、checkpoint 转换和高端 GPU 环境；
- [`Customization Guide`](./docs/zh/get_started/customization.md) 是很好的接口参考，但一次呈现大量 hook，新手难以建立选择依据；
- 同步、异步、colocate、训推分离、offload、partial rollout 和 weight sync 的时间关系仅靠静态文字很难掌握；
- correctness 知识分散在 usage、debug、trace、reproducibility、测试和实现细节中；
- 项目演进很快，文档、示例和源码之间可能出现链接、签名或能力描述漂移；
- 个别现有排障命令风险过高，教学网站不能未经审查直接同步或展示。

因此，新网站的价值不在“拥有更多页面”，而在于把现有知识重新组织成可理解、可操作、可验证的学习过程。

## 4. 产品定位与官方资料的关系

采用“双层知识体系”：

| 层 | 主要职责 | 内容特征 |
| --- | --- | --- |
| slime 官方文档 | 准确说明安装、参数、配置、API 和已有 recipe | 完整、直接、接近当前实现 |
| 教学网站 | 解释设计原因、数据流、源码关系、正确性和选择方法 | 递进、交互、可练习、有学习目标 |

教学网站可以引用、摘要和深链官方资料，但不重复维护完整参数手册。遇到“精确配置值是什么”时，优先跳转官方文档；遇到“为什么有这个参数、它影响闭环中的哪一步”时，由教学网站解释。

## 5. 目标用户与默认先修知识

### 5.1 第一优先用户

- 熟悉 Python，能够阅读基本 PyTorch 代码；
- 对 LLM 训练或推理至少有一侧经验；
- 知道 policy、reward、rollout、batch 等基础概念，但不一定做过大规模 RL；
- 希望采用、扩展、调试或贡献 slime 的研究者与工程师。

### 5.2 第二优先用户

- 已经会跑 slime 脚本，但希望理解系统内部机制的人；
- 需要接入 agent、tool、sandbox、verifier 或自定义 reward 的团队；
- 关注大规模训练、推理系统、异步 RL 和 correctness 的系统研究者。

### 5.3 新手支持方式

绝对新手不作为核心课程的默认读者，但提供一个简短先修模块，解释：

- LLM post-training 与预训练的区别；
- SFT、RL、rollout、reward、advantage、policy update；
- actor、reference、critic、reward model；
- training engine、inference engine 和分布式资源调度。

先修模块的目标是补齐课程所需概念，不扩张成完整 RL 教科书。

## 6. 核心教学叙事

整个网站围绕“一条 Sample 的旅程”展开：

```text
Prompt / DataSource
  → 按 prompt 形成 Sample group
  → SGLang Router / Engines 生成 response
  → 写入 token、rollout log-prob、状态和生成元信息
  → reward / verifier / filter / partial 回收
  → reward normalization、loss mask、rollout 级归约
  → DP 与 microbatch 调度
  → Megatron actor / critic / reference / teacher
  → optimizer step
  → 权重同步回 SGLang
  → 使用新权重进入下一轮 rollout
```

教学顺序必须遵循以下原则：

1. 先让用户看到完整闭环，再拆解局部。
2. 先跟踪数据怎样变化，再介绍进程、GPU 和通信拓扑。
3. 先解释默认同步路径，再引入异步、partial 和 fully async。
4. 先建立正确性不变量，再讲性能优化。
5. 每个高级机制都回答三个问题：解决什么瓶颈、改变了哪条数据流、引入了什么新风险。
6. **先讲透机制，再运行实验。** 系统导论负责建立地图，机制课负责逐边界解释与检查；只有学习者能够定位一条异常 trace 的首个错误边界后，真实实验才承担验证解释的职责。实验入口不做硬锁，但课程路线必须保持这一建议顺序。

## 7. 网站信息架构

以下路由名称是工作草案，可以在视觉和内容设计阶段调整。

| 一级栏目 | 暂定路由 | 主要内容 |
| --- | --- | --- |
| 首页 | `/` | 产品价值、学习目标、按意图分流、继续学习 |
| 开始学习 | `/start` | 先修检查、90 秒闭环速览、30 分钟路线选择 |
| 课程 | `/learn` | 按先修关系组织的章节、练习和完成状态 |
| 系统图谱 | `/atlas` | 架构图、调用链、时序、资源与数据结构浏览器 |
| 实验室 | `/labs` | 零 GPU 模拟、CPU contract lab、真实 GPU recipe |
| 源码地图 | `/source` | 概念 ↔ 函数 ↔ 参数 ↔ 测试 ↔ 版本的双向索引 |
| 正确性中心 | `/correctness` | 不变量、故障案例、debug、trace、复现和容错 |
| Recipes | `/recipes` | 按模型、任务、硬件、算法和部署方式筛选案例 |
| 术语表 | `/glossary` | 统一定义、同义词、上下游项目术语映射 |

首页第一层分流应采用用户意图，而不是传统的“Docs / Blog”：

- 我想先理解 slime；
- 我想跑通第一个实验；
- 我想接入自己的 reward 或 agent；
- 我想理解源码、性能与扩展点；
- 我遇到了训练正确性或稳定性问题。

## 8. 学习路线

### 路线 A：30 分钟理解 slime

适合第一次接触 slime 的读者。

1. slime 解决什么问题；
2. 五个核心角色：Ray、SGLang、Megatron、DataSource、`Sample`；
3. 一条 Sample 的旅程；
4. 同步主循环；
5. 三个必须记住的正确性不变量；
6. 下一步路线选择。

完成标准：能够不看图复述完整闭环，并解释一次权重同步发生在什么位置。

### 路线 B：接入自己的 RL 任务

适合要实现 math、search、tool、sandbox、agent 或 verifier 工作流的人。

1. 数据格式与 prompt group；
2. `Sample` 字段和状态；
3. 默认 generation 与 reward；
4. custom generate、custom reward 和 rollout function 的选择；
5. loss mask、multi-turn token 边界和 fan-out；
6. CPU contract tests；
7. 从最小任务逐步扩展到 agentic workflow。

完成标准：能够选择正确 hook，实现一个经过测试的自定义任务，并解释其训练 token 边界。

### 路线 C：扩展、优化和运行大规模任务

适合负责性能、稳定性和集群部署的人。

1. Ray placement 与 GPU 拓扑；
2. colocate、训推分离、offload、release-train；
3. dynamic sampling、partial rollout、fully async；
4. DP、TP、PP、CP、EP 与动态 microbatch；
5. full、delta、tensor、distributed、disk 权重同步；
6. PD disaggregation、router 与 session affinity；
7. trace、profiling、容错和恢复。

完成标准：能够为一个给定 workload 画出资源和时序图，说明主要瓶颈、同步点和故障边界。

### 路线 D：阅读源码与参与贡献

适合希望继续深入实现的人。

1. 从 `train.py` 建立调用图；
2. 阅读 `RolloutManager` 和默认 rollout；
3. 阅读 `Sample`、DataSource 与训练数据转换；
4. 阅读 actor、loss 和 update weight；
5. 用测试理解稳定契约；
6. 理解项目贡献范围与 correctness 要求。

完成标准：能够从一个 CLI 参数或行为追踪到实现、测试和相关文档。

## 9. 课程模块地图

| 优先级 | 模块 | 核心问题 | 代表性实验或交互 |
| --- | --- | --- | --- |
| P0 | 先修知识 | RL post-training 在循环什么 | 角色卡片与术语检查 |
| P0 | 一条 Sample 的旅程 | 数据字段在每一步怎样改变 | 闭环播放器、Sample 显微镜 |
| P0 | 一次同步训练循环 | rollout、train、update 的顺序为何重要 | `train.py` 逐行导读 |
| P0 | Batch 与归约 | prompt、group、sample、rollout、step 如何对应 | Batch 守恒计算器 |
| P0 | Rollout 与 Reward | 生成、RM、filter、abort 如何配合 | 动态采样队列 |
| P0 | Customization | 新任务应该接在哪一层 | Hook 选择器、contract lab |
| P1 | 算法与 Loss | reward 如何变成 advantage 和梯度 | GRPO/PPO 计算实验室 |
| P1 | Agentic RL | tool、environment、subagent 如何变成训练 token | loss-mask 与 trajectory lab |
| P1 | 同步与异步 | 吞吐提升来自哪里，陈旧度如何产生 | Sync/async 时间线 |
| P1 | 资源与并行 | GPU、进程和模型怎样放置 | 拓扑配置器 |
| P1 | Correctness | 哪些 bug 不会立即报错 | 不变量诊断题、debug replay |
| P1 | 可观测与容错 | 如何定位 long-tail、hang 和重启问题 | 录制 trace、故障注入 lab |
| P2 | 训推不一致 | 两套 engine 的 log-prob 为什么不同 | mismatch 与 TIS 实验室 |
| P2 | 权重同步 | 不同 mode × transport 如何选择 | 权重同步状态机 |
| P2 | MoE 与低精度 | scaling 优化怎样改变正确性边界 | routing replay / precision 案例 |
| P2 | PD 与 Router | 多轮请求如何利用服务拓扑 | PD 与 session-affinity 模拟器 |

## 10. 交互组件优先级

### P0：首个公开版本必须具备

1. **闭环播放器**
   - 逐步播放 DataSource → SGLang → reward → train → weight update；
   - 当前节点、对应源码和 `Sample` 字段同步高亮；
   - 支持自动播放、单步、前进和后退；
   - 键盘与触摸操作可用。

2. **Sample 显微镜**
   - 展示 prompt token、模型生成 token、tool/environment token；
   - 展示 `loss_mask`、reward、rollout log-prob、status、metadata；
   - 对比单轮、multi-turn 和 fan-out sample。

3. **Batch 守恒计算器**
   - 解释 `rollout_batch_size × n_samples_per_prompt`；
   - 解释 `global_batch_size × num_steps_per_rollout`；
   - 显示 prompt group、rollout、training sample 和 optimizer step 的区别；
   - 对不合法组合给出原因，而不只显示“配置错误”。

4. **同步 / 异步时间线**
   - 对照 `train.py` 与 `train_async.py`；
   - 展示 rollout、training 和 weight update 的重叠；
   - 明确指出等待点和可能的策略陈旧。

### P1：核心课程形成后加入

- Hook 选择器；
- 动态采样与 partial rollout 队列；
- GRPO / PPO advantage 与 loss 实验室；
- GPU placement 与 offload 拓扑器；
- 预录制 trace 浏览器；
- loss mask / trajectory 编辑实验。

### P2：高级系统课程加入

- train-inference mismatch 实验室；
- DP / microbatch 打包动画；
- 权重同步 mode × transport 对比；
- MoE routing replay 可视化；
- PD disaggregation 与 router 模拟器。

所有模拟器必须明确标注“教学模拟”或“基于真实 trace”。除非有经过验证的模型，否则不输出成本、吞吐或显存的精确生产预测。

## 11. 内容单元规范

### 11.1 每课固定结构

1. 这节课解决什么问题；
2. 学习完成后能做什么；
3. 需要哪些先修知识；
4. 最小心智模型；
5. 交互图或具体例子；
6. 对应源码与调用关系；
7. 小实验；
8. 常见误解与错误；
9. 知识检查；
10. 下一课与官方参考资料。

### 11.2 内容元数据基线

```yaml
schema_version: 1
id: core.sample-journey
kind: lesson
locale: zh-CN
route: /learn/sample-journey
title: 一条 Sample 的旅程
workflow_status: technically-reviewed
freshness_status: current
visibility: public
duration:
  min_minutes: 25
  max_minutes: 30
  includes_assessment: true
prerequisites:
  - concept.rl-loop-basics
baseline:
  repository: THUDM/slime
  nearest_tag: v0.3.1
  describe: v0.3.1-1-g06ffdbe2
  commit: 06ffdbe22be068b52f9ed0fc318c473f7030197e
fixture_ids: [math-2x2-v1]
source_ref_ids: [sample.dataclass, sample.append-response-tokens]
test_ref_ids: [sample.contract.cpu, dp-schedule.contract.cpu]
```

`workflow_status` 与 evidence freshness 分开；source / test 使用稳定 ID，行号由固定 commit 的 manifest 生成。完整 schema、完成规则和 owner 见 [M1 Implementation Brief](./SLIME_LAB_M1_IMPLEMENTATION_BRIEF.md)。

### 11.3 内容质量标准

- **准确**：优先以当前源码和测试为依据，官方文档作为重要来源但不是唯一事实来源；
- **值得读**：遵循 [内容文风指南](./SLIME_LAB_CONTENT_STYLE_GUIDE.md)，先让对象与因果发生，再引入术语；叙事层激发好奇，技术层消除歧义；
- **可教**：先解释问题和因果关系，再展示完整配置；
- **可验证**：能用 CPU 测试、录制 trace、最小示例或真实 recipe 验证；
- **可追溯**：概念能链接到固定版本的函数、测试和官方资料；
- **安全**：所有命令经过人工审查，不展示宽泛删除、未限定路径或泄露密钥的操作；
- **诚实**：明确区分真实运行结果、录制结果、简化模型和教学模拟；
- **可访问**：不只依靠颜色传达状态，交互支持键盘，移动端至少能完成阅读和基础操作；
- **可维护**：避免复制整段上游文档或大段源码，只引用教学所需片段。

## 12. 技术方向（M1 已确认）

这部分是 M1 的已确认方向；M2 可以根据首个纵向切片的结果重新评估内容管线。

### 12.1 项目边界

- 教学站作为独立产品表面，不修改 slime 核心训练路径；
- M1 原型放在当前工作区的 `website/` 目录；
- 在正式发布或向上游提交之前，确认它应继续留在当前仓库还是拆成独立仓库；
- 无论最终位于哪里，都应固定链接 slime 的 tag / commit，并遵守 Apache-2.0 许可和引用要求。

当前仓库的贡献政策倾向将与 RL 核心相对独立的完整产品放在独立项目中，因此“仓库边界”必须在 M1 对外发布前确认。

### 12.2 站点形态

- 内容型、多路由网站，而不是单页 landing page；
- M1 用 schema-validated TypeScript content modules 管理强结构化首课；M2 再验证 Markdown / MDX 管线；
- React 组件承载交互图、实验室和测验；
- 核心课程尽可能静态生成，保证速度、SEO 和长期可访问性；
- M1 不引入账号和服务端数据库；
- 学习进度、主题等设备本地状态优先使用浏览器存储；
- 搜索在数据规模允许时优先采用构建期索引；
- 中文无前缀 URL；内容 ID 与 locale schema 为英文预留，未来英文使用 `/en/...`；
- 每个里程碑都提供可访问的在线预览，正式发布前再确定最终域名。

### 12.3 建议目录

```text
website/
  app/                    # 页面与路由
  components/             # 通用 UI
  components/learn/       # 教学交互组件
  content/
    zh/
      lessons/
      labs/
      glossary/
  data/                   # 受审查的课程数据、trace 摘要、recipe 索引
  scripts/                # 源码引用、链接和内容校验
  public/
```

具体目录以初始化后的站点结构为准，不为了匹配这份草案而破坏工作框架的默认约定。

## 13. 源码同步与版本策略

slime 迭代速度快，教学网站必须把“内容是否仍然正确”作为产品能力。

### 13.1 基本策略

- M1 以 `v0.3.1-1-g06ffdbe2` / commit `06ffdbe22be068b52f9ed0fc318c473f7030197e` 为教学基线；
- 教学正文默认描述一个明确版本，不使用含糊的“当前总是如此”；
- 源码链接优先固定到 tag 或 commit；
- 每课记录 baseline，并通过 `source_refs`、`tests` 和独立 evidence pass record 跟踪验证；
- 引用文件、函数或参数变化时，将受影响课程标记为 `needs-review`；
- 支持新版本时，先更新核心心智模型和纵向切片，再更新长尾页面；
- “已验证但不是最新版”优于“看似最新但未经验证”。

### 13.2 自动检查候选项

- 引用的文件和符号是否仍存在；
- 内部链接与官方外链是否有效；
- lesson frontmatter 是否完整；
- 示例目录和 recipe 路径是否存在；
- CLI 参数是否仍能在源码中找到；
- 代码块是否含危险或未限定目标的命令；
- 中英文页面是否错误地声称已同步；
- 构建和基础可访问性检查是否通过。

自动检查只能发现漂移，不能代替技术内容审核。

## 14. 实验分层

### L0：纯浏览器教学模拟

- 不依赖 Python、GPU 或远程服务；
- 用受控数据解释流程和不变量；
- 适合心智模型、batch、loss mask、时序和 hook 选择。

### L1：CPU 可执行实验

- 从已有 unit tests 和 plugin contract tests 提炼；
- 覆盖 `Sample`、reward、过滤器、参数验证、DP schedule、agent trajectory 等；
- 每个实验提供预期结果和失败解释。

### L2：录制的真实运行

- 使用经过脱敏和压缩的 rollout dump、trace、日志或指标；
- 学习者无需拥有训练硬件，也能完成诊断练习；
- 所有数据标注来源版本、配置和是否经过裁剪。

### L3：真实 GPU recipe

- 从最小 smoke 到多卡正式 recipe；
- 明确硬件、镜像、数据、checkpoint、耗时范围和验证信号；
- 不把 smoke test 宣传为有训练效果的 recipe；
- 优先链接并补充解释，而不是复制官方运行手册。

## 15. 里程碑

### M0：方向对齐与首课设计（已完成）

目标：建立共享路线，消除最重要的产品歧义。

- [x] 完成仓库架构、文档、示例和外部生态调研；
- [x] 建立本路线文档；
- [x] 确认产品工作名为 `slime Lab`；
- [x] 确认第一优先用户画像；
- [x] 确认原型放在当前仓库的 `website/`；
- [x] 完成 [《一条 Sample 的旅程》lesson storyboard](./SLIME_SAMPLE_JOURNEY_STORYBOARD.md)；
- [x] 确认 M1 的页面清单与验收标准；
- [x] 建立 [M1 Implementation Brief](./SLIME_LAB_M1_IMPLEMENTATION_BRIEF.md)。

退出条件：双方能用同一份页面地图描述 M1，并且没有会改变项目结构的悬而未决问题。

### M1：第一个纵向切片（当前）

目标：用一条完整学习体验验证网站方向，而不是先堆空页面。

范围：

- 网站基础结构、导航、主题和中文内容管线；
- 首页的五种意图分流；
- 《30 分钟理解 slime》入口；
- 《一条 Sample 的旅程》完整课程；
- 闭环播放器；
- Sample 显微镜；
- Batch 守恒计算器；
- 同步 / 异步时间线；
- 第一版术语表；
- 固定版本源码链接与内容校验；
- 基础移动端和无障碍支持。

暂不包含：账号、云端进度、证书、评论系统、真实在线训练。

退出条件：私有预览完成自动 gate；至少 3 名、推荐 4 名目标用户完成验收，其中研究者和工程师各至少 1 名，并达到 brief 中的学习效果门槛。

### M2：核心课程与自定义任务

目标：让学习者能从理解框架走到实现自己的任务。

- Rollout、Reward、Training 和算法基础课程；
- custom generate / custom reward / rollout function 决策树；
- `Sample`、loss mask、fan-out 和 multi-turn 深入课程；
- CPU contract labs；
- Search-R1 或轻量 tool-use 贯穿项目；
- 课程搜索、前置关系和跨课程设备本地进度聚合；
- 内容贡献模板与审核清单。

退出条件：学习者能实现并测试一个最小自定义 workflow，且知道何时不应覆盖整个 rollout。

### M3：Agentic、异步与正确性

目标：覆盖 slime 最有差异化、也最容易静默出错的能力。

- agent trajectory、sandbox、tool、subagent、context compact；
- dynamic sampling、abort、partial 和 fully async；
- GRPO / PPO / GSPO / CISPO 的关键数据路径；
- rollout/train log-prob mismatch 与校正；
- debug rollout-only / train-only / replay；
- trace、故障诊断和 correctness casebook。

退出条件：学习者能解释一个 agentic rollout 如何成为正确的训练样本，并能诊断至少三类静默错误。

### M4：Scaling 与生产系统

目标：把单轮理解扩展到真实的大规模资源与稳定性问题。

- colocate、训推分离、offload、release-train；
- DP / TP / PP / CP / EP 与动态 batch；
- full / delta 与不同 transport 的权重同步；
- PD disaggregation、router、session affinity；
- MoE、低精度、外部 rollout engines；
- profiling、fault tolerance、reproducibility；
- 按模型、任务、硬件、算法组织的 recipe explorer。

退出条件：学习者能为给定 workload 提出一套有依据的拓扑方案，并列出性能与正确性验证计划。

### M5：案例、双语与社区维护

目标：让内容能够随项目和生态长期生长。

- GLM、Search-R1、coding agent、VLM、OPD 等案例研究；
- 生态项目的设计比较；
- 英文核心路线；
- 版本差异页；
- 内容反馈、贡献和 review 流程；
- 根据真实使用数据决定是否需要账号、云端进度或证书。

退出条件：外部贡献者能够按模板新增一课或一个案例，并通过自动检查和人工技术审核。

## 16. 当前优先 backlog

### Now：只服务 M0 / M1

- [x] 决定工作名为 `slime Lab`；
- [x] 写 [《一条 Sample 的旅程》storyboard](./SLIME_SAMPLE_JOURNEY_STORYBOARD.md)；
- [x] 定义闭环播放器的状态和步骤；
- [x] 选定 Sample 显微镜的固定 `math-2x2-v1` 示例数据；
- [x] 定义 Batch 计算器规则和错误提示；
- [x] 定义同步 / 异步时间线的对照场景；
- [x] 确定 M1 位于 `website/`，先发布私有预览；
- [x] 初始化网站并建立内容 schema；
- [x] 实现、自动验证和发布 M1 私有预览；
- [x] 确认 GitHub fork + Cloudflare Workers 的公网发布架构；
- [ ] 推送已验证源码并完成首个 `workers.dev` 公网部署；
- [ ] 项目发起人完成目标用户、移动端与完整键盘流验收，将首课从 `ready` 推进到 `verified`。

### Next：M1 完成后再进入

- [ ] Hook 选择器；
- [ ] CPU contract lab harness；
- [ ] Search-R1 贯穿项目；
- [ ] correctness casebook；
- [ ] 录制 trace 数据格式；
- [ ] 内容搜索与跨课程进度聚合。

### Later：暂不实施

- [ ] GPU topology estimator；
- [ ] 完整 recipe explorer；
- [ ] 英文全量内容；
- [ ] 用户账号和云端同步；
- [ ] 证书、排行榜或 cohort 功能；
- [ ] 社区投稿后台。

## 17. 协作方式

### 17.1 每轮工作循环

1. 从当前里程碑选择一个可以完整验收的纵向切片；
2. 明确学习目标和不做什么；
3. 阅读对应源码、测试和官方资料；
4. 先写 lesson storyboard 或交互状态说明；
5. 再实现内容和界面；
6. 做技术、内容、视觉、移动端和无障碍验证；
7. 记录决策、已知限制和下一步；
8. 更新本路线文档。

### 17.2 分工原则

项目发起人重点决定：

- 产品愿景、目标用户和内容取舍；
- 哪些知识最值得优先讲；
- 技术解释是否符合真实使用经验；
- 对外发布节奏和品牌方向。

Codex 重点负责：

- 仓库和外部一手资料调研；
- 信息架构、lesson storyboard 和交互设计；
- 网站实现、内容组织和自动检查；
- 构建、可用性、链接和版本验证；
- 主动指出内容漂移、风险和范围膨胀。

重要方向由双方确认。当前里程碑内的可逆实现细节，由 Codex 按最佳判断推进并在交付时说明。

### 17.3 内容状态

```text
idea → researched → drafted → content-reviewed → technically-reviewed → ready → verified → published
```

- `content-reviewed`：叙事、术语和学习负担已经过内容审核；
- `technically-reviewed`：关键技术结论已和源码、测试或可靠的一手资料对齐；
- `ready`：页面、交互与自动 gate 已通过，可以进入私有预览；
- `verified`：目标用户验收已达到当前里程碑门槛；
- `published`：项目发起人已经决定公开发布。

创作状态与证据新鲜度分开维护；新鲜度只使用 `current / needs-review / stale`。`stale` 表示基线变化或证据失效，需要复核，不代表内容一定错误。

## 18. Definition of Done

### 一篇课程完成

- 学习目标、先修知识和预计时间清楚；
- 至少有一个具体例子、交互或实验；
- 核心结论有固定版本源码或一手资料依据；
- 术语与站内定义一致；
- 包含常见误解和知识检查；
- 所有命令经过安全审查；
- 桌面和移动端可阅读；
- 键盘可以完成主要交互；
- 标记基线版本和 evidence 验证记录。

### 一个交互组件完成

- 它解决一个明确的学习难点，而不是装饰；
- 初始状态、空状态、错误状态和重置行为完整；
- 不依赖颜色作为唯一信息载体；
- 支持键盘、鼠标和触摸；
- 简化假设写在用户能看到的位置；
- 关键逻辑有测试；
- 不输出未经验证的生产结论。

### 一个里程碑完成

- 范围内页面全部可访问；
- 站点构建通过；
- 内部链接、源码引用和内容元数据检查通过；
- 在真实目标用户路径上完成一次端到端验收；
- 已知问题有记录；
- 本文档状态和下一阶段计划已更新；
- 提供稳定的在线预览或正式地址。

## 19. 风险与应对

| 风险 | 表现 | 应对 |
| --- | --- | --- |
| 范围无限扩大 | 想一次覆盖所有算法、模型和硬件 | 以里程碑和纵向切片控制；新想法先入 backlog |
| 复制官方文档 | 两套内容相似但很快不一致 | 教学站解释 why/how-to-think，精确参考跳官方文档 |
| 源码快速漂移 | 参数、签名、路径或默认值变化 | 固定版本、记录 source refs、自动标记 needs-review |
| 没有 GPU 难以学习 | 用户在第一步就放弃 | L0 浏览器模拟、L1 CPU lab、L2 录制真实数据 |
| 内容“能跑但跑错” | 静默正确性问题被忽略 | 每模块先定义不变量，关联测试和 debug 方法 |
| 自动生成内容失真 | 页面数量多但技术不可靠 | 自动化只辅助索引和检查，技术结论必须人工审核 |
| 高风险命令传播 | 用户复制宽泛删除或未限定操作 | 命令安全 lint、人工 review、使用明确占位符和范围 |
| 交互喧宾夺主 | 动画漂亮但没有学习收益 | 每个组件必须绑定学习目标和验收题 |
| 维护责任不清 | 发布后无人更新 | 记录 owner、基线、验证时间和 stale 状态 |

## 20. 已确认决策与公开发布前问题

### 20.1 已确认决策

- 建立一份双方共同维护的总体路线文档；
- 先做调研和整体方案，再逐步建设；
- 网站内容会很多，因此采用内容型、多页面和分阶段路线；
- 核心价值是帮助用户学习并深刻理解 slime，而不是只做项目宣传。
- 产品工作名使用 `slime Lab`；
- 第一优先用户是具备 Python / PyTorch 与基础 RL 的首次 slime 使用者，研究者和工程师并列；
- M1 放在当前仓库 `website/`，不修改 slime 核心训练路径；
- 视觉采用严谨系统教材为主、克制 slime 趣味为辅；
- M1 只发布中文无前缀页面，未来英文使用 `/en/...`；
- 当前稳定页面包括 `/`、`/start`、`/learn`、`/learn/sample-journey`、`/learn/sample-to-generation`、`/glossary`、`/source`；
- M1 使用 vinext、npm、React / TypeScript、typed content、静态 fixture 和本地进度；
- GitHub fork + Cloudflare Workers 是唯一托管链路，不再维护其他托管集成；
- `main` 作为公网生产分支，其他分支生成预览版本；首发使用免费 `workers.dev` 地址，独立域名以后再决定；
- 托管迁移与内容框架迁移分开，M2 铺量前单独验证 Docusaurus + MDX，不阻塞 M1 公网发布。

### 20.2 M1 实施约束

- 网站是官方文档的教学伴侣；
- 第一课以“一条 Sample 的旅程”为主线；
- M1 不做账号、数据库和真实在线 GPU；
- 一份 `math-2x2-v1` fixture 驱动播放器、显微镜、Batch 与时间线；
- raw Sample、derived train data 与 system state 严格分离；
- source refs 固定到 `06ffdbe2…`，symbol 是身份，行号由 manifest 生成；
- 学习进度只保存于设备本地；统一使用按 lesson ID 隔离的 `slime-lab:progress:v2`，并兼容迁移一个发布周期内的两种 v1 记录。

### 20.3 公网发布后的待确认项

1. 何时购买并绑定独立域名；
2. M1 用户验收结果是否支持进入 M2；
3. Docusaurus 验证是否支持从 M2 正式引入 Markdown / MDX；
4. 网站长期保留在 slime fork，还是在内容协作成熟后迁为独立项目。

这些问题不阻塞 M1 的免费 `workers.dev` 首发。

## 21. 下一步

M0 已完成。[《一条 Sample 的旅程》storyboard](./SLIME_SAMPLE_JOURNEY_STORYBOARD.md)和 [M1 Implementation Brief](./SLIME_LAB_M1_IMPLEMENTATION_BRIEF.md)共同定义施工事实与边界。

当前内容发布流程：

1. 在 `website/` 完成内容或交互修改；
2. 通过内容校验、测试、类型检查、lint、安全检查和生产构建；
3. 推送 `codex/*` 安全分支并创建 PR，不直接向官方 `upstream` 推送；
4. 通过 GitHub CI 与 Cloudflare branch preview 后合并到个人 fork 的 `main`；
5. 由 Cloudflare Workers Builds 自动发布，并检查 `/`、`/start`、`/learn`、`/learn/sample-journey`、`/learn/sample-to-generation`、`/glossary`、`/source` 后记录验收结果。

## 22. 研究入口

### 仓库内一手资料

- [中文 README 与架构概览](./README_zh.md)
- [同步训练入口](./train.py)
- [异步训练入口](./train_async.py)
- [`Sample` 数据结构](./slime/utils/types.py)
- [`RolloutManager`](./slime/ray/rollout.py)
- [默认 SGLang rollout](./slime/rollout/sglang_rollout.py)
- [DataSource](./slime/rollout/data_source.py)
- [参数定义](./slime/utils/arguments.py)
- [快速开始](./docs/zh/get_started/quick_start.md)
- [Customization Guide](./docs/zh/get_started/customization.md)
- [Agentic RL 路线](./docs/zh/get_started/agent.md)
- [Debug Guide](./docs/zh/developer_guide/debug.md)
- [Trace Guide](./docs/zh/developer_guide/trace.md)
- [测试目录](./tests)
- [示例目录](./examples)
- [贡献范围](./CONTRIBUTING.md)

### 外部一手资料与教学参考

- [slime 官方仓库](https://github.com/THUDM/slime)
- [slime 官方文档](https://thudm.github.io/slime/)
- [slime 设计愿景](https://www.lmsys.org/blog/2025-07-09-slime/)
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course)
- [PyTorch Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro)
- [How To Scale Your Model](https://jax-ml.github.io/scaling-book/)
- [Dive into Deep Learning](https://d2l.ai/)

## 23. 决策记录

| 日期 | 决策 | 原因 | 状态 |
| --- | --- | --- | --- |
| 2026-08-08 | 先进行仓库、文档和生态调研，再确定总体方案 | 内容规模大，必须先建立正确边界 | 已确认 |
| 2026-08-08 | 将网站定位为交互式教材与系统图谱 | 与官方参考文档形成互补 | 已确认 |
| 2026-08-08 | 以“一条 Sample 的旅程”作为首个纵向切片 | 能同时串起数据、系统、算法、源码和正确性 | 已形成 storyboard，待 M1 用户验证 |
| 2026-08-08 | 新建本路线文档作为共同参考 | 防止重要决定只存在于聊天历史 | 已确认 |
| 2026-08-08 | 首课用一个固定 `math-2x2-v1` fixture 驱动全部交互 | 保证播放器、显微镜、Batch 与时间线数据一致且可测试 | 已确认 |
| 2026-08-08 | UI 严格分离 raw Sample、derived train data 与 system state | 避免把组内中心化 reward、schedule 或新权重误认成 Sample 字段 | 内容正确性约束 |
| 2026-08-08 | 采用 `slime Lab`、并列目标用户、`website/`、中文优先和严谨教材视觉 | 关闭 M0 的产品与项目边界歧义 | 已确认 |
| 2026-08-08 | M1 用 vinext 与 typed content 实现强交互首课 | 适配首课的播放器、状态检查与本地进度 | 已确认 |
| 2026-08-08 | M1 中文无前缀，未来英文使用 `/en/...` | 保持当前 URL 简洁，同时以稳定 ID 预留翻译 | 已确认 |
| 2026-08-08 | 只保留 `yehu77/slime` + Cloudflare Workers，退出过渡托管项目与集成 | 让源码、构建和公网生产统一在项目发起人控制的单一链路 | 已确认 |
| 2026-08-08 | 托管迁移先行，M2 前再单独验证 Docusaurus + MDX | 先解决访问问题，不把公开发布与框架重写绑在一起 | 已确认 |
| 2026-08-10 | 采用“叙事层 + 技术层”的双层内容文风 | 让课程既值得读下去，又不牺牲源码、字段与因果的准确性 | 已确认 |
| 2026-08-20 | 正式采用“先讲透机制，再运行实验”的教学顺序 | 避免学习者只会复制命令却无法解释字段、网络边界和失败原因 | 已确认并进入实施 |
| 2026-08-20 | 新增七阶段 `/learn` 路线与首门 88 分钟机制课 | 把系统导论、核心机制、综合检查、实验和修改框架放回同一条可见路线 | 已实现 |
| 2026-08-24 | 首门机制课采用“翻译台 → 生命周期接力台 → 分组实验台”的逐章专属叙事 | 让每章围绕一个可验证机制建立独立认知模型，而不是复用通用说明模板 | 前三章已实现，第四章待建设 |

## 24. 更新记录

- 2026-08-08：建立初版路线，记录愿景、信息架构、课程地图、交互优先级、版本策略、里程碑和协作方式。
- 2026-08-08：完成首课 storyboard，定义七幕、统一 fixture、四个核心交互和 M1 验收标准；当前焦点转为评审与项目边界确认。
- 2026-08-08：确认五项产品默认值，建立 M1 Implementation Brief，关闭 M0 并将当前阶段切换到 M1 初始化就绪。
- 2026-08-08：完成 M1 网站、课程、固定源码证据与自动 gate，并发布 owner-only 私有预览；下一步是项目发起人的目标用户和多视口人工验收。
- 2026-08-08：批准公网发布，确定 GitHub fork + Cloudflare Workers 架构并开始部署准备；独立域名与 M2 内容框架留待后续决策。
- 2026-08-08：完成 Cloudflare Workers 公网发布；将 GitHub + Cloudflare 确认为唯一维护链路，移除过渡托管集成，工作重点转向课程内容。
- 2026-08-10：建立共同维护的内容文风指南，确认以有文学性的叙事型技术写作为默认表达方式，并从学习入口与首课开场开始校准。
- 2026-08-10：完成首课第一幕“出生”的叙事化样板；修正第一幕过早展示四条候选的问题，补齐字段变化、源码证据与第二幕过渡的渐进阅读线。
- 2026-08-20：新增 `/learn` 七阶段路线与《Sample 如何得到回答》六章机制课；引入独立 2×2 fixture、固定源码摘录、结构化练习、终测和 lesson-keyed v2 本地进度，正式把真实实验放到机制理解与综合检查之后。
- 2026-08-24：完成机制课第一章“连续翻译台”和第二章“字段生命周期接力台”的本地实现与多视口验收；当前目标转为第三章分组机制，Cloudflare 预览与合并发布暂缓到恢复登录后执行。
- 2026-08-25：完成机制课第三章“分组实验台”的 2×2 contact sheet、计数器逐拍、别名试纸、三段固定源码证据与 v5 进度升级；当前目标转为第四章请求边界。
