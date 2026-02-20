# PostHog 埋点事件设计文档

## 📊 事件概览

本文档定义了 Tutorace 项目的完整埋点方案，包括事件名称、属性和触发时机。

---

## 1️⃣ 生成入口点击

### 事件名称：`lesson_entry_clicked`

**描述**：用户点击主页的三个入口之一

**触发时机**：
- 点击 "Upload a Document" 卡片
- 点击 "Learn a Topic" 的 "Generate Lesson" 按钮
- 点击 "Free Conversation" 的 "Start Chatting" 按钮

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `entry_type` | string | 入口类型 | `"document"`, `"topic"`, `"free_chat"` |
| `topic_input` | string (可选) | 用户输入的主题（仅 topic 类型） | `"Machine Learning Basics"` |
| `timestamp` | datetime | 点击时间戳 | `2024-02-06T10:30:00Z` |

---

## 2️⃣ 确认弹窗展示（暂未实现）

### 事件名称：`confirmation_dialog_shown`

**描述**：确认弹窗展示给用户

**触发时机**：
- 点击上传文件按钮后
- 完成文件上传后
- 输入 YouTube URL 后
- 输入 Topic 后

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `dialog_type` | string | 弹窗类型 | `"file_upload"`, `"youtube_url"`, `"topic_input"` |
| `content_value` | string (可选) | 相关内容值 | 文件名/URL/主题 |
| `timestamp` | datetime | 展示时间戳 | `2024-02-06T10:30:00Z` |

### 事件名称：`confirmation_dialog_action`

**描述**：用户在确认弹窗中的操作

**触发时机**：
- 点击 "Cancel" 按钮
- 点击 "Generate" 按钮

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `action` | string | 用户操作 | `"cancel"`, `"generate"` |
| `dialog_type` | string | 弹窗类型 | `"file_upload"`, `"youtube_url"`, `"topic_input"` |
| `content_value` | string (可选) | 相关内容值 | 文件名/URL/主题 |
| `timestamp` | datetime | 操作时间戳 | `2024-02-06T10:30:00Z` |

---

## 3️⃣ 生成课程中

### 事件名称：`lesson_generation_started`

**描述**：开始生成课程

**触发时机**：
- 点击 "Generate Lesson" 后，API 调用开始

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `generation_type` | string | 生成类型 | `"document"`, `"youtube"`, `"topic"`, `"free_chat"` |
| `source_name` | string (可选) | 源名称 | 文件名/YouTube链接/主题名称 |
| `topic` | string (可选) | 主题（仅 topic 类型） | `"Machine Learning Basics"` |
| `youtube_url` | string (可选) | YouTube URL（仅 youtube 类型） | `"https://youtube.com/watch?v=..."` |
| `file_name` | string (可选) | 文件名（仅 document 类型） | `"ml_basics.pdf"` |
| `file_size` | number (可选) | 文件大小（字节） | `1024000` |
| `timestamp` | datetime | 开始时间戳 | `2024-02-06T10:30:00Z` |

---

## 4️⃣ 课程生成完成

### 事件名称：`lesson_generation_completed`

**描述**：课程生成成功完成

**触发时机**：
- API 返回成功，课程计划生成完毕

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `generation_type` | string | 生成类型 | `"document"`, `"youtube"`, `"topic"`, `"free_chat"` |
| `source_name` | string (可选) | 源名称 | 文件名/YouTube链接/主题名称 |
| `lesson_plan_id` | string | 课程计划 ID | `"lp_abc123"` |
| `lesson_title` | string | 课程标题 | `"Introduction to Machine Learning"` |
| `topics_count` | number | 主题数量 | `5` |
| `generation_duration_ms` | number | 生成耗时（毫秒） | `3500` |
| `timestamp` | datetime | 完成时间戳 | `2024-02-06T10:30:03Z` |

### 事件名称：`lesson_generation_failed`

**描述**：课程生成失败

**触发时机**：
- API 返回错误

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `generation_type` | string | 生成类型 | `"document"`, `"youtube"`, `"topic"`, `"free_chat"` |
| `source_name` | string (可选) | 源名称 | 文件名/YouTube链接/主题名称 |
| `error_message` | string | 错误信息 | `"API rate limit exceeded"` |
| `error_code` | string (可选) | 错误代码 | `"RATE_LIMIT"` |
| `generation_duration_ms` | number | 生成耗时（毫秒） | `1200` |
| `timestamp` | datetime | 失败时间戳 | `2024-02-06T10:30:01Z` |

---

## 5️⃣ 课程详情页展示

### 事件名称：`lesson_session_started`

**描述**：进入课程对话页面

**触发时机**：
- 成功连接到 LiveKit 房间，页面加载完成

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `lesson_title` | string (可选) | 课程标题 | `"Introduction to Machine Learning"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `room_id` | string | LiveKit 房间 ID | `"room_xyz789"` |
| `timestamp` | datetime | 开始时间戳 | `2024-02-06T10:30:05Z` |

### 事件名称：`voice_message_sent`

**描述**：用户发送语音消息

**触发时机**：
- 用户通过麦克风说话（检测到语音活动结束）

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `message_duration_ms` | number | 语音时长（毫秒） | `3500` |
| `is_muted` | boolean | 是否静音状态 | `false` |
| `timestamp` | datetime | 发送时间戳 | `2024-02-06T10:31:00Z` |

### 事件名称：`text_message_input`

**描述**：用户在文本输入框中输入

**触发时机**：
- 用户在文本框中输入内容（防抖处理，停止输入 1 秒后触发）

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `message_length` | number | 消息长度（字符数） | `45` |
| `timestamp` | datetime | 输入时间戳 | `2024-02-06T10:31:05Z` |

### 事件名称：`text_message_sent`

**描述**：用户点击发送按钮发送文本消息

**触发时机**：
- 点击发送按钮或按 Enter 键

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `message_length` | number | 消息长度（字符数） | `45` |
| `send_method` | string | 发送方式 | `"button"`, `"enter_key"` |
| `timestamp` | datetime | 发送时间戳 | `2024-02-06T10:31:10Z` |

### 事件名称：`lesson_slide_changed`

**描述**：PPT 翻页（如果有课程大纲展示）

**触发时机**：
- 用户点击上一页/下一页按钮
- 自动切换到下一个主题

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string | 课程计划 ID | `"lp_abc123"` |
| `from_topic_index` | number | 原主题索引 | `0` |
| `to_topic_index` | number | 目标主题索引 | `1` |
| `topic_title` | string | 当前主题标题 | `"What is Machine Learning?"` |
| `change_type` | string | 切换类型 | `"manual"`, `"auto"` |
| `direction` | string | 切换方向 | `"next"`, `"previous"` |
| `timestamp` | datetime | 切换时间戳 | `2024-02-06T10:32:00Z` |

### 事件名称：`session_exit_clicked`

**描述**：点击退出按钮

**触发时机**：
- 用户点击退出/关闭按钮

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `session_duration_ms` | number | 会话时长（毫秒） | `180000` |
| `messages_sent` | number | 发送消息数 | `12` |
| `timestamp` | datetime | 退出时间戳 | `2024-02-06T10:33:00Z` |

---

## 6️⃣ 课程对话统计

### 事件名称：`conversation_message_received`

**描述**：收到 AI 助手的回复消息

**触发时机**：
- AI 助手完成一次回复

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `message_length` | number | 消息长度（字符数） | `120` |
| `response_time_ms` | number | 响应时间（毫秒） | `850` |
| `timestamp` | datetime | 接收时间戳 | `2024-02-06T10:31:15Z` |

### 事件名称：`lesson_session_ended`

**描述**：课程会话结束（汇总统计）

**触发时机**：
- 用户断开连接或关闭页面

**事件属性**：

| 属性名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `lesson_plan_id` | string (可选) | 课程计划 ID | `"lp_abc123"` |
| `session_type` | string | 会话类型 | `"lesson"`, `"free_chat"` |
| `session_duration_ms` | number | 会话总时长（毫秒） | `180000` |
| `user_messages_count` | number | 用户消息总数 | `12` |
| `agent_messages_count` | number | AI 消息总数 | `13` |
| `voice_messages_count` | number | 语音消息数 | `8` |
| `text_messages_count` | number | 文本消息数 | `4` |
| `topics_completed` | number (可选) | 完成的主题数 | `3` |
| `avg_response_time_ms` | number | 平均响应时间（毫秒） | `920` |
| `exit_reason` | string | 退出原因 | `"user_action"`, `"disconnected"`, `"error"` |
| `timestamp` | datetime | 结束时间戳 | `2024-02-06T10:33:00Z` |

---

## 📋 PostHog 后台配置清单

### Actions（动作）

在 PostHog 后台创建以下 Actions：

1. **Lesson Entry Clicked**
   - Event name: `lesson_entry_clicked`
   - Description: 用户点击主页入口

2. **Lesson Generation Started**
   - Event name: `lesson_generation_started`
   - Description: 开始生成课程

3. **Lesson Generation Completed**
   - Event name: `lesson_generation_completed`
   - Description: 课程生成成功

4. **Lesson Session Started**
   - Event name: `lesson_session_started`
   - Description: 进入课程对话页面

5. **Message Sent**
   - Event name: `text_message_sent` OR `voice_message_sent`
   - Description: 用户发送消息（文本或语音）

6. **Session Exit**
   - Event name: `session_exit_clicked`
   - Description: 用户退出会话

### Insights（洞察）

建议创建的分析图表：

1. **Conversion Funnel（转化漏斗）**
   ```
   lesson_entry_clicked 
   → lesson_generation_started 
   → lesson_generation_completed 
   → lesson_session_started
   ```

2. **Entry Type Distribution（入口类型分布）**
   - Event: `lesson_entry_clicked`
   - Breakdown by: `entry_type`
   - Chart type: Pie chart

3. **Generation Success Rate（生成成功率）**
   - Events: `lesson_generation_completed` vs `lesson_generation_failed`
   - Chart type: Trend

4. **Average Session Duration（平均会话时长）**
   - Event: `lesson_session_ended`
   - Aggregate: Average of `session_duration_ms`
   - Chart type: Number

5. **Messages Per Session（每会话消息数）**
   - Event: `lesson_session_ended`
   - Aggregate: Average of `user_messages_count`
   - Chart type: Trend

6. **Response Time Distribution（响应时间分布）**
   - Event: `conversation_message_received`
   - Property: `response_time_ms`
   - Chart type: Histogram

### Dashboards（仪表板）

建议创建的仪表板：

1. **User Journey Dashboard（用户旅程仪表板）**
   - Conversion funnel
   - Entry type distribution
   - Generation success rate

2. **Engagement Dashboard（参与度仪表板）**
   - Active sessions (real-time)
   - Average session duration
   - Messages per session
   - Voice vs text message ratio

3. **Performance Dashboard（性能仪表板）**
   - Generation duration trend
   - Response time distribution
   - Error rate

---

## 🔧 实现优先级

### P0（必须实现）
- ✅ `lesson_entry_clicked`
- ✅ `lesson_generation_started`
- ✅ `lesson_generation_completed`
- ✅ `lesson_session_started`
- ✅ `lesson_session_ended`

### P1（高优先级）
- ✅ `text_message_sent`
- ✅ `voice_message_sent`
- ✅ `conversation_message_received`
- ✅ `session_exit_clicked`

### P2（中优先级）
- ⚪ `lesson_generation_failed`
- ⚪ `text_message_input`
- ⚪ `lesson_slide_changed`

### P3（低优先级）
- ⚪ `confirmation_dialog_shown`
- ⚪ `confirmation_dialog_action`

---

## 📝 注意事项

1. **隐私保护**：不要在事件中包含敏感的用户输入内容（如完整的对话内容），只记录长度和统计信息
2. **性能考虑**：高频事件（如 `text_message_input`）需要防抖处理
3. **错误处理**：所有埋点代码都应该有 try-catch，避免影响用户体验
4. **测试环境**：在开发环境中使用不同的 PostHog 项目或添加 `environment` 属性区分

---

## 🔗 相关链接

- PostHog 文档: https://posthog.com/docs
- 项目 PostHog Key: `phc_Qa3WWk9XBhU4yGcrI8hnYjfhq6hKpEKU2i3jxGbemz1`
- PostHog Host: `https://us.i.posthog.com`
