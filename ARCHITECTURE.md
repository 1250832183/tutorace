# Tutorace Architecture Documentation

> **This document is the single source of truth for the Tutorace project architecture.**  
> Any collaborator with access to this document and the codebase should be able to understand, develop, and deploy the entire system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Responsibilities](#component-responsibilities)
4. [Development Workflow](#development-workflow)
5. [Deployment Guide](#deployment-guide)
6. [Environment Variables](#environment-variables)
7. [Code Structure](#code-structure)
8. [Agent Logic Explained](#agent-logic-explained)
9. [Web Application Explained](#web-application-explained)
10. [First-Time Setup](#first-time-setup)
11. [Ongoing Development](#ongoing-development)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

Tutorace is an AI-powered voice tutoring platform that enables users to learn any topic through natural voice conversations. The system consists of two main components that run independently in the cloud:

| Component | Description | Hosting | Technology |
|-----------|-------------|---------|------------|
| **Web Application** | User interface and backend API | Manus Platform | React, Express, tRPC |
| **Voice Agent** | AI brain that handles voice conversations | LiveKit Cloud | Python, GPT-4, Cartesia |

**Key Principle:** After initial setup, the entire system runs in the cloud with zero dependency on any local machine.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Repository                               │
│                    https://github.com/ZHouliRic/tutorace                    │
│                         (Single Source of Truth)                             │
│                                                                              │
│   ┌─────────────────┐                          ┌─────────────────┐          │
│   │    /agent       │                          │  /web + /server │          │
│   │  Python Agent   │                          │  React + tRPC   │          │
│   └────────┬────────┘                          └────────┬────────┘          │
│            │                                            │                    │
│            │ GitHub Actions                             │ Manus Export       │
│            │ (auto deploy on push)                      │ (manual sync)      │
│            ▼                                            ▼                    │
└────────────┼────────────────────────────────────────────┼────────────────────┘
             │                                            │
             ▼                                            ▼
┌────────────────────────┐                  ┌────────────────────────┐
│    LiveKit Cloud       │                  │    Manus Platform      │
│                        │                  │                        │
│  ┌──────────────────┐  │                  │  ┌──────────────────┐  │
│  │   Voice Agent    │  │                  │  │   Web Frontend   │  │
│  │   (Python)       │  │                  │  │   (React)        │  │
│  │                  │  │                  │  └──────────────────┘  │
│  │  • Cartesia STT  │  │                  │                        │
│  │  • GPT-4 LLM     │  │◄────WebRTC──────►│  ┌──────────────────┐  │
│  │  • Cartesia TTS  │  │                  │  │   Backend API    │  │
│  │                  │  │                  │  │   (tRPC)         │  │
│  └──────────────────┘  │                  │  └──────────────────┘  │
│                        │                  │                        │
│  Runs 24/7             │                  │  Auto-deployed         │
│  No local dependency   │                  │  No local dependency   │
└────────────────────────┘                  └────────────────────────┘
             ▲                                            ▲
             │                                            │
             │              ┌──────────────┐              │
             └──────────────│    User      │──────────────┘
                            │   Browser    │
                            └──────────────┘
```

---

## Component Responsibilities

### Web Application (Manus Platform)

The Web Application handles everything the user sees and interacts with:

| Responsibility | Description |
|----------------|-------------|
| **User Interface** | Home page with 3 learning options, voice session page |
| **LiveKit Connection** | Creates rooms, generates tokens, establishes WebRTC |
| **Lesson Plan Generation** | Calls GPT-4 to create structured lesson plans from topics |
| **Audio Visualization** | Real-time visualization of voice activity |
| **Chat History** | Displays transcribed conversation |

**Key Files:**
- `web/src/pages/Home.tsx` - Landing page with learning options
- `web/src/pages/Session.tsx` - Voice session interface
- `server/routers.ts` - tRPC API routes

### Voice Agent (LiveKit Cloud)

The Voice Agent is the "brain" that handles the actual AI conversation:

| Responsibility | Description |
|----------------|-------------|
| **Speech-to-Text** | Converts user's voice to text (Cartesia Ink-Whisper) |
| **AI Reasoning** | Processes user input and generates responses (GPT-4) |
| **Text-to-Speech** | Converts AI responses to natural voice (Cartesia Sonic 3) |
| **Teaching Logic** | Follows lesson plan, asks questions, provides explanations |
| **Interruption Handling** | Allows users to interrupt AI mid-sentence |

**Key Files:**
- `agent/agent.py` - Main agent logic and configuration

---

## Development Workflow

### Where to Make Changes

| What to Change | Where to Edit | How to Deploy |
|----------------|---------------|---------------|
| UI/UX (buttons, pages, styles) | Manus Platform | Save checkpoint → auto-deploy |
| Backend API (new endpoints) | Manus Platform | Save checkpoint → auto-deploy |
| AI personality/teaching style | `agent/agent.py` | Push to GitHub → GitHub Actions |
| Voice settings (speed, tone) | `agent/agent.py` | Push to GitHub → GitHub Actions |
| New AI features | `agent/agent.py` | Push to GitHub → GitHub Actions |

### Development Tools

| Tool | Purpose | Access |
|------|---------|--------|
| **Manus Platform** | Web development, testing, deployment | manus.im |
| **GitHub** | Code versioning, Agent CI/CD | github.com/ZHouliRic/tutorace |
| **LiveKit Cloud Console** | Agent monitoring, logs, env vars | cloud.livekit.io |

---

## Deployment Guide

### Initial Setup (One-Time, Requires Local Machine)

This is the **only step** that requires a local machine. After this, everything runs in the cloud.

#### Step 1: Deploy Agent to LiveKit Cloud

```bash
# Install LiveKit CLI
curl -sSL https://get.livekit.io/cli | bash

# Authenticate (opens browser)
lk cloud auth

# Clone repository and deploy
git clone https://github.com/ZHouliRic/tutorace.git
cd tutorace/agent
lk cloud deploy
```

#### Step 2: Configure LiveKit Cloud Environment Variables

In [LiveKit Cloud Console](https://cloud.livekit.io) → Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CARTESIA_API_KEY` | Your Cartesia API key |

#### Step 3: Configure GitHub Actions (for auto-deployment)

In GitHub Repository → Settings → Secrets and variables → Actions:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `LK_API_KEY` | LiveKit Cloud API Key | LiveKit Console → Settings → API Keys |
| `LK_API_SECRET` | LiveKit Cloud API Secret | LiveKit Console → Settings → API Keys |

#### Step 4: Web is Already Deployed

The Web application is hosted on Manus Platform. Environment variables are already configured:

| Variable | Value |
|----------|-------|
| `LIVEKIT_URL` | `wss://tutorace-sky7fsol.livekit.cloud` |
| `LIVEKIT_API_KEY` | (configured in Manus) |
| `LIVEKIT_API_SECRET` | (configured in Manus) |

---

## Environment Variables

### LiveKit Cloud (Agent)

| Variable | Required | Auto-Set | Description |
|----------|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | ✅ | WebSocket URL for LiveKit |
| `LIVEKIT_API_KEY` | Yes | ✅ | API key for authentication |
| `LIVEKIT_API_SECRET` | Yes | ✅ | API secret for authentication |
| `OPENAI_API_KEY` | Yes | ❌ | OpenAI API key for GPT-4 |
| `CARTESIA_API_KEY` | Yes | ❌ | Cartesia API key for TTS/STT |

### Manus Platform (Web)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | WebSocket URL for LiveKit |
| `LIVEKIT_API_KEY` | Yes | API key for room creation |
| `LIVEKIT_API_SECRET` | Yes | API secret for token generation |

---

## Code Structure

```
tutorace/
├── agent/                      # Voice Agent (LiveKit Cloud)
│   ├── agent.py               # Main agent logic
│   ├── requirements.txt       # Python dependencies
│   ├── livekit.yaml          # LiveKit Cloud deployment config
│   ├── Dockerfile            # Container configuration
│   └── .env.example          # Environment variables template
│
├── web/                        # React Frontend (Manus)
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx      # Landing page (3 learning options)
│       │   └── Session.tsx   # Voice session interface
│       ├── components/       # Reusable UI components
│       ├── lib/
│       │   └── trpc.ts       # tRPC client configuration
│       └── index.css         # Global styles (Tailwind)
│
├── server/                     # Express Backend (Manus)
│   ├── routers.ts            # tRPC API routes
│   ├── db.ts                 # Database helpers
│   └── _core/                # Framework internals (don't edit)
│
├── drizzle/                    # Database Schema
│   └── schema.ts             # Table definitions
│
├── .github/
│   └── workflows/
│       └── deploy-agent.yml  # GitHub Actions for Agent deployment
│
├── ARCHITECTURE.md            # This document (single source of truth)
├── README.md                  # Quick start guide
└── DEPLOYMENT.md              # Detailed deployment instructions
```

---

## Agent Logic Explained

The Agent (`agent/agent.py`) is the AI "brain" that handles voice conversations. Here's what each part does:

### System Prompt (AI Personality)

```python
SYSTEM_PROMPT = """
You are Spark, a friendly and knowledgeable AI tutor...
"""
```

This defines:
- AI's name and personality
- Teaching style and approach
- How to handle questions
- Conversation guidelines

### Voice Pipeline

```python
session = AgentSession(
    vad=silero.VAD.load(),           # Voice Activity Detection
    stt=cartesia.STT(                # Speech-to-Text
        model="ink-whisper",
        language="en",
    ),
    llm=openai.LLM(                  # Language Model
        model="gpt-4.1-mini",
    ),
    tts=cartesia.TTS(                # Text-to-Speech
        model="sonic-3",
        voice="f786b574-...",        # Voice ID
    ),
    allow_interruptions=True,        # User can interrupt
)
```

### Data Flow

```
User speaks → Microphone → WebRTC → LiveKit Cloud
                                        ↓
                              Cartesia STT (voice → text)
                                        ↓
                              GPT-4 (generate response)
                                        ↓
                              Cartesia TTS (text → voice)
                                        ↓
User hears ← Speaker ← WebRTC ← LiveKit Cloud
```

### Customization Points

| What to Change | Where | Example |
|----------------|-------|---------|
| AI personality | `SYSTEM_PROMPT` | Make it more formal/casual |
| Voice | `tts.voice` | Change voice ID |
| Language model | `llm.model` | Use GPT-4, Claude, etc. |
| Language | `stt.language` | Support Chinese, Spanish, etc. |
| Interruption | `allow_interruptions` | Enable/disable |

---

## Web Application Explained

### Home Page (`web/src/pages/Home.tsx`)

Three learning options:
1. **Upload a Document** - Coming soon (PDF parsing)
2. **Learn a Topic** - Enter topic → Generate lesson plan → Start session
3. **Free Conversation** - Start chatting immediately

### Session Page (`web/src/pages/Session.tsx`)

Voice session interface:
- LiveKit room connection
- Real-time audio visualization
- Chat history display
- Text input option
- Session controls (mute, end)

### Backend API (`server/routers.ts`)

tRPC routes:
- `voice.createRoom` - Create LiveKit room and generate token
- `voice.generateLessonPlan` - Generate lesson plan from topic using GPT-4
- `voice.getLessonPlan` - Retrieve lesson plan by ID

---

## First-Time Setup

### For New Collaborators

1. **Get Access**
   - GitHub repository access
   - Manus Platform access (for Web development)
   - LiveKit Cloud access (for Agent monitoring)

2. **Understand the Architecture**
   - Read this document completely
   - Review the code structure

3. **Set Up Development Environment**
   - Web: Use Manus Platform (no local setup needed)
   - Agent: Clone repo locally for testing (optional)

### Credentials Needed

| Service | What You Need | Who Has It |
|---------|---------------|------------|
| GitHub | Repository access | Project owner |
| Manus | Project access | Project owner |
| LiveKit Cloud | Console access | Project owner |
| OpenAI | API key | Project owner |
| Cartesia | API key | Project owner |

---

## Ongoing Development

### Making Changes to Web

1. Open Manus Platform
2. Edit code in the editor
3. Preview changes in real-time
4. Save checkpoint when ready
5. Export to GitHub (Settings → GitHub)

### Making Changes to Agent

1. Edit `agent/agent.py` in GitHub or Manus sandbox
2. Commit and push to `main` branch
3. GitHub Actions automatically deploys to LiveKit Cloud
4. Monitor logs in LiveKit Cloud Console

### Testing

| Component | How to Test |
|-----------|-------------|
| Web UI | Preview in Manus Platform |
| Backend API | Run `pnpm test` in Manus |
| Voice Agent | Test in LiveKit Cloud Console |
| End-to-End | Use the deployed application |

---

## Troubleshooting

### Agent Not Responding

1. Check Agent status in LiveKit Cloud Console
2. View Agent logs: `lk cloud agent logs`
3. Verify environment variables are set
4. Ensure OpenAI and Cartesia API keys are valid

### Voice Not Working

1. Check browser microphone permissions
2. Verify LiveKit URL is correct (wss:// protocol)
3. Check browser console for WebRTC errors
4. Ensure Agent is running in LiveKit Cloud

### API Errors

1. Check Manus Platform logs
2. Verify environment variables in Manus Settings → Secrets
3. Run tests: `pnpm test`

### Deployment Failures

1. **Agent**: Check GitHub Actions logs
2. **Web**: Check Manus checkpoint status

---

## Quick Reference

### URLs

| Service | URL |
|---------|-----|
| GitHub Repository | https://github.com/ZHouliRic/tutorace |
| LiveKit Cloud Console | https://cloud.livekit.io |
| Manus Platform | https://manus.im |

### Commands

```bash
# Clone repository
git clone https://github.com/ZHouliRic/tutorace.git

# Deploy Agent (first time only)
cd agent && lk cloud deploy

# View Agent logs
lk cloud agent logs --follow

# Run Web tests
cd web && pnpm test
```

### Key Contacts

| Role | Responsibility |
|------|----------------|
| Project Owner | Access management, API keys |
| Web Developer | UI/UX, backend API |
| AI Developer | Agent logic, teaching behavior |

---

*Last updated: February 2026*  
*Document version: 1.0*
