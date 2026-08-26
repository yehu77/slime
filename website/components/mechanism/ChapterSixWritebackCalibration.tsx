"use client";

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterSixWritebackChapter } from "./chapter-reader-contracts";
import "./chapter-six-writeback-calibration.css";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type ChapterSixWritebackCalibrationProps = {
  chapter: ChapterSixWritebackChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

const spaceLabels = {
  "full-sequence": "完整序列",
  response: "回答坐标",
  text: "文本累计",
  terminal: "终止记录",
  "outside-course": "本课边界外",
} as const;

const boundaryLabels = {
  preflight: "修改前拒绝",
  "late-validation": "修改后才可能发现",
  "course-reducer": "课程模拟保护",
} as const;

function WritebackEvidence({ evidenceId }: { evidenceId: string }) {
  const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
  if (!evidence) return null;
  const anchor = sourceAnchors.find((item) => item.id === evidence.sourceRefId);
  return (
    <GuidedSourceExcerpt
      evidence={evidence}
      sourceUrl={anchor?.url}
      symbol={anchor?.symbol}
      code={anchor?.guided_excerpt?.code}
      lineStart={anchor?.guided_excerpt?.start_line}
    />
  );
}

function nextStepIndex(eventKey: string, currentIndex: number, length: number): number | null {
  if (eventKey === "Home") return 0;
  if (eventKey === "End") return length - 1;
  if (eventKey === "ArrowDown" || eventKey === "ArrowRight") return Math.min(length - 1, currentIndex + 1);
  if (eventKey === "ArrowUp" || eventKey === "ArrowLeft") return Math.max(0, currentIndex - 1);
  return null;
}

export function ChapterSixWritebackCalibration({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
}: ChapterSixWritebackCalibrationProps) {
  const fixture = chapter.writebackFixture;
  const calibrationRef = useRef<HTMLElement>(null);
  const [activeStepId, setActiveStepId] = useState(
    chapter.writebackCalibrationSteps[0]?.id ?? "",
  );
  const [predictionRevealed, setPredictionRevealed] = useState(false);
  const activeStepIndex = chapter.writebackCalibrationSteps.findIndex(
    (step) => step.id === activeStepId,
  );
  const activeStep = useMemo(
    () =>
      chapter.writebackCalibrationSteps[activeStepIndex] ??
      chapter.writebackCalibrationSteps[0],
    [activeStepIndex, chapter.writebackCalibrationSteps],
  );
  const responseHasEnteredSequence = activeStepIndex >= 3;
  const responseMetadataWritten = activeStepIndex >= 4;
  const terminalApplied = activeStepIndex >= 5;

  const moveStepFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const nextIndex = nextStepIndex(
      event.key,
      currentIndex,
      chapter.writebackCalibrationSteps.length,
    );
    if (nextIndex === null) return;
    event.preventDefault();
    const next = event.currentTarget
      .closest("ol")
      ?.querySelectorAll<HTMLButtonElement>("button[data-writeback-step]")[nextIndex];
    next?.focus();
    next?.click();
  };

  const selectStep = (index: number) => {
    const next = chapter.writebackCalibrationSteps[index];
    if (next) setActiveStepId(next.id);
  };

  const scrollToCalibration = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    calibrationRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <article className="writeback-reader" aria-labelledby="mechanism-chapter-title">
      <header className="writeback-opening">
        <div className="writeback-opening-copy">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>
            {chapter.title}
          </h1>
          <p className="writeback-opening-subtitle">
            同一次回答，要在两套 token 坐标中同时成立
          </p>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <div className="writeback-opening-equations" aria-label="a0 写回后的关键长度">
            <p><code>len(tokens)</code><strong>5 + 1 = 6</strong></p>
            <p><code>response_length</code><strong>1</strong></p>
            <p><code>len(mask) = len(logp)</code><strong>1</strong></p>
          </div>
          <div className="writeback-opening-actions">
            <button
              className="mechanism-action"
              type="button"
              onClick={scrollToCalibration}
            >
              开始逐行校准
            </button>
            <button
              className="mechanism-state-trigger"
              ref={triggerRef}
              type="button"
              onClick={onOpenDrawer}
            >
              打开 a0 写回账本
            </button>
          </div>
        </div>
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>CH.06 · APPEND_RESPONSE_TOKENS · 06FFDBE2</figcaption>
        </figure>
      </header>

      <section className="writeback-handoff" aria-labelledby="writeback-handoff-title">
        <header>
          <h2 id="writeback-handoff-title">第五章交来的不是答案判决，而是一组方法实参</h2>
          <p>{chapter.objective}</p>
        </header>
        <pre><code>{`sample.append_response_tokens(
    tokens=[25],
    log_probs=[-0.356675],
    trainable=True,
    meta_info={
        "finish_reason": {"type": "stop"},
        "weight_version": "actor@0",
    },
    text="5",
)`}</code></pre>
        <dl>
          <div><dt>对象</dt><dd><code>{fixture.sampleId}</code></dd></div>
          <div><dt>起点</dt><dd><code>{fixture.fromObservation}</code></dd></div>
          <div><dt>终点</dt><dd><code>{fixture.toObservation}</code></dd></div>
          <div><dt>主路径</dt><dd><code>trainable=True</code></dd></div>
        </dl>
      </section>

      <section
        className="writeback-calibration"
        id="writeback-calibration"
        aria-labelledby="writeback-calibration-title"
        ref={calibrationRef}
      >
        <header>
          <h2 id="writeback-calibration-title">一根源码游标，同时校准两只时钟</h2>
          <p>
            左侧严格按固定源码顺序移动；右侧始终保留完整序列与回答坐标。方向键、Home、End
            可以移动当前步骤；双时钟和后文契约总账始终保留，步骤切换只改变当前源码行的强调。
          </p>
        </header>

        <div className="writeback-calibration-bench">
          <ol className="writeback-score" aria-label="append_response_tokens 七步执行顺序">
            {chapter.writebackCalibrationSteps.map((step, index) => {
              const active = step.id === activeStep?.id;
              return (
                <li className={active ? "is-active" : ""} key={step.id}>
                  <button
                    aria-pressed={active}
                    data-writeback-step
                    type="button"
                    onClick={() => setActiveStepId(step.id)}
                    onFocus={() => setActiveStepId(step.id)}
                    onKeyDown={(event) => moveStepFocus(event, index)}
                  >
                    <span>{String(step.order).padStart(2, "0")}</span>
                    <strong>{step.title}</strong>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="writeback-stage" aria-live="polite">
            <p className="writeback-stage-source"><code>{activeStep?.sourceOperation}</code></p>
            <div className="writeback-stage-read">
              <h3>本步读取</h3>
              <ul>{activeStep?.reads.map((item) => <li key={item}><code>{item}</code></li>)}</ul>
            </div>
            <div className="writeback-stage-write">
              <h3>本步字段变化</h3>
              {activeStep?.writes.length ? (
                <dl>
                  {activeStep.writes.map((write) => (
                    <div key={write.field}>
                      <dt><code>{write.field}</code></dt>
                      <dd><del>{write.before}</del><ins>{write.after}</ins></dd>
                    </div>
                  ))}
                </dl>
              ) : <p>无字段改变。</p>}
            </div>
            <div className="writeback-stage-proof">
              <div><h3>已经证明</h3><p>{activeStep?.proves}</p></div>
              <div><h3>仍不能推出</h3><p>{activeStep?.doesNotProve}</p></div>
            </div>
          </div>

          <div className="writeback-clocks" aria-label="完整序列与回答坐标对照">
            <div className="writeback-clock writeback-clock--full">
              <header><strong>完整序列时钟</strong><code>tokens[0..5]</code></header>
              <ol>
                {fixture.before.tokens.map((token, index) => (
                  <li key={`${token}-${index}`}>
                    <span>P{index}</span><strong>{token}</strong><small>tokens[{index}]</small>
                  </li>
                ))}
                <li className={responseHasEnteredSequence ? "is-written" : "is-waiting"}>
                  <span>R0</span><strong>{responseHasEnteredSequence ? fixture.incoming.tokens[0] : "—"}</strong><small>tokens[5]</small>
                </li>
              </ol>
            </div>
            <div className="writeback-registration" aria-hidden="true"><span /></div>
            <div className="writeback-clock writeback-clock--response">
              <header><strong>回答时钟</strong><code>r ∈ [0, response_length)</code></header>
              <div className="writeback-response-origin" aria-hidden="true">prompt 不占回答坐标</div>
              <ol>
                <li className={responseHasEnteredSequence ? "is-written" : "is-waiting"}>
                  <span>R0</span>
                  <dl>
                    <div><dt>token</dt><dd>{responseHasEnteredSequence ? "25" : "—"}</dd></div>
                    <div><dt>mask</dt><dd>{responseHasEnteredSequence ? "1" : "—"}</dd></div>
                    <div><dt>logp</dt><dd>{responseMetadataWritten ? "-0.356675" : "—"}</dd></div>
                  </dl>
                </li>
              </ol>
            </div>
            <dl className="writeback-terminal-stamp">
              <div><dt>status</dt><dd>{terminalApplied ? "completed" : "pending"}</dd></div>
              <div><dt>weight_versions</dt><dd>{terminalApplied ? "[actor@0]" : "[]"}</dd></div>
              <div><dt>reward</dt><dd>None</dd></div>
            </dl>
          </div>
        </div>

        <div className="writeback-step-controls">
          <button
            type="button"
            disabled={activeStepIndex <= 0}
            onClick={() => selectStep(activeStepIndex - 1)}
          >
            上一步
          </button>
          <p role="status">当前第 {activeStep?.order} / {chapter.writebackCalibrationSteps.length} 步：{activeStep?.title}</p>
          <button
            className="mechanism-action"
            type="button"
            disabled={activeStepIndex >= chapter.writebackCalibrationSteps.length - 1}
            onClick={() => selectStep(activeStepIndex + 1)}
          >
            执行下一步
          </button>
        </div>
      </section>

      <section className="writeback-ledger" aria-labelledby="writeback-ledger-title">
        <header>
          <h2 id="writeback-ledger-title">契约总账：字段相邻，不代表使用同一坐标</h2>
          <p>这里把本 fixture 的数值、生产不变量与限制条件放在同一行；后两列决定这条结论可以被推广到哪里。</p>
        </header>
        <div className="writeback-ledger-table">
          <div className="writeback-ledger-head" aria-hidden="true">
            <span>字段 / 坐标</span><span>before</span><span>incoming</span><span>after</span><span>索引与边界</span>
          </div>
          {chapter.writebackCoordinateRows.map((row) => (
            <article key={row.id}>
              <div className="writeback-ledger-field">
                <strong><code>{row.field}</code></strong>
                <span>{spaceLabels[row.coordinateSpace]}</span>
              </div>
              <dl>
                <div><dt>before</dt><dd><code>{row.before}</code></dd></div>
                <div><dt>incoming</dt><dd><code>{row.incoming}</code></dd></div>
                <div><dt>after</dt><dd><code>{row.after}</code></dd></div>
              </dl>
              <div className="writeback-ledger-rule">
                <p><strong>索引规则</strong>{row.indexRule}</p>
                <p><strong>生产不变量</strong>{row.invariant}</p>
                <p><strong>限制</strong>{row.caveat}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="writeback-terminal" aria-labelledby="writeback-terminal-title">
        <header>
          <h2 id="writeback-terminal-title">终止类型只回答“怎样结束”</h2>
          <p>weight version 与 status 共用 terminal gate，但它们都不比较 label，也不计算 reward。</p>
        </header>
        <ol>
          {chapter.writebackTerminalCases.map((item) => (
            <li key={item.id}>
              <code>{item.incoming}</code>
              <dl>
                <div><dt>status</dt><dd>{item.statusAfter}</dd></div>
                <div><dt>weight_versions</dt><dd>{item.weightVersionAfter}</dd></div>
              </dl>
              <p>{item.reason}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="writeback-failures" aria-labelledby="writeback-failures-title">
        <header>
          <h2 id="writeback-failures-title">失败发生在哪一行，决定能否假设对象未变</h2>
          <p>生产 Sample 写回是原地 mutation；这张时间表把它与课程 reducer 的 copy-on-write 观察保证严格分开。</p>
        </header>
        <ol>
          {chapter.writebackFailureBoundaries.map((item) => (
            <li className={`is-${item.boundary}`} key={item.id}>
              <span>{boundaryLabels[item.boundary]}</span>
              <h3>{item.title}</h3>
              <code>{item.condition}</code>
              <p><strong>对象状态：</strong>{item.sampleMutation}</p>
              <p>{item.explanation}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="writeback-sources" aria-labelledby="writeback-sources-title">
        <header>
          <h2 id="writeback-sources-title">先核对双时钟怎样被原地推进</h2>
          <p>主路径常显最关键的坐标写入；preflight、terminal gate 与末尾 validator 保留在同页深入证据中。</p>
        </header>
        <WritebackEvidence evidenceId="evidence-writeback-core" />
        <details className="writeback-source-aside writeback-source-bundle">
          <summary>深入核对：preflight、terminal gate 与 late validator（三段）</summary>
          <WritebackEvidence evidenceId="evidence-writeback-preflight" />
          <WritebackEvidence evidenceId="evidence-writeback-terminal" />
          <WritebackEvidence evidenceId="evidence-writeback-length-defense" />
        </details>
        <details className="writeback-source-aside">
          <summary>继续核对 top-p replay 的 ragged offsets</summary>
          <WritebackEvidence evidenceId="evidence-writeback-top-p" />
          <p>
            routed experts 在同一个 <code>_apply_meta_info</code> 中处理，却按完整 token
            序列的 next-token transition rows 校验；它不属于上述 response-space 一维数组。
          </p>
        </details>
      </section>

      <section className="writeback-prediction" aria-labelledby="writeback-prediction-title">
        <div>
          <h2 id="writeback-prediction-title">迁移预测：把时钟拨到两枚 response token</h2>
          <p>
            prompt 有 4 个 token；追加 2 个 trainable token，携带 2 个 log-prob，
            <code>finish_reason.type=length</code>。先在纸上写出六个结果，再揭晓。
          </p>
        </div>
        <button type="button" onClick={() => setPredictionRevealed((value) => !value)}>
          {predictionRevealed ? "收起校准结果" : "揭晓校准结果"}
        </button>
        {predictionRevealed ? (
          <dl>
            <div><dt><code>len(tokens)</code></dt><dd>6</dd></div>
            <div><dt><code>response_length</code></dt><dd>2</dd></div>
            <div><dt><code>len(loss_mask)</code></dt><dd>2</dd></div>
            <div><dt><code>len(rollout_log_probs)</code></dt><dd>2</dd></div>
            <div><dt><code>status</code></dt><dd>truncated</dd></div>
            <div><dt><code>reward</code></dt><dd>None</dd></div>
          </dl>
        ) : null}
      </section>

      {passed ? <p className="writeback-passed-note">本章坐标练习已经通过；你仍可重新归档。</p> : null}
      {exerciseSlot}

      <section className="writeback-correction" aria-labelledby="writeback-correction-title">
        <h2 id="writeback-correction-title">最后校正：对齐不等于原子，completed 也不等于正确</h2>
        <p><del>{chapter.misconception.belief}</del></p>
        <p><strong>更准确的说法：</strong>{chapter.misconception.correction}</p>
        <details>
          <summary>{chapter.advancedAside?.title}</summary>
          <p>{chapter.advancedAside?.body}</p>
        </details>
      </section>

      <section className="writeback-memory" aria-labelledby="writeback-memory-title">
        <h2 id="writeback-memory-title">{chapter.takeaway}</h2>
        <p>{chapter.transition}</p>
        <dl>
          <div><dt>完整序列</dt><dd><code>tokens = prompt prefix + response suffix</code></dd></div>
          <div><dt>回答坐标</dt><dd><code>response_length ↔ mask ↔ log-probs</code></dd></div>
          <div><dt>失败时机</dt><dd><code>preflight ≠ late validation</code></dd></div>
        </dl>
      </section>

      <nav className="writeback-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>返回第五章：响应</button>
        <button className="mechanism-action" type="button" onClick={onNext}>进入终测</button>
      </nav>
    </article>
  );
}
