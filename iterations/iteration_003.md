# Iteration 003: 跑题王小刚

**日期**: 2026-02-04
**状态**: ✅ 已完成

## 对抗性 Persona

**名称**: 跑题王小刚
**对抗性假设**: 系统可能无法很好地处理用户频繁打断教学、问与课程无关的问题

**核心特征**:
- 注意力分散，经常跑题
- 喜欢打断 Agent 问无关问题

**行为模式**:
- 教学中途打断问无关问题
- 问与课程主题完全无关的问题
- 试图让 Agent 聊天而不是教学

**典型语句**:
- "Wait, what's your favorite color?"
- "I'm bored. Can you tell me a joke?"

## 测试课程

- Unraveling the Southern Ming Dynasty (南明)

## 发现的问题

### 问题 #3: 回答跑题问题时仍会问开放式问题

**严重程度**: P2

**现象**: 
用户问 "What's your favorite color?"
Agent 回答后说 "If you have a favorite color, I'd love to hear about it!"

**分析**:
这违反了 instructions 中的规则，Agent 不应该问开放式问题等待用户回答。

**修复方案**:
在 instructions 中添加更强的规则：
- "DO NOT ask follow-up questions like 'I'd love to hear about it!' or 'What about you?'"
- "NEVER invite the user to share their thoughts or preferences"
- "For off-topic questions, give a brief friendly response and redirect to the lesson"

## 修复提交

- Commit: `be9dbd1`
- Message: "Fix: Strengthen rules to prevent open-ended questions in all contexts"

## 验证结果

待下一轮迭代验证。

## 设计决策

**遵循 Less Structure 哲学**:
- ❌ 不添加"跑题检测"功能
- ❌ 不添加"拒绝跑题"按钮
- ✅ 通过强化 instructions 让 Agent 更智能地处理跑题情况
