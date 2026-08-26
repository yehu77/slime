"use client";

import { useMemo, useState, type ReactNode, type RefObject } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterFourRequestBoundaryChapter } from "./chapter-reader-contracts";
import "./chapter-four-request-boundary.css";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type ChapterFourRequestBoundaryProps = {
  chapter: ChapterFourRequestBoundaryChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

const destinationLabels = {
  transformed: "先转换表示",
  "caller-ledger": "留在调用方",
  "json-body": "进入 JSON body",
  "not-produced": "尚未产生",
  "conditional-body": "条件性 JSON 字段",
  "conditional-header": "条件性 HTTP header",
} as const;

function RequestEvidence({ evidenceId }: { evidenceId: string }) {
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

export function ChapterFourRequestBoundary({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
}: ChapterFourRequestBoundaryProps) {
  const [activeStageId, setActiveStageId] = useState(chapter.requestAssemblyStages[0].id);
  const [activeManifestId, setActiveManifestId] = useState("prompt-ids");
  const packet = chapter.requestFixturePacket;
  const activeManifest = useMemo(
    () => chapter.requestManifestEntries.find((entry) => entry.id === activeManifestId) ?? chapter.requestManifestEntries[0],
    [activeManifestId, chapter.requestManifestEntries],
  );
  const mainManifest = chapter.requestManifestEntries.filter((entry) => entry.mainPath);
  const branchManifest = chapter.requestManifestEntries.filter((entry) => !entry.mainPath);

  return (
    <article className="request-reader" aria-labelledby="mechanism-chapter-title">
      <header className="request-opening">
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>CHAPTER 04 / 06 · REQUEST MANIFEST · {chapter.durationMinutes} MIN</figcaption>
        </figure>
        <div className="request-opening-sheet">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <p className="request-technical-title">Sample 怎样成为 SGLang 的最小输入投影</p>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p>{chapter.conclusion}</p>
          <dl aria-label="本章观察结论">
            <div><dt>跨境 JSON 顶层键</dt><dd><strong>3</strong> 个</dd></div>
            <div><dt>完整 Sample</dt><dd>仍在调用方</dd></div>
            <div><dt>本章终点</dt><dd><code>requests-prepared</code></dd></div>
          </dl>
        </div>
      </header>

      <section className="request-handoff" aria-labelledby="request-handoff-title">
        <div>
          <h2 id="request-handoff-title">第三章交来的不是一张请求，而是一条完整候选</h2>
          <p>{chapter.objective}</p>
        </div>
        <dl>
          <div><dt>当前对象</dt><dd><code>{packet.sampleId}</code></dd></div>
          <div><dt>起点</dt><dd><code>{packet.fromObservation}</code></dd></div>
          <div><dt>输入条件</dt><dd>pure text · <code>tokens=[]</code> · <code>max_new_tokens=1</code></dd></div>
          <div><dt>停止位置</dt><dd><code>{packet.toObservation}</code>，不读取 response</dd></div>
        </dl>
        <button
          className="mechanism-state-trigger"
          ref={triggerRef}
          type="button"
          onClick={onOpenDrawer}
        >
          打开 a0 请求前后账本
        </button>
      </section>

      <section className="request-assembly" aria-labelledby="request-assembly-title">
        <header>
          <h2 id="request-assembly-title">请求装配线：源码中的五个检查点</h2>
          <p>按顺序同时阅读 caller 与 wire 两条账。点击或聚焦某一站只移动套准色，不会隐藏其他步骤。</p>
        </header>
        <div className="request-assembly-border" aria-hidden="true">
          <span>CALLER / SAMPLE</span><b>NETWORK BORDER</b><span>WIRE / SGLANG</span>
        </div>
        <ol>
          {chapter.requestAssemblyStages.map((stage) => {
            const active = stage.id === activeStageId;
            return (
              <li className={active ? "is-active" : ""} key={stage.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveStageId(stage.id)}
                  onFocus={() => setActiveStageId(stage.id)}
                >
                  <span>{String(stage.order).padStart(2, "0")}</span>
                  <strong>{stage.title}</strong>
                  <code>{stage.producer}</code>
                </button>
                <div className="request-stage-facts">
                  <dl>
                    <div><dt>输入</dt><dd>{stage.input.map((item) => <code key={item}>{item}</code>)}</dd></div>
                    <div><dt>操作</dt><dd>{stage.operation}</dd></div>
                    <div><dt>输出</dt><dd>{stage.output.map((item) => <code key={item}>{item}</code>)}</dd></div>
                  </dl>
                  <p><strong>调用方：</strong>{stage.callerEffect}</p>
                  <p><strong>网络侧：</strong>{stage.networkEffect}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="request-assembly-status" role="status" aria-live="polite">
          当前套准第 {chapter.requestAssemblyStages.find((stage) => stage.id === activeStageId)?.order} 站：
          {chapter.requestAssemblyStages.find((stage) => stage.id === activeStageId)?.title}。
        </p>
      </section>

      <section className="request-prefix-register" aria-labelledby="request-prefix-title">
        <header>
          <h2 id="request-prefix-title">同一前缀，两处记录</h2>
          <p>序列值相等，不等于职责相同；本课也不对两个 Python 列表的对象身份作额外承诺。</p>
        </header>
        <div className="request-prefix-source">
          <span>局部变量</span>
          <code>prompt_ids = [{packet.promptIds.join(", ")}]</code>
        </div>
        <div className="request-prefix-ledgers">
          <article>
            <h3>CALLER LEDGER</h3>
            <strong><code>Sample.tokens</code></strong>
            <code>[{packet.promptIds.join(", ")}]</code>
            <p>留给调用方，等待下一章把 response token 接在后面。</p>
          </article>
          <div aria-hidden="true"><span>相同序列值</span><b>≠</b><span>相同职责</span></div>
          <article>
            <h3>REQUEST ENVELOPE</h3>
            <strong><code>payload.input_ids</code></strong>
            <code>[{packet.payload.input_ids.join(", ")}]</code>
            <p>作为本次生成的输入，随 JSON body 越过网络边界。</p>
          </article>
        </div>
      </section>

      <section className="request-manifest" aria-labelledby="request-manifest-title">
        <header>
          <h2 id="request-manifest-title">边境申报单：每个字段去哪里</h2>
          <p>左列逐项声明来源；右列给出真实目的地。黄色套准条只是阅读辅助，所有判断始终可见。</p>
        </header>
        <div className="request-manifest-layout">
          <fieldset>
            <legend>本课纯文本主路径</legend>
            {mainManifest.map((entry) => (
              <label className={entry.id === activeManifest.id ? "is-active" : ""} key={entry.id}>
                <input
                  type="radio"
                  name="request-manifest-field"
                  value={entry.id}
                  checked={entry.id === activeManifest.id}
                  onChange={() => setActiveManifestId(entry.id)}
                  onFocus={() => setActiveManifestId(entry.id)}
                  onKeyDown={(event) => {
                    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
                    if (!keys.includes(event.key)) return;
                    event.preventDefault();
                    const currentIndex = mainManifest.findIndex((candidate) => candidate.id === entry.id);
                    const nextIndex = event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? mainManifest.length - 1
                        : event.key === "ArrowDown" || event.key === "ArrowRight"
                          ? (currentIndex + 1) % mainManifest.length
                          : (currentIndex - 1 + mainManifest.length) % mainManifest.length;
                    const nextInput = event.currentTarget
                      .closest("fieldset")
                      ?.querySelector<HTMLInputElement>(`input[value="${mainManifest[nextIndex].id}"]`);
                    nextInput?.click();
                    nextInput?.focus();
                  }}
                />
                <span>
                  <strong><code>{entry.field}</code></strong>
                  <small>{entry.fixtureValue}</small>
                </span>
                <b data-destination={entry.destination}>{destinationLabels[entry.destination]}</b>
                <em>{entry.path}</em>
                <p className="request-manifest-origin"><span>来源</span>{entry.origin}</p>
                <p className="request-manifest-reason">{entry.reason}</p>
              </label>
            ))}
          </fieldset>
          <aside>
            <span>当前字段路径</span>
            <h3><code>{activeManifest.field}</code></h3>
            <dl>
              <div><dt>fixture 值</dt><dd><code>{activeManifest.fixtureValue}</code></dd></div>
              <div><dt>来源</dt><dd>{activeManifest.origin}</dd></div>
              <div><dt>判定</dt><dd>{destinationLabels[activeManifest.destination]}</dd></div>
              <div><dt>路径</dt><dd>{activeManifest.path}</dd></div>
            </dl>
            <p>{activeManifest.reason}</p>
          </aside>
        </div>
        <p className="request-manifest-status" role="status" aria-live="polite">
          {activeManifest.field}：{destinationLabels[activeManifest.destination]}；{activeManifest.path}。
        </p>
      </section>

      <section className="request-packet" aria-labelledby="request-packet-title">
        <header>
          <h2 id="request-packet-title">越过边界的真实形状</h2>
          <p>下面是课程 fixture 对 <code>a0</code> 建立的 request sidecar。<code>sample_id</code> 只负责课程关联，不进入 JSON body。</p>
        </header>
        <div className="request-packet-sheet">
          <div>
            <span>REQUEST LINE</span>
            <strong>{packet.method} {packet.endpoint}</strong>
            <dl>
              <div><dt>sidecar association</dt><dd><code>sample_id={packet.sampleId}</code></dd></div>
              <div><dt>JSON top-level keys</dt><dd><code>input_ids</code><code>sampling_params</code><code>return_logprob</code></dd></div>
              <div><dt>caller retains</dt><dd><code>label</code><code>group_index</code><code>index</code><code>metadata</code></dd></div>
            </dl>
          </div>
          <pre><code>{JSON.stringify(packet.payload, null, 2)}</code></pre>
        </div>
      </section>

      <section className="request-sampling" aria-labelledby="request-sampling-title">
        <header>
          <h2 id="request-sampling-title">sampling_params 是一张运行配方，不是 Sample 履历</h2>
          <p>九项值全部与 fixture 对齐。它们控制生成过程；没有一项说明答案是否正确，也没有一项承担候选身份。</p>
        </header>
        <div className="request-sampling-table" role="table" aria-label="本课 sampling params 与运行参数来源">
          <div role="row" className="request-sampling-head">
            <span role="columnheader">payload key</span>
            <span role="columnheader">fixture</span>
            <span role="columnheader">运行来源</span>
            <span role="columnheader">本课作用</span>
          </div>
          {chapter.requestSamplingParameters.map((parameter) => (
            <div role="row" key={parameter.key}>
              <span role="cell" aria-label={`payload key: ${parameter.key}`}>
                <small className="request-sampling-label" aria-hidden="true">payload key</small>
                <code>{parameter.key}</code>
              </span>
              <span role="cell" aria-label={`fixture: ${parameter.fixtureValue}`}>
                <small className="request-sampling-label" aria-hidden="true">fixture</small>
                <code>{parameter.fixtureValue}</code>
              </span>
              <span role="cell" aria-label={`运行来源: ${parameter.runtimeArgument}`}>
                <small className="request-sampling-label" aria-hidden="true">运行来源</small>
                <code>{parameter.runtimeArgument}</code>
              </span>
              <span role="cell" aria-label={`本课作用: ${parameter.role}`}>
                <small className="request-sampling-label" aria-hidden="true">本课作用</small>
                {parameter.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="request-sources" aria-labelledby="request-sources-title">
        <header>
          <h2 id="request-sources-title">源码底片：先看信封，再核对它从哪里来、怎样发出</h2>
          <p>默认展开的摘录直接证明三键 payload 与 Sample.tokens 留档；折叠证据分别核对 prompt、采样配方和 POST。</p>
        </header>
        <RequestEvidence evidenceId={chapter.evidenceId} />
        <div className="request-source-supplements">
          {chapter.additionalEvidenceIds?.map((evidenceId) => {
            const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
            return (
              <details key={evidenceId}>
                <summary>{evidence?.title ?? evidenceId}</summary>
                <RequestEvidence evidenceId={evidenceId} />
              </details>
            );
          })}
        </div>
      </section>

      <details className="request-branches">
        <summary>{chapter.advancedAside?.title}</summary>
        <p>{chapter.advancedAside?.body}</p>
        <div>
          {branchManifest.map((entry) => (
            <article key={entry.id}>
              <h3><code>{entry.field}</code></h3>
              <strong>{destinationLabels[entry.destination]}</strong>
              <p>{entry.reason}</p>
              <small>{entry.path}</small>
            </article>
          ))}
        </div>
      </details>

      {passed ? <p className="mechanism-passed-note">本章边境复核已经通过；你仍可切换申报项，重新检查每条路径。</p> : null}
      {exerciseSlot}

      <section className="request-correction" aria-labelledby="request-correction-title">
        <h2 id="request-correction-title">校正条</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      <nav className="request-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>← 返回分组实验台</button>
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：HTTP response →</button>
      </nav>
    </article>
  );
}
