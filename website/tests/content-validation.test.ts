import { describe, expect, it } from "vitest";

import { LessonMetadataSchema } from "@/content/schema";
import {
  glossaryTerms,
  foundationReview,
  learningIntents,
  sampleJourneyLesson,
  sampleJourneyMessages,
  siteCopy,
} from "@/content/zh";
import { math2x2Fixture } from "@/core/journey";
import cpuEvidence from "@/data/evidence/slime-06ffdbe2.cpu.generated.json";
import anchorsPayload from "@/data/source-refs/slime-06ffdbe2.anchors.generated.json";
import refsPayload from "@/data/source-refs/slime-06ffdbe2.refs.json";

const metadata = sampleJourneyLesson.metadata;
const sourceIds = new Set(refsPayload.refs.map((ref) => ref.id));
const glossaryIds = new Set(glossaryTerms.map((term) => term.id));
const actIds = new Set(sampleJourneyLesson.acts.map((act) => act.id));
const questionIds = new Set(
  sampleJourneyLesson.assessment.questions.map((question) => question.id),
);
const foundationReviewIds = new Set(
  foundationReview.questions.map((question) => question.id),
);

describe("M1 lesson content contract", () => {
  it("validates the lesson metadata contract", () => {
    expect(
      LessonMetadataSchema.parse({
        schema_version: metadata.schemaVersion,
        id: metadata.id,
        kind: metadata.kind,
        locale: metadata.locale,
        route: metadata.route,
        title: metadata.title,
        summary: metadata.summary,
        audiences: metadata.audiences,
        level: metadata.level,
        duration: {
          min_minutes: metadata.duration.minMinutes,
          max_minutes: metadata.duration.maxMinutes,
          includes_assessment: metadata.duration.includesAssessment,
        },
        workflow_status: metadata.workflowStatus,
        freshness_status: metadata.freshnessStatus,
        visibility: metadata.visibility,
        lesson_revision: metadata.lessonRevision,
        prerequisites: metadata.prerequisites,
        learning_objectives: metadata.learningObjectiveIds,
        completion: {
          assessment_id: metadata.completion.assessmentId,
          assessment_version: metadata.completion.assessmentVersion,
          min_correct: metadata.completion.minCorrect,
          required_question_ids: metadata.completion.requiredQuestionIds,
          required_acts: metadata.completion.requiredActs,
        },
        baseline: {
          repository: metadata.baseline.repository,
          nearest_tag: metadata.baseline.nearestTag,
          describe: metadata.baseline.describe,
          commit: metadata.baseline.commit,
        },
        fixture_ids: metadata.fixtureIds,
        glossary_term_ids: metadata.glossaryTermIds,
        source_ref_ids: metadata.sourceRefIds,
        test_ref_ids: metadata.testRefIds,
        owners: {
          content: metadata.owners.content,
          technical_review: metadata.owners.technicalReview,
        },
      }),
    ).toBeTruthy();
  });

  it("keeps the 90-second, seven-act, nine-question completion shape", () => {
    expect(sampleJourneyLesson.overview90s.steps).toHaveLength(7);
    expect(
      sampleJourneyLesson.overview90s.steps.reduce(
        (seconds, step) => seconds + step.durationSeconds,
        0,
      ),
    ).toBe(90);
    expect(sampleJourneyLesson.acts.map((act) => act.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(sampleJourneyLesson.assessment.questions).toHaveLength(9);
    expect(
      sampleJourneyLesson.assessment.questions
        .filter((question) => question.required)
        .map((question) => question.id),
    ).toEqual(["q4", "q5", "q8"]);
    expect(sampleJourneyLesson.assessment.completion).toMatchObject({
      minCorrect: 7,
      requiredQuestionIds: ["q4", "q5", "q8"],
      unlimitedRetries: true,
      progressScope: "device-local",
    });
  });

  it("resolves every glossary, source, review, and locale reference", () => {
    expect(glossaryIds.size).toBe(glossaryTerms.length);
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(15);
    expect(glossaryTerms.length).toBeLessThanOrEqual(20);

    for (const act of sampleJourneyLesson.acts) {
      expect(act.sourceRefIds.every((id) => sourceIds.has(id))).toBe(true);
      expect(act.glossaryTermIds.every((id) => glossaryIds.has(id))).toBe(true);
    }
    for (const term of glossaryTerms) {
      expect(term.sourceRefIds.every((id) => sourceIds.has(id))).toBe(true);
      expect(
        term.usedBy.every(
          (id) => actIds.has(id) || questionIds.has(id) || foundationReviewIds.has(id),
        ),
      ).toBe(true);
    }
    for (const question of sampleJourneyLesson.assessment.questions) {
      if (question.returnTo.actId) {
        expect(actIds.has(question.returnTo.actId)).toBe(true);
      }
    }
    for (const question of foundationReview.questions) {
      const glossaryId = question.reviewLink.href.replace("/glossary#", "");
      expect(glossaryIds.has(glossaryId)).toBe(true);
    }

    const requiredMessageKeys = new Set<string>([
      math2x2Fixture.teaching_values_notice_key,
      ...Object.values(math2x2Fixture.initial_samples).map(
        (sample) => sample.prompt.copy_key,
      ),
      ...math2x2Fixture.events.flatMap((event) => [
        event.title_key,
        event.narration_key,
        event.transcript_key,
      ]),
    ]);
    expect([...requiredMessageKeys].every((key) => sampleJourneyMessages[key])).toBe(
      true,
    );
  });
});

describe("M1 evidence and navigation contract", () => {
  it("pins source refs, fixture, metadata, and generated anchors to one commit", () => {
    const commit = refsPayload.baseline.commit;
    expect(commit).toBe("06ffdbe22be068b52f9ed0fc318c473f7030197e");
    expect(metadata.baseline.commit).toBe(commit);
    expect(math2x2Fixture.slime_ref.commit).toBe(commit);
    expect(anchorsPayload.baseline_commit).toBe(commit);
    expect(cpuEvidence.baseline_commit).toBe(commit);
    expect(cpuEvidence).toMatchObject({
      kind: "cpu-contract-tests",
      environment: { num_gpus: 0 },
      result: { status: "passed", passed: 21, failed: 0 },
    });
    expect(refsPayload.refs).toHaveLength(24);

    const anchorIds = new Set(anchorsPayload.anchors.map((anchor) => anchor.id));
    expect(anchorIds).toEqual(sourceIds);
    for (const anchor of anchorsPayload.anchors) {
      expect(anchor.commit).toBe(commit);
      expect(anchor.start_line).toBeGreaterThan(0);
      expect(anchor.end_line).toBeGreaterThanOrEqual(anchor.start_line);
      expect(anchor.snippet_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(anchor.url).toContain(`/blob/${commit}/`);
    }
  });

  it("keeps every M1 learning-intent link on a real route", () => {
    expect(learningIntents).toHaveLength(5);
    const realRoutes = [
      "/start",
      "/learn/sample-journey",
      "/source",
    ];
    for (const intent of learningIntents) {
      expect(realRoutes.some((route) => intent.href.startsWith(route))).toBe(true);
    }
    expect(siteCopy.primaryCta.href).toBe("/start");
    expect(siteCopy.lessonCta.href).toBe("/learn/sample-journey");
  });
});
