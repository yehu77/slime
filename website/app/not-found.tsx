import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-shell page-intro">
      <p className="eyebrow">404 / route not found</p>
      <h1>这条学习路径还不存在。</h1>
      <p className="lead">M1 只发布已经可以完整学习的页面，不用空栏目假装内容很多。</p>
      <div className="button-row">
        <Link className="button button-primary" href="/">回到首页</Link>
        <Link className="button button-ghost" href="/learn/sample-journey">进入首课</Link>
      </div>
    </section>
  );
}
