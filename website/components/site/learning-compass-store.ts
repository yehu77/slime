"use client";

import { useEffect, useSyncExternalStore } from "react";

export const LEARNING_COMPASS_PHASES = [
  { id: "orient", label: "定位问题" },
  { id: "model", label: "建立模型" },
  { id: "verify", label: "核对证据" },
  { id: "practice", label: "练习迁移" },
] as const;

export type LearningCompassPhaseId =
  (typeof LEARNING_COMPASS_PHASES)[number]["id"];

/** Public, course-authored description of one stable reading phase. */
export type LearningPhase = {
  id: LearningCompassPhaseId;
  label: string;
};

export type LearningCompassChapter = {
  id: string;
  label: string;
  shortLabel: string;
  durationMinutes: number;
  href: string;
  phases: readonly LearningPhase[];
  position: number | "final";
};

export type LearningCompassTarget = {
  chapterId: string;
  phaseId: LearningCompassPhaseId;
  href: string;
};

/**
 * Serializable part of the compass contract. Readers add runtime location and
 * navigation with `LearningCompassRegistration` when they mount.
 */
export type LearningCompassManifest = {
  stage: { label: string; href: string; position: number };
  course: { label: string; href: string; durationMinutes: number; position: number };
  chapters: readonly LearningCompassChapter[];
  chapterCount: number;
  chapterNoun?: "章" | "幕" | "单元";
};

export type LearningCompassRegistration = LearningCompassManifest & {
  activeChapterId: string;
  activePhaseId: LearningCompassPhaseId;
  next: { label: string; href: string } | null;
  navigate: (target: LearningCompassTarget) => void;
};

export type LearningCompassLocation = {
  chapterId: string;
  phaseId: LearningCompassPhaseId;
  hashWasValid: boolean;
};

export type LearningCompassNavigationCause = "explicit" | "passive-scroll";
export type LearningCompassHistoryIntent = "push" | "replace";

const phaseIds = new Set<LearningCompassPhaseId>(
  LEARNING_COMPASS_PHASES.map((phase) => phase.id),
);

function normalizedUrl(href: string) {
  return new URL(href, "https://slime-lab.invalid");
}

function chapterHrefMatches(
  chapterHref: string,
  pathname: string,
  search: string,
) {
  const expected = normalizedUrl(chapterHref);
  if (expected.pathname !== pathname) return false;
  const actualSearch = new URLSearchParams(search);
  return [...expected.searchParams].every(
    ([key, value]) => actualSearch.get(key) === value,
  );
}

/** Resolve a deep link without silently treating an invalid hash as progress. */
export function resolveLearningCompassLocation(
  manifest: LearningCompassManifest,
  location: Pick<Location, "pathname" | "search" | "hash">,
): LearningCompassLocation | null {
  const chapter = manifest.chapters.find((candidate) =>
    chapterHrefMatches(candidate.href, location.pathname, location.search),
  );
  if (!chapter) return null;

  const requestedPhase = location.hash.replace(/^#/, "") as LearningCompassPhaseId;
  const hashWasValid = phaseIds.has(requestedPhase) &&
    chapter.phases.some((phase) => phase.id === requestedPhase);
  return {
    chapterId: chapter.id,
    phaseId: hashWasValid ? requestedPhase : "orient",
    hashWasValid,
  };
}

/** Explicit learner choices create history; passive scroll only updates it. */
export function learningCompassHistoryIntent(
  cause: LearningCompassNavigationCause,
): LearningCompassHistoryIntent {
  return cause === "explicit" ? "push" : "replace";
}

/** Ordered chapter/phase chain used by maps and regression tests. */
export function buildLearningCompassNextChain(
  manifest: LearningCompassManifest,
): readonly LearningCompassTarget[] {
  return manifest.chapters.flatMap((chapter) =>
    chapter.phases.map((phase) => ({
      chapterId: chapter.id,
      phaseId: phase.id,
      href: `${chapter.href}#${phase.id}`,
    })),
  );
}

/** Fail fast when a reader registers an ambiguous course map. */
export function assertValidLearningCompassManifest(
  manifest: LearningCompassManifest,
): void {
  if (manifest.chapterCount < 1 || !Number.isInteger(manifest.chapterCount)) {
    throw new Error("Learning compass chapterCount must be a positive integer");
  }
  const chapterIds = manifest.chapters.map((chapter) => chapter.id);
  if (new Set(chapterIds).size !== chapterIds.length) {
    throw new Error("Learning compass chapter IDs must be unique");
  }
  for (const chapter of manifest.chapters) {
    const ids = chapter.phases.map((phase) => phase.id);
    if (
      ids.length !== LEARNING_COMPASS_PHASES.length ||
      ids.some((id, index) => id !== LEARNING_COMPASS_PHASES[index].id)
    ) {
      throw new Error(
        `Learning compass chapter ${chapter.id} must declare orient, model, verify, practice exactly once`,
      );
    }
  }
}

export function assertValidLearningCompassRegistration(
  next: LearningCompassRegistration,
): void {
  assertValidLearningCompassManifest(next);
  const activeChapter = next.chapters.find(
    (chapter) => chapter.id === next.activeChapterId,
  );
  if (!activeChapter) {
    throw new Error(`Unknown active learning compass chapter ${next.activeChapterId}`);
  }
  if (!activeChapter.phases.some((phase) => phase.id === next.activePhaseId)) {
    throw new Error(
      `Unknown active learning compass phase ${next.activePhaseId} for ${next.activeChapterId}`,
    );
  }
}

let registration: LearningCompassRegistration | null = null;
const listeners = new Set<() => void>();

function publish(next: LearningCompassRegistration | null) {
  registration = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLearningCompassRegistration(
  next: LearningCompassRegistration,
) {
  useEffect(() => {
    assertValidLearningCompassRegistration(next);
    publish(next);
    return () => {
      if (registration === next) publish(null);
    };
  }, [next]);
}

export function useLearningCompass() {
  return useSyncExternalStore(subscribe, () => registration, () => null);
}
