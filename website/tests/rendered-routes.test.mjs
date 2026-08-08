import assert from "node:assert/strict";
import test from "node:test";

const routes = [
  ["/", /把 slime 从训练脚本/],
  ["/start", /先修自测/],
  ["/learn/sample-journey", /一条 Sample 的旅程/],
  ["/glossary", /术语/],
  ["/source", /源码/],
];

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

for (const [route, expected] of routes) {
  test(`server renders ${route}`, async () => {
    const worker = await loadWorker();
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /<html[^>]+lang="zh-CN"/i);
    assert.match(html, /<main[^>]+id="main-content"/i);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  });
}
