---
name: slime Lab
description: 一座把强化学习闭环铺成七幕原画与七阶段课程路线、把技术证据放上透写台的中文学习工作台。
colors:
  blueprint-navy: "#132a43"
  desk-navy: "#091b2d"
  cel-paper: "#f2efe7"
  layout-paper: "#faf8f2"
  correction-red: "#d94e55"
  registration-blue: "#3d9eae"
  pencil-blue: "#315d98"
  state-yellow: "#e8c84a"
  muted-ink: "#5c6f7b"
typography:
  display:
    fontFamily: '"Slime Display SC", "Noto Sans CJK SC", "PingFang SC", sans-serif'
    fontSize: "clamp(42px, 3.52vw, 56px)"
    fontWeight: 800
    lineHeight: 1.16
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Avenir Next", "PingFang SC", "Noto Sans CJK SC", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: '"SFMono-Regular", "Cascadia Code", ui-monospace, monospace'
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
  code:
    fontFamily: '"SFMono-Regular", "Cascadia Code", ui-monospace, monospace'
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: "normal"
rounded:
  sheet: "0px"
  peg: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "22px"
  xl: "42px"
components:
  act-one-action:
    backgroundColor: "{colors.state-yellow}"
    textColor: "{colors.blueprint-navy}"
    rounded: "{rounded.sheet}"
    padding: "8px 12px"
    height: "44px"
  learning-compass:
    backgroundColor: "{colors.blueprint-navy}"
    textColor: "{colors.layout-paper}"
    rounded: "{rounded.sheet}"
    padding: "8px 14px"
    height: "68px"
  layout-sheet:
    backgroundColor: "{colors.layout-paper}"
    textColor: "{colors.blueprint-navy}"
    rounded: "{rounded.sheet}"
    padding: "22px"
  lighttable-trigger:
    backgroundColor: "{colors.blueprint-navy}"
    textColor: "{colors.layout-paper}"
    rounded: "{rounded.sheet}"
    padding: "8px 14px"
    height: "68px"
  course-action:
    backgroundColor: "{colors.blueprint-navy}"
    textColor: "{colors.layout-paper}"
    rounded: "{rounded.sheet}"
    padding: "11px 20px"
    height: "48px"
  status-drawer-close:
    backgroundColor: "{colors.state-yellow}"
    textColor: "{colors.blueprint-navy}"
    rounded: "{rounded.sheet}"
    padding: "8px 16px"
    height: "44px"
---

# Design System: slime Lab

## Overview

**Creative North Star: “七幕原画台 / Film Reader”**

slime Lab 把一条 Sample 当作持续出场的主角，把七个技术环节编排成可逐格核对的关键原画。原画纸、曝光表、装订孔、赛璐璐、胶带、校正铅笔和透写台都承担真实的信息职责：它们组织阅读、标记状态、承载证据，而不是附着在通用文档站上的装饰。

首页负责给出完整系统命题和唯一入口，开始页负责交付这条 Sample，`/learn` 则把课程组织成七阶段连续曝光表。七幕是系统总览里的技术闭环；七阶段是从可选诊断、机制学习到实验与高级诊断的学习路径，两者都保持顺序，但不可混为同一层级。

系统总览继续使用单一 Film Reader 舞台；机制课把同一套原画制作语言延伸为长篇讲义、固定提交源码证据、结构化练习与 Sample 状态抽屉。全站学习页面共用 Header 内唯一的“学习罗盘”，不再各自叠加第二条章节运输轨。机制课不复制事件播放器，因为章节阅读的主任务是解释边界与因果，而不是逐事件播放时间线。

**Key Characteristics:**

- 首页第一折固定为左侧标题原画纸、右侧 key cel；两者相邻而非套入通用 split-hero 卡片。
- 七幕曝光表是一张连续工作表，Act 01 承载首页唯一 CTA，其余六幕只预告状态变化。
- 首页第二折是深海军蓝工作台上的课程纸与 Sample 参考原画，形成明确的滚动换场。
- 开始页以地平线关键帧和叠放标题纸开场，随后是一张连续研究讲义，而非阶段卡片墙。
- `/learn` 是行动页：先给出精确的“现在”和“下一步”，计划中内容收进默认折叠的“以后”，完整七阶段曝光表按需展开。
- 系统总览只有一个 Film Reader 舞台；Sample 显微镜以可唤出的透写台存在。
- 首门机制课是六章连续 Reader：Header 学习罗盘负责定位，状态抽屉负责字段比较，正文不出现第二套播放器。

## Colors

底色接近真实原画纸，海军蓝稳定阅读结构；校正红、注册蓝与状态黄只作为动画制作标记使用。课程路线、Film Reader 与机制课可以使用同色相的局部深浅变体，但不能改变它们的语义。

### Primary

- **蓝图海军蓝**（`#132a43`）：标题、结构线、播放器与透写台抬头。
- **深台面海军蓝**（`#091b2d`）：首页第二折和需要明确换场的工作台背景。

### Secondary

- **注册蓝**（`#3d9eae`）：套准线、焦点轮廓、字段连接和辅助状态。
- **校正红**（`#d94e55`）：幕次落点、进度游标、批改与纠偏。
- **状态黄**（`#e8c84a`）：Act 01 主入口、当前幕和当前可执行动作。
- **蓝铅笔**（`#315d98`）：源码记录、场号与次级技术批注。

### Neutral

- **赛璐璐纸白**（`#f2efe7`）：全站主背景。
- **原画纸白**（`#faf8f2`）：标题纸、曝光表、讲义和正文纸。
- **灰蓝墨色**（`#5c6f7b`）：说明、字幕与非当前信息。

**The Production-Mark Rule.** 纸白承载阅读，海军蓝承载运输轨、源码和结构；状态黄只标当前项或当前动作，校正红只标进度、修订与差异，注册蓝只标焦点、连接和证据。无任务时不要使用三种标记色。

## Typography

**Display Font:** 自托管 `Slime Display SC`，文件为 `website/public/fonts/noto-sans-sc-display-800.woff2`。它是 Noto Sans SC 800 的标题字符子集，仅用于首页开场与少量大标题；上游 OFL 许可证保存在 `website/public/fonts/OFL-Noto-Sans-SC.txt`。
**Body Font:** Avenir Next 与 PingFang SC，回退至 Noto Sans CJK SC；中文技术正文保持熟悉、安静的阅读质感。
**Label/Mono Font:** SFMono-Regular 与 Cascadia Code，仅用于字段、幕号、场号、源码基线和制作记录。

**Character:** 展示字像原画纸上的粗铅笔题签，字面紧、重量稳定；正文以较长行距承载研究型解释；等宽字只负责可验证的技术记录。

### Hierarchy

- **Display**（800，首页 `42–56px`，1.16）：首页核心命题和课程第二折标题。
- **Lesson Display**（870–880，响应式 `34–82px`，约 1.0）：首课开场和当前幕标题。
- **Title**（760–840，`18–44px`）：阶段、预测、事件与证据标题。
- **Body**（400，至少 `16px`，1.65–1.95）：Read 模式的中文技术叙事、说明、反馈与动作文本，行长限制在 `68–72ch`。
- **Code**（500，至少 `13px`，1.65–1.75）：源码、字段值、before/operation/after 与状态账本；允许横向滚动，不压缩字号。
- **Label**（700，`7–11px`，`0.08em`）：只用于英文/数字场号、幕号和非必要制作记录；中文含义不得依赖这一尺寸。

**The Two-Voices Rule.** 中文叙事使用正文声部，系统记录使用等宽声部；手写批注只出现在不影响理解的校正标记中。

**The Readability Floor Rule.** Read 模式正文宽度保持 `68–72ch`，中文信息不得小于 `16px`，代码不得小于 `13px`，可操作控件的命中区域不得小于 `44×44px`；窄屏应重排或横向浏览，不通过缩字解决。

## Layout

首页第一折使用近似等宽的两格开场：左侧标题原画纸，右侧带装订孔、胶带和字幕的 key cel。其下是一张横向贯通的七幕曝光表，七格共享外框、索引和制作记录；唯一主入口嵌在 Act 01 图格底部。第二折切换到深海军蓝工作台，以一张 Sample 参考原画和一张浅色课程纸构成不对称叠放。

开始页的地平线关键帧承担场景，标题纸以物理叠放关系覆盖其上；下面的角色生命周期、可选诊断折页和 Sample 交接说明均属于一张连续长讲义，主要动作只在讲义末尾出现。

`/learn` 是行动页，不是课程卡片目录。首屏只展开最近活动的“现在”和按课程顺序推导的“下一步”；可选诊断保持次级，计划中课程与实验收进“以后”，不提供伪链接。完整七阶段曝光表保留在折叠的课程路线中，Stage 03 仍嵌五门核心机制课；系统总览末尾只保留回到行动页的出口。

系统总览是单一 Film Reader 舞台：顶部七幕运输轨保持当前位置，正文、关键原画、预测、事件和证据沿同一纵向版心展开。Sample 显微镜不常驻为第三栏；学习者触发后，透写台从右侧滑入。

所有学习页面在站点 Header 内共享一条深海军蓝学习罗盘，持续显示阶段、课程、章/幕、章内阶段与下一动作；点击位置摘要打开完整课程地图。机制课正文仍是单列长篇 Reader，桌面状态抽屉从右侧覆盖进入，窄屏改为底部抽屉；它不挤出常驻第三栏，也不复制 Film Reader 的事件播放器。章内统一使用 `orient / model / verify / practice` 四个稳定锚点，但每章用自己的中文阶段名与视觉叙事。

第三章是后续课程的质量标杆：四阶段分别采用故障案卷、机制推演桌、源码裁判台与陌生案例结案报告。首屏只展示明确标注的假想故障，不泄露正确矩阵；学习者留下首次判断后，才看到实际 trace 与源码证据。五组动漫素材分别承担未知、同源不同对象、别名污染、编号秩序与结案回响，不把图片当作重复头图。

主要节奏使用 4、8、14、22、42px。首页在约 1100px 缩紧，在 800px 改为单列，在 560px 进入紧凑排版；Film Reader 在 1180px 精简舞台，在 860px 改为单列。学习罗盘在桌面展开完整位置，在 390px 与品牌行合计约 110px，并以 `S03 · C01 · 3/6 · 2/4`、下一动作与四段进度线保留方向感。宽幅纸张可占满工作台，但 Read 正文继续保持 `68–72ch`。

**The One-Frame Rule.** 每个视口只有一个主要阅读焦点和一个主要动作；导航、证据和实验工具必须退到运输轨、折页或透写台。

## Elevation & Depth

深度来自纸张、赛璐璐和工作台的真实叠放关系。`layout-paper-texture-v1.webp` 是 1024×1024 的低对比纸纤维纹理，用于赛璐璐纸、标题纸、曝光表和课程纸；它必须维持安静，不能压过正文或模拟噪点滤镜。关键原画可轻微旋转并用胶带固定，普通信息块不获得独立悬浮阴影。

### Shadow Vocabulary

- **纸张抬起**（`0 12px 30px rgb(19 42 67 / 13%)`）：连续曝光表、标题纸和普通工作纸。
- **关键原画**（`0 18px 36px rgb(19 42 67 / 15%)`）：每个视口中唯一主要 key cel。
- **Film Reader 开场**（`0 20px 54px rgb(19 42 67 / 11%)`）：课程开场工作表。
- **透写台**（`-24px 0 64px rgb(5 18 31 / 28%)`）：从右侧出现的 Sample 显微镜。
- **状态抽屉**（`-18px 0 40px rgb(5 17 27 / 24%)`）：机制课里覆盖正文、对比前后字段的临时工作层。

**The Desk-Not-Dashboard Rule.** 阴影必须说明某张纸或某层赛璐璐位于另一层之上；不能给每个容器套上相同的“高级感”阴影。

## Shapes

主要容器、按钮、轨道、折页和字段行保持 0px 方角。装订孔、注册点和物理轨迹可以使用完全圆角，因为圆形属于这些物件的结构。细海军蓝线负责纸张边界，注册蓝线负责套准与焦点，校正红线负责当前进度。轻微旋转只用于真实纸层或 key cel，不用于普通列表项。

## Components

### Buttons

- **Shape:** 方正，像曝光表中的可按格；不使用通用胶囊按钮。
- **Primary:** 状态黄底、海军蓝字。首页仅存在于 Act 01；开始页只出现在长讲义末尾；课程中只标记当前可执行动作。
- **Hover / Focus:** 悬停提亮或让箭头前进 3px；键盘焦点使用 3px 注册蓝轮廓。减少动态偏好下取消非必要位移。
- **Secondary:** 纸白或透明底配 1px 结构线，不能与黄色主动作争夺注意力。

### Paper Surfaces

- 标题原画纸、长讲义和课程纸共享方角、细线、低对比纸纹与结构性柔影。
- 胶带、套准线、装订孔和制作字段必须与纸张边缘或信息网格对齐。
- 不把同尺寸纸块重复成卡片墙；连续过程应使用曝光表、轨道或长讲义。

### 七幕曝光表

- 七个 actor 按固定顺序共用一张外框、索引和底部制作记录。
- 每格包含幕号、actor、专属关键帧、状态短句与场号；图片不得跨幕重复填充。
- Act 01 内嵌首页唯一 CTA，Act 02–07 不可出现等权动作。
- 窄屏整表横向滚动，保持因果顺序和同一 Sample 的注册标记。
- 当前 `local-library-v1` 关键帧组来自用户确认可公开使用的本地开源素材库；素材库内相对来源标识与机械处理链记录在各 shipping WebP 相邻的 `.json` sidecar 中。首页缩略图必须从对应课程全尺寸 keyframe 确定性派生，并在 sidecar 中保留同一原始来源链。

### Start Handout

- 地平线关键帧与标题纸构成“第零幕：领样本”；标题纸在桌面叠放，在窄屏按阅读顺序下落。
- 三个阶段由一条连续生命周期脊线连接；课前诊断是纸张折页，不阻塞首课。
- Sample 交接说明和唯一课程 CTA 构成长讲义的结尾。

### 七阶段课程曝光表

- 固定顺序为：01 可选课前诊断；02 系统总览；03 五门核心机制课；04 综合 trace 诊断；05 最小实验；06 修改 slime；07 异步、正确性与性能诊断。
- 当前有效入口为 01 `/start#preflight`、02 `/learn/sample-journey`，以及 Stage 03 的首门课 `/learn/sample-to-generation`；其余单元保持计划中。
- 前置关系只给建议，不做硬锁；已开放内容始终可进入。计划中内容明确显示状态而不伪造入口，实验从 Stage 05 开始。
- 每一阶段都回答“学什么问题、以什么作为完成证据、建议先学什么、当前能否进入”；Stage 03 再嵌五门按生产链排序的机制课。
- 首门机制课为“Sample 如何得到回答——从一行输入到 SGLang 写回”，包含六章与终测；其余机制课保持计划中状态，不能用空壳详情页冒充开放。
- 完整版只用于 `/learn`；系统总览末尾可以使用紧凑版，但仍保持阶段顺序、当前状态和“查看课程总路线”的出口。

### Film Reader

- 七幕运输轨固定在站点导航下方；当前幕由状态黄和校正红明确标出。
- 单一阅读舞台承载幕标题、预测、播放器、叙事、key cel、字段变化和深入证据。
- 播放器是深海军蓝运输条，注册红游标与实际事件状态同步；它不变成独立仪表盘。
- 播放器属于有事件时间线的系统总览，不是所有课程页的通用组件。

### Mechanism Course Reader

- 继承“七幕原画台”的纸张、海军蓝工作层、校正红与状态黄语法，但按课程自己的六章信息架构组织，不复制七幕播放器。
- 深海军蓝运输轨固定在站点导航下方，依次提供课程封面、六章、终测与状态账本；当前章用黄底和红色底线，已通过练习显示在章状态中。
- 每章固定为：关键原画与问题 → I/O 边界 → before / operation / after → 因果解释 → 固定提交源码证据 → 结构化练习 → 误区校正 → 可选进阶 → 章节记忆 → 前后章动作。
- 源码证据使用深海军蓝纸层、至少 `13px` 等宽字和可横向滚动的真实文本；练习使用原生 radio、checkbox、select、input 与 button，并提供可重试的文字反馈。

### Sample 透写台与状态抽屉

- 两者默认关闭，只保留运输轨上的明确触发按钮；不能成为挤压正文的常驻第三栏。
- Film Reader 透写台展示系统总览字段；机制课状态抽屉只比较当前观察点与前一观察点，状态黄底加校正红线只标“本步写入”的字段。
- 打开时配有遮罩、语义化 modal dialog、固定抬头和可见关闭按钮；桌面从右侧进入，窄屏从底部进入。
- 技术字段仍是语义化文本与控件，不能烘焙进图片。

### Progress States

- 本地进度使用 `slime-lab:progress:v2`，顶层必须是按稳定 lesson id 分隔的 `lessons` 映射；系统总览与每门机制课各自拥有 `lesson_revision`、已访问 section、练习尝试、终测、resume 和更新时间。
- 完成状态由每课 manifest 的必访 section、必过练习与终测条件共同计算；课程路线只消费 `not_started`、`in_progress`、`completed`、`review_required` 四种学习状态。
- 当 lesson revision 或 assessment version 与 manifest 不一致时显示 `review_required`：旧记录继续保留并提示复习，但不再宣称已完成。仅阅读新版不能静默覆盖旧记录；学习者明确切换章节或提交进度事件后，才为该 lesson 建立当前版本记录。
- 本地存储不可用或旧数据无效时，阅读与练习仍可用；失败不得把课程变成阻塞页。
- `learning_artifacts` 保存不参与完成判定的首判：首次已提交答案不可覆盖，跳过后只允许补交一次；`review_required` 下被动加载与滚动不能创建新版记录。

### Learning Compass

- 学习罗盘是学习页面唯一常驻导航层；桌面持续显示 Stage、Course、章/幕、四阶段当前位置和下一动作，课程封面与完整目录放进可关闭地图。
- 移动端第一行保留品牌、文字入口“课程路线”和“菜单”，第二行保留压缩位置、下一动作与四段进度；开始、课程、术语、源码必须在菜单中以文字出现。
- 章节或阶段的明确点击使用 `pushState`；滚动定位使用约 400ms 防抖后的 `replaceState`；Back/Forward 恢复 URL、滚动目标与标题焦点。
- 非学习页面只显示精确的“继续学习”入口，不展开罗盘；无效 hash 回到章节开头且不写入进度。

### Keyboard and Motion

- 所有章节、练习、前后页与抽屉动作都使用原生可聚焦控件；页面内切章、浏览器前进/后退后，把焦点移到新章节标题并保持可理解的 URL。
- 打开抽屉时聚焦关闭按钮并让背景 inert；`Escape`、遮罩或关闭按钮均可关闭，`Tab` 保持在 modal 内，关闭后焦点恢复到原触发按钮。
- 全局 `:focus-visible` 使用清晰的 3px 注册色轮廓；不可只靠 hover 表达状态。
- `prefers-reduced-motion: reduce` 下取消非必要 transition 与平滑滚动；定位、状态反馈和焦点移动仍必须发生。

### Navigation

顶部导航安静、细小、无胶囊底。移动端隐藏次要文字，但保留品牌、当前幕、课程移动和透写台入口。

## Do's and Don'ts

### Do:

- **Do** 让每张动漫图成为某一幕的关键帧，并与 Sample 的当前状态或系统边界对应。
- **Do** 使用自托管 `Slime Display SC` 标题子集，并随发布保留 Noto OFL 许可证。
- **Do** 用 `layout-paper-texture-v1.webp` 建立连续纸张材质，保持低对比和可读性。
- **Do** 保留语义化标题、列表、按钮、字段和替代文本；图片不是理解课程的前提。
- **Do** 在 Read 表面执行 `68–72ch` 正文、中文至少 `16px`、代码至少 `13px`、控件命中区域至少 `44×44px` 的下限。
- **Do** 为键盘焦点、`Escape`、modal 焦点约束与恢复、减少动态偏好、横向浏览和移动端单列阅读提供完整状态。
- **Do** 让进度始终按 lesson id 隔离，并让 `review_required` 明确表示“旧记录保留，但需按新版本复习”。
- **Do** 为每个来自本地开源素材库的 shipping WebP 保存相邻 `.json`：记录素材库内相对来源标识、实际取得的权利确认、完整确定性处理链、输出尺寸/格式与日期；派生图再记录 `derivedFrom`。不要公开贡献者机器上的绝对路径。
- **Do** 对生成 raster 记录精确提示；本地素材没有具体许可证名称时如实注明，不推断或补造名称。

### Don't:

- **Don't** 回到浅底圆角卡片阵列、通用 split hero、玻璃拟态或传统文档站侧栏。
- **Don't** 在首页 Act 02–07、课程第二折或其它装饰区域复制主 CTA。
- **Don't** 把 Film Reader 再拆成常驻的幕轨、正文和显微镜三栏仪表盘。
- **Don't** 为了延续“七幕原画台”而把事件播放器复制进机制课；运输轨和状态抽屉已经承担章节定位与字段核对。
- **Don't** 把建议前置做成硬锁，或让计划中阶段出现伪入口。
- **Don't** 用单例进度覆盖多门课，也不要在 revision 不匹配时静默把旧完成状态升级为当前完成。
- **Don't** 跨幕复用同一关键帧填空，或让图片中的文字代替真实技术数据。
- **Don't** 发布缺少来源 sidecar 的本地 WebP、丢失派生链，或把“用户确认可公开使用”改写成未经证实的具体许可证。
- **Don't** 使用大面积装饰渐变、霓虹、发光描边、硬偏移阴影、胶囊标签或无任务的制作批注。
