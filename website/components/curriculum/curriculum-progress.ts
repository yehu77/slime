import {
  courseProgressManifests,
  type CurriculumLearnerStatusMap,
} from "../../content/zh";
import {
  evaluateLessonProgressV2,
  type LocalProgressV2,
} from "../../core/progress";

export function deriveCurriculumLearnerStatus(
  progress: LocalProgressV2,
): CurriculumLearnerStatusMap {
  const introStatus = evaluateLessonProgressV2(
    progress.lessons["core.sample-journey"],
    courseProgressManifests["core.sample-journey"],
  ).status;
  const generationStatus = evaluateLessonProgressV2(
    progress.lessons["core.sample-to-generation"],
    courseProgressManifests["core.sample-to-generation"],
  ).status;

  return {
    "system-intro": introStatus,
    "core.sample-to-generation": generationStatus,
    "core-mechanisms": generationStatus === "completed" ? "in_progress" : generationStatus,
  };
}
