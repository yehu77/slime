"use client";

import { useMemo, useState } from "react";

export type ConceptReviewQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  termId: string;
  feedback: string;
};

type ConceptReviewProps = {
  title: string;
  description: string;
  questions: ConceptReviewQuestion[];
};

export function ConceptReview({ title, description, questions }: ConceptReviewProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => questions.filter((question) => answers[question.id] === question.answer).length,
    [answers, questions],
  );

  return (
    <section aria-labelledby="concept-review-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">可选基础回顾</p>
          <h2 id="concept-review-title">{title}</h2>
        </div>
        <p>{description}</p>
      </div>

      <div className="check-shell">
        {questions.map((question, questionIndex) => (
          <fieldset className="check-card" key={question.id}>
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
            {submitted && answers[question.id] !== question.answer ? (
              <p className="term-avoid">
                建议复习 <a href={`/glossary#${question.termId}`}>对应术语</a>：{question.feedback}
              </p>
            ) : null}
          </fieldset>
        ))}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          onClick={() => setSubmitted(true)}
          type="button"
        >
          检查我的理解
        </button>
        <a className="button button-ghost" href="/learn/sample-journey#overview">回到课程概览</a>
      </div>

      {submitted ? (
        <div aria-live="polite" className="check-result">
          <strong>{score} / {questions.length}</strong>
          <p>
            {score === questions.length
              ? "这四个基础概念已经掌握，可以继续探索源码和后续课程。"
              : "这不会影响课程完成状态；可以根据每题提示回看术语或对应章节。"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
