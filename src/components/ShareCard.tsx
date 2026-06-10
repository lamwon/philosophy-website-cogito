"use client";

import { useRef, useEffect, useState } from "react";

interface Props {
  text: string;
  source: string;
  chapter?: string;
  tradition: "buddhism" | "daoism" | "confucianism";
}

const THEMES = {
  buddhism: {
    title: "佛家·禅意",
    bg1: "#FDF6F0",
    bg2: "#F5E6DA",
    accent: "#D4836D",
    border: "#C8A96E",
    ornament: "🪷",
  },
  daoism: {
    title: "道家·自然",
    bg1: "#F0F5F2",
    bg2: "#E0EDE5",
    accent: "#5D7A6E",
    border: "#8BA89A",
    ornament: "☯",
  },
  confucianism: {
    title: "儒家·修身",
    bg1: "#F5F0EB",
    bg2: "#EDE0D5",
    accent: "#8B4513",
    border: "#A67B5B",
    ornament: "📜",
  },
};

export default function ShareCard({ text, source, chapter, tradition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [ready, setReady] = useState(false);
  const theme = THEMES[tradition];

  useEffect(() => {
    if (typeof document === "undefined") return;
    // 等待字体加载后再绘制
    document.fonts.ready.then(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const W = 600, H = 800;
      canvas.width = W;
      canvas.height = H;

      // 背景渐变
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, theme.bg1);
      grad.addColorStop(1, theme.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 装饰边框
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 2;
      const m = 24;
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);

      // 顶部装饰符号
      ctx.font = "40px 'Noto Serif SC', 'STSong', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(theme.ornament, W / 2, 90);

      // 副标题
      ctx.font = "14px 'Noto Serif SC', 'STSong', serif";
      ctx.fillStyle = theme.accent;
      ctx.fillText(theme.title, W / 2, 130);

      // 分隔线
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, 150);
      ctx.lineTo(W / 2 + 60, 150);
      ctx.stroke();

      // 金句正文
      ctx.fillStyle = "#2C1810";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxWidth = 480;
      const displayText = "「" + text + "」";
      const lines = wrapText(ctx, displayText, maxWidth);
      const lineHeight = 38;
      const startY = 280;

      lines.forEach((line, i) => {
        ctx.font = (i === 0 ? 24 : 22) + "px 'Noto Serif SC', 'STSong', serif";
        ctx.fillText(line, W / 2, startY + i * lineHeight);
      });

      // 来源
      const sourceY = startY + lines.length * lineHeight + 50;
      ctx.font = "16px 'Noto Serif SC', 'STSong', serif";
      ctx.fillStyle = theme.accent;
      ctx.fillText("—— " + source + (chapter ? " · " + chapter : ""), W / 2, sourceY);

      // 底部网站名
      ctx.font = "13px 'Noto Serif SC', 'STSong', serif";
      ctx.fillStyle = theme.border;
      ctx.fillText("我在故我在 · 思辨即生活", W / 2, H - 80);

      setReady(true);
    });
  }, [text, source, chapter, tradition]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "wisdom-" + tradition + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: 360,
          aspectRatio: "3 / 4",
          borderRadius: "var(--radius)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          background: theme.bg1,
        }}
      />
      {ready && (
        <button
          onClick={handleDownload}
          style={{
            padding: "10px 24px", border: "2px solid var(--accent)", borderRadius: 20,
            background: "transparent", color: "var(--accent)", cursor: "pointer",
            fontSize: 13, fontFamily: "var(--font)", transition: "all 0.2s",
          }}
        >
          {downloaded ? "✅ 已保存" : "📷 保存图片"}
        </button>
      )}
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];

  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
