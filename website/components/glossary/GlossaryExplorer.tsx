"use client";

import { useMemo, useState } from "react";

export type GlossaryTermView = {
  id: string;
  zhLabel: string;
  codeLabel: string;
  definition: string;
  disambiguation: string;
  avoid?: string;
  act?: string;
};

export function GlossaryExplorer({ terms }: { terms: GlossaryTermView[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return terms;
    return terms.filter((term) =>
      [term.zhLabel, term.codeLabel, term.definition, term.disambiguation]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, terms]);

  return (
    <>
      <div className="glossary-toolbar">
        <label className="sr-only" htmlFor="glossary-search">筛选术语</label>
        <input
          className="search-input"
          id="glossary-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="筛选：rollout、mask、权重……"
          type="search"
          value={query}
        />
        <span aria-live="polite" className="result-count">{visible.length} / {terms.length}</span>
      </div>
      {visible.length ? (
        <div className="glossary-list">
          {visible.map((term) => (
            <article className="term-card" id={term.id} key={term.id}>
              <div className="term-head">
                <div>
                  <h2>{term.zhLabel}</h2>
                  <span className="term-code">{term.codeLabel}</span>
                </div>
                {term.act ? <span className="tag">第 {term.act} 幕</span> : null}
              </div>
              <p>{term.definition}</p>
              <p><strong>区分：</strong>{term.disambiguation}</p>
              {term.avoid ? <p className="term-avoid"><strong>避免：</strong>{term.avoid}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">没有匹配术语。试试英文代码名或更短的关键词。</div>
      )}
    </>
  );
}
