"use client";

import type {
  InvariantResult,
  JourneyState,
  SampleSnapshot,
} from "../../core/journey";
import type { JourneyLayer } from "./types";

type ChangeHistoryItem = {
  eventId: string;
  eventTitle: string;
  actor: string;
  path: string;
  before: unknown;
  after: unknown;
};

type SampleMicroscopeProps = {
  sampleId: string;
  displayLabel?: string;
  sample?: SampleSnapshot;
  layer: JourneyLayer;
  derived: JourneyState["derived"];
  system: JourneyState["system"];
  vocabulary: readonly { id: number; piece: string }[];
  invariants: readonly InvariantResult[];
  currentChanges: JourneyState["changed_fields"];
  history: readonly ChangeHistoryItem[];
  frozen: boolean;
  onLayerChange: (layer: JourneyLayer) => void;
};

const actorLabels: Record<string, string> = {
  dataset: "Dataset",
  data_source: "DataSource",
  router: "Router",
  sglang: "SGLang",
  reward: "Reward → collect",
  rollout_manager: "RolloutManager",
  scheduler: "DP scheduler",
  actor: "Megatron actor",
  weight_sync: "Weight Sync",
};

function displayValue(value: unknown): string {
  if (value === null) return "None";
  if (value === undefined) return "不属于当前对象";
  if (typeof value === "string") return value === "" ? "空字符串" : value;
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : "[]";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function FieldRow({
  name,
  value,
  changed,
}: {
  name: string;
  value: unknown;
  changed?: { before: unknown; after: unknown };
}) {
  return (
    <div className={`journey-field-row ${changed ? "is-changed" : ""}`}>
      <dt><code>{name}</code></dt>
      <dd>
        <code>{displayValue(value)}</code>
        {changed ? (
          <small>
            <span className="journey-before">原 {displayValue(changed.before)}</span>
            <span aria-hidden="true"> → </span>
            <span className="journey-after">现 {displayValue(changed.after)}</span>
          </small>
        ) : null}
      </dd>
    </div>
  );
}

export function SampleMicroscope({
  sampleId,
  displayLabel,
  sample,
  layer,
  derived,
  system,
  vocabulary,
  invariants,
  currentChanges,
  history,
  frozen,
  onLayerChange,
}: SampleMicroscopeProps) {
  if (!sample) {
    return (
      <aside className="journey-microscope" aria-labelledby="microscope-title">
        <h2 id="microscope-title">Sample 显微镜</h2>
        <p>当前阶段还没有可观察的 Sample。先从 Dataset 行开始。</p>
      </aside>
    );
  }

  const currentChangeFor = (field: string) => {
    const change = currentChanges.find(
      (item) => item.sample_id === sampleId && item.path.replace(/^\//, "") === field,
    );
    return change ? { before: change.before, after: change.after } : undefined;
  };
  const promptLength = Math.max(0, sample.tokens.length - sample.response_length);
  const vocabularyById = new Map(vocabulary.map((token) => [token.id, token.piece]));
  const relevantInvariants = invariants.filter(
    (invariant) => !invariant.sample_id || invariant.sample_id === sampleId,
  );

  return (
    <aside className="journey-microscope" aria-labelledby="microscope-title">
      <div className="journey-microscope-heading">
        <div>
          <p className="journey-eyebrow">持续观察</p>
          <h2 id="microscope-title">Sample 显微镜</h2>
        </div>
        <span className="journey-sample-id">{displayLabel ?? sampleId}</span>
      </div>

      <div className="journey-layer-tabs" role="tablist" aria-label="对象层级">
        {(["raw", "derived", "system"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={layer === item}
            onClick={() => onLayerChange(item)}
          >
            {item === "raw" ? "Raw Sample" : item === "derived" ? "Derived data" : "System state"}
          </button>
        ))}
      </div>

      {layer === "raw" ? (
        <div className="journey-microscope-panel" role="tabpanel">
          {frozen ? (
            <div className="journey-boundary-note">
              <strong>边界已跨越</strong>
              <span>Raw Sample 在这里冻结；后续训练改变 actor，不回写这张卡。</span>
            </div>
          ) : null}

          <details open>
            <summary>身份与生命周期</summary>
            <dl>
              <FieldRow name="group_index" value={sample.group_index} changed={currentChangeFor("group_index")} />
              <FieldRow name="index" value={sample.index} changed={currentChangeFor("index")} />
              <FieldRow name="rollout_id" value={sample.rollout_id} changed={currentChangeFor("rollout_id")} />
              <FieldRow name="session_id" value={sample.session_id} changed={currentChangeFor("session_id")} />
              <FieldRow name="status" value={sample.status} changed={currentChangeFor("status")} />
            </dl>
          </details>

          <details>
            <summary>输入</summary>
            <dl>
              <FieldRow name="prompt" value={sample.prompt} />
              <FieldRow name="label" value={sample.label} />
              <FieldRow name="metadata" value={sample.metadata} />
            </dl>
          </details>

          <details open>
            <summary>生成</summary>
            <dl>
              <FieldRow name="tokens" value={sample.tokens} changed={currentChangeFor("tokens")} />
              <FieldRow name="response" value={sample.response} changed={currentChangeFor("response")} />
              <FieldRow name="response_length" value={sample.response_length} changed={currentChangeFor("response_length")} />
              <FieldRow name="loss_mask" value={sample.loss_mask} changed={currentChangeFor("loss_mask")} />
              <FieldRow name="rollout_log_probs" value={sample.rollout_log_probs} changed={currentChangeFor("rollout_log_probs")} />
              <FieldRow name="weight_versions" value={sample.weight_versions} changed={currentChangeFor("weight_versions")} />
            </dl>
          </details>

          <div className="journey-token-inspector">
            <div>
              <h3>Token 对齐</h3>
              <span>{sample.tokens.length} total · {sample.response_length} response</span>
            </div>
            {sample.tokens.length ? (
              <ol aria-label="Token 序列">
                {sample.tokens.map((tokenId, index) => {
                  const isPrompt = index < promptLength;
                  const responseIndex = index - promptLength;
                  const mask = isPrompt ? null : sample.loss_mask?.[responseIndex] ?? null;
                  const logProb = isPrompt ? null : sample.rollout_log_probs?.[responseIndex] ?? null;
                  return (
                    <li
                      className={isPrompt ? "is-prompt" : mask === 0 ? "is-observation" : "is-action"}
                      key={`${tokenId}-${index}`}
                    >
                      <span>{vocabularyById.get(tokenId) ?? `#${tokenId}`}</span>
                      <small>
                        id {tokenId} · {isPrompt ? "prompt" : `mask ${mask ?? "None"}`}
                      </small>
                      {!isPrompt ? <small>log p {logProb ?? "None"}</small> : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="journey-empty-value">尚未 tokenize：<code>tokens=[]</code></p>
            )}
            {sample.weight_versions.length ? (
              <p className="journey-segment-tag">生成片段版本：{sample.weight_versions.join(" → ")}</p>
            ) : null}
          </div>

          <details open>
            <summary>训练控制</summary>
            <dl>
              <FieldRow name="reward" value={sample.reward} changed={currentChangeFor("reward")} />
              <FieldRow name="remove_sample" value={sample.remove_sample} changed={currentChangeFor("remove_sample")} />
              <FieldRow name="train_metadata" value={sample.train_metadata} />
            </dl>
          </details>

          <details className="journey-history">
            <summary>变更历史（{history.length}）</summary>
            {history.length ? (
              <ol>
                {history.map((item, index) => (
                  <li key={`${item.eventId}-${item.path}-${index}`}>
                    <span>{actorLabels[item.actor] ?? item.actor}</span>
                    <strong>{item.path.replace(/^\//, "")}</strong>
                    <small>{displayValue(item.before)} → {displayValue(item.after)}</small>
                    <em>{item.eventTitle}</em>
                  </li>
                ))}
              </ol>
            ) : <p>当前还没有字段 patch。</p>}
          </details>
        </div>
      ) : null}

      {layer === "derived" ? (
        <div className="journey-microscope-panel" role="tabpanel">
          <div className="journey-object-label">
            <strong>派生训练数据</strong>
            <span>这些值不是 Raw Sample 字段。</span>
          </div>
          {derived.train_data ? (
            <dl>
              <FieldRow name="sample_ids" value={derived.train_data.sample_ids} />
              <FieldRow name="raw_reward" value={derived.train_data.raw_reward} />
              <FieldRow name="rewards" value={derived.train_data.rewards} />
              <FieldRow name="rollout_ids" value={derived.train_data.rollout_ids} />
              <FieldRow name="rollout_mask_sums" value={derived.train_data.rollout_mask_sums} />
              <FieldRow name="sample_indices" value={derived.train_data.sample_indices} />
            </dl>
          ) : (
            <p className="journey-empty-value">第五幕之前，派生 train data 尚不存在。</p>
          )}
          {derived.schedule ? (
            <div className="journey-mini-schedule">
              <h3>Training schedule</h3>
              <ol>
                {derived.schedule.steps.map((step) => (
                  <li key={step.step_index}>
                    <strong>step {step.step_index + 1}</strong>
                    <span>{step.sample_ids.join(" · ")}</span>
                    <small>rollout IDs {step.rollout_ids.join(", ")}</small>
                  </li>
                ))}
              </ol>
              <p>{derived.schedule.used_rollouts} used · {derived.schedule.trimmed_rollouts} trimmed</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {layer === "system" ? (
        <div className="journey-microscope-panel" role="tabpanel">
          <div className="journey-object-label">
            <strong>系统状态</strong>
            <span>它描述 actor 与 rollout engine，不属于任意 Sample。</span>
          </div>
          <dl>
            <FieldRow name="actor_version" value={system.actor_version} />
            <FieldRow name="rollout_version" value={system.rollout_version} />
            <FieldRow name="actor_training_state" value={system.actor_training_state} />
            <FieldRow name="weights_published" value={system.weights_published} />
            <FieldRow name="next_cycle_ready" value={system.next_cycle_ready} />
            <FieldRow name="raw_samples_frozen" value={system.raw_samples_frozen} />
          </dl>
        </div>
      ) : null}

      <div className="journey-invariants" id="sample-invariants">
        <h3>实时 contracts</h3>
        <ul>
          {relevantInvariants.map((invariant) => (
            <li className={`is-${invariant.status}`} key={invariant.id}>
              <span aria-hidden="true">{invariant.status === "pass" ? "✓" : invariant.status === "fail" ? "!" : "○"}</span>
              <span>{invariant.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
