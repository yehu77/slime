"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearLessonProgressV2,
  evaluateLessonProgressV2,
  isLessonProgressCurrentV2,
  replaceLearningProgress,
  recordLearningProgress,
  useLearningProgress,
  type ProgressEvent,
} from "../../core/progress";
import type {
  FinalAssessmentGrade,
  StructuredExerciseAnswer,
} from "../../core/sample-to-generation";
import {
  sampleJourneyProgressManifest,
  sourceRefLabels,
  systemIntroManifest,
  type SystemIntroClaim,
  type SystemIntroPhaseId,
  type SystemIntroUnit,
  type SystemIntroUnitId,
} from "../../content/zh";
import {
  useLearningCompassRegistration,
  type LearningCompassTarget,
} from "../site/learning-compass-store";
import { SampleTraceLab, sampleTraceFixture } from "./SampleTraceLab";
import { SystemIntroAssessment } from "./SystemIntroAssessment";
import {
  resolveSystemIntroLocation,
  systemIntroPhaseOrder,
} from "./system-intro-location";
import type { TimelineMode } from "./types";
import "./system-intro.css";

const phaseOrder = systemIntroPhaseOrder;

const evidenceLabels = {
  "author-intent": "作者意图",
  "pinned-source": "固定源码",
  "teaching-inference": "教学推论",
} as const;

const unitImages: Partial<Record<SystemIntroUnitId, {
  wide: string;
  portrait: string;
  alt: string;
  caption: string;
}>> = {
  "loop-boundary": {
    wide: "/art/system-intro-unit-01-wide.webp",
    portrait: "/art/system-intro-unit-01-portrait.webp",
    alt: "雨水覆在窗面，远处城市灯光被玻璃分隔",
    caption: "氛围关键帧：同一时刻，不同窗口可能仍看见不同版本。",
  },
  "stable-skeleton": {
    wide: "/art/system-intro-unit-02-wide.webp",
    portrait: "/art/system-intro-unit-02-portrait.webp",
    alt: "机甲结构正在被逐层装配",
    caption: "教学隐喻：技术骨架由 HTML 图解，插画只承担“装配”节奏。",
  },
  "backend-roles": {
    wide: "/art/system-intro-unit-03-wide.webp",
    portrait: "/art/system-intro-unit-03-portrait.webp",
    alt: "人物位于成排设备与机柜之间",
    caption: "氛围关键帧：资源与服务存在于不同责任面；它不是架构证明。",
  },
  "placement-and-time": {
    wide: "/art/system-intro-unit-04-wide.webp",
    portrait: "/art/system-intro-unit-04-portrait.webp",
    alt: "人物站在铁路交叉口，轨道向不同方向延伸",
    caption: "教学隐喻：资源放置与时间关系是两条不同坐标轴。",
  },
  "architecture-reconstruction": {
    wide: "/art/system-intro-unit-06-wide.webp",
    portrait: "/art/system-intro-unit-06-portrait.webp",
    alt: "夜色中的空教室与摊开的学习现场",
    caption: "结案关键帧：系统地图完成，细节课程从这里继续。",
  },
};

const skeletonStages = [
  ["获得 rollout 输入", "Data Source 与任务输入策略"],
  ["生成回答", "默认或 custom rollout / agent"],
  ["评价结果", "reward 与 group 后处理"],
  ["转换训练数据", "Sample → train data → schedule"],
  ["更新 actor", "Megatron optimizer step"],
  ["发布权重", "rollout engines 看见新版本"],
] as const;

const roleRows = [
  {
    id: "megatron",
    owner: "Megatron training side",
    owns: "参数、梯度、optimizer state、分布式训练过程",
    action: "消费 train data，执行 optimizer step",
    boundary: "训练完成不等于生成服务已更新",
  },
  {
    id: "sglang",
    owner: "SGLang generation side",
    owns: "在线请求、token generation、推理时参数副本",
    action: "响应生成请求，返回 response 证据",
    boundary: "生成正常终止不等于 reward 为正",
  },
  {
    id: "ray",
    owner: "Ray orchestration primitives",
    owns: "placement、remote task 与 actor 通信能力",
    action: "提供启动、等待和资源编排原语",
    boundary: "Ray 不会替 slime 决定控制流语义",
  },
] as const;

function phaseDomId(unitId: SystemIntroUnitId, phaseId: SystemIntroPhaseId) {
  return `system-intro-${unitId}-${phaseId}`;
}

function findPhaseElement(unitId: SystemIntroUnitId, phaseId: SystemIntroPhaseId) {
  return document.getElementById(phaseDomId(unitId, phaseId));
}

function buildUnitHref(unitId: SystemIntroUnitId, phaseId: SystemIntroPhaseId) {
  return `/learn/sample-journey?unit=${encodeURIComponent(unitId)}#${phaseId}`;
}

function EvidenceRibbon({ claim }: { claim: SystemIntroClaim }) {
  return (
    <article className={`system-evidence is-${claim.evidenceKind}`}>
      <header>
        <span>{evidenceLabels[claim.evidenceKind]}</span>
        <strong>{claim.statement}</strong>
      </header>
      <dl>
        <div><dt>适用边界</dt><dd>{claim.scope}</dd></div>
        <div><dt>可以推出</dt><dd>{claim.canConclude}</dd></div>
        <div><dt>不能推出</dt><dd>{claim.cannotConclude}</dd></div>
      </dl>
      <footer>
        <div aria-label="固定源码证据">
          {claim.sourceRefIds.map((sourceRefId) => (
            <a href={`/source#${sourceRefId}`} key={sourceRefId}>
              <code>{sourceRefLabels[sourceRefId]?.symbol ?? sourceRefId}</code>
            </a>
          ))}
        </div>
        {claim.sourceLinks?.map((source) => (
          <a href={source.href} key={source.href} rel="noreferrer" target="_blank">
            {source.title} ↗
          </a>
        ))}
      </footer>
    </article>
  );
}

function UnitPicture({ unit, eager = false }: { unit: SystemIntroUnit; eager?: boolean }) {
  const image = unitImages[unit.id];
  if (!image) return null;
  return (
    <figure className="system-unit-picture">
      <picture>
        <source media="(max-width: 620px)" srcSet={image.portrait} />
        <img
          alt={image.alt}
          fetchPriority={eager ? "high" : "auto"}
          height="900"
          loading={eager ? "eager" : "lazy"}
          src={image.wide}
          width="1600"
        />
      </picture>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}

function PhaseSection({
  unit,
  phase,
  className = "",
  children,
}: {
  unit: SystemIntroUnit;
  phase: SystemIntroPhaseId;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`system-unit-phase system-unit-phase--${phase} ${className}`.trim()}
      data-system-phase={phase}
      data-system-unit={unit.id}
      id={phaseDomId(unit.id, phase)}
      tabIndex={-1}
    >
      {children}
    </section>
  );
}

function UnitHeading({ unit }: { unit: SystemIntroUnit }) {
  return (
    <header className="system-unit-heading">
      <span aria-hidden="true">UNIT {String(unit.order).padStart(2, "0")}</span>
      <div>
        <h2>{unit.title}</h2>
        <p>{unit.drivingQuestion}</p>
      </div>
      <small>{unit.durationMinutes} 分钟</small>
    </header>
  );
}

function ClaimSet({ unit }: { unit: SystemIntroUnit }) {
  return (
    <div className="system-evidence-set">
      {unit.claims.map((claim) => <EvidenceRibbon claim={claim} key={claim.id} />)}
    </div>
  );
}

function PolicyVersionLine() {
  return (
    <ol className="system-policy-line" aria-label="actor policy 版本线">
      {systemIntroManifest.policyVersionLine.map((step, index) => (
        <li className={`is-${step.version}`} key={step.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step.label}</strong>
          <code>{step.version}</code>
        </li>
      ))}
    </ol>
  );
}

function SystemIntroHero({
  unit,
  onStart,
  progressLabel,
}: {
  unit: SystemIntroUnit;
  onStart: () => void;
  progressLabel: string;
}) {
  const incident = unit.architectureCase;
  return (
    <PhaseSection className="system-intro-hero" phase="orient" unit={unit}>
      <div className="system-hero-cel"><UnitPicture eager unit={unit} /></div>
      <div className="system-hero-dossier">
        <div className="system-hero-title">
          <h1><span>为什么 slime</span><span>不是一条训练脚本</span></h1>
          <p>{systemIntroManifest.subtitle}</p>
        </div>
        <div className="system-incident-log" aria-label="教学事故日志">
          <header><strong>{incident?.title}</strong><span>HYPOTHETICAL / 非真实运行日志</span></header>
          <ol>{incident?.report.map((line) => <li key={line}><code>{line}</code></li>)}</ol>
        </div>
        <blockquote>{unit.drivingQuestion}</blockquote>
        <PolicyVersionLine />
        <div className="system-hero-actions">
          <button onClick={onStart} type="button">从边界开始 <span aria-hidden="true">→</span></button>
          <span>{systemIntroManifest.duration.core} · {progressLabel}</span>
        </div>
      </div>
    </PhaseSection>
  );
}

function IncidentUnit({ unit }: { unit: SystemIntroUnit }) {
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <article className="system-unit system-unit--incident" data-unit-article={unit.id}>
      <PhaseSection phase="model" unit={unit}>
        <UnitHeading unit={unit} />
        <div className="system-boundary-ledger">
          {[
            ["生成完成", "一批 response 已返回", "不能证明 actor 已训练"],
            ["训练完成", "optimizer 更新了训练侧参数", "不能证明 rollout 已装载"],
            ["发布完成", "update_weights 已执行", "不能证明某条后续请求实际用了新版本"],
            ["版本核对", "后续 generation 记录 actor@1", "才连接发布与实际生成"],
          ].map(([title, proves, limit], index) => (
            <div key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{proves}</p>
              <small>{limit}</small>
            </div>
          ))}
        </div>
        <div className="system-reading-copy">{unit.model.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}>
        <h3>{unit.verificationPrompt}</h3>
        <ClaimSet unit={unit} />
      </PhaseSection>
      <PhaseSection className="system-first-judgement" phase="practice" unit={unit}>
        <h3>{unit.practicePrompt}</h3>
        <fieldset>
          <legend>哪组证据足以证明下一批 rollout 使用 actor@1？</legend>
          {[
            ["optimizer", "optimizer step completed"],
            ["publish", "weight update completed"],
            ["publish-and-observe", "weight update completed，并且下一批 generation 记录 actor@1"],
          ].map(([id, label]) => (
            <label key={id}>
              <input checked={answer === id} name="system-intro-first-judgement" onChange={() => setAnswer(id)} type="radio" />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        {answer ? (
          <p className={answer === "publish-and-observe" ? "is-correct" : "is-incorrect"} role="status">
            {answer === "publish-and-observe"
              ? "判断成立：发布记录证明边界被调用，下一批 generation 的版本记录证明新参数真的进入了观测对象。"
              : "证据还少一段：这条日志只停在训练侧或发布动作，尚未连接到下一批 generation 的实际版本。"}
          </p>
        ) : null}
      </PhaseSection>
    </article>
  );
}

function SkeletonUnit({ unit }: { unit: SystemIntroUnit }) {
  return (
    <article className="system-unit system-unit--skeleton" data-unit-article={unit.id}>
      <PhaseSection phase="orient" unit={unit}>
        <UnitHeading unit={unit} />
        <div className="system-unit-opening"><p>{unit.opening}</p><UnitPicture unit={unit} /></div>
      </PhaseSection>
      <PhaseSection phase="model" unit={unit}>
        <div className="system-skeleton-blueprint">
          <div className="system-skeleton-spine" aria-label="稳定交接骨架">
            {skeletonStages.map(([stage, strategy], index) => (
              <div key={stage}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
                <small>{strategy}</small>
              </div>
            ))}
          </div>
          <aside>
            <h3>骨架稳定，不等于策略固定</h3>
            {unit.model.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </aside>
        </div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}><h3>{unit.verificationPrompt}</h3><ClaimSet unit={unit} /></PhaseSection>
      <PhaseSection phase="practice" unit={unit}>
        <h3>{unit.practicePrompt}</h3>
        <div className="system-classification-sheet">
          <div><strong>稳定交接</strong><span>generation → train data</span><span>actor update → weight publication</span></div>
          <div><strong>任务策略</strong><span>数学 reward</span><span>浏览器 agent</span><span>dynamic filter</span></div>
        </div>
      </PhaseSection>
    </article>
  );
}

function RolesUnit({ unit }: { unit: SystemIntroUnit }) {
  return (
    <article className="system-unit system-unit--roles" data-unit-article={unit.id}>
      <PhaseSection phase="orient" unit={unit}><UnitHeading unit={unit} /><div className="system-unit-opening is-reversed"><p>{unit.opening}</p><UnitPicture unit={unit} /></div></PhaseSection>
      <PhaseSection phase="model" unit={unit}>
        {/* The narrow-screen responsibility sheet is a native horizontal scroll region and must be keyboard-focusable. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div aria-label="Megatron、SGLang、Ray 与 slime 控制流职责表，可横向浏览" className="system-role-sheet" role="region" tabIndex={0}>
          <header><span>责任面</span><span>拥有的状态</span><span>主要动作</span><span>不可越界的结论</span></header>
          {roleRows.map((role) => (
            <div className={`is-${role.id}`} key={role.id}>
              <strong>{role.owner}</strong><p>{role.owns}</p><p>{role.action}</p><small>{role.boundary}</small>
            </div>
          ))}
          <footer><strong>slime control flow</strong><span>决定何时调用、等待、转换与发布；它不是第四个模型后端。</span></footer>
        </div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}><h3>{unit.verificationPrompt}</h3><ClaimSet unit={unit} /></PhaseSection>
      <PhaseSection phase="practice" unit={unit}>
        <h3>{unit.practicePrompt}</h3>
        <dl className="system-responsibility-receipt">
          <div><dt>optimizer step</dt><dd>Megatron</dd></div>
          <div><dt>/generate</dt><dd>SGLang</dd></div>
          <div><dt>GPU placement primitives</dt><dd>Ray</dd></div>
          <div><dt>答案是否正确</dt><dd>task / reward logic</dd></div>
          <div><dt>何时 ray.get</dt><dd>slime control flow</dd></div>
        </dl>
      </PhaseSection>
    </article>
  );
}

function AxesUnit({ unit }: { unit: SystemIntroUnit }) {
  return (
    <article className="system-unit system-unit--axes" data-unit-article={unit.id}>
      <PhaseSection phase="orient" unit={unit}><UnitHeading unit={unit} /><div className="system-unit-opening"><p>{unit.opening}</p><UnitPicture unit={unit} /></div></PhaseSection>
      <PhaseSection phase="model" unit={unit}>
        <div className="system-axis-board">
          <div className="system-axis-y"><span>时间关系</span><strong>asynchronous</strong><strong>synchronous</strong></div>
          <div className="system-axis-grid">
            <div><strong>概念格</strong><span>colocated + asynchronous</span><em>固定入口不支持</em></div>
            <div><strong>工作可重叠</strong><span>disaggregated + asynchronous</span><em>固定异步入口路径</em></div>
            <div><strong>阶段复用资源</strong><span>colocated + synchronous</span><em>资源重叠，阶段等待</em></div>
            <div><strong>顺序交接</strong><span>disaggregated + synchronous</span><em>资源分离，阶段等待</em></div>
          </div>
          <div className="system-axis-x"><span>资源放置</span><strong>colocated</strong><strong>disaggregated</strong></div>
        </div>
        <div className="system-reading-copy">{unit.model.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}><h3>{unit.verificationPrompt}</h3><ClaimSet unit={unit} /></PhaseSection>
      <PhaseSection phase="practice" unit={unit}>
        <h3>{unit.practicePrompt}</h3>
        <div className="system-pinned-constraint">
          <code>assert not args.colocate</code>
          <p>这个断言只约束 <code>06ffdbe2/train_async.py</code>；它不是“理论上永远不能组合”的证明。</p>
          <a href="/source#loop.async">在固定源码地图中核对</a>
        </div>
      </PhaseSection>
    </article>
  );
}

function ProbeUnit({
  unit,
  traceLocation,
  onTraceLocationChange,
}: {
  unit: SystemIntroUnit;
  traceLocation: { eventId: string; sampleId: string; timelineMode: TimelineMode };
  onTraceLocationChange: (next: { eventId: string; sampleId: string; timelineMode: TimelineMode }) => void;
}) {
  return (
    <article className="system-unit system-unit--probe" data-unit-article={unit.id}>
      <PhaseSection phase="orient" unit={unit}><UnitHeading unit={unit} /><div className="system-probe-opening"><p>{unit.opening}</p><blockquote>Sample 是观测探针，不是整套分布式系统的快照。</blockquote></div></PhaseSection>
      <PhaseSection phase="model" unit={unit}>
        <div className="system-station-exposure" aria-label="七个观察站">
          {systemIntroManifest.traceStations.map((station) => (
            <div key={station.id}>
              <span>{String(station.actNumber).padStart(2, "0")}</span>
              <strong>{station.title}</strong>
              <dl><dt>读取</dt><dd>{station.reads[0]}</dd><dt>产生</dt><dd>{station.produces[0]}</dd><dt>交给</dt><dd>{station.passesTo}</dd></dl>
            </div>
          ))}
        </div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}>
        <h3>{unit.verificationPrompt}</h3>
        <SampleTraceLab
          initialEventId={traceLocation.eventId}
          initialSampleId={traceLocation.sampleId}
          initialTimelineMode={traceLocation.timelineMode}
          onLocationChange={onTraceLocationChange}
        />
        <ClaimSet unit={unit} />
      </PhaseSection>
      <PhaseSection phase="practice" unit={unit}>
        <h3>{unit.practicePrompt}</h3>
        <div className="system-probe-limit">
          <div><strong>Sample 内可核对</strong><span>response / status / reward / weight version</span></div>
          <div><strong>Sample 外才可核对</strong><span>GPU placement / ray.get 等待 / optimizer state / 参数发布动作</span></div>
        </div>
      </PhaseSection>
    </article>
  );
}

function ReconstructionUnit({
  unit,
  previouslyPassed,
  previousBestScore,
  onAssessmentSubmit,
}: {
  unit: SystemIntroUnit;
  previouslyPassed: boolean;
  previousBestScore: number;
  onAssessmentSubmit: (
    answers: Readonly<Record<string, StructuredExerciseAnswer | undefined>>,
    grade: FinalAssessmentGrade,
  ) => void;
}) {
  const incident = unit.architectureCase;
  return (
    <article className="system-unit system-unit--reconstruction" data-unit-article={unit.id}>
      <PhaseSection phase="orient" unit={unit}><UnitHeading unit={unit} /><div className="system-unit-opening is-reversed"><p>{unit.opening}</p><UnitPicture unit={unit} /></div></PhaseSection>
      <PhaseSection phase="model" unit={unit}>
        <div className="system-reconstruction-dossier">
          <header><strong>{incident?.title}</strong><span>SCRAMBLED / 教学案卷</span></header>
          <ol>{incident?.report.map((line) => <li key={line}><code>{line}</code></li>)}</ol>
          <dl>
            <div><dt>观察</dt><dd>{incident?.observation}</dd></div>
            <div><dt>首个边界</dt><dd>{incident?.firstBoundary}</dd></div>
            <div><dt>不能推出</dt><dd>{incident?.cannotInfer}</dd></div>
          </dl>
        </div>
      </PhaseSection>
      <PhaseSection phase="verify" unit={unit}><h3>{unit.verificationPrompt}</h3><ClaimSet unit={unit} /></PhaseSection>
      <PhaseSection phase="practice" unit={unit}>
        <SystemIntroAssessment
          completion={systemIntroManifest.finalAssessment.completion}
          exercises={systemIntroManifest.finalAssessment.exercises}
          onSubmit={onAssessmentSubmit}
          previousBestScore={previousBestScore}
          previouslyPassed={previouslyPassed}
        />
        <div className="system-intro-handoff">
          <div><h3>{systemIntroManifest.handoff.title}</h3><p>{systemIntroManifest.handoff.body}</p></div>
          <a href={systemIntroManifest.handoff.route}>进入第一门机制课 <span aria-hidden="true">→</span></a>
          <a href={systemIntroManifest.handoff.curriculumRoute}>返回课程路线</a>
        </div>
      </PhaseSection>
    </article>
  );
}

export function SystemIntroExperience() {
  const learningProgress = useLearningProgress();
  const [locationReady, setLocationReady] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<SystemIntroUnitId>("loop-boundary");
  const [activePhase, setActivePhase] = useState<SystemIntroPhaseId>("orient");
  const activeUnitRef = useRef<SystemIntroUnitId>("loop-boundary");
  const activePhaseRef = useRef<SystemIntroPhaseId>("orient");
  const passiveTimerRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const programmaticScrollUntilRef = useRef(0);
  const skipInitialProgressRef = useRef(false);
  const lastProgressKeyRef = useRef("");
  const [traceLocation, setTraceLocation] = useState({
    eventId: sampleTraceFixture.events[0].id,
    sampleId: "a0",
    timelineMode: "sync" as TimelineMode,
  });

  const lessonProgressCandidate = learningProgress.progress.lessons[systemIntroManifest.id];
  const lessonProgress = isLessonProgressCurrentV2(lessonProgressCandidate, sampleJourneyProgressManifest)
    ? lessonProgressCandidate
    : undefined;
  const progressEvaluation = evaluateLessonProgressV2(lessonProgress, sampleJourneyProgressManifest);
  const previouslyPassed = Boolean(lessonProgress?.final_assessment?.passed);
  const previousBestScore = lessonProgress?.final_assessment?.best_score ?? 0;
  const progressLabel = progressEvaluation.status === "completed"
    ? "已完成"
    : progressEvaluation.status === "in_progress"
      ? `已访问 ${lessonProgress?.visited_sections.length ?? 0}/6 单元`
      : "尚未开始";

  const normalizeLocation = useCallback((url: URL, allowStoredResume = true) => {
    const resume = allowStoredResume && lessonProgress?.resume?.kind === "sample-journey"
      ? lessonProgress.resume
      : null;
    return resolveSystemIntroLocation(url, resume);
  }, [lessonProgress]);

  const canonicalUrl = useCallback((
    unitId: SystemIntroUnitId,
    phaseId: SystemIntroPhaseId,
    trace = traceLocation,
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set("unit", unitId);
    if (unitId === "sample-probe") {
      url.searchParams.set("event", trace.eventId);
      url.searchParams.set("sample", trace.sampleId);
      url.searchParams.set("timeline", trace.timelineMode);
    } else {
      url.searchParams.delete("event");
      url.searchParams.delete("sample");
      url.searchParams.delete("timeline");
    }
    url.hash = phaseId;
    return url;
  }, [traceLocation]);

  const scrollToPhase = useCallback((unitId: SystemIntroUnitId, phaseId: SystemIntroPhaseId, focus = false) => {
    const target = findPhaseElement(unitId, phaseId);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    programmaticScrollUntilRef.current = window.performance.now() + (reduceMotion ? 120 : 900);
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    if (focus) window.setTimeout(() => {
      const focusTarget = target?.querySelector<HTMLElement>("h1, h2, h3") ?? target;
      focusTarget?.setAttribute("tabindex", "-1");
      focusTarget?.focus({ preventScroll: true });
    }, 0);
  }, []);

  useEffect(() => {
    if (!learningProgress.hydrated || locationReady) return;
    const timer = window.setTimeout(() => {
      const normalized = normalizeLocation(new URL(window.location.href));
      activeUnitRef.current = normalized.unitId;
      activePhaseRef.current = normalized.phaseId;
      setActiveUnitId(normalized.unitId);
      setActivePhase(normalized.phaseId);
      setTraceLocation({
        eventId: normalized.eventId,
        sampleId: normalized.sampleId,
        timelineMode: normalized.timelineMode,
      });
      skipInitialProgressRef.current = !normalized.valid;
      const url = new URL(window.location.href);
      url.searchParams.set("unit", normalized.unitId);
      if (normalized.unitId === "sample-probe") {
        url.searchParams.set("event", normalized.eventId);
        url.searchParams.set("sample", normalized.sampleId);
        url.searchParams.set("timeline", normalized.timelineMode);
      } else {
        url.searchParams.delete("event");
        url.searchParams.delete("sample");
        url.searchParams.delete("timeline");
      }
      url.hash = normalized.phaseId;
      window.history.replaceState(window.history.state, "", url);
      setLocationReady(true);
      if (window.location.search || window.location.hash) {
        window.setTimeout(() => scrollToPhase(normalized.unitId, normalized.phaseId), 0);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [learningProgress.hydrated, locationReady, normalizeLocation, scrollToPhase]);

  useEffect(() => {
    if (!locationReady) return;
    const onPopState = () => {
      const normalized = normalizeLocation(new URL(window.location.href), false);
      activeUnitRef.current = normalized.unitId;
      activePhaseRef.current = normalized.phaseId;
      setActiveUnitId(normalized.unitId);
      setActivePhase(normalized.phaseId);
      setTraceLocation({ eventId: normalized.eventId, sampleId: normalized.sampleId, timelineMode: normalized.timelineMode });
      scrollToPhase(normalized.unitId, normalized.phaseId, true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [locationReady, normalizeLocation, scrollToPhase]);

  useEffect(() => {
    if (!locationReady) return;
    const onScroll = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        if (window.performance.now() < programmaticScrollUntilRef.current) return;
        const phases = Array.from(document.querySelectorAll<HTMLElement>("[data-system-unit][data-system-phase]"));
        let visible = phases[0];
        for (const candidate of phases) {
          if (candidate.getBoundingClientRect().top <= 176) visible = candidate;
        }
        const unitId = visible?.dataset.systemUnit as SystemIntroUnitId | undefined;
        const phaseId = visible?.dataset.systemPhase as SystemIntroPhaseId | undefined;
        if (!unitId || !phaseId || (unitId === activeUnitRef.current && phaseId === activePhaseRef.current)) return;
        activeUnitRef.current = unitId;
        activePhaseRef.current = phaseId;
        setActiveUnitId(unitId);
        setActivePhase(phaseId);
        if (passiveTimerRef.current !== null) window.clearTimeout(passiveTimerRef.current);
        passiveTimerRef.current = window.setTimeout(() => {
          window.history.replaceState(window.history.state, "", canonicalUrl(unitId, phaseId));
        }, 400);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      if (passiveTimerRef.current !== null) window.clearTimeout(passiveTimerRef.current);
    };
  }, [canonicalUrl, locationReady]);

  useEffect(() => {
    if (!locationReady || !learningProgress.hydrated) return;
    if (skipInitialProgressRef.current) {
      skipInitialProgressRef.current = false;
      return;
    }
    const progressKey = [activeUnitId, activePhase, traceLocation.eventId, traceLocation.sampleId, traceLocation.timelineMode].join("|");
    if (progressKey === lastProgressKeyRef.current) return;
    lastProgressKeyRef.current = progressKey;
    const stored = learningProgress.progress.lessons[systemIntroManifest.id];
    const events: ProgressEvent[] = [];
    if (!stored?.visited_sections.includes(activeUnitId)) {
      events.push({ type: "section-visited", section_id: activeUnitId });
    }
    const resume = stored?.resume;
    if (
      resume?.kind !== "sample-journey" ||
      resume.unit_id !== activeUnitId ||
      resume.phase_id !== activePhase ||
      resume.event_id !== traceLocation.eventId ||
      resume.selected_sample_id !== traceLocation.sampleId ||
      resume.timeline_mode !== traceLocation.timelineMode
    ) {
      events.push({
        type: "resume-updated",
        resume: {
          kind: "sample-journey",
          unit_id: activeUnitId,
          phase_id: activePhase,
          event_id: traceLocation.eventId,
          selected_sample_id: traceLocation.sampleId,
          timeline_mode: traceLocation.timelineMode,
          fixture_id: sampleTraceFixture.fixture_id,
        },
      });
    }
    if (events.length) recordLearningProgress(systemIntroManifest.id, sampleJourneyProgressManifest, events);
  }, [activePhase, activeUnitId, learningProgress.hydrated, learningProgress.progress.lessons, locationReady, traceLocation]);

  const compassChapters = useMemo(() => systemIntroManifest.units.map((unit) => ({
    id: unit.id,
    label: `单元 ${unit.order} · ${unit.title}`,
    shortLabel: `${String(unit.order).padStart(2, "0")} · ${unit.shortTitle}`,
    durationMinutes: unit.durationMinutes,
    href: `/learn/sample-journey?unit=${unit.id}`,
    phases: phaseOrder.map((phase) => ({ id: phase, label: unit.phaseLabels[phase] })),
    position: unit.order,
  })), []);

  const navigateCompass = useCallback((target: LearningCompassTarget) => {
    const unit = systemIntroManifest.units.find((candidate) => candidate.id === target.chapterId);
    if (!unit) return;
    const unitId = unit.id;
    const phaseId = target.phaseId as SystemIntroPhaseId;
    activeUnitRef.current = unitId;
    activePhaseRef.current = phaseId;
    setActiveUnitId(unitId);
    setActivePhase(phaseId);
    window.history.pushState(window.history.state, "", canonicalUrl(unitId, phaseId));
    scrollToPhase(unitId, phaseId, true);
  }, [canonicalUrl, scrollToPhase]);

  const activeUnitIndex = systemIntroManifest.units.findIndex((unit) => unit.id === activeUnitId);
  const activePhaseIndex = phaseOrder.indexOf(activePhase);
  const nextUnit = activePhaseIndex === phaseOrder.length - 1
    ? systemIntroManifest.units[activeUnitIndex + 1]
    : null;
  const nextPhase = activePhaseIndex < phaseOrder.length - 1 ? phaseOrder[activePhaseIndex + 1] : null;
  const next = useMemo(() => nextPhase
    ? { label: systemIntroManifest.units[activeUnitIndex].phaseLabels[nextPhase], href: buildUnitHref(activeUnitId, nextPhase) }
    : nextUnit
      ? { label: nextUnit.shortTitle, href: buildUnitHref(nextUnit.id, "orient") }
      : null, [activeUnitId, activeUnitIndex, nextPhase, nextUnit]);
  const compassRegistration = useMemo(() => ({
    stage: { label: "系统导论", href: "/learn#stage-system-overview", position: 2 },
    course: {
      label: systemIntroManifest.title,
      href: systemIntroManifest.route,
      durationMinutes: systemIntroManifest.units.reduce((sum, unit) => sum + unit.durationMinutes, 0),
      position: 1,
    },
    chapters: compassChapters,
    chapterCount: systemIntroManifest.units.length,
    chapterNoun: "单元" as const,
    activeChapterId: activeUnitId,
    activePhaseId: activePhase,
    next,
    navigate: navigateCompass,
  }), [activePhase, activeUnitId, compassChapters, navigateCompass, next]);
  useLearningCompassRegistration(compassRegistration);

  const onTraceLocationChange = useCallback((nextTrace: typeof traceLocation) => {
    if (!locationReady) return;
    setTraceLocation((current) =>
      current.eventId === nextTrace.eventId && current.sampleId === nextTrace.sampleId && current.timelineMode === nextTrace.timelineMode
        ? current
        : nextTrace,
    );
    if (activeUnitRef.current === "sample-probe") {
      window.history.replaceState(window.history.state, "", canonicalUrl("sample-probe", activePhaseRef.current, nextTrace));
    }
  }, [canonicalUrl, locationReady]);

  const onAssessmentSubmit = useCallback((
    _answers: Readonly<Record<string, StructuredExerciseAnswer | undefined>>,
    grade: FinalAssessmentGrade,
  ) => {
    recordLearningProgress(systemIntroManifest.id, sampleJourneyProgressManifest, [{
      type: "assessment-submitted",
      correct_question_ids: grade.grades.filter((item) => item.correct).map((item) => item.exerciseId),
    }]);
  }, []);

  const clearProgress = () => {
    if (!window.confirm("清除本课在此设备上的阅读位置与终测成绩？其他课程不会受影响。")) return;
    try {
      const next = clearLessonProgressV2(window.localStorage, systemIntroManifest.id);
      replaceLearningProgress(next);
      lastProgressKeyRef.current = "";
    } catch {
      // 阅读和终测仍可继续；全局 Provider 会显示存储不可用状态。
    }
  };

  const firstUnit = systemIntroManifest.units[0];
  return (
    <div className="system-intro journey-experience" id="system-intro-reader">
      <span
        aria-hidden="true"
        className="system-intro-contract"
        dangerouslySetInnerHTML={{
          __html: "<!-- THESIS: policy visibility is a chain of system boundaries, not a single training step. OWN-WORLD: navy desk, square cel paper, red corrections, yellow live-state marks. STORY: incident to skeleton to roles to axes to Sample probe to reconstruction. FIRST VIEWPORT: rain-window cel, actor@0 incident log, unresolved question, version line, one start action. FORM: architecture assembly scroll, selected direction 1, seed 1f848e47. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
        }}
      />
      <SystemIntroHero
        onStart={() => navigateCompass({ chapterId: firstUnit.id, phaseId: "model", href: buildUnitHref(firstUnit.id, "model") })}
        progressLabel={progressLabel}
        unit={firstUnit}
      />
      <div className="system-intro-scroll">
        <IncidentUnit unit={firstUnit} />
        <SkeletonUnit unit={systemIntroManifest.units[1]} />
        <RolesUnit unit={systemIntroManifest.units[2]} />
        <AxesUnit unit={systemIntroManifest.units[3]} />
        <ProbeUnit onTraceLocationChange={onTraceLocationChange} traceLocation={traceLocation} unit={systemIntroManifest.units[4]} />
        <ReconstructionUnit
          onAssessmentSubmit={onAssessmentSubmit}
          previousBestScore={previousBestScore}
          previouslyPassed={previouslyPassed}
          unit={systemIntroManifest.units[5]}
        />
      </div>
      <footer className="system-intro-footer">
        <div>
          <strong>固定源码基线</strong>
          <code>{systemIntroManifest.sourceBaseline.repository}@{systemIntroManifest.sourceBaseline.shortCommit}</code>
        </div>
        <p>作者资料解释设计目的，固定 commit 约束实现事实，本站推论始终标出边界。</p>
        <button onClick={clearProgress} type="button">清除本课进度</button>
        {learningProgress.persistenceUnavailable ? <span role="status">本地存储不可用；本次阅读仍可继续。</span> : null}
      </footer>
    </div>
  );
}
