# slime Lab

slime Lab 是一个面向研究者与工程师的中文交互式学习站。M1 课程「一条 Sample 的旅程」沿固定源码基线，解释一行数据如何经过 rollout、reward、训练数据转换、Megatron 训练与权重同步，最终闭合 slime 训练循环。

## 本地运行

需要 Node.js `>=22.13.0`，以及 Python `>=3.10`（仅用于重新生成源码锚点）。

```bash
npm install
npm run dev
```

开发地址为 <http://localhost:3000>。

## 验证

```bash
npm run typecheck
npm run lint
npm test
npm run check:safety
npm run check:sources
npm run build
npm run test:rendered
```

源码证据绑定到 slime commit `06ffdbe22be068b52f9ed0fc318c473f7030197e`。修改 `data/source-refs/slime-06ffdbe2.refs.json` 后，运行：

```bash
python3 scripts/generate-source-anchors.py
```

生成文件中的行号与摘要用于检测源码漂移；稳定身份由 ref id、commit、path 与 symbol 共同确定。

## 内容边界

- `content/zh/`：课程、先修检查、术语与站点文案。
- `data/fixtures/`：确定性的教学数据，不代表性能实测。
- `data/source-refs/`：固定 commit 的 production symbol 与 contract test。
- `core/journey/`：课程播放器的领域状态、reducer 与不变量。
- `components/journey/`：交互课程、显微镜、batch 计算器和同步/异步时间线。

学习进度仅保存在访问者浏览器的 `localStorage` 中；M1 不采集账户或服务器端学习数据。

## Cloudflare Workers 发布

生产站从个人 GitHub fork 自动部署。Cloudflare Workers Builds 使用以下设置：

| 设置 | 值 |
| --- | --- |
| Worker 名称 | `slime-lab` |
| 生产分支 | `main` |
| Root directory | `website` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` |

当前 M1 不需要运行时变量、secret、D1、R2 或 Images binding。生产分支发布到公开的 `workers.dev` 地址，其他分支只生成预览版本。
