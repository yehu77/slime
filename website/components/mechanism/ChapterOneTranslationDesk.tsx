"use client";

import { useState, type ReactNode, type RefObject } from "react";

import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import {
  sampleToGenerationCourse,
} from "../../content/zh/lessons/sample-to-generation";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterOneTranslationChapter } from "./chapter-reader-contracts";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type TranslationSegment = "source" | "rule" | "target";

type ChapterOneTranslationDeskProps = {
  chapter: ChapterOneTranslationChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  exerciseSlot: ReactNode;
  passed: boolean;
  onOpenDrawer: () => void;
  onNext: () => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

function SourceEvidence({ evidenceId }: { evidenceId: string }) {
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

export function ChapterOneTranslationDesk({
  chapter,
  headingRef,
  triggerRef,
  exerciseSlot,
  passed,
  onOpenDrawer,
  onNext,
}: ChapterOneTranslationDeskProps) {
  const [emphasis, setEmphasis] = useState<TranslationSegment>("rule");
  const passport = chapter.tracePassport;
  const mappingLanes = chapter.mappingLanes;
  const fieldGroups = chapter.defaultFieldGroups;

  return (
    <article className="translation-reader" aria-labelledby="mechanism-chapter-title">
      <header className="translation-opening">
        <div className="translation-opening-copy">
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p className="translation-observation-end">
            <strong>观察终点</strong>
            {chapter.conclusion}
          </p>
        </div>
        <figure>
          <img src={chapter.imageSrc} alt={chapter.imageAlt ?? ""} loading="eager" />
          <figcaption>origin-a · Dataset 构造边界 · {chapter.durationMinutes} min</figcaption>
        </figure>
      </header>

      <section className="trace-passport" aria-labelledby="trace-passport-title">
        <header>
          <h2 id="trace-passport-title">Trace passport</h2>
          <p><strong>完成标准</strong>{chapter.objective}</p>
        </header>
        <dl>
          <div className="trace-passport-origin">
            <dt>观察对象</dt>
            <dd>
              <strong>{passport.origin.id}</strong>
              <small>教学 fixture 关联键；不是 upstream Sample 字段</small>
              <code title={passport.origin.rowCode}>{passport.origin.rowShape}</code>
            </dd>
          </div>
          <div className="trace-passport-config">
            <dt>关键配置</dt>
            <dd>
              {passport.config.map((entry) => (
                <span key={entry.key}><code>{entry.key}</code><b>{entry.value}</b></span>
              ))}
            </dd>
          </div>
          <div className="trace-passport-stop">
            <dt>停止位置</dt>
            <dd>{passport.stopAt}</dd>
          </div>
        </dl>
      </section>

      <section className="translation-desk" aria-labelledby="translation-desk-title">
        <header>
          <div>
            <h2 id="translation-desk-title">连续字段翻译台</h2>
            <p>三列始终可见；点击只改变强调层。</p>
          </div>
          <div className="translation-legend" aria-label="当前强调层">
            {(["source", "rule", "target"] as const).map((segment) => (
              <button
                aria-pressed={emphasis === segment}
                key={segment}
                onClick={() => setEmphasis(segment)}
                type="button"
              >
                {segment}
              </button>
            ))}
          </div>
        </header>
        <div className="translation-lanes" data-emphasis={emphasis}>
          <div className="translation-column-heads" aria-hidden="true">
            <span>ROW / CALL</span><span>DATASET RULE</span><span>SAMPLE PROJECTION</span>
          </div>
          {mappingLanes.map((lane) => (
            <section className={`translation-lane translation-lane-${lane.id}`} key={lane.id} aria-label={`${lane.source.code} 到 ${lane.target.label}`}>
              <button aria-pressed={emphasis === "source"} className="translation-cell translation-source" type="button" onClick={() => setEmphasis("source")} onFocus={() => setEmphasis("source")}>
                <small>{lane.source.label}</small>
                <code>{lane.source.code}</code>
                <span>{lane.source.value}</span>
              </button>
              <button aria-pressed={emphasis === "rule"} className="translation-cell translation-rule" type="button" onClick={() => setEmphasis("rule")} onFocus={() => setEmphasis("rule")}>
                <small>{lane.rule.label}</small>
                <code>{lane.rule.code}</code>
                <span>{lane.rule.explanation}</span>
              </button>
              <button aria-pressed={emphasis === "target"} className="translation-cell translation-target" type="button" onClick={() => setEmphasis("target")} onFocus={() => setEmphasis("target")}>
                <small>{lane.target.label}</small>
                <span className="translation-target-fields">
                  {lane.target.fields.map((field) => (
                    <span key={field.field}><code>{field.field}</code><b>{field.value}</b></span>
                  ))}
                </span>
              </button>
            </section>
          ))}
        </div>
        <footer className="translation-desk-footer">
          <span><strong>Sample projection / origin-a</strong>查看本课持续追踪字段的来源与当前观察点。</span>
          <button className="mechanism-state-trigger" ref={triggerRef} type="button" onClick={onOpenDrawer}>
            打开 origin-a 状态账本
          </button>
        </footer>
      </section>

      <section className="blank-evidence" aria-labelledby="blank-evidence-title">
        <header>
          <div>
            <h2 id="blank-evidence-title">空白也是证据</h2>
            <p>先分清显式参数与 dataclass 默认值，再追问下一生产者。此处仅展示课程投影。</p>
          </div>
        </header>
        <div className="blank-evidence-groups">
          {fieldGroups.map((group) => (
            <section className={`blank-evidence-group blank-evidence-${group.id}`} key={group.id}>
              <header><h3>{group.title}</h3><p>{group.summary}</p></header>
              <dl>
                {group.fields.map((field) => (
                  <div key={field.field}>
                    <dt><code>{field.field}</code><b>{field.value}</b></dt>
                    <dd>
                      <span>{field.interpretation}</span>
                      {field.nextProducer ? <small>下一生产者：<strong>{field.nextProducer}</strong></small> : null}
                    </dd>
                  </div>
                ))}
              </dl>
              {group.id === "dataclass-default" ? (
                <p className="pending-correction"><code>pending</code> 只表示这条 Sample 尚未被 generation 处理；它不表示回答正确，甚至此刻还没有回答。</p>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      <section className="translation-sources" aria-labelledby="translation-sources-title">
        <header>
          <h2 id="translation-sources-title">源码摘录：先核对调用，再核对默认值</h2>
          <p>两个摘录固定在同一 upstream commit；默认只展开决定显式传入参数的 Dataset 调用。</p>
        </header>
        <details open>
          <summary>Dataset：Sample(...) 显式传入了什么</summary>
          <SourceEvidence evidenceId={chapter.evidenceId} />
        </details>
        <details>
          <summary>dataclass：缺席参数采用什么默认值</summary>
          {chapter.additionalEvidenceIds?.map((evidenceId) => (
            <SourceEvidence evidenceId={evidenceId} key={evidenceId} />
          ))}
        </details>
      </section>

      {passed ? <p className="mechanism-passed-note">本章迁移练习已经通过；你仍可重新推演。</p> : null}
      {exerciseSlot}

      <section className="translation-correction" aria-labelledby="translation-correction-title">
        <h2 id="translation-correction-title">校正条</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      {chapter.branch ? (
        <details className="translation-branch">
          <summary>{chapter.branch.title}</summary>
          <p>{chapter.branch.body}</p>
          <dl>
            {chapter.branch.edgeCases.map((edgeCase) => (
              <div key={edgeCase.condition}><dt>{edgeCase.condition}</dt><dd>{edgeCase.behavior}</dd></div>
            ))}
          </dl>
        </details>
      ) : null}

      <nav className="translation-next" aria-label="章节翻页">
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：字段责任 →</button>
      </nav>
    </article>
  );
}
