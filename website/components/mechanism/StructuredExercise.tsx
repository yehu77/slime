"use client";

import { useMemo, useState } from "react";

import {
  gradeStructuredExercise,
  type ExerciseGrade,
  type StructuredExercise as Exercise,
  type StructuredExerciseAnswer,
} from "../../core/sample-to-generation";

type StructuredExerciseProps = {
  exercise: Exercise;
  initialAnswer?: StructuredExerciseAnswer;
  compact?: boolean;
  onGrade?: (
    exercise: Exercise,
    answer: StructuredExerciseAnswer,
    grade: ExerciseGrade,
  ) => void;
  onAnswerChange?: (answer: StructuredExerciseAnswer) => void;
};

function initialForExercise(
  exercise: Exercise,
  initialAnswer?: StructuredExerciseAnswer,
): StructuredExerciseAnswer {
  if (initialAnswer?.kind === exercise.kind) return initialAnswer;

  switch (exercise.kind) {
    case "choice":
      return { kind: "choice", selectedOptionIds: [] };
    case "ordering":
      return {
        kind: "ordering",
        orderedItemIds: [...exercise.items].reverse().map((item) => item.id),
      };
    case "mapping":
      return { kind: "mapping", mapping: {} };
    case "field-entry":
      return { kind: "field-entry", values: {} };
  }
}

function canSubmit(answer: StructuredExerciseAnswer): boolean {
  switch (answer.kind) {
    case "choice":
      return answer.selectedOptionIds.length > 0;
    case "ordering":
      return answer.orderedItemIds.length > 0;
    case "mapping":
      return Object.values(answer.mapping).every(Boolean) &&
        Object.keys(answer.mapping).length > 0;
    case "field-entry":
      return Object.values(answer.values).some((value) => value.trim().length > 0);
  }
}

export function StructuredExercise({
  exercise,
  initialAnswer,
  compact = false,
  onGrade,
  onAnswerChange,
}: StructuredExerciseProps) {
  const [answer, setAnswer] = useState<StructuredExerciseAnswer>(() =>
    initialForExercise(exercise, initialAnswer),
  );
  const [grade, setGrade] = useState<ExerciseGrade | null>(null);
  const ready = useMemo(() => canSubmit(answer), [answer]);

  const submit = () => {
    const nextGrade = gradeStructuredExercise(exercise, answer);
    setGrade(nextGrade);
    onGrade?.(exercise, answer, nextGrade);
  };

  const clearFeedback = () => setGrade(null);
  const updateAnswer = (nextAnswer: StructuredExerciseAnswer) => {
    clearFeedback();
    setAnswer(nextAnswer);
    onAnswerChange?.(nextAnswer);
  };

  return (
    <section
      className={`mechanism-exercise${compact ? " mechanism-exercise--compact" : ""}${
        grade ? (grade.correct ? " is-correct" : " is-incorrect") : ""
      }`}
      id={`exercise-${exercise.id}`}
      aria-labelledby={`exercise-title-${exercise.id}`}
    >
      <header>
        <span>结构化推演</span>
        <h2 id={`exercise-title-${exercise.id}`}>{exercise.title}</h2>
        <p>{exercise.prompt}</p>
        <small>{exercise.instruction}</small>
      </header>

      {exercise.kind === "choice" && answer.kind === "choice" ? (
        <fieldset className="mechanism-exercise-options">
          <legend className="sr-only">{exercise.prompt}</legend>
          {exercise.options.map((option) => {
            const selected = answer.selectedOptionIds.includes(option.id);
            return (
              <label key={option.id}>
                <input
                  checked={selected}
                  name={exercise.multiple ? undefined : exercise.id}
                  onChange={() => {
                    updateAnswer({
                      kind: "choice",
                      selectedOptionIds: exercise.multiple
                        ? selected
                          ? answer.selectedOptionIds.filter((id) => id !== option.id)
                          : [...answer.selectedOptionIds, option.id]
                        : [option.id],
                    });
                  }}
                  type={exercise.multiple ? "checkbox" : "radio"}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {exercise.kind === "ordering" && answer.kind === "ordering" ? (
        <ol className="mechanism-ordering">
          {answer.orderedItemIds.map((itemId, index) => {
            const item = exercise.items.find((candidate) => candidate.id === itemId);
            if (!item) return null;
            const move = (direction: -1 | 1) => {
              const nextIndex = index + direction;
              if (nextIndex < 0 || nextIndex >= answer.orderedItemIds.length) return;
              const orderedItemIds = [...answer.orderedItemIds];
              [orderedItemIds[index], orderedItemIds[nextIndex]] = [
                orderedItemIds[nextIndex],
                orderedItemIds[index],
              ];
              updateAnswer({ kind: "ordering", orderedItemIds });
            };
            return (
              <li key={item.id}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{item.label}</span>
                <div>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(-1)}
                    aria-label={`上移：${item.label}`}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    disabled={index === answer.orderedItemIds.length - 1}
                    onClick={() => move(1)}
                    aria-label={`下移：${item.label}`}
                  >
                    下移
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {exercise.kind === "mapping" && answer.kind === "mapping" ? (
        <div className="mechanism-mapping">
          {exercise.items.map((item) => (
            <label key={item.id}>
              <span>{item.label}</span>
              <select
                value={answer.mapping[item.id] ?? ""}
                onChange={(event) => {
                  updateAnswer({
                    kind: "mapping",
                    mapping: { ...answer.mapping, [item.id]: event.target.value },
                  });
                }}
              >
                <option value="">请选择归属</option>
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

      {exercise.kind === "field-entry" && answer.kind === "field-entry" ? (
        <div className="mechanism-field-entry">
          {exercise.fields.map((field) => (
            <label key={field.id}>
              <span>{field.label}</span>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={field.placeholder}
                value={answer.values[field.id] ?? ""}
                onChange={(event) => {
                  updateAnswer({
                    kind: "field-entry",
                    values: { ...answer.values, [field.id]: event.target.value },
                  });
                }}
              />
            </label>
          ))}
        </div>
      ) : null}

      <footer>
        <button
          className="mechanism-action"
          type="button"
          disabled={!ready}
          onClick={submit}
        >
          核对这一步
        </button>
        {grade ? (
          <p className="mechanism-exercise-feedback" role="status">
            <strong>{grade.correct ? "推演成立" : "边界还没有对齐"}</strong>
            {grade.feedback}
          </p>
        ) : (
          <p className="mechanism-exercise-hint">答案只保存在当前设备，可无限重试。</p>
        )}
      </footer>
    </section>
  );
}
