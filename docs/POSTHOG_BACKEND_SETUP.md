# PostHog 后台配置指南

本文档提供在 PostHog 后台创建埋点所需的完整配置信息。

---

## 📋 快速开始

### 1. 登录 PostHog

访问：https://us.i.posthog.com/

使用您的账号登录

### 2. 选择项目

确保选择了正确的项目（使用 API Key: `phc_Qa3WWk9XBhU4yGcrI8hnYjfhq6hKpEKU2i3jxGbemz1`）

---

## 🎯 Actions（动作）配置

在 PostHog 后台，导航到 **Data Management** → **Actions**，创建以下动作：

### Action 1: Lesson Entry Clicked

**基本信息**：
- **Name**: `Lesson Entry Clicked`
- **Description**: `用户点击主页的学习入口（上传文档/输入主题/自由对话）`

**匹配规则**：
- **Event name**: `lesson_entry_clicked`
- **Match type**: Exact match

**属性说明**：
- `entry_type`: 入口类型（document/topic/free_chat）
- `topic_input`: 用户输入的主题（可选）

---

### Action 2: Lesson Generation Started

**基本信息**：
- **Name**: `Lesson Generation Started`
- **Description**: `开始生成课程计划`

**匹配规则**：
- **Event name**: `lesson_generation_started`
- **Match type**: Exact match

**属性说明**：
- `generation_type`: 生成类型（document/youtube/topic/free_chat）
- `source_name`: 源名称（文件名/URL/主题）
- `topic`: 主题名称（可选）

---

### Action 3: Lesson Generation Completed

**基本信息**：
- **Name**: `Lesson Generation Completed`
- **Description**: `课程计划生成成功`

**匹配规则**：
- **Event name**: `lesson_generation_completed`
- **Match type**: Exact match

**属性说明**：
- `generation_type`: 生成类型
- `lesson_plan_id`: 课程计划 ID
- `lesson_title`: 课程标题
- `topics_count`: 主题数量
- `generation_duration_ms`: 生成耗时（毫秒）

---

### Action 4: Lesson Generation Failed

**基本信息**：
- **Name**: `Lesson Generation Failed`
- **Description**: `课程计划生成失败`

**匹配规则**：
- **Event name**: `lesson_generation_failed`
- **Match type**: Exact match

**属性说明**：
- `generation_type`: 生成类型
- `error_message`: 错误信息
- `error_code`: 错误代码（可选）
- `generation_duration_ms`: 生成耗时（毫秒）

---

### Action 5: Lesson Session Started

**基本信息**：
- **Name**: `Lesson Session Started`
- **Description**: `用户进入课程对话页面`

**匹配规则**：
- **Event name**: `lesson_session_started`
- **Match type**: Exact match

**属性说明**：
- `lesson_plan_id`: 课程计划 ID（可选）
- `lesson_title`: 课程标题（可选）
- `session_type`: 会话类型（lesson/free_chat）
- `room_id`: LiveKit 房间 ID

---

### Action 6: Text Message Sent

**基本信息**：
- **Name**: `Text Message Sent`
- **Description**: `用户发送文本消息`

**匹配规则**：
- **Event name**: `text_message_sent`
- **Match type**: Exact match

**属性说明**：
- `lesson_plan_id`: 课程计划 ID（可选）
- `session_type`: 会话类型
- `message_length`: 消息长度
- `send_method`: 发送方式（button/enter_key）

---

### Action 7: Voice Message Sent

**基本信息**：
- **Name**: `Voice Message Sent`
- **Description**: `用户发送语音消息`

**匹配规则**：
- **Event name**: `voice_message_sent`
- **Match type**: Exact match

**属性说明**：
- `lesson_plan_id`: 课程计划 ID（可选）
- `session_type`: 会话类型
- `message_duration_ms`: 语音时长（毫秒）
- `is_muted`: 是否静音状态

---

### Action 8: Session Exit Clicked

**基本信息**：
- **Name**: `Session Exit Clicked`
- **Description**: `用户点击退出按钮`

**匹配规则**：
- **Event name**: `session_exit_clicked`
- **Match type**: Exact match

**属性说明**：
- `lesson_plan_id`: 课程计划 ID（可选）
- `session_type`: 会话类型
- `session_duration_ms`: 会话时长（毫秒）
- `messages_sent`: 发送消息数

---

### Action 9: Lesson Session Ended

**基本信息**：
- **Name**: `Lesson Session Ended`
- **Description**: `课程会话结束（汇总统计）`

**匹配规则**：
- **Event name**: `lesson_session_ended`
- **Match type**: Exact match

**属性说明**：
- `lesson_plan_id`: 课程计划 ID（可选）
- `session_type`: 会话类型
- `session_duration_ms`: 会话总时长（毫秒）
- `user_messages_count`: 用户消息总数
- `agent_messages_count`: AI 消息总数
- `voice_messages_count`: 语音消息数
- `text_messages_count`: 文本消息数
- `avg_response_time_ms`: 平均响应时间（毫秒）
- `exit_reason`: 退出原因（user_action/disconnected/error）

---

## 📊 Insights（洞察）配置

在 PostHog 后台，导航到 **Product analytics** → **Insights**，创建以下图表：

### Insight 1: Conversion Funnel（转化漏斗）

**图表类型**: Funnel

**步骤配置**：
1. **Step 1**: `lesson_entry_clicked`
2. **Step 2**: `lesson_generation_started`
3. **Step 3**: `lesson_generation_completed`
4. **Step 4**: `lesson_session_started`

**时间窗口**: 1 hour（用户必须在 1 小时内完成所有步骤）

**可视化**：
- 显示转化率
- 显示每步流失人数

---

### Insight 2: Entry Type Distribution（入口类型分布）

**图表类型**: Pie Chart

**事件**: `lesson_entry_clicked`

**分组依据**: `entry_type`

**时间范围**: Last 7 days

**说明**: 查看用户最常使用的入口类型

---

### Insight 3: Generation Success Rate（生成成功率）

**图表类型**: Trend

**公式**:
```
(lesson_generation_completed / (lesson_generation_completed + lesson_generation_failed)) * 100
```

**配置**：
- **Series A**: Count of `lesson_generation_completed`
- **Series B**: Count of `lesson_generation_failed`
- **Formula**: `A / (A + B) * 100`

**时间范围**: Last 30 days

**说明**: 监控课程生成的成功率

---

### Insight 4: Average Session Duration（平均会话时长）

**图表类型**: Number

**事件**: `lesson_session_ended`

**聚合方式**: Average of `session_duration_ms`

**转换**: 除以 1000（转换为秒）

**时间范围**: Last 7 days

**说明**: 显示用户平均会话时长

---

### Insight 5: Messages Per Session（每会话消息数）

**图表类型**: Trend

**事件**: `lesson_session_ended`

**聚合方式**: Average of `user_messages_count`

**时间范围**: Last 30 days

**分组**: By day

**说明**: 追踪用户参与度趋势

---

### Insight 6: Voice vs Text Messages（语音 vs 文本消息）

**图表类型**: Stacked Bar Chart

**配置**：
- **Series A**: Count of `voice_message_sent`
- **Series B**: Count of `text_message_sent`

**时间范围**: Last 7 days

**分组**: By day

**说明**: 比较用户使用语音和文本的比例

---

### Insight 7: Response Time Distribution（响应时间分布）

**图表类型**: Histogram

**事件**: `conversation_message_received`

**属性**: `response_time_ms`

**桶大小**: 500ms

**时间范围**: Last 7 days

**说明**: 查看 AI 响应时间的分布情况

---

### Insight 8: Generation Duration Trend（生成耗时趋势）

**图表类型**: Line Chart

**事件**: `lesson_generation_completed`

**聚合方式**: Average of `generation_duration_ms`

**时间范围**: Last 30 days

**分组**: By day

**说明**: 监控课程生成性能

---

### Insight 9: Active Sessions (Real-time)（实时活跃会话）

**图表类型**: Number

**事件**: `lesson_session_started`

**时间范围**: Last 5 minutes

**过滤条件**: 
- `lesson_session_ended` NOT in last 5 minutes

**说明**: 显示当前活跃的会话数

---

### Insight 10: Exit Reason Breakdown（退出原因分析）

**图表类型**: Pie Chart

**事件**: `lesson_session_ended`

**分组依据**: `exit_reason`

**时间范围**: Last 7 days

**说明**: 了解用户如何结束会话

---

## 📈 Dashboards（仪表板）配置

在 PostHog 后台，导航到 **Dashboards** → **New Dashboard**，创建以下仪表板：

### Dashboard 1: User Journey（用户旅程）

**描述**: 追踪用户从进入到完成课程的完整旅程

**包含的 Insights**:
1. Conversion Funnel
2. Entry Type Distribution
3. Generation Success Rate
4. Active Sessions (Real-time)

**布局建议**:
```
┌─────────────────────────────────────┐
│     Conversion Funnel (Full Width)  │
├──────────────────┬──────────────────┤
│ Entry Type Dist. │ Generation Rate  │
├──────────────────┴──────────────────┤
│     Active Sessions (Full Width)    │
└─────────────────────────────────────┘
```

---

### Dashboard 2: Engagement（参与度）

**描述**: 监控用户参与度和互动情况

**包含的 Insights**:
1. Average Session Duration
2. Messages Per Session
3. Voice vs Text Messages
4. Exit Reason Breakdown

**布局建议**:
```
┌──────────────────┬──────────────────┐
│ Avg Session Dur. │ Messages/Session │
├──────────────────┴──────────────────┤
│  Voice vs Text Messages (Full Width)│
├─────────────────────────────────────┤
│  Exit Reason Breakdown (Full Width) │
└─────────────────────────────────────┘
```

---

### Dashboard 3: Performance（性能）

**描述**: 监控系统性能和响应时间

**包含的 Insights**:
1. Generation Duration Trend
2. Response Time Distribution
3. Generation Success Rate

**布局建议**:
```
┌─────────────────────────────────────┐
│  Generation Duration Trend (Full)   │
├─────────────────────────────────────┤
│  Response Time Distribution (Full)  │
├─────────────────────────────────────┤
│     Generation Success Rate         │
└─────────────────────────────────────┘
```

---

## 🔔 Alerts（告警）配置

在 PostHog 后台，导航到 **Alerts**，创建以下告警：

### Alert 1: Low Generation Success Rate

**条件**:
- **Metric**: Generation Success Rate
- **Threshold**: < 90%
- **Time window**: Last 1 hour
- **Frequency**: Check every 15 minutes

**通知方式**: Email / Slack

**说明**: 当课程生成成功率低于 90% 时发送告警

---

### Alert 2: High Response Time

**条件**:
- **Metric**: Average of `response_time_ms` from `conversation_message_received`
- **Threshold**: > 2000ms
- **Time window**: Last 30 minutes
- **Frequency**: Check every 10 minutes

**通知方式**: Email / Slack

**说明**: 当 AI 响应时间过长时发送告警

---

### Alert 3: Unusual Exit Rate

**条件**:
- **Metric**: Count of `session_exit_clicked` where `exit_reason` = "error"
- **Threshold**: > 10 events
- **Time window**: Last 1 hour
- **Frequency**: Check every 15 minutes

**通知方式**: Email / Slack

**说明**: 当异常退出数量过多时发送告警

---

## 🎨 Custom Properties（自定义属性）

如果需要创建自定义属性，在 PostHog 后台，导航到 **Data Management** → **Properties**：

### Property 1: session_type

**Type**: String

**Description**: 会话类型（lesson 或 free_chat）

**Possible values**:
- `lesson`: 有课程计划的学习会话
- `free_chat`: 自由对话会话

---

### Property 2: generation_type

**Type**: String

**Description**: 课程生成类型

**Possible values**:
- `document`: 从文档生成
- `youtube`: 从 YouTube 视频生成
- `topic`: 从主题生成
- `free_chat`: 自由对话（无课程计划）

---

### Property 3: entry_type

**Type**: String

**Description**: 用户进入的方式

**Possible values**:
- `document`: 上传文档
- `topic`: 输入主题
- `free_chat`: 自由对话

---

## 📝 Cohorts（用户群组）配置

在 PostHog 后台，导航到 **People** → **Cohorts**，创建以下用户群组：

### Cohort 1: Active Learners

**定义**: 在过去 7 天内至少完成一次课程会话的用户

**条件**:
- Performed `lesson_session_ended` at least 1 time in the last 7 days
- Where `session_type` = "lesson"

---

### Cohort 2: Free Chat Users

**定义**: 主要使用自由对话功能的用户

**条件**:
- Performed `lesson_entry_clicked` at least 3 times in the last 30 days
- Where `entry_type` = "free_chat"

---

### Cohort 3: Power Users

**定义**: 高度参与的用户

**条件**:
- Performed `lesson_session_ended` at least 5 times in the last 30 days
- Where `user_messages_count` > 10

---

### Cohort 4: Churned Users

**定义**: 曾经活跃但现在不活跃的用户

**条件**:
- Performed `lesson_session_started` at least 1 time between 30 and 60 days ago
- Did NOT perform `lesson_session_started` in the last 30 days

---

## 🧪 Feature Flags（功能开关）

如果需要 A/B 测试或灰度发布，在 PostHog 后台，导航到 **Feature Flags**：

### Example: New UI Test

**Flag key**: `new_ui_enabled`

**Description**: 测试新的用户界面设计

**Rollout**:
- 10% of users
- Target cohort: Active Learners

**Metrics to track**:
- Average Session Duration
- Messages Per Session
- Exit Reason

---

## 📚 Session Recordings（会话录制）

在 PostHog 后台，导航到 **Session Recordings**，配置录制规则：

### Recording Rule 1: Error Sessions

**条件**:
- Event `lesson_generation_failed` occurred
- OR Event `lesson_session_ended` where `exit_reason` = "error"

**说明**: 录制所有出现错误的会话，便于调试

---

### Recording Rule 2: Long Sessions

**条件**:
- Event `lesson_session_ended` where `session_duration_ms` > 600000 (10 minutes)

**说明**: 录制长时间会话，了解用户深度使用场景

---

## ✅ 验证清单

完成配置后，请验证以下内容：

- [ ] 所有 9 个 Actions 已创建
- [ ] 所有 10 个 Insights 已创建并正常显示数据
- [ ] 3 个 Dashboards 已创建并包含相应的 Insights
- [ ] 至少配置了 2 个 Alerts
- [ ] 自定义属性已正确识别
- [ ] 至少创建了 2 个 Cohorts
- [ ] Session Recordings 已启用（可选）

---

## 🔗 相关资源

- **PostHog 文档**: https://posthog.com/docs
- **API 参考**: https://posthog.com/docs/api
- **社区论坛**: https://posthog.com/questions
- **项目埋点设计文档**: `POSTHOG_EVENTS_DESIGN.md`

---

## 💡 最佳实践

1. **定期检查数据质量**: 确保事件正确触发，属性值符合预期
2. **设置告警**: 及时发现异常情况
3. **创建自定义仪表板**: 根据业务需求定制视图
4. **使用 Cohorts**: 针对不同用户群组进行分析
5. **启用 Session Recordings**: 深入了解用户行为
6. **定期回顾**: 每周查看关键指标，发现改进机会

---

## 📞 支持

如有问题，请联系：
- PostHog 支持: support@posthog.com
- 项目负责人: [您的联系方式]
