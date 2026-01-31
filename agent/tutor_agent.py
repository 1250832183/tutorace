"""
Tutorace Teaching Agent

Specialized agent for structured teaching sessions with:
- Lesson plan management
- Topic-based teaching
- Progress tracking
- Interruption handling
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    RoomInputOptions,
)
from livekit.plugins import cartesia, openai, silero
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("tutor-agent")
logger.setLevel(logging.INFO)


@dataclass
class Topic:
    """Represents a learning topic in the lesson plan."""
    id: str
    title: str
    content: str
    page_numbers: List[int] = field(default_factory=list)
    subtopics: List[str] = field(default_factory=list)
    completed: bool = False


@dataclass
class LessonPlan:
    """Represents a structured lesson plan."""
    id: str
    title: str
    topics: List[Topic]
    current_topic_index: int = 0
    
    @property
    def current_topic(self) -> Optional[Topic]:
        if 0 <= self.current_topic_index < len(self.topics):
            return self.topics[self.current_topic_index]
        return None
    
    def next_topic(self) -> Optional[Topic]:
        """Move to the next topic and return it."""
        if self.current_topic:
            self.current_topic.completed = True
        self.current_topic_index += 1
        return self.current_topic
    
    def to_context_string(self) -> str:
        """Generate context string for LLM."""
        lines = [f"# Lesson Plan: {self.title}\n"]
        for i, topic in enumerate(self.topics):
            status = "[DONE]" if topic.completed else "[CURRENT]" if i == self.current_topic_index else "[TODO]"
            lines.append(f"{status} {i+1}. {topic.title}")
        lines.append(f"\n## Current Topic: {self.current_topic.title if self.current_topic else 'None'}")
        if self.current_topic:
            lines.append(f"\n### Content:\n{self.current_topic.content[:1000]}...")
        return "\n".join(lines)


class TutorAgent(Agent):
    """
    Teaching agent that manages lesson plans and voice interactions.
    """
    
    def __init__(self, lesson_plan: Optional[LessonPlan] = None):
        self.lesson_plan = lesson_plan
        
        # Build instructions with lesson plan context
        instructions = self._build_instructions()
        
        super().__init__(instructions=instructions)
    
    def _build_instructions(self) -> str:
        """Build the system instructions with lesson plan context."""
        base_instructions = """You are Spark, an enthusiastic AI tutor conducting a voice-based teaching session.

## Your Teaching Style:
- Be warm, encouraging, and patient
- Explain concepts clearly with examples and analogies
- Keep responses concise (2-3 sentences) for natural conversation
- Check understanding frequently with questions
- Celebrate progress and correct mistakes gently

## Interaction Guidelines:
- If the student interrupts, IMMEDIATELY stop and address their question
- After answering a question, smoothly return to the lesson
- Use natural transitions between topics
- Vary your tone and pace to keep engagement high

## Session Flow:
1. Greet the student and introduce the topic
2. Teach each concept with examples
3. Ask comprehension questions
4. Provide feedback and clarification
5. Summarize before moving to next topic
"""
        
        if self.lesson_plan:
            base_instructions += f"\n\n## Current Lesson Plan:\n{self.lesson_plan.to_context_string()}"
        
        return base_instructions


def parse_lesson_plan(data: Dict[str, Any]) -> LessonPlan:
    """Parse lesson plan from metadata."""
    topics = [
        Topic(
            id=t.get("id", str(i)),
            title=t.get("title", f"Topic {i+1}"),
            content=t.get("content", ""),
            page_numbers=t.get("page_numbers", []),
            subtopics=t.get("subtopics", []),
        )
        for i, t in enumerate(data.get("topics", []))
    ]
    return LessonPlan(
        id=data.get("id", "default"),
        title=data.get("title", "Lesson"),
        topics=topics,
    )


async def entrypoint(ctx: JobContext):
    """Main entry point for the tutor agent."""
    
    # Parse room metadata for lesson plan
    lesson_plan = None
    try:
        metadata = json.loads(ctx.room.metadata or "{}")
        if "lesson_plan" in metadata:
            lesson_plan = parse_lesson_plan(metadata["lesson_plan"])
            logger.info(f"Loaded lesson plan: {lesson_plan.title}")
    except json.JSONDecodeError:
        logger.warning("Could not parse room metadata")
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for participant
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")
    
    # Create agent session
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=cartesia.STT(
            model="ink-whisper",
            language="en",
        ),
        llm=openai.LLM(
            model="gpt-4o-mini",
            temperature=0.7,
        ),
        tts=cartesia.TTS(
            model="sonic-3",
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
            language="en",
            speed=1.0,
        ),
        allow_interruptions=True,
    )
    
    # Create tutor agent with lesson plan
    agent = TutorAgent(lesson_plan=lesson_plan)
    
    # Start session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            participant=participant,
        ),
    )
    
    # Send initial greeting based on lesson plan
    if lesson_plan and lesson_plan.current_topic:
        greeting = (
            f"Hey there! I'm Spark, your AI tutor. Today we're going to learn about "
            f"{lesson_plan.title}. We have {len(lesson_plan.topics)} topics to cover. "
            f"Let's start with {lesson_plan.current_topic.title}. Ready to begin?"
        )
    else:
        greeting = (
            "Hey there! I'm Spark, your AI tutor. I'm excited to help you learn today! "
            "What would you like to study? You can tell me a topic or ask me anything."
        )
    
    await session.say(greeting, allow_interruptions=True)
    logger.info("Teaching session started")
    
    # Keep session running
    await session.wait()


def prewarm(proc: JobProcess):
    """Prewarm function to load models."""
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("VAD model prewarmed")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
