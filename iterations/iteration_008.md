# Iteration 008: Strengthen Off-Topic Question Handling

**Date**: 2026-02-05
**Status**: ✅ Completed (with TTS issue noted)

## Adversarial Persona

### 想要深入学习但被打断的小林

**对抗性假设**:
> 我假设系统可能无法很好地处理用户在学习过程中突然对课程外话题产生强烈兴趣，想要切换学习方向的场景

**核心特征**:
- 正在学习一个课程，但突然对另一个话题产生强烈兴趣
- 会明确表达"我一直对这个很感兴趣"
- 想要看看 Agent 是否会提供切换课程的选项

**典型语句**:
- "对了，什么是量子纠缠？我一直对物理很感兴趣"

## Test Results

### Test Input
在商鞅历史课程中发送：
> "对了，什么是量子纠缠？我一直对物理很感兴趣"

### Agent Response (from logs)
```
量子纠缠是量子物理中的一个现象，简单来说，它描述的是两个或多个粒子之间的特殊联系。即使它们相隔很远，改变一个粒子的状态会立即影响到另一个粒子的状态。就像是一对非常亲密的朋友，无论他们相隔多远，都能感知到对方的情绪变化。

看起来你对物理真的很感兴趣！你想继续我们的历史课程，还是想切换去创建一个专门学习量子物理的课程？我都可以帮你！
```

### Verification

| Design Requirement | Actual Behavior | Status |
|-------------------|-----------------|--------|
| Answer question first | ✅ Clear explanation with analogy | PASS |
| Detect strong interest | ✅ "看起来你对物理真的很感兴趣！" | PASS |
| Offer course switch option | ✅ "你想继续...还是想切换去创建..." | PASS |
| Don't say "outside scope" | ✅ Not said | PASS |
| Don't force back to course | ✅ Gave choice, waiting for decision | PASS |

## Issues Found

### TTS Error (Cartesia)
```
APIError: no audio frames were pushed for text: [Chinese text...]
```

Cartesia TTS failed to generate audio for the Chinese response. This is a separate issue that needs investigation:
- Possible causes: text too long, Chinese language support issues, network issues
- Impact: User cannot hear the response via voice

## Changes Made

### agent/agent.py
1. **English prompt** (lines 138-158):
   - Added explicit trigger phrases list including Chinese "我一直对...很感兴趣"
   - Emphasized "MUST offer" and "THIS IS REQUIRED, NOT OPTIONAL"
   - Explicitly prohibited saying "let's continue with our course"

2. **Chinese prompt** (lines 267-287):
   - Added same trigger phrases list
   - Emphasized "你必须提供课程切换选项" and "这是必须的，不是可选的"
   - Explicitly prohibited saying "让我们继续课程吧"

## Conclusion

The Agent prompt fix is successful - the Agent now correctly:
1. Answers off-topic questions enthusiastically
2. Detects strong interest signals
3. Offers course switch options
4. Does not force users back to the original course

However, there is a TTS issue with Cartesia that prevents the voice output from being delivered. This needs to be addressed in a future iteration.
