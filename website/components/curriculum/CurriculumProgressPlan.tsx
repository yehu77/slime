"use client";

import type { CurriculumLearnerStatusMap } from "../../content/zh";
import { useLearningProgress } from "../../core/progress";
import { CurriculumActionPage } from "./CurriculumActionPage";
import type { CurriculumPlanProps } from "./CurriculumPlan";
import {
  deriveCurriculumLearnerStatus,
  deriveCurriculumRecommendations,
} from "./curriculum-progress";

type CurriculumProgressPlanProps = Omit<
  CurriculumPlanProps,
  "learnerStatusByUnit"
> & {
  learnerStatusByUnit?: CurriculumLearnerStatusMap;
};

export function CurriculumProgressPlan({
  learnerStatusByUnit: suppliedStatus = {},
  ...props
}: CurriculumProgressPlanProps) {
  const { progress } = useLearningProgress();
  const hydratedStatus = deriveCurriculumLearnerStatus(progress);
  const learnerStatusByUnit = { ...hydratedStatus, ...suppliedStatus };
  const recommendations = deriveCurriculumRecommendations(progress, props.curriculum);

  return (
    <CurriculumActionPage
      curriculum={props.curriculum}
      learnerStatusByUnit={learnerStatusByUnit}
      recommendations={recommendations}
    />
  );
}
