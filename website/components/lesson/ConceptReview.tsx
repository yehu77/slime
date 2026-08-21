"use client";

import { useMemo, useState } from "react";

export type ConceptReviewQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  correctFeedback: string;
  feedback: string;
  reviewHref: string;
  reviewLabel: string;
};

type ConceptReviewProps = {
  title: string;
  description: string;
  questions: ConceptReviewQuestion[];
  compact?: boolean;
};

export function ConceptReview({ title, description, questions, compact = false }: ConceptReviewProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => questions.filter((question) => answers[question.id] === question.answer).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <section className="concept-review" aria-labelledby="concept-review-title">
      {compact ? (
        <h2 className="sr-only" id="concept-review-title">{title}</h2>
      ) : (
        <div className="section-heading">
          <div>
            <h2 id="concept-review-title">{title}</h2>
          </div>
          <p>{description}</p>
        </div>
      )}

      <div className="check-shell">
        {questions.map((question, questionIndex) => {
          const isCorrect = answers[question.id] === question.answer;
          const feedbackId = `${question.id}-feedback`;
          return (
            <fieldset
              aria-describedby={submitted ? feedbackId : undefined}
              className="check-card"
              key={question.id}
            >
              <legend>{questionIndex + 1}. {question.prompt}</legend>
              <div className="option-list">
                {question.options.map((option, optionIndex) => (
                  <label className="option-label" key={option}>
                    <input
                      checked={answers[question.id] === optionIndex}
                      name={question.id}
                      onChange={() => {
                        setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
                        setSubmitted(false);
                      }}
                      type="radio"
                      value={optionIndex}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {submitted ? (
                <p
                  className={`check-feedback ${isCorrect ? "is-correct" : "is-review"}`}
                  id={feedbackId}
                >
                  <strong>{isCorrect ? "判断正确" : "建议回看"}</strong>
                  <span>{isCorrect ? question.correctFeedback : question.feedback}</span>
                  {!isCorrect ? (
                    <a href={question.reviewHref}>
                      {question.reviewLabel} <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="check-actions">
        <button
          className="button button-primary"
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          type="button"
        >
          检查四个答案
        </button>
        <span aria-live="polite">已回答 {answeredCount} / {questions.length}</span>
      </div>

      {submitted ? (
        <div aria-live="polite" className="check-result">
          <strong>{score} / {questions.length}</strong>
          <p>
            {score === questions.length
              ? "四个概念均已建立，可以直接进入首课。"
              : "这不是入课门槛。先读每道错题下的短解释，也可以直接进入对应幕次。"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
