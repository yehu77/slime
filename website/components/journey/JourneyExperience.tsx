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
  applyLessonProgressEvent,
  clearLessonProgressV2,
  evaluateLessonProgressV2,
  loadLocalProgressV2,
  replaceLearningProgress,
  saveLocalProgressV2,
  useLearningProgress,
  type LessonProgressStatus,
  type LessonProgressV2,
  type LocalProgressV2,
  type StructuredExerciseResponse,
} from "../../core/progress";
import {
  LEARNING_COMPASS_PHASES,
  useLearningCompassRegistration,
  type LearningCompassPhaseId,
  type LearningCompassTarget,
} from "../site/learning-compass-store";
import {
  glossaryTerms,
  sampleJourneyLesson,
  sampleJourneyMessages,
  sampleJourneyProgressManifest,
  sourceRefLabels,
  type CurriculumLearnerStatusMap,
} from "../../content/zh";
import { slimeCurriculum } from "../../content/zh/curriculum";
import { CurriculumPlan, deriveCurriculumLearnerStatus } from "../curriculum";
import { BatchCalculator } from "./BatchCalculator";
import { KnowledgeCheck } from "./KnowledgeCheck";
import { SampleMicroscope } from "./SampleMicroscope";
import { TimelineComparison } from "./TimelineComparison";
import type {
  AnswerMap,
  AssessmentQuestionView,
  AssessmentResult,
  JourneyLayer,
  TimelineMode,
} from "./types";
import "./journey.css";
import "./film-reader.css";

type PlaybackState = "idle" | "playing" | "paused" | "ended" | "error";

const runtimeFixture = materializeJourneyFixture(
  math2x2Fixture,
  sampleJourneyMessages,
);
const progressManifest = sampleJourneyProgressManifest;

const actorGroups: ReadonlyArray<{
  id: string;
  label: string;
  detail: string;
  actors: readonly JourneyActor[];
}> = [
  { id: "dataset", label: "Dataset", detail: "语义输入", actors: ["dataset"] },
  { id: "data-source", label: "DataSource", detail: "复制与分组", actors: ["data_source"] },
  { id: "sglang", label: "SGLang", detail: "请求与生成", actors: ["router", "sglang"] },
  { id: "reward", label: "Reward → collect", detail: "逐条评分，按组收回", actors: ["reward"] },
  { id: "train", label: "Rollout → Actor", detail: "转换、排程、训练", actors: ["rollout_manager", "scheduler", "actor"] },
  { id: "sync", label: "Weight Sync", detail: "发布新 policy", actors: ["weight_sync"] },
] as const;

const actKeyframes: Record<number, {
  src: string;
  alt: string;
  mark: string;
  caption: string;
}> = {
  1: {
    src: "/art/library-act-01-v1.webp",
    alt: "读者在图书馆书桌前整理资料的课程关键帧",
    mark: "SC.01 / DATASET",
    caption: "Dataset 保存题目与元数据；生成、评价和训练字段尚未出现。",
  },
  2: {
    src: "/art/library-act-02-v1.webp?v=2",
    alt: "古镜里映出一位人物的倒影，镜前摆着台灯与记录物的课程关键帧",
    mark: "SC.02 / GROUP",
    caption: "同一题目成为四个独立候选；它们共享 group_index，但身份各自独立。",
  },
  3: {
    src: "/art/library-act-03-v1.webp",
    alt: "研究者坐在多屏控制台前观察生成过程的课程关键帧",
    mark: "SC.03 / GENERATE",
    caption: "SGLang 返回 response、tokens 与 rollout 证据；评价仍未发生。",
  },
  4: {
    src: "/art/library-act-04-v1.webp?v=2",
    alt: "植物实验室里的天平、药剂与记录纸构成的课程关键帧",
    mark: "SC.04 / REWARD",
    caption: "Reward 写入评分；collect 等待同组候选齐备后再整体交接。",
  },
  5: {
    src: "/art/library-act-05-v1.webp",
    alt: "一位读者站在纵横线路与架空线之间的课程关键帧",
    mark: "SC.05 / SCHEDULE",
    caption: "Raw Sample 在边界处冻结，派生 train data 与 schedule 从这里开始。",
  },
  6: {
    src: "/art/library-act-06-v1.webp?v=2",
    alt: "巨型发光钟芯、齿轮与链条在左下观察者身后运转的课程关键帧",
    mark: "SC.06 / TRAIN",
    caption: "Megatron actor 消费训练批次；改变的是参数，而不是旧 Sample。",
  },
  7: {
    src: "/art/library-act-07-v1.webp",
    alt: "读者沿云上通道望向远方城市的课程关键帧",
    mark: "SC.07 / SYNC",
    caption: "同步完成后，新 policy 才会被后续 rollout 看见。",
  },
};

const truthLabels = {
  "source-fact": "源码事实",
  "teaching-fixture": "教学 fixture",
  "advanced-preview": "进阶预告",
} as const;

const statusLabels: Record<LessonProgressStatus, string> = {
  not_started: "尚未开始",
  in_progress: "学习中",
  completed: "已完成",
  review_required: "需要复习",
};

const glossaryTermsById = new Map(
  glossaryTerms.map((term) => [term.id, term] as const),
);

function InlineCodeText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

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

function actsFromProgress(progress?: LessonProgressV2): number[] {
  if (!progress) return [];
  return progress.visited_sections.flatMap((sectionId) => {
    const match = /^act-([1-7])$/.exec(sectionId);
    return match ? [Number(match[1])] : [];
  });
}

function answersFromProgress(progress?: LessonProgressV2): AnswerMap {
  if (!progress) return {};
  return Object.fromEntries(
    Object.entries(progress.exercise_attempts).flatMap(
      ([exerciseId, attempt]) => {
        const response = attempt.last_response;
        if (response.type === "choice") {
          return [[exerciseId, [...response.selected_option_ids]]];
        }
        if (response.type === "ordering") {
          return [[exerciseId, [...response.ordered_item_ids]]];
        }
        return [];
      },
    ),
  );
}

function responseForAnswer(
  question: AssessmentQuestionView,
  answer: readonly string[],
): StructuredExerciseResponse | null {
  if (answer.length === 0) return null;
  return question.correctOrder?.length
    ? { type: "ordering", ordered_item_ids: [...answer] }
    : { type: "choice", selected_option_ids: [...answer] };
}

function sameJourneyResume(
  progress: LessonProgressV2 | undefined,
  eventId: string,
  sampleId: string,
  timelineMode: TimelineMode,
): boolean {
  const resume = progress?.resume;
  return (
    resume?.kind === "sample-journey" &&
    resume.event_id === eventId &&
    resume.selected_sample_id === sampleId &&
    resume.timeline_mode === timelineMode &&
    resume.fixture_id === runtimeFixture.fixture_id
  );
}

export function JourneyExperience() {
  const learningProgress = useLearningProgress();
  const [journeyState, setJourneyState] = useState<JourneyState>(() =>
    createInitialJourneyState(runtimeFixture),
  );
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [layer, setLayer] = useState<JourneyLayer>("raw");
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("sync");
  const [visitedActs, setVisitedActs] = useState<Set<number>>(() => new Set([1]));
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [bestScore, setBestScore] = useState(0);
  const [predictionAnswers, setPredictionAnswers] = useState<Record<string, string>>({});
  const [progressStatus, setProgressStatus] =
    useState<LessonProgressStatus>("in_progress");
  const [curriculumLearnerStatus, setCurriculumLearnerStatus] =
    useState<CurriculumLearnerStatusMap>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [microscopeOpen, setMicroscopeOpen] = useState(false);
  const experienceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const knowledgeCheckRef = useRef<HTMLDivElement>(null);
  const lighttableTriggerRef = useRef<HTMLButtonElement>(null);
  const lighttableRef = useRef<HTMLDivElement>(null);
  const localProgressRef = useRef<LocalProgressV2 | null>(null);
  const skipNextPersistenceRef = useRef(false);
  const reviewPendingRef = useRef(false);
  const hydrationCompleteRef = useRef(false);
  const [activeCompassPhase, setActiveCompassPhase] = useState<LearningCompassPhaseId>("orient");
  const activeCompassPhaseRef = useRef<LearningCompassPhaseId>("orient");
  const journeyCompassTimerRef = useRef<number | null>(null);

  const events = runtimeFixture.events;
  const currentAct = sampleJourneyLesson.acts[journeyState.act - 1];
  const previousAct = sampleJourneyLesson.acts[journeyState.act - 2];
  const nextAct = sampleJourneyLesson.acts[journeyState.act];
  const hookRevealAct = actNumberFromId(sampleJourneyLesson.hook.revealAfterActId);
  const hookResolved = visitedActs.has(hookRevealAct);
  const currentPredictionAnswer = predictionAnswers[currentAct.id];
  const currentPredictionCorrect =
    currentPredictionAnswer === currentAct.prediction.correctOptionId;
  const actPositionPercent = Math.round(
    (journeyState.act / sampleJourneyLesson.acts.length) * 100,
  );
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
        window.setTimeout(() => {
          stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          stageRef.current?.focus({ preventScroll: true });
        }, 0);
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
    if (!learningProgress.hydrated || hydrationCompleteRef.current) return;
    hydrationCompleteRef.current = true;
    const hydrationTimer = window.setTimeout(() => {
      try {
        const localProgress = learningProgress.progress;
        localProgressRef.current = localProgress;
        setCurriculumLearnerStatus(deriveCurriculumLearnerStatus(localProgress));
        const stored =
          localProgress.lessons[sampleJourneyLesson.metadata.id];
        const storedResume =
          stored?.resume?.kind === "sample-journey" &&
          (stored.resume.fixture_id === null ||
            stored.resume.fixture_id === runtimeFixture.fixture_id)
            ? stored.resume
            : null;
        const params = new URLSearchParams(window.location.search);
        const requestedPhase = window.location.hash.slice(1);
        const restoredPhase = LEARNING_COMPASS_PHASES.some((phase) => phase.id === requestedPhase)
          ? requestedPhase as LearningCompassPhaseId
          : "orient";
        activeCompassPhaseRef.current = restoredPhase;
        setActiveCompassPhase(restoredPhase);
        if (requestedPhase && requestedPhase !== restoredPhase) {
          const normalizedUrl = new URL(window.location.href);
          normalizedUrl.hash = "";
          window.history.replaceState(window.history.state, "", normalizedUrl);
        }

        let selectedSampleId = storedResume?.selected_sample_id ?? "a0";
        const querySample = params.get("sample");
        if (querySample && runtimeFixture.initial_samples[querySample]) {
          selectedSampleId = querySample;
        }
        if (!runtimeFixture.initial_samples[selectedSampleId]) selectedSampleId = "a0";

        let eventId = storedResume?.event_id ?? events[0].id;
        const queryEvent = params.get("event");
        if (queryEvent && events.some((event) => event.id === queryEvent)) eventId = queryEvent;
        if (!events.some((event) => event.id === eventId)) eventId = events[0].id;

        const hydratedState = seekJourney(runtimeFixture, eventId, selectedSampleId);
        setJourneyState(hydratedState);
        setTimelineMode(
          params.get("timeline") === "async"
            ? "async"
            : storedResume?.timeline_mode ?? "sync",
        );

        const storedActs = actsFromProgress(stored);
        const restoredActs = storedActs.length ? storedActs : [1];
        setVisitedActs(new Set([...restoredActs, hydratedState.act]));
        if (stored) {
          setAnswers(answersFromProgress(stored));
          setBestScore(stored.final_assessment?.best_score ?? 0);
          const evaluation = evaluateLessonProgressV2(
            stored,
            progressManifest,
          );
          reviewPendingRef.current =
            evaluation.status === "review_required";
          setProgressStatus(evaluation.status);
        } else {
          setProgressStatus("not_started");
        }
      } catch {
        setStorageUnavailable(true);
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [events, learningProgress.hydrated, learningProgress.progress]);

  useEffect(() => {
    if (!storageReady || storageUnavailable) return;
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      return;
    }
    if (reviewPendingRef.current) return;
    try {
      let progress =
        localProgressRef.current ?? loadLocalProgressV2(window.localStorage);
      let changed = false;
      const stored = progress.lessons[sampleJourneyLesson.metadata.id];
      const storedSections = new Set(
        stored?.lesson_revision === progressManifest.lesson_revision
          ? stored.visited_sections
          : [],
      );
      for (const act of [...visitedActs].sort((left, right) => left - right)) {
        const sectionId = `act-${act}`;
        if (storedSections.has(sectionId)) continue;
        progress = applyLessonProgressEvent(
          progress,
          sampleJourneyLesson.metadata.id,
          progressManifest,
          { type: "section-visited", section_id: sectionId },
        );
        changed = true;
      }
      if (
        !sameJourneyResume(
          progress.lessons[sampleJourneyLesson.metadata.id],
          journeyState.event_id,
          journeyState.selected_sample_id,
          timelineMode,
        )
      ) {
        progress = applyLessonProgressEvent(
          progress,
          sampleJourneyLesson.metadata.id,
          progressManifest,
          {
            type: "resume-updated",
            resume: {
              kind: "sample-journey",
              event_id: journeyState.event_id,
              selected_sample_id: journeyState.selected_sample_id,
              timeline_mode: timelineMode,
              fixture_id: runtimeFixture.fixture_id,
            },
          },
        );
        changed = true;
      }
      if (changed) saveLocalProgressV2(window.localStorage, progress);
      localProgressRef.current = progress;
      replaceLearningProgress(progress);
      setCurriculumLearnerStatus(deriveCurriculumLearnerStatus(progress));
      setProgressStatus(
        evaluateLessonProgressV2(
          progress.lessons[sampleJourneyLesson.metadata.id],
          progressManifest,
        ).status,
      );
    } catch {
      window.queueMicrotask(() => setStorageUnavailable(true));
    }
  }, [
    journeyState.event_id,
    journeyState.selected_sample_id,
    storageReady,
    storageUnavailable,
    timelineMode,
    visitedActs,
  ]);

  useEffect(() => {
    if (!storageReady) return;
    localProgressRef.current = learningProgress.progress;
    const learnerStatus = deriveCurriculumLearnerStatus(learningProgress.progress);
    const stored = learningProgress.progress.lessons[sampleJourneyLesson.metadata.id];
    const nextProgressStatus = stored
      ? evaluateLessonProgressV2(stored, progressManifest).status
      : "not_started";
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setCurriculumLearnerStatus(learnerStatus);
      setProgressStatus(nextProgressStatus);
      if (learningProgress.persistenceUnavailable) setStorageUnavailable(true);
    });
    return () => {
      cancelled = true;
    };
  }, [learningProgress.persistenceUnavailable, learningProgress.progress, storageReady]);

  const beginRevisedProgress = useCallback(() => {
    reviewPendingRef.current = false;
    if (!storageReady || storageUnavailable) {
      setProgressStatus("in_progress");
      return;
    }
    try {
      let progress = localProgressRef.current ?? loadLocalProgressV2(window.localStorage);
      progress = applyLessonProgressEvent(
        progress,
        sampleJourneyLesson.metadata.id,
        progressManifest,
        { type: "revision-started" },
      );
      for (const act of [...visitedActs].sort((left, right) => left - right)) {
        progress = applyLessonProgressEvent(
          progress,
          sampleJourneyLesson.metadata.id,
          progressManifest,
          { type: "section-visited", section_id: `act-${act}` },
        );
      }
      progress = applyLessonProgressEvent(
        progress,
        sampleJourneyLesson.metadata.id,
        progressManifest,
        {
          type: "resume-updated",
          resume: {
            kind: "sample-journey",
            event_id: journeyState.event_id,
            selected_sample_id: journeyState.selected_sample_id,
            timeline_mode: timelineMode,
            fixture_id: runtimeFixture.fixture_id,
          },
        },
      );
      saveLocalProgressV2(window.localStorage, progress);
      localProgressRef.current = progress;
      replaceLearningProgress(progress);
      setCurriculumLearnerStatus(deriveCurriculumLearnerStatus(progress));
      setProgressStatus("in_progress");
    } catch {
      setStorageUnavailable(true);
    }
  }, [
    journeyState.event_id,
    journeyState.selected_sample_id,
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
    const restoreLocation = () => {
      const url = new URL(window.location.href);
      const eventId = url.searchParams.get("event");
      const sampleId = url.searchParams.get("sample");
      const phaseId = url.hash.slice(1);
      const validEvent = eventId && events.some((event) => event.id === eventId)
        ? eventId
        : events[0].id;
      const validSample = sampleId && runtimeFixture.initial_samples[sampleId]
        ? sampleId
        : "a0";
      const validPhase = LEARNING_COMPASS_PHASES.some((phase) => phase.id === phaseId)
        ? phaseId as LearningCompassPhaseId
        : "orient";
      if (phaseId && phaseId !== validPhase) {
        url.hash = "";
        window.history.replaceState(window.history.state, "", url);
      }
      setPlayback("paused");
      setJourneyState(seekJourney(runtimeFixture, validEvent, validSample));
      setTimelineMode(url.searchParams.get("timeline") === "async" ? "async" : "sync");
      activeCompassPhaseRef.current = validPhase;
      setActiveCompassPhase(validPhase);
      window.setTimeout(() => {
        const target = document.getElementById(validPhase) ?? stageRef.current;
        target?.scrollIntoView({ behavior: "auto", block: "start" });
        target?.focus({ preventScroll: true });
      }, 0);
    };
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, [events]);

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
          if (event.shiftKey) seekAct(Math.max(1, journeyState.act - 1), true);
          else performAction({ type: "previous" });
          break;
        case "ArrowRight":
          if (event.shiftKey) seekAct(Math.min(7, journeyState.act + 1), true);
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

  useEffect(() => {
    if (!microscopeOpen) return;
    const dialog = lighttableRef.current;
    const root = experienceRef.current;
    const trigger = lighttableTriggerRef.current;
    if (!dialog || !root) return;

    const workbench = dialog.parentElement;
    const backgroundElements = [
      ...Array.from(
        document.querySelectorAll<HTMLElement>(".site-header, .site-footer, .skip-link"),
      ),
      ...Array.from(root.children).filter((element) => element !== workbench),
      ...Array.from(workbench?.children ?? []).filter(
        (element) =>
          element !== dialog &&
          !element.classList.contains("journey-lighttable-backdrop"),
      ),
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);
    const previousStates = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    previousStates.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "summary",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const focusableItems = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true",
      );
    const focusFrame = window.requestAnimationFrame(() => {
      (focusableItems()[0] ?? dialog).focus();
    });

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMicroscopeOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableItems();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleModalKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleModalKeyDown);
      previousStates.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      document.body.style.overflow = previousBodyOverflow;
      trigger?.focus();
    };
  }, [microscopeOpen]);

  const handleAssessmentSubmit = (
    nextAnswers: AnswerMap,
    result: AssessmentResult,
  ) => {
    reviewPendingRef.current = false;
    setAnswers(nextAnswers);
    setBestScore((current) => Math.max(current, result.score));
    if (!storageReady || storageUnavailable) {
      setProgressStatus(result.completed ? "completed" : "in_progress");
      return;
    }

    try {
      let progress =
        localProgressRef.current ?? loadLocalProgressV2(window.localStorage);
      progress = applyLessonProgressEvent(
        progress,
        sampleJourneyLesson.metadata.id,
        progressManifest,
        { type: "revision-started" },
      );
      const stored = progress.lessons[sampleJourneyLesson.metadata.id];
      const storedSections = new Set(
        stored?.lesson_revision === progressManifest.lesson_revision
          ? stored.visited_sections
          : [],
      );
      for (const act of [...visitedActs].sort((left, right) => left - right)) {
        const sectionId = `act-${act}`;
        if (storedSections.has(sectionId)) continue;
        progress = applyLessonProgressEvent(
          progress,
          sampleJourneyLesson.metadata.id,
          progressManifest,
          { type: "section-visited", section_id: sectionId },
        );
      }
      for (const question of assessmentQuestions()) {
        const response = responseForAnswer(
          question,
          nextAnswers[question.id] ?? [],
        );
        if (!response) continue;
        progress = applyLessonProgressEvent(
          progress,
          sampleJourneyLesson.metadata.id,
          progressManifest,
          {
            type: "exercise-submitted",
            exercise_id: question.id,
            response,
            passed: result.correctIds.includes(question.id),
          },
        );
      }
      progress = applyLessonProgressEvent(
        progress,
        sampleJourneyLesson.metadata.id,
        progressManifest,
        {
          type: "assessment-submitted",
          correct_question_ids: result.correctIds,
        },
      );
      saveLocalProgressV2(window.localStorage, progress);
      localProgressRef.current = progress;
      replaceLearningProgress(progress);
      setCurriculumLearnerStatus(deriveCurriculumLearnerStatus(progress));
      setProgressStatus(
        evaluateLessonProgressV2(
          progress.lessons[sampleJourneyLesson.metadata.id],
          progressManifest,
        ).status,
      );
    } catch {
      setStorageUnavailable(true);
      setProgressStatus(result.completed ? "completed" : "in_progress");
    }
  };

  const clearProgress = () => {
    if (!window.confirm("清除本课在此设备上的播放位置、答题记录和完成状态？")) return;
    try {
      reviewPendingRef.current = false;
      const clearedProgress = clearLessonProgressV2(
        window.localStorage,
        sampleJourneyLesson.metadata.id,
      );
      localProgressRef.current = clearedProgress;
      replaceLearningProgress(clearedProgress);
      setCurriculumLearnerStatus(deriveCurriculumLearnerStatus(clearedProgress));
      skipNextPersistenceRef.current = true;
    } catch {
      setStorageUnavailable(true);
    }
    setVisitedActs(new Set([1]));
    setAnswers({});
    setBestScore(0);
    setPredictionAnswers({});
    setProgressStatus("not_started");
    recoverOfficialFixture();
  };

  const phaseValueText = `第 ${journeyState.event_index + 1} 个事件：${journeyState.title}`;

  const journeyCompassChapters = useMemo(() => sampleJourneyLesson.acts.map((act) => ({
    id: act.id,
    label: `第 ${act.number} 幕 · ${act.title}`,
    shortLabel: `${String(act.number).padStart(2, "0")} · ${act.shortTitle}`,
    durationMinutes: act.durationMinutes,
    href: `/learn/sample-journey?event=${encodeURIComponent(events.find((event) => event.act === act.number)?.id ?? events[0].id)}`,
    phases: LEARNING_COMPASS_PHASES,
    position: act.number,
  })), [events]);

  const navigateJourneyCompass = useCallback((target: LearningCompassTarget) => {
    const act = sampleJourneyLesson.acts.find((item) => item.id === target.chapterId);
    if (!act) return;
    const targetEvent = events.find((event) => event.act === act.number);
    seekAct(act.number, false);
    activeCompassPhaseRef.current = target.phaseId;
    setActiveCompassPhase(target.phaseId);
    const url = new URL(window.location.href);
    if (targetEvent) url.searchParams.set("event", targetEvent.id);
    url.hash = target.phaseId;
    window.history.pushState(window.history.state, "", url);
    window.setTimeout(() => {
      const targetElement = document.getElementById(target.phaseId);
      targetElement?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      targetElement?.focus({ preventScroll: true });
    }, 0);
  }, [events, seekAct]);

  const journeyChapterIndex = Math.max(0, journeyCompassChapters.findIndex(
    (chapter) => chapter.id === currentAct.id,
  ));
  const journeyNextChapter = journeyCompassChapters[journeyChapterIndex + 1];
  const journeyCompassRegistration = useMemo(() => ({
    stage: { label: "系统总览", href: "/learn#stage-system-overview", position: 2 },
    course: {
      label: sampleJourneyLesson.metadata.title,
      href: "/learn/sample-journey",
      durationMinutes: sampleJourneyLesson.metadata.duration.maxMinutes,
      position: 1,
    },
    chapters: journeyCompassChapters,
    chapterCount: sampleJourneyLesson.acts.length,
    chapterNoun: "幕" as const,
    activeChapterId: currentAct.id,
    activePhaseId: activeCompassPhase,
    next: journeyNextChapter
      ? { label: journeyNextChapter.shortLabel, href: `${journeyNextChapter.href}#orient` }
      : null,
    navigate: navigateJourneyCompass,
  }), [
    activeCompassPhase,
    currentAct.id,
    journeyCompassChapters,
    journeyNextChapter,
    navigateJourneyCompass,
  ]);
  useLearningCompassRegistration(journeyCompassRegistration);

  useEffect(() => {
    const targets: Array<[LearningCompassPhaseId, string]> = [
      ["orient", "#journey-stage-title"],
      ["model", `#${currentAct.id}-prediction-title`],
      ["verify", ".journey-deep-evidence"],
      ["practice", ".journey-act-pager"],
    ];
    const created = targets.flatMap(([phaseId, selector]) => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target || document.getElementById(phaseId)) return [];
      const anchor = document.createElement("span");
      anchor.id = phaseId;
      anchor.className = "learning-phase-anchor";
      anchor.tabIndex = -1;
      anchor.setAttribute("aria-label", LEARNING_COMPASS_PHASES.find((phase) => phase.id === phaseId)?.label ?? phaseId);
      target.before(anchor);
      return [anchor];
    });
    const onScroll = () => {
      let visible: LearningCompassPhaseId = "orient";
      for (const phase of LEARNING_COMPASS_PHASES) {
        const target = document.getElementById(phase.id);
        if (target && target.getBoundingClientRect().top <= 150) visible = phase.id;
      }
      if (visible === activeCompassPhaseRef.current) return;
      activeCompassPhaseRef.current = visible;
      setActiveCompassPhase(visible);
      if (journeyCompassTimerRef.current !== null) {
        window.clearTimeout(journeyCompassTimerRef.current);
      }
      journeyCompassTimerRef.current = window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.hash = visible;
        window.history.replaceState(window.history.state, "", url);
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      created.forEach((anchor) => anchor.remove());
      if (journeyCompassTimerRef.current !== null) window.clearTimeout(journeyCompassTimerRef.current);
    };
  }, [currentAct.id]);

  return (
    <div
      className="journey-experience film-reader"
      ref={experienceRef}
      role="region"
      aria-label="一条 Sample 的状态演化交互课程"
    >
      <header className="journey-opening-sheet">
        <div className="journey-opening-copy">
          <h1>一条 Sample 的状态演化</h1>
          <p>{sampleJourneyLesson.metadata.summary}</p>
          <dl className="journey-opening-meta">
            <div><dt>固定源码</dt><dd><code>06ffdbe2</code></dd></div>
            <div><dt>核心阅读</dt><dd>{sampleJourneyLesson.metadata.studyModes.core.duration}</dd></div>
            <div><dt>当前进度</dt><dd>{visitedActs.size} / {sampleJourneyLesson.acts.length} 幕</dd></div>
          </dl>
        </div>

        <section className="journey-opening-hook" aria-labelledby="journey-hook-title">
          <h2 id="journey-hook-title">{sampleJourneyLesson.hook.question}</h2>
          <p>
            两条记录的回答和 reward 完全相同，但训练结果不同。先不要记结论；沿七个系统边界追踪差异在哪里获得训练语义。
          </p>
          <div className="journey-hook-samples" aria-label="两条待比较的 Sample">
            <article>
              <span>Sample A</span>
              <code>{sampleJourneyLesson.hook.sampleA}</code>
            </article>
            <article>
              <span>Sample B</span>
              <code>{sampleJourneyLesson.hook.sampleB}</code>
            </article>
          </div>
          <div className={`journey-hook-resolution ${hookResolved ? "is-revealed" : ""}`} aria-live="polite">
            <span>
              {hookResolved
                ? `第 ${hookRevealAct} 幕结论已解锁`
                : `答案将在第 ${hookRevealAct} 幕揭示`}
            </span>
            {hookResolved ? (
              <strong><InlineCodeText text={sampleJourneyLesson.hook.resolution} /></strong>
            ) : (
              <p>阅读时只问一件事：当前组件改变了哪些字段，又把什么交给了下一个组件？</p>
            )}
          </div>
        </section>

        <div className="journey-opening-progress" aria-label={`课程状态：${statusLabels[progressStatus]}`}>
          <div>
            <span>{statusLabels[progressStatus]}</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="journey-progress-bar" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></div>
          <small>
            最佳检查成绩 {bestScore}/{sampleJourneyLesson.assessment.questions.length}
          </small>
          <button className="journey-progress-clear" type="button" onClick={clearProgress}>
            清除本课进度
          </button>
        </div>
      </header>

      <details className="journey-briefing-sheet">
        <summary>
          <span>
            <strong>阅读前先定好观察尺度</strong>
            <small>查看学习目标、阅读方式与示例边界</small>
          </span>
          <b>展开讲义</b>
        </summary>
        <div className="journey-briefing-body">
          <section aria-labelledby="journey-objectives-title">
            <h2 id="journey-objectives-title">学完后，你应该能独立解释</h2>
            <ol>
              {sampleJourneyLesson.metadata.learningObjectives.map((objective, index) => (
                <li key={objective}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p><InlineCodeText text={objective} /></p>
                </li>
              ))}
            </ol>
          </section>
          <aside>
            {Object.entries(sampleJourneyLesson.metadata.studyModes).map(([modeId, mode]) => (
              <div key={modeId}>
                <strong>{mode.label} · {mode.duration}</strong>
                <span>{mode.includes}</span>
              </div>
            ))}
            <p><strong>示例边界</strong>{runtimeFixture.teaching_values_notice}</p>
          </aside>
        </div>
      </details>

      {storageUnavailable ? (
        <p className="journey-storage-warning" role="status">
          当前浏览器无法保存本地进度；课程仍可完整操作，本次关闭页面后记录可能丢失。
        </p>
      ) : null}

      {progressStatus === "review_required" ? (
        <aside className="journey-review-notice" role="status">
          <div>
            <strong>这门导论已经修订</strong>
            <p>旧记录会继续保留。浏览幕次、播放事件和切换时间线都不会建立新版记录；明确开始复习或提交预测、终测时才会开始。</p>
          </div>
          <button type="button" onClick={beginRevisedProgress}>按新版学习</button>
        </aside>
      ) : null}

      <div className={`journey-workbench ${currentAct.number === 1 ? "is-first-act" : ""}`}>
        <aside className="journey-act-rail" aria-label="课程幕次导航">
          <header className="journey-act-rail-heading">
            <div>
              <span>七幕曝光轨</span>
              <strong>
                第 {journeyState.act} / {sampleJourneyLesson.acts.length} 幕
              </strong>
            </div>
            <span>{actPositionPercent}%</span>
          </header>
          <div className="journey-act-rail-progress" aria-hidden="true">
            <i style={{ width: `${actPositionPercent}%` }} />
          </div>
          <label className="journey-act-select">
            <span>快速切换幕次</span>
            <select
              value={journeyState.act}
              onChange={(event) => seekAct(Number(event.currentTarget.value), true)}
            >
              {sampleJourneyLesson.acts.map((act) => (
                <option value={act.number} key={act.id}>
                  第 {act.number} 幕 · {act.shortTitle} · {act.durationMinutes} 分钟
                </option>
              ))}
            </select>
          </label>
          <nav>
            {sampleJourneyLesson.acts.map((act) => (
              <button
                id={act.id}
                className={`journey-act-button ${act.number === journeyState.act ? "is-current" : ""} ${visitedActs.has(act.number) ? "is-visited" : ""}`}
                type="button"
                aria-current={act.number === journeyState.act ? "step" : undefined}
                onClick={() => seekAct(act.number, true)}
                key={act.id}
              >
                <span>{String(act.number).padStart(2, "0")}</span>
                <b>{act.shortTitle}</b>
                <small>{act.durationMinutes} 分</small>
              </button>
              ))}
          </nav>
          <button
            className="journey-lighttable-trigger"
            ref={lighttableTriggerRef}
            type="button"
            aria-label={`观察 ${journeyState.act === 1 ? "初始记录" : journeyState.selected_sample_id}`}
            aria-expanded={microscopeOpen}
            aria-controls="journey-sample-lighttable"
            onClick={() => setMicroscopeOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6.5h16v11H4z" />
              <path d="M8 10h8M8 13.5h5" />
              <circle cx="18.5" cy="5.5" r="2.5" />
            </svg>
            <span>
              <small>透写台</small>
              <strong>观察 {journeyState.act === 1 ? "初始记录" : journeyState.selected_sample_id}</strong>
            </span>
          </button>
        </aside>

        <section
          className={`journey-stage is-act-${currentAct.number} ${currentAct.number === 1 ? "is-first-act" : ""}`}
          ref={stageRef}
          tabIndex={-1}
          aria-labelledby="journey-stage-title"
        >
          <header className="journey-stage-header">
            <h2 id="journey-stage-title">{currentAct.title}</h2>
            <div className="journey-stage-header-top">
              <span className="journey-production-mark">第 {journeyState.act} 幕 · {currentAct.stage.actor}</span>
              <span>{journeyState.phase}</span>
            </div>
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

          <section className="journey-prediction" aria-labelledby={`${currentAct.id}-prediction-title`}>
            <header>
              <span>播放前先预测</span>
              <h3 id={`${currentAct.id}-prediction-title`}>
                {currentAct.prediction.prompt}
              </h3>
            </header>
            <div className="journey-prediction-options" role="group" aria-label="选择你的预测">
              {currentAct.prediction.options.map((option) => {
                const selected = currentPredictionAnswer === option.id;
                return (
                  <button
                    className={`journey-prediction-option ${selected ? "is-selected" : ""}`}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      if (reviewPendingRef.current) beginRevisedProgress();
                      setPredictionAnswers((current) => ({
                        ...current,
                        [currentAct.id]: option.id,
                      }));
                    }}
                    key={option.id}
                  >
                    <span aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            {currentPredictionAnswer ? (
              <p
                className={`journey-prediction-feedback ${currentPredictionCorrect ? "is-correct" : "is-incorrect"}`}
                role="status"
              >
                <strong>{currentPredictionCorrect ? "预测成立。" : "这个预测需要修正。"}</strong>{" "}
                {currentPredictionCorrect
                  ? currentAct.prediction.feedback.correct
                  : currentAct.prediction.feedback.incorrect}
              </p>
            ) : (
              <p className="journey-prediction-hint">选择后即可看到反馈；不选择也可以直接播放。</p>
            )}
          </section>

          <div className="journey-player-controls" aria-label="播放器控制">
            <div className="journey-player-buttons">
              <button
                className="journey-icon-button"
                type="button"
                aria-label="重播"
                onClick={() => { performAction({ type: "reset" }); setPlayback("idle"); }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 8V4m0 0h4M5 4l3.2 3.2A7 7 0 1 1 5.6 15" />
                </svg>
              </button>
              <button
                className="journey-icon-button journey-event-step"
                type="button"
                aria-label="上一个事件"
                disabled={journeyState.event_index === 0 || playback === "error"}
                onClick={() => performAction({ type: "previous" })}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
                <small>上一事件</small>
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
                className="journey-icon-button journey-event-step"
                type="button"
                aria-label="下一个事件"
                disabled={journeyState.event_index === events.length - 1 || playback === "error"}
                onClick={() => performAction({ type: "next" })}
              >
                <small>下一事件</small>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
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
              <small>事件</small>
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
              {currentAct.narrative ? (
                <article className={`journey-act-story ${currentAct.number === 1 ? "is-keyframe-opening" : ""}`}>
                  <div className="journey-act-story-copy">
                    <h3>{currentAct.narrative.title}</h3>
                    <span className="journey-production-mark">{currentAct.narrative.kicker}</span>
                    {currentAct.narrative.paragraphs.map((paragraph) => (
                      <p key={paragraph}><InlineCodeText text={paragraph} /></p>
                    ))}
                    <div className="journey-direct-answer">
                      <span>本幕结论</span>
                      <strong>{currentAct.drivingQuestion}</strong>
                      <p><InlineCodeText text={currentAct.narrative.directAnswer} /></p>
                    </div>
                    <blockquote><InlineCodeText text={currentAct.narrative.takeaway} /></blockquote>
                  </div>
                  <figure className="journey-act-keyframe">
                    <span className="journey-keyframe-tape" aria-hidden="true" />
                    <span className="journey-keyframe-pegs" aria-hidden="true"><i /><i /><i /></span>
                    <img
                      src={actKeyframes[currentAct.number].src}
                      alt={actKeyframes[currentAct.number].alt}
                      width="1600"
                      height="900"
                      loading={currentAct.number <= 2 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    <figcaption>
                      <span>{actKeyframes[currentAct.number].mark}</span>
                      <strong>{actKeyframes[currentAct.number].caption}</strong>
                    </figcaption>
                  </figure>
                </article>
              ) : null}

              {currentAct.walkthrough ? (
                <section
                  className="journey-walkthrough"
                  aria-labelledby={`${currentAct.id}-walkthrough-title`}
                >
                  <header>
                    <h3 id={`${currentAct.id}-walkthrough-title`}>
                      {currentAct.walkthrough.title}
                    </h3>
                    <span className="journey-production-mark">{currentAct.walkthrough.kicker}</span>
                    <p><InlineCodeText text={currentAct.walkthrough.introduction} /></p>
                  </header>
                  <div className="journey-walkthrough-grid">
                    {currentAct.walkthrough.steps.map((step) => (
                      <article key={step.label}>
                        <span>{step.label}</span>
                        <h4>{step.title}</h4>
                        <p><InlineCodeText text={step.body} /></p>
                        <ul>
                          {step.facts.map((fact) => (
                            <li key={fact}><code>{fact}</code></li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                  <p className="journey-walkthrough-caption">
                    <strong>实例结论</strong>
                    <span><InlineCodeText text={currentAct.walkthrough.caption} /></span>
                  </p>
                </section>
              ) : null}

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
                <p><InlineCodeText text={journeyState.narration} /></p>
              </article>

              {currentAct.number === 1 && selectedSample ? (
                <section className="journey-birth-snapshot" aria-labelledby="birth-snapshot-title">
                  <header>
                    <div>
                      <h3 id="birth-snapshot-title">Dataset 构造前后的数据表示</h3>
                      <span className="journey-production-mark">单一转换 · 字段对照</span>
                    </div>
                    <span>同组候选由下一幕构造</span>
                  </header>
                  <div className="journey-birth-flow">
                    <article>
                      <p>外部数据表示</p>
                      <h4><code>dataset row</code></h4>
                      <dl>
                        <div><dt><code>text</code></dt><dd>{selectedSample.prompt}</dd></div>
                        <div><dt><code>label</code></dt><dd>{selectedSample.label ?? "None"}</dd></div>
                        <div><dt><code>metadata</code></dt><dd><code>{JSON.stringify(selectedSample.metadata)}</code></dd></div>
                      </dl>
                    </article>
                    <div className="journey-birth-arrow" aria-label="Dataset 读取并构造">
                      <span aria-hidden="true">→</span>
                      <b>Dataset</b>
                      <small>读取并构造</small>
                    </div>
                    <article className="is-sample">
                      <p>框架内部表示</p>
                      <h4>
                        <code>Sample</code>
                        <span>{String(selectedSample.status).toUpperCase()}</span>
                      </h4>
                      <dl>
                        <div><dt><code>prompt</code></dt><dd>已保存题目</dd></div>
                        <div><dt><code>tokens</code></dt><dd><code>[]</code></dd></div>
                        <div><dt><code>response</code></dt><dd>空字符串</dd></div>
                        <div><dt><code>reward / loss_mask</code></dt><dd><code>None / None</code></dd></div>
                      </dl>
                    </article>
                  </div>
                </section>
              ) : (
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
              )}

              <article className="journey-act-reading">
                <section className="journey-field-changes" aria-labelledby="field-changes-title">
                  <header>
                    <span>字段快照</span>
                    <h4 id="field-changes-title">本幕产生的状态变化</h4>
                  </header>
                  <ul>
                    {currentAct.fieldChanges.map((change) => (
                      <li key={change}><InlineCodeText text={change} /></li>
                    ))}
                  </ul>
                </section>
                <div className="journey-misconception">
                  <span><b>常见误解：</b><InlineCodeText text={currentAct.misconception.belief} /></span>
                  <strong>纠正：<InlineCodeText text={currentAct.misconception.correction} /></strong>
                </div>

                <nav className="journey-act-terms" aria-label="本幕术语入口">
                  <span>本幕术语</span>
                  <div>
                    {currentAct.glossaryTermIds.map((termId) => {
                      const term = glossaryTermsById.get(termId);
                      return (
                        <a href={`/glossary#${termId}`} key={termId}>
                          <strong>{term?.zhLabel ?? termId}</strong>
                          {term ? <code>{term.codeLabel}</code> : null}
                        </a>
                      );
                    })}
                  </div>
                </nav>

                <details className="journey-deep-evidence">
                  <summary>
                    <span>
                      <strong>深入证据</strong>
                      <small>源码事实、fixture 边界、进阶说明与事件文字稿</small>
                    </span>
                    <b>展开核对</b>
                  </summary>
                  <div className="journey-deep-evidence-body">
                    {currentAct.narrative ? (
                      <p className="journey-evidence-lead">{currentAct.narrative.evidenceLead}</p>
                    ) : (
                      <p className="journey-driving-question">{currentAct.drivingQuestion}</p>
                    )}
                    <div className="journey-content-blocks">
                      {currentAct.explanation.map((block) => (
                        <section className={`journey-content-block is-${block.kind}`} key={block.id}>
                          <span>{truthLabels[block.kind]}</span>
                          {block.title ? <h4>{block.title}</h4> : null}
                          <p><InlineCodeText text={block.body} /></p>
                        </section>
                      ))}
                    </div>
                    <details className="journey-micro-check">
                      <summary>补充检查：{currentAct.microCheck.prompt}</summary>
                      <p>
                        <strong><InlineCodeText text={currentAct.microCheck.answer} /></strong>
                        <br />
                        <InlineCodeText text={currentAct.microCheck.feedback} />
                      </p>
                    </details>
                    <div className="journey-source-proof">
                      <span>固定版本源码锚点</span>
                      <div className="journey-source-links" aria-label="本幕源码证据">
                        {currentAct.sourceRefIds.map((sourceRefId) => (
                          <a href={`/source#${sourceRefId}`} key={sourceRefId}>
                            <strong>{sourceRefLabels[sourceRefId]?.title ?? sourceRefId}</strong>
                            {sourceRefLabels[sourceRefId] ? (
                              <code>{sourceRefLabels[sourceRefId].symbol}</code>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    </div>
                    <details className="journey-transcript">
                      <summary>事件文字稿 · {journeyState.event_index + 1}/{events.length}</summary>
                      <p><strong>{journeyState.title}</strong></p>
                      <p><InlineCodeText text={journeyState.transcript} /></p>
                    </details>
                  </div>
                </details>
              </article>

              <nav className="journey-act-pager" aria-label="继续阅读">
                <header>
                  <span>读完第 {currentAct.number} 幕</span>
                  <p><InlineCodeText text={currentAct.transition} /></p>
                </header>
                <div className="journey-act-pager-actions">
                  {previousAct ? (
                    <button
                      className="journey-act-pager-button is-previous"
                      type="button"
                      onClick={() => seekAct(previousAct.number, true)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
                      <span>
                        <small>返回第 {previousAct.number} 幕</small>
                        <strong>{previousAct.shortTitle}</strong>
                      </span>
                    </button>
                  ) : null}
                  {nextAct ? (
                    <button
                      className="journey-act-pager-button is-next"
                      type="button"
                      onClick={() => seekAct(nextAct.number, true)}
                    >
                      <span>
                        <small>继续第 {nextAct.number} 幕</small>
                        <strong>{nextAct.shortTitle}</strong>
                      </span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
                    </button>
                  ) : (
                    <button
                      className="journey-act-pager-button is-next"
                      type="button"
                      onClick={() => {
                        knowledgeCheckRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        knowledgeCheckRef.current?.focus({ preventScroll: true });
                      }}
                    >
                      <span>
                        <small>七幕已经读完</small>
                        <strong>进入章末检查</strong>
                      </span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </section>

        <button
          className={`journey-lighttable-backdrop ${microscopeOpen ? "is-open" : ""}`}
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMicroscopeOpen(false)}
        />
        <div
          id="journey-sample-lighttable"
          className={`journey-lighttable ${microscopeOpen ? "is-open" : ""}`}
          ref={lighttableRef}
          role="dialog"
          aria-modal="true"
          aria-label="Sample 透写台"
          aria-hidden={!microscopeOpen}
          tabIndex={-1}
        >
          <header className="journey-lighttable-heading">
            <span>LIGHT TABLE / LIVE STATE</span>
            <button type="button" onClick={() => setMicroscopeOpen(false)}>
              <span>关闭</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <SampleMicroscope
            sampleId={journeyState.selected_sample_id}
            displayLabel={journeyState.act === 1 ? "初始记录" : undefined}
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
      </div>

      <details className="journey-lab-disclosure">
        <summary>
          <span>
            <strong>深入实验</strong>
            <small>用交互工具核对 batch 守恒与同步/异步时间边界。</small>
          </span>
          <b>展开两个实验</b>
        </summary>
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
            onModeChange={(mode) => {
              setTimelineMode(mode);
            }}
            onSeek={(eventId) => performAction({ type: "seek", event_id: eventId })}
          />
        </div>
      </details>

      <div className="journey-knowledge-anchor" ref={knowledgeCheckRef} tabIndex={-1}>
        <KnowledgeCheck
          questions={assessmentQuestions()}
          visitedActs={visitedActs}
          initialAnswers={answers}
          requiredQuestionIds={sampleJourneyLesson.assessment.completion.requiredQuestionIds}
          passScore={sampleJourneyLesson.assessment.completion.minCorrect}
          onSubmit={handleAssessmentSubmit}
          onReturnToAct={(act) => seekAct(act, true)}
        />
      </div>

      <CurriculumPlan
        curriculum={slimeCurriculum}
        variant="compact"
        currentStageId="system-intro"
        headingId="journey-curriculum-title"
        learnerStatusByUnit={curriculumLearnerStatus}
      />

      <footer className="journey-closing-memory">
        <span>结课记忆</span>
        <p><InlineCodeText text={sampleJourneyLesson.closingMemory} /></p>
      </footer>

      <div className="journey-live-region" aria-live="polite">
        {phaseValueText}。{journeyState.narration}
      </div>
    </div>
  );
}
