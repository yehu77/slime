"use client";

import { useMemo, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import { sampleToGenerationFixture } from "../../core/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterFiveResponseEvidenceChapter } from "./chapter-reader-contracts";
import "./chapter-five-response-evidence.css";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type ChapterFiveResponseEvidenceProps = {
  chapter: ChapterFiveResponseEvidenceChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

const laneKindLabels: Record<string, string> = {
  "server-field": "服务器字段",
  "caller-association": "调用方补充",
  "decoded-evidence": "解码后证据",
  "deferred-write": "推迟到写回",
};

function ResponseEvidence({ evidenceId }: { evidenceId: string }) {
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

function formatLedgerValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized ?? String(value);
}

function nextItemIndex(eventKey: string, currentIndex: number, length: number): number | null {
  if (eventKey === "Home") return 0;
  if (eventKey === "End") return length - 1;
  if (eventKey === "ArrowDown" || eventKey === "ArrowRight") return (currentIndex + 1) % length;
  if (eventKey === "ArrowUp" || eventKey === "ArrowLeft") return (currentIndex - 1 + length) % length;
  return null;
}

export function ChapterFiveResponseEvidence({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
}: ChapterFiveResponseEvidenceProps) {
  const receipt = chapter.responseFixtureReceipt;
  const [activeStageId, setActiveStageId] = useState(chapter.responseDecodeStages[0]?.id ?? "");
  const [activeLaneId, setActiveLaneId] = useState(chapter.responseEvidenceLanes[0]?.id ?? "");
  const activeStage = useMemo(
    () => chapter.responseDecodeStages.find((stage) => stage.id === activeStageId) ?? chapter.responseDecodeStages[0],
    [activeStageId, chapter.responseDecodeStages],
  );
  const activeLane = useMemo(
    () => chapter.responseEvidenceLanes.find((lane) => lane.id === activeLaneId) ?? chapter.responseEvidenceLanes[0],
    [activeLaneId, chapter.responseEvidenceLanes],
  );
  const tuple = receipt.rawBody.metaInfo.outputTokenLogprobs[0];
  const wireBody = {
    text: receipt.rawBody.text,
    meta_info: {
      output_token_logprobs: receipt.rawBody.metaInfo.outputTokenLogprobs,
      finish_reason: receipt.rawBody.metaInfo.finishReason,
      weight_version: receipt.rawBody.metaInfo.weightVersion,
    },
  };
  const contactSheet = sampleToGenerationFixture.response_receipts.map((candidate) => {
    const group = sampleToGenerationFixture.group_plan.find((item) =>
      item.members.some((member) => member.sample_id === candidate.sample_id),
    );
    const row = sampleToGenerationFixture.rows.find((item) => item.origin_id === group?.origin_id);
    const candidateTuple = candidate.raw_body.meta_info.output_token_logprobs?.[0];
    return {
      sampleId: candidate.sample_id,
      text: candidate.raw_body.text,
      label: row?.label ?? "—",
      tokenId: candidateTuple?.[1] ?? "—",
      logProb: candidateTuple?.[0] ?? "—",
      correct: candidate.raw_body.text === row?.label,
    };
  });
  const beforeWriteEntries = Object.entries(receipt.sampleBeforeWrite);

  const moveStageFocus = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const nextIndex = nextItemIndex(event.key, currentIndex, chapter.responseDecodeStages.length);
    if (nextIndex === null) return;
    event.preventDefault();
    const next = event.currentTarget
      .closest("ol")
      ?.querySelectorAll<HTMLButtonElement>("button[data-response-stage]")[nextIndex];
    next?.focus();
    next?.click();
  };

  return (
    <article className="response-reader" aria-labelledby="mechanism-chapter-title">
      <header className="response-opening">
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>RETURN LINE · SOURCE BASELINE 06FFDBE2</figcaption>
        </figure>
        <div className="response-opening-copy">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <p className="response-opening-subtitle">从 HTTP wire body 到待写回生成证据</p>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p>{chapter.conclusion}</p>
          <dl aria-label="第五章观察边界">
            <div><dt>已经抵达</dt><dd><code>output</code> mapping</dd></div>
            <div><dt>仍未发生</dt><dd><code>append_response_tokens</code></dd></div>
            <div><dt>观察终点</dt><dd><code>{receipt.toObservation}</code></dd></div>
          </dl>
        </div>
      </header>

      <section className="response-handoff" aria-labelledby="response-handoff-title">
        <div>
          <h2 id="response-handoff-title">第四章的请求已经出站，原 Sample 仍留在调用方</h2>
          <p>{chapter.objective}</p>
        </div>
        <dl>
          <div><dt>关联对象</dt><dd><code>{receipt.sampleId}</code></dd></div>
          <div><dt>起点</dt><dd><code>{receipt.fromObservation}</code></dd></div>
          <div><dt>本章切片</dt><dd><code>await post</code> 之后</dd></div>
          <div><dt>停止线</dt><dd>Sample 写回之前</dd></div>
        </dl>
        <button className="mechanism-state-trigger" ref={triggerRef} type="button" onClick={onOpenDrawer}>
          打开 a0 响应前账本
        </button>
      </section>

      <section className="response-receipt" aria-labelledby="response-receipt-title">
        <header>
          <h2 id="response-receipt-title">一份返回，两层记录</h2>
          <p>课程关联键与服务器 body 分开放置。<code>sample_id</code> 只帮助页面找回调用方对象，不属于 SGLang 返回，也不写入 upstream Sample。</p>
        </header>
        <div className="response-receipt-sheet">
          <aside>
            <span>COURSE ASSOCIATION</span>
            <strong><code>sample_id={receipt.sampleId}</code></strong>
            <p>调用方保存的课程 sidecar 关联。</p>
            <b aria-hidden="true">不在 HTTP body 内</b>
          </aside>
          <div>
            <span>HTTP RESPONSE BODY</span>
            <pre><code>{JSON.stringify(wireBody, null, 2)}</code></pre>
          </div>
        </div>
      </section>

      <section className="response-decode" aria-labelledby="response-decode-title">
        <header>
          <h2 id="response-decode-title">返回路径：先解 HTTP，再分离语义证据</h2>
          <p>源码中的每一步都在同一条返回线上。点击或聚焦站点只移动红色套准标记；输入、操作、输出与边界始终可读。</p>
        </header>
        <ol>
          {chapter.responseDecodeStages.map((stage, index) => {
            const active = stage.id === activeStage?.id;
            return (
              <li className={active ? "is-active" : ""} key={stage.id}>
                <button
                  type="button"
                  data-response-stage
                  aria-pressed={active}
                  onClick={() => setActiveStageId(stage.id)}
                  onFocus={() => setActiveStageId(stage.id)}
                  onKeyDown={(event) => moveStageFocus(event, index)}
                >
                  <span>{String(stage.order).padStart(2, "0")}</span>
                  <strong>{stage.title}</strong>
                </button>
                <dl>
                  <div><dt>输入</dt><dd>{stage.input.map((item) => <code key={item}>{item}</code>)}</dd></div>
                  <div><dt>操作</dt><dd>{stage.operation}</dd></div>
                  <div><dt>输出</dt><dd>{stage.output.map((item) => <code key={item}>{item}</code>)}</dd></div>
                  <div className="response-decode-proof"><dt>已经证明</dt><dd>{stage.proof}</dd></div>
                  <div className="response-decode-not-yet"><dt>尚未证明</dt><dd>{stage.notYet}</dd></div>
                </dl>
              </li>
            );
          })}
        </ol>
        <p className="response-live-status" role="status" aria-live="polite">
          当前套准第 {activeStage?.order} 站：{activeStage?.title}。
        </p>
      </section>

      <section className="response-tuple" aria-labelledby="response-tuple-title">
        <header>
          <h2 id="response-tuple-title">一个 tuple，分到两条保持同序的轨道</h2>
          <p>位置含义来自源码的两个列表推导式，而不是数字长得像整数或小数。两条数组共享同一遍历顺序。</p>
        </header>
        <div className="response-tuple-source">
          <span>原始条目</span>
          <code>[{tuple?.join(", ")}]</code>
        </div>
        <div className="response-tuple-switch" aria-label="tuple 位置解码">
          <div>
            <span><code>item[0]</code></span>
            <strong>{tuple?.[0]}</strong>
            <b aria-hidden="true">→</b>
            <code>new_response_log_probs</code>
            <output>[{receipt.decoded.responseLogProbs.join(", ")}]</output>
          </div>
          <div>
            <span><code>item[1]</code></span>
            <strong>{tuple?.[1]}</strong>
            <b aria-hidden="true">→</b>
            <code>new_response_tokens</code>
            <output>[{receipt.decoded.responseTokenIds.join(", ")}]</output>
          </div>
        </div>
        <div className="response-contact-sheet" role="table" aria-label="四条 fixture 响应的解码结果">
          <div role="row" className="response-contact-head">
            <span role="columnheader">Sample</span>
            <span role="columnheader">text / label</span>
            <span role="columnheader">item[1] → token</span>
            <span role="columnheader">item[0] → log-prob</span>
            <span role="columnheader">答案关系</span>
          </div>
          {contactSheet.map((candidate) => (
            <div role="row" key={candidate.sampleId}>
              <span role="cell"><code>{candidate.sampleId}</code></span>
              <span role="cell"><code>{candidate.text}</code> / <code>{candidate.label}</code></span>
              <span role="cell"><code>{candidate.tokenId}</code></span>
              <span role="cell"><code>{candidate.logProb}</code></span>
              <span role="cell" data-correct={candidate.correct}>{candidate.correct ? "与 label 相同" : "与 label 不同"}</span>
            </div>
          ))}
          <p>答案相同与不同的四条记录都能按同一 tuple 契约解码；解码成立不等于回答正确。</p>
        </div>
      </section>

      <section className="response-lanes" aria-labelledby="response-lanes-title">
        <header>
          <h2 id="response-lanes-title">响应分轨场：四种来源、八条证据轨</h2>
          <p>每条轨道同时保留来源、投影名、可证事实与不可证事实。切换套准不会折叠其他轨道。</p>
        </header>
        <fieldset>
          <legend className="sr-only">选择要强调的响应证据轨道</legend>
          {chapter.responseEvidenceLanes.map((lane, index) => {
            const active = lane.id === activeLane?.id;
            return (
              <label className={active ? "is-active" : ""} key={lane.id}>
                <input
                  type="radio"
                  name="response-evidence-lane"
                  value={lane.id}
                  checked={active}
                  onChange={() => setActiveLaneId(lane.id)}
                  onFocus={() => setActiveLaneId(lane.id)}
                  onKeyDown={(event) => {
                    const nextIndex = nextItemIndex(event.key, index, chapter.responseEvidenceLanes.length);
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextInput = event.currentTarget
                      .closest("fieldset")
                      ?.querySelectorAll<HTMLInputElement>('input[name="response-evidence-lane"]')[nextIndex];
                    nextInput?.click();
                    nextInput?.focus();
                  }}
                />
                <span className="response-lane-register">{laneKindLabels[lane.kind] ?? lane.kind}</span>
                <strong>{lane.label}</strong>
                <code>{lane.sourcePath}</code>
                <code>{lane.fixtureValue}</code>
                <p><b>本地投影</b>{lane.projectedAs}</p>
                <p><b>能够证明</b>{lane.proves}</p>
                <p><b>不能证明</b>{lane.doesNotProve}</p>
              </label>
            );
          })}
        </fieldset>
        <p className="response-live-status" role="status" aria-live="polite">
          当前套准：{activeLane?.label}；{activeLane?.proves}
        </p>
      </section>

      <section className="response-gate" aria-labelledby="response-gate-title">
        <header>
          <h2 id="response-gate-title">写回候车区：材料已经备齐，Sample 仍未过闸</h2>
          <p>右侧只是课程为了观察源码微步骤而列出的候写证据包。它不是 upstream 类型，也不意味着下一章的修改与长度验证已经成功。</p>
        </header>
        <div className="response-gate-layout">
          <div>
            <span>CALLER SAMPLE / BEFORE WRITE</span>
            <dl>
              {beforeWriteEntries.map(([field, value]) => (
                <div key={field}><dt><code>{field}</code></dt><dd><code>{formatLedgerValue(value)}</code></dd></div>
              ))}
            </dl>
          </div>
          <b aria-hidden="true"><span>闸门关闭</span>WRITEBACK</b>
          <div>
            <span>COURSE-LOCAL WRITE CANDIDATE</span>
            <pre><code>{JSON.stringify({
              text: receipt.decoded.text,
              response_token_ids: receipt.decoded.responseTokenIds,
              response_log_probs: receipt.decoded.responseLogProbs,
              meta_info: {
                output_token_logprobs: receipt.rawBody.metaInfo.outputTokenLogprobs,
                finish_reason: receipt.rawBody.metaInfo.finishReason,
                weight_version: receipt.rawBody.metaInfo.weightVersion,
              },
            }, null, 2)}</code></pre>
          </div>
        </div>
      </section>

      <section className="response-diagnostics" aria-labelledby="response-diagnostics-title">
        <header>
          <h2 id="response-diagnostics-title">三条异常回传：先找第一个错误边界</h2>
          <p>这些案例不要求猜最终训练后果；只检查错误最早在哪一步把证据解释错了。</p>
        </header>
        <ol>
          {chapter.responseDiagnosticCases.map((diagnostic) => (
            <li key={diagnostic.id}>
              <h3>{diagnostic.title}</h3>
              <code>{diagnostic.snapshot}</code>
              <dl>
                <div><dt>首错边界</dt><dd>{diagnostic.firstErrorBoundary}</dd></div>
                <div><dt>为什么</dt><dd>{diagnostic.explanation}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="response-sources" aria-labelledby="response-sources-title">
        <header>
          <h2 id="response-sources-title">源码底片：先确认解码，再看写回调用的门槛</h2>
          <p>主证据默认展开；其余固定提交摘录用于核对 HTTP JSON 解码、终止元数据或下一章的交接位置。</p>
        </header>
        <ResponseEvidence evidenceId={chapter.evidenceId} />
        {chapter.additionalEvidenceIds?.length ? (
          <div className="response-source-supplements">
            {chapter.additionalEvidenceIds.map((evidenceId) => {
              const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
              return (
                <details key={evidenceId}>
                  <summary>{evidence?.title ?? evidenceId}</summary>
                  <ResponseEvidence evidenceId={evidenceId} />
                </details>
              );
            })}
          </div>
        ) : null}
      </section>

      {passed ? <p className="mechanism-passed-note response-passed-note">本章响应解码已经通过；你仍可重新套准每条证据轨。</p> : null}
      {exerciseSlot}

      <section className="response-correction" aria-labelledby="response-correction-title">
        <h2 id="response-correction-title">把一句常见误读改准确</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      <nav className="response-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>← 返回请求装配台</button>
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：执行 Sample 写回 →</button>
      </nav>
    </article>
  );
}
