type GuidedEvidence = {
  id: string;
  title: string;
  sourceRefId: string;
  claim: string;
  focus: readonly string[];
  boundary: string;
};

type GuidedSourceExcerptProps = {
  evidence: GuidedEvidence;
  sourceUrl?: string;
  symbol?: string;
  code?: string;
  lineStart?: number;
};

export function GuidedSourceExcerpt({
  evidence,
  sourceUrl,
  symbol,
  code,
  lineStart,
}: GuidedSourceExcerptProps) {
  const sourceLines = code?.split("\n") ?? evidence.focus;
  return (
    <section
      className="mechanism-source"
      id={`evidence-${evidence.id}`}
      aria-labelledby={`evidence-title-${evidence.id}`}
    >
      <header>
        <span>固定提交证据</span>
        <h2 id={`evidence-title-${evidence.id}`}>{evidence.title}</h2>
        <p>{evidence.claim}</p>
      </header>
      <div className="mechanism-source-chain" aria-label="源码调用链">
        <b>输入状态</b>
        <i aria-hidden="true" />
        <b>{symbol ?? evidence.sourceRefId}</b>
        <i aria-hidden="true" />
        <b>字段变化</b>
      </div>
      <pre aria-label={`${evidence.title} 关键源码片段`}>
        <code>
          {sourceLines.map((line, index) => (
            <span key={`${evidence.id}-${index}`}>
              <em>{String((lineStart ?? 1) + index).padStart(3, "0")}</em>
              {line}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
      <footer>
        <p>
          <strong>证据边界：</strong>
          {evidence.boundary}
        </p>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            在固定 commit 中核对完整函数
          </a>
        ) : (
          <a href={`/source#${evidence.sourceRefId}`}>在源码地图中核对</a>
        )}
      </footer>
    </section>
  );
}
