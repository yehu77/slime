import type { Metadata } from "next";
import { JourneyExperience } from "../../../components/journey";
import { ConceptReview } from "../../../components/lesson/ConceptReview";
import { foundationReview, sampleJourneyLesson } from "../../../content/zh";

export const metadata: Metadata = {
  title: sampleJourneyLesson.metadata.title,
  description: sampleJourneyLesson.metadata.summary,
};

export default function SampleJourneyPage() {
  const questions = foundationReview.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => option.label),
    answer: question.options.findIndex((option) => option.id === question.correctOptionId),
    termId: question.reviewLink.href.replace("/glossary#", ""),
    feedback: question.feedback.review,
  }));

  return (
    <>
      <JourneyExperience />
      <section className="page-shell concept-review-section">
        <ConceptReview
          title={foundationReview.title}
          description={foundationReview.description}
          questions={questions}
        />
      </section>
    </>
  );
}
