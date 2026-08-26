"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  LOCAL_PROGRESS_V2_STORAGE_KEY,
  applyLessonProgressEvent,
  createEmptyLocalProgressV2,
  loadLocalProgressV2,
  saveLocalProgressV2,
  type LocalProgressV2,
  type ProgressCompletionManifest,
  type ProgressEvent,
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

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  try {
    publish({
      progress: loadLocalProgressV2(window.localStorage),
      hydrated: true,
      persistenceUnavailable: false,
    });
  } catch {
    publish({ ...snapshot, hydrated: true, persistenceUnavailable: true });
  }
}

export function LearningProgressProvider() {
  useEffect(() => {
    hydrateFromStorage();
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key === LOCAL_PROGRESS_V2_STORAGE_KEY || event.key === null) {
        hydrateFromStorage();
      }
    };
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

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
  let next = snapshot.progress;
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
  publish({ ...snapshot, progress, hydrated: true });
}
