import type { Metadata } from "next";
import {
  sourceActLabels,
  sourceEvidenceBoundaries,
  sourceRefLabels,
} from "../../content/zh";
import cpuEvidence from "../../data/evidence/slime-06ffdbe2.cpu.generated.json";
import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import refsPayload from "../../data/source-refs/slime-06ffdbe2.refs.json";

export const metadata: Metadata = {
  title: "源码地图",
  description: "把首课概念映射到固定版本的 slime symbol 与 contract test。",
};

const visibleIds = new Set([
  "sample.dataclass",
  "dataset.construct-sample",
  "rollout.datasource-get-samples",
  "rollout.generate",
  "rollout.prepare-prompt-ids",
  "rollout.generate-state-init",
  "sample.append-response-tokens",
  "sample.apply-meta-info",
  "sample.validate-response-metadata-lengths",
  "rollout.generate-and-rm",
  "rollout.post-process-rewards",
  "rollout.convert-train-data",
  "schedule.build-dp-schedule",
  "actor.train",
  "loop.sync",
  "loop.async",
  "actor.update-weights",
  "test.sample-contract",
  "test.dp-schedule-contract",
]);

type AnchorShape = {
  id?: string;
  ref_id?: string;
  url: string;
};

export default function SourcePage() {
  const anchors = new Map(
    (anchorsPayload.anchors as AnchorShape[]).map((anchor) => [anchor.id ?? anchor.ref_id ?? "", anchor]),
  );
  const refs = refsPayload.refs.filter((ref) => visibleIds.has(ref.id));

  return (
    <>
      <header className="page-intro">
        <div className="page-shell page-intro-grid">
          <div>
            <p className="eyebrow">SOURCE MAP / fixed evidence</p>
            <h1>每个系统结论，<br />都应该能找到证据。</h1>
            <p className="lead">
              这里不是全仓库浏览器，而是首课结论的证据索引。每个条目依次说明结论、稳定 symbol、证据类型与适用边界；行号只服务于展示。
            </p>
          </div>
          <div className="intro-meta">
            <div><span>基线</span><strong>06ffdbe2</strong></div>
            <div><span>策略</span><strong>SYMBOL FIRST</strong></div>
            <div><span>范围</span><strong>{refs.length} REFS · {cpuEvidence.result.passed} TESTS</strong></div>
          </div>
        </div>
      </header>

      <section className="page-shell content-section">
        <div className="notice">
          <strong>如何阅读：</strong>生产源码用于确认实现边界；CPU 契约测试在固定 commit 上以 0 GPU 运行，当前 {cpuEvidence.result.passed}/{cpuEvidence.result.passed} 通过；教学 fixture 只验证本站实例内部一致性，不构成性能结论。
        </div>
        <div className="source-map" style={{ marginTop: 24 }}>
          {refs.map((ref) => {
            const anchor = anchors.get(ref.id);
            const act = ref.lesson_uses.find((use) => use.startsWith("act-")) ?? ref.lesson_uses[0];
            const label = sourceRefLabels[ref.id];
            const boundary = "caveat" in ref
              ? ref.caveat
              : sourceEvidenceBoundaries[ref.kind];
            return (
              <article className="source-card" id={ref.id} key={ref.id}>
                <span className="source-act">{sourceActLabels[act] ?? act}</span>
                <div>
                  <h2>{label?.title ?? ref.claim}</h2>
                  <p><strong>结论：</strong>{ref.claim}</p>
                  <p><strong>适用边界：</strong>{boundary}</p>
                </div>
                <div className="source-symbol">
                  <span className="source-act">SYMBOL</span>
                  <code>{label?.symbol ?? ref.symbol}</code>
                  <span className="evidence-pill">
                    {label?.evidenceTypeLabel ?? (ref.kind === "contract-test" ? "CPU 契约测试" : "生产源码")}
                  </span>
                </div>
                {anchor ? (
                  <a className="external-arrow" href={anchor.url} rel="noreferrer" target="_blank" aria-label={`打开 ${ref.symbol} 源码`}>↗</a>
                ) : <span>—</span>}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
