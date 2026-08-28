"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  checkJourneyInvariants,
  materializeJourneyFixture,
  materializeJourneyStates,
  math2x2Fixture,
  seekJourney,
} from "../../core/journey";
import { sampleJourneyMessages } from "../../content/zh";
import { SampleMicroscope } from "./SampleMicroscope";
import type { JourneyLayer, TimelineMode } from "./types";

const fixture = materializeJourneyFixture(math2x2Fixture, sampleJourneyMessages);

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

const actLabels = [
  "构造",
  "分组",
  "生成",
  "评价与收集",
  "转换与排程",
  "训练",
  "权重发布",
] as const;

const actImages: Record<number, { src: string; alt: string }> = {
  1: { src: "/art/library-act-01-v1.webp", alt: "图书馆书桌上的资料与记录" },
  2: { src: "/art/library-act-02-v1.webp?v=2", alt: "镜面中同源但彼此独立的倒影" },
  3: { src: "/art/library-act-03-v1.webp", alt: "多屏控制台前的生成观察现场" },
  4: { src: "/art/library-act-04-v1.webp?v=2", alt: "实验室中的评价记录与天平" },
  5: { src: "/art/library-act-05-v1.webp", alt: "纵横线路构成的数据转换边界" },
  6: { src: "/art/library-act-06-v1.webp?v=2", alt: "齿轮与钟芯后的训练过程" },
  7: { src: "/art/library-act-07-v1.webp", alt: "通向远方城市的权重发布路径" },
};

type TraceLocation = {
  eventId: string;
  sampleId: string;
  timelineMode: TimelineMode;
};

type SampleTraceLabProps = {
  initialEventId?: string;
  initialSampleId?: string;
  initialTimelineMode?: TimelineMode;
  onLocationChange: (location: TraceLocation) => void;
};

function changedFieldLabel(path: string) {
  return path.replace(/^\//, "");
}

export function SampleTraceLab({
  initialEventId,
  initialSampleId = "a0",
  initialTimelineMode = "sync",
  onLocationChange,
}: SampleTraceLabProps) {
  const safeSampleId = fixture.initial_samples[initialSampleId] ? initialSampleId : "a0";
  const safeEventId = fixture.events.some((event) => event.id === initialEventId)
    ? initialEventId ?? fixture.events[0].id
    : fixture.events[0].id;
  const state = useMemo(() => seekJourney(fixture, safeEventId, safeSampleId), [safeEventId, safeSampleId]);
  const [playing, setPlaying] = useState(false);
  const timelineMode = initialTimelineMode;
  const [layer, setLayer] = useState<JourneyLayer>("raw");
  const [microscopeOpen, setMicroscopeOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const selectedSample = state.raw_samples[state.selected_sample_id];
  const image = actImages[state.act];
  const invariants = useMemo(() => checkJourneyInvariants(state), [state]);
  const history = useMemo(
    () =>
      materializeJourneyStates(fixture, state.selected_sample_id)
        .slice(0, state.event_index + 1)
        .flatMap((eventState) =>
          eventState.changed_fields
            .filter((change) => change.sample_id === state.selected_sample_id)
            .map((change) => ({
              eventId: eventState.event_id,
              eventTitle: eventState.title,
              actor: eventState.actor,
              path: change.path,
              before: change.before,
              after: change.after,
            })),
        ),
    [state.event_index, state.selected_sample_id],
  );

  const move = (type: "previous" | "next") => {
    const offset = type === "previous" ? -1 : 1;
    const target = fixture.events[state.event_index + offset];
    if (!target) return;
    onLocationChange({ eventId: target.id, sampleId: state.selected_sample_id, timelineMode });
  };

  const seek = (eventId: string) => {
    setPlaying(false);
    onLocationChange({ eventId, sampleId: state.selected_sample_id, timelineMode });
  };

  useEffect(() => {
    if (!playing || state.event_index >= fixture.events.length - 1) return;
    const timer = window.setTimeout(() => {
      const target = fixture.events[state.event_index + 1];
      if (target) onLocationChange({ eventId: target.id, sampleId: state.selected_sample_id, timelineMode });
    }, 1450);
    return () => window.clearTimeout(timer);
  }, [onLocationChange, playing, state.event_index, state.selected_sample_id, timelineMode]);

  useEffect(() => {
    if (playing && state.event_index >= fixture.events.length - 1) {
      window.queueMicrotask(() => setPlaying(false));
    }
  }, [playing, state.event_index]);

  useEffect(() => {
    if (!microscopeOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "summary",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const previousOverflow = document.body.style.overflow;
    const returnFocus = triggerRef.current;
    document.body.style.overflow = "hidden";
    const items = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const frame = window.requestAnimationFrame(() => (
      dialog.querySelector<HTMLElement>(".system-trace-drawer > header button") ?? items()[0] ?? dialog
    ).focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMicroscopeOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = items();
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      returnFocus?.focus();
    };
  }, [microscopeOpen]);

  return (
    <div className="system-trace-lab">
      <div className="system-trace-strip" aria-label="七站 Sample 观测路径">
        {actLabels.map((label, index) => {
          const act = index + 1;
          const event = fixture.events.find((candidate) => candidate.act === act);
          return (
            <button
              aria-current={state.act === act ? "step" : undefined}
              className={state.act === act ? "is-current" : state.act > act ? "is-past" : ""}
              key={label}
              onClick={() => event && seek(event.id)}
              type="button"
            >
              <span>{String(act).padStart(2, "0")}</span>
              <strong>{label}</strong>
            </button>
          );
        })}
      </div>

      <div className="system-trace-stage">
        <figure className="system-trace-cel">
          <picture>
            <img alt={image.alt} height="900" loading="lazy" src={image.src} width="1600" />
          </picture>
          <figcaption>
            <span>ACT {String(state.act).padStart(2, "0")} / {actorLabels[state.actor]}</span>
            <strong>{state.title}</strong>
          </figcaption>
        </figure>

        <article className="system-trace-report" aria-live="polite">
          <div className="system-trace-version">
            <span>ROLLOUT</span>
            <strong>{state.system.rollout_version}</strong>
            <i aria-hidden="true" />
            <span>ACTOR</span>
            <strong>{state.system.actor_version}</strong>
          </div>
          <p>{state.narration}</p>
          <dl>
            <div>
              <dt>读取</dt>
              <dd>{state.event_index === 0 ? "外部记录与 Sample 默认值" : "上一个边界留下的状态"}</dd>
            </div>
            <div>
              <dt>产生</dt>
              <dd>
                {state.changed_fields.length
                  ? state.changed_fields.slice(0, 4).map((change) => changedFieldLabel(change.path)).join(" · ")
                  : state.system.raw_samples_frozen ? "独立系统状态" : "当前边界无字段 patch"}
              </dd>
            </div>
            <div>
              <dt>交给</dt>
              <dd>{state.event_index < fixture.events.length - 1 ? actorLabels[fixture.events[state.event_index + 1].actor] : "下一轮 DataSource"}</dd>
            </div>
          </dl>
          <div className="system-trace-controls">
            <button disabled={state.event_index === 0} onClick={() => move("previous")} type="button">上一个事件</button>
            <button className="is-primary" onClick={() => setPlaying((current) => !current)} type="button">
              {playing ? "暂停 trace" : "播放 trace"}
            </button>
            <button disabled={state.event_index === fixture.events.length - 1} onClick={() => move("next")} type="button">下一个事件</button>
          </div>
          <label className="system-trace-scrubber">
            <span>事件 {state.event_index + 1}/{fixture.events.length}</span>
            <input
              aria-label="选择 trace 事件"
              max={fixture.events.length - 1}
              min={0}
              onChange={(event) => seek(fixture.events[Number(event.currentTarget.value)].id)}
              type="range"
              value={state.event_index}
            />
          </label>
          <div className="system-trace-settings">
            <label>
              <span>观察 Sample</span>
              <select
                onChange={(event) => onLocationChange({
                  eventId: state.event_id,
                  sampleId: event.currentTarget.value,
                  timelineMode,
                })}
                value={state.selected_sample_id}
              >
                {Object.keys(state.raw_samples).map((sampleId) => <option key={sampleId}>{sampleId}</option>)}
              </select>
            </label>
            <label>
              <span>时间线</span>
              <select onChange={(event) => onLocationChange({
                eventId: state.event_id,
                sampleId: state.selected_sample_id,
                timelineMode: event.currentTarget.value as TimelineMode,
              })} value={timelineMode}>
                <option value="sync">同步</option>
                <option value="async">异步</option>
              </select>
            </label>
            <button ref={triggerRef} onClick={() => setMicroscopeOpen(true)} type="button">打开 Sample 显微镜</button>
          </div>
        </article>
      </div>

      {microscopeOpen ? createPortal(
        <dialog
          aria-label="Sample 显微镜"
          className="system-intro system-trace-drawer-layer"
          onCancel={(event) => { event.preventDefault(); setMicroscopeOpen(false); }}
          ref={dialogRef}
        >
          <button
            aria-label="关闭 Sample 显微镜"
            className="system-trace-drawer-backdrop"
            onClick={() => setMicroscopeOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <section className="system-trace-drawer" tabIndex={-1}>
            <header>
              <div><strong>透写台</strong><span>当前事件 · {state.title}</span></div>
              <button onClick={() => setMicroscopeOpen(false)} type="button">关闭</button>
            </header>
            <SampleMicroscope
              currentChanges={state.changed_fields}
              derived={state.derived}
              displayLabel={state.selected_sample_id}
              frozen={state.system.raw_samples_frozen}
              history={history}
              invariants={invariants}
              layer={layer}
              onLayerChange={setLayer}
              sample={selectedSample}
              sampleId={state.selected_sample_id}
              system={state.system}
              vocabulary={fixture.vocabulary}
            />
          </section>
        </dialog>,
        document.body,
      ) : null}
    </div>
  );
}

export { fixture as sampleTraceFixture };
