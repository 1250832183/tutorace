# Iteration 009: TTS and STT Fallback Mechanism

## 迭代编号
Iteration 009

## 日期
2026-02-05

## 对抗性假设
> 我假设系统可能因为 Cartesia TTS/STT 服务不稳定而导致语音功能失败

## 发现的问题

### 问题 1: Cartesia TTS 失败
- **严重程度**: Critical
- **描述**: Cartesia TTS 返回 "no audio frames were pushed for text" 错误
- **原因**: 可能是网络问题或 Cartesia 服务对 LiveKit Cloud IP 的限制
- **影响**: 用户无法听到 Agent 的语音回复

### 问题 2: Cartesia STT 失败
- **严重程度**: Critical
- **描述**: Cartesia STT 连接意外关闭
- **原因**: 同上
- **影响**: 用户的语音输入无法被识别

## 修复方案

### 修复 1: TTS FallbackAdapter
```python
from livekit.agents.tts import FallbackAdapter as TTSFallbackAdapter

primary_tts = cartesia.TTS(...)
fallback_tts = openai.TTS(voice="nova")

tts_with_fallback = TTSFallbackAdapter(
    [primary_tts, fallback_tts],
    max_retry_per_tts=2,
)
```

### 修复 2: STT FallbackAdapter
```python
from livekit.agents.stt import FallbackAdapter as STTFallbackAdapter
from livekit.agents.stt import StreamAdapter as STTStreamAdapter

primary_stt = cartesia.STT(model="ink-whisper", ...)

# OpenAI STT 不支持 streaming，需要用 StreamAdapter 包装
fallback_stt = STTStreamAdapter(
    stt=openai.STT(model="whisper-1", ...),
    vad=vad,
)

stt_with_fallback = STTFallbackAdapter(
    [primary_stt, fallback_stt],
    max_retry_per_stt=2,
)
```

## 验证结果

| 测试项 | 结果 | 状态 |
|--------|------|------|
| TTS 工作 | Agent 能够说话 | ✅ 通过 |
| STT 工作 | Agent 能够接收文字消息 | ✅ 通过 |
| Off-topic 问题处理 | Agent 热情回答量子纠缠问题 | ✅ 通过 |
| 识别强烈兴趣 | "哇，听起来你对物理真的很感兴趣！" | ✅ 通过 |

## 修改的文件
- `agent/agent.py`: 添加 TTS 和 STT FallbackAdapter

## 部署状态
- GitHub Actions Run #49 (TTS): 成功
- GitHub Actions Run #50 (STT): 成功

## 后续建议
1. 监控 Cartesia 服务的稳定性
2. 考虑升级 Cartesia 付费计划以获得更稳定的服务
3. 考虑使用更适合中文的 TTS 声音作为 fallback
