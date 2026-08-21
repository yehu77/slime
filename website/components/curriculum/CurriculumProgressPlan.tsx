"use client";

import { useEffect, useState } from "react";

import type { CurriculumLearnerStatusMap } from "../../content/zh";
import { loadLocalProgressV2 } from "../../core/progress";
import { CurriculumPlan, type CurriculumPlanProps } from "./CurriculumPlan";
import { deriveCurriculumLearnerStatus } from "./curriculum-progress";

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
  const [hydratedStatus, setHydratedStatus] = useState<CurriculumLearnerStatusMap>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const progress = loadLocalProgressV2(window.localStorage);
      setHydratedStatus(deriveCurriculumLearnerStatus(progress));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <CurriculumPlan
      {...props}
      learnerStatusByUnit={{ ...hydratedStatus, ...suppliedStatus }}
    />
  );
}
