import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "../components/site/SiteFooter";
import { SiteHeader } from "../components/site/SiteHeader";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const requestedHost = requestHeaders.get("host")?.trim();
  const host = requestedHost && /^(?:localhost|\[::1\]|[a-z0-9.-]+)(?::\d{1,5})?$/i.test(requestedHost)
    ? requestedHost
    : "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("[::1]") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const socialImage = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "slime Lab — 把训练脚本变成你能解释的系统",
      template: "%s · slime Lab",
    },
    description:
      "用交互式闭环、Sample 字段追踪、源码锚点和可验证实验，深入理解 slime。",
    applicationName: "slime Lab",
    keywords: ["slime", "RL", "强化学习", "SGLang", "Megatron", "教程"],
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: "slime Lab",
      title: "slime Lab — 从训练脚本建立可验证系统模型",
      description: "沿一条 Sample 的状态变化，理解 rollout、训练与权重发布边界。",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "slime Lab 训练闭环" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "slime Lab",
      description: "沿一条 Sample 的状态变化，理解 slime 的完整训练闭环。",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <template
          data-impeccable-contract="5bc72fe8"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: 一条 Sample 作为固定观察对象贯穿七张关键原画；拒绝通用文档站的英雄区与圆角卡片阵列。
OWN-WORLD: 原画纸白、蓝图海军蓝、校正红、注册蓝与状态黄；界面由曝光表、赛璐璐层、装订孔和铅笔批注组成。
STORY: 初学者先看见完整闭环，再检查同一条 Sample 的状态演化，并能回到字段与源码核对。
FIRST VIEWPORT: 左侧标题原画纸与右侧关键 cel 等高相邻，唯一主操作嵌入 Act 01；下方七幕曝光表完整贯通并露出课程第二折，首课收为单一阅读舞台与可唤出的 Sample 透写台。
FORM: 七幕原画台，方向候选第 1 位，seed 5bc72fe8。
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        <a className="skip-link" href="#main-content">
          跳到正文
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
