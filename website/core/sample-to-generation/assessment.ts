export type ExerciseOption = {
  id: string;
  label: string;
};

export type ExerciseFeedback = {
  correct: string;
  incorrect: string;
};

type StructuredExerciseBase = {
  id: string;
  title: string;
  prompt: string;
  instruction: string;
  sourceRefIds: readonly string[];
  feedback: ExerciseFeedback;
};

export type ChoiceExercise = StructuredExerciseBase & {
  kind: "choice";
  multiple: boolean;
  options: readonly ExerciseOption[];
  correctOptionIds: readonly string[];
};

export type OrderingExercise = StructuredExerciseBase & {
  kind: "ordering";
  items: readonly ExerciseOption[];
  correctOrder: readonly string[];
};

export type MappingExercise = StructuredExerciseBase & {
  kind: "mapping";
  items: readonly ExerciseOption[];
  targets: readonly ExerciseOption[];
  correctMapping: Readonly<Record<string, string>>;
};

export type FieldEntryExercise = StructuredExerciseBase & {
  kind: "field-entry";
  fields: readonly {
    id: string;
    label: string;
    placeholder?: string;
    acceptedAnswers: readonly string[];
    caseSensitive?: boolean;
  }[];
};

export type StructuredExercise =
  | ChoiceExercise
  | OrderingExercise
  | MappingExercise
  | FieldEntryExercise;

export type StructuredExerciseAnswer =
  | { kind: "choice"; selectedOptionIds: readonly string[] }
  | { kind: "ordering"; orderedItemIds: readonly string[] }
  | { kind: "mapping"; mapping: Readonly<Record<string, string>> }
  | { kind: "field-entry"; values: Readonly<Record<string, string>> };

export type ExerciseGrade = {
  exerciseId: string;
  correct: boolean;
  fieldResults: Readonly<Record<string, boolean>>;
  feedback: string;
};

export type FinalAssessmentGrade = {
  score: number;
  total: number;
  minCorrect: number;
  requiredQuestionIds: readonly string[];
  missingRequiredCorrectIds: readonly string[];
  passed: boolean;
  grades: readonly ExerciseGrade[];
};

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value) => right.includes(value)) &&
    right.every((value) => left.includes(value))
  );
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function normalized(value: string, caseSensitive = false): string {
  const collapsed = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? collapsed : collapsed.toLocaleLowerCase("zh-CN");
}

export function gradeStructuredExercise(
  exercise: StructuredExercise,
  answer: StructuredExerciseAnswer | undefined,
): ExerciseGrade {
  const incorrect = (fieldResults: Readonly<Record<string, boolean>> = {}) => ({
    exerciseId: exercise.id,
    correct: false,
    fieldResults,
    feedback: exercise.feedback.incorrect,
  });

  if (!answer || answer.kind !== exercise.kind) {
    return incorrect();
  }

  let fieldResults: Record<string, boolean> = {};
  switch (exercise.kind) {
    case "choice": {
      const choiceAnswer = answer as Extract<StructuredExerciseAnswer, { kind: "choice" }>;
      const correct = sameSet(
        choiceAnswer.selectedOptionIds,
        exercise.correctOptionIds,
      );
      fieldResults = { selection: correct };
      break;
    }
    case "ordering": {
      const orderingAnswer = answer as Extract<StructuredExerciseAnswer, { kind: "ordering" }>;
      const exactOrder = sameOrder(
        orderingAnswer.orderedItemIds,
        exercise.correctOrder,
      );
      exercise.correctOrder.forEach((itemId, index) => {
        fieldResults[itemId] = orderingAnswer.orderedItemIds[index] === itemId;
      });
      if (!exactOrder && Object.values(fieldResults).every(Boolean)) {
        fieldResults.__order__ = false;
      }
      break;
    }
    case "mapping": {
      const mappingAnswer = answer as Extract<StructuredExerciseAnswer, { kind: "mapping" }>;
      for (const [itemId, targetId] of Object.entries(exercise.correctMapping)) {
        fieldResults[itemId] = mappingAnswer.mapping[itemId] === targetId;
      }
      break;
    }
    case "field-entry": {
      const fieldAnswer = answer as Extract<StructuredExerciseAnswer, { kind: "field-entry" }>;
      for (const field of exercise.fields) {
        const actual = normalized(fieldAnswer.values[field.id] ?? "", field.caseSensitive);
        fieldResults[field.id] = field.acceptedAnswers.some(
          (accepted) => normalized(accepted, field.caseSensitive) === actual,
        );
      }
      break;
    }
  }

  const correct =
    Object.keys(fieldResults).length > 0 &&
    Object.values(fieldResults).every(Boolean);
  return {
    exerciseId: exercise.id,
    correct,
    fieldResults,
    feedback: correct ? exercise.feedback.correct : exercise.feedback.incorrect,
  };
}

export function gradeFinalAssessment(
  exercises: readonly StructuredExercise[],
  answers: Readonly<Record<string, StructuredExerciseAnswer | undefined>>,
  completion: {
    minCorrect: number;
    requiredQuestionIds: readonly string[];
  },
): FinalAssessmentGrade {
  const grades = exercises.map((exercise) =>
    gradeStructuredExercise(exercise, answers[exercise.id]),
  );
  const correctIds = new Set(
    grades.filter((grade) => grade.correct).map((grade) => grade.exerciseId),
  );
  const missingRequiredCorrectIds = completion.requiredQuestionIds.filter(
    (questionId) => !correctIds.has(questionId),
  );
  const score = correctIds.size;
  return {
    score,
    total: exercises.length,
    minCorrect: completion.minCorrect,
    requiredQuestionIds: completion.requiredQuestionIds,
    missingRequiredCorrectIds,
    passed:
      score >= completion.minCorrect && missingRequiredCorrectIds.length === 0,
    grades,
  };
}
