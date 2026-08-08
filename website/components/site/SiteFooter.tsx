import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <Link className="brand brand-footer" href="/"><span className="brand-mark">s</span><span>slime Lab</span></Link>
          <p>一份关于 slime 的交互式系统教材。</p>
        </div>
        <div>
          <p className="footer-label">M1 baseline</p>
          <code>v0.3.1-1-g06ffdbe2</code>
        </div>
        <div className="footer-links">
          <Link href="/glossary">术语表</Link>
          <Link href="/source">源码地图</Link>
          <a href="https://github.com/THUDM/slime" rel="noreferrer" target="_blank">官方仓库 ↗</a>
        </div>
      </div>
    </footer>
  );
}
