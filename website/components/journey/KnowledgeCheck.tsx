"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AnswerMap,
  AssessmentQuestionView,
  AssessmentResult,
} from "./types";

type KnowledgeCheckProps = {
  questions: readonly AssessmentQuestionView[];
  visitedActs: ReadonlySet<number>;
  initialAnswers?: AnswerMap;
  requiredQuestionIds: readonly string[];
  passScore: number;
  onSubmit: (answers: AnswerMap, result: AssessmentResult) => void;
  onReturnToAct: (act: number) => void;
};

function sameAnswer(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function isQuestionCorrect(
  question: AssessmentQuestionView,
  answers: readonly string[],
) {
  if (question.correctOrder?.length) {
    return sameAnswer(answers, question.correctOrder);
  }

  const expected = [...(question.correctOptionIds ?? [])].sort();
  return sameAnswer([...answers].sort(), expected);
}

function optionLabel(question: AssessmentQuestionView, optionId: string) {
  return question.options?.find((option) => option.id === optionId)?.label ?? optionId;
}

function defaultOrder(question: AssessmentQuestionView) {
  const optionIds = (question.options ?? []).map((option) => option.id);
  if (optionIds.length < 3) return [...optionIds].reverse();
  return [...optionIds.slice(2), ...optionIds.slice(0, 2)];
}

export function KnowledgeCheck({
  questions,
  visitedActs,
  initialAnswers = {},
  requiredQuestionIds,
  passScore,
  onSubmit,
  onReturnToAct,
}: KnowledgeCheckProps) {
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnswers(initialAnswers));
    return () => window.cancelAnimationFrame(frame);
  }, [initialAnswers]);

  const answeredCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          (answers[question.id]?.length ?? 0) > 0 || Boolean(question.correctOrder?.length),
      ).length,
    [answers, questions],
  );

  const allActsVisited = visitedActs.size >= 7;

  const setSingleAnswer = (questionId: string, optionId: string) => {
    setSubmitted(false);
    setAnswers((current) => ({ ...current, [questionId]: [optionId] }));
  };

  const toggleMultipleAnswer = (questionId: string, optionId: string) => {
    setSubmitted(false);
    setAnswers((current) => {
      const existing = current[questionId] ?? [];
      const next = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
      return { ...current, [questionId]: next };
    });
  };

  const moveOrderOption = (
    question: AssessmentQuestionView,
    optionId: string,
    direction: -1 | 1,
  ) => {
    setSubmitted(false);
    setAnswers((current) => {
      const order = current[question.id]?.length
        ? [...current[question.id]]
        : defaultOrder(question);
      const from = order.indexOf(optionId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= order.length) return current;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...current, [question.id]: order };
    });
  };

  const submit = () => {
    const normalizedAnswers = Object.fromEntries(
      questions.map((question) => [
        question.id,
        answers[question.id]?.length
          ? answers[question.id]
          : question.correctOrder?.length
            ? defaultOrder(question)
            : [],
      ]),
    );
    const correctIds = questions
      .filter((question) =>
        isQuestionCorrect(question, normalizedAnswers[question.id] ?? []),
      )
      .map((question) => question.id);
    const requiredPassed = requiredQuestionIds.every((id) => correctIds.includes(id));
    const result: AssessmentResult = {
      score: correctIds.length,
      total: questions.length,
      correctIds,
      requiredPassed,
      completed:
        allActsVisited && correctIds.length >= passScore && requiredPassed,
    };
    setAnswers(normalizedAnswers);
    setAttempt(result);
    setSubmitted(true);
    onSubmit(normalizedAnswers, result);
  };

  return (
    <section className="journey-check" aria-labelledby="journey-check-title">
      <div className="journey-section-heading">
        <div>
          <p className="journey-eyebrow">09 · 形成解释</p>
          <h2 id="journey-check-title">章末知识检查</h2>
          <p>
            不只记流程，也检查 token 对齐、身份边界和异步 stale policy。可无限重试，设备只保存学习进度。
          </p>
        </div>
        <div className="journey-check-meter" aria-label={`已作答 ${answeredCount} 题，共 ${questions.length} 题`}>
          <strong>{answeredCount}/{questions.length}</strong>
          <span>已作答</span>
        </div>
      </div>

      {!allActsVisited ? (
        <div className="journey-note journey-note--warm" role="status">
          你还没有访问全部七幕。可以先答题，但完成课程前需要回到未访问的幕。
        </div>
      ) : null}

      <div className="journey-question-list">
        {questions.map((question, questionIndex) => {
          const selected = answers[question.id] ?? [];
          const isOrdering = Boolean(question.correctOrder?.length);
          const isMultiple =
            !isOrdering &&
            ((question.correctOptionIds?.length ?? 0) > 1 ||
              question.type.toLowerCase().includes("multiple"));
          const correct = submitted && isQuestionCorrect(question, selected);
          const order = selected.length ? selected : defaultOrder(question);

          return (
            <fieldset
              className={`journey-question ${submitted ? (correct ? "is-correct" : "is-wrong") : ""}`}
              key={question.id}
            >
              <legend>
                <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                {question.prompt}
                {requiredQuestionIds.includes(question.id) ? (
                  <em title="课程完成必须答对">关键题</em>
                ) : null}
              </legend>

              {isOrdering ? (
                <ol className="journey-order-list">
                  {order.map((optionId, orderIndex) => (
                    <li key={optionId}>
                      <span className="journey-order-index">{orderIndex + 1}</span>
                      <span>{optionLabel(question, optionId)}</span>
                      <span className="journey-order-actions">
                        <button
                          type="button"
                          aria-label={`上移：${optionLabel(question, optionId)}`}
                          disabled={orderIndex === 0}
                          onClick={() => moveOrderOption(question, optionId, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`下移：${optionLabel(question, optionId)}`}
                          disabled={orderIndex === order.length - 1}
                          onClick={() => moveOrderOption(question, optionId, 1)}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="journey-options">
                  {question.options?.map((option) => (
                    <label key={option.id}>
                      <input
                        type={isMultiple ? "checkbox" : "radio"}
                        name={question.id}
                        value={option.id}
                        checked={selected.includes(option.id)}
                        onChange={() =>
                          isMultiple
                            ? toggleMultipleAnswer(question.id, option.id)
                            : setSingleAnswer(question.id, option.id)
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {submitted ? (
                <div className="journey-answer-feedback" role="status">
                  <strong>{correct ? "回答正确" : "再想一步"}</strong>
                  <p>{correct ? question.answerSummary : question.feedback}</p>
                  {!correct ? (
                    <button type="button" onClick={() => onReturnToAct(question.returnTo)}>
                      返回第 {question.returnTo} 幕复习
                    </button>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="journey-check-submit">
        <div>
          {attempt ? (
            <p aria-live="polite">
              本次 <strong>{attempt.score}/{attempt.total}</strong>
              {attempt.completed
                ? " · 已达到课程完成条件。"
                : attempt.score < passScore
                  ? ` · 至少需要 ${passScore} 题正确。`
                  : " · 请修正标记为关键题的项目。"}
            </p>
          ) : (
            <p>通过条件：至少 {passScore}/{questions.length}，并答对全部关键题。</p>
          )}
        </div>
        <button className="journey-primary-button" type="button" onClick={submit}>
          {submitted ? "重新提交" : "提交检查"}
        </button>
      </div>
    </section>
  );
}
