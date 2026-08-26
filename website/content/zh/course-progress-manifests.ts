import type { ProgressCompletionManifest } from "../../core/progress";
import { sampleJourneyLesson } from "./lessons/sample-journey";
import { sampleToGenerationCourse } from "./lessons/sample-to-generation";

export const sampleJourneyProgressManifest = {
  lesson_revision: sampleJourneyLesson.metadata.lessonRevision,
  completion: {
    required_section_ids: sampleJourneyLesson.metadata.completion.requiredActs.map(
      (act) => `act-${act}`,
    ),
    required_exercise_ids: [],
    final_assessment: {
      assessment_version: sampleJourneyLesson.assessment.version,
      question_ids: sampleJourneyLesson.assessment.questions.map((question) => question.id),
      min_correct: sampleJourneyLesson.assessment.completion.minCorrect,
      required_question_ids: [
        ...sampleJourneyLesson.assessment.completion.requiredQuestionIds,
      ],
    },
  },
} satisfies ProgressCompletionManifest;

export const sampleToGenerationProgressManifest = {
  lesson_revision: sampleToGenerationCourse.metadata.lessonRevision,
  completion: {
    required_section_ids: [...sampleToGenerationCourse.completion.requiredChapterIds],
    required_exercise_ids: sampleToGenerationCourse.chapters.map(
      (chapter) => chapter.exercise.id,
    ),
    final_assessment: {
      assessment_version: sampleToGenerationCourse.metadata.assessmentVersion,
      question_ids: sampleToGenerationCourse.finalAssessment.checkpoints.map(
        (checkpoint) => checkpoint.exercise.id,
      ),
      min_correct: sampleToGenerationCourse.completion.minCorrect,
      required_question_ids: [...sampleToGenerationCourse.completion.requiredQuestionIds],
    },
  },
} satisfies ProgressCompletionManifest;

export const courseProgressManifests = {
  "core.sample-journey": sampleJourneyProgressManifest,
  "core.sample-to-generation": sampleToGenerationProgressManifest,
} as const;
