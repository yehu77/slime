import assert from "node:assert/strict";
import test from "node:test";

const routes = [
  ["/", /可验证系统模型/],
  ["/start", /如何转化为参数更新/],
  ["/learn", /先把一条 Sample 的机制弄通/],
  ["/learn/sample-journey", /同样答对，为什么一个 Sample 完全不学习/],
  ["/learn/sample-to-generation", /Sample 如何得到回答/],
  ["/learn/sample-to-generation?chapter=row-to-sample", /一行数据怎样成为 Sample/],
  ["/learn/sample-to-generation?chapter=field-ownership", /字段生命周期接力台/],
  ["/learn/sample-to-generation?chapter=group-without-aliasing", /成组，但不粘连/],
  ["/learn/sample-to-generation?chapter=sample-to-request", /请求装配与边境检查台/],
  ["/learn/sample-to-generation?chapter=response-projection", /响应分轨场/],
  ["/learn/sample-to-generation?chapter=writeback-contract", /写回双时钟/],
  ["/learn/sample-to-generation?chapter=assessment", /综合终测：在陌生 trace 中找到第一处失真/],
  ["/learn/sample-to-generation?chapter=not-a-chapter", /没有名为“not-a-chapter”的章节/],
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
    const renderedText = html.replaceAll("<!-- -->", "");
    assert.match(renderedText, expected);
    assert.match(html, /<html[^>]+lang="zh-CN"/i);
    assert.match(html, /<main[^>]+id="main-content"/i);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
    if (route === "/start") {
      assert.match(html, /slime 是用于大语言模型强化学习后训练的框架/);
      assert.match(html, /这是入课前唯一一张完整总览/);
      assert.match(html, /3 分钟课前诊断/);
      assert.match(html, /开始首课/);
      assert.doesNotMatch(html, /下面先建立最小因果链，再进入字段与源码/);
    }
    if (route === "/learn/sample-journey") {
      assert.match(html, /核心阅读/);
      assert.match(html, /完整研究/);
      assert.match(html, /播放前先预测/);
      assert.match(html, /Sample 是统一中间表示，不是训练 batch/);
      assert.match(html, /同组候选由下一幕构造/);
      assert.match(html, /本幕产生的状态变化/);
      assert.match(html, /本幕术语/);
      assert.match(html, /深入证据/);
      assert.match(html, /完整路线，不在一门课里塞完/);
      assert.match(html, /七幕曝光轨/);
      assert.match(html, /上一事件/);
      assert.match(html, /下一事件/);
      assert.match(renderedText, /继续第 2 幕/);
      assert.match(html, /分组/);
      assert.doesNotMatch(html, /3 分钟课前诊断/);
    }
    if (route === "/learn/sample-to-generation?chapter=row-to-sample") {
      assert.match(renderedText, /Trace passport/);
      assert.match(renderedText, /连续字段翻译台/);
      assert.match(renderedText, /空白也是证据/);
      assert.match(renderedText, /正在恢复本章练习记录/);
      assert.match(renderedText, /下一生产者：/);
      assert.match(renderedText, /pending<\/code>\s*只表示这条 Sample 尚未被 generation 处理/);
      assert.doesNotMatch(renderedText, /STATEorigin-a 账本/);
    }
    if (route === "/learn/sample-to-generation?chapter=field-ownership") {
      assert.match(html, /class="[^"]*\bprovenance-reader\b/);
      assert.match(renderedText, /字段生命周期接力台/);
      assert.match(renderedText, /过早读取：三个诊断案例/);
      assert.match(renderedText, /接力终点不是“填满 Sample”，而是派生 TrainData/);
      assert.doesNotMatch(html, /mechanism-rail-state/);
      assert.equal(
        (renderedText.match(/打开 origin-a 状态账本/g) ?? []).length,
        1,
      );
    }
    if (route === "/learn/sample-to-generation?chapter=group-without-aliasing") {
      assert.match(html, /class="[^"]*\bgrouping-investigation-reader\b/);
      assert.match(renderedText, /教学假想故障/);
      assert.match(renderedText, /定向：先给事故定性/);
      assert.match(renderedText, /P \/ N \/ G \/ I/);
      assert.match(renderedText, /六行追踪/);
      assert.match(renderedText, /deepcopy/);
      assert.match(renderedText, /提交初判/);
      assert.doesNotMatch(renderedText, /实际 trace：逐行核对计数器读取与推进/);
      assert.doesNotMatch(renderedText, /冷案：非零计数器与重复题面/);
      assert.doesNotMatch(html, /mechanism-rail-state/);
      assert.equal(
        (renderedText.match(/打开 a0 分组后账本/g) ?? []).length,
        1,
      );
    }
    if (route === "/learn/sample-to-generation?chapter=sample-to-request") {
      assert.match(html, /class="[^"]*\brequest-reader\b/);
      assert.match(renderedText, /请求装配线：源码中的五个检查点/);
      assert.match(renderedText, /同一前缀，两处记录/);
      assert.match(renderedText, /边境申报单：每个字段去哪里/);
      assert.match(renderedText, /payload\.return_logprob/);
      assert.match(renderedText, /sample_id/);
      assert.match(renderedText, /只负责课程关联/);
      assert.match(renderedText, /生产者尚未运行/);
      assert.match(renderedText, /正在恢复本章练习记录/);
      assert.doesNotMatch(html, /mechanism-rail-state/);
      assert.equal(
        (renderedText.match(/打开 a0 请求前后账本/g) ?? []).length,
        1,
      );
    }
    if (route === "/learn/sample-to-generation?chapter=response-projection") {
      assert.match(html, /class="[^"]*\bresponse-reader\b/);
      assert.match(renderedText, /一份返回，两层记录/);
      assert.match(renderedText, /HTTP RESPONSE BODY/);
      assert.match(renderedText, /sample_id/);
      assert.match(renderedText, /不在 HTTP body 内/);
      assert.match(renderedText, /一个 tuple，分到两条保持同序的轨道/);
      assert.match(renderedText, /四种来源、八条证据轨/);
      assert.match(renderedText, /Sample 仍未过闸/);
      assert.match(renderedText, /Sample\.status/);
      assert.match(renderedText, /pending/);
      assert.match(renderedText, /正在恢复本章练习记录/);
      assert.doesNotMatch(html, /mechanism-rail-state/);
      assert.equal(
        (renderedText.match(/打开 a0 响应前账本/g) ?? []).length,
        1,
      );
    }
    if (route === "/learn/sample-to-generation?chapter=writeback-contract") {
      assert.match(html, /class="[^"]*\bwriteback-reader\b/);
      assert.match(renderedText, /两套 token 坐标/);
      assert.match(renderedText, /完整序列时钟/);
      assert.match(renderedText, /回答时钟/);
      assert.match(renderedText, /契约总账/);
      assert.match(renderedText, /生产 Sample 写回是原地 mutation/);
      assert.match(renderedText, /课程 reducer 的 copy-on-write/);
      assert.match(renderedText, /stop 表示正常停止，不表示回答正确/);
      assert.match(html, /<dt>reward<\/dt><dd>None/);
      assert.match(renderedText, /正在恢复本章练习记录/);
      assert.doesNotMatch(html, /mechanism-rail-state/);
      assert.equal(
        (renderedText.match(/打开 a0 写回账本/g) ?? []).length,
        1,
      );
    }
    if (route === "/learn/sample-to-generation?chapter=assessment") {
      assert.match(html, /class="[^"]*\bfinal-trace-reader\b/);
      assert.match(renderedText, /综合终测：在陌生 trace 中找到第一处失真/);
      assert.match(renderedText, /新样片只允许一个首错/);
      assert.match(renderedText, /assessment-orion-v1/);
      assert.match(renderedText, /origin-c/);
      assert.match(renderedText, /payload\.input_ids/);
      assert.match(renderedText, /token 45/);
      assert.match(renderedText, /八个观察共用上面的同一条 trace/);
      assert.doesNotMatch(html, /class="[^"]*\bmechanism-assessment-grid\b/);
      assert.doesNotMatch(html, /class="[^"]*\bmechanism-assessment-item\b/);
    }
  });
}
