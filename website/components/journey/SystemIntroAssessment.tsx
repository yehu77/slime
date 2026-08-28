"use client";

import { useMemo, useState } from "react";

import {
  gradeFinalAssessment,
  type FinalAssessmentGrade,
  type StructuredExercise as Exercise,
  type StructuredExerciseAnswer,
} from "../../core/sample-to-generation";
import { StructuredExercise } from "../mechanism/StructuredExercise";

type SystemIntroAssessmentProps = {
  exercises: readonly Exercise[];
  completion: {
    minCorrect: number;
    requiredQuestionIds: readonly string[];
  };
  previouslyPassed: boolean;
  previousBestScore: number;
  onSubmit: (
    answers: Readonly<Record<string, StructuredExerciseAnswer | undefined>>,
    grade: FinalAssessmentGrade,
  ) => void;
};

export function SystemIntroAssessment({
  exercises,
  completion,
  previouslyPassed,
  previousBestScore,
  onSubmit,
}: SystemIntroAssessmentProps) {
  const [answers, setAnswers] = useState<Record<string, StructuredExerciseAnswer>>({});
  const [grade, setGrade] = useState<FinalAssessmentGrade | null>(null);
  const answeredCount = Object.keys(answers).length;
  const requiredTitles = useMemo(
    () =>
      completion.requiredQuestionIds.map(
        (id) => exercises.find((exercise) => exercise.id === id)?.title ?? id,
      ),
    [completion.requiredQuestionIds, exercises],
  );

  const submit = () => {
    const next = gradeFinalAssessment(exercises, answers, completion);
    setGrade(next);
    onSubmit(answers, next);
  };

  return (
    <section className="system-intro-assessment" aria-labelledby="system-intro-assessment-title">
      <header>
        <div>
          <h2 id="system-intro-assessment-title">综合终测：让证据替组件名说话</h2>
          <p>
            六份案卷分别检查版本、骨架、角色、两条轴、Sample 观测边界与故障重建。
            通过条件是 5/6，并且三道关键案卷必须正确。
          </p>
        </div>
        <dl>
          <div><dt>已作答</dt><dd>{answeredCount}/{exercises.length}</dd></div>
          <div><dt>历史最佳</dt><dd>{Math.max(previousBestScore, grade?.score ?? 0)}/{exercises.length}</dd></div>
          <div><dt>课程状态</dt><dd>{previouslyPassed || grade?.passed ? "已通过" : "待结案"}</dd></div>
        </dl>
      </header>

      <details className="system-intro-assessment-rule">
        <summary>查看三道关键案卷</summary>
        <ol>{requiredTitles.map((title) => <li key={title}>{title}</li>)}</ol>
      </details>

      <div className="system-intro-assessment-list">
        {exercises.map((exercise, index) => (
          <div className="system-intro-assessment-item" key={exercise.id}>
            <span aria-hidden="true">CASE {String(index + 1).padStart(2, "0")}</span>
            <StructuredExercise
              exercise={exercise}
              onAnswerChange={(answer) => {
                setGrade(null);
                setAnswers((current) => ({ ...current, [exercise.id]: answer }));
              }}
            />
          </div>
        ))}
      </div>

      <footer className="system-intro-assessment-submit">
        <div>
          {grade ? (
            <p role="status">
              <strong>{grade.passed ? "架构重建成立" : "证据链尚未闭合"}</strong>
              本次 {grade.score}/{grade.total}。
              {grade.missingRequiredCorrectIds.length
                ? ` 仍需修正 ${grade.missingRequiredCorrectIds.length} 道关键案卷。`
                : grade.score < grade.minCorrect
                  ? ` 还需至少答对 ${grade.minCorrect - grade.score} 题。`
                  : " 已达到本课通过条件。"}
            </p>
          ) : (
            <p>可以逐题核对并无限重试；最终提交只记录正确题目与最佳成绩。</p>
          )}
        </div>
        <button disabled={answeredCount < exercises.length} onClick={submit} type="button">
          提交整份案卷
        </button>
      </footer>
    </section>
  );
}
