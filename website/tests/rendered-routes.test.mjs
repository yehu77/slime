import assert from "node:assert/strict";
import test from "node:test";

const routes = [
  ["/", /可验证系统模型/],
  ["/start", /如何转化为参数更新/],
  ["/learn", /先把一条 Sample 的机制弄通/],
  ["/learn/sample-journey", /训练完成，生成侧仍报告 actor@0/],
  ["/learn/sample-journey?unit=loop-boundary", /训练完成，生成侧仍报告 actor@0/],
  ["/learn/sample-journey?unit=stable-skeleton", /稳定交接骨架/],
  ["/learn/sample-journey?unit=backend-roles", /Megatron、SGLang 与 Ray 为什么不能画成一个方框/],
  ["/learn/sample-journey?unit=placement-and-time", /资源放置与时间重叠是两道不同的问题/],
  ["/learn/sample-journey?unit=sample-probe", /七站 Sample 观测路径/],
  ["/learn/sample-journey?unit=architecture-reconstruction", /从事故记录重建架构边界/],
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
      assert.match(html, /先辨认生成、评价整理、训练发布三个阶段/);
      assert.match(html, /3 分钟课前诊断/);
      assert.match(html, /进入系统导论/);
      assert.doesNotMatch(html, /下面先建立最小因果链，再进入字段与源码/);
    }
    if (route.startsWith("/learn/sample-journey")) {
      assert.match(html, /HYPOTHETICAL \/ 非真实运行日志/);
      assert.match(html, /稳定交接骨架/);
      assert.match(html, /固定异步入口不支持/);
      assert.match(html, /Sample 是观测探针，不是整套分布式系统的快照/);
      assert.match(html, /七站 Sample 观测路径/);
      assert.match(html, /打开 Sample 显微镜/);
      assert.match(html, /综合终测：让证据替组件名说话/);
      assert.match(html, /进入第一门机制课/);
      assert.match(html, /作者资料解释设计目的，固定 commit 约束实现事实/);
      assert.match(html, /固定源码/);
      assert.match(html, /作者意图/);
      assert.match(html, /教学推论/);
      assert.doesNotMatch(html, /同样答对，为什么一个 Sample 完全不学习/);
      assert.doesNotMatch(html, /七幕曝光轨/);
      assert.doesNotMatch(html, /3 分钟课前诊断/);
      assert.equal((html.match(/<main\b/g) ?? []).length, 1);
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
