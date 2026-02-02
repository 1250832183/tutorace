"""
Tutorace Voice Agent - Main Entry Point
Version: 2.0.0 - TutorMe MVP V5 with slide-based teaching

This agent provides voice-based tutoring sessions using:
- LiveKit for real-time communication
- Cartesia Sonic 3 for TTS (90ms latency)
- Cartesia Ink-Whisper for STT
- GPT-4 for conversation generation

Key Feature: Auto-teach when user navigates to a new slide
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

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("tutorace-agent")
logger.setLevel(logging.INFO)

# Create the agent server
server = AgentServer()


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
    """
    
    def __init__(self, learning_unit: Optional[LearningUnit] = None):
        self.learning_unit = learning_unit
        
        instructions = self._build_instructions()
        super().__init__(instructions=instructions)
    
    def _build_instructions(self) -> str:
        """Build the system instructions with learning unit context."""
        base = """You are Spark, an enthusiastic and knowledgeable AI tutor. Your role is to:

1. TEACH: Explain concepts clearly and engagingly, using analogies and examples
2. ADAPT: Adjust your teaching style based on the student's responses
3. ENCOURAGE: Be supportive and celebrate the student's progress
4. INTERACT: Ask questions to check understanding and keep the student engaged

Guidelines:
- Keep explanations concise but thorough (2-3 sentences at a time)
- Use natural, conversational language
- If interrupted, immediately address the student's question
- After answering a question, smoothly return to the lesson
- Use enthusiasm in your voice (vary your tone and pace)

When teaching a slide:
1. Start by introducing the topic
2. Explain the key concepts from the script
3. Provide additional examples if helpful
4. Check understanding with a quick question
5. Transition smoothly to let the student navigate

Remember: You're having a real-time voice conversation. Be natural, responsive, and engaging!
"""
        
        if self.learning_unit:
            base += f"\n\n## Current Learning Unit: {self.learning_unit.title}\n"
            base += f"Total slides: {len(self.learning_unit.slides)}\n"
            if self.learning_unit.current_slide:
                base += f"Current slide: {self.learning_unit.current_slide.title}\n"
        
        return base
    
    def update_current_slide(self, index: int):
        """Update the current slide index."""
        if self.learning_unit:
            self.learning_unit.current_slide_index = index


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
    """
    
    # Parse room metadata for learning unit
    learning_unit = None
    try:
        metadata = json.loads(ctx.room.metadata or "{}")
        learning_unit = parse_learning_unit(metadata)
        if learning_unit:
            logger.info(f"Loaded learning unit: {learning_unit.title} with {len(learning_unit.slides)} slides")
    except json.JSONDecodeError:
        logger.warning("Could not parse room metadata")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Create the agent session with Cartesia TTS/STT
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

    # Create the tutor agent with learning unit
    agent = TutorAgent(learning_unit=learning_unit)
    
    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            participant_identity=participant.identity,
        ),
    )
    
    # Track if we're currently teaching to avoid overlapping
    is_teaching = False
    initial_greeting_done = False
    
    async def teach_slide(slide: Slide, is_first: bool = False):
        """Teach the content of a slide."""
        nonlocal is_teaching
        
        if is_teaching:
            logger.info("Already teaching, skipping duplicate request")
            return
        
        is_teaching = True
        try:
            if slide.script:
                # Use the pre-generated script as teaching content
                if is_first:
                    intro = f"Let's begin with {slide.title}. "
                else:
                    intro = f"Now let's look at {slide.title}. "
                
                # Teach the slide content
                await session.say(
                    intro + slide.script,
                    allow_interruptions=True,
                )
            else:
                # No script, just introduce the topic
                await session.say(
                    f"This slide is about {slide.title}. Feel free to ask me any questions about it!",
                    allow_interruptions=True,
                )
        finally:
            is_teaching = False
    
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
                    asyncio.create_task(handle_text_message(session, text, slide_title))
            
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
                asyncio.create_task(handle_next_topic(session))
                
        except Exception as e:
            logger.error(f"Error processing data message: {e}")
    
    # Initial greeting - wait for slide_change event to start teaching
    # The frontend will send slide_change with isInitial=true after connection
    initial_greeting_done = True  # Mark as done so we don't skip the first slide_change
    
    logger.info("Agent started and greeting sent")
    
    # Keep the session running
    await session.run()


async def handle_text_message(session: AgentSession, text: str, slide_context: str = ""):
    """Handle incoming text messages as if they were spoken."""
    try:
        logger.info(f"Generating response for: {text}")
        
        # Add slide context to the message if available
        if slide_context:
            context_text = f"[Context: Currently on slide '{slide_context}'] {text}"
        else:
            context_text = text
        
        # Generate response using the LLM
        await session.generate_reply(user_input=context_text)
        
    except Exception as e:
        logger.error(f"Error handling text message: {e}")
        await session.say("I'm sorry, I had trouble processing that. Could you try again?")


async def handle_next_topic(session: AgentSession):
    """Handle request to move to the next topic."""
    try:
        await session.say(
            "Great! Navigate to the next slide and I'll teach you about it.",
            allow_interruptions=True,
        )
    except Exception as e:
        logger.error(f"Error handling next topic: {e}")


if __name__ == "__main__":
    run_app(server)
