"use client";

import type { TimelineMode } from "./types";

type TimelineEvent = {
  id: string;
  phase: string;
  title: string;
};

type TimelineComparisonProps = {
  mode: TimelineMode;
  events: readonly TimelineEvent[];
  actorVersion: string;
  rolloutVersion: string;
  onModeChange: (mode: TimelineMode) => void;
  onSeek: (eventId: string) => void;
};

type TimelineBlock = {
  label: string;
  detail: string;
  kind: "rollout" | "train" | "sync" | "wait" | "barrier";
  phase?: string;
  span?: number;
};

const syncLanes: Array<{ name: string; blocks: TimelineBlock[] }> = [
  {
    name: "Rollout Manager",
    blocks: [
      { label: "收集 batch i", detail: "等待本轮生成完成", kind: "rollout", phase: "terminal", span: 2 },
      { label: "等待", detail: "训练边界", kind: "wait" },
      { label: "下一轮", detail: "进入 batch i+1", kind: "rollout", phase: "next_cycle_ready" },
    ],
  },
  {
    name: "SGLang rollout",
    blocks: [
      { label: "generate(i)", detail: "使用 actor@i", kind: "rollout", phase: "terminal", span: 2 },
      { label: "等待 / offload", detail: "不与训练重叠", kind: "wait" },
      { label: "generate(i+1)", detail: "使用 actor@i+1", kind: "rollout", phase: "next_cycle_ready" },
    ],
  },
  {
    name: "Megatron actor",
    blocks: [
      { label: "等待 rollout", detail: "同步顺序", kind: "wait", span: 2 },
      { label: "train(i)", detail: "optimizer step", kind: "train", phase: "trained" },
      { label: "等待下一批", detail: "actor@i+1", kind: "wait" },
    ],
  },
  {
    name: "Weight Sync",
    blocks: [
      { label: "等待", detail: "尚未发布", kind: "wait", span: 3 },
      { label: "publish", detail: "全部 engine 完成", kind: "sync", phase: "weights_synced" },
    ],
  },
];

const asyncLanes: Array<{ name: string; blocks: TimelineBlock[] }> = [
  {
    name: "Rollout Manager",
    blocks: [
      { label: "batch i", detail: "回收完成", kind: "rollout", phase: "terminal" },
      { label: "batch i+1", detail: "提前派发", kind: "rollout", span: 2 },
      { label: "barrier", detail: "等待在途请求", kind: "barrier" },
    ],
  },
  {
    name: "SGLang rollout",
    blocks: [
      { label: "generate(i)", detail: "actor@i", kind: "rollout", phase: "terminal" },
      { label: "generate(i+1)", detail: "仍可能是 actor@i", kind: "rollout", span: 2 },
      { label: "请求完成", detail: "才能换权重", kind: "barrier" },
    ],
  },
  {
    name: "Megatron actor",
    blocks: [
      { label: "等待 batch i", detail: "训练输入", kind: "wait" },
      { label: "train(i)", detail: "与 rollout(i+1) 重叠", kind: "train", span: 2, phase: "trained" },
      { label: "actor@i+1", detail: "等待发布", kind: "wait" },
    ],
  },
  {
    name: "Weight Sync",
    blocks: [
      { label: "尚未到边界", detail: "旧版本继续服务", kind: "wait", span: 3 },
      { label: "publish", detail: "barrier 后发布", kind: "sync", phase: "weights_synced" },
    ],
  },
];

export function TimelineComparison({
  mode,
  events,
  actorVersion,
  rolloutVersion,
  onModeChange,
  onSeek,
}: TimelineComparisonProps) {
  const lanes = mode === "sync" ? syncLanes : asyncLanes;
  const eventForPhase = (phase?: string) =>
    phase ? events.find((event) => event.phase === phase) : undefined;

  return (
    <section className="journey-lab-card journey-timeline" aria-labelledby="timeline-title">
      <div className="journey-lab-heading">
        <div>
          <p className="journey-eyebrow">第七幕实验</p>
          <h3 id="timeline-title">同一闭环，两种时间排列</h3>
          <p>块宽只表示教学顺序，不是性能 benchmark。</p>
        </div>
        <div className="journey-segmented" aria-label="时间线模式">
          <button
            type="button"
            aria-pressed={mode === "sync"}
            onClick={() => onModeChange("sync")}
          >
            同步
          </button>
          <button
            type="button"
            aria-pressed={mode === "async"}
            onClick={() => onModeChange("async")}
          >
            异步
          </button>
        </div>
      </div>

      <div className="journey-version-strip">
        <span>训练侧 <strong>{actorVersion}</strong></span>
        <span>推理侧 <strong>{rolloutVersion}</strong></span>
        <span className={actorVersion === rolloutVersion ? "is-aligned" : "is-stale"}>
          {actorVersion === rolloutVersion ? "版本已对齐" : "存在发布边界"}
        </span>
      </div>

      <div className="journey-timeline-grid" aria-label={`${mode === "sync" ? "同步" : "异步"}时间线示意`}>
        {lanes.map((lane) => (
          <div className="journey-timeline-lane" key={lane.name}>
            <strong className="journey-lane-name">{lane.name}</strong>
            <div className="journey-lane-track">
              {lane.blocks.map((block, index) => {
                const linkedEvent = eventForPhase(block.phase);
                const content = (
                  <>
                    <b>{block.label}</b>
                    <small>{block.detail}</small>
                  </>
                );
                const className = `journey-time-block journey-time-block--${block.kind}`;
                const style = { flexGrow: block.span ?? 1 };
                return linkedEvent ? (
                  <button
                    type="button"
                    className={className}
                    style={style}
                    title={`跳到：${linkedEvent.title}`}
                    onClick={() => onSeek(linkedEvent.id)}
                    key={`${lane.name}-${index}`}
                  >
                    {content}
                  </button>
                ) : (
                  <span className={className} style={style} key={`${lane.name}-${index}`}>
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="journey-timeline-reading">
        <h4>{mode === "sync" ? "同步阅读法" : "异步阅读法"}</h4>
        {mode === "sync" ? (
          <ol>
            <li>先完成 generate(i)，训练才能开始。</li>
            <li>optimizer step 生成新 actor，但还没有发布到 rollout engine。</li>
            <li>全部 engine 完成权重同步后，generate(i+1) 才使用新版本。</li>
          </ol>
        ) : (
          <ol>
            <li>generate(i+1) 与 train(i) 重叠，因此下一批仍可能记录旧版本。</li>
            <li>发布前先等待在途 generation 完成，不能在一次请求中途换 policy。</li>
            <li>历史 Sample 保留生成时的 weight version，不被后续同步改写。</li>
          </ol>
        )}
      </div>
    </section>
  );
}
