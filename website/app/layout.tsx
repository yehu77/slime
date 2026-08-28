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
      "用架构边界、Sample 观测、源码锚点和可验证练习，建立对 slime 的系统理解。",
    applicationName: "slime Lab",
    keywords: ["slime", "RL", "强化学习", "SGLang", "Megatron", "教程"],
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: "slime Lab",
      title: "slime Lab — 从训练脚本建立可验证系统模型",
      description: "从系统边界到 Sample 状态变化，理解 rollout、训练与权重发布如何接成闭环。",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "slime Lab 训练闭环" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "slime Lab",
      description: "从系统边界到 Sample 状态变化，建立可由源码核验的 slime 训练闭环模型。",
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
          data-impeccable-contract="1f848e47"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: slime Lab 用可核验的系统边界组织课程；Sample 是观察探针，不是整套架构的替身。
OWN-WORLD: 原画纸白、深海军蓝、校正红、注册蓝与状态黄；页面像一张正在装配和审读的动画工程长卷。
STORY: 初学者从 actor@0 事故进入，依次装配骨架、角色、两条轴与 Sample 探针，最后用陌生日志重建边界。
FIRST VIEWPORT: 雨窗关键帧与事故案卷正面碰撞；版本线和悬而未决的问题把唯一动作指向循环边界。
FORM: 架构装配长卷，代码原生方向，seed 1f848e47。
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
