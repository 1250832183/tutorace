# Tutorace Deployment Guide

This guide provides step-by-step instructions for deploying Tutorace with **GitHub as the single source of truth**. The architecture separates the AI Agent (deployed on LiveKit Cloud) from the Web Application (deployed on Vercel).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│              https://github.com/ZHouliRic/tutorace           │
│                                                              │
│  ├── /agent          → LiveKit Cloud (Python Agent)         │
│  ├── /api            → Vercel Serverless Functions          │
│  └── /web            → Vercel Static Site (React)           │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
   LiveKit Cloud                      Vercel
   (Voice Agent)                   (Web + API)
```

---

## Prerequisites

Before starting, ensure you have:

| Requirement | Description |
|-------------|-------------|
| GitHub Account | Repository access to `ZHouliRic/tutorace` |
| LiveKit Cloud Account | Sign up at [livekit.io](https://livekit.io) |
| Vercel Account | Sign up at [vercel.com](https://vercel.com) |
| API Keys | OpenAI API Key, Cartesia API Key |

---

## Part 1: Deploy Agent to LiveKit Cloud

### Step 1.1: Install LiveKit CLI

```bash
# macOS (Homebrew)
brew install livekit-cli

# Linux / Windows (npm)
npm install -g livekit-cli

# Verify installation
lk --version
```

### Step 1.2: Authenticate with LiveKit Cloud

```bash
lk cloud auth
```

This opens a browser window for authentication. After logging in, the CLI will be configured.

### Step 1.3: Create a New Project (if needed)

If you haven't already created a LiveKit Cloud project:

```bash
lk cloud project create tutorace
```

### Step 1.4: Configure Environment Variables

In the [LiveKit Cloud Console](https://cloud.livekit.io), navigate to your project settings and add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `CARTESIA_API_KEY` | `sk_car_...` | Your Cartesia API key |

### Step 1.5: Deploy the Agent

```bash
# Navigate to the agent directory
cd agent

# Deploy to LiveKit Cloud
lk cloud deploy

# Or using Docker (alternative method)
lk cloud deploy --dockerfile Dockerfile
```

The deployment will:
1. Build the Docker image
2. Push to LiveKit's container registry
3. Start the agent worker

### Step 1.6: Verify Agent Deployment

```bash
# Check agent status
lk cloud agent status

# View logs
lk cloud agent logs --follow
```

---

## Part 2: Deploy Web Application to Vercel

### Step 2.1: Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select `ZHouliRic/tutorace`
4. Click **"Import"**

### Step 2.2: Configure Build Settings

Vercel should auto-detect the settings from `vercel.json`, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `cd web && npm install && npm run build` |
| Output Directory | `web/dist` |
| Install Command | `npm install` |

### Step 2.3: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `LIVEKIT_URL` | `wss://tutorace-sky7fsol.livekit.cloud` | Production |
| `LIVEKIT_API_KEY` | Your LiveKit API Key | Production |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret | Production |
| `OPENAI_API_KEY` | Your OpenAI API Key | Production |

> **Note**: Get your LiveKit credentials from the [LiveKit Cloud Console](https://cloud.livekit.io) under Project Settings → Keys.

### Step 2.4: Deploy

Click **"Deploy"** in Vercel. The deployment will:
1. Install dependencies
2. Build the React frontend
3. Deploy serverless API functions
4. Provide a production URL

### Step 2.5: Verify Deployment

After deployment, test the endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

## Part 3: Post-Deployment Configuration

### Update Frontend API URL (if needed)

If your Vercel deployment URL differs from the default, update `web/src/lib/api.ts`:

```typescript
// For production, the API_BASE should be empty (same origin)
const API_BASE = '';
```

### Configure Custom Domain (Optional)

1. In Vercel Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Environment Variables Reference

### LiveKit Cloud (Agent)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Auto | Set automatically by LiveKit Cloud |
| `LIVEKIT_API_KEY` | Auto | Set automatically by LiveKit Cloud |
| `LIVEKIT_API_SECRET` | Auto | Set automatically by LiveKit Cloud |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4 |
| `CARTESIA_API_KEY` | Yes | Cartesia API key for TTS/STT |

### Vercel (Web + API)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` | Yes | LiveKit API Key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API Secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for lesson plan generation |

---

## Troubleshooting

### Agent Not Connecting

1. Verify agent is running: `lk cloud agent status`
2. Check logs: `lk cloud agent logs`
3. Ensure environment variables are set correctly

### API Errors (500)

1. Check Vercel function logs in the dashboard
2. Verify all environment variables are set
3. Test locally first: `cd server && npm run dev`

### Voice Not Working

1. Ensure browser has microphone permission
2. Check browser console for WebRTC errors
3. Verify LiveKit URL is correct (wss:// protocol)

---

## Continuous Deployment

Both platforms support automatic deployments from GitHub:

**Vercel**: Automatically deploys on every push to `main` branch.

**LiveKit Cloud**: Set up GitHub Actions for automated agent deployment:

```yaml
# .github/workflows/deploy-agent.yml
name: Deploy Agent
on:
  push:
    branches: [main]
    paths: ['agent/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to LiveKit Cloud
        run: |
          npm install -g livekit-cli
          lk cloud auth --api-key ${{ secrets.LK_API_KEY }} --api-secret ${{ secrets.LK_API_SECRET }}
          cd agent && lk cloud deploy
```

---

## Cost Estimation

| Service | Pricing Model | Estimated Cost |
|---------|---------------|----------------|
| LiveKit Cloud | Per minute of audio | ~$0.01/min |
| Vercel | Free tier available | $0-20/month |
| OpenAI GPT-4 | Per token | ~$0.01/request |
| Cartesia TTS/STT | Per character/second | ~$0.005/request |

---

## Support

- **LiveKit Documentation**: [docs.livekit.io](https://docs.livekit.io)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/ZHouliRic/tutorace/issues)
