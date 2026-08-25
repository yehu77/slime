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
  type ExerciseGrade,
  type StructuredExerciseAnswer,
} from "../../core/sample-to-generation";
import {
  applyLessonProgressEvent,
  createEmptyLocalProgressV2,
  evaluateLessonProgressV2,
  loadLocalProgressV2,
  saveLocalProgressV2,
  type LocalProgressV2,
  type ProgressEvent,
  type StructuredExerciseResponse,
} from "../../core/progress";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import {
  ChapterOneTranslationDesk,
} from "./ChapterOneTranslationDesk";
import { ChapterTwoProvenanceRelay } from "./ChapterTwoProvenanceRelay";
import { ChapterThreeGroupingLab } from "./ChapterThreeGroupingLab";
import {
  hasChapterOneTranslationData,
  hasChapterThreeGroupingData,
  hasChapterTwoProvenanceData,
} from "./chapter-reader-contracts";
import { SampleStateDrawer } from "./SampleStateDrawer";
import { StructuredExercise as StructuredExerciseView } from "./StructuredExercise";
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

function statusLabel(status: ReturnType<typeof evaluateLessonProgressV2>["status"]) {
  switch (status) {
    case "not_started": return "尚未开始";
    case "in_progress": return "学习中";
    case "completed": return "已完成";
    case "review_required": return "内容已修订 · 建议复习";
  }
}

function sectionUrl(slug: string | null) {
  return slug ? `/learn/sample-to-generation?chapter=${encodeURIComponent(slug)}` : "/learn/sample-to-generation";
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
          <p className="mechanism-kicker">88 分钟机制课 · 无需 GPU · 固定 commit 06ffdbe2</p>
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
          <div><dt>章节</dt><dd>6 章 · 共 78 min</dd></div>
          <div><dt>终测</dt><dd>8 题 · 10 min</dd></div>
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
  const [progress, setProgress] = useState<LocalProgressV2>(() => createEmptyLocalProgressV2());
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, StructuredExerciseAnswer>>({});
  const [assessmentGrades, setAssessmentGrades] = useState<Record<string, ExerciseGrade>>({});
  const [assessmentResult, setAssessmentResult] = useState<ReturnType<typeof gradeFinalAssessment> | null>(null);
  const chapterHeadingRef = useRef<HTMLHeadingElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let loaded = loadLocalProgressV2(window.localStorage);
      const loadedEvaluation = evaluateLessonProgressV2(
        loaded.lessons[course.metadata.id],
        progressManifest,
      );
      const directChapter = initialChapterSlug
        ? chapterBySlug.get(initialChapterSlug)
        : undefined;
      if (directChapter && loadedEvaluation.status !== "review_required") {
        loaded = applyLessonProgressEvent(
          loaded,
          course.metadata.id,
          progressManifest,
          { type: "section-visited", section_id: directChapter.id },
        );
        loaded = applyLessonProgressEvent(
          loaded,
          course.metadata.id,
          progressManifest,
          {
            type: "resume-updated",
            resume: {
              kind: "chaptered",
              chapter_id: directChapter.id,
              section_id: window.location.hash.slice(1) || null,
            },
          },
        );
        try {
          saveLocalProgressV2(window.localStorage, loaded);
        } catch {
          // Reading and exercises remain available without persistence.
        }
      }
      setProgress(loaded);
      setProgressHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialChapterSlug]);

  const record = useCallback((events: readonly ProgressEvent[]) => {
    setProgress((current) => {
      let next = current;
      for (const event of events) {
        next = applyLessonProgressEvent(next, course.metadata.id, progressManifest, event);
      }
      try {
        saveLocalProgressV2(window.localStorage, next);
      } catch {
        // The course remains usable when local persistence is unavailable.
      }
      return next;
    });
  }, []);

  const openSection = useCallback((slug: string, historyMode: "push" | "replace" = "push") => {
    const chapter = chapterBySlug.get(slug);
    const valid = Boolean(chapter) || slug === assessmentSlug;
    setInvalidChapter(valid ? null : slug);
    setActiveSlug(valid ? slug : null);
    const nextUrl = sectionUrl(valid ? slug : null);
    window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", nextUrl);
    if (chapter) {
      record([
        { type: "section-visited", section_id: chapter.id },
        { type: "resume-updated", resume: { kind: "chaptered", chapter_id: chapter.id, section_id: null } },
      ]);
    }
    window.setTimeout(() => {
      chapterHeadingRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }, 0);
  }, [record]);

  const openCover = useCallback((historyMode: "push" | "replace" = "push") => {
    setActiveSlug(null);
    setInvalidChapter(null);
    window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", sectionUrl(null));
    window.setTimeout(() => {
      document.getElementById("mechanism-cover-title")?.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }, 0);
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      const requested = new URL(window.location.href).searchParams.get("chapter");
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
      window.setTimeout(() => {
        const heading = requested && (chapterBySlug.has(requested) || requested === assessmentSlug)
          ? chapterHeadingRef.current
          : document.getElementById("mechanism-cover-title");
        heading?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "auto" });
      }, 0);
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    if (!activeSlug || activeSlug === assessmentSlug) return;
    const railItem = document.querySelector<HTMLElement>(`[data-chapter-slug="${activeSlug}"]`);
    railItem?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSlug]);

  const lessonProgress = progress.lessons[course.metadata.id];
  const evaluation = evaluateLessonProgressV2(lessonProgress, progressManifest);
  const continueChapter = useMemo(() => {
    const resume = lessonProgress?.resume;
    if (resume?.kind !== "chaptered") return undefined;
    return course.chapters.find((chapter) => chapter.id === resume.chapter_id);
  }, [lessonProgress]);

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
  const hasDedicatedReader = hasChapterOneReader || hasChapterTwoReader || hasChapterThreeReader;

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
    const result = gradeFinalAssessment(course.finalAssessment, assessmentAnswers, course.completion);
    setAssessmentResult(result);
    record([{
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
          onGrade={(exercise, answer, grade) => record([
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
      <nav className={`mechanism-rail${hasDedicatedReader ? " mechanism-rail--reader" : ""}`} aria-label="课程六章与状态账本">
        <a className="mechanism-rail-cover" href="/learn/sample-to-generation" onClick={(event) => { event.preventDefault(); openCover(); }}>
          <span>CORE / 01</span><strong>课程封面</strong>
        </a>
        <ol>
          {course.chapters.map((item) => {
            const passed = Boolean(lessonProgress?.exercise_attempts[item.exercise.id]?.passed);
            return (
              <li key={item.id} data-chapter-slug={item.slug}>
                <button
                  type="button"
                  className={item.slug === activeSlug ? "is-current" : ""}
                  aria-current={item.slug === activeSlug ? "step" : undefined}
                  onClick={() => openSection(item.slug)}
                >
                  <b>{String(item.number).padStart(2, "0")}</b>
                  <span><strong>{item.shortTitle}</strong><small>{passed ? "练习已通过" : `${item.durationMinutes} min`}</small></span>
                </button>
              </li>
            );
          })}
        </ol>
        <button
          aria-current={activeSlug === assessmentSlug ? "step" : undefined}
          className={`mechanism-rail-final${activeSlug === assessmentSlug ? " is-current" : ""}`}
          type="button"
          onClick={() => openSection(assessmentSlug)}
        >
          <span>FINAL</span><strong>终测</strong>
        </button>
        {!hasDedicatedReader ? (
          <button
            aria-label={chapter ? `打开 ${drawerSampleId} 状态账本` : "终测没有单章状态账本"}
            className="mechanism-rail-state"
            disabled={!chapter}
            ref={drawerTriggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
          >
            <span>STATE</span><strong>{chapter ? `${drawerSampleId} 账本` : "无单章状态"}</strong>
          </button>
        ) : null}
      </nav>

      <div className="mechanism-course-content">
        {evaluation.status === "review_required" ? (
          <p className="mechanism-review-notice" role="status">
            这门课已经更新。旧完成记录仍被保留；你可以先阅读新版内容，直到明确切换章节或提交练习时才开始记录新版进度。
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
          <ChapterThreeGroupingLab
            chapter={chapter}
            exerciseSlot={chapterExercise}
            headingRef={chapterHeadingRef}
            triggerRef={drawerTriggerRef}
            onNext={() => openSection(course.chapters[3].slug)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrevious={() => openSection(course.chapters[1].slug)}
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
          <article className="mechanism-assessment" aria-labelledby="mechanism-assessment-title">
            <header>
              <p>FINAL CHECK · 10 分钟 · 无限重试</p>
              <h1 id="mechanism-assessment-title" ref={chapterHeadingRef} tabIndex={-1}>用一条新 trace 检查机制，而不是检查记忆</h1>
              <p>八题至少答对七题，并正确回答第 2、4、6、8 题。较差的后续重试不会撤销已完成状态。</p>
            </header>
            <div className="mechanism-assessment-grid">
              {course.finalAssessment.map((exercise, index) => (
                <div key={exercise.id} className="mechanism-assessment-item">
                  <span>QUESTION {String(index + 1).padStart(2, "0")}{course.completion.requiredQuestionIds.includes(exercise.id) ? " / REQUIRED" : ""}</span>
                  <StructuredExerciseView
                    compact
                    exercise={exercise}
                    initialAnswer={assessmentAnswers[exercise.id]}
                    onAnswerChange={(answer) => {
                      setAssessmentAnswers((current) => ({ ...current, [exercise.id]: answer }));
                      setAssessmentGrades((current) => {
                        const next = { ...current };
                        delete next[exercise.id];
                        return next;
                      });
                      setAssessmentResult(null);
                    }}
                    onGrade={(_, answer, grade) => {
                      setAssessmentAnswers((current) => ({ ...current, [exercise.id]: answer }));
                      setAssessmentGrades((current) => ({ ...current, [exercise.id]: grade }));
                    }}
                  />
                </div>
              ))}
            </div>
            <section className="mechanism-submit-assessment">
              <div><span>SUBMISSION</span><p>已核对 {Object.keys(assessmentGrades).length} / {course.finalAssessment.length} 题</p></div>
              <button className="mechanism-action" type="button" disabled={Object.keys(assessmentGrades).length !== course.finalAssessment.length} onClick={submitFinalAssessment}>提交终测</button>
              {assessmentResult ? (
                <div className={evaluation.status === "completed" || assessmentResult.passed ? "is-passed" : "is-retry"} role="status">
                  <strong>
                    {evaluation.status === "completed"
                      ? assessmentResult.passed ? "机制课完成" : "课程仍已完成"
                      : assessmentResult.passed ? "终测通过" : "还需要再校准一次"}
                  </strong>
                  <p>
                    {assessmentResult.score} / {assessmentResult.total} 正确。
                    {evaluation.status === "completed" && !assessmentResult.passed
                      ? "本次重试未达到终测门槛，但同一版本先前的通过记录仍然有效。"
                      : assessmentResult.missingRequiredCorrectIds.length
                      ? `必答题待修正：${assessmentResult.missingRequiredCorrectIds.join("、")}`
                      : evaluation.status === "completed"
                        ? "六章访问、六次练习与四道必答均已完成。"
                        : "四道必答题均正确；课程完成还需要访问六章并通过每章练习。"}
                  </p>
                  <a href="/learn">回到完整课程路线</a>
                </div>
              ) : null}
            </section>
            <nav className="mechanism-chapter-nav" aria-label="终测返回">
              <button type="button" onClick={() => openSection(course.chapters.at(-1)?.slug ?? course.chapters[0].slug)}>← 返回第六章</button>
              <span />
            </nav>
          </article>
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
