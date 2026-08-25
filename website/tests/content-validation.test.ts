import { describe, expect, it } from "vitest";

import { LessonMetadataSchema } from "@/content/schema";
import {
  glossaryTerms,
  foundationReview,
  learningIntents,
  sampleJourneyLesson,
  sampleJourneyMessages,
  slimeCurriculum,
  sourceRefLabels,
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

  it("keeps the 90-second, seven-act, ten-question completion shape", () => {
    expect(sampleJourneyLesson.opening.paragraphs).toHaveLength(3);
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
    expect(sampleJourneyLesson.assessment.questions).toHaveLength(10);
    expect(
      sampleJourneyLesson.assessment.questions
        .filter((question) => question.required)
        .map((question) => question.id),
    ).toEqual(["q4", "q5", "q8", "q10"]);
    expect(sampleJourneyLesson.assessment.completion).toMatchObject({
      minCorrect: 8,
      requiredQuestionIds: ["q4", "q5", "q8", "q10"],
      unlimitedRetries: true,
      progressScope: "device-local",
    });
    expect(metadata.studyModes).toEqual({
      core: expect.objectContaining({ duration: "25–30 分钟" }),
      research: expect.objectContaining({ duration: "约 60 分钟" }),
    });
    expect("nextLearningPath" in sampleJourneyLesson).toBe(false);
    expect(slimeCurriculum.stages.map((stage) => stage.id)).toHaveLength(7);
    expect(sampleJourneyLesson.assessment.questions.at(-1)).toMatchObject({
      id: "q10",
      type: "multiple",
      required: true,
      correctOptionIds: ["incomplete-group", "history-rewrite"],
    });
  });

  it("gives every act a beginner-readable narrative before technical evidence", () => {
    const firstAct = sampleJourneyLesson.acts[0];
    const groupingAct = sampleJourneyLesson.acts[1];
    const generationAct = sampleJourneyLesson.acts[2];
    const rewardAct = sampleJourneyLesson.acts[3];
    const conversionAct = sampleJourneyLesson.acts[4];
    const trainingAct = sampleJourneyLesson.acts[5];
    const syncAct = sampleJourneyLesson.acts[6];
    expect(metadata.lessonRevision).toBe(7);
    expect(metadata.completion.assessmentVersion).toBe(2);
    expect(sampleJourneyLesson.acts.every((act) => act.prediction.options.length >= 3)).toBe(true);
    expect(firstAct.narrative).toMatchObject({
      title: "Sample 是统一中间表示，不是训练 batch。",
      takeaway: expect.stringContaining("PENDING"),
    });
    expect(firstAct.narrative?.paragraphs).toHaveLength(2);
    expect(firstAct.narrative?.directAnswer).toContain("`tokens`");
    expect(firstAct.fieldChanges).toHaveLength(5);
    expect(firstAct.transition).toContain("下一幕");

    expect(groupingAct.narrative?.directAnswer).toContain("`group_index`");
    expect(groupingAct.narrative?.directAnswer).toContain("`index`");
    expect(groupingAct.walkthrough?.steps).toHaveLength(3);
    expect(groupingAct.walkthrough?.steps[2].facts).toEqual([
      "a0 → group_index 0 · index 0",
      "a1 → group_index 0 · index 1",
      "response 仍为空",
    ]);

    expect(generationAct.narrative?.paragraphs).toHaveLength(3);
    expect(generationAct.walkthrough?.steps).toHaveLength(3);
    expect(generationAct.walkthrough?.caption).toContain("`tokens`");
    expect(generationAct.walkthrough?.caption).toContain("`response_length`");
    expect(generationAct.fieldChanges).toHaveLength(6);

    expect(rewardAct.narrative?.directAnswer).toContain("`reward=0`");
    expect(rewardAct.narrative?.takeaway).toContain("`collect`");
    expect(rewardAct.walkthrough?.steps).toHaveLength(3);
    expect(rewardAct.walkthrough?.steps[2].facts).toEqual([
      "group 0 = [a0(1), a1(0)]",
      "group 1 = [b0(1), b1(0)]",
      "本课收回 2 个完整 group",
    ]);
    expect(rewardAct.walkthrough?.caption).toContain("`collected=true`");
    expect(rewardAct.fieldChanges).toHaveLength(5);

    expect(conversionAct.narrative?.directAnswer).toContain("按 DP rank");
    expect(conversionAct.walkthrough?.steps).toHaveLength(3);
    expect(conversionAct.walkthrough?.steps[2].facts).toEqual([
      "step 0 → a0, a1 · rollout 0, 1",
      "step 1 → b0, b1 · rollout 2, 3",
      "used = 4 · trimmed = 0",
    ]);
    expect(conversionAct.walkthrough?.caption).toContain("`raw_reward`");
    expect(conversionAct.walkthrough?.caption).toContain("`rewards`");
    expect(conversionAct.fieldChanges).toHaveLength(6);

    expect(trainingAct.narrative?.takeaway).toContain("optimizer 更新当前 actor 参数");
    expect(trainingAct.walkthrough?.steps).toHaveLength(3);
    expect(trainingAct.walkthrough?.steps[2].facts).toEqual([
      "Megatron actor → actor@1",
      "SGLang rollout → actor@0",
      "weights_published = false",
      "历史 Sample → actor@0",
    ]);
    expect(trainingAct.fieldChanges).toHaveLength(6);

    expect(syncAct.narrative?.directAnswer).toContain("`update_weights`");
    expect(syncAct.walkthrough?.steps).toHaveLength(3);
    expect(syncAct.walkthrough?.steps[2].facts).toEqual([
      "next_cycle_ready = true",
      "new Sample → actor@1",
      "a0/a1/b0/b1 → 仍是 actor@0",
    ]);
    expect(syncAct.walkthrough?.caption).toContain("`train 完成 ≠ rollout 已发布`");
    expect(syncAct.fieldChanges).toHaveLength(6);
  });

  it("resolves every glossary, source, review, and locale reference", () => {
    expect(glossaryIds.size).toBe(glossaryTerms.length);
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(15);
    expect(glossaryTerms.length).toBeLessThanOrEqual(20);

    for (const act of sampleJourneyLesson.acts) {
      expect(act.sourceRefIds.every((id) => sourceIds.has(id))).toBe(true);
      expect(act.sourceRefIds.every((id) => Boolean(sourceRefLabels[id]))).toBe(true);
      expect(act.glossaryTermIds.every((id) => glossaryIds.has(id))).toBe(true);
      expect(act.prediction.options.some((option) => option.id === act.prediction.correctOptionId)).toBe(true);
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
    expect(refsPayload.refs).toHaveLength(29);
    expect([...sourceIds]).toEqual(expect.arrayContaining([
      "sample.identity-defaults",
      "rollout.datasource-counter-init",
    ]));

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
