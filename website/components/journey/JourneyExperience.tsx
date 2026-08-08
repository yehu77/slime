"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  checkJourneyInvariants,
  createInitialJourneyState,
  materializeJourneyFixture,
  materializeJourneyStates,
  math2x2Fixture,
  reduceJourney,
  seekJourney,
  type JourneyAction,
  type JourneyActor,
  type JourneyState,
} from "../../core/journey";
import {
  sampleJourneyLesson,
  sampleJourneyMessages,
} from "../../content/zh";
import { BatchCalculator } from "./BatchCalculator";
import { KnowledgeCheck } from "./KnowledgeCheck";
import { SampleMicroscope } from "./SampleMicroscope";
import { TimelineComparison } from "./TimelineComparison";
import type {
  AnswerMap,
  AssessmentQuestionView,
  AssessmentResult,
  JourneyLayer,
  PersistedJourneyProgress,
  TimelineMode,
} from "./types";
import "./journey.css";

type PlaybackState = "idle" | "playing" | "paused" | "ended" | "error";

const STORAGE_KEY = "slime-lab:progress:v1";
const runtimeFixture = materializeJourneyFixture(
  math2x2Fixture,
  sampleJourneyMessages,
);

const actorGroups: ReadonlyArray<{
  id: string;
  label: string;
  detail: string;
  actors: readonly JourneyActor[];
}> = [
  { id: "dataset", label: "Dataset", detail: "语义输入", actors: ["dataset"] },
  { id: "rollout", label: "DataSource → SGLang", detail: "分组与生成", actors: ["data_source", "router", "sglang"] },
  { id: "reward", label: "Reward / collect", detail: "评价与收集", actors: ["reward"] },
  { id: "train", label: "RolloutManager → Actor", detail: "转换、排程、训练", actors: ["rollout_manager", "scheduler", "actor"] },
  { id: "sync", label: "Weight Sync", detail: "发布新 policy", actors: ["weight_sync"] },
] as const;

const truthLabels = {
  "source-fact": "源码事实",
  "teaching-fixture": "教学 fixture",
  "advanced-preview": "进阶预告",
} as const;

const statusLabels: Record<PersistedJourneyProgress["status"], string> = {
  not_started: "尚未开始",
  in_progress: "学习中",
  completed: "已完成",
  review_required: "需要复习",
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "SUMMARY"].includes(target.tagName)
  );
}

function actNumberFromId(actId?: string) {
  const act = sampleJourneyLesson.acts.find((item) => item.id === actId);
  return act?.number ?? 1;
}

function assessmentQuestions(): AssessmentQuestionView[] {
  return sampleJourneyLesson.assessment.questions.map((question) => ({
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    options: question.options.map((option) => ({ ...option })),
    correctOptionIds: question.correctOptionIds
      ? [...question.correctOptionIds]
      : undefined,
    correctOrder: question.correctOrder ? [...question.correctOrder] : undefined,
    answerSummary: question.answerSummary,
    feedback: question.feedback.incorrect,
    returnTo: actNumberFromId(question.returnTo.actId),
  }));
}

function parseAnswerMap(value: unknown): AnswerMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
    ),
  );
}

function parseStoredProgress(value: string): PersistedJourneyProgress | null {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const candidate = parsed as Partial<PersistedJourneyProgress>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.lessonId !== "string" ||
    typeof candidate.lastEventId !== "string" ||
    typeof candidate.selectedSampleId !== "string" ||
    !Array.isArray(candidate.visitedActs)
  ) {
    return null;
  }
  return {
    schemaVersion: 1,
    lessonId: candidate.lessonId,
    lessonVersion: String(candidate.lessonVersion ?? ""),
    assessmentVersion: String(candidate.assessmentVersion ?? ""),
    fixtureId: String(candidate.fixtureId ?? ""),
    status: ["not_started", "in_progress", "completed", "review_required"].includes(
      String(candidate.status),
    )
      ? (candidate.status as PersistedJourneyProgress["status"])
      : "in_progress",
    visitedActs: candidate.visitedActs.filter(
      (act): act is number => typeof act === "number" && act >= 1 && act <= 7,
    ),
    lastEventId: candidate.lastEventId,
    selectedSampleId: candidate.selectedSampleId,
    timelineMode: candidate.timelineMode === "async" ? "async" : "sync",
    answers: parseAnswerMap(candidate.answers),
    bestScore: typeof candidate.bestScore === "number" ? candidate.bestScore : 0,
    lastScore: typeof candidate.lastScore === "number" ? candidate.lastScore : null,
    requiredQuestionsPassed: Boolean(candidate.requiredQuestionsPassed),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
  };
}

export function JourneyExperience() {
  const [journeyState, setJourneyState] = useState<JourneyState>(() =>
    createInitialJourneyState(runtimeFixture),
  );
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [layer, setLayer] = useState<JourneyLayer>("raw");
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("sync");
  const [visitedActs, setVisitedActs] = useState<Set<number>>(() => new Set([1]));
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [bestScore, setBestScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [requiredQuestionsPassed, setRequiredQuestionsPassed] = useState(false);
  const [progressStatus, setProgressStatus] =
    useState<PersistedJourneyProgress["status"]>("in_progress");
  const [storageReady, setStorageReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stageRef = useRef<HTMLElement>(null);

  const events = runtimeFixture.events;
  const currentAct = sampleJourneyLesson.acts[journeyState.act - 1];
  const selectedSample = journeyState.raw_samples[journeyState.selected_sample_id];
  const invariants = useMemo(
    () => checkJourneyInvariants(journeyState),
    [journeyState],
  );
  const failedInvariants = invariants.filter((item) => item.status === "fail");

  const changeHistory = useMemo(() => {
    const states = materializeJourneyStates(
      runtimeFixture,
      journeyState.selected_sample_id,
    );
    return states
      .slice(0, journeyState.event_index + 1)
      .flatMap((stateAtEvent) =>
        stateAtEvent.changed_fields
          .filter((change) => change.sample_id === journeyState.selected_sample_id)
          .map((change) => ({
            eventId: stateAtEvent.event_id,
            eventTitle: stateAtEvent.title,
            actor: stateAtEvent.actor,
            path: change.path,
            before: change.before,
            after: change.after,
          })),
      );
  }, [journeyState.event_index, journeyState.selected_sample_id]);

  const progressPercent = Math.round(
    (visitedActs.size / sampleJourneyLesson.acts.length) * 70 +
      (bestScore / sampleJourneyLesson.assessment.questions.length) * 30,
  );

  const performAction = useCallback(
    (action: JourneyAction) => {
      try {
        const next = reduceJourney(journeyState, action, runtimeFixture);
        const failures = checkJourneyInvariants(next).filter(
          (item) => item.status === "fail",
        );
        if (failures.length) {
          setPlayback("error");
          setErrorMessage(
            `Fixture contract 失败：${failures.map((item) => item.message).join("；")}`,
          );
          return;
        }
        setJourneyState(next);
        setVisitedActs((current) =>
          current.has(next.act) ? current : new Set([...current, next.act]),
        );
        setErrorMessage(null);
        if (action.type !== "select_sample" && playback === "ended") {
          setPlayback("paused");
        }
      } catch (error) {
        setPlayback("error");
        setErrorMessage(error instanceof Error ? error.message : "课程状态无法恢复");
      }
    },
    [journeyState, playback],
  );

  const seekAct = useCallback(
    (actNumber: number, shouldScroll = false) => {
      const target = events.find((event) => event.act === actNumber);
      if (!target) return;
      setPlayback("paused");
      performAction({ type: "seek", event_id: target.id });
      if (shouldScroll) {
        window.setTimeout(
          () => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          0,
        );
      }
    },
    [events, performAction],
  );

  const recoverOfficialFixture = () => {
    setJourneyState(createInitialJourneyState(runtimeFixture, "a0"));
    setPlayback("idle");
    setLayer("raw");
    setTimelineMode("sync");
    setErrorMessage(null);
  };

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY);
        const stored = storedValue ? parseStoredProgress(storedValue) : null;
        const params = new URLSearchParams(window.location.search);

        let selectedSampleId = stored?.selectedSampleId ?? "a0";
        const querySample = params.get("sample");
        if (querySample && runtimeFixture.initial_samples[querySample]) {
          selectedSampleId = querySample;
        }
        if (!runtimeFixture.initial_samples[selectedSampleId]) selectedSampleId = "a0";

        let eventId = stored?.lastEventId ?? events[0].id;
        const queryEvent = params.get("event");
        if (queryEvent && events.some((event) => event.id === queryEvent)) eventId = queryEvent;
        if (!events.some((event) => event.id === eventId)) eventId = events[0].id;

        const hydratedState = seekJourney(runtimeFixture, eventId, selectedSampleId);
        setJourneyState(hydratedState);
        setTimelineMode(
          params.get("timeline") === "async"
            ? "async"
            : stored?.timelineMode ?? "sync",
        );

        const restoredActs = stored?.visitedActs.length ? stored.visitedActs : [1];
        setVisitedActs(new Set([...restoredActs, hydratedState.act]));
        if (stored) {
          setAnswers(stored.answers);
          setBestScore(stored.bestScore);
          setLastScore(stored.lastScore);
          setRequiredQuestionsPassed(stored.requiredQuestionsPassed);
          const versionsMatch =
            stored.lessonId === sampleJourneyLesson.metadata.id &&
            stored.lessonVersion === String(sampleJourneyLesson.metadata.lessonRevision) &&
            stored.assessmentVersion === String(sampleJourneyLesson.assessment.version) &&
            stored.fixtureId === runtimeFixture.fixture_id;
          setProgressStatus(versionsMatch ? stored.status : "review_required");
        }
      } catch {
        setStorageUnavailable(true);
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [events]);

  useEffect(() => {
    if (!storageReady || storageUnavailable) return;
    const record: PersistedJourneyProgress = {
      schemaVersion: 1,
      lessonId: sampleJourneyLesson.metadata.id,
      lessonVersion: String(sampleJourneyLesson.metadata.lessonRevision),
      assessmentVersion: String(sampleJourneyLesson.assessment.version),
      fixtureId: runtimeFixture.fixture_id,
      status: progressStatus,
      visitedActs: [...visitedActs].sort((left, right) => left - right),
      lastEventId: journeyState.event_id,
      selectedSampleId: journeyState.selected_sample_id,
      timelineMode,
      answers,
      bestScore,
      lastScore,
      requiredQuestionsPassed,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      window.queueMicrotask(() => setStorageUnavailable(true));
    }
  }, [
    answers,
    bestScore,
    journeyState.event_id,
    journeyState.selected_sample_id,
    lastScore,
    progressStatus,
    requiredQuestionsPassed,
    storageReady,
    storageUnavailable,
    timelineMode,
    visitedActs,
  ]);

  useEffect(() => {
    if (!storageReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("event", journeyState.event_id);
    url.searchParams.set("sample", journeyState.selected_sample_id);
    url.searchParams.set("timeline", timelineMode);
    window.history.replaceState(window.history.state, "", url);
  }, [journeyState.event_id, journeyState.selected_sample_id, storageReady, timelineMode]);

  useEffect(() => {
    if (playback !== "playing") return;
    if (journeyState.event_index >= events.length - 1) return;
    const timer = window.setTimeout(
      () => {
        if (journeyState.event_index === events.length - 2) {
          setPlayback("ended");
        }
        performAction({ type: "next" });
      },
      1800,
    );
    return () => window.clearTimeout(timer);
  }, [events.length, journeyState.event_index, performAction, playback]);

  const handleKeyboard = useCallback(
    (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      let handled = true;
      switch (event.key) {
        case " ":
          setPlayback((current) => (current === "playing" ? "paused" : "playing"));
          break;
        case "ArrowLeft":
          if (event.shiftKey) seekAct(Math.max(1, journeyState.act - 1));
          else performAction({ type: "previous" });
          break;
        case "ArrowRight":
          if (event.shiftKey) seekAct(Math.min(7, journeyState.act + 1));
          else performAction({ type: "next" });
          break;
        case "Home":
          performAction({ type: "seek", event_id: events[0].id });
          break;
        case "End":
          performAction({ type: "seek", event_id: events[events.length - 1].id });
          break;
        case "r":
        case "R":
          performAction({ type: "reset" });
          setPlayback("idle");
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
    },
    [events, journeyState.act, performAction, seekAct],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  const handleAssessmentSubmit = (
    nextAnswers: AnswerMap,
    result: AssessmentResult,
  ) => {
    setAnswers(nextAnswers);
    setLastScore(result.score);
    setBestScore((current) => Math.max(current, result.score));
    setRequiredQuestionsPassed(result.requiredPassed);
    setProgressStatus(result.completed ? "completed" : "in_progress");
  };

  const clearProgress = () => {
    if (!window.confirm("清除本课在此设备上的播放位置、答题记录和完成状态？")) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      setStorageUnavailable(true);
    }
    setVisitedActs(new Set([1]));
    setAnswers({});
    setBestScore(0);
    setLastScore(null);
    setRequiredQuestionsPassed(false);
    setProgressStatus("in_progress");
    recoverOfficialFixture();
  };

  const phaseValueText = `第 ${journeyState.event_index + 1} 个事件：${journeyState.title}`;

  return (
    <div
      className="journey-experience"
      role="region"
      aria-label="一条 Sample 的旅程交互课程"
    >
      <header className="journey-experience-header">
        <div>
          <p className="journey-eyebrow">核心课程 · 25–30 分钟</p>
          <h1>一条 Sample 的旅程</h1>
          <p>{sampleJourneyLesson.metadata.summary}</p>
        </div>
        <div className="journey-progress-card" aria-label={`课程状态：${statusLabels[progressStatus]}`}>
          <div>
            <span>{statusLabels[progressStatus]}</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="journey-progress-bar" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></div>
          <small>{visitedActs.size}/7 幕 · 最佳 {bestScore}/9</small>
          <button className="journey-progress-clear" type="button" onClick={clearProgress}>
            清除本课进度
          </button>
        </div>
      </header>

      <figure className="journey-cover">
        <img
          src="/art/sample-console.webp"
          alt=""
          width="1440"
          height="810"
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <span>TRACE / SAMPLE A0</span>
          <strong>同一条 Sample，在系统边界上逐步改变。</strong>
        </figcaption>
      </figure>

      <div className="journey-notice">
        <strong>受控示例</strong>
        <span>{runtimeFixture.teaching_values_notice}</span>
      </div>

      <section className="journey-overview" id="overview" aria-labelledby="journey-overview-title">
        <header>
          <div>
            <p className="journey-eyebrow">90-second model</p>
            <h2 id="journey-overview-title">{sampleJourneyLesson.overview90s.title}</h2>
          </div>
          <p>{sampleJourneyLesson.overview90s.description}</p>
        </header>
        <ol>
          {sampleJourneyLesson.overview90s.steps.map((step) => (
            <li key={step.id}>
              <span>{String(step.order).padStart(2, "0")}</span>
              <div>
                <strong>{step.actor}</strong>
                <small>{step.action}</small>
              </div>
              <em>{step.durationSeconds}s</em>
            </li>
          ))}
        </ol>
      </section>

      {storageUnavailable ? (
        <p className="journey-storage-warning" role="status">
          当前浏览器无法保存本地进度；课程仍可完整操作，本次关闭页面后记录可能丢失。
        </p>
      ) : null}

      <div className="journey-workbench">
        <aside className="journey-act-rail" aria-label="七幕导航">
          <span>七幕路径</span>
          <nav>
            {sampleJourneyLesson.acts.map((act) => (
              <button
                id={act.id}
                className={`journey-act-button ${act.number === journeyState.act ? "is-current" : ""} ${visitedActs.has(act.number) ? "is-visited" : ""}`}
                type="button"
                aria-current={act.number === journeyState.act ? "step" : undefined}
                onClick={() => seekAct(act.number)}
                key={act.id}
              >
                <span>{act.number}</span>
                <b>{act.shortTitle}<small>{act.durationMinutes} min</small></b>
              </button>
            ))}
          </nav>
        </aside>

        <section className="journey-stage" ref={stageRef} aria-labelledby="journey-stage-title">
          <header className="journey-stage-header">
            <div className="journey-stage-header-top">
              <p className="journey-eyebrow">第 {journeyState.act} 幕 · {currentAct.stage.actor}</p>
              <span>{journeyState.phase}</span>
            </div>
            <h2 id="journey-stage-title">{currentAct.title}</h2>
            <p>{currentAct.stage.visual}</p>
            <div className="journey-phase-strip" aria-label="11 个系统事件">
              {events.map((event, index) => (
                <button
                  className={`journey-phase-dot ${index < journeyState.event_index ? "is-past" : ""} ${index === journeyState.event_index ? "is-current" : ""}`}
                  type="button"
                  title={`${index + 1}. ${event.title}`}
                  aria-label={`跳到事件 ${index + 1}：${event.title}`}
                  onClick={() => performAction({ type: "seek", event_id: event.id })}
                  key={event.id}
                />
              ))}
            </div>
          </header>

          <div className="journey-player-controls" aria-label="播放器控制">
            <div className="journey-player-buttons">
              <button
                className="journey-icon-button"
                type="button"
                aria-label="重播"
                onClick={() => { performAction({ type: "reset" }); setPlayback("idle"); }}
              >
                ↺
              </button>
              <button
                className="journey-icon-button"
                type="button"
                aria-label="上一个事件"
                disabled={journeyState.event_index === 0 || playback === "error"}
                onClick={() => performAction({ type: "previous" })}
              >
                ←
              </button>
              <button
                className="journey-play-button"
                type="button"
                disabled={playback === "error"}
                aria-label={playback === "playing" ? "暂停" : "播放"}
                onClick={() => {
                  if (journeyState.event_index === events.length - 1 && playback !== "playing") {
                    performAction({ type: "reset" });
                  }
                  setPlayback((current) => (current === "playing" ? "paused" : "playing"));
                }}
              >
                {playback === "playing" ? "暂停" : playback === "ended" ? "重播" : "播放"}
              </button>
              <button
                className="journey-icon-button"
                type="button"
                aria-label="下一个事件"
                disabled={journeyState.event_index === events.length - 1 || playback === "error"}
                onClick={() => performAction({ type: "next" })}
              >
                →
              </button>
            </div>
            <label className="journey-scrubber">
              <span className="journey-live-region">课程事件位置</span>
              <input
                type="range"
                min="0"
                max={events.length - 1}
                step="1"
                value={journeyState.event_index}
                aria-valuetext={phaseValueText}
                disabled={playback === "error"}
                onChange={(event) => {
                  setPlayback("paused");
                  performAction({
                    type: "seek",
                    event_id: events[Number(event.currentTarget.value)].id,
                  });
                }}
              />
            </label>
            <span className="journey-player-counter">
              {String(journeyState.event_index + 1).padStart(2, "0")} / {events.length}
            </span>
          </div>

          {errorMessage || failedInvariants.length ? (
            <div className="journey-error-state" role="alert">
              <h3>播放器已暂停</h3>
              <p>{errorMessage ?? failedInvariants.map((item) => item.message).join("；")}</p>
              <button className="journey-primary-button" type="button" onClick={recoverOfficialFixture}>
                恢复官方示例
              </button>
            </div>
          ) : (
            <div className="journey-stage-body">
              <div className="journey-system-map" aria-label="slime 闭环系统图">
                {actorGroups.map((group) => (
                  <div
                    className={`journey-system-node ${group.actors.includes(journeyState.actor) ? "is-current" : ""}`}
                    key={group.id}
                  >
                    <b>{group.label}</b>
                    <small>{group.detail}</small>
                  </div>
                ))}
              </div>

              <article className="journey-event-card" aria-live="polite">
                <span>{journeyState.actor.replace("_", " ")}</span>
                <h3>{journeyState.title}</h3>
                <p>{journeyState.narration}</p>
              </article>

              <section className="journey-sample-deck" aria-labelledby="sample-deck-title">
                <header>
                  <h3 id="sample-deck-title">四条 Sample</h3>
                  <span>选择一张，右侧显微镜会保持跟随</span>
                </header>
                <div className="journey-sample-cards">
                  {Object.entries(journeyState.raw_samples).map(([sampleId, sample]) => (
                    <button
                      className="journey-sample-card"
                      type="button"
                      aria-pressed={sampleId === journeyState.selected_sample_id}
                      onClick={() => performAction({ type: "select_sample", sample_id: sampleId })}
                      key={sampleId}
                    >
                      <strong>
                        {sampleId}
                        <i className="journey-sample-status">{sample.status}</i>
                      </strong>
                      <span>group {sample.group_index ?? "—"} · index {sample.index ?? "—"}</span>
                      <small>
                        {sample.response || "等待生成"} · reward{" "}
                        {typeof sample.reward === "number"
                          ? sample.reward
                          : sample.reward
                            ? JSON.stringify(sample.reward)
                            : "None"}
                      </small>
                    </button>
                  ))}
                </div>
              </section>

              <article className="journey-act-reading">
                <p className="journey-driving-question">{currentAct.drivingQuestion}</p>
                <div className="journey-content-blocks">
                  {currentAct.explanation.map((block) => (
                    <section className={`journey-content-block is-${block.kind}`} key={block.id}>
                      <span>{truthLabels[block.kind]}</span>
                      {block.title ? <h4>{block.title}</h4> : null}
                      <p>{block.body}</p>
                    </section>
                  ))}
                </div>
                <div className="journey-misconception">
                  <span><b>常见误解：</b>{currentAct.misconception.belief}</span>
                  <strong>纠正：{currentAct.misconception.correction}</strong>
                </div>
                <details className="journey-micro-check">
                  <summary>微型检查：{currentAct.microCheck.prompt}</summary>
                  <p><strong>{currentAct.microCheck.answer}</strong><br />{currentAct.microCheck.feedback}</p>
                </details>
                <div className="journey-source-links" aria-label="本幕源码证据">
                  {currentAct.sourceRefIds.map((sourceRefId) => (
                    <a href={`/source#${sourceRefId}`} key={sourceRefId}>{sourceRefId}</a>
                  ))}
                </div>
              </article>

              <details className="journey-transcript">
                <summary>事件文字稿 · {journeyState.event_index + 1}/{events.length}</summary>
                <p><strong>{journeyState.title}</strong></p>
                <p>{journeyState.transcript}</p>
              </details>
            </div>
          )}
        </section>

        <SampleMicroscope
          sampleId={journeyState.selected_sample_id}
          sample={selectedSample}
          layer={layer}
          derived={journeyState.derived}
          system={journeyState.system}
          vocabulary={runtimeFixture.vocabulary}
          invariants={invariants}
          currentChanges={journeyState.changed_fields}
          history={changeHistory}
          frozen={journeyState.system.raw_samples_frozen}
          onLayerChange={setLayer}
        />
      </div>

      <div className="journey-labs">
        <BatchCalculator
          defaults={{
            promptGroups: runtimeFixture.config.rollout_batch_size,
            samplesPerPrompt: runtimeFixture.config.n_samples_per_prompt,
            globalBatchSize: runtimeFixture.config.global_batch_size,
            numStepsPerRollout: runtimeFixture.config.num_steps_per_rollout,
            physicalSamples: runtimeFixture.expected.physical_samples,
            dpSize: runtimeFixture.config.dp_size,
          }}
        />
        <TimelineComparison
          mode={timelineMode}
          events={events}
          actorVersion={journeyState.system.actor_version}
          rolloutVersion={journeyState.system.rollout_version}
          onModeChange={setTimelineMode}
          onSeek={(eventId) => performAction({ type: "seek", event_id: eventId })}
        />
      </div>

      <KnowledgeCheck
        questions={assessmentQuestions()}
        visitedActs={visitedActs}
        initialAnswers={answers}
        requiredQuestionIds={sampleJourneyLesson.assessment.completion.requiredQuestionIds}
        passScore={sampleJourneyLesson.assessment.completion.minCorrect}
        onSubmit={handleAssessmentSubmit}
        onReturnToAct={(act) => seekAct(act, true)}
      />

      <div className="journey-live-region" aria-live="polite">
        {phaseValueText}。{journeyState.narration}
      </div>
    </div>
  );
}
