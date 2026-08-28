import type { ProgressCompletionManifest } from "../../core/progress";
import { sampleToGenerationCourse } from "./lessons/sample-to-generation";
import { systemIntroManifest } from "./lessons/system-intro";

export const sampleJourneyProgressManifest = {
  lesson_revision: systemIntroManifest.lessonRevision,
  completion: {
    required_section_ids: systemIntroManifest.units.map((unit) => unit.id),
    required_exercise_ids: [],
    final_assessment: {
      assessment_version: systemIntroManifest.finalAssessment.version,
      question_ids: systemIntroManifest.finalAssessment.exercises.map((exercise) => exercise.id),
      min_correct: systemIntroManifest.finalAssessment.completion.minCorrect,
      required_question_ids: [...systemIntroManifest.finalAssessment.completion.requiredQuestionIds],
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
