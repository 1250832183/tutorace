import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { parsePDF } from './services/pdf.js';
import {
  generateLessonPlanFromPDF,
  generateLessonPlanFromTopic,
  getLessonPlan,
  updateLessonPlanProgress,
} from './services/lessonPlan.js';
import { createRoom, generateToken, getWebSocketUrl, initLiveKit } from './services/livekit.js';

// Initialize LiveKit after env vars are loaded
initLiveKit();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// In-memory material storage (replace with database in production)
interface Material {
  id: string;
  title: string;
  type: 'pdf';
  pageCount: number;
  text: string;
  pages: string[];
  createdAt: Date;
}
const materials = new Map<string, Material>();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload material (PDF)
app.post('/api/materials/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parsed = await parsePDF(req.file.buffer);
    
    const material: Material = {
      id: uuidv4(),
      title: req.file.originalname.replace('.pdf', ''),
      type: 'pdf',
      pageCount: parsed.pageCount,
      text: parsed.text,
      pages: parsed.pages,
      createdAt: new Date(),
    };

    materials.set(material.id, material);

    res.json({
      id: material.id,
      title: material.title,
      type: material.type,
      pageCount: material.pageCount,
      createdAt: material.createdAt,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Generate lesson plan from uploaded material
app.post('/api/lesson-plans/generate', async (req, res) => {
  try {
    const { materialId } = req.body;
    
    if (!materialId) {
      return res.status(400).json({ error: 'Material ID required' });
    }

    const material = materials.get(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const lessonPlan = await generateLessonPlanFromPDF({
      text: material.text,
      pageCount: material.pageCount,
      pages: material.pages,
    });

    res.json(lessonPlan);
  } catch (error) {
    console.error('Lesson plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
});

// Generate lesson plan from topic
app.post('/api/lesson-plans/generate-from-topic', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic required' });
    }

    const lessonPlan = await generateLessonPlanFromTopic(topic);
    res.json(lessonPlan);
  } catch (error) {
    console.error('Lesson plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
});

// Get lesson plan by ID
app.get('/api/lesson-plans/:id', (req, res) => {
  const lessonPlan = getLessonPlan(req.params.id);
  
  if (!lessonPlan) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }

  res.json(lessonPlan);
});

// Update lesson plan progress
app.patch('/api/lesson-plans/:id/progress', (req, res) => {
  const { topicIndex } = req.body;
  
  if (typeof topicIndex !== 'number') {
    return res.status(400).json({ error: 'Topic index required' });
  }

  const lessonPlan = updateLessonPlanProgress(req.params.id, topicIndex);
  
  if (!lessonPlan) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }

  res.json(lessonPlan);
});

// Create voice room and get connection token
app.post('/api/voice/create-room', async (req, res) => {
  try {
    const { lessonPlanId } = req.body;
    
    const roomName = `tutor-${uuidv4().slice(0, 8)}`;
    const participantName = `user-${uuidv4().slice(0, 8)}`;
    
    // Prepare room metadata with lesson plan if provided
    let metadata: string | undefined;
    if (lessonPlanId) {
      const lessonPlan = getLessonPlan(lessonPlanId);
      if (lessonPlan) {
        metadata = JSON.stringify({
          lesson_plan: {
            id: lessonPlan.id,
            title: lessonPlan.title,
            topics: lessonPlan.topics.map(t => ({
              id: t.id,
              title: t.title,
              content: t.content,
              page_numbers: t.pageNumbers,
              subtopics: t.subtopics,
            })),
          },
        });
      }
    }

    // Create the room
    await createRoom(roomName, metadata);

    // Generate participant token (now async)
    const token = await generateToken({
      roomName,
      participantName,
      metadata,
    });

    res.json({
      token,
      wsUrl: getWebSocketUrl(),
      roomName,
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Failed to create voice room' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Tutorace server running on http://localhost:${PORT}`);
  console.log(`LiveKit URL: ${getWebSocketUrl()}`);
});
