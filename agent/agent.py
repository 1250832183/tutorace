"""
Tutorace Voice Agent - Main Entry Point

This agent provides voice-based tutoring sessions using:
- LiveKit for real-time communication
- Cartesia Sonic 3 for TTS (90ms latency)
- Cartesia Ink-Whisper for STT
- GPT-4 for conversation generation
"""

import asyncio
import logging
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    RoomInputOptions,
)
from livekit.plugins import cartesia, openai, silero

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("tutorace-agent")
logger.setLevel(logging.INFO)


class TutorAgent(Agent):
    """
    Voice tutoring agent that teaches users through natural conversation.
    """
    
    def __init__(self):
        super().__init__(
            instructions="""You are Spark, an enthusiastic and knowledgeable AI tutor. Your role is to:

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

When teaching a topic:
1. Start with a brief overview
2. Break down into key concepts
3. Provide examples for each concept
4. Check understanding with questions
5. Summarize key takeaways

Remember: You're having a real-time voice conversation. Be natural, responsive, and engaging!
""",
        )


async def entrypoint(ctx: JobContext):
    """
    Main entry point for the voice tutoring agent.
    """
    
    # Get room metadata (contains lesson plan info)
    room_metadata = ctx.room.metadata or "{}"
    logger.info(f"Room metadata: {room_metadata}")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Create the agent session with Cartesia TTS/STT
    session = AgentSession(
        vad=silero.VAD.load(),  # Voice Activity Detection
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
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",  # Default voice
            language="en",
            speed=1.0,
        ),
        allow_interruptions=True,
    )

    # Create and start the tutor agent
    agent = TutorAgent()
    
    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            participant=participant,
        ),
    )
    
    # Initial greeting
    await session.say(
        "Hey there! I'm Spark, your AI tutor. I'm excited to help you learn today! "
        "What would you like to study? You can tell me a topic, or if you've uploaded "
        "some materials, I can help explain those.",
        allow_interruptions=True,
    )
    
    logger.info("Agent started and greeting sent")
    
    # Keep the session running
    await session.wait()


def prewarm(proc: JobProcess):
    """
    Prewarm function called before the agent starts.
    Used to load models and initialize resources.
    """
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("VAD model prewarmed")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
