import type { Metadata } from "next";
import { Inspector } from "react-dev-inspector";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "哄哄模拟器 | 把生气的TA哄开心",
  description:
    "AI扮演你正在生气的对象，通过选择题的方式回应，在10轮内把对方哄好！俏皮搞笑的哄人练习器。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === "DEV";

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
