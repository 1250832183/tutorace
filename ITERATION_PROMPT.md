# TutorAce Agent 迭代启动提示词

> 复制以下提示词到新的 Manus 对话中，即可启动一轮新的迭代

---

## 🚀 启动迭代提示词（复制即用）

```
请阅读 GitHub 仓库 ZHouliRic/tutorace 中的以下文档：

1. AGENT_ITERATION_SOP.md - 迭代规约文档（固定不变）
2. CURRENT_ISSUES.md - 当前待修复问题
3. iterations/ 目录 - 迭代历史归档

按照 SOP 中的迭代流程，执行一轮完整的 Agent 行为优化迭代：

Phase 1: 对抗性 Persona 生成
- 阅读 iterations/ 目录中的历史迭代，了解系统已知能力
- 分析系统可能的盲区
- 生成一个新的对抗性 Persona（目的是发现系统弱点）

Phase 2: E2E 模拟测试
- 访问 TutorAce 应用
- 选择一个课程开始 Session
- 以对抗性 Persona 的视角体验完整的教学流程
- 用文字输入模拟语音对话

Phase 3-7: 问题收集、设计思考、实现修复、部署验证、回归测试

Phase 8: 归档
- 在 iterations/ 目录创建新的归档文件 iteration_XXX.md
- 更新 CURRENT_ISSUES.md

核心原则：
- 不要通过增加按钮、模式、选项来解决问题
- 要通过让 Agent 更智能地理解和响应用户来解决问题
- 对抗性 Persona 的目的是发现系统边界，推动系统进化

开始吧！
```

---

## 🔧 修复当前问题的启动提示词

```
请阅读 GitHub 仓库 ZHouliRic/tutorace 中的以下文档：

1. AGENT_ITERATION_SOP.md - 迭代规约文档
2. CURRENT_ISSUES.md - 当前待修复问题

修复 CURRENT_ISSUES.md 中优先级最高的问题：

按照 SOP 流程：
1. 分析问题根因
2. 设计修复方案（遵循 Less Structure 哲学）
3. 实现并部署
4. E2E 验证
5. 更新 CURRENT_ISSUES.md（将问题移至"已修复"）

开始修复！
```

---

## 🔄 回归测试的启动提示词

```
请阅读 GitHub 仓库 ZHouliRic/tutorace 中的 AGENT_ITERATION_SOP.md 文档。

执行回归测试，验证所有基本功能正常：

测试检查清单：
- [ ] Agent 进入后有自然的开场白
- [ ] 教学结束后有导航引导
- [ ] 用户提问后有导航引导
- [ ] 翻页后 Agent 自动开始教学
- [ ] Agent 能理解用户反馈并调整行为

阅读 iterations/ 目录中的历史 Persona，选择一个进行完整的教学流程测试，记录测试结果。
```

---

## 📂 文档结构说明

```
AGENT_ITERATION_SOP.md      ← 规约文档（固定不变）
ITERATION_PROMPT.md         ← 本文档（启动提示词）
CURRENT_ISSUES.md           ← 当前待修复问题（动态更新）
iterations/                 ← 迭代历史归档目录
  ├── iteration_000.md      ← 初始版本
  ├── iteration_001.md      ← 第一轮迭代
  └── ...
```

**规则：**
- `AGENT_ITERATION_SOP.md` 内容固定，定义迭代的规则和流程
- 每次迭代完成后，在 `iterations/` 目录创建新的归档文件
- `CURRENT_ISSUES.md` 记录当前待修复问题，修复后移至归档
- 迭代历史不污染规约文档，保持上下文清洁

---

## 🔄 持续迭代工作流

```
┌─────────────────────────────────────────────────────────────┐
│                    TutorAce Agent 迭代循环                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────┐    ┌─────────┐            │
│   │ 阅读归档    │───▶│ 生成    │───▶│ E2E     │            │
│   │ 分析盲区    │    │ 对抗性  │    │ 测试    │            │
│   │             │    │ Persona │    │         │            │
│   └─────────────┘    └─────────┘    └─────────┘            │
│          ▲                               │                  │
│          │                               ▼                  │
│   ┌─────────────┐    ┌─────────┐    ┌─────────┐            │
│   │ 创建归档    │◀───│ 部署    │◀───│ 设计    │            │
│   │ 更新 Issues │    │ 验证    │    │ 修复    │            │
│   └─────────────┘    └─────────┘    └─────────┘            │
│                                                             │
│   规约文档: AGENT_ITERATION_SOP.md（固定不变）              │
│   当前问题: CURRENT_ISSUES.md（动态更新）                   │
│   迭代历史: iterations/（归档备查）                         │
│   设计哲学: Less Structure, More Intelligence               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 注意事项

1. **每次迭代生成新的对抗性 Persona** - 不是从固定库中选择
2. **对抗性 Persona 的目的是发现系统弱点** - 不是模拟普通用户
3. **规约文档固定不变** - 只有 CURRENT_ISSUES.md 和 iterations/ 会更新
4. **遵循设计哲学** - 不添加按钮和选项，让 Agent 更智能
5. **使用标准模板** - 问题记录使用 SOP 中的模板
6. **先修复后回归** - 修复问题后要进行回归测试
7. **提交到 GitHub** - 所有修改都要提交到版本控制

---

## 📍 关键链接

- **GitHub 仓库**: `https://github.com/ZHouliRic/tutorace`
- **TutorAce 应用**: `https://3000-isolcal74osb4qj3i0f4o-36d55f39.sg1.manus.computer/`
- **GitHub Actions**: `https://github.com/ZHouliRic/tutorace/actions`
- **Agent 代码**: `agent/agent.py`

