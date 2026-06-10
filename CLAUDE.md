# 我在故我在 - 哲学与生活应用网站

## 技术栈
Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + 纯CSS

## 项目结构
```
src/
  app/
    layout.tsx        - 根布局（字体、metadata、全局CSS）
    globals.css       - 全局样式 + CSS变量
    page.tsx          - 首页
    think/
      page.tsx        - 思辨流程页（四步交互）
    concepts/
      page.tsx        - 概念库（哲学家列表）
      [slug]/
        page.tsx      - 哲学家详情页
    about/
      page.tsx        - 关于页
  components/
    Header.tsx        - 顶部导航
    StepIndicator.tsx - 四步指示器
    QuestionSelector.tsx  - 问题选择
    PhilosopherSelector.tsx - 哲学家选择
    AnalysisDisplay.tsx    - 分析展示（打字机）
    WisdomSelector.tsx     - 佛道儒结语
    ShareCard.tsx          - 分享卡片
  data/
    philosophers.json - 38位哲学家
    wisdom-quotes.json - 130句原文
  lib/
    api.ts            - DeepSeek API 调用
    types.ts          - TypeScript 类型定义
    prompts.ts        - AI 提示词模板
```

## 核心交互
1. 选问题 → 2. 选哲学家 → 3. AI分析（打字机） → 4. 佛道儒结语+分享

## 设计规范
- 主色 #1A3A5C / 背景 #F5F0EB / 强调 #C9A96E
- 字体: Noto Serif SC
- 所有内容 DeepSeek V4 Flash 动态生成
