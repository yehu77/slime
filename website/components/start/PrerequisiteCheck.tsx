"use client";

import { useMemo, useState } from "react";

export type PrerequisiteQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  termId: string;
  feedback: string;
};

export function PrerequisiteCheck({ questions }: { questions: PrerequisiteQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => questions.filter((question) => answers[question.id] === question.answer).length,
    [answers, questions],
  );

  return (
    <section aria-labelledby="prerequisite-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Non-blocking check</p>
          <h2 id="prerequisite-title">先修自测</h2>
        </div>
        <p>这不是考试。答案只留在当前页面，用来告诉你哪些术语值得先看一眼。</p>
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
                建议先看 <a href={`/glossary#${question.termId}`}>对应术语</a>：{question.feedback}
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
          看看准备情况
        </button>
        <a className="button button-ghost" href="/learn/sample-journey">不测试，直接进入首课</a>
      </div>

      {submitted ? (
        <div aria-live="polite" className="check-result">
          <strong>{score} / {questions.length}</strong>
          <p>
            {score === questions.length
              ? "基础概念已经够用，可以直接开始。"
              : "你仍然可以直接开始；遇到术语时，课程会给出上下文解释。"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
