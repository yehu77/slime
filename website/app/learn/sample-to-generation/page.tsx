import type { Metadata } from "next";

import { SampleToGenerationExperience } from "../../../components/mechanism";
import { sampleToGenerationCourse } from "../../../content/zh/lessons/sample-to-generation";

export const metadata: Metadata = {
  title: sampleToGenerationCourse.metadata.title,
  description: sampleToGenerationCourse.metadata.summary,
};

type SampleToGenerationPageProps = {
  searchParams: Promise<{ chapter?: string | string[] }>;
};

export default async function SampleToGenerationPage({
  searchParams,
}: SampleToGenerationPageProps) {
  const query = await searchParams;
  const chapter = Array.isArray(query.chapter) ? query.chapter[0] : query.chapter;
  return <SampleToGenerationExperience initialChapterSlug={chapter ?? null} />;
}
