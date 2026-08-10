import assert from "node:assert/strict";
import test from "node:test";

const routes = [
  ["/", /把 slime 从训练脚本/],
  ["/start", /如何走进训练/],
  ["/learn/sample-journey", /学完后，再检查四个基础概念/],
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
    if (route === "/start") {
      assert.match(html, /接下来，跟着这条回答继续往下走/);
      assert.match(html, /开始首课/);
      assert.doesNotMatch(html, /看一条回答怎样变成一次模型更新/);
    }
    if (route === "/learn/sample-journey") {
      assert.match(html, /它最初只是一道题/);
      assert.match(html, /先别急着记字段。先看它走完全程/);
      assert.match(html, /一行 JSON，刚刚走进 slime/);
      assert.match(html, /四条候选将在第二幕出现/);
      assert.match(html, /这一幕，记录发生了什么/);
    }
  });
}
