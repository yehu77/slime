"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="page-shell page-intro" role="alert">
      <p className="eyebrow">recoverable error</p>
      <h1>这一页没有正确加载。</h1>
      <p className="lead">你的学习进度仍保存在当前设备。可以重试，或回到首课重新进入。</p>
      <div className="button-row">
        <button className="button button-primary" onClick={reset} type="button">重新加载</button>
        <a className="button button-ghost" href="/learn/sample-journey">返回首课</a>
      </div>
    </section>
  );
}
