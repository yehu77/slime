"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  LOCAL_PROGRESS_V2_STORAGE_KEY,
  applyLessonProgressEvent,
  createEmptyLocalProgressV2,
  discardOutdatedLessonProgressV2,
  reconcileStoredProgressV2,
  saveLocalProgressV2,
  type LocalProgressV2,
  type ProgressCompletionManifest,
  type ProgressEvent,
  type ProgressManifestRegistry,
} from "./progress-v2";

export type LearningProgressSnapshot = {
  progress: LocalProgressV2;
  hydrated: boolean;
  persistenceUnavailable: boolean;
};

const serverSnapshot: LearningProgressSnapshot = {
  progress: createEmptyLocalProgressV2(),
  hydrated: false,
  persistenceUnavailable: false,
};

let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
const emptyManifestRegistry: ProgressManifestRegistry = {};
let configuredManifests = emptyManifestRegistry;

function publish(next: LearningProgressSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function hydrateFromStorage(
  manifestRegistry: ProgressManifestRegistry = configuredManifests,
) {
  if (typeof window === "undefined") return;
  try {
    const reconciliation = reconcileStoredProgressV2(
      window.localStorage,
      manifestRegistry,
    );
    publish({
      progress: reconciliation.progress,
      hydrated: true,
      persistenceUnavailable: reconciliation.persistence_unavailable,
    });
  } catch {
    publish({ ...snapshot, hydrated: true, persistenceUnavailable: true });
  }
}

export function LearningProgressProvider({
  manifests,
}: {
  manifests: ProgressManifestRegistry;
}) {
  useEffect(() => {
    configuredManifests = manifests;
    hydrateFromStorage(manifests);
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key === LOCAL_PROGRESS_V2_STORAGE_KEY || event.key === null) {
        hydrateFromStorage(manifests);
      }
    };
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, [manifests]);

  return null;
}

export function useLearningProgress(): LearningProgressSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

export function recordLearningProgress(
  lessonId: string,
  manifest: ProgressCompletionManifest,
  events: readonly ProgressEvent[],
): LocalProgressV2 {
  if (!snapshot.hydrated && typeof window !== "undefined") {
    hydrateFromStorage();
  }
  let next = discardOutdatedLessonProgressV2(
    snapshot.progress,
    configuredManifests,
  );
  for (const event of events) {
    next = applyLessonProgressEvent(next, lessonId, manifest, event);
  }

  let persistenceUnavailable = snapshot.persistenceUnavailable;
  if (typeof window !== "undefined") {
    try {
      saveLocalProgressV2(window.localStorage, next);
      persistenceUnavailable = false;
    } catch {
      persistenceUnavailable = true;
    }
  }
  publish({ progress: next, hydrated: true, persistenceUnavailable });
  return next;
}

export function replaceLearningProgress(progress: LocalProgressV2) {
  publish({
    ...snapshot,
    progress: discardOutdatedLessonProgressV2(
      progress,
      configuredManifests,
    ),
    hydrated: true,
  });
}
