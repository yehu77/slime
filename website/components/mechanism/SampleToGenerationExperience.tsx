"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import {
  sampleToGenerationCourse,
  type SampleToGenerationChapter,
} from "../../content/zh/lessons/sample-to-generation";
import { sampleToGenerationProgressManifest } from "../../content/zh/course-progress-manifests";
import {
  gradeFinalAssessment,
  sampleToGenerationFixture,
  seekSampleToGeneration,
  type GroupingInitialJudgementSubmission,
  type GroupingInvestigationSubmission,
  type StructuredExerciseAnswer,
} from "../../core/sample-to-generation";
import {
  evaluateLessonProgressV2,
  isLessonProgressCurrentV2,
  recordLearningProgress,
  useLearningProgress,
  type ProgressEvent,
  type StructuredExerciseResponse,
} from "../../core/progress";
import {
  LEARNING_COMPASS_PHASES,
  useLearningCompassRegistration,
  type LearningCompassPhaseId,
  type LearningCompassTarget,
} from "../site/learning-compass-store";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import {
  ChapterOneTranslationDesk,
} from "./ChapterOneTranslationDesk";
import { ChapterTwoProvenanceRelay } from "./ChapterTwoProvenanceRelay";
import { ChapterThreeGroupingInvestigation } from "./ChapterThreeGroupingInvestigation";
import { ChapterFourRequestBoundary } from "./ChapterFourRequestBoundary";
import { ChapterFiveResponseEvidence } from "./ChapterFiveResponseEvidence";
import { ChapterSixWritebackCalibration } from "./ChapterSixWritebackCalibration";
import { FinalTraceAssessmentReader } from "./FinalTraceAssessmentReader";
import {
  hasChapterFiveResponseEvidenceData,
  hasChapterFourRequestBoundaryData,
  hasChapterOneTranslationData,
  hasChapterSixWritebackData,
  hasChapterThreeGroupingData,
  hasChapterTwoProvenanceData,
} from "./chapter-reader-contracts";
import { SampleStateDrawer } from "./SampleStateDrawer";
import { StructuredExercise as StructuredExerciseView } from "./StructuredExercise";
import {
  SAMPLE_TO_GENERATION_PHASE_SELECTORS,
  sampleToGenerationPhasesFor,
} from "./sample-to-generation-compass";
import "./mechanism-course.css";

type SampleToGenerationExperienceProps = {
  initialChapterSlug?: string | null;
};

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
    end_line: number;
    snippet_sha256: string;
  };
};

const course = sampleToGenerationCourse;
const assessmentSlug = "assessment";
const chapterBySlug = new Map(course.chapters.map((chapter) => [chapter.slug, chapter]));
const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];
const chapterImagePositions = [
  "50% 50%",
  "76% 50%",
  "50% 50%",
  "65% 50%",
  "50% 48%",
  "50% 56%",
  "43% 50%",
] as const;
const observationLabels: Readonly<Record<string, string>> = {
  "rows-read": "文件记录",
  "samples-constructed": "初始 Sample",
  "groups-built": "候选分组",
  "prompts-tokenized": "prompt tokens",
  "requests-prepared": "SGLang 请求",
  "responses-received": "HTTP 响应",
  "responses-written": "Sample 写回",
};

const progressManifest = sampleToGenerationProgressManifest;
const compassPhaseIds = new Set<string>(LEARNING_COMPASS_PHASES.map((phase) => phase.id));

function toStoredResponse(answer: StructuredExerciseAnswer): StructuredExerciseResponse {
  switch (answer.kind) {
    case "choice":
      return { type: "choice", selected_option_ids: [...answer.selectedOptionIds] };
    case "ordering":
      return { type: "ordering", ordered_item_ids: [...answer.orderedItemIds] };
    case "mapping":
      return { type: "mapping", assignments: { ...answer.mapping } };
    case "field-entry":
      return { type: "field-entry", values: { ...answer.values } };
  }
}

function fromStoredResponse(
  response: StructuredExerciseResponse | undefined,
): StructuredExerciseAnswer | undefined {
  if (!response) return undefined;
  switch (response.type) {
    case "choice":
      return { kind: "choice", selectedOptionIds: response.selected_option_ids };
    case "ordering":
      return { kind: "ordering", orderedItemIds: response.ordered_item_ids };
    case "mapping":
      return { kind: "mapping", mapping: response.assignments };
    case "field-entry":
      return { kind: "field-entry", values: response.values };
  }
}

const groupingSubmissionField = "grouping_investigation_v3";
const groupingInitialJudgementField = "grouping_initial_judgement_v1";

function parseStoredJson<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as T
      : undefined;
  } catch {
    return undefined;
  }
}

function toStoredGroupingSubmission(
  submission: GroupingInvestigationSubmission,
): StructuredExerciseResponse {
  return {
    type: "field-entry",
    values: { [groupingSubmissionField]: JSON.stringify(submission) },
  };
}

function fromStoredGroupingSubmission(
  response: StructuredExerciseResponse | undefined,
): GroupingInvestigationSubmission | undefined {
  if (response?.type !== "field-entry") return undefined;
  return parseStoredJson<GroupingInvestigationSubmission>(
    response.values[groupingSubmissionField],
  );
}

function toStoredGroupingInitialJudgement(
  response: GroupingInitialJudgementSubmission,
): StructuredExerciseResponse {
  return {
    type: "field-entry",
    values: { [groupingInitialJudgementField]: JSON.stringify(response) },
  };
}

function fromStoredGroupingInitialJudgement(
  response: StructuredExerciseResponse | null | undefined,
): GroupingInitialJudgementSubmission | undefined {
  if (response?.type !== "field-entry") return undefined;
  return parseStoredJson<GroupingInitialJudgementSubmission>(
    response.values[groupingInitialJudgementField],
  );
}

function statusLabel(status: ReturnType<typeof evaluateLessonProgressV2>["status"]) {
  switch (status) {
    case "not_started": return "尚未开始";
    case "in_progress": return "学习中";
    case "completed": return "已完成";
    case "review_required": return "尚未开始";
  }
}

function sectionUrl(slug: string | null, phaseId?: LearningCompassPhaseId | null) {
  const route = slug ? `/learn/sample-to-generation?chapter=${encodeURIComponent(slug)}` : "/learn/sample-to-generation";
  return phaseId ? `${route}#${phaseId}` : route;
}

function CourseCover({
  invalidChapter,
  continueChapter,
  status,
  onOpen,
}: {
  invalidChapter: string | null;
  continueChapter: SampleToGenerationChapter | undefined;
  status: ReturnType<typeof evaluateLessonProgressV2>["status"];
  onOpen: (slug: string) => void;
}) {
  return (
    <div className="mechanism-cover mechanism-course-content">
      <section className="mechanism-cover-sheet" aria-labelledby="mechanism-cover-title">
        <div className="mechanism-cover-index" aria-hidden="true">
          <span>SLIME LAB</span>
          <b>CORE / 01</b>
          <i /><i /><i /><i />
        </div>
        <div className="mechanism-cover-copy">
          <p className="mechanism-kicker">{course.metadata.durationMinutes.total} 分钟机制课 · 无需 GPU · 固定 commit 06ffdbe2</p>
          <h1 id="mechanism-cover-title" tabIndex={-1}>{course.metadata.title}</h1>
          <p className="mechanism-cover-summary">{course.metadata.summary}</p>
          <blockquote>
            这门课只追踪一件事：一行输入怎样穿过四个边界，最终让原来的 Sample 得到回答。Reward 尚未登场。
          </blockquote>
          {invalidChapter ? (
            <p className="mechanism-query-notice" role="status">
              没有名为“{invalidChapter}”的章节，已回到课程封面。
            </p>
          ) : null}
          <div className="mechanism-cover-actions">
            {continueChapter ? (
              <button className="mechanism-action" type="button" onClick={() => onOpen(continueChapter.slug)}>
                继续第 {continueChapter.number} 章
              </button>
            ) : null}
            <button className={continueChapter ? "mechanism-text-action" : "mechanism-action"} type="button" onClick={() => onOpen(course.chapters[0].slug)}>
              从第一章开始
            </button>
            <a href="/learn">返回课程总路线</a>
          </div>
        </div>
        <dl className="mechanism-cover-facts">
          <div><dt>学习状态</dt><dd>{statusLabel(status)}</dd></div>
          <div><dt>章节</dt><dd>{course.chapters.length} 章 · 共 {course.metadata.durationMinutes.chapters} min</dd></div>
          <div><dt>终测</dt><dd>{course.finalAssessment.checkpoints.length} 题 · {course.metadata.durationMinutes.assessment} min</dd></div>
          <div><dt>完成条件</dt><dd>六章访问与练习通过；终测 7/8 + 四道必答</dd></div>
        </dl>
      </section>

      <section className="mechanism-objectives" aria-labelledby="mechanism-objectives-title">
        <header>
          <span>OUTPUT CONTRACT</span>
          <h2 id="mechanism-objectives-title">学完后，你应当能独立重建这条链路</h2>
        </header>
        <ol>
          {course.learningObjectives.map((objective, index) => (
            <li key={objective}><b>{String(index + 1).padStart(2, "0")}</b><span>{objective}</span></li>
          ))}
        </ol>
      </section>

      <section className="mechanism-cover-map" aria-labelledby="mechanism-map-title">
        <header>
          <span>SIX HANDOFFS / ONE TRACE</span>
          <h2 id="mechanism-map-title">六章不是六个主题，而是六次连续交接</h2>
          <p>{course.teachingValuesNotice}</p>
        </header>
        <ol>
          {course.chapters.map((chapter) => (
            <li key={chapter.id}>
              <button type="button" onClick={() => onOpen(chapter.slug)}>
                <b>{String(chapter.number).padStart(2, "0")}</b>
                <span><strong>{chapter.title}</strong><small>{chapter.durationMinutes} 分钟 · {chapter.drivingQuestion}</small></span>
                <i aria-hidden="true">→</i>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CourseEvidence({ evidenceId }: { evidenceId: string }) {
  const evidence = course.sourceEvidence.find((item) => item.id === evidenceId);
  if (!evidence) return null;
  const anchor = sourceAnchors.find((item) => item.id === evidence.sourceRefId);
  return (
    <GuidedSourceExcerpt
      evidence={evidence}
      sourceUrl={anchor?.url}
      symbol={anchor?.symbol}
      code={anchor?.guided_excerpt?.code}
      lineStart={anchor?.guided_excerpt?.start_line}
    />
  );
}

export function SampleToGenerationExperience({
  initialChapterSlug = null,
}: SampleToGenerationExperienceProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    initialChapterSlug && (chapterBySlug.has(initialChapterSlug) || initialChapterSlug === assessmentSlug)
      ? initialChapterSlug
      : null,
  );
  const [invalidChapter, setInvalidChapter] = useState<string | null>(() =>
    initialChapterSlug && !chapterBySlug.has(initialChapterSlug) && initialChapterSlug !== assessmentSlug
      ? initialChapterSlug
      : null,
  );
  const { progress, hydrated: progressHydrated, persistenceUnavailable } = useLearningProgress();
  const initialHash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  const [activePhaseId, setActivePhaseId] = useState<LearningCompassPhaseId>(() =>
    compassPhaseIds.has(initialHash) ? initialHash as LearningCompassPhaseId : "orient",
  );
  const activePhaseRef = useRef<LearningCompassPhaseId>(
    compassPhaseIds.has(initialHash) ? initialHash as LearningCompassPhaseId : "orient",
  );
  const [invalidHash, setInvalidHash] = useState(() => Boolean(initialHash) && !compassPhaseIds.has(initialHash));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, StructuredExerciseAnswer>>({});
  const [assessmentResult, setAssessmentResult] = useState<ReturnType<typeof gradeFinalAssessment> | null>(null);
  const chapterHeadingRef = useRef<HTMLHeadingElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const passiveHistoryTimerRef = useRef<number | null>(null);
  const passiveReleaseTimerRef = useRef<number | null>(null);
  const phaseScrollFrameRef = useRef<number | null>(null);
  const initialHydrationRecordedRef = useRef(false);
  const suppressPassiveProgressRef = useRef(false);

  useEffect(() => {
    if (!progressHydrated || initialHydrationRecordedRef.current) return;
    initialHydrationRecordedRef.current = true;
    if (invalidHash) return;
    const directChapter = initialChapterSlug
      ? chapterBySlug.get(initialChapterSlug)
      : undefined;
    if (!directChapter) return;
    recordLearningProgress(course.metadata.id, progressManifest, [
      { type: "section-visited", section_id: directChapter.id },
      {
        type: "resume-updated",
        resume: {
          kind: "chaptered",
          chapter_id: directChapter.id,
          section_id: activePhaseId,
        },
      },
    ]);
  }, [activePhaseId, initialChapterSlug, invalidHash, progressHydrated]);

  const record = useCallback((events: readonly ProgressEvent[]) => {
    recordLearningProgress(course.metadata.id, progressManifest, events);
  }, []);

  const recordExplicit = useCallback((events: readonly ProgressEvent[]) => {
    recordLearningProgress(course.metadata.id, progressManifest, events);
  }, []);

  const scrollToPhase = useCallback((slug: string, phaseId: LearningCompassPhaseId, focusTitle = false) => {
    suppressPassiveProgressRef.current = true;
    if (passiveReleaseTimerRef.current !== null) {
      window.clearTimeout(passiveReleaseTimerRef.current);
    }
    passiveReleaseTimerRef.current = window.setTimeout(() => {
      suppressPassiveProgressRef.current = false;
      passiveReleaseTimerRef.current = null;
    }, 1000);
    window.setTimeout(() => {
      const selector = SAMPLE_TO_GENERATION_PHASE_SELECTORS[slug]?.[phaseId];
      const target = selector ? document.querySelector<HTMLElement>(selector) : null;
      const anchor = document.getElementById(phaseId);
      if (focusTitle) {
        const focusTarget = target ?? chapterHeadingRef.current;
        if (focusTarget) {
          const previousTabIndex = focusTarget.getAttribute("tabindex");
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus({ preventScroll: true });
          if (previousTabIndex !== null) {
            focusTarget.setAttribute("tabindex", previousTabIndex);
          }
        }
      }
      (target ?? anchor ?? chapterHeadingRef.current)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }, 0);
  }, []);

  const openSection = useCallback((
    slug: string,
    phaseId: LearningCompassPhaseId = "orient",
    historyMode: "push" | "replace" = "push",
    recordVisit = true,
  ) => {
    const chapter = chapterBySlug.get(slug);
    const valid = Boolean(chapter) || slug === assessmentSlug;
    setInvalidChapter(valid ? null : slug);
    setActiveSlug(valid ? slug : null);
    setActivePhaseId(phaseId);
    activePhaseRef.current = phaseId;
    setInvalidHash(false);
    const nextUrl = sectionUrl(valid ? slug : null, valid ? phaseId : null);
    window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", nextUrl);
    if (chapter && recordVisit) {
      record([
        { type: "section-visited", section_id: chapter.id },
        { type: "resume-updated", resume: { kind: "chaptered", chapter_id: chapter.id, section_id: phaseId } },
      ]);
    }
    if (valid) scrollToPhase(slug, phaseId, true);
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [record, scrollToPhase]);

  useEffect(() => {
    const syncFromLocation = () => {
      const location = new URL(window.location.href);
      const requested = location.searchParams.get("chapter");
      const requestedHash = location.hash.slice(1);
      const validPhase = compassPhaseIds.has(requestedHash);
      suppressPassiveProgressRef.current = Boolean(requestedHash) && !validPhase;
      if (!requested) {
        setActiveSlug(null);
        setInvalidChapter(null);
      } else if (chapterBySlug.has(requested) || requested === assessmentSlug) {
        setActiveSlug(requested);
        setInvalidChapter(null);
      } else {
        setActiveSlug(null);
        setInvalidChapter(requested);
      }
      setInvalidHash(Boolean(requestedHash) && !validPhase);
      setActivePhaseId(validPhase ? requestedHash as LearningCompassPhaseId : "orient");
      activePhaseRef.current = validPhase ? requestedHash as LearningCompassPhaseId : "orient";
      window.setTimeout(() => {
        const heading = requested && (chapterBySlug.has(requested) || requested === assessmentSlug)
          ? chapterHeadingRef.current
          : document.getElementById("mechanism-cover-title");
        heading?.focus({ preventScroll: true });
        if (requested && (chapterBySlug.has(requested) || requested === assessmentSlug) && validPhase) {
          scrollToPhase(requested, requestedHash as LearningCompassPhaseId, true);
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 0);
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [scrollToPhase]);

  const storedLessonProgress = progress.lessons[course.metadata.id];
  const lessonProgress = isLessonProgressCurrentV2(
    storedLessonProgress,
    progressManifest,
  )
    ? storedLessonProgress
    : undefined;
  const evaluation = evaluateLessonProgressV2(lessonProgress, progressManifest);
  const continueChapter = useMemo(() => {
    const resume = lessonProgress?.resume;
    if (resume?.kind !== "chaptered") return undefined;
    return course.chapters.find((chapter) => chapter.id === resume.chapter_id);
  }, [lessonProgress]);

  const compassChapters = useMemo(() => [
    ...course.chapters.map((chapter) => ({
      id: chapter.id,
      label: `第 ${chapter.number} 章 · ${chapter.title}`,
      shortLabel: `${String(chapter.number).padStart(2, "0")} · ${chapter.shortTitle}`,
      durationMinutes: chapter.durationMinutes,
      href: sectionUrl(chapter.slug),
      phases: sampleToGenerationPhasesFor(chapter.slug),
      position: chapter.number,
    })),
    {
      id: assessmentSlug,
      label: "综合终测 · 找到第一处失真",
      shortLabel: "FINAL · 综合终测",
      durationMinutes: course.metadata.durationMinutes.assessment,
      href: sectionUrl(assessmentSlug),
      phases: sampleToGenerationPhasesFor(assessmentSlug),
      position: "final" as const,
    },
  ], []);

  const navigateFromCompass = useCallback((target: LearningCompassTarget) => {
    const slug = target.chapterId === assessmentSlug
      ? assessmentSlug
      : course.chapters.find((chapter) => chapter.id === target.chapterId)?.slug;
    if (slug) openSection(slug, target.phaseId, "push", true);
  }, [openSection]);

  const activeCompassChapterId = activeSlug === assessmentSlug
    ? assessmentSlug
    : chapterBySlug.get(activeSlug ?? "")?.id ?? course.chapters[0].id;
  const activeCompassIndex = compassChapters.findIndex(
    (chapter) => chapter.id === activeCompassChapterId,
  );
  const activePhaseIndex = LEARNING_COMPASS_PHASES.findIndex(
    (phase) => phase.id === activePhaseId,
  );
  const compassNext = useMemo(() => {
    const nextPhase = compassChapters[activeCompassIndex]?.phases[activePhaseIndex + 1];
    const nextCompassChapter = compassChapters[activeCompassIndex + 1];
    return nextPhase
      ? {
          label: nextPhase.label,
          href: `${compassChapters[activeCompassIndex]?.href ?? sectionUrl(course.chapters[0].slug)}#${nextPhase.id}`,
        }
      : nextCompassChapter
        ? { label: nextCompassChapter.shortLabel, href: `${nextCompassChapter.href}#orient` }
        : null;
  }, [activeCompassIndex, activePhaseIndex, compassChapters]);
  const compassRegistration = useMemo(() => ({
    stage: { label: "核心机制", href: "/learn#stage-core-mechanisms", position: 3 },
    course: {
      label: course.metadata.title,
      href: sectionUrl(null),
      durationMinutes: course.metadata.durationMinutes.total,
      position: 1,
    },
    chapters: compassChapters,
    chapterCount: course.chapters.length,
    activeChapterId: activeCompassChapterId,
    activePhaseId,
    next: compassNext,
    navigate: navigateFromCompass,
  }), [
    activeCompassChapterId,
    activePhaseId,
    compassChapters,
    compassNext,
    navigateFromCompass,
  ]);
  useLearningCompassRegistration(compassRegistration);

  useEffect(() => {
    if (!activeSlug) return;
    const selectors = SAMPLE_TO_GENERATION_PHASE_SELECTORS[activeSlug];
    if (!selectors) return;
    const anchors = LEARNING_COMPASS_PHASES.flatMap((phase) => {
      if (document.getElementById(phase.id)) return [];
      const target = document.querySelector<HTMLElement>(selectors[phase.id]);
      if (!target) return [];
      const anchor = document.createElement("span");
      anchor.id = phase.id;
      anchor.className = "learning-phase-anchor";
      anchor.tabIndex = -1;
      anchor.setAttribute("aria-label", sampleToGenerationPhasesFor(activeSlug)[LEARNING_COMPASS_PHASES.indexOf(phase)]?.label ?? phase.label);
      target.before(anchor);
      return [anchor];
    });
    return () => anchors.forEach((anchor) => anchor.remove());
  }, [activeSlug]);

  useEffect(() => {
    if (!activeSlug || !progressHydrated) return;
    if (invalidHash) {
      suppressPassiveProgressRef.current = true;
      window.history.replaceState(window.history.state, "", sectionUrl(activeSlug));
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => {
        chapterHeadingRef.current?.focus({ preventScroll: true });
        setInvalidHash(false);
      }, 0);
      return;
    }
    const locationPhase = window.location.hash.slice(1);
    if (compassPhaseIds.has(locationPhase)) {
      scrollToPhase(activeSlug, locationPhase as LearningCompassPhaseId, true);
    }
  }, [activeSlug, invalidHash, progressHydrated, scrollToPhase]);

  useEffect(() => {
    if (!activeSlug || invalidHash) return;
    const selectors = SAMPLE_TO_GENERATION_PHASE_SELECTORS[activeSlug];
    if (!selectors) return;
    const findVisiblePhase = () => {
      phaseScrollFrameRef.current = null;
      let visible: LearningCompassPhaseId = "orient";
      for (const phase of LEARNING_COMPASS_PHASES) {
        const target = document.getElementById(phase.id);
        if (target && target.getBoundingClientRect().top <= 150) visible = phase.id;
      }
      if (visible === activePhaseRef.current) return;
      activePhaseRef.current = visible;
      setActivePhaseId(visible);
      if (passiveHistoryTimerRef.current !== null) {
        window.clearTimeout(passiveHistoryTimerRef.current);
      }
      passiveHistoryTimerRef.current = window.setTimeout(() => {
        if (suppressPassiveProgressRef.current) return;
        window.history.replaceState(window.history.state, "", sectionUrl(activeSlug, visible));
        const chapterId = activeSlug === assessmentSlug
          ? assessmentSlug
          : chapterBySlug.get(activeSlug)?.id;
        if (chapterId) {
          const events: ProgressEvent[] = [];
          if (chapterId !== assessmentSlug) {
            events.push({ type: "section-visited", section_id: chapterId });
          }
          events.push({
            type: "resume-updated",
            resume: { kind: "chaptered", chapter_id: chapterId, section_id: visible },
          });
          record(events);
        }
      }, 400);
    };
    const onScroll = () => {
      if (phaseScrollFrameRef.current === null) {
        phaseScrollFrameRef.current = window.requestAnimationFrame(findVisiblePhase);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (phaseScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(phaseScrollFrameRef.current);
      }
      if (passiveHistoryTimerRef.current !== null) {
        window.clearTimeout(passiveHistoryTimerRef.current);
      }
      if (passiveReleaseTimerRef.current !== null) {
        window.clearTimeout(passiveReleaseTimerRef.current);
      }
    };
  }, [activeSlug, invalidHash, record]);

  if (!activeSlug) {
    return (
      <CourseCover
        continueChapter={continueChapter}
        invalidChapter={invalidChapter}
        onOpen={openSection}
        status={evaluation.status}
      />
    );
  }

  const chapter = chapterBySlug.get(activeSlug);
  const activeIndex = chapter ? course.chapters.findIndex((candidate) => candidate.id === chapter.id) : -1;
  const chapterProgress = chapter ? lessonProgress?.exercise_attempts[chapter.exercise.id] : undefined;
  const drawerSampleId = activeIndex < 2 ? "origin-a" : "a0";
  const hasChapterOneReader = hasChapterOneTranslationData(chapter);
  const hasChapterTwoReader = hasChapterTwoProvenanceData(chapter);
  const hasChapterThreeReader = hasChapterThreeGroupingData(chapter);
  const hasChapterFourReader = hasChapterFourRequestBoundaryData(chapter);
  const hasChapterFiveReader = hasChapterFiveResponseEvidenceData(chapter);
  const hasChapterSixReader = hasChapterSixWritebackData(chapter);
  const chapterThreeManifest = chapter && hasChapterThreeReader
    ? chapter.groupingInvestigation
    : null;
  const groupingInitialArtifact = chapterThreeManifest
    ? lessonProgress?.learning_artifacts?.[chapterThreeManifest.phases[0].judgement.id]
    : undefined;
  const storedGroupingExercise = chapterThreeManifest
    ? fromStoredGroupingSubmission(chapterProgress?.last_response)
    : undefined;
  const storedGroupingInitialJudgement = fromStoredGroupingInitialJudgement(
    groupingInitialArtifact?.response,
  );
  const storedGroupingSubmission = storedGroupingExercise || storedGroupingInitialJudgement
    ? {
        ...storedGroupingExercise,
        ...(storedGroupingInitialJudgement
          ? { initialJudgement: storedGroupingInitialJudgement }
          : {}),
      }
    : undefined;
  const state = chapter
    ? seekSampleToGeneration(
        sampleToGenerationFixture,
        chapter.observationIds.at(-1) as Parameters<typeof seekSampleToGeneration>[1],
      )
    : null;
  const previousState = chapter && state
    ? (() => {
        const observationIndex = sampleToGenerationFixture.observations.findIndex(
          (observation) => observation.id === state.observation_id,
        );
        const previous = sampleToGenerationFixture.observations[Math.max(0, observationIndex - 1)];
        return previous ? seekSampleToGeneration(sampleToGenerationFixture, previous.id) : undefined;
      })()
    : undefined;

  const submitFinalAssessment = () => {
    const exercises = course.finalAssessment.checkpoints.map(
      (checkpoint) => checkpoint.exercise,
    );
    const result = gradeFinalAssessment(exercises, assessmentAnswers, course.completion);
    setAssessmentResult(result);
    recordExplicit([{
      type: "assessment-submitted",
      correct_question_ids: result.grades.filter((grade) => grade.correct).map((grade) => grade.exerciseId),
    }]);
  };

  const chapterExercise = chapter
    ? progressHydrated ? (
        <StructuredExerciseView
          exercise={chapter.exercise}
          initialAnswer={fromStoredResponse(chapterProgress?.last_response)}
          key={chapter.exercise.id}
          onGrade={(exercise, answer, grade) => recordExplicit([
            { type: "section-visited", section_id: chapter.id },
            {
              type: "resume-updated",
              resume: { kind: "chaptered", chapter_id: chapter.id, section_id: null },
            },
            {
              type: "exercise-submitted",
              exercise_id: exercise.id,
              response: toStoredResponse(answer),
              passed: grade.correct,
            },
          ])}
        />
      ) : (
        <section className="mechanism-exercise mechanism-exercise-loading" role="status">
          正在恢复本章练习记录…
        </section>
      )
    : null;

  return (
    <div className="mechanism-course">
      <div className="mechanism-course-content">
        {persistenceUnavailable ? (
          <p className="mechanism-query-notice" role="status">
            当前浏览器无法保存本地进度；课程仍可完整阅读与练习。
          </p>
        ) : null}
        {chapter && hasChapterOneReader ? (
          <ChapterOneTranslationDesk
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(course.chapters[1].slug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter && hasChapterTwoReader ? (
          <ChapterTwoProvenanceRelay
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(course.chapters[2].slug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrevious={() => openSection(course.chapters[0].slug)}
            passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter && hasChapterThreeReader ? (
          <ChapterThreeGroupingInvestigation
              chapter={chapter}
              headingRef={chapterHeadingRef}
              initialArtifact={groupingInitialArtifact}
              storedSubmission={storedGroupingSubmission}
              triggerRef={drawerTriggerRef}
              onNext={() => openSection(course.chapters[3].slug)}
              onOpenDrawer={() => setDrawerOpen(true)}
              onPrevious={() => openSection(course.chapters[1].slug)}
              onRecordInitialJudgement={(response, skipped) => {
                const artifactId = chapter.groupingInvestigation.phases[0].judgement.id;
                recordExplicit([
                  { type: "section-visited", section_id: chapter.id },
                  {
                    type: "resume-updated",
                    resume: {
                      kind: "chaptered",
                      chapter_id: chapter.id,
                      section_id: "orient",
                    },
                  },
                  {
                    type: "learning-artifact-recorded",
                    artifact_id: artifactId,
                    status: skipped ? "skipped" : "submitted",
                    response: response
                      ? toStoredGroupingInitialJudgement(response)
                      : null,
                  },
                ]);
              }}
              onSubmitInvestigation={(submission, grade) => recordExplicit([
                { type: "section-visited", section_id: chapter.id },
                {
                  type: "resume-updated",
                  resume: {
                    kind: "chaptered",
                    chapter_id: chapter.id,
                    section_id: "practice",
                  },
                },
                {
                  type: "exercise-submitted",
                  exercise_id: chapter.exercise.id,
                  response: toStoredGroupingSubmission(submission),
                  passed: grade.correct,
                },
              ])}
              passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter && hasChapterFourReader ? (
          <ChapterFourRequestBoundary
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(course.chapters[4].slug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrevious={() => openSection(course.chapters[2].slug)}
            passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter && hasChapterFiveReader ? (
          <ChapterFiveResponseEvidence
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(course.chapters[5].slug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrevious={() => openSection(course.chapters[3].slug)}
            passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter && hasChapterSixReader ? (
          <ChapterSixWritebackCalibration
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(assessmentSlug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrevious={() => openSection(course.chapters[4].slug)}
            passed={Boolean(chapterProgress?.passed)}
          />
        ) : chapter ? (
          <article
            className="mechanism-chapter"
            aria-labelledby="mechanism-chapter-title"
          >
            <header className="mechanism-chapter-hero">
              <div className="mechanism-chapter-frame">
                <img
                  src={chapter.imageSrc}
                  alt={chapter.imageAlt ?? ""}
                  loading="eager"
                  style={{ objectPosition: chapterImagePositions[chapter.number] }}
                />
                <span>CHAPTER {String(chapter.number).padStart(2, "0")} / 06</span>
              </div>
              <div className="mechanism-chapter-heading">
                <p>
                  {chapter.durationMinutes} 分钟 · {chapter.scopeLabel ?? chapter.observationIds
                    .map((observationId) => observationLabels[observationId] ?? observationId)
                    .join(" → ")}
                </p>
                <h1 id="mechanism-chapter-title" ref={chapterHeadingRef} tabIndex={-1}>{chapter.title}</h1>
                <blockquote>{chapter.drivingQuestion}</blockquote>
                {chapter.objective ? (
                  <p className="mechanism-objective"><strong>完成标准</strong>{chapter.objective}</p>
                ) : null}
                <p className="mechanism-verdict"><strong>可验证结论</strong>{chapter.conclusion}</p>
              </div>
            </header>

            <section className="mechanism-boundary" id="boundary" aria-labelledby="mechanism-boundary-title">
              <header><span>I/O BOUNDARY</span><h2 id="mechanism-boundary-title">这一章究竟接收什么，又明确不做什么</h2></header>
              {(["input", "output", "excluded"] as const).map((kind) => (
                <div key={kind}>
                  <h3>{kind === "input" ? "输入" : kind === "output" ? "输出" : "明确排除"}</h3>
                  <ul>{chapter.boundary[kind].map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </section>

            <section className="mechanism-transition" id="state-transition" aria-labelledby="mechanism-transition-title">
              <header><span>DETERMINISTIC TRACE</span><h2 id="mechanism-transition-title">before → operation → after</h2></header>
              <ol>
                <li><b>01 / BEFORE</b><code>{chapter.stateTransition.before}</code></li>
                <li><b>02 / OPERATION</b><code>{chapter.stateTransition.operation}</code></li>
                <li><b>03 / AFTER</b><code>{chapter.stateTransition.after}</code></li>
              </ol>
            </section>

            <section className="mechanism-explanation" id="mechanism" aria-labelledby="mechanism-explanation-title">
              <header><span>MECHANISM NOTES</span><h2 id="mechanism-explanation-title">把因果关系拆开</h2></header>
              {chapter.explanation.map((note, index) => (
                <section key={note.title}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <div><h3>{note.title}</h3><p>{note.body}</p></div>
                </section>
              ))}
            </section>

            <CourseEvidence evidenceId={chapter.evidenceId} />
            {chapter.additionalEvidenceIds?.length ? (
              <details className="mechanism-additional-evidence">
                <summary>继续核对 Sample dataclass 的阶段默认值</summary>
                {chapter.additionalEvidenceIds.map((evidenceId) => (
                  <CourseEvidence evidenceId={evidenceId} key={evidenceId} />
                ))}
              </details>
            ) : null}

            {chapterProgress?.passed ? <p className="mechanism-passed-note">本章结构化练习已经通过；你仍可重新推演。</p> : null}
            {chapterExercise}

            <section className="mechanism-misconception" id="misconception" aria-labelledby="mechanism-misconception-title">
              <header><span>FALSE FRIEND</span><h2 id="mechanism-misconception-title">最容易混淆的那句话</h2></header>
              <p><del>{chapter.misconception.belief}</del></p>
              <p><strong>更准确的说法：</strong>{chapter.misconception.correction}</p>
            </section>

            {chapter.advancedAside ? (
              <details className="mechanism-aside">
                <summary>{chapter.advancedAside.title}</summary>
                <p>{chapter.advancedAside.body}</p>
              </details>
            ) : null}

            <section className="mechanism-memory" aria-labelledby="mechanism-memory-title">
              <span>CHAPTER MEMORY</span>
              <h2 id="mechanism-memory-title">{chapter.takeaway}</h2>
              <p>{chapter.transition}</p>
            </section>

            <nav className="mechanism-chapter-nav" aria-label="章节翻页">
              {activeIndex > 0 ? <button type="button" onClick={() => openSection(course.chapters[activeIndex - 1].slug)}>← 上一章</button> : <span />}
              <button className="mechanism-action" type="button" onClick={() => openSection(activeIndex === course.chapters.length - 1 ? assessmentSlug : course.chapters[activeIndex + 1].slug)}>
                {activeIndex === course.chapters.length - 1 ? "进入终测" : `下一章：${course.chapters[activeIndex + 1].shortTitle}`} →
              </button>
            </nav>
          </article>
        ) : (
          <FinalTraceAssessmentReader
            answers={assessmentAnswers}
            assessment={course.finalAssessment}
            bestScore={lessonProgress?.final_assessment?.best_score ?? 0}
            headingRef={chapterHeadingRef}
            historicallyCompleted={Boolean(lessonProgress?.final_assessment?.passed)}
            onAnswerChange={(exerciseId, answer) => {
              setAssessmentAnswers((current) => ({ ...current, [exerciseId]: answer }));
            }}
            onPrevious={() => openSection(course.chapters.at(-1)?.slug ?? course.chapters[0].slug)}
            onSubmit={submitFinalAssessment}
            result={assessmentResult}
          />
        )}
      </div>

      {drawerOpen && state ? (
        <SampleStateDrawer
          state={state}
          previousState={previousState}
          sampleId={drawerSampleId}
          onClose={() => {
            setDrawerOpen(false);
            window.setTimeout(() => drawerTriggerRef.current?.focus(), 0);
          }}
        />
      ) : null}
    </div>
  );
}
