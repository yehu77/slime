"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";

import type {
  ComprehensiveTraceAssessment,
} from "../../content/zh/lessons/sample-to-generation";
import type {
  ExerciseGrade,
  FinalAssessmentGrade,
  StructuredExercise,
  StructuredExerciseAnswer,
} from "../../core/sample-to-generation";
import "./final-trace-assessment.css";

type FinalTraceAssessmentReaderProps = {
  assessment: ComprehensiveTraceAssessment;
  answers: Readonly<Record<string, StructuredExerciseAnswer>>;
  result: FinalAssessmentGrade | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  historicallyCompleted: boolean;
  bestScore: number;
  onAnswerChange: (exerciseId: string, answer: StructuredExerciseAnswer) => void;
  onSubmit: () => void;
  onPrevious: () => void;
};

function isComplete(
  exercise: StructuredExercise,
  answer: StructuredExerciseAnswer | undefined,
): boolean {
  if (!answer || answer.kind !== exercise.kind) return false;
  switch (exercise.kind) {
    case "choice": {
      const choiceAnswer = answer as Extract<
        StructuredExerciseAnswer,
        { kind: "choice" }
      >;
      return choiceAnswer.selectedOptionIds.length > 0;
    }
    case "ordering": {
      const orderingAnswer = answer as Extract<
        StructuredExerciseAnswer,
        { kind: "ordering" }
      >;
      return (
        orderingAnswer.orderedItemIds.length === exercise.items.length &&
        exercise.items.every((item) =>
          orderingAnswer.orderedItemIds.includes(item.id),
        )
      );
    }
    case "mapping": {
      const mappingAnswer = answer as Extract<
        StructuredExerciseAnswer,
        { kind: "mapping" }
      >;
      return exercise.items.every((item) =>
        Boolean(mappingAnswer.mapping[item.id]),
      );
    }
    case "field-entry": {
      const fieldAnswer = answer as Extract<
        StructuredExerciseAnswer,
        { kind: "field-entry" }
      >;
      return exercise.fields.every((field) =>
        Boolean(fieldAnswer.values[field.id]?.trim()),
      );
    }
  }
}

function moveStationFocus(
  event: KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  length: number,
) {
  let nextIndex: number | null = null;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = length - 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = Math.max(0, currentIndex - 1);
  }
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = Math.min(length - 1, currentIndex + 1);
  }
  if (nextIndex === null) return;
  event.preventDefault();
  const buttons = event.currentTarget
    .closest("ol")
    ?.querySelectorAll<HTMLButtonElement>("button[data-final-station]");
  buttons?.[nextIndex]?.focus();
}

function gradeFor(
  result: FinalAssessmentGrade | null,
  exerciseId: string,
): ExerciseGrade | undefined {
  return result?.grades.find((grade) => grade.exerciseId === exerciseId);
}

type AssessmentQuestionProps = {
  exercise: StructuredExercise;
  answer: StructuredExerciseAnswer | undefined;
  grade: ExerciseGrade | undefined;
  order: number;
  required: boolean;
  dirty: boolean;
  onChange: (answer: StructuredExerciseAnswer) => void;
};

function AssessmentQuestion({
  exercise,
  answer,
  grade,
  order,
  required,
  dirty,
  onChange,
}: AssessmentQuestionProps) {
  const visibleGrade = dirty ? undefined : grade;
  const orderIds =
    answer?.kind === "ordering"
      ? answer.orderedItemIds
      : exercise.kind === "ordering"
        ? exercise.items.map((item) => item.id)
        : [];

  return (
    <section
      className={`final-trace-question${
        visibleGrade ? (visibleGrade.correct ? " is-correct" : " is-incorrect") : ""
      }`}
      id={`final-question-${exercise.id}`}
      aria-labelledby={`final-question-title-${exercise.id}`}
    >
      <header>
        <span>{String(order).padStart(2, "0")}</span>
        <div>
          <p>{required ? "必答观察" : "诊断观察"}</p>
          <h3 id={`final-question-title-${exercise.id}`}>{exercise.title}</h3>
          <p>{exercise.prompt}</p>
          <small>{exercise.instruction}</small>
        </div>
        <strong>
          {dirty
            ? "已修改 · 待再次提交"
            : visibleGrade
              ? visibleGrade.correct
                ? "成立"
                : "需校正"
              : isComplete(exercise, answer)
                ? "已记录"
                : "未完成"}
        </strong>
      </header>

      {exercise.kind === "choice" ? (
        <fieldset className="final-trace-choice">
          <legend className="sr-only">{exercise.prompt}</legend>
          {exercise.options.map((option) => {
            const selected =
              answer?.kind === "choice" &&
              answer.selectedOptionIds.includes(option.id);
            return (
              <label key={option.id}>
                <input
                  checked={selected}
                  name={exercise.multiple ? undefined : exercise.id}
                  type={exercise.multiple ? "checkbox" : "radio"}
                  onChange={() => {
                    const selectedOptionIds =
                      answer?.kind === "choice" ? answer.selectedOptionIds : [];
                    onChange({
                      kind: "choice",
                      selectedOptionIds: exercise.multiple
                        ? selected
                          ? selectedOptionIds.filter((id) => id !== option.id)
                          : [...selectedOptionIds, option.id]
                        : [option.id],
                    });
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {exercise.kind === "ordering" ? (
        <div className="final-trace-ordering">
          <ol>
            {orderIds.map((itemId, index) => {
              const item = exercise.items.find((candidate) => candidate.id === itemId);
              if (!item) return null;
              const move = (direction: -1 | 1) => {
                const nextIndex = index + direction;
                if (nextIndex < 0 || nextIndex >= orderIds.length) return;
                const orderedItemIds = [...orderIds];
                [orderedItemIds[index], orderedItemIds[nextIndex]] = [
                  orderedItemIds[nextIndex],
                  orderedItemIds[index],
                ];
                onChange({ kind: "ordering", orderedItemIds });
              };
              return (
                <li key={item.id}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{item.label}</span>
                  <div>
                    <button
                      aria-label={`上移：${item.label}`}
                      disabled={index === 0}
                      type="button"
                      onClick={() => move(-1)}
                    >
                      上移
                    </button>
                    <button
                      aria-label={`下移：${item.label}`}
                      disabled={index === orderIds.length - 1}
                      type="button"
                      onClick={() => move(1)}
                    >
                      下移
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {answer?.kind !== "ordering" ? (
            <button
              className="final-trace-record-order"
              type="button"
              onClick={() => onChange({ kind: "ordering", orderedItemIds: orderIds })}
            >
              记录当前顺序
            </button>
          ) : null}
        </div>
      ) : null}

      {exercise.kind === "mapping" ? (
        <div className="final-trace-mapping">
          {exercise.items.map((item) => (
            <label key={item.id}>
              <span>{item.label}</span>
              <select
                value={answer?.kind === "mapping" ? answer.mapping[item.id] ?? "" : ""}
                onChange={(event) =>
                  onChange({
                    kind: "mapping",
                    mapping: {
                      ...(answer?.kind === "mapping" ? answer.mapping : {}),
                      [item.id]: event.target.value,
                    },
                  })
                }
              >
                <option value="">请选择证据归属</option>
                {exercise.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}

      {exercise.kind === "field-entry" ? (
        <div className="final-trace-field-entry">
          {exercise.fields.map((field) => (
            <label key={field.id}>
              <span>{field.label}</span>
              <input
                autoComplete="off"
                placeholder={field.placeholder}
                spellCheck={false}
                type="text"
                value={answer?.kind === "field-entry" ? answer.values[field.id] ?? "" : ""}
                onChange={(event) =>
                  onChange({
                    kind: "field-entry",
                    values: {
                      ...(answer?.kind === "field-entry" ? answer.values : {}),
                      [field.id]: event.target.value,
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      ) : null}

      {visibleGrade ? (
        <footer role="status">
          <strong>{visibleGrade.correct ? "这项证据成立" : "这项证据仍需校正"}</strong>
          <p>{visibleGrade.feedback}</p>
        </footer>
      ) : null}
    </section>
  );
}

export function FinalTraceAssessmentReader({
  assessment,
  answers,
  result,
  headingRef,
  historicallyCompleted,
  bestScore,
  onAnswerChange,
  onSubmit,
  onPrevious,
}: FinalTraceAssessmentReaderProps) {
  const [activeStationId, setActiveStationId] = useState(
    assessment.stations[0]?.id ?? "",
  );
  const [dirtyQuestionIds, setDirtyQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const evidenceRef = useRef<HTMLElement>(null);
  const verdictRef = useRef<HTMLHeadingElement>(null);
  const exercises = useMemo(
    () => assessment.checkpoints.map((checkpoint) => checkpoint.exercise),
    [assessment.checkpoints],
  );
  const completedQuestionIds = exercises
    .filter((exercise) => isComplete(exercise, answers[exercise.id]))
    .map((exercise) => exercise.id);
  const completedRequired = assessment.checkpoints.filter(
    (checkpoint) =>
      checkpoint.required &&
      completedQuestionIds.includes(checkpoint.exercise.id),
  ).length;
  const requiredCount = assessment.checkpoints.filter(
    (checkpoint) => checkpoint.required,
  ).length;
  const allComplete = completedQuestionIds.length === exercises.length;
  const missingTitles = assessment.checkpoints
    .filter((checkpoint) => !completedQuestionIds.includes(checkpoint.exercise.id))
    .map((checkpoint) => checkpoint.exercise.title);

  useEffect(() => {
    if (!result) return;
    window.setTimeout(() => verdictRef.current?.focus(), 0);
  }, [result]);

  const scrollToEvidence = () => {
    evidenceRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const updateAnswer = (exerciseId: string, answer: StructuredExerciseAnswer) => {
    if (result) {
      setDirtyQuestionIds((current) => new Set(current).add(exerciseId));
    }
    onAnswerChange(exerciseId, answer);
  };

  const row = assessment.fixture.row;
  const focusSampleId = assessment.fixture.grouping.focus_sample_id;
  const firstErrorStation = assessment.fixture.expected_first_error.station_id;

  return (
    <article className="final-trace-reader" aria-labelledby="mechanism-assessment-title">
      <header className="final-trace-opening">
        <div className="final-trace-opening-copy">
          <h1 id="mechanism-assessment-title" ref={headingRef} tabIndex={-1}>
            {assessment.title}
          </h1>
          <blockquote>{assessment.drivingQuestion}</blockquote>
          <p>{assessment.scope}</p>
          <dl>
            <div><dt>答卷</dt><dd>8 个观察 · 10 分钟</dd></div>
            <div><dt>通过</dt><dd>至少 7 / 8，四项必答正确</dd></div>
            <div><dt>重试</dt><dd>不限次数；历史通过不会撤销</dd></div>
            <div><dt>历史最佳</dt><dd>{bestScore} / 8{historicallyCompleted ? " · 已完成" : ""}</dd></div>
          </dl>
          <div>
            <button className="mechanism-action" type="button" onClick={scrollToEvidence}>
              打开证据卷
            </button>
            <span>最终提交前不显示对错；本机只保存成绩，不保存未提交草稿。</span>
          </div>
        </div>
        <figure>
          <img src={assessment.imageSrc} alt={assessment.imageAlt} loading="eager" />
          <figcaption>FINAL REEL · {assessment.fixture.fixture_id} · 06FFDBE2</figcaption>
        </figure>
      </header>

      <section className="final-trace-passport" aria-labelledby="final-trace-passport-title">
        <header>
          <h2 id="final-trace-passport-title">新样片只允许一个首错</h2>
          <p>{assessment.teachingNotice}</p>
        </header>
        <pre><code>{JSON.stringify(row, null, 2)}</code></pre>
        <dl>
          <div><dt>origin</dt><dd><code>{assessment.fixture.origin_id}</code></dd></div>
          <div><dt>focus</dt><dd><code>{focusSampleId}</code></dd></div>
          <div><dt>n_samples_per_prompt</dt><dd><code>{assessment.fixture.dataset_config.n_samples_per_prompt}</code></dd></div>
          <div><dt>观察终点</dt><dd><code>generate() returned</code></dd></div>
          <div><dt>评价边界</dt><dd><code>reward = null</code></dd></div>
          <div><dt>任务</dt><dd>锁定最早失真的契约边界</dd></div>
        </dl>
      </section>

      <section
        className="final-trace-evidence"
        id="final-trace-evidence"
        aria-labelledby="final-trace-evidence-title"
        ref={evidenceRef}
      >
        <header>
          <h2 id="final-trace-evidence-title">一卷 trace，六个套准点</h2>
          <p>所有证据始终可见；选择套准点只改变当前强调，不会替你裁定哪里出错。</p>
        </header>
        <ol className="final-trace-station-index" aria-label="综合终测六个证据站">
          {assessment.stations.map((station, index) => (
            <li key={station.id}>
              <button
                aria-pressed={activeStationId === station.id}
                data-final-station
                type="button"
                onClick={() => {
                  setActiveStationId(station.id);
                  document.getElementById(`final-station-${station.id}`)?.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center",
                  });
                }}
                onFocus={() => setActiveStationId(station.id)}
                onKeyDown={(event) => moveStationFocus(event, index, assessment.stations.length)}
              >
                <span>{String(station.order).padStart(2, "0")}</span>
                <strong>{station.title}</strong>
              </button>
            </li>
          ))}
        </ol>
        <div className="final-trace-sheet">
          {assessment.stations.map((station) => {
            const showFault = Boolean(result) && station.id === firstErrorStation;
            return (
              <section
                className={`${activeStationId === station.id ? "is-active" : ""}${showFault ? " is-first-fault" : ""}`}
                id={`final-station-${station.id}`}
                key={station.id}
                aria-labelledby={`final-station-title-${station.id}`}
              >
                <header>
                  <span>CH.{String(station.chapter).padStart(2, "0")}</span>
                  <h3 id={`final-station-title-${station.id}`}>{station.title}</h3>
                  <p>{station.producer}</p>
                </header>
                <div className="final-trace-contract">
                  <strong>应满足的契约</strong>
                  <p>{station.contract}</p>
                </div>
                <div className="final-trace-observation">
                  <strong>实际观测 · {station.observation}</strong>
                  <pre><code>{station.evidence.join("\n")}</code></pre>
                </div>
                <footer>
                  {station.sourceRefIds.map((sourceRefId) => (
                    <a href={`/source#${sourceRefId}`} key={sourceRefId}>
                      <code>{sourceRefId}</code>
                    </a>
                  ))}
                  {showFault ? <strong>最终裁决：最早失准发生在这里</strong> : null}
                </footer>
              </section>
            );
          })}
        </div>
      </section>

      <section className="final-trace-answer-sheet" aria-labelledby="final-trace-answer-title">
        <header>
          <div>
            <h2 id="final-trace-answer-title">把结论写在证据之后</h2>
            <p>八个观察共用上面的同一条 trace。提交前只记录答案，不逐题揭晓。</p>
          </div>
          <dl aria-label="终测填写进度">
            <div><dt>已记录</dt><dd>{completedQuestionIds.length} / {exercises.length}</dd></div>
            <div><dt>必答</dt><dd>{completedRequired} / {requiredCount}</dd></div>
          </dl>
        </header>
        <div className="final-trace-question-list">
          {assessment.checkpoints.map((checkpoint) => (
            <AssessmentQuestion
              answer={answers[checkpoint.exercise.id]}
              dirty={dirtyQuestionIds.has(checkpoint.exercise.id)}
              exercise={checkpoint.exercise}
              grade={gradeFor(result, checkpoint.exercise.id)}
              key={checkpoint.id}
              onChange={(answer) => updateAnswer(checkpoint.exercise.id, answer)}
              order={checkpoint.order}
              required={checkpoint.required}
            />
          ))}
        </div>
      </section>

      <section className="final-trace-submit" aria-labelledby="final-trace-submit-title">
        <div>
          <h2 id="final-trace-submit-title">封卷前，确认每个观察点都有记录</h2>
          {allComplete ? (
            <p>八项均已记录，可以提交首错裁决。</p>
          ) : (
            <p>还缺：{missingTitles.join("、")}。</p>
          )}
        </div>
        <button
          className="mechanism-action"
          disabled={!allComplete}
          type="button"
          onClick={() => {
            setDirtyQuestionIds(new Set());
            onSubmit();
          }}
        >
          提交校片结论
        </button>
        {result ? (
          <div
            className={historicallyCompleted || result.passed ? "is-passed" : "is-retry"}
            role="status"
          >
            <h2 ref={verdictRef} tabIndex={-1}>
              {historicallyCompleted
                ? result.passed
                  ? "机制课完成"
                  : "课程仍已完成"
                : result.passed
                  ? "终测通过"
                  : "首错判断仍需校正"}
            </h2>
            <p>
              本次 {result.score} / {result.total} 正确。
              {historicallyCompleted && !result.passed
                ? "较差的后续重试不会撤销同一版本已经取得的完成状态。"
                : result.missingRequiredCorrectIds.length > 0
                  ? `必答观察待修正：${result.missingRequiredCorrectIds
                    .map((id) => assessment.checkpoints.find((checkpoint) => checkpoint.id === id)?.exercise.title ?? id)
                    .join("、")}。`
                  : result.passed
                    ? "这条新 trace 的六个边界已经能够被连续解释。"
                    : "四项必答均成立，但总分还没有达到 7 / 8。"}
            </p>
            <div>
              {!result.passed ? (
                <a href={`#final-question-${result.grades.find((grade) => !grade.correct)?.exerciseId ?? assessment.checkpoints[0].id}`}>
                  回到第一项待校正观察
                </a>
              ) : null}
              <a href="/learn">回到完整课程路线</a>
            </div>
          </div>
        ) : null}
      </section>

      <nav className="final-trace-next" aria-label="终测返回">
        <button type="button" onClick={onPrevious}>返回第六章：写回双时钟</button>
        <span>终测没有下一章；通过后回到课程路线。</span>
      </nav>
    </article>
  );
}
