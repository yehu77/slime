const nav = [
  ["开始", "/start"],
  ["课程", "/learn"],
  ["术语", "/glossary"],
  ["源码", "/source"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner page-shell">
        <a className="brand" href="/" aria-label="slime Lab 首页">
          <span className="brand-wordmark">slime Lab</span>
          <small>Mechanism curriculum / M1</small>
        </a>
        <nav aria-label="主导航">
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <a
          aria-label="在新窗口打开 THUDM/slime GitHub 源码仓库"
          className="source-link"
          href="https://github.com/THUDM/slime"
          rel="noreferrer"
          target="_blank"
        >
          <span>THUDM/slime</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
        </a>
      </div>
    </header>
  );
}
