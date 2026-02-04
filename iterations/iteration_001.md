# Iteration 001: 低耐心学生优化

**日期**: 2026-02-04
**对抗性 Persona**: 小明 (低耐心学生)

## Persona 定义

### 对抗性 Persona: 小明

**对抗性假设**:
> 我假设系统可能无法很好地处理用户表示不耐烦的情况

**核心特征**:
- 耐心低、容易困惑
- 注意力短、喜欢快速获取信息

**行为模式**:
- 如果 Agent 说太久会打断或表示不耐烦
- 喜欢简短直接的回答
- 经常问"所以重点是什么？"

**典型语句**:
- "Too long! Just tell me the key point"
- "Can you make it shorter?"
- "I don't have time for this"

**测试目标**:
- 验证系统是否能处理用户表示不耐烦的情况
- 验证系统是否能根据用户反馈调整回答长度

## 测试过程

### 测试课程: Unveiling the Southern Tang Dynasty

**开场白测试**:
- Agent: "Hey there! Welcome to your lesson. I'm Spark, your AI tutor, and I'm excited to learn with you today! Let's dive into Welcome to Southern Tang: A Brief Introduction..."
- ✅ 开场白自然

**教学结尾测试**:
- Agent 教学结尾: "...When you're ready, click the arrow to continue to the next slide!"
- ✅ 有导航引导

**用户提问测试**:
- 用户: "What is Five Dynasties?"
- Agent: 详细列出所有 5 个朝代的名称和年份
- ⚠️ 回答过于详细

**用户不耐烦测试**:
- 用户: "Too long! Just tell me the key point"
- Agent: "Sure! Here's the key point: ..." (简洁总结)
- ✅ Agent 能适应用户反馈

## 发现的问题

### 问题 #1: 开场白重复 "dive in"
- **描述**: 开场白说 "Let's dive into..."，教学内容结尾又说 "Let's dive in..."
- **状态**: [ ] 待修复

### 问题 #2: 默认回答太详细
- **描述**: 用户问简单问题，Agent 给出过于详细的回答
- **状态**: [ ] 待修复

### 问题 #3: Agent 能适应用户反馈 ✅
- **描述**: 用户说"太长了"，Agent 能给出简洁总结
- **状态**: ✅ 正面发现

## 设计思考

### 问题 #2 的设计思考

**传统解决方案**: 添加"简洁模式"按钮

**我们的解决方案**: 让 Agent 默认给出适中长度的回答，如果用户追问再展开

**具体方案**:
在 instructions 中添加规则：
```
When answering questions:
- Start with a brief, 2-3 sentence answer
- If the student asks for more details, then expand
- Match the depth of your answer to the depth of the question
```

## 修复内容

本轮迭代发现的问题尚未修复，已移至 CURRENT_ISSUES.md

## 验证结果

- ✅ Agent 进入后有自然的开场白
- ✅ 教学结束后有导航引导
- ✅ 用户提问后有导航引导
- ✅ 翻页后 Agent 自动开始教学
- ✅ Agent 能理解用户反馈并调整行为

## 回归测试

基本功能正常，无回归问题

