import type { Metadata } from "next";
import { JourneyExperience } from "../../../components/journey";
import { sampleJourneyLesson } from "../../../content/zh";

export const metadata: Metadata = {
  title: sampleJourneyLesson.metadata.title,
  description: sampleJourneyLesson.metadata.summary,
};

export default function SampleJourneyPage() {
  return <JourneyExperience />;
}
