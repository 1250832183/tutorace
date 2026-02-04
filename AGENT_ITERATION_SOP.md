# TutorAce Agent 迭代 SOP

> **唯一真相文档** - 本文档是 Agent 行为优化的唯一参考标准

---

## 设计哲学

### Less Structure, More Intelligence

我们不通过增加按钮、模式、选项来解决问题。我们通过让 Agent 更智能地理解和响应用户来解决问题。

**核心原则：**
1. **感知** - Agent 应该能感知用户的情绪、耐心程度、学习风格
2. **适应** - Agent 应该根据感知自动调整行为，无需用户手动选择
3. **自然** - Agent 的反应应该像一个优秀的人类老师，而不是一个机器人

**禁止的解决方案：**
- ❌ 添加"快速模式"/"详细模式"按钮
- ❌ 添加"教学风格"选择器
- ❌ 添加任何需要用户预先配置的选项

**鼓励的解决方案：**
- ✅ Agent 检测到用户不耐烦时自动简化回答
- ✅ Agent 检测到用户困惑时自动放慢节奏
- ✅ Agent 根据用户的问题深度调整回答深度

---

## 迭代流程

### Phase 1: Persona 选择

从 Persona 库中选择一个用户画像，或根据需要创建新的 Persona。

### Phase 2: E2E 模拟测试

1. 进入 TutorAce 首页
2. 选择一个课程开始 Session
3. 以 Persona 的视角体验完整的教学流程
4. 记录所有对话内容和 Agent 行为

### Phase 3: 问题收集

使用标准模板记录发现的问题：
- 问题描述
- 用户期望 vs 实际行为
- Persona 的内心 OS（情绪反应）

### Phase 4: 设计思考

以产品设计师视角分析问题：
- 这个问题的根本原因是什么？
- 如何用"更智能"而不是"更多结构"来解决？
- 修改后会影响其他场景吗？

### Phase 5: 实现修复

修改 Agent 代码（主要是 `agent/agent.py` 中的 instructions 或行为逻辑）

### Phase 6: 部署验证

1. 推送代码到 GitHub
2. 等待 GitHub Actions 部署完成
3. 开始新的 Session 验证修复

### Phase 7: 回归测试

使用之前的 Persona 进行回归测试，确保修复没有破坏已有功能

### Phase 8: 记录归档

更新迭代历史，记录本轮迭代的改进

---

## Persona 库

### Persona 1: 小明 (低耐心学生)
- **特点**: 耐心低、容易困惑、注意力短、喜欢快速获取信息
- **行为模式**: 
  - 如果 Agent 说太久会打断或表示不耐烦
  - 喜欢简短直接的回答
  - 经常问"所以重点是什么？"
- **典型语句**: 
  - "Too long! Just tell me the key point"
  - "Can you make it shorter?"
  - "I don't have time for this"

### Persona 2: 小红 (好奇心强的学生)
- **特点**: 求知欲强、喜欢深入了解、经常追问
- **行为模式**: 
  - 每个概念都想深入了解
  - 经常问"为什么？"
  - 喜欢举例和类比
- **典型语句**: 
  - "Why is that?"
  - "Can you give me an example?"
  - "How does this relate to...?"

### Persona 3: 小刚 (害羞的学生)
- **特点**: 不太敢提问、怕问傻问题、需要鼓励
- **行为模式**: 
  - 很少主动提问
  - 即使不懂也不说
  - 需要 Agent 主动检查理解
- **典型语句**: 
  - "..." (沉默)
  - "I think I understand" (其实不太懂)
  - "Maybe..." (不确定)

### Persona 4: 小美 (多任务学生)
- **特点**: 同时做多件事、注意力分散、需要重复
- **行为模式**: 
  - 经常走神
  - 需要 Agent 重复关键点
  - 可能错过重要信息
- **典型语句**: 
  - "Sorry, can you repeat that?"
  - "Wait, what did you say about...?"
  - "I missed the last part"

### Persona 5: 小华 (挑战型学生)
- **特点**: 喜欢质疑、测试 Agent 的知识边界
- **行为模式**: 
  - 问一些边缘问题
  - 故意问错误的信息看 Agent 反应
  - 喜欢辩论
- **典型语句**: 
  - "Are you sure about that?"
  - "I read somewhere that..."
  - "But what about...?"

---

## 问题记录模板

```markdown
### 问题 #[编号]

**发现时间**: [日期]
**Persona**: [使用的 Persona]
**课程**: [测试的课程名称]

**问题描述**:
[具体描述问题]

**用户输入**:
> [用户说了什么]

**Agent 实际回应**:
> [Agent 实际说了什么]

**用户期望**:
> [用户期望 Agent 说什么]

**Persona 内心 OS**:
> [Persona 的情绪反应]

**根因分析**:
[问题的根本原因是什么]

**设计思考**:
[如何用"更智能"而不是"更多结构"来解决]

**修复方案**:
[具体的代码修改方案]

**状态**: [ ] 待修复 / [x] 已修复
```

---

## 迭代历史

### Iteration 0: 初始版本 (2026-02-04)

**基线状态**:
- Agent 进入后会说 "Got it!" 等不自然的开场白
- 教学结束后没有导航引导
- 用户不知道如何继续

**修复内容**:
1. 添加自然的开场白: "Hey there! Welcome to your lesson. I'm Spark..."
2. 教学结束后添加导航引导: "When you're ready, click the arrow to continue to the next slide!"
3. 回答问题后添加引导: "Feel free to ask more questions, or click the arrow to continue!"

**验证结果**: ✅ 通过

---

### Iteration 1: 低耐心学生优化 (2026-02-04)

**Persona**: 小明 (低耐心学生)

**发现的问题**:

#### 问题 #1: 开场白重复 "dive in"
- 开场白说 "Let's dive into..."
- 教学内容结尾又说 "Let's dive in..."
- **状态**: [ ] 待修复

#### 问题 #2: 默认回答太详细
- 用户问简单问题，Agent 给出过于详细的回答
- 例如问 "What is Five Dynasties?"，Agent 列出所有 5 个朝代的详细信息
- **状态**: [ ] 待修复

#### 问题 #3: Agent 能适应用户反馈
- ✅ 用户说"太长了"，Agent 能给出简洁总结
- 这是一个正面发现，说明 Agent 有一定的适应能力

**设计思考**:
- 问题 #2 的解决方案不应该是添加"简洁模式"按钮
- 而是应该让 Agent 默认给出适中长度的回答
- 如果用户追问，再展开详细信息

---

## 当前待修复问题

- [ ] 问题 #1: 开场白重复 "dive in"
- [ ] 问题 #2: 默认回答太详细

---

## Agent 代码位置

主要修改文件: `agent/agent.py`

关键区域:
- `instructions` 变量 (第 85-120 行): Agent 的行为规则
- `teach_slide` 函数 (第 208-240 行): 教学逻辑
- `on_enter` 函数 (第 129-132 行): 进入 Session 时的行为

---

## 部署流程

```bash
# 1. 修改代码
vim agent/agent.py

# 2. 提交并推送
git add -A
git commit -m "Fix: [问题描述]"
git push

# 3. 等待 GitHub Actions 部署 (约 30-60 秒)
# 查看状态: https://github.com/ZHouliRic/tutorace/actions

# 4. 开始新的 Session 测试
# 访问: https://3000-isolcal74osb4qj3i0f4o-36d55f39.sg1.manus.computer/
```

---

## 测试检查清单

每次迭代后，使用以下检查清单验证基本功能:

- [ ] Agent 进入后有自然的开场白
- [ ] 教学结束后有导航引导
- [ ] 用户提问后有导航引导
- [ ] 翻页后 Agent 自动开始教学
- [ ] Agent 能理解用户反馈并调整行为

---

## 附录: 设计决策记录

### 决策 1: 为什么不添加"教学风格"选择器？

**问题**: 不同用户有不同的学习风格偏好

**传统解决方案**: 添加一个选择器让用户选择"快速"/"详细"/"互动"等模式

**我们的解决方案**: 让 Agent 通过用户的行为自动检测并适应

**理由**:
1. 用户不一定知道自己想要什么风格
2. 用户的偏好可能随时间变化
3. 增加选择会增加用户的认知负担
4. 一个优秀的老师不会问学生"你想要什么风格的教学"，而是会观察并适应

### 决策 2: 为什么教学结尾要说"click the arrow"？

**问题**: 用户不知道如何继续到下一页

**考虑的方案**:
1. 自动翻页 - 但这剥夺了用户的控制权
2. 问用户"准备好了吗？" - 但这需要用户回应
3. 告诉用户如何操作 - 给用户控制权，同时提供清晰指引

**我们的选择**: 方案 3

**理由**: 让用户控制节奏，同时消除困惑

