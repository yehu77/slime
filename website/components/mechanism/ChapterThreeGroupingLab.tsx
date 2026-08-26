"use client";

import { useState, type ReactNode, type RefObject } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterThreeGroupingChapter } from "./chapter-reader-contracts";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type ChapterThreeGroupingLabProps = {
  chapter: ChapterThreeGroupingChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

function GroupingEvidence({ evidenceId }: { evidenceId: string }) {
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

export function ChapterThreeGroupingLab({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
}: ChapterThreeGroupingLabProps) {
  const [probeApplied, setProbeApplied] = useState(false);
  const probe = chapter.groupingAliasProbe;

  return (
    <article className="grouping-reader" aria-labelledby="mechanism-chapter-title">
      <header className="grouping-opening">
        <div className="grouping-opening-copy">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p className="grouping-opening-verdict">
            <strong>观察终点</strong>
            {chapter.conclusion}
          </p>
        </div>
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>CHAPTER 03 / 06 · GROUPING CONTACT SHEET · {chapter.durationMinutes} MIN</figcaption>
        </figure>
      </header>

      <section className="grouping-handoff" aria-labelledby="grouping-handoff-title">
        <div>
          <h2 id="grouping-handoff-title">从两个没有候选身份的 seed 开始</h2>
          <p>{chapter.objective}</p>
        </div>
        <dl>
          <div><dt>观察起点</dt><dd><code>samples-constructed</code></dd></div>
          <div><dt>fan-out</dt><dd><code>P=2</code> seeds × <code>N=2</code> candidates / seed</dd></div>
          <div><dt>fresh counters</dt><dd><code>G₀=0</code> · <code>I₀=0</code></dd></div>
          <div><dt>停止位置</dt><dd><code>groups-built</code>，generation 尚未开始</dd></div>
        </dl>
        <button
          className="mechanism-state-trigger"
          ref={triggerRef}
          type="button"
          onClick={onOpenDrawer}
        >
          打开 a0 分组后账本
        </button>
      </section>

      <section className="grouping-workbench" aria-labelledby="grouping-workbench-title">
        <header>
          <div>
            <h2 id="grouping-workbench-title">分组实验台</h2>
            <p>先保留源码的嵌套形状，再读取编号。四个候选不是一张扁平列表，而是两个 group 各装两条 Sample。</p>
          </div>
          <p className="grouping-equation" aria-label="两个 seed 乘以每个 seed 两个候选，等于两个组和四个物理候选 Sample">
            <code>2 seeds</code><span>×</span><code>N = 2</code><span>=</span><strong>2 groups / 4 Samples</strong>
          </p>
        </header>

        <ol className="grouping-contact-sheet" aria-label="两个候选组">
          {chapter.groupingLabGroups.map((group) => (
            <li className="grouping-contact-row" key={group.id}>
              <section className="grouping-seed-sheet" aria-labelledby={`${group.id}-seed-title`}>
                <span>{group.originId} · seed occurrence</span>
                <h3 id={`${group.id}-seed-title`}>{group.prompt}</h3>
                <dl>
                  <div><dt>label</dt><dd><code>{group.label}</code></dd></div>
                  <div><dt>metadata</dt><dd><code>{JSON.stringify(group.metadata)}</code></dd></div>
                  <div><dt>identity</dt><dd><code>group_index=None · index=None</code></dd></div>
                </dl>
              </section>

              <div className="grouping-copy-gate" aria-label={`对 ${group.originId} 执行两次深拷贝`}>
                <code>for _ in range(2)</code>
                <strong>deepcopy</strong>
                <span aria-hidden="true">→</span>
              </div>

              <section className="grouping-output-group" aria-labelledby={`${group.id}-output-title`}>
                <header>
                  <h3 id={`${group.id}-output-title`}>group_index <code>{group.groupIndex}</code></h3>
                  <p>共享比较关系</p>
                </header>
                <ol>
                  {group.candidates.map((candidate, candidateIndex) => (
                    <li key={candidate.id}>
                      <header><strong>{candidate.id}</strong><span>candidate {candidateIndex}</span></header>
                      <dl>
                        <div><dt>group_index</dt><dd><code>{group.groupIndex}</code></dd></div>
                        <div><dt>index</dt><dd><code>{candidate.index}</code></dd></div>
                        <div><dt>prompt / label</dt><dd>与 {group.originId} 值相同</dd></div>
                        <div><dt>对象角色</dt><dd>由 {group.originId} 单独 <code>deepcopy</code> 得到的物理候选</dd></div>
                      </dl>
                    </li>
                  ))}
                </ol>
                <dl className="grouping-identity-checks">
                  {group.identityChecks.map((check) => (
                    <div key={check.expression}>
                      <dt><code>{check.expression}</code></dt>
                      <dd><strong>→ {check.result ? "True" : "False"}</strong><span>{check.meaning}</span></dd>
                    </div>
                  ))}
                </dl>
              </section>
            </li>
          ))}
        </ol>

        <footer className="grouping-fixture-note">
          <strong>关于这些名字与数字</strong>
          <p><code>origin-a / a0 / a1</code> 是课程 fixture 的关联键，不是 upstream Sample 字段。<code>0/1/2/3</code> 来自 fresh-counter 教学条件；恢复状态或后续调用可以从非零编号继续。</p>
        </footer>
      </section>

      <section className="grouping-counter-tape" aria-labelledby="grouping-counter-title">
        <header>
          <h2 id="grouping-counter-title">两个计数器怎样走完四拍</h2>
          <p><code>sample_index</code> 每个副本后递增；<code>sample_group_index</code> 只在整组完成后递增。</p>
        </header>
        <ol>
          {chapter.groupingCounterFrames.map((frame) => (
            <li key={frame.id}>
              <span>{String(frame.order).padStart(2, "0")}</span>
              <div className="grouping-counter-operation">
                <strong>{frame.operation}</strong>
                <p>{frame.explanation}</p>
              </div>
              <dl>
                <div><dt>before</dt><dd><code>G={frame.groupCounterBefore} · I={frame.sampleCounterBefore}</code></dd></div>
                <div><dt>write</dt><dd>{frame.writes.map((write) => <code key={write}>{write}</code>)}</dd></div>
                <div><dt>after</dt><dd><code>G={frame.groupCounterAfter} · I={frame.sampleCounterAfter}</code></dd></div>
              </dl>
            </li>
          ))}
        </ol>
        <p className="grouping-counter-formula">
          对调用前计数器 <code>G₀ / I₀</code>、第 <code>p</code> 个 seed 和组内第 <code>c</code> 个候选（<code>p</code>、<code>c</code> 均从 0 计数）：
          <strong><code>group_index = G₀ + p</code><code>index = I₀ + p × N + c</code></strong>
        </p>
      </section>

      <section className="grouping-contract" aria-labelledby="grouping-contract-title">
        <header>
          <h2 id="grouping-contract-title">同组，到底什么相同；什么必须不同</h2>
          <p>“共享条件”与“共享对象”不是一回事。下面每一行都把值关系和对象契约分开写。</p>
        </header>
        <div role="list">
          {chapter.groupingComparisonRules.map((rule) => (
            <article key={rule.id} role="listitem">
              <h3><code>{rule.subject}</code></h3>
              <dl>
                <div><dt>同组关系</dt><dd>{rule.withinGroup}</dd></div>
                <div><dt>对象契约</dt><dd>{rule.objectContract}</dd></div>
              </dl>
              <p>{rule.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grouping-alias-probe" aria-labelledby="grouping-alias-title">
        <header>
          <div>
            <h2 id="grouping-alias-title">别名试纸：只改 a0，谁会跟着变</h2>
            <p>初始时三份 metadata 的内容都显示 <code>difficulty=&quot;{probe.fixtureValue}&quot;</code>。下面的校正值仅用于页面内反事实实验。</p>
          </div>
          <button
            aria-pressed={probeApplied}
            type="button"
            onClick={() => setProbeApplied((current) => !current)}
          >
            {probeApplied ? "移除 a0 校正戳" : "在 a0 写入 audited"}
          </button>
        </header>

        <div className="grouping-equality-checks">
          <code>a0.metadata == a1.metadata <b>→ {probeApplied ? "False" : "True"}</b></code>
          <code>a0.metadata is a1.metadata <b>→ False</b></code>
        </div>

        <div className="grouping-probe-results">
          {probe.actualAfter.map((result) => {
            const displayedValue = probeApplied ? result.value : probe.fixtureValue;
            const changed = probeApplied && displayedValue === probe.mutatedValue;
            return (
              <article className={changed ? "is-stamped" : ""} key={result.sampleId}>
                <header><strong>{result.sampleId}</strong><span>{changed ? "已写入" : "未变化"}</span></header>
                <code>difficulty = &quot;{displayedValue}&quot;</code>
                <p>{probeApplied ? result.explanation : "实验尚未执行；当前仍是 fixture 初始值。"}</p>
              </article>
            );
          })}
        </div>

        <p className="grouping-probe-status" role="status" aria-live="polite">
          {probeApplied
            ? "a0 已写入 audited；a1 与 origin-a seed 保持 warmup。修改没有穿过对象边界。"
            : "别名探针已复位；a0、a1 与 origin-a seed 的 metadata 内容再次相同。"}
        </p>
        <aside>
          <strong>如果三者共享同一个 metadata 引用</strong>
          <p>{probe.counterfactualAfter.map((item) => `${item.sampleId}=${item.value}`).join(" · ")}。这正是 deepcopy 阻断的静默污染。</p>
          <small>{probe.boundary}</small>
        </aside>
      </section>

      <section className="grouping-sources" aria-labelledby="grouping-sources-title">
        <header>
          <h2 id="grouping-sources-title">源码底片：复制、编号与 fresh counter 起点</h2>
          <p>主摘录证明双层循环和写入顺序；两个折叠摘录分别核对身份默认值与新 DataSource 的计数器起点。</p>
        </header>
        <GroupingEvidence evidenceId={chapter.evidenceId} />
        <div className="grouping-source-supplements">
          {chapter.additionalEvidenceIds?.map((evidenceId) => {
            const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
            return (
              <details key={evidenceId}>
                <summary>{evidence?.title ?? evidenceId}</summary>
                <GroupingEvidence evidenceId={evidenceId} />
              </details>
            );
          })}
        </div>
      </section>

      {passed ? <p className="mechanism-passed-note">本章身份矩阵已经通过；你仍可复位别名试纸并重新推演。</p> : null}
      {exerciseSlot}

      <section className="grouping-correction" aria-labelledby="grouping-correction-title">
        <h2 id="grouping-correction-title">校正条</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      <nav className="grouping-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>← 返回字段生命周期</button>
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：SGLang 请求 →</button>
      </nav>
    </article>
  );
}
