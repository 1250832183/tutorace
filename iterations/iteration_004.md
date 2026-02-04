# Iteration 004: 困惑的小美

**日期**: 2026-02-04
**Persona**: 困惑的小美
**测试课程**: Unlocking the Power of Linear Algebra

## 对抗性假设

> 我假设系统可能无法很好地处理用户表达困惑、要求重新解释、或说"我不懂"的情况

## Persona 特征

- 容易困惑，经常说"我不懂"
- 需要多次解释才能理解
- 会要求用更简单的方式解释

## 测试场景

### 场景 1: 用户第一次表示困惑
- **用户**: "I don't understand. This is too complicated."
- **Agent**: 用面团比喻重新解释
- **结果**: ✅ 通过 - Agent 友好地用简单语言重新解释

### 场景 2: 用户第二次表示困惑
- **用户**: "I still don't get it. Can you give me a real example?"
- **Agent**: 给出详细的矩阵乘法数学例子
- **结果**: ⚠️ 问题 - 用户说"太复杂"，Agent 却给出更复杂的数学推导

## 发现的问题

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| #4: 教学内容中包含开放式问题 | P2 | 来自 slide script，Agent 直接读取 |
| #5: 用户说"太复杂"时回答更复杂 | P2 | 应该简化而不是详细化 |

## 修复方案

### 问题 #5 修复
在 instructions 中添加规则：
```
When user expresses confusion ("I don't understand", "too complicated", etc.):
- Use SIMPLER language and everyday analogies, NOT more technical details
- Give a SHORT, concrete example from daily life (like cooking, sports, or games)
- Avoid formulas, numbers, or technical jargon in your simplified explanation
- If they're still confused after 2 attempts, suggest moving to the next slide and coming back later
```

## 设计思考

**Less Structure 哲学应用**:
- 不添加"困惑检测"功能或"简化模式"按钮
- 通过 instructions 让 Agent 更智能地感知用户困惑程度
- Agent 应该自动调整解释复杂度，而不是需要用户选择模式

## 提交记录

- `a0ea250` - Fix: When user is confused, use simpler explanations not more details
