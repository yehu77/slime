import type { Metadata } from "next";
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
  "sample.append-response-tokens",
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

const actLabels: Record<string, string> = {
  "act-1": "第一幕 / 出生",
  "act-2": "第二幕 / 分组",
  "act-3": "第三幕 / 生成",
  "act-4": "第四幕 / 评价",
  "act-5": "第五幕 / 交接",
  "act-6": "第六幕 / 训练",
  "act-7": "第七幕 / 回流",
  "source-map": "Contract test",
};

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
              这里不是全仓库浏览器，只收首课真正依赖的 production symbol 与 contract test。行号服务于展示，symbol 才是稳定身份。
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
          <strong>证据分层：</strong>源码证明实现边界；CPU contract test 在固定 commit 上以 0 GPU 运行，当前 {cpuEvidence.result.passed}/{cpuEvidence.result.passed} 通过；教学 fixture 只证明本站交互自身的一致性。
        </div>
        <div className="source-map" style={{ marginTop: 24 }}>
          {refs.map((ref) => {
            const anchor = anchors.get(ref.id);
            const act = ref.lesson_uses.find((use) => use.startsWith("act-")) ?? ref.lesson_uses[0];
            return (
              <article className="source-card" id={ref.id} key={ref.id}>
                <span className="source-act">{actLabels[act] ?? act}</span>
                <div>
                  <h2>{ref.claim}</h2>
                  {"caveat" in ref ? <p>{ref.caveat}</p> : null}
                </div>
                <div className="source-symbol">
                  <code>{ref.symbol}</code>
                  <span className="evidence-pill">
                    {ref.kind === "contract-test" ? "CPU CONTRACT" : "PRODUCTION SOURCE"}
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
