# Tutorace - AI Voice Teaching Assistant

An AI-powered voice teaching assistant that provides interactive, voice-based tutoring sessions. Built with LiveKit for real-time communication and Cartesia Sonic for natural text-to-speech.

## Features

- **PDF Content Parsing**: Upload study materials and automatically extract learning topics
- **Lesson Plan Generation**: AI-generated structured lesson plans from your content
- **Voice Interaction**: Natural voice conversations with AI tutor
- **Interruption Handling**: Seamlessly interrupt the AI to ask questions
- **Progress Tracking**: Track your learning progress across topics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Mic       │  │   Speaker   │  │      React UI           │ │
│  └──────┬──────┘  └──────▲──────┘  │  - Lesson Plan Panel    │ │
│         │                │         │  - Voice Controls        │ │
│         │                │         │  - Progress Tracker      │ │
│         ▼                │         └────────────┬────────────┘ │
│  ┌──────────────────────────────────────────────┴──────────────┐│
│  │              LiveKit Client SDK (WebRTC)                    ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LiveKit Cloud Server                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Python Agent Server                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AgentSession                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ Cartesia    │  │    LLM      │  │    Cartesia         │ ││
│  │  │ Ink (STT)   │──│  (GPT-4)    │──│    Sonic 3 (TTS)    │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
tutorace/
├── agent/                    # Python LiveKit Agent
│   ├── agent.py             # Main agent logic
│   ├── tutor_agent.py       # Teaching-specific agent
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── web/                      # React Frontend + Express Backend
│   ├── client/              # React frontend
│   ├── server/              # Express backend
│   └── package.json
└── README.md
```

## Tech Stack

- **Real-time Communication**: LiveKit (WebRTC)
- **Text-to-Speech**: Cartesia Sonic 3 (90ms latency)
- **Speech-to-Text**: Cartesia Ink-Whisper
- **LLM**: GPT-4 / Claude
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + tRPC

## Environment Variables

### Agent (.env)
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
CARTESIA_API_KEY=your_cartesia_key
OPENAI_API_KEY=your_openai_key
```

## Quick Start

### 1. Setup Agent (Python)

```bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python agent.py dev
```

### 2. Setup Web (Node.js)

```bash
cd web
pnpm install
cp .env.example .env
# Edit .env with your API keys
pnpm dev
```

### 3. Test Voice Interaction

1. Open http://localhost:3000 in your browser
2. Upload a PDF or enter a topic
3. Click "Start Session" to begin voice tutoring
4. Speak to interact with the AI tutor

## Development

### Running Tests

```bash
# Agent tests
cd agent && pytest

# Web tests
cd web && pnpm test
```

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## License

MIT
