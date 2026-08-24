"use client";

import { useState, type ReactNode, type RefObject } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterTwoProvenanceChapter } from "./chapter-reader-contracts";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type ChapterTwoProvenanceRelayProps = {
  chapter: ChapterTwoProvenanceChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

type RelayStageId = ChapterTwoProvenanceChapter["producerRelayStages"][number]["id"];
type RelayStage = ChapterTwoProvenanceChapter["producerRelayStages"][number];

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

function FullSampleEvidence({ evidenceId }: { evidenceId: string }) {
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

function StageSourceEvidence({ stage }: { stage: RelayStage }) {
  const anchor = sourceAnchors.find((item) => item.id === stage.sourceRefIds[0]);
  return (
    <article className="provenance-stage-evidence">
      <GuidedSourceExcerpt
        evidence={{
          id: `relay-${stage.id}`,
          title: `${String(stage.order).padStart(2, "0")} · ${stage.title}`,
          sourceRefId: anchor?.id ?? stage.sourceRefIds[0],
          claim: stage.trustworthyObservation,
          focus: stage.writes,
          boundary: `${stage.scope} ${stage.caveat}`,
        }}
        sourceUrl={anchor?.url}
        symbol={anchor?.symbol}
        code={anchor?.guided_excerpt?.code}
        lineStart={anchor?.guided_excerpt?.start_line}
      />
      <ul aria-label={`${stage.title} 固定源码锚点`}>
        {stage.sourceRefIds.map((sourceRefId) => {
          const sourceAnchor = sourceAnchors.find((item) => item.id === sourceRefId);
          return (
            <li key={sourceRefId}>
              <code>{sourceRefId}</code>
              {sourceAnchor?.url ? <a href={sourceAnchor.url}>{sourceAnchor.symbol}</a> : <span>锚点待补</span>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function ChapterTwoProvenanceRelay({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
}: ChapterTwoProvenanceRelayProps) {
  const [emphasizedStage, setEmphasizedStage] = useState<RelayStageId>(
    chapter.producerRelayStages[0].id,
  );
  const activeEvidenceStage = chapter.producerRelayStages.find(
    (stage) => stage.id === emphasizedStage,
  ) ?? chapter.producerRelayStages[0];
  const conversionStage = chapter.producerRelayStages.find(
    (stage) => stage.id === "train-data-conversion",
  );
  return (
    <article className="provenance-reader" aria-labelledby="mechanism-chapter-title">
      <header className="provenance-opening">
        <div className="provenance-opening-copy">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p className="provenance-verdict">
            <strong>本章判断句</strong>
            {chapter.conclusion}
          </p>
        </div>
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>CHAPTER 02 / 06 · FIELD PROVENANCE · {chapter.durationMinutes} MIN</figcaption>
        </figure>
      </header>

      <section className="provenance-ledger-handoff" aria-labelledby="provenance-ledger-title">
        <div>
          <span>第一章交接单</span>
          <h2 id="provenance-ledger-title">先固定同一份 origin-a，再判断字段何时可信</h2>
          <p>这里是本章唯一的状态账本入口，固定停在 Dataset 构造结束。下面五站是责任地图，不会把后续假设状态写进这份账本。</p>
          <dl>
            <div><dt>当前观察点</dt><dd><code>samples-constructed</code></dd></div>
            <div><dt>有效输入</dt><dd><code>prompt / label / metadata / multimodal_inputs</code></dd></div>
            <div><dt>账本止点</dt><dd><code>Dataset → Sample(...)</code> 完成，不跨入 DataSource</dd></div>
          </dl>
        </div>
        <button
          className="mechanism-state-trigger"
          ref={triggerRef}
          type="button"
          onClick={onOpenDrawer}
        >
          打开 origin-a 状态账本
        </button>
      </section>

      <section className="provenance-relay" aria-labelledby="provenance-relay-title">
        <header>
          <div>
            <h2 id="provenance-relay-title">字段生命周期接力台</h2>
            <p>五站完整信息始终可见。点击、Tab、Enter 或 Space 只移动蓝色强调框，不改变字段内容。</p>
          </div>
          <p aria-live="polite">当前强调：{chapter.producerRelayStages.find((stage) => stage.id === emphasizedStage)?.title}</p>
        </header>

        <div className="provenance-relay-track" data-emphasis={emphasizedStage}>
          {chapter.producerRelayStages.map((stage) => {
            return (
              <section
                className="provenance-relay-stage"
                data-stage={stage.id}
                key={stage.id}
              >
                <button
                  aria-pressed={emphasizedStage === stage.id}
                  onClick={() => setEmphasizedStage(stage.id)}
                  onFocus={() => setEmphasizedStage(stage.id)}
                  type="button"
                >
                  <small>{String(stage.order).padStart(2, "0")} / {stage.producer}</small>
                  <strong>{stage.title}</strong>
                </button>

                <dl className="provenance-stage-contract">
                  <div><dt>接收</dt><dd>{stage.input.join(" · ")}</dd></div>
                  <div><dt>写入</dt><dd>{stage.writes.join(" · ")}</dd></div>
                  <div><dt>交出</dt><dd>{stage.output.join(" · ")}</dd></div>
                  <div><dt>可信观察</dt><dd>{stage.trustworthyObservation}</dd></div>
                  <div><dt>边界</dt><dd>{stage.scope}</dd></div>
                </dl>
                <p className="provenance-stage-caveat">{stage.caveat}</p>
              </section>
            );
          })}
        </div>

        <section className="provenance-lifecycle-ledger" aria-labelledby="provenance-lifecycle-ledger-title">
          <header>
            <div>
              <span>FIELD LEDGER / 14</span>
              <h3 id="provenance-lifecycle-ledger-title">声明、初始化、首次产值与可信时点</h3>
            </div>
            <p>蓝色边线跟随上方生产者；它只帮助定位，不会隐藏任何一条字段记录。</p>
          </header>
          <div role="list">
            {chapter.fieldLifecycleEntries.map((entry) => {
              const responsibilityStage = entry.firstNonDefaultProducer?.stageId ?? entry.initializedBy.stageId;
              return (
                <article
                  data-emphasized={responsibilityStage === emphasizedStage ? "true" : "false"}
                  data-stage={responsibilityStage}
                  key={entry.id}
                  role="listitem"
                >
                  <header>
                    <code>{entry.field}</code>
                    <small>{chapter.producerRelayStages.find((stage) => stage.id === responsibilityStage)?.producer}</small>
                  </header>
                  <dl>
                    <div><dt>dataclass 默认</dt><dd>{entry.dataclassDefault}</dd></div>
                    <div>
                      <dt>构造时初始化</dt>
                      <dd>{entry.initializedBy.value}<small>{entry.initializedBy.condition}</small></dd>
                    </div>
                    <div>
                      <dt>首个非默认生产</dt>
                      <dd>{entry.firstNonDefaultProducer?.value ?? "本路径保持合法默认值"}<small>{entry.firstNonDefaultProducer?.condition ?? "默认值本身就是可解释结果"}</small></dd>
                    </div>
                    <div>
                      <dt>开始可信</dt>
                      <dd><code>{entry.trustworthyFrom.stageId}</code><small>{entry.trustworthyFrom.observation}</small></dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        {conversionStage?.derivedOutputs?.length ? (
          <section className="provenance-train-data-ledger" aria-labelledby="provenance-train-data-title">
            <header>
              <span>AFTER SAMPLE</span>
              <h3 id="provenance-train-data-title">接力终点不是“填满 Sample”，而是派生 TrainData</h3>
              <p>{conversionStage.caveat}</p>
            </header>
            <div>
              {conversionStage.derivedOutputs.map((output) => (
                <article key={output.id}>
                  <code>{output.trainDataField}</code>
                  <p>{output.rule}</p>
                  <small>读取 {output.derivedFrom.join(" + ")}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <section className="provenance-diagnostics" aria-labelledby="provenance-diagnostics-title">
        <header>
          <h2 id="provenance-diagnostics-title">过早读取：三个诊断案例</h2>
          <p>字段有值不等于现在就能解释；先定位 snapshot 的停止点，再找尚未运行的首个非默认生产者。</p>
        </header>
        <div>
          {chapter.earlyFieldDiagnosticCases.map((diagnosticCase) => (
            <article key={diagnosticCase.id}>
              <header>
                <span>
                  缺失生产者 · {chapter.producerRelayStages.find(
                    (stage) => stage.id === diagnosticCase.missingProducerStageId,
                  )?.producer}
                </span>
                <h3>{diagnosticCase.title}</h3>
              </header>
              <dl>
                <div><dt>观察快照</dt><dd>{diagnosticCase.snapshot}</dd></div>
                <div><dt>可疑字段</dt><dd><code>{diagnosticCase.suspiciousField}</code> = <code>{diagnosticCase.observedValue}</code></dd></div>
              </dl>
              <p>{diagnosticCase.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="provenance-sources" aria-labelledby="provenance-sources-title">
        <header>
          <h2 id="provenance-sources-title">源码证据与完整 Sample</h2>
          <p>接力台描述责任边界；下列固定 commit 锚点负责证实写入位置。完整 dataclass 默认折叠，供需要逐字段核对时展开。</p>
        </header>
        <nav className="provenance-evidence-selector" aria-label="选择要核对的生产者源码">
          {chapter.producerRelayStages.map((stage) => (
            <button
              aria-pressed={stage.id === activeEvidenceStage.id}
              key={stage.id}
              onClick={() => setEmphasizedStage(stage.id)}
              onFocus={() => setEmphasizedStage(stage.id)}
              type="button"
            >
              <span>{String(stage.order).padStart(2, "0")}</span>
              <strong>{stage.title}</strong>
              <small>{sourceAnchors.find((anchor) => anchor.id === stage.sourceRefIds[0])?.symbol}</small>
            </button>
          ))}
        </nav>
        <div className="provenance-active-evidence">
          <StageSourceEvidence stage={activeEvidenceStage} />
        </div>
        <details>
          <summary>展开完整 Sample dataclass 证据</summary>
          <FullSampleEvidence evidenceId={chapter.evidenceId} />
        </details>
      </section>

      {passed ? <p className="mechanism-passed-note">本章诊断练习已经通过；你仍可重新推演。</p> : null}
      {exerciseSlot}

      <section className="provenance-correction" aria-labelledby="provenance-correction-title">
        <h2 id="provenance-correction-title">校正</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      <nav className="provenance-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>← 返回第一章交接单</button>
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：分组 →</button>
      </nav>
    </article>
  );
}
