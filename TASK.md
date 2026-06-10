# 任务：生成"我在故我在"哲学网站测试版

## 要求
生成一个 **完整的单页HTML文件**，可以双击在浏览器中打开，体验全部核心功能。

## 文件位置
- 输出文件：D:\HuaweiMoveData\Users\Windows\Desktop\我在故我在\philosophy-site\public\index.html
- 数据文件：D:\HuaweiMoveData\Users\Windows\Desktop\我在故我在\philosophy-site\data\philosophers.json（38位哲学家）
- 数据文件：D:\HuaweiMoveData\Users\Windows\Desktop\我在故我在\philosophy-site\data\wisdom-quotes.json（130句佛道儒原文）

## 功能需求

### 四步核心交互流程

#### Step 1: 选生活问题
- 预设分类卡片：职场困惑、情感关系、消费决策、道德困境、人生意义、科技伦理
- 每个分类下面有3-4个具体问题示例，点击即选
- 底部有自由输入文本框，用户可以自定义问题
- 美观的卡片式布局，点击有选中态

#### Step 2: 选哲学家
- 按罗素三卷本展示：古代哲学 / 天主教哲学 / 近代哲学（标签页切换）
- 每个哲学家显示：头像占位（首字母圆形图标）、姓名、流派标签
- 搜索框：实时过滤哲学家
- 随机按钮"随缘试试"：随机选一个
- 「反差模式」开关：打开后优先推荐相反的哲学家
- 点击选中后有选中动画

#### Step 3: AI 分析展示
- 思考中状态：显示"正在思考..."的动画
- 打字机效果逐字输出分析内容
- 输出格式：
  - 🧠 用一句话说清楚
  - 📖 生活类比
  - 🔬 深度分析
  - 💡 生活建议
  - 🤔 换个角度（可选）
- 底部按钮："我要结语 →"

#### Step 4: 佛道儒结语
- 三个大卡片：佛 / 道 / 儒，点击选一个
- 展示：原文金句 + 出处 + 白话解释 + 意境卡片（CSS生成）
- 底部按钮："分享到朋友圈"（复制链接 + 生成分享图预览）和 "保存图片"
- "再来一次" 按钮回到Step 1

#### 关于 DeepSeek API 调用
- 因为测试HTML是纯前端，不能直接调DeepSeek API（有CORS问题）
- **解决方案**：在HTML中嵌入模拟响应，每种组合生成3-5种不同的预设回复
- 但代码架构要预留真实的API调用通道：
  - `lib/api.js` 中定义 `callAnalyzeAPI(question, philosopherId)` 函数
  - `callWisdomAPI(question, philosopherId, tradition)` 函数
  - 用 `DEEPSEEK_ENABLED = false` 变量控制是否使用真实API
  - 当 `DEEPSEEK_ENABLED = true` 时，POST到 `http://127.0.0.1:15721/anthropic/v1/messages`（cc-switch代理地址）
  - 用 SSE 实现流式输出

### 设计规范
- 色彩：主色 #1A3A5C（深蓝）、背景 #F5F0EB（米白）、强调色 #C9A96E（金色）
- 字体：Noto Serif SC（中文标题）、系统字体（正文）
- 卡片圆角 12px，柔和阴影
- 响应式设计（手机优先）
- 整体氛围：温暖、沉静、书卷气

### 技术实现
- 纯HTML + CSS + JavaScript（无框架依赖）
- CSS使用内联 `<style>`，JS使用内联 `<script>`
- 所有数据从JSON文件直接嵌入（用 `<script>` 引入）
- 不使用任何外部CDN（确保离线可打开）
- 字体使用系统字体或Google Fonts（可选）

## 输出要求
- 文件应完整可用，双击即可在浏览器中打开
- 所有UI交互完整（点击、切换、动画）
- 模拟AI回复应该看起来真实（打字机效果）
- 每个哲学家的模拟回复要体现其核心思想
- 请把完整的HTML写入文件

开始吧！先读数据文件，然后生成完整的 index.html。
