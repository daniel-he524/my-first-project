# AGENTS.md — 哄哄模拟器

## 项目概览

「哄哄模拟器」是一个 AI 驱动的互动小游戏：AI 扮演正在生气的对象，用户通过选择题的方式回应，在 10 轮内把对方哄好。使用 LLM 动态生成对话和选项，TTS 生成语音，每次游玩体验都不一样。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI**: coze-coding-dev-sdk (LLM + TTS)
- **Database**: Supabase (blog_posts 表)

## 目录结构

```
├── docs/
│   └── prd.md                # 产品需求文档
├── public/                   # 静态资源
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── blog/
│   │   │   │   ├── route.ts         # 博客列表 + LLM 生成文章 API
│   │   │   │   └── [id]/route.ts    # 文章详情 API
│   │   │   ├── chat/route.ts       # LLM 对话生成 API
│   │   │   └── tts/route.ts        # TTS 语音生成 API
│   │   ├── blog/
│   │   │   ├── page.tsx            # 博客列表页
│   │   │   └── [id]/page.tsx       # 文章详情页
│   │   ├── game/page.tsx           # 游戏主页面（微信聊天式界面）
│   │   ├── globals.css             # 全局样式 + 自定义动画 + 主题色
│   │   ├── layout.tsx              # 根布局
│   │   └── page.tsx                # 首页（性别/场景/声音选择）
│   ├── components/ui/              # Shadcn UI 组件库
│   ├── hooks/
│   │   └── useAudio.ts             # 音频播放 Hook
│   ├── lib/
│   │   ├── game-config.ts          # 游戏配置（场景/声音/常量/类型）
│   │   ├── prompt-builder.ts       # LLM Prompt 构建 + 响应校验
│   │   └── utils.ts                # 通用工具函数
│   └── storage/
│       └── database/
│           ├── shared/schema.ts     # Drizzle ORM Schema
│           └── supabase-client.ts   # Supabase 客户端
├── DESIGN.md                  # 设计规范
└── package.json
```

## 构建和测试命令

- **安装依赖**: `pnpm install`
- **开发**: `pnpm dev` (端口 5000，HMR 热更新)
- **构建**: `pnpm build`
- **生产启动**: `pnpm start`
- **类型检查**: `pnpm ts-check`
- **Lint**: `pnpm lint`

## 代码风格指南

- TypeScript strict 模式，禁止隐式 `any`
- 函数参数和返回值必须标注类型
- 使用 `useState` 的函数式初始化避免渲染期调用 `Math.random()`
- 中文引号 `""` 在字符串内需用单引号包裹或转义
- LLM 返回的 JSON 中数字不能有前导 `+` 号，解析时需 `replace(/:\s*\+(\d+)/g, ": $1")` 清理

## API 接口

### POST /api/chat
LLM 对话生成，请求体：
```json
{
  "gender": "girlfriend|boyfriend",
  "sceneId": "anniversary|no_reply|flirting|lost_cat|public_shame",
  "round": 1,
  "favorability": 20,
  "messages": [{ "role": "partner|user", "content": "..." }],
  "userChoice": "用户选择的选项文字（非首轮）",
  "isFirstRound": true
}
```
返回：`{ reply, emotion_score_change, options: [{ text, score_change, is_correct }] }`

### POST /api/tts
TTS 语音生成，请求体：
```json
{ "text": "要说的话", "voiceId": "gentle_female|dominant_female|cute_female|deep_male|gentle_male" }
```
返回：`{ audioUri, audioSize }`

### GET /api/blog
获取博客文章列表，返回：`{ posts: [{ id, title, summary, created_at }] }`

### POST /api/blog
调用 LLM 自动生成一篇恋爱沟通技巧文章并保存到数据库，返回：`{ post: { id, title, summary, created_at } }`

### GET /api/blog/[id]
获取单篇文章详情，返回：`{ post: { id, title, summary, content, created_at } }`

## 数据库

- **表 blog_posts**：id(自增主键)、title、summary、content、created_at
- **RLS**：已启用（无策略，使用 service_role key 读写）
- **Schema**：`src/storage/database/shared/schema.ts`（Drizzle ORM）

## 游戏核心逻辑

- 初始好感度 20，胜利条件 >= 80，失败条件 <= -50 或 10 轮用完
- 可提前结束（好感度达标即胜、触底即败）
- 每轮 6 个选项：2 加分 + 4 减分（含搞笑选项），顺序随机打乱
- 好感度由 LLM 返回的 `score_change` 计算，前端累加
- `is_correct` 字段由后端根据 `score_change > 0` 修正，不依赖 LLM 返回值
- 对方情绪根据好感度区间变化（5 个等级）
- TTS 异步加载，文字先显示，语音就绪后播放按钮激活
- 新语音自动打断前一条
