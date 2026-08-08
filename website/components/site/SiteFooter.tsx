export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <a className="brand brand-footer" href="/"><span className="brand-mark">s</span><span>slime Lab</span></a>
          <p>一份关于 slime 的交互式系统教材。</p>
        </div>
        <div>
          <p className="footer-label">M1 baseline</p>
          <code>v0.3.1-1-g06ffdbe2</code>
        </div>
        <div className="footer-links">
          <a href="/glossary">术语表</a>
          <a href="/source">源码地图</a>
          <a href="https://github.com/THUDM/slime" rel="noreferrer" target="_blank">官方仓库 ↗</a>
        </div>
      </div>
    </footer>
  );
}
