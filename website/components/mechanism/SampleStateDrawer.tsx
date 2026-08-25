"use client";

import { useEffect, useRef } from "react";

import type { SampleToGenerationState } from "../../core/sample-to-generation";
import type { SampleToGenerationObservationId } from "../../core/sample-to-generation";

type SampleStateDrawerProps = {
  state: SampleToGenerationState;
  previousState?: SampleToGenerationState;
  sampleId: string;
  onClose: () => void;
};

const fieldOrder = [
  "group_index",
  "index",
  "prompt",
  "tokens",
  "multimodal_inputs",
  "response",
  "response_length",
  "label",
  "reward",
  "loss_mask",
  "rollout_log_probs",
  "weight_versions",
  "status",
  "metadata",
  "train_metadata",
] as const;

type SampleField = (typeof fieldOrder)[number];

export type DrawerFieldProvenance =
  | "Dataset 显式传入"
  | "dataclass 默认值"
  | "保持不变"
  | "本步更新";

const datasetExplicitFields = new Set<SampleField>([
  "prompt",
  "label",
  "metadata",
  "multimodal_inputs",
]);

export function getDrawerFieldProvenance({
  observationId,
  field,
  currentValue,
  previousValue,
  hasPreviousSample,
}: {
  observationId: SampleToGenerationObservationId;
  field: SampleField;
  currentValue: unknown;
  previousValue: unknown;
  hasPreviousSample: boolean;
}): DrawerFieldProvenance {
  if (observationId === "samples-constructed") {
    return datasetExplicitFields.has(field) ? "Dataset 显式传入" : "dataclass 默认值";
  }
  if (!hasPreviousSample) return "本步更新";
  return JSON.stringify(currentValue) === JSON.stringify(previousValue)
    ? "保持不变"
    : "本步更新";
}

function viewSample(state: SampleToGenerationState, sampleId: string) {
  return state.samples[sampleId] ?? state.seed_samples["origin-a"] ?? null;
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value === "" ? '""' : JSON.stringify(value);
  if (typeof value === "undefined") return "尚未产生";
  return JSON.stringify(value);
}

export function SampleStateDrawer({
  state,
  previousState,
  sampleId,
  onClose,
}: SampleStateDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sample = viewSample(state, sampleId);
  const previousSample = previousState
    ? viewSample(previousState, sampleId)
    : null;

  useEffect(() => {
    const targets = [
      document.querySelector<HTMLElement>(".site-header"),
      document.querySelector<HTMLElement>(".site-footer"),
      document.querySelector<HTMLElement>(".mechanism-rail"),
      document.querySelector<HTMLElement>(".mechanism-course-content"),
    ].filter((target): target is HTMLElement => Boolean(target));
    targets.forEach((target) => target.setAttribute("inert", ""));
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      targets.forEach((target) => target.removeAttribute("inert"));
    };
  }, [onClose]);

  return (
    <div className="mechanism-drawer-layer" role="presentation">
      <button
        className="mechanism-drawer-scrim"
        type="button"
        aria-label="关闭 Sample 状态页"
        onClick={onClose}
      />
      <aside
        className="mechanism-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mechanism-drawer-title"
      >
        <header>
          <div>
            <span>Sample 状态页 · {state.observation_id}</span>
            <h2 id="mechanism-drawer-title">{sampleId} 的课程状态投影</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            关闭
          </button>
        </header>

        <p className="mechanism-drawer-intro">
          初始投影区分 Dataset 显式参数与 dataclass 默认值；后续观察点再区分保持不变与本步更新。本账本只列本课持续验证的字段，不冒充完整 Sample dataclass；完整定义请在本章“源码摘录”中核对。
        </p>

        {sample ? (
          <dl className="mechanism-state-fields">
            {fieldOrder.map((field) => {
              const currentValue = sample[field];
              const previousValue = previousSample?.[field];
              const provenance = getDrawerFieldProvenance({
                observationId: state.observation_id,
                field,
                currentValue,
                previousValue,
                hasPreviousSample: Boolean(previousSample),
              });
              const changed = provenance === "本步更新";
              return (
                <div className={changed ? "is-changed" : provenance === "Dataset 显式传入" ? "is-explicit" : ""} key={field}>
                  <dt>{field}</dt>
                  <dd>{formatValue(currentValue)}</dd>
                  <small>{provenance}</small>
                </div>
              );
            })}
          </dl>
        ) : (
          <div className="mechanism-drawer-empty">
            当前还只有 Dataset row，物理 Sample 尚未建立。进入下一观察点后再看字段账本。
          </div>
        )}

        {state.requests[sampleId] ? (
          <section className="mechanism-sidecar">
            <h3>请求 sidecar</h3>
            <pre><code>{JSON.stringify(state.requests[sampleId], null, 2)}</code></pre>
          </section>
        ) : null}

        {state.response_projections[sampleId] ? (
          <section className="mechanism-sidecar">
            <h3>响应最小投影</h3>
            <pre><code>{JSON.stringify(state.response_projections[sampleId], null, 2)}</code></pre>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
