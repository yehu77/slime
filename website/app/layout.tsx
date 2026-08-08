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
      title: "slime Lab — 把训练脚本变成你能解释的系统",
      description: "沿一条 Sample 的旅程，看懂 rollout、训练与权重同步。",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "slime Lab 训练闭环" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "slime Lab",
      description: "沿一条 Sample 的旅程，看懂 slime 的完整训练闭环。",
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
