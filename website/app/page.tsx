import type { Metadata } from "next";
import { siteCopy } from "../content/zh";
import "./studio.css";

export const metadata: Metadata = {
  title: "slime 训练闭环与系统边界",
};

const acts = [
  { number: "01", actor: "Dataset", scene: "外部记录映射为 Sample", image: "/art/home-library-act-01.webp", position: "68% 50%", mark: "SC.01 / PL.01" },
  { number: "02", actor: "DataSource", scene: "构造同组独立候选", image: "/art/home-library-act-02.webp?v=2", position: "50% 50%", mark: "SC.02 / PL.05" },
  { number: "03", actor: "SGLang", scene: "写回 response 与生成证据", image: "/art/home-library-act-03.webp", position: "65% 50%", mark: "SC.03 / PL.11" },
  { number: "04", actor: "Reward", scene: "写入 reward，保留完整 group", image: "/art/home-library-act-04.webp?v=2", position: "50% 48%", mark: "SC.04 / PL.23" },
  { number: "05", actor: "RolloutManager", scene: "显式转换并构造 schedule", image: "/art/home-library-act-05.webp", position: "50% 56%", mark: "SC.05 / PL.29" },
  { number: "06", actor: "Megatron actor", scene: "消费 train data，更新 actor", image: "/art/home-library-act-06.webp?v=2", position: "43% 50%", mark: "SC.06 / PL.35" },
  { number: "07", actor: "Weight sync", scene: "发布权重供后续 rollout 使用", image: "/art/home-library-act-07.webp", position: "50% 50%", mark: "SC.07 / TOTAL" },
] as const;

export default function Home() {
  return (
    <div className="studio-home">
      <section className="studio-home-layout" aria-labelledby="home-title">
        <div className="studio-home-opening">
          <article className="studio-home-copy-sheet">
            <div className="studio-home-sheet-fields" aria-hidden="true">
              <span>TITLE.</span><span>NO.</span><span>S.</span><span>C.</span>
            </div>
            <h1 id="home-title">把 slime<br />从训练脚本，<br />变成你能解释的系统。</h1>
            <p className="studio-home-premise">
              跟随一条 <strong>Sample</strong><br />穿越七个技术环节，理解一个可复现的强化学习系统如何运作。
            </p>
            <dl className="studio-home-facts" aria-label="课程信息">
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.5 2" /></svg>
                  核心阅读
                </dt>
                <dd>25–30 分钟</dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="9" cy="18" r="2" /><path d="M7.8 7.1 15.9 7M7.1 7.8l1.4 8.1" /></svg>
                  固定源码基线
                </dt>
                <dd>06ffdbe2</dd>
              </div>
            </dl>
            <span className="studio-home-pencil-note" aria-hidden="true">BL 100%<br /><i>SAFE</i></span>
            <span className="studio-home-cross is-left" aria-hidden="true" />
            <span className="studio-home-cross is-right" aria-hidden="true" />
          </article>

          <figure className="studio-home-key-cel">
            <span className="studio-home-cel-holes" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <img
              src="/art/library-hero-v1.webp"
              alt="窗边读者手持书本，观察暮色中的城市系统与交错线路"
              width="1440"
              height="810"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{ objectPosition: "42% 50%" }}
            />
            <figcaption><span>KEY FRAME</span><strong>同一条 Sample，穿过七个系统边界。</strong></figcaption>
            <span className="studio-home-cel-tape" aria-hidden="true" />
            <span className="studio-home-cel-note" aria-hidden="true">A1<br /><i>BG / BOOK</i></span>
          </figure>
        </div>

        <section className="studio-home-exposure" aria-labelledby="exposure-title">
          <h2 className="studio-home-visually-hidden" id="exposure-title">一条 Sample 的七阶段状态演化</h2>
          <div className="studio-home-exposure-scroll" role="region" aria-label="七幕曝光表，可横向浏览">
            <div className="studio-home-exposure-sheet">
              <div className="studio-home-exposure-label" aria-hidden="true">
                <strong>ACT.</strong><svg viewBox="0 0 28 10"><path d="M1 5h23M19 1l5 4-5 4" /></svg>
              </div>
              <ol>
                {acts.map((act, index) => (
                  <li key={act.actor}>
                    <header><span>{act.number}</span><strong>{act.actor}</strong></header>
                    <figure>
                      <img
                        src={act.image}
                        alt=""
                        width="640"
                        height="360"
                        loading="eager"
                        decoding="async"
                        style={{ objectPosition: act.position }}
                      />
                      <span className="studio-home-sample-register" aria-hidden="true"><i />SAMPLE A0</span>
                      {index === 0 ? (
                        <a className="studio-home-act-action" href={siteCopy.primaryCta.href}>
                          <span>{siteCopy.primaryCta.label}</span>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M14 7l5 5-5 5" /></svg>
                        </a>
                      ) : null}
                    </figure>
                    <p>{act.scene}</p>
                    <footer><span>{act.mark.split(" / ")[0]}</span><span>{act.mark.split(" / ")[1]}</span></footer>
                  </li>
                ))}
              </ol>
              <div className="studio-home-exposure-index" aria-hidden="true">
                <span>EXPOSURE SHEET<br /><strong>SLIME LAB / SAMPLE JOURNEY</strong></span>
                <i />
                <span>TOTAL<br /><strong>(7 ACTS)</strong></span>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="studio-home-course" aria-labelledby="course-intro-title">
        <figure className="studio-home-course-reference">
          <img src="/art/library-act-03-v1.webp" alt="研究者坐在多屏控制台前观察生成过程的参考画面" width="1600" height="900" loading="lazy" decoding="async" />
          <figcaption>LAYOUT REFERENCE / SAMPLE STATE</figcaption>
        </figure>
        <article className="studio-home-course-paper">
          <h2 id="course-intro-title">课程简介</h2>
          <p>首课持续跟踪同一条 Sample。学完后，你应该能够解释一次模型回答怎样经过评价、训练数据转换与参数更新，并指出新权重何时才对下一轮生成可见。</p>
          <p>核心路径不需要 GPU；想进一步核对时，再展开固定 commit 的源码证据、教学 fixture、事件文字稿与实验工具。</p>
          <ul>
            <li>确定性教学示例</li>
            <li>结论可回到源码核对</li>
            <li>进度仅存在本地浏览器</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
