# Tutorace 设计文档 (Source of Truth)

> **版本**: 1.0.0  
> **最后更新**: 2026-01-31  
> **作者**: Manus AI  
> **状态**: 设计阶段

---

## 1. 产品概述

### 1.1 产品定位

Tutorace 是一款 AI 驱动的语音教学助手，提供类似真人一对一辅导的学习体验。用户可以上传学习材料或输入任意主题，系统会自动生成结构化的课程计划，并通过自然语音对话进行教学。

### 1.2 核心价值主张

| 特性 | 描述 |
|------|------|
| **自然语音交互** | 实时语音对话，支持随时打断提问 |
| **智能内容分拆** | 自动将 PDF 材料分拆为结构化章节 |
| **个性化教学** | AI 根据用户反馈调整教学节奏和风格 |
| **进度可视化** | 清晰的 Lesson Plan 和学习进度追踪 |

### 1.3 竞品参考

本产品设计参考了 StudyFetch 的 Tutor Me 功能，其核心特点包括：

1. **两种语音互动模式**：本质是一个语音 Agent
2. **Slides 生成**：输入概念或文字后生成约 15 页的 Slides（类似 NanoBanana 风格）
3. **章节对话**：上传材料后生成章节，章节信息作为对话的主背景
4. **页面关联**：对话主题围绕 PDF 文件的具体页面进行
5. **Topic 驱动**：某些章节和页面自带 Topic，Agent 会顺着话题讲解
6. **用户控制**：页面翻页、学习进度、是否学完由用户自己掌握

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户浏览器 (React)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   麦克风输入     │  │   扬声器输出     │  │      React UI           │ │
│  └────────┬────────┘  └────────▲────────┘  │  - Lesson Plan 面板     │ │
│           │                    │           │  - Slides 展示          │ │
│           │                    │           │  - 语音控制按钮         │ │
│           ▼                    │           │  - 进度追踪             │ │
│  ┌─────────────────────────────┴───────────┴────────────────────────┐ │
│  │                   LiveKit Client SDK (WebRTC)                     │ │
│  └──────────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │ WebSocket (wss://)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LiveKit Cloud Server                             │
│                    wss://tutorace-sky7fsol.livekit.cloud               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Python Agent Server                                │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        AgentSession                                │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐│ │
│  │  │  Cartesia Ink   │  │    GPT-4o       │  │   Cartesia Sonic 3  ││ │
│  │  │  (STT 语音识别)  │──│   (LLM 对话)    │──│   (TTS 语音合成)    ││ │
│  │  │  ~100ms 延迟    │  │   教学内容生成   │  │   90ms 延迟         ││ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  │                                      │
│                                  ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Lesson Plan Context                           │ │
│  │  - 当前章节信息                                                    │ │
│  │  - PDF 页面内容                                                    │ │
│  │  - Topic 话题                                                      │ │
│  │  - 学习进度状态                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Web Backend (Express + tRPC)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  PDF 解析服务    │  │  Slides 生成    │  │   数据库 (MySQL)        │ │
│  │  - 文本提取     │  │  - NanoBanana   │  │   - 用户数据            │ │
│  │  - 章节分拆     │  │  - 15页 Slides  │  │   - Lesson Plans        │ │
│  │  - Topic 识别   │  │  - 主题可视化   │  │   - 学习进度            │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **实时通信** | LiveKit Cloud | WebRTC 框架，处理音视频流 |
| **语音合成 (TTS)** | Cartesia Sonic 3 | 90ms 延迟，支持情感表达 |
| **语音识别 (STT)** | Cartesia Ink-Whisper | 流式语音识别，低延迟 |
| **语音活动检测 (VAD)** | Silero VAD | 检测用户是否在说话 |
| **大语言模型 (LLM)** | GPT-4o-mini | 教学内容生成和对话 |
| **前端框架** | React 19 + TypeScript | 用户界面 |
| **样式** | Tailwind CSS 4 | 响应式设计 |
| **后端框架** | Express + tRPC | API 服务 |
| **数据库** | MySQL (TiDB) | 数据持久化 |
| **Agent 框架** | LiveKit Agents SDK | Python Agent 开发 |

### 2.3 API 密钥配置

| 服务 | 环境变量 | 用途 |
|------|----------|------|
| LiveKit | `LIVEKIT_URL` | WebSocket 连接地址 |
| LiveKit | `LIVEKIT_API_KEY` | API 认证 |
| LiveKit | `LIVEKIT_API_SECRET` | API 密钥 |
| Cartesia | `CARTESIA_API_KEY` | TTS/STT 服务 |
| OpenAI | `OPENAI_API_KEY` | LLM 对话生成 |

---

## 3. 核心功能设计

### 3.1 两种语音互动模式

#### 模式一：自由对话模式

用户可以直接与 AI 对话，询问任何学习相关的问题。AI 会根据上下文提供解答和讲解。

```
用户: "什么是机器学习？"
AI: "机器学习是人工智能的一个分支，它让计算机能够从数据中学习..."
用户: [打断] "能举个例子吗？"
AI: [立即停止] "当然！比如你每天使用的推荐系统..."
```

#### 模式二：Lesson Plan 引导模式

基于上传的材料或输入的主题，AI 按照结构化的课程计划进行教学。

```
Lesson Plan: 机器学习入门
├── 第1章: 什么是机器学习 (页面 1-2)
│   ├── Topic: 定义与历史
│   └── Topic: 应用场景
├── 第2章: 监督学习 (页面 3-5)
│   ├── Topic: 分类问题
│   └── Topic: 回归问题
└── 第3章: 无监督学习 (页面 6-8)
    ├── Topic: 聚类
    └── Topic: 降维
```

### 3.2 内容分拆流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  上传 PDF   │ ──▶ │  文本提取   │ ──▶ │  章节分拆   │ ──▶ │ Topic 识别  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  开始教学   │ ◀── │  生成 Slides│ ◀── │ Lesson Plan │ ◀── │  结构化数据 │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**分拆规则：**

1. **按页面分组**：每 1-3 页为一个章节
2. **语义分析**：识别标题、小节、关键概念
3. **Topic 提取**：从每个章节提取 2-3 个核心话题
4. **关联页面**：每个 Topic 关联到具体的 PDF 页面

### 3.3 Slides 生成

当用户输入一个概念或一段文字时，系统会生成约 15 页的 Slides：

| Slide | 内容 |
|-------|------|
| 1 | 标题页 |
| 2-3 | 概念定义与背景 |
| 4-6 | 核心原理讲解 |
| 7-9 | 实例与应用 |
| 10-12 | 深入分析 |
| 13-14 | 常见问题与误区 |
| 15 | 总结与要点回顾 |

**Slides 风格**：采用 NanoBanana 风格，视觉效果突出，适合教学场景。

### 3.4 语音交互流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        语音交互状态机                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    用户开始说话    ┌─────────┐                       │
│   │  空闲   │ ─────────────────▶ │  监听   │                       │
│   └────┬────┘                    └────┬────┘                       │
│        │                              │                             │
│        │ AI 开始讲解                  │ 用户说完                    │
│        ▼                              ▼                             │
│   ┌─────────┐    用户打断        ┌─────────┐                       │
│   │  讲解   │ ◀─────────────────│  处理   │                       │
│   └────┬────┘                    └────┬────┘                       │
│        │                              │                             │
│        │ 讲解完成                     │ 生成回复                    │
│        ▼                              ▼                             │
│   ┌─────────┐                    ┌─────────┐                       │
│   │ 等待反馈│ ◀────────────────│  回复   │                       │
│   └─────────┘                    └─────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**打断处理机制：**

1. **VAD 检测**：Silero VAD 检测用户是否开始说话
2. **打断阈值**：用户说话超过 0.5 秒触发打断
3. **立即停止**：AI 立即停止当前讲解
4. **上下文保持**：记住当前讲解位置，回答后可继续

---

## 4. 数据模型

### 4.1 核心实体

```typescript
// 用户
interface User {
  id: string;
  openId: string;
  name: string;
  createdAt: Date;
}

// 学习材料
interface Material {
  id: string;
  userId: string;
  title: string;
  type: 'pdf' | 'text' | 'topic';
  content: string;  // PDF URL 或文本内容
  pageCount?: number;
  createdAt: Date;
}

// 课程计划
interface LessonPlan {
  id: string;
  materialId: string;
  title: string;
  topics: Topic[];
  createdAt: Date;
}

// 学习主题
interface Topic {
  id: string;
  lessonPlanId: string;
  title: string;
  content: string;
  pageNumbers: number[];
  subtopics: string[];
  order: number;
}

// 学习进度
interface Progress {
  id: string;
  userId: string;
  lessonPlanId: string;
  currentTopicId: string;
  completedTopicIds: string[];
  lastAccessedAt: Date;
}

// 语音会话
interface VoiceSession {
  id: string;
  userId: string;
  lessonPlanId: string;
  roomName: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}
```

### 4.2 数据库 Schema (Drizzle)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const materials = sqliteTable('materials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'pdf' | 'text' | 'topic'
  contentUrl: text('content_url'),
  pageCount: integer('page_count'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const lessonPlans = sqliteTable('lesson_plans', {
  id: text('id').primaryKey(),
  materialId: text('material_id').notNull(),
  title: text('title').notNull(),
  topicsJson: text('topics_json').notNull(), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const progress = sqliteTable('progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  lessonPlanId: text('lesson_plan_id').notNull(),
  currentTopicIndex: integer('current_topic_index').default(0),
  completedTopicsJson: text('completed_topics_json').default('[]'),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }).notNull(),
});

export const voiceSessions = sqliteTable('voice_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  lessonPlanId: text('lesson_plan_id').notNull(),
  roomName: text('room_name').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
});
```

---

## 5. API 设计

### 5.1 tRPC Procedures

```typescript
// 材料管理
materials.upload      // 上传 PDF 或输入文本
materials.list        // 获取用户的材料列表
materials.get         // 获取单个材料详情
materials.delete      // 删除材料

// 课程计划
lessonPlan.generate   // 从材料生成课程计划
lessonPlan.get        // 获取课程计划详情
lessonPlan.list       // 获取用户的课程计划列表

// 学习进度
progress.get          // 获取学习进度
progress.update       // 更新学习进度
progress.complete     // 标记主题完成

// 语音会话
voice.createRoom      // 创建 LiveKit 房间
voice.getToken        // 获取 LiveKit 连接 Token
voice.endSession      // 结束语音会话
voice.getHistory      // 获取会话历史
```

### 5.2 LiveKit Room 创建

```typescript
import { AccessToken } from 'livekit-server-sdk';

async function createVoiceRoom(userId: string, lessonPlanId: string) {
  const roomName = `tutor-${lessonPlanId}-${Date.now()}`;
  
  // 获取 Lesson Plan 作为 Room Metadata
  const lessonPlan = await getLessonPlan(lessonPlanId);
  
  // 创建 Access Token
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: 'Student',
    }
  );
  
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });
  
  return {
    roomName,
    token: token.toJwt(),
    wsUrl: process.env.LIVEKIT_URL,
    lessonPlan,
  };
}
```

---

## 6. Agent 设计

### 6.1 Agent 系统 Prompt

```
你是 Spark，一位热情且知识渊博的 AI 导师。你的角色是：

1. **教学**：清晰、生动地解释概念，使用类比和例子
2. **适应**：根据学生的反馈调整教学风格和节奏
3. **鼓励**：支持学生，庆祝他们的进步
4. **互动**：通过提问检查理解程度，保持学生参与

## 教学指南：
- 保持解释简洁但完整（每次 2-3 句话）
- 使用自然的对话语言
- 如果被打断，立即回应学生的问题
- 回答问题后，平滑地回到课程内容
- 用热情的语气（变化语调和节奏）

## 当前课程计划：
{lesson_plan_context}

## 当前主题：
{current_topic}

## 页面内容：
{page_content}

记住：你正在进行实时语音对话。保持自然、响应迅速、引人入胜！
```

### 6.2 Agent 状态管理

```python
@dataclass
class AgentState:
    """Agent 运行时状态"""
    lesson_plan: Optional[LessonPlan]
    current_topic_index: int = 0
    is_teaching: bool = False
    was_interrupted: bool = False
    interrupt_context: Optional[str] = None
    
    @property
    def current_topic(self) -> Optional[Topic]:
        if self.lesson_plan and 0 <= self.current_topic_index < len(self.lesson_plan.topics):
            return self.lesson_plan.topics[self.current_topic_index]
        return None
    
    def handle_interruption(self, user_question: str):
        """处理用户打断"""
        self.was_interrupted = True
        self.interrupt_context = user_question
        self.is_teaching = False
    
    def resume_teaching(self):
        """恢复教学"""
        self.was_interrupted = False
        self.interrupt_context = None
        self.is_teaching = True
    
    def advance_topic(self) -> bool:
        """进入下一个主题"""
        if self.lesson_plan:
            self.current_topic_index += 1
            return self.current_topic_index < len(self.lesson_plan.topics)
        return False
```

---

## 7. 前端设计

### 7.1 页面结构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Header                                     │
│  [Logo]  Tutorace                              [用户头像] [设置]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │                     │  │                                     │  │
│  │   Lesson Plan       │  │         Slides / Content            │  │
│  │   ─────────────     │  │                                     │  │
│  │   ○ 第1章 概述      │  │   ┌─────────────────────────────┐   │  │
│  │   ● 第2章 核心概念  │  │   │                             │   │  │
│  │   ○ 第3章 应用      │  │   │      当前 Slide 内容        │   │  │
│  │   ○ 第4章 总结      │  │   │                             │   │  │
│  │                     │  │   │                             │   │  │
│  │   进度: 2/4         │  │   └─────────────────────────────┘   │  │
│  │   ████░░░░ 50%      │  │                                     │  │
│  │                     │  │   [◀ 上一页]  3/15  [下一页 ▶]      │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        Voice Control Bar                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [🎤 开始对话]  [⏸ 暂停]  [⏭ 下一主题]     音量: ████░░    │   │
│  │                                                             │   │
│  │  AI: "机器学习是一种让计算机从数据中学习的方法..."          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 核心组件

| 组件 | 功能 |
|------|------|
| `LessonPlanPanel` | 显示课程大纲和学习进度 |
| `SlideViewer` | 展示当前 Slide 内容 |
| `VoiceControlBar` | 语音控制和状态显示 |
| `TranscriptDisplay` | 实时显示对话文字 |
| `ProgressTracker` | 学习进度可视化 |

### 7.3 LiveKit 集成

```typescript
import { LiveKitRoom, useVoiceAssistant } from '@livekit/components-react';

function TutorSession({ token, wsUrl, lessonPlan }) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={true}
    >
      <VoiceAssistantUI lessonPlan={lessonPlan} />
    </LiveKitRoom>
  );
}

function VoiceAssistantUI({ lessonPlan }) {
  const { state, audioTrack } = useVoiceAssistant();
  
  return (
    <div className="flex h-screen">
      <LessonPlanPanel plan={lessonPlan} />
      <div className="flex-1 flex flex-col">
        <SlideViewer currentTopic={lessonPlan.currentTopic} />
        <VoiceControlBar state={state} />
      </div>
    </div>
  );
}
```

---

## 8. 部署架构

### 8.1 服务部署

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Production Environment                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│  │   Vercel/Manus  │     │  LiveKit Cloud  │     │  Python Agent │ │
│  │   (Frontend)    │     │  (WebRTC)       │     │  (Railway)    │ │
│  │                 │     │                 │     │               │ │
│  │  - React App    │     │  - Room 管理    │     │  - Agent 逻辑 │ │
│  │  - API Routes   │     │  - 音视频路由   │     │  - TTS/STT    │ │
│  │  - tRPC Server  │     │  - 信令服务     │     │  - LLM 调用   │ │
│  └────────┬────────┘     └────────┬────────┘     └───────┬───────┘ │
│           │                       │                       │         │
│           └───────────────────────┼───────────────────────┘         │
│                                   │                                 │
│                                   ▼                                 │
│                        ┌─────────────────┐                         │
│                        │   TiDB Cloud    │                         │
│                        │   (Database)    │                         │
│                        └─────────────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Agent 部署

Python Agent 需要单独部署，推荐使用 Railway 或 Fly.io：

```bash
# 使用 LiveKit CLI 部署
lk agent deploy --project tutorace
```

或者使用 Docker：

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "tutor_agent.py", "start"]
```

---

## 9. 成本估算

### 9.1 第三方服务成本

| 服务 | 套餐 | 月费用 | 说明 |
|------|------|--------|------|
| LiveKit Cloud | Starter | ~$50-100 | 按使用量计费 |
| Cartesia | Startup | $88 | 1.25M credits |
| OpenAI | Pay-as-you-go | ~$50-100 | GPT-4o-mini |
| TiDB Cloud | Free/Starter | $0-25 | 数据库 |
| Railway | Starter | $5-20 | Agent 部署 |

**预估月成本**：$200-350（1000 活跃用户）

### 9.2 成本优化建议

1. **使用 GPT-4o-mini**：比 GPT-4o 便宜 10x，质量足够
2. **缓存常见回答**：减少 LLM 调用
3. **按需启动 Agent**：无用户时不运行
4. **压缩音频流**：降低带宽成本

---

## 10. 开发路线图

### Phase 1: MVP (2 周)

- [x] LiveKit Agent 基础框架
- [x] Cartesia TTS/STT 集成
- [ ] 基础语音对话功能
- [ ] 简单的 Web UI

### Phase 2: 内容分拆 (2 周)

- [ ] PDF 上传和解析
- [ ] 章节自动分拆
- [ ] Lesson Plan 生成
- [ ] Topic 识别

### Phase 3: Slides 生成 (2 周)

- [ ] NanoBanana 风格 Slides
- [ ] 15 页 Slides 模板
- [ ] Slides 与语音同步

### Phase 4: 优化与上线 (2 周)

- [ ] 打断处理优化
- [ ] 进度追踪
- [ ] 性能优化
- [ ] 生产部署

---

## 11. 风险与挑战

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| LiveKit 国内网络差 | 用户体验 | 考虑使用国内 WebRTC 服务 |
| 语音延迟过高 | 对话不自然 | 优化 Agent 响应速度 |
| 内容分拆不准确 | 教学效果差 | 人工审核 + 用户反馈 |
| 成本超预算 | 运营压力 | 实施成本优化措施 |

---

## 12. 附录

### 12.1 环境变量清单

```bash
# LiveKit
LIVEKIT_URL=wss://tutorace-sky7fsol.livekit.cloud
LIVEKIT_API_KEY=APIHKiimwyFCyjn
LIVEKIT_API_SECRET=37kf3ShS0jGp3DeFRBHs9kfUkf1F4Py278zQCN0hRFeB

# Cartesia
CARTESIA_API_KEY=sk_car_4AN56wxvVva9hTYVxGUqMC

# OpenAI
OPENAI_API_KEY=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

# Database
DATABASE_URL=mysql://...
```

### 12.2 参考资料

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [Cartesia Sonic API](https://docs.cartesia.ai/)
- [StudyFetch Tutor Me](https://www.studyfetch.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/)

---

> **文档维护说明**：本文档为 Tutorace 项目的唯一真相文档（Source of Truth），所有设计决策和技术选型应以本文档为准。如有更新，请同步修改本文档并更新版本号。
