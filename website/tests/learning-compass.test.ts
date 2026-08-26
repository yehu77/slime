import { describe, expect, it } from "vitest";

import {
  SAMPLE_TO_GENERATION_PHASE_LABELS,
  SAMPLE_TO_GENERATION_PHASE_SELECTORS,
} from "@/components/mechanism/sample-to-generation-compass";
import {
  LEARNING_COMPASS_PHASES,
  assertValidLearningCompassManifest,
  assertValidLearningCompassRegistration,
  buildLearningCompassNextChain,
  learningCompassHistoryIntent,
  resolveLearningCompassLocation,
  type LearningCompassManifest,
  type LearningPhase,
} from "@/components/site/learning-compass-store";

const phases: readonly LearningPhase[] = [
  { id: "orient", label: "现场" },
  { id: "model", label: "推演" },
  { id: "verify", label: "裁判" },
  { id: "practice", label: "结案" },
];

const manifest: LearningCompassManifest = {
  stage: { label: "核心机制", href: "/learn#stage-core-mechanisms", position: 3 },
  course: {
    label: "Sample 如何得到回答",
    href: "/learn/sample-to-generation",
    durationMinutes: 114,
    position: 1,
  },
  chapterCount: 2,
  chapters: [
    {
      id: "stg.chapter-2",
      label: "第 2 章 · 字段生命周期",
      shortLabel: "02 · 字段生命周期",
      durationMinutes: 12,
      href: "/learn/sample-to-generation?chapter=field-ownership",
      phases,
      position: 2,
    },
    {
      id: "stg.chapter-3",
      label: "第 3 章 · 成组，但不粘连",
      shortLabel: "03 · 成组，但不粘连",
      durationMinutes: 40,
      href: "/learn/sample-to-generation?chapter=group-without-aliasing",
      phases,
      position: 3,
    },
  ],
};

describe("global learning compass registry", () => {
  it("keeps the four stable phase ids in one fixed order", () => {
    expect(LEARNING_COMPASS_PHASES.map((phase) => phase.id)).toEqual([
      "orient",
      "model",
      "verify",
      "practice",
    ]);
  });

  it("uses the approved labels for every mechanism chapter and assessment", () => {
    expect(SAMPLE_TO_GENERATION_PHASE_LABELS).toEqual({
      "row-to-sample": ["定位", "翻译", "核证", "迁移"],
      "field-ownership": ["交接", "接力", "诊断", "迁移"],
      "group-without-aliasing": ["现场", "推演", "裁判", "结案"],
      "sample-to-request": ["入境前", "装配", "申报", "核证"],
      "response-projection": ["收件", "解码", "取证", "诊断"],
      "writeback-contract": ["交接", "校准", "失败边界", "迁移"],
      assessment: ["案卷", "定位", "作答", "判卷"],
    });
    for (const selectors of Object.values(SAMPLE_TO_GENERATION_PHASE_SELECTORS)) {
      expect(Object.keys(selectors)).toEqual(["orient", "model", "verify", "practice"]);
    }
  });

  it("validates unique chapters and one ordered occurrence of every phase", () => {
    expect(() => assertValidLearningCompassManifest(manifest)).not.toThrow();
    expect(() =>
      assertValidLearningCompassManifest({
        ...manifest,
        chapters: [manifest.chapters[0], manifest.chapters[0]],
      }),
    ).toThrow(/chapter IDs must be unique/);
    expect(() =>
      assertValidLearningCompassManifest({
        ...manifest,
        chapters: [{
          ...manifest.chapters[0],
          phases: [phases[1], phases[0], phases[2], phases[3]],
        }],
      }),
    ).toThrow(/orient, model, verify, practice exactly once/);

    const registration = {
      ...manifest,
      activeChapterId: "stg.chapter-3",
      activePhaseId: "model" as const,
      next: {
        label: "源码裁判",
        href: "/learn/sample-to-generation?chapter=group-without-aliasing#verify",
      },
      navigate: () => undefined,
    };
    expect(() => assertValidLearningCompassRegistration(registration)).not.toThrow();
    expect(() =>
      assertValidLearningCompassRegistration({
        ...registration,
        activeChapterId: "missing",
      }),
    ).toThrow(/Unknown active learning compass chapter/);
  });

  it("builds one deterministic next chain across chapter boundaries", () => {
    expect(buildLearningCompassNextChain(manifest)).toEqual([
      {
        chapterId: "stg.chapter-2",
        phaseId: "orient",
        href: "/learn/sample-to-generation?chapter=field-ownership#orient",
      },
      {
        chapterId: "stg.chapter-2",
        phaseId: "model",
        href: "/learn/sample-to-generation?chapter=field-ownership#model",
      },
      {
        chapterId: "stg.chapter-2",
        phaseId: "verify",
        href: "/learn/sample-to-generation?chapter=field-ownership#verify",
      },
      {
        chapterId: "stg.chapter-2",
        phaseId: "practice",
        href: "/learn/sample-to-generation?chapter=field-ownership#practice",
      },
      {
        chapterId: "stg.chapter-3",
        phaseId: "orient",
        href: "/learn/sample-to-generation?chapter=group-without-aliasing#orient",
      },
      {
        chapterId: "stg.chapter-3",
        phaseId: "model",
        href: "/learn/sample-to-generation?chapter=group-without-aliasing#model",
      },
      {
        chapterId: "stg.chapter-3",
        phaseId: "verify",
        href: "/learn/sample-to-generation?chapter=group-without-aliasing#verify",
      },
      {
        chapterId: "stg.chapter-3",
        phaseId: "practice",
        href: "/learn/sample-to-generation?chapter=group-without-aliasing#practice",
      },
    ]);
  });

  it("parses location and hash without treating an invalid hash as progress", () => {
    expect(
      resolveLearningCompassLocation(manifest, {
        pathname: "/learn/sample-to-generation",
        search: "?chapter=group-without-aliasing&utm=test",
        hash: "#model",
      }),
    ).toEqual({
      chapterId: "stg.chapter-3",
      phaseId: "model",
      hashWasValid: true,
    });
    expect(
      resolveLearningCompassLocation(manifest, {
        pathname: "/learn/sample-to-generation",
        search: "?chapter=group-without-aliasing",
        hash: "#not-a-phase",
      }),
    ).toEqual({
      chapterId: "stg.chapter-3",
      phaseId: "orient",
      hashWasValid: false,
    });
    expect(
      resolveLearningCompassLocation(manifest, {
        pathname: "/learn/sample-journey",
        search: "",
        hash: "#model",
      }),
    ).toBeNull();
  });

  it("reserves pushState for explicit navigation and replaceState for scroll", () => {
    expect(learningCompassHistoryIntent("explicit")).toBe("push");
    expect(learningCompassHistoryIntent("passive-scroll")).toBe("replace");
  });
});
