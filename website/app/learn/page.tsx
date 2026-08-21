import type { Metadata } from "next";
import { CurriculumProgressPlan } from "../../components/curriculum";
import { slimeCurriculum } from "../../content/zh/curriculum";

export const metadata: Metadata = {
  title: "课程总路线",
  description: "沿七个阶段先建立系统地图、完成五门核心机制课与综合检查，再进入可验证实验。",
};

export default function LearnPage() {
  return (
    <div className="curriculum-page">
      <CurriculumProgressPlan curriculum={slimeCurriculum} />
    </div>
  );
}
