# Tutorace

**AI Voice Tutoring Platform** - Learn any topic through natural voice conversations with an AI tutor.

[![Deploy Agent](https://github.com/ZHouliRic/tutorace/actions/workflows/deploy-agent.yml/badge.svg)](https://github.com/ZHouliRic/tutorace/actions/workflows/deploy-agent.yml)

---

## Quick Start

### For Users

Visit the deployed application and:
1. Enter a topic you want to learn
2. Click "Generate Lesson" 
3. Start a voice conversation with Spark, your AI tutor

### For Developers

**Read the [Architecture Documentation](./ARCHITECTURE.md) first** - it's the single source of truth for this project.

#### Development Workflow

| Task | Where | How |
|------|-------|-----|
| Edit Web UI | Manus Platform | Save checkpoint → auto-deploy |
| Edit Agent Logic | GitHub | Push to main → GitHub Actions → LiveKit Cloud |

#### First-Time Setup (One-Time)

```bash
# 1. Install LiveKit CLI
curl -sSL https://get.livekit.io/cli | bash

# 2. Authenticate (opens browser)
lk cloud auth

# 3. Deploy Agent
git clone https://github.com/ZHouliRic/tutorace.git
cd tutorace/agent
lk cloud deploy
```

After this, everything runs in the cloud - no local machine needed.

---

## Architecture

```
GitHub (Single Source of Truth)
    │
    ├── /agent  ──► GitHub Actions ──► LiveKit Cloud (Voice AI)
    │
    └── /web    ◄── Manus Export ◄─── Manus Platform (Web App)
```

| Component | Hosting | Technology |
|-----------|---------|------------|
| Web Application | Manus Platform | React, tRPC, Tailwind |
| Voice Agent | LiveKit Cloud | Python, GPT-4, Cartesia |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | **Complete system documentation (start here)** |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Detailed deployment instructions |
| [DESIGN.md](./DESIGN.md) | Product design and specifications |

---

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, LiveKit Components
- **Backend**: Express, tRPC, Drizzle ORM
- **Voice AI**: LiveKit, Cartesia (TTS/STT), GPT-4
- **Hosting**: Manus Platform (Web), LiveKit Cloud (Agent)

---

## License

MIT
