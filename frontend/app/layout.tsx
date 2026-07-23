import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "../styles/theme.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "PixelVerse | 多人像素艺术创作平台",
  description: "创造属于你的像素世界。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
