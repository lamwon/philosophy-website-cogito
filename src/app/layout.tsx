import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我在故我在 - 哲学与生活",
  description: "让普通人通过哲学思辨理解生活问题",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
