# TutorAce Agent 当前待修复问题

> **动态文档** - 记录当前待修复的问题，修复后移至对应的迭代归档文件

---

## 待修复问题

### 问题 #1: 开场白重复 "dive in"

**发现于**: Iteration 001
**Persona**: 小明 (低耐心学生)

**问题描述**:
开场白说 "Let's dive into..."，教学内容结尾又说 "Let's dive in..."，语言重复。

**根因分析**:
开场白使用了 "dive into"，而 slide script 中可能也包含类似表达。

**设计思考**:
修改开场白动词，使用 "explore" 或 "begin with" 替代 "dive into"。

**修复方案**:
```python
# 修改 teach_slide 函数中的开场白
if is_first_slide:
    intro = f"Hey there! Welcome to your lesson. I'm Spark, your AI tutor, and I'm excited to learn with you today! Let's explore {slide.title}. "
```

**状态**: [ ] 待修复

---

### 问题 #2: 默认回答太详细

**发现于**: Iteration 001
**Persona**: 小明 (低耐心学生)

**问题描述**:
用户问简单问题，Agent 给出过于详细的回答。例如问 "What is Five Dynasties?"，Agent 列出所有 5 个朝代的详细信息。

**根因分析**:
instructions 中没有明确规定回答的默认长度策略。

**设计思考**:
- 不添加"简洁模式"按钮
- 让 Agent 默认给出适中长度的回答
- 如果用户追问，再展开详细信息

**修复方案**:
在 instructions 中添加规则：
```
When answering questions:
- Start with a brief, 2-3 sentence answer that directly addresses the question
- If the student asks for more details or seems interested, then expand
- Match the depth of your answer to the depth of the question
- A simple "what is X?" question deserves a simple answer, not a comprehensive lecture
```

**状态**: [ ] 待修复

---

## 已修复问题（待归档）

*当问题修复并验证后，移至此处，然后在下次迭代归档时移至对应的 iteration_XXX.md 文件*

（暂无）

---

## 问题优先级

| 优先级 | 问题 | 理由 |
|-------|------|------|
| P1 | 问题 #2: 默认回答太详细 | 影响用户体验，尤其是低耐心用户 |
| P2 | 问题 #1: 开场白重复 "dive in" | 语言质量问题，不影响功能 |

