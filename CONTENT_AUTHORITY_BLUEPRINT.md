# slime Lab 权威内容基线与课程重构蓝图

> 状态：内容重构的共享基线
> 建立日期：2026-08-27
> 适用范围：`website/` 中的系统导论、核心机制课与后续课程路线
> 技术基线：`THUDM/slime@06ffdbe22be068b52f9ed0fc318c473f7030197e`

## 1. 为什么需要这份蓝图

slime Lab 目前已经具备固定源码锚点、教学 fixture、课程进度和交互页面，但“技术上可核对”不自动等于“课程讲得好”。现有内容的主要问题不是缺少字段解释，而是缺少一条由 slime 作者问题意识驱动的知识结构：读者在知道框架为什么存在、哪些设计约束最重要之前，就被带进了 `Sample` 字段和局部控制流。

从本轮起，课程内容不再由以下任一方单独决定：

- 不要求初学者替课程作者设计知识顺序；初学者只需如实报告哪里失去方向、哪里不可信、哪里无法复述。
- 不让语言模型凭“常见教学模板”补齐叙事。
- 不因为某篇文章有名，就把其中的旧代码路径当作当前事实。
- 不以更复杂、更像论文的语气代替证据。

课程采用三层来源体系：作者与官方资料决定“为什么这样设计”，高质量专家导读帮助我们组织“怎样讲清楚”，固定 commit 的源码和测试决定“具体事实是否成立”。

## 2. 来源权威等级

### A 级：作者意图与官方设计说明

这一级资料回答框架要解决什么问题、设计目标是什么、哪些边界是作者有意保留的。它们可以决定课程的系统叙事，但不能替代逐行源码核对。

| 来源 | 身份与价值 | 本站用途 | 版本限制 |
| --- | --- | --- | --- |
| [朱子霖《slime：为 RL Scaling 设计的训练框架——一个 infra 视角下的 RL 框架》](https://qingkeai.online/upload/pdf/20250802.pdf) | slime 作者从 infra、框架骨架、性能、正确性和自由度解释设计 | 重写系统导论；定义“为什么需要 slime”和核心设计矛盾 | 演讲解释设计意图，不证明每个字段在固定 commit 中的行为 |
| [slime Team: Introducing slime](https://www.lmsys.org/blog/2025-07-09-slime/) | slime 团队的正式发布文章，解释训练、生成、部署形态与参数更新 | 建立整体架构、Megatron/SGLang/Ray 的角色与同步/异步地图 | 发布时点早于部分当前功能；实现细节仍需固定源码确认 |
| [THUDM/slime 官方仓库](https://github.com/THUDM/slime) | 项目的一手代码、README、提交历史和贡献者记录 | 追踪项目演化、术语和当前入口 | `main` 持续变化，不能用来悄悄改写固定版本课程 |
| [官方 Usage Guide](https://thudm.github.io/slime/get_started/usage.html) | 当前官方使用与架构说明 | 核对当前参数层、SGLang server-based engine 与运行方式 | 代表当前文档，不一定描述 `06ffdbe2` 的历史实现 |
| [官方 Quick Start](https://thudm.github.io/slime/get_started/quick_start.html) | 官方最小运行路径 | 后续实验课的命令、配置和预期产物基线 | 只回答如何运行，不承担机制课的完整解释 |

### B 级：可信专家导读

这一级资料可以作为教学结构和问题设计的参考，但每项技术结论都必须回到 A 级资料或固定源码验证。

| 来源 | 身份与价值 | 本站用途 | 版本限制 |
| --- | --- | --- | --- |
| [赵晨阳《A Brief Code Walkthrough of slime》中文版](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial/blob/main/rlhf/slime/code-walk-through/readme.md) | 由长期参与 LMSYS/SGLang 的作者编写；沿整体 workflow、Ray、Data Source、rollout、reward 和 train data 讲源码，并配有系统图 | 作为首要“讲法参照”：先画系统，再追对象；先问控制流，再看函数 | 文中明确基于较早的 slime commit `261ecee`；不得直接复制路径和结论 |
| [英文版 code walkthrough](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial/blob/main/rlhf/slime/code-walk-through/readme_en.md) | 同一导读的英文版本，便于核对术语 | 统一中英文术语，避免中文改写造成概念漂移 | 与中文版共享同一历史版本限制 |
| [Chenyang Zhao 个人主页](https://zhaochenyang20.github.io/Chayenne/) | 用于确认作者与 SGLang/LMSYS 的关系，而非技术事实 | 说明为什么该导读值得进入参考层 | 身份背书不能替代源码证据 |

这里的“参考”指借鉴问题顺序、图解方式和代码阅读路线，不等于复制文章文字或图片。若未来确需复用原图或长段材料，必须另行核对许可证、保留归属，并优先自行依据固定源码重画。

### C 级：专题一手资料

这些资料不主导入门课程，但会成为后续专题的权威起点。

| 来源 | 适用专题 | 使用方式 |
| --- | --- | --- |
| [Agent-Oriented Design](https://www.notion.so/Agent-Oriented-Design-An-Asynchronous-and-Decoupled-Framework-for-Agentic-RL-2278e692d081802cbdd5d37cef76a547) | agentic rollout、异步与解耦 | 建设高级课程时解释设计动机；再用目标版本源码核对实现 |
| [SGLang: Reproducible RL and Deterministic Inference](https://www.lmsys.org/blog/2025-09-22-sglang-deterministic/) | 正确性、可复现性、推理非确定性 | 用于正确性与诊断课，不提前塞进入门 Sample 课程 |
| [slime Customization Guide](https://github.com/THUDM/slime/blob/main/docs/en/get_started/customization.md) | reward、rollout/agent、扩展点 | 作为“修改 slime”阶段的官方入口；具体代码仍按课程目标版本冻结 |

### D 级：二手文章、搜索结果与社区笔记

未经作者身份、代码版本和引用链核实的“深度解析”、聚合页和转载，只用于发现读者常问的问题，不作为课程事实来源。若一个结论只能在 D 级资料中找到，默认不写入课程；除非我们能在固定源码、测试或 A 级资料中重新证明它。

## 3. 事实判定与标注协议

每条重要技术陈述必须属于下列一种证据类型。页面文案可以不展示内部代号，但内容审查记录必须保存它。

| 内部标签 | 能证明什么 | 不能证明什么 |
| --- | --- | --- |
| `AUTHOR_INTENT` | 作者为什么选择某种架构、希望解决什么问题 | 某个字段在固定 commit 中何时赋值 |
| `PINNED_SOURCE` | `06ffdbe2` 中确定的控制流、数据结构和边界 | 最新 `main` 仍完全相同 |
| `PINNED_TEST` | 固定版本测试覆盖的契约和失败条件 | 未覆盖路径的行为 |
| `OFFICIAL_CURRENT` | 当前官方文档承诺的使用方式与术语 | 历史 commit 的逐行行为 |
| `EXPERT_EXPLANATION` | 可借鉴的心智模型、讲解顺序和读者问题 | 无需核验的实现事实 |
| `TEACHING_FIXTURE` | 本站可复算的示例数值与状态演化 | 真实 tokenizer、checkpoint、性能或生产 trace |
| `TEACHING_INFERENCE` | 从已列证据推导出的教学结论 | 作者明确表态或额外实现保证 |

### 冲突处理顺序

1. 讲固定版本行为时，以 `06ffdbe2` 源码和测试为准。
2. 讲当前使用方式时，以当前官方仓库和官方文档为准，并标注访问日期。
3. 讲设计目的时，以作者演讲和团队文章为准。
4. 专家导读与固定源码不同时，保留导读的问题结构，重写技术内容。
5. 无法判定时明确写“本课不作承诺”，不通过模糊措辞填空。

### 页面最小出处单元

每章在内容数据层至少保存：

- 一个驱动问题；
- 一条可以复述的中心结论；
- 结论的证据类型；
- 固定 commit 的 symbol/ref，或作者资料中的明确章节；
- 适用边界与不适用边界；
- 一个陌生案例，检验学习者能否迁移，而不是认出原句。

## 4. 对当前内容的诊断

### 4.1 系统导论的问题

当前 `/learn/sample-journey` 以“本课只跟踪一个对象：Sample”开场，并很快进入 Dataset、DataSource 和字段变化。这条观察线适合在读者拥有系统地图后验证理解，却不适合作为第一次认识 slime 的起点。

它遗漏了作者资料中更早、更重要的四个问题：

1. 为什么 RL scaling 不是单一训练循环，而是训练、生成、评价和权重可见性的系统问题？
2. slime 需要同时保护哪些目标：训练/推理性能、大规模正确性和用户扩展自由？
3. 为什么选择让 Megatron 与 SGLang 各自在擅长的工作状态中运行，而不是重新包一层统一抽象？
4. Ray、server-based generation、colocated/disaggregated、同步/异步分别解决哪一种系统约束？

因此，七幕 trace 本身不应删除，但应从“课程开场”降为“架构建立后的第一次验证”。现有 fixture、七个源码边界和状态显微镜可以保留；当前开场、90 秒总览和七幕之间的重复说明需要重写。

### 4.2 首门机制课的问题

当前 `/learn/sample-to-generation` 的局部事实已经细化到 Dataset 映射、`deepcopy`、请求 payload、HTTP tuple 和写回坐标，但课程仍存在三个结构问题：

- 第二章“字段生命周期接力台”在因果线中途要求读者先记住大量未来字段，打断了从输入到生成的连续控制流。
- DataSource 分组之后直接进入请求装配，缺少“是谁取得候选、谁调度 generation、SGLang server 在系统中的位置”这一层 orchestration。
- 第五、六章虽刻意区分 response evidence 与 Sample mutation，却没有先在更高层说明为什么客户端必须保留关联对象并分两步处理。

第三章“故障调查”的预测—推演—源码裁判—陌生案例结构可以保留为教学方法标杆，但不应被机械复制成其他章节的外观模板。

## 5. 系统导论的目标结构

系统导论将从“对象漫游”改为“设计问题 → 系统骨架 → 一条 Sample 验证”。建议结构如下。

### 单元 1：为什么普通训练图不够

- 从一次 RL 更新需要新回答、评价信号和新参数可见性开始。
- 明确训练系统与生成系统各自拥有不同的吞吐、内存和调度约束。
- 证据：朱子霖演讲、slime Team 发布文章。
- 完成证据：读者能解释为什么“模型生成了一批回答”不等于“actor 已完成一次可供下一轮使用的更新”。

### 单元 2：不可轻易改动的骨架

- 建立 `rollout/data generation → reward → train data → actor update → weight publication` 骨架。
- 将默认路径与可替换扩展点分开：骨架稳定，不代表每个 reward、rollout 函数或部署形态固定。
- 证据：作者演讲中的框架设计观点、官方发布文章、固定版本入口源码。

### 单元 3：为什么是 Megatron、SGLang 与 Ray

- Megatron 负责高性能训练，SGLang 负责高性能生成；Ray 负责进程与资源编排。
- 解释 server-based engine、参数透传和非侵入式集成的设计收益。
- 不在此处展开完整参数列表、Ray API 或部署命令。
- 证据：作者演讲、团队文章、官方 Usage Guide。

### 单元 4：部署形态与时间关系

- 用一张图比较 colocated / disaggregated 与 synchronous / asynchronous。
- 只回答资源是否共享、数据是否等待、权重何时可见三件事。
- 将可复现性和版本错位问题留给高级正确性课程。

### 单元 5：用一条 Sample 验证骨架

- 此处才启用现有七幕 trace。
- 每一幕不重复教完整机制，只证明：谁读取了什么、产生了什么、交给谁。
- `Sample` 是观察探针，不再被描述为 slime 的全部架构。

### 单元 6：读者现在知道什么、还不知道什么

- 明确导论只提供系统地图。
- 将 Dataset/DataSource/SGLang 写回、reward、train data、actor update 和 weight sync 分配给后续机制课。
- 让读者选择下一门课，但不伪造尚未建设的页面。

## 6. 首门机制课的章节重排

课程边界继续截止在 `sglang_rollout.generate()` 完成写回；reward、collect 和训练不进入本课。需要改变的是叙事顺序，而不是随意扩大范围。

| 目标顺序 | 目标章节 | 现有内容去向 | 核心参考 | 固定源码核验 |
| --- | --- | --- | --- | --- |
| 1 | 外部记录怎样成为协议对象 | 保留现第一章，减少默认字段枚举 | 专家导读的 Data Source 入口；官方术语 | `dataset.construct-sample`、`sample.dataclass` |
| 2 | 同一道题为什么得到多个独立候选 | 将现第三章前移；保留故障调查方法 | 专家导读的 Data Source fan-out | `rollout.datasource-get-samples`、counter refs |
| 3 | 谁把候选送进 generation | 新增 orchestration 章节，补足当前缺口 | 专家导读的 overall workflow / rollout controller；官方 Usage Guide | 需要在固定 commit 建立新的 controller/call-chain refs |
| 4 | 为什么跨网络的只是最小投影 | 重写现第四章的开场，保留 payload 证据 | 官方 server-based engine 说明 | `_prepare_prompt_ids`、`GenerateState`、request refs |
| 5 | 为什么 HTTP response 仍只是证据 | 保留现第五章边界，先解释调用方为何持有 Sample | 专家导读的 generate path | HTTP decode、response decode、handoff refs |
| 6 | 写回怎样兑现数据契约 | 保留现第六章的双坐标与失败边界 | 固定源码为主 | append、terminal、metadata validation refs |

现第二章“字段生命周期接力台”不再作为独立顺序章节。它改为课程常驻的“字段来源账本”：每经过一个真实生产者，只揭示本阶段首次产生或变得可信的字段。这样字段所有权成为贯穿六章的检索工具，而不是在第二章提前背诵未来状态。

### 每章不再套用统一说明模板

六章共享证据标准，但不共享同一构图。每章应由其真实认知任务决定形态：

- row → Sample：schema 翻译与构造调用；
- grouping：故障调查与反事实复制实验；
- orchestration：调用图和资源时间线；
- request：协议边界与 payload diff；
- response：分层解码与关联证据；
- writeback：状态机、坐标不变量和失败时序。

## 7. 现有课程路线与权威资料映射

| 路线单元 | 首要问题 | 主参考 | 事实基线 | 当前决策 |
| --- | --- | --- | --- | --- |
| Stage 02 系统导论 | slime 为什么存在，骨架是什么 | 作者演讲、团队发布文章 | 固定入口源码 + 官方当前文档 | **最先重写** |
| Sample → generation | 一条输入怎样形成候选、请求与写回 | 赵晨阳 code walkthrough 的讲法 | `06ffdbe2` Dataset/DataSource/generate/Sample refs | **第二步重排** |
| generation → reward | 回答何时被评价，group 为何要完整 | 官方 customization + 导读 reward 路径 | 需要新增固定 reward/collect refs 与测试 | 保持计划中，先做来源档案 |
| reward → train data | Sample 怎样被消费并派生训练数据 | 导读的 Sample/train-data 路径 | 已有 convert/schedule refs，仍需完整审计 | 保持计划中 |
| train data → update | trainer 真正消费什么，何时更新 | 团队文章、官方 Usage Guide | actor train refs 与 contract tests | 保持计划中 |
| weight sync | 新参数何时对下一次生成可见 | 团队文章、作者演讲 | update-weights refs、版本 fixture | 保持计划中 |
| 最小实验 | 如何用运行结果验证机制 | 官方 Quick Start | 冻结配置、日志与产物 hash | 机制课后建设 |
| 修改 slime | 如何安全替换 reward/rollout/filter | 官方 Customization Guide | 目标版本扩展点与契约测试 | 实验后建设 |
| 异步与诊断 | 如何区分时序、正确性和性能故障 | Agent-Oriented Design、SGLang deterministic 文章 | 专题版本源码与可复现实验 | 最后建设 |

## 8. 内容生产流程

任何新课或大改章节必须经过以下顺序；视觉实现不能先于内容证据包。

### 8.1 来源档案

为课程建立一页 source dossier：

- 作者/官方资料中与本课直接相关的设计问题；
- 专家导读可借鉴的讲解结构；
- 固定 commit 的入口函数、关键 symbol、测试与已知分支；
- 当前官方文档与固定版本的差异；
- 明确排除的二手说法。

### 8.2 课程论证

在写正文前先完成：

- 一句话中心命题；
- 三到六个学习目标；
- 读者进入课程前已知什么；
- 课程停止在哪个系统边界；
- 一条贯穿 trace；
- 至少一个能够推翻错误心智模型的反例；
- 结课时读者必须能独立完成的陌生任务。

### 8.3 内容草稿

正文优先采用：问题 → 模型 → trace → 源码裁判 → 陌生案例。只有当认知任务确实需要时才使用字段表、卡片、时间线或播放器。不得为了视觉统一把不同机制塞进同一种模板。

### 8.4 技术审查

逐条检查：

- 所有实现陈述是否能映射到固定 ref 或 test；
- 文章、当前文档和固定源码是否发生版本混用；
- 教学 fixture 是否被误写成真实 tokenizer、性能数据或生产 trace；
- “默认路径”“可选路径”“作者目标”和“本站推论”是否清楚分开；
- 引文与改写是否保留来源，是否避免大段复制。

### 8.5 初学者验收

初学者不需要提出解决方案，只回答：

- 我现在能否说出这一节要解决的问题？
- 第一次失去方向发生在哪句话或哪张图？
- 哪个结论让我觉得像作者随口说的，为什么？
- 我能否不用页面原句复述机制？
- 面对换过数值和命名的案例，我还能判断第一个错误边界吗？

这类反馈由课程作者转化为结构、措辞或交互改动，而不是反过来要求初学者设计页面。

## 9. 内容完成标准

一章只有同时满足以下条件，才可以进入视觉精修：

- 驱动问题来自真实系统矛盾，而不是为了容纳某个字段清单；
- 中心结论能在两句话内复述；
- 每条关键事实有来源类型与版本边界；
- 至少一次展示真实控制流或数据变化，而非只给定义；
- 至少一个常见误解能由证据推翻；
- 练习使用未在正文完整展示过的案例；
- 图片承担定位、比较、节奏或隐喻中的明确职责，不承载唯一技术信息；
- 学习者始终知道本节位于系统骨架的哪一段，以及下一步为什么自然发生。

## 10. 明确禁止的内容做法

- 用“MIT PhD 口吻”、复杂句式或机构名称制造可信感。
- 把一篇高 star 导读当作无需核验的规范。
- 为了显得详细而逐字段复述 dataclass。
- 把当前官方文档的行为倒灌到冻结的历史 commit。
- 用拟人或文学比喻替代系统职责和数据结构。
- 在答案出现前没有提出值得解决的问题。
- 把同一个结论在首页、开始页、系统导论和机制课重复四次。
- 因为已有组件方便，就让所有章节长成同一种卡片、表格或播放器。

## 11. 下一轮执行顺序

### Phase 1：重写系统导论的内容骨架

1. 建立作者资料摘记和固定源码入口图。
2. 按“设计问题 → 系统骨架 → 技术选择 → 部署/时间关系 → Sample 验证”写无 UI 的课程脚本。
3. 将现有七幕逐一标为保留、合并或移至深入证据。
4. 进行一次技术审查和一次初学者纸面审读。
5. 内容通过后再设计新的页面叙事。

当前 Phase 1 工作稿：

- [Stage 02 系统导论来源档案](website/content/zh/research/system-intro-source-dossier.md)
- [Stage 02 系统导论无 UI 课程脚本](website/content/zh/research/system-intro-course-script.md)

### Phase 2：重排 Sample → generation 机制课

1. 将字段生命周期改为贯穿式来源账本。
2. 把 grouping 提前为第二章。
3. 补建 orchestration 章节及固定源码 refs。
4. 重写 request/response/writeback 三章的因果连接。
5. 重新设计终测，使其同时检查调用关系、数据边界和首错定位。

### Phase 3：再决定视觉系统推广

只在前两阶段的内容可独立阅读后，重新决定每一章需要的图、动画和交互。第三章故障调查可以保留为一种教学范式，但不成为全站模板。

## 12. 本轮不做的事

- 不立即重写 React 页面或 CSS。
- 不删除现有 fixture、源码锚点、进度或已发布路由。
- 不开始 Reward、训练或权重同步课程。
- 不因为发现更“新”的官方文档就更换课程基线。
- 不复用外部文章图片或长段文字。

这份蓝图先确立内容权威和课程顺序。下一次实际建设从 Stage 02 系统导论的 source dossier 与无 UI 课程脚本开始。
