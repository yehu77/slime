import type { Metadata } from "next";
import { GlossaryExplorer } from "../../components/glossary/GlossaryExplorer";
import { glossaryTerms } from "../../content/zh/glossary";

export const metadata: Metadata = {
  title: "术语表",
  description: "首课涉及的 slime 系统术语、代码名与常见混淆。",
};

export default function GlossaryPage() {
  const terms = glossaryTerms.map((term) => ({
    id: term.id,
    zhLabel: term.zhLabel,
    codeLabel: term.codeLabel,
    definition: term.definition,
    disambiguation: term.disambiguation,
    avoid: term.avoid.length ? term.avoid.join("、") : undefined,
    act: term.usedBy.find((item) => item.startsWith("act-"))?.replace("act-", ""),
  }));

  return (
    <>
      <header className="page-intro">
        <div className="page-shell page-intro-grid">
          <div>
            <p className="eyebrow">GLOSSARY / lesson-scoped</p>
            <h1>先把相似的词，<br />放回不同的边界。</h1>
            <p className="lead">
              M1 只收录《一条 Sample 的旅程》真正使用的术语。中文帮助理解，代码名保持可搜索。
            </p>
          </div>
          <div className="intro-meta">
            <div><span>范围</span><strong>CORE / 001</strong></div>
            <div><span>术语</span><strong>{terms.length} TERMS</strong></div>
            <div><span>原则</span><strong>CONTEXT FIRST</strong></div>
          </div>
        </div>
      </header>
      <section className="page-shell content-section">
        <GlossaryExplorer terms={terms} />
      </section>
    </>
  );
}
