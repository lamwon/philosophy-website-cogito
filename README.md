# 我在故我在 — 哲学与生活应用网站

让普通人通过哲学思辨理解生活问题的互动网站。

## 快速体验

```bash
npm run dev
# 访问 http://localhost:3000
```

或者双击 `public/test_latest.html` 一键测试。

## 核心交互

```
选生活问题 ──→ 选哲学家（可完全不相关）──→ AI费曼式分析 ──→ 佛道儒结语+分享
     │                │                      │                  │
  6大类24题        罗素三卷本            逐段打字机         130句原文
  自由输入         38位哲学家            每段引用问题        Canvas卡片
```

## 哲学体系

以罗素《西方哲学史》为准，覆盖三卷：

| 卷 | 时代 | 哲学家数 | 代表人物 |
|----|------|---------|---------|
| 卷I | 古代哲学 | 16位 | 泰勒斯、柏拉图、亚里士多德、第欧根尼 |
| 卷II | 天主教哲学 | 4位 | 奥古斯丁、托马斯·阿奎那 |
| 卷III | 近代哲学 | 18位 | 笛卡尔、康德、尼采、维特根斯坦 |

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS v3 + CSS变量 |
| AI | DeepSeek V4 Flash（cc-switch代理） |
| 数据 | JSON文件（零数据库） |
| 部署 | Vercel |

## 提示词核心规则

每条分析输出**必须**：
1. 每一段以"你问{问题原文}"开头
2. 每一段正文至少再出现一次用户问题原文
3. 引用该哲学家的经典名言原文进行分析

## 项目结构

```
src/
├── app/
│   ├── page.tsx           # 首页
│   ├── think/page.tsx     # 思辨交互（四步）
│   ├── concepts/page.tsx  # 概念库
│   ├── about/page.tsx     # 关于
│   └── api/analyze/route.ts  # DeepSeek SSE代理
├── components/
│   └── ShareCard.tsx      # Canvas分享卡片
├── lib/
│   ├── api.ts             # API调用+模拟数据
│   ├── types.ts           # 类型定义
│   └── useUrlState.ts     # URL状态hook
└── data/
    ├── philosophers.json  # 38位哲学家
    └── wisdom-quotes.json # 130句佛道儒原文
```

## 部署

```bash
npx vercel --prod
```

需要设置环境变量：
- `DEEPSEEK_PROXY_URL` — DeepSeek API代理地址
