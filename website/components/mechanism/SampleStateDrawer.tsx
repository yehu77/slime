"use client";

import { useEffect, useRef } from "react";

import type { SampleToGenerationState } from "../../core/sample-to-generation";

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
            <h2 id="mechanism-drawer-title">{sampleId} 当前留下了什么</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            关闭
          </button>
        </header>

        <p className="mechanism-drawer-intro">
          这里只比较当前观察点与前一观察点。浅色字段保持不变，标记为“本步写入”的字段才属于当前边界。
        </p>

        {sample ? (
          <dl className="mechanism-state-fields">
            {fieldOrder.map((field) => {
              const currentValue = sample[field];
              const previousValue = previousSample?.[field];
              const changed =
                !previousSample ||
                JSON.stringify(currentValue) !== JSON.stringify(previousValue);
              return (
                <div className={changed ? "is-changed" : ""} key={field}>
                  <dt>{field}</dt>
                  <dd>{formatValue(currentValue)}</dd>
                  <small>{changed ? "本步写入" : "保持不变"}</small>
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
