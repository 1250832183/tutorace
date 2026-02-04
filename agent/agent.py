"""
Tutorace Voice Agent - Main Entry Point
Version: 2.2.0 - Added Chinese language support

This agent provides voice-based tutoring sessions using:
- LiveKit for real-time communication
- Cartesia Sonic 3 for TTS (90ms latency)
- Cartesia Ink-Whisper for STT
- GPT-4 for conversation generation

Key Features:
- Auto-teach when user navigates to a new slide
- Bilingual support (English and Chinese)
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    RoomInputOptions,
)
from livekit.agents.cli import run_app
from livekit.agents import AgentServer
from livekit.plugins import cartesia, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("tutorace-agent")
logger.setLevel(logging.INFO)

# Create the agent server
server = AgentServer()

# Voice configurations for different languages
VOICE_CONFIG = {
    "en": {
        "voice_id": "f786b574-daa5-4673-aa0c-cbe3e8534c02",  # English voice
        "language": "en",
        "name": "Spark",
    },
    "zh": {
        "voice_id": "3c7a48c4-a1a7-4a46-b59a-a5d6e2aa54f1",  # Chinese Lecturer Man - knowledgeable, articulate
        "language": "zh",
        "name": "小火花",
    },
}

# System prompts for different languages
SYSTEM_PROMPTS = {
    "en": """You are Spark, an enthusiastic and knowledgeable AI tutor. Your role is to:

1. TEACH: Explain concepts clearly and engagingly, using analogies and examples
2. ADAPT: Adjust your teaching style based on the student's responses
3. ENCOURAGE: Be supportive and celebrate the student's progress

Guidelines:
- Keep explanations concise but thorough
- Use natural, conversational language
- If interrupted with a question, immediately address it
- After answering a question, ALWAYS end with "Feel free to ask more questions, or click the arrow to continue to the next slide!"
- Use enthusiasm in your voice (vary your tone and pace)

When answering questions:
- Start with a brief, 2-3 sentence answer that directly addresses the question
- If the student asks for more details or seems interested, then expand
- Match the depth of your answer to the depth of the question
- A simple "what is X?" question deserves a simple answer, not a comprehensive lecture
- If the student says "too long" or seems impatient, immediately give a shorter summary

When user expresses confusion ("I don't understand", "too complicated", etc.):
- Use SIMPLER language and everyday analogies, NOT more technical details
- Give a SHORT, concrete example from daily life (like cooking, sports, or games)
- Avoid formulas, numbers, or technical jargon in your simplified explanation
- If they're still confused after 2 attempts, suggest moving to the next slide and coming back later

When teaching a slide:
1. Start by introducing the topic
2. Explain ALL the key concepts from the script thoroughly
3. Provide additional examples if helpful
4. End with: "When you're ready, click the arrow to continue to the next slide!"
5. DO NOT ask questions and wait for answers - just teach and let the user navigate

IMPORTANT RULES:
- DO NOT end with open-ended questions like "Does that make sense?" or "What do you think?"
- DO NOT ask follow-up questions like "I'd love to hear about it!" or "What about you?"
- NEVER invite the user to share their thoughts or preferences - just answer and guide to next slide
- DO NOT wait for user response after teaching - just finish and let them navigate
- When user asks a question, answer it completely, then remind them they can continue or ask more
- Keep the flow moving - the user controls navigation with the arrow buttons
- For off-topic questions (jokes, personal questions, etc.), give a brief friendly response and redirect to the lesson

Remember: You're having a real-time voice conversation. Be natural, responsive, and keep the momentum going!
""",
    "zh": """你是小火花，一位热情且知识渊博的AI导师。你的角色是：

1. 教学：用类比和例子清晰、生动地解释概念
2. 适应：根据学生的反应调整教学风格
3. 鼓励：给予支持并庆祝学生的进步

指导原则：
- 保持解释简洁但全面
- 使用自然、对话式的语言
- 如果被问题打断，立即回答
- 回答问题后，总是以"有任何问题随时问我，或者点击箭头继续下一页！"结束
- 在声音中表现出热情（变化语调和节奏）

回答问题时：
- 先用2-3句话直接回答问题
- 如果学生想了解更多细节，再展开
- 根据问题的深度匹配答案的深度
- 简单的"什么是X？"问题只需要简单的答案，不需要全面的讲座
- 如果学生说"太长了"或显得不耐烦，立即给出更短的总结

当用户表示困惑时（"我不明白"、"太复杂了"等）：
- 使用更简单的语言和日常生活中的类比，而不是更多技术细节
- 给出一个简短、具体的日常生活例子（如做饭、运动或游戏）
- 在简化解释中避免公式、数字或技术术语
- 如果尝试2次后他们仍然困惑，建议先继续下一页，稍后再回来

教授幻灯片时：
1. 首先介绍主题
2. 彻底解释脚本中的所有关键概念
3. 如果有帮助，提供额外的例子
4. 以"准备好了就点击箭头继续下一页！"结束
5. 不要问问题等待回答 - 只需教学并让用户导航

重要规则：
- 不要以开放式问题结束，如"明白了吗？"或"你觉得呢？"
- 不要问后续问题，如"我很想听听！"或"你呢？"
- 永远不要邀请用户分享他们的想法或偏好 - 只需回答并引导到下一页
- 教学后不要等待用户回应 - 完成后让他们导航
- 当用户提问时，完整回答，然后提醒他们可以继续或提更多问题
- 保持流程进行 - 用户用箭头按钮控制导航
- 对于跑题的问题（笑话、个人问题等），给出简短友好的回应并重新引导到课程

记住：你正在进行实时语音对话。保持自然、响应迅速，保持势头！
""",
}


@dataclass
class Slide:
    """Represents a slide in the learning unit (1 slide = 1 topic)."""
    index: int
    title: str
    script: str  # The teaching script for this slide


@dataclass
class LearningUnit:
    """Represents a learning unit with 10 fixed slides."""
    id: int
    title: str
    slides: List[Slide]
    current_slide_index: int = 0
    
    @property
    def current_slide(self) -> Optional[Slide]:
        if 0 <= self.current_slide_index < len(self.slides):
            return self.slides[self.current_slide_index]
        return None
    
    def get_slide(self, index: int) -> Optional[Slide]:
        if 0 <= index < len(self.slides):
            return self.slides[index]
        return None


class TutorAgent(Agent):
    """
    Voice tutoring agent that teaches users through natural conversation.
    Follows the slide-based teaching model (1 slide = 1 topic).
    Supports multiple languages (English and Chinese).
    """
    
    def __init__(self, learning_unit: Optional[LearningUnit] = None, language: str = "en"):
        self.learning_unit = learning_unit
        self.language = language
        
        instructions = self._build_instructions()
        super().__init__(instructions=instructions)
    
    def _build_instructions(self) -> str:
        """Build the system instructions with learning unit context."""
        base = SYSTEM_PROMPTS.get(self.language, SYSTEM_PROMPTS["en"])
        
        if self.learning_unit:
            if self.language == "zh":
                base += f"\n\n## 当前学习单元: {self.learning_unit.title}\n"
                base += f"总页数: {len(self.learning_unit.slides)}\n"
                if self.learning_unit.current_slide:
                    base += f"当前页面: {self.learning_unit.current_slide.title}\n"
            else:
                base += f"\n\n## Current Learning Unit: {self.learning_unit.title}\n"
                base += f"Total slides: {len(self.learning_unit.slides)}\n"
                if self.learning_unit.current_slide:
                    base += f"Current slide: {self.learning_unit.current_slide.title}\n"
        
        return base
    
    def update_current_slide(self, index: int):
        """Update the current slide index."""
        if self.learning_unit:
            self.learning_unit.current_slide_index = index
    
    async def on_enter(self):
        """Called when the agent enters the session."""
        # Do NOT generate a greeting here - wait for slide_change event to start teaching
        # This avoids unnatural greetings like "Got it!" before the actual lesson
        logger.info("Agent entered session, waiting for slide_change event to start teaching")


def parse_learning_unit(data: Dict[str, Any]) -> Optional[LearningUnit]:
    """Parse learning unit from room metadata."""
    if not data or "learning_unit" not in data:
        return None
    
    unit_data = data["learning_unit"]
    slides = [
        Slide(
            index=s.get("index", i),
            title=s.get("title", f"Slide {i+1}"),
            script=s.get("script", ""),
        )
        for i, s in enumerate(unit_data.get("slides", []))
    ]
    
    return LearningUnit(
        id=unit_data.get("id", 0),
        title=unit_data.get("title", "Lesson"),
        slides=slides,
    )


@server.rtc_session(agent_name="tutorace-tutor")
async def entrypoint(ctx: JobContext):
    """
    Main entry point for the voice tutoring agent.
    Uses rtc_session decorator with agent_name for explicit dispatch.
    Supports bilingual (English and Chinese) voice interactions.
    """
    
    # Parse room metadata for learning unit and language
    learning_unit = None
    language = "en"  # Default to English
    
    try:
        metadata = json.loads(ctx.room.metadata or "{}")
        learning_unit = parse_learning_unit(metadata)
        
        # Get language from metadata (passed from frontend)
        language = metadata.get("language", "en")
        if language not in VOICE_CONFIG:
            logger.warning(f"Unsupported language '{language}', falling back to English")
            language = "en"
        
        if learning_unit:
            logger.info(f"Loaded learning unit: {learning_unit.title} with {len(learning_unit.slides)} slides")
        logger.info(f"Language set to: {language}")
    except json.JSONDecodeError:
        logger.warning("Could not parse room metadata")
    
    # Get voice configuration for the selected language
    voice_config = VOICE_CONFIG[language]
    
    # Connect to the room first
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Create the agent session with Cartesia TTS/STT configured for the selected language
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=cartesia.STT(
            model="ink-whisper",
            language=voice_config["language"],
        ),
        llm=openai.LLM(
            model="gpt-4o-mini",
            temperature=0.7,
        ),
        tts=cartesia.TTS(
            model="sonic-3",
            voice=voice_config["voice_id"],
            language=voice_config["language"],
            speed=1.0,
        ),
        allow_interruptions=True,
        turn_detection=MultilingualModel(),
    )

    # Create the tutor agent with learning unit and language
    agent = TutorAgent(learning_unit=learning_unit, language=language)
    
    # Track if we're currently teaching to avoid overlapping
    is_teaching = False
    # Track current slide index to detect slide changes during teaching
    current_teaching_slide_index = -1
    
    # Get localized messages
    if language == "zh":
        welcome_template = "你好！欢迎来到你的课程。我是{name}，你的AI导师，很高兴今天能和你一起学习！让我们来探索{title}。"
        intro_template = "现在让我们来看{title}。"
        nav_guidance = "准备好了就点击箭头继续下一页！"
        no_script_template = "这一页是关于{title}的。有任何问题随时问我，或者点击箭头继续下一页！"
        next_topic_msg = "好的！导航到下一页，我会为你讲解。"
        resume_msg = "我准备好继续了。你想学习什么？"
    else:
        welcome_template = "Hey there! Welcome to your lesson. I'm {name}, your AI tutor, and I'm excited to learn with you today! Let's explore {title}."
        intro_template = "Now let's look at {title}."
        nav_guidance = "When you're ready, click the arrow to continue to the next slide!"
        no_script_template = "This slide is about {title}. Feel free to ask me any questions, or click the arrow to continue to the next slide!"
        next_topic_msg = "Great! Navigate to the next slide and I'll teach you about it."
        resume_msg = "I'm ready to continue. What would you like to learn about?"
    
    async def teach_slide(slide: Slide, is_first: bool = False):
        """Teach the content of a slide."""
        nonlocal is_teaching, current_teaching_slide_index
        
        # If we're teaching a different slide, interrupt and teach the new one
        if is_teaching and slide.index != current_teaching_slide_index:
            logger.info(f"Interrupting teaching of slide {current_teaching_slide_index} to teach slide {slide.index}")
            session.interrupt()
            # Small delay to allow interruption to complete
            await asyncio.sleep(0.3)
        elif is_teaching and slide.index == current_teaching_slide_index:
            logger.info(f"Already teaching slide {slide.index}, skipping duplicate request")
            return
        
        is_teaching = True
        current_teaching_slide_index = slide.index
        try:
            if slide.script:
                # Use the pre-generated script as teaching content
                if is_first:
                    # Natural welcome + introduction for the first slide
                    intro = welcome_template.format(name=voice_config["name"], title=slide.title) + " "
                else:
                    intro = intro_template.format(title=slide.title) + " "
                
                # Teach the slide content with navigation guidance at the end
                teaching_content = intro + slide.script
                # Add navigation guidance at the end
                teaching_content += " " + nav_guidance
                await session.say(
                    teaching_content,
                    allow_interruptions=True,
                )
            else:
                # No script, just introduce the topic with navigation guidance
                await session.say(
                    no_script_template.format(title=slide.title),
                    allow_interruptions=True,
                )
        finally:
            is_teaching = False
            current_teaching_slide_index = -1
    
    async def handle_text_message(text: str, slide_context: str = ""):
        """Handle incoming text messages as if they were spoken."""
        try:
            logger.info(f"Generating response for: {text}")
            
            # Add slide context to the message if available
            if slide_context:
                context_text = f"[Context: Currently on slide '{slide_context}'] {text}"
            else:
                context_text = text
            
            # Generate response using the LLM
            session.generate_reply(user_input=context_text)
            
        except Exception as e:
            logger.error(f"Error handling text message: {e}")
    
    async def handle_next_topic():
        """Handle request to move to the next topic."""
        try:
            await session.say(
                next_topic_msg,
                allow_interruptions=True,
            )
        except Exception as e:
            logger.error(f"Error handling next topic: {e}")
    
    # Set up data channel listener for messages from frontend
    @ctx.room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket):
        try:
            message = json.loads(data_packet.data.decode('utf-8'))
            logger.info(f"Received data message: {message}")
            
            msg_type = message.get('type')
            
            if msg_type == 'text_message':
                # Handle text question from user
                text = message.get('text', '')
                slide_title = message.get('slideTitle', '')
                if text:
                    logger.info(f"Processing text message: {text} (slide: {slide_title})")
                    asyncio.create_task(handle_text_message(text, slide_title))
            
            elif msg_type == 'slide_change':
                # Handle slide navigation - AUTO TEACH THE NEW SLIDE
                slide_index = message.get('slideIndex', 0)
                slide_title = message.get('slideTitle', '')
                slide_script = message.get('slideScript', '')
                is_initial = message.get('isInitial', False)
                
                logger.info(f"Slide changed to {slide_index}: {slide_title} (initial: {is_initial})")
                
                # Update agent's current slide
                if agent.learning_unit:
                    agent.update_current_slide(slide_index)
                
                # Create a slide object with the received data
                slide = Slide(
                    index=slide_index,
                    title=slide_title,
                    script=slide_script,
                )
                
                # Auto-teach the new slide
                asyncio.create_task(teach_slide(slide, is_first=is_initial))
            
            elif msg_type == 'next_topic':
                logger.info("Next topic requested")
                asyncio.create_task(handle_next_topic())
            
            elif msg_type == 'pause':
                logger.info("Pause requested")
                # Pause is handled by interrupting current speech
                session.interrupt()
            
            elif msg_type == 'resume':
                logger.info("Resume requested")
                # Get current slide info from the message and continue teaching
                slide_index = message.get('slideIndex', 0)
                slide_title = message.get('slideTitle', '')
                slide_script = message.get('slideScript', '')
                
                if slide_title or slide_script:
                    # Create a slide object and continue teaching
                    slide = Slide(
                        index=slide_index,
                        title=slide_title,
                        script=slide_script,
                    )
                    logger.info(f"Resuming teaching slide {slide_index}: {slide_title}")
                    asyncio.create_task(teach_slide(slide, is_first=False))
                else:
                    # No slide info, just acknowledge
                    asyncio.create_task(session.say(
                        resume_msg,
                        allow_interruptions=True,
                    ))
                
        except Exception as e:
            logger.error(f"Error processing data message: {e}")
    
    # Start the session with the agent and room
    # This is the correct way - don't call session.run() afterwards
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            participant_identity=participant.identity,
        ),
    )
    
    logger.info(f"Agent started and session is running (language: {language})")
    
    # Keep the session alive by waiting for shutdown
    # The session will handle all voice interactions automatically
    try:
        # Wait indefinitely - the session handles everything
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        logger.info("Agent session cancelled")
    finally:
        await session.aclose()


if __name__ == "__main__":
    run_app(server)
