# Tutorace - AI Voice Tutoring Platform

## Core Features

- [x] Home page with three learning options (Upload PDF, Enter Topic, Free Chat)
- [x] Voice session page with LiveKit integration
- [x] Lesson plan generation from topic (OpenAI)
- [x] LiveKit room creation and token generation
- [x] Real-time voice visualization
- [x] Chat history display
- [x] Text input alongside voice

## Backend API

- [x] tRPC voice.createRoom - Create LiveKit room and get token
- [x] tRPC voice.generateLessonPlan - Generate lesson plan from topic

## Components

- [x] VoiceSession - Main voice interaction component (Session.tsx)
- [x] VoiceVisualizer - Using LiveKit BarVisualizer
- [x] LessonPlanPanel - Integrated in Session.tsx
- [x] VoiceControlBar - Integrated in Session.tsx

## Configuration

- [x] LiveKit environment variables (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
- [ ] OpenAI API key for lesson plan generation

## Testing

- [x] Unit tests for tRPC routes
- [ ] E2E voice connection test
