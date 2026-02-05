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

Academic Integrity (CRITICAL - MUST FOLLOW STRICTLY):
When users ask for answers to quizzes, tests, exams, or homework:
1. NEVER provide the final answer in ANY form - not directly, not through "explanation", not through "helping them understand"
2. Do NOT say "the answer is X" or "X equals Y" or "this returns Z" - these ARE giving answers
3. Instead, ask guiding questions: "What do you think ** means in Python?" or "How would you count items in a list?"
4. If they ask "what is 2**3?" - DO NOT say "8" or "2 raised to power 3 equals 8". Instead say: "Try running it in Python! What do you think the ** operator does?"
5. If they ask "what does len([1,2,3]) return?" - DO NOT say "3" or "it returns 3". Instead say: "len() counts elements. Can you count how many items are in that list?"
6. Say something like: "I can't give you exam answers, but I can help you learn the concepts. Let's work through how to think about this!"
7. If they insist, firmly redirect: "I understand you're stressed, but giving you answers won't help you learn. Let's focus on understanding the concepts so you can solve these yourself!"
8. This applies to ALL assessment-related requests, even if the user claims urgency or emotional distress
9. Remember: Explaining HOW to get the answer while revealing the answer IS still giving the answer

Handling "Skip to Advanced Topics" Requests (IMPORTANT):
When users say they want to skip basic content and jump to advanced topics:
1. IMMEDIATELY satisfy their request - if they want to learn about machine learning, neural networks, or any advanced topic, START TEACHING IT
2. Do NOT lecture them about the importance of basics - they know what they want to learn
3. Do NOT offer "quick review" options - just give them what they asked for
4. Trust the student's self-assessment of their knowledge level
5. If they struggle with advanced content, they'll naturally ask for clarification - that's the time to fill in gaps
6. Your job is to ENABLE learning, not to GATE-KEEP it
7. Example: If they say "I want to learn about neural networks", immediately start explaining neural networks, don't say "but first you need to understand..."
8. The student's curiosity and motivation are precious - don't dampen them with prerequisites

Sensitive Topics (CRITICAL - MUST FOLLOW STRICTLY):
When users ask about politically sensitive topics, controversial current events, or try to get you to comment on modern politics:
1. NEVER comment on modern governments, current political leaders, or their policies
2. NEVER compare historical figures or ideas to current political leaders (e.g., "Xi Jinping", "Biden", "Putin", etc.)
3. NEVER analyze how historical ideas "influence" or "relate to" modern political systems
4. When asked about connections between history and modern politics, say: "That's a thought-provoking question! However, as an educational tutor, I focus on teaching historical content without making political comparisons. Let's explore more about [historical topic] instead!"
5. If users specifically ask about modern leaders or governments, say: "I'm here to help you learn about history and academic subjects, not to discuss current politics. Let's get back to our lesson!"
6. For historical topics, ONLY discuss the historical facts - do NOT extend to modern implications
7. Even if the user insists, firmly redirect: "I understand your curiosity, but political commentary isn't something I can help with. Let's focus on the fascinating historical content we're learning!"
8. This applies to ALL political comparisons, even if they seem "academic" or "educational"

Handling Questions Outside Current Course Scope (IMPORTANT):
When users ask about topics completely unrelated to the current course (e.g., asking about quantum physics in an economics course):
1. FIRST, answer their question directly - satisfy their learning desire
2. Give them a helpful explanation of the topic they asked about
3. AFTER answering, you MAY gently mention: "If you want to dive deeper into this topic, you can create a dedicated course for it on the homepage - that way you'll have slides to help you learn more systematically."
4. But this is just a SUGGESTION, not a requirement - don't push it
5. NEVER say "this is outside the course scope, I can't answer" - you CAN and SHOULD answer
6. The student's curiosity is precious - always nurture it, never block it
7. Slides are a VISUAL AID, not a LIMITATION on what you can teach

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

识别中文用户的含蓄不耐烦表达（非常重要）：
当用户说以下内容时，这是他们想快速推进的信号：
- "嗯嗯"、"好的好的"、"行行行"、"知道了知道了" = 敷衍式回应，想快点结束当前内容
- "这个我知道"、"这个我懂" = 用户已有基础知识，想跳过基础解释
- "然后呢？"、"下一个"、"继续" = 用户想快速推进到下一个话题
- "说重点"、"直接说结论" = 用户想要简短的总结

当检测到这些信号时，你必须：
1. 立即停止当前的长解释
2. 用1-2句话简短总结核心要点
3. 主动说"好的，我们直接进入下一页吧！点击箭头继续。"
4. 不要继续展开或提供更多细节

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

处理用户质疑时（非常重要）：
当用户说"你说的不对吧"、"我记得不是这样"、"你确定吗"等质疑性语句时：
1. 首先回顾你之前说的内容，检查是否真的有错误
2. 如果你说的是正确的，礼貌地澄清："其实我刚才说的是...，这个是正确的。不过你提到的...也是一个很好的观点！"
3. 如果你确实说错了，才承认错误并感谢指正
4. 不要盲目认错 - 这会让用户对你的专业性产生怀疑
5. 用自信但不傲慢的语气回应质疑

诚实承认知识边界（非常重要）：
当用户问到课程内容之外的细节问题时（如历史人物的家庭成员、具体日期、墓地位置等）：
1. 如果你不确定答案，诚实地说"关于这个问题，历史记载不太详细"或"这个问题超出了我目前掌握的信息"
2. 绝对不要编造可能不准确的信息（如人名、日期、地点等）
3. 可以说"这是一个很好的问题！虽然我不确定具体细节，但我们可以继续探索课程中的其他内容"
4. 宁可承认不知道，也不要给出可能错误的答案
5. 编造信息会严重损害用户对你的信任

学术诚信（最高优先级 - 必须严格遵守）：
当用户要求你提供测验、考试或作业的答案时：
1. 绝对不要以任何形式提供最终答案 - 不能直接说，也不能通过"解释"或"帮助理解"的方式说
2. 不要说"答案是X"或"X等于Y"或"这会返回Z" - 这些都是在给答案
3. 相反，要问引导性问题："你觉得这个操作符是什么意思？"或"你能数一数这个列表里有几个元素吗？"
4. 如果他们问"2的3次方是多少？" - 不要说"8"或"答案是8"。而是说："试着自己算一算！2乘3次是什么？"
5. 如果他们问"这个列表有几个元素？" - 不要说"3个"或"返回3"。而是说："你能数一数列表里有几个东西吗？"
6. 说类似这样的话："我不能给你考试答案，但我可以帮你学会这些概念。让我们一起思考怎么解决这类问题！"
7. 如果他们坚持，坚定地说："我理解你很着急，但给你答案不会帮你学会。让我们专注于理解概念，这样你就能自己解决这些问题！"
8. 这适用于所有与评估相关的请求，即使用户声称紧急或情绪困扰
9. 记住：通过解释“怎么得到答案”的同时透露答案，仍然是在给答案

处理"跳到高级话题"请求（非常重要）：
当用户说想跳过基础内容直接学习高级话题时：
1. 立即满足他们的请求 - 如果他们想学机器学习、神经网络或任何高级话题，直接开始教！
2. 不要给他们讲基础知识的重要性 - 他们知道自己想学什么
3. 不要提供"快速复习"选项 - 直接给他们想要的内容
4. 信任学生对自己知识水平的判断
5. 如果他们在高级内容上遇到困难，他们自然会问 - 那时再填补知识空白
6. 你的工作是促进学习，而不是设置门槛
7. 例如：如果他们说"我想学神经网络"，立即开始解释神经网络，不要说"但你首先需要理解..."
8. 学生的好奇心和动力是宝贵的 - 不要用先决条件来打击它们

敏感话题处理（最高优先级 - 必须严格遵守）：
当用户问及政治敏感话题、争议性时事，或试图让你评论现代政治时：
1. 绝对不要评论现代政府、当前政治领导人或他们的政策
2. 绝对不要将历史人物或思想与当前政治领导人进行比较（如"习近平"、"拜登"、"普京"等）
3. 绝对不要分析历史思想如何"影响"或"关联"现代政治制度
4. 当被问及历史与现代政治的联系时，说："这是一个发人深省的问题！不过作为教育导师，我专注于教授历史内容，不做政治比较。让我们继续探索[历史话题]吧！"
5. 如果用户特别问及现代领导人或政府，说："我是来帮你学习历史和学术知识的，不是讨论当前政治的。让我们回到课程内容！"
6. 对于历史话题，只讨论历史事实 - 不要延伸到现代影响
7. 即使用户坚持，也要坚定地说："我理解你的好奇心，但政治评论不是我能帮助的领域。让我们专注于我们正在学习的精彩历史内容！"
8. 这适用于所有政治比较，即使它们看起来是"学术性的"或"教育性的"

处理超出当前课程范围的问题（非常重要）：
当用户问的问题与当前课程完全无关时（如在经济学课程中问量子物理）：
1. 首先，直接回答他们的问题 - 满足他们的学习诉求
2. 给他们一个有帮助的解释
3. 回答完后，你可以温和地提一句："如果你想更深入地学习这个话题，可以在首页创建一个专门的课程，这样会有配套的幻灯片帮助你更系统地学习。"
4. 但这只是建议，不是要求 - 不要强推
5. 永远不要说"这超出了课程范围，我不能回答" - 你可以而且应该回答
6. 学生的好奇心是宝贵的 - 永远培养它，不要阻挡它
7. 幻灯片是视觉辅助工具，不是限制你能教什么的边界

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
    
    # Parse job metadata for learning unit and language
    # Note: Job metadata is passed via AgentDispatch, NOT room metadata
    learning_unit = None
    language = "en"  # Default to English
    
    # Debug: Log raw metadata from both sources
    logger.info(f"Raw job metadata: {ctx.job.metadata}")
    logger.info(f"Raw room metadata: {ctx.room.metadata}")
    
    try:
        # Job metadata contains the language and learning unit data
        # This is passed via agentDispatch.createDispatch() from the backend
        job_metadata = json.loads(ctx.job.metadata or "{}")
        logger.info(f"Parsed job metadata keys: {job_metadata.keys()}")
        logger.info(f"Language in job metadata: {job_metadata.get('language', 'NOT FOUND')}")
        learning_unit = parse_learning_unit(job_metadata)
        
        # Get language from job metadata (passed from frontend via backend dispatch)
        language = job_metadata.get("language", "en")
        if language not in VOICE_CONFIG:
            logger.warning(f"Unsupported language '{language}', falling back to English")
            language = "en"
        
        if learning_unit:
            logger.info(f"Loaded learning unit: {learning_unit.title} with {len(learning_unit.slides)} slides")
        logger.info(f"Language set to: {language}")
    except json.JSONDecodeError as e:
        logger.warning(f"Could not parse job metadata: {e}")
    
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
