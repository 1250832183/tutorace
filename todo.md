# Tutorace Project TODO

## Phase 1: Python Agent
- [x] Basic agent structure (agent.py)
- [x] Tutor agent with lesson plan support (tutor_agent.py)
- [x] Cartesia TTS (Sonic 3) integration
- [x] Cartesia STT (Ink-Whisper) integration
- [x] OpenAI LLM integration (GPT-4.1-mini)
- [ ] Add PDF content extraction support
- [ ] Add dynamic lesson plan loading from API
- [ ] Add progress tracking callbacks

## Phase 2: Web Frontend
- [x] Create React app with Vite
- [x] LiveKit React SDK integration
- [x] Voice control UI component
- [x] Lesson plan panel component
- [x] Voice session component with chat transcript
- [x] Text input fallback for testing
- [ ] Slides viewer component
- [ ] Progress tracker component

## Phase 3: Backend API
- [x] Express server setup
- [x] LiveKit room creation and token generation
- [x] Lesson plan generation from topic (LLM)
- [ ] PDF upload and parsing endpoint
- [ ] Database schema (materials, lesson_plans, progress)
- [ ] User authentication

## Phase 4: E2E Testing
- [x] Agent connection test
- [x] Voice output test (TTS streaming)
- [x] Lesson plan generation test
- [ ] Voice input test (requires microphone)
- [ ] PDF upload and parsing test
- [ ] Full flow test (upload → lesson plan → voice session)

## Phase 5: Documentation & Deployment
- [x] DESIGN.md - Complete system design document
- [x] README.md - Project overview
- [ ] Docker configuration
- [ ] Environment variable documentation
- [ ] API documentation

