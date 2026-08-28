import type { Metadata } from "next";
import { SystemIntroExperience } from "../../../components/journey";
import { systemIntroManifest } from "../../../content/zh";

export const metadata: Metadata = {
  title: systemIntroManifest.title,
  description: systemIntroManifest.summary,
};

export default function SampleJourneyPage() {
  return <SystemIntroExperience />;
}
