import Link from "next/link";

const nav = [
  ["开始", "/start"],
  ["首课", "/learn/sample-journey"],
  ["术语", "/glossary"],
  ["源码", "/source"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner page-shell">
        <Link className="brand" href="/" aria-label="slime Lab 首页">
          <span className="brand-mark" aria-hidden="true">s</span>
          <span>slime Lab</span>
          <small>beta / 0.1</small>
        </Link>
        <nav aria-label="主导航">
          {nav.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <a className="source-link" href="https://github.com/THUDM/slime" rel="noreferrer" target="_blank">
          THUDM/slime <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}
