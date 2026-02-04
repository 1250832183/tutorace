# TutorAce Vercel 迁移指南

> **版本**: 1.0  
> **最后更新**: 2026-02-04  
> **作者**: Manus AI

本文档为协作者提供从 GitHub 仓库一键部署 TutorAce 到 Vercel 的完整指南。阅读本文档后，你将能够理解项目架构并独立完成部署。

---

## 目录

1. [项目架构概述](#1-项目架构概述)
2. [技术栈说明](#2-技术栈说明)
3. [前置准备](#3-前置准备)
4. [一键部署到 Vercel](#4-一键部署到-vercel)
5. [部署 Voice Agent 到 LiveKit Cloud](#5-部署-voice-agent-到-livekit-cloud)
6. [环境变量配置](#6-环境变量配置)
7. [数据库迁移](#7-数据库迁移)
8. [部署后验证](#8-部署后验证)
9. [常见问题排查](#9-常见问题排查)
10. [架构深度解析](#10-架构深度解析)

---

## 1. 项目架构概述

TutorAce 是一个 AI 语音教学平台，采用前后端分离 + 独立 AI Agent 的三层架构。整个系统由三个独立部署的组件组成，它们通过 WebRTC 和 HTTP API 进行通信。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                                    │
│                  https://github.com/ZHouliRic/tutorace                       │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │     /web         │    │    /server       │    │    /agent        │       │
│  │  React Frontend  │    │  Express + tRPC  │    │  Python Agent    │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           └───────────┬───────────┘                       │                  │
│                       │                                   │                  │
│                       ▼                                   ▼                  │
│              ┌─────────────────┐                ┌─────────────────┐          │
│              │     Vercel      │                │  LiveKit Cloud  │          │
│              │  (Web + API)    │◄───WebRTC─────►│  (Voice Agent)  │          │
│              └─────────────────┘                └─────────────────┘          │
│                       │                                   │                  │
│                       ▼                                   │                  │
│              ┌─────────────────┐                          │                  │
│              │  MySQL/TiDB     │                          │                  │
│              │  (Database)     │                          │                  │
│              └─────────────────┘                          │                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 部署位置 | 职责 |
|------|----------|------|
| **Web Frontend** | Vercel | 用户界面、课程展示、语音控制 |
| **Backend API** | Vercel Serverless | LiveKit 房间管理、课程生成、数据存储 |
| **Voice Agent** | LiveKit Cloud | 语音识别、AI 对话、语音合成 |
| **Database** | 自选 MySQL/TiDB | 用户数据、课程内容、学习进度 |

---

## 2. 技术栈说明

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| Vite | 7.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| tRPC | 11.x | 类型安全的 API 调用 |
| LiveKit React | 2.x | WebRTC 语音通信 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.x | HTTP 服务器 |
| tRPC | 11.x | API 路由 |
| Drizzle ORM | 0.44.x | 数据库 ORM |
| LiveKit SDK | 2.x | 房间管理、Token 生成 |

### AI Agent 技术

| 技术 | 用途 |
|------|------|
| Python 3.11+ | Agent 运行时 |
| LiveKit Agents SDK | Agent 框架 |
| Cartesia Ink-Whisper | 语音识别 (STT) |
| Cartesia Sonic 3 | 语音合成 (TTS) |
| GPT-4o-mini | AI 对话生成 |

---

## 3. 前置准备

在开始部署之前，请确保你已准备好以下账号和 API Key：

### 必需账号

| 服务 | 用途 | 注册链接 |
|------|------|----------|
| **Vercel** | 托管 Web 应用 | [vercel.com](https://vercel.com) |
| **LiveKit Cloud** | 托管 Voice Agent | [cloud.livekit.io](https://cloud.livekit.io) |
| **GitHub** | 代码仓库 | [github.com](https://github.com) |

### 必需 API Keys

| API Key | 用途 | 获取方式 |
|---------|------|----------|
| **OpenAI API Key** | GPT-4 对话生成 | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Cartesia API Key** | 语音识别和合成 | [cartesia.ai](https://cartesia.ai) |
| **LiveKit API Key/Secret** | 房间管理和 Token | LiveKit Cloud Console |

### 可选：数据库

如果你需要持久化数据（用户、课程、进度），需要准备一个 MySQL 兼容的数据库：

| 推荐服务 | 特点 |
|----------|------|
| **PlanetScale** | Serverless MySQL，免费额度大 |
| **TiDB Cloud** | 分布式 MySQL，免费 Serverless 层 |
| **Supabase** | PostgreSQL（需修改 schema） |

---

## 4. 一键部署到 Vercel

### 方式一：使用 Deploy Button（推荐）

点击下方按钮，Vercel 将自动 Fork 仓库并引导你完成部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ZHouliRic/tutorace&env=LIVEKIT_URL,LIVEKIT_API_KEY,LIVEKIT_API_SECRET,OPENAI_API_KEY,DATABASE_URL&envDescription=Required%20environment%20variables%20for%20TutorAce&envLink=https://github.com/ZHouliRic/tutorace/blob/main/VERCEL_MIGRATION_GUIDE.md#6-环境变量配置)

### 方式二：手动导入

**Step 1: Fork 仓库**

访问 [github.com/ZHouliRic/tutorace](https://github.com/ZHouliRic/tutorace)，点击右上角 "Fork" 按钮。

**Step 2: 导入到 Vercel**

1. 登录 [vercel.com](https://vercel.com)
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 选择你 Fork 的 `tutorace` 仓库
5. 点击 "Import"

**Step 3: 配置构建设置**

Vercel 会自动检测 `vercel.json` 配置，确认以下设置：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | Vite |
| Build Command | `cd web && npm install && npm run build` |
| Output Directory | `web/dist` |
| Install Command | `npm install` |
| Node.js Version | 20.x |

**Step 4: 配置环境变量**

在 "Environment Variables" 部分添加必需的环境变量（详见[第 6 节](#6-环境变量配置)）。

**Step 5: 部署**

点击 "Deploy" 按钮，等待约 2-3 分钟完成部署。

---

## 5. 部署 Voice Agent 到 LiveKit Cloud

Voice Agent 是独立于 Vercel 的组件，需要单独部署到 LiveKit Cloud。

### Step 5.1: 安装 LiveKit CLI

```bash
# macOS
brew install livekit-cli

# Linux / Windows (via npm)
npm install -g livekit-cli

# 验证安装
lk --version
```

### Step 5.2: 登录 LiveKit Cloud

```bash
lk cloud auth
```

这会打开浏览器进行 OAuth 认证。

### Step 5.3: 创建项目（如果没有）

```bash
lk cloud project create tutorace
```

### Step 5.4: 配置 Agent 环境变量

在 [LiveKit Cloud Console](https://cloud.livekit.io) 中：

1. 进入你的项目
2. 点击 "Settings" → "Environment Variables"
3. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `OPENAI_API_KEY` | `sk-proj-...` | OpenAI API Key |
| `CARTESIA_API_KEY` | `sk_car_...` | Cartesia API Key |

### Step 5.5: 部署 Agent

```bash
# 克隆仓库（如果还没有）
git clone https://github.com/ZHouliRic/tutorace.git
cd tutorace/agent

# 部署到 LiveKit Cloud
lk cloud deploy
```

部署成功后，你会看到类似输出：

```
✓ Agent deployed successfully
  URL: wss://tutorace-xxxxx.livekit.cloud
```

记录这个 WebSocket URL，后面配置 Vercel 环境变量时需要用到。

### Step 5.6: 配置 GitHub Actions 自动部署（可选）

为了实现 Agent 代码更新后自动部署，在 GitHub 仓库中配置 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：

| Secret 名称 | 值 | 获取方式 |
|-------------|-----|----------|
| `LK_API_KEY` | LiveKit API Key | LiveKit Console → Settings → Keys |
| `LK_API_SECRET` | LiveKit API Secret | LiveKit Console → Settings → Keys |

配置完成后，每次 push 到 `main` 分支的 `agent/` 目录变更都会自动触发部署。

---

## 6. 环境变量配置

### Vercel 环境变量

在 Vercel 项目的 Settings → Environment Variables 中配置：

| 变量名 | 必需 | 示例值 | 说明 |
|--------|------|--------|------|
| `LIVEKIT_URL` | ✅ | `wss://tutorace-xxxxx.livekit.cloud` | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` | ✅ | `APIxxxxxxxx` | LiveKit API Key |
| `LIVEKIT_API_SECRET` | ✅ | `xxxxxxxxxxxxxxxx` | LiveKit API Secret |
| `OPENAI_API_KEY` | ✅ | `sk-proj-...` | OpenAI API Key（用于课程生成） |
| `DATABASE_URL` | ⚠️ | `mysql://user:pass@host/db` | MySQL 连接字符串（可选） |
| `JWT_SECRET` | ⚠️ | `random-32-char-string` | Session 签名密钥（可选） |

> ⚠️ 标记为可选的变量：如果不配置 DATABASE_URL，应用将使用内存存储，重启后数据丢失。

### 获取 LiveKit 凭证

1. 登录 [LiveKit Cloud Console](https://cloud.livekit.io)
2. 选择你的项目
3. 进入 Settings → Keys
4. 复制 API Key 和 API Secret

### LiveKit Cloud Agent 环境变量

这些变量在 LiveKit Cloud Console 中配置（不是 Vercel）：

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | ✅ | GPT-4 对话生成 |
| `CARTESIA_API_KEY` | ✅ | 语音识别和合成 |
| `LIVEKIT_URL` | 自动 | LiveKit 自动注入 |
| `LIVEKIT_API_KEY` | 自动 | LiveKit 自动注入 |
| `LIVEKIT_API_SECRET` | 自动 | LiveKit 自动注入 |

---

## 7. 数据库迁移

如果你需要持久化数据，按以下步骤配置数据库。

### Step 7.1: 创建数据库

以 PlanetScale 为例：

1. 登录 [planetscale.com](https://planetscale.com)
2. 创建新数据库，选择最近的区域
3. 获取连接字符串（选择 "Connect" → "Node.js"）

### Step 7.2: 配置连接字符串

将连接字符串添加到 Vercel 环境变量：

```
DATABASE_URL=mysql://username:password@host.planetscale.com/database?ssl={"rejectUnauthorized":true}
```

### Step 7.3: 运行数据库迁移

在本地克隆仓库后运行：

```bash
# 安装依赖
npm install

# 生成并执行迁移
npm run db:push
```

或者在 Vercel 部署后，通过 Vercel CLI 运行：

```bash
vercel env pull .env.local
npm run db:push
```

### 数据库 Schema 概览

项目使用以下数据表：

| 表名 | 用途 |
|------|------|
| `users` | 用户账号信息 |
| `materials` | 上传的学习材料（PDF 等） |
| `learning_units` | 学习单元（10 个 Slide 的课程） |
| `transcripts` | 语音对话记录 |
| `videos` | 生成的视频记录 |

---

## 8. 部署后验证

完成部署后，按以下步骤验证各组件是否正常工作。

### 8.1 验证 Web 应用

访问你的 Vercel 部署 URL（如 `https://tutorace-xxx.vercel.app`），应该看到首页。

### 8.2 验证 API

```bash
# 健康检查
curl https://your-project.vercel.app/api/health

# 预期响应
{"status":"ok","timestamp":"..."}
```

### 8.3 验证 Voice Agent

1. 在首页输入一个学习主题（如 "Python Basics"）
2. 点击 "Create from Topic"
3. 等待课程生成完成
4. 进入学习页面，检查：
   - 是否能听到 AI 语音
   - 是否能通过麦克风与 AI 对话
   - Slide 切换是否正常

### 8.4 验证 LiveKit 连接

在 LiveKit Cloud Console 中：

1. 进入 "Rooms" 页面
2. 应该能看到活跃的房间（当有用户在学习时）
3. 进入 "Agents" 页面
4. 确认 Agent 状态为 "Running"

---

## 9. 常见问题排查

### 问题：页面加载但无法创建课程

**可能原因**：OPENAI_API_KEY 未配置或无效

**解决方案**：
1. 检查 Vercel 环境变量中是否配置了 `OPENAI_API_KEY`
2. 确认 API Key 有效且有足够余额
3. 重新部署：`vercel --prod`

### 问题：进入学习页面但没有声音

**可能原因**：Voice Agent 未部署或 LiveKit 凭证错误

**解决方案**：
1. 检查 LiveKit Cloud Console 中 Agent 状态
2. 确认 Vercel 中的 `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET` 正确
3. 查看浏览器控制台是否有 WebRTC 错误

### 问题：Agent 日志显示 "OPENAI_API_KEY not set"

**可能原因**：LiveKit Cloud 环境变量未配置

**解决方案**：
1. 登录 LiveKit Cloud Console
2. 进入项目 Settings → Environment Variables
3. 添加 `OPENAI_API_KEY` 和 `CARTESIA_API_KEY`
4. 重新部署 Agent：`cd agent && lk cloud deploy`

### 问题：数据库连接失败

**可能原因**：DATABASE_URL 格式错误或 SSL 配置问题

**解决方案**：
1. 确认连接字符串格式正确
2. 对于 PlanetScale，确保包含 SSL 参数
3. 检查数据库服务是否允许来自 Vercel 的连接

### 问题：部署成功但访问返回 500 错误

**可能原因**：缺少必需的环境变量

**解决方案**：
1. 在 Vercel Dashboard 查看 Function Logs
2. 确认所有必需环境变量都已配置
3. 检查环境变量值是否有多余的空格或引号

---

## 10. 架构深度解析

### 10.1 数据流图

```
用户操作                    系统响应
────────                    ────────
1. 输入主题 ──────────────► Web Frontend
                                │
                                ▼
2. 创建课程请求 ──────────► Backend API (tRPC)
                                │
                                ├──► OpenAI GPT-4 (生成 10 个 Slide)
                                │
                                ▼
3. 课程数据 ◄───────────── Database (存储)
                                │
                                ▼
4. 进入学习页面 ──────────► Web Frontend
                                │
                                ├──► LiveKit SDK (创建房间、获取 Token)
                                │
                                ▼
5. WebRTC 连接 ◄──────────► LiveKit Cloud
                                │
                                ▼
6. 语音对话 ◄─────────────► Voice Agent
                                │
                                ├──► Cartesia STT (语音→文字)
                                ├──► GPT-4 (生成回复)
                                └──► Cartesia TTS (文字→语音)
```

### 10.2 关键文件说明

| 文件路径 | 作用 | 修改场景 |
|----------|------|----------|
| `web/src/pages/Home.tsx` | 首页 UI | 修改首页布局、添加新入口 |
| `web/src/pages/Session.tsx` | 学习页面 UI | 修改学习界面、Slide 展示 |
| `server/routers.ts` | API 路由定义 | 添加新 API、修改业务逻辑 |
| `agent/agent.py` | AI Agent 逻辑 | 修改 AI 人格、教学风格 |
| `drizzle/schema.ts` | 数据库表结构 | 添加新表、修改字段 |
| `vercel.json` | Vercel 部署配置 | 修改构建命令、路由规则 |

### 10.3 API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/trpc/voice.createRoom` | POST | 创建 LiveKit 房间 |
| `/api/trpc/voice.generateLessonPlan` | POST | 从主题生成课程 |
| `/api/trpc/tutorme.createFromTopic` | POST | 创建学习单元 |
| `/api/trpc/tutorme.getUnit` | GET | 获取学习单元详情 |
| `/api/trpc/tutorme.updateProgress` | POST | 更新学习进度 |

### 10.4 Agent 配置说明

Agent 的核心配置在 `agent/agent.py` 中：

```python
# AI 人格设置
SYSTEM_PROMPT = """
You are Spark, an enthusiastic and knowledgeable AI tutor...
"""

# 语音配置
session = AgentSession(
    stt=cartesia.STT(model="ink-whisper"),      # 语音识别
    llm=openai.LLM(model="gpt-4o-mini"),        # 对话生成
    tts=cartesia.TTS(model="sonic-3"),          # 语音合成
    allow_interruptions=True,                    # 允许打断
)
```

修改 `SYSTEM_PROMPT` 可以改变 AI 的教学风格和人格。

---

## 附录：快速参考卡片

### 一键部署清单

```
□ Fork GitHub 仓库
□ 导入到 Vercel
□ 配置 Vercel 环境变量
  □ LIVEKIT_URL
  □ LIVEKIT_API_KEY
  □ LIVEKIT_API_SECRET
  □ OPENAI_API_KEY
  □ DATABASE_URL (可选)
□ 部署 Vercel
□ 安装 LiveKit CLI
□ 部署 Agent 到 LiveKit Cloud
□ 配置 LiveKit 环境变量
  □ OPENAI_API_KEY
  □ CARTESIA_API_KEY
□ 验证部署
```

### 常用命令

```bash
# 本地开发
npm install
npm run dev

# 数据库迁移
npm run db:push

# 部署 Agent
cd agent && lk cloud deploy

# 查看 Agent 日志
lk cloud agent logs --follow

# Vercel 部署
vercel --prod
```

### 有用链接

| 资源 | 链接 |
|------|------|
| GitHub 仓库 | [github.com/ZHouliRic/tutorace](https://github.com/ZHouliRic/tutorace) |
| LiveKit 文档 | [docs.livekit.io](https://docs.livekit.io) |
| Vercel 文档 | [vercel.com/docs](https://vercel.com/docs) |
| Drizzle ORM 文档 | [orm.drizzle.team](https://orm.drizzle.team) |
| tRPC 文档 | [trpc.io/docs](https://trpc.io/docs) |

---

如有问题，请在 [GitHub Issues](https://github.com/ZHouliRic/tutorace/issues) 中提出。
