import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { ParsedPDF } from './pdf.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Topic {
  id: string;
  title: string;
  content: string;
  pageNumbers: number[];
  subtopics: string[];
  completed: boolean;
}

export interface LessonPlan {
  id: string;
  title: string;
  topics: Topic[];
  currentTopicIndex: number;
  sourceType: 'pdf' | 'topic' | 'free';
  createdAt: Date;
}

// In-memory storage (replace with database in production)
const lessonPlans = new Map<string, LessonPlan>();

export async function generateLessonPlanFromPDF(pdf: ParsedPDF): Promise<LessonPlan> {
  const prompt = `Analyze the following document content and create a structured lesson plan.
Break it down into 5-8 logical topics/chapters that would help a student learn the material progressively.

Document content:
${pdf.text.slice(0, 8000)}

Respond in JSON format:
{
  "title": "Overall lesson title",
  "topics": [
    {
      "title": "Topic title",
      "content": "Brief summary of what this topic covers (2-3 sentences)",
      "subtopics": ["subtopic1", "subtopic2"],
      "pageNumbers": [1, 2]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert educator who creates structured lesson plans.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  const lessonPlan: LessonPlan = {
    id: uuidv4(),
    title: result.title || 'Untitled Lesson',
    topics: (result.topics || []).map((t: any, i: number) => ({
      id: uuidv4(),
      title: t.title || `Topic ${i + 1}`,
      content: t.content || '',
      pageNumbers: t.pageNumbers || [],
      subtopics: t.subtopics || [],
      completed: false,
    })),
    currentTopicIndex: 0,
    sourceType: 'pdf',
    createdAt: new Date(),
  };

  lessonPlans.set(lessonPlan.id, lessonPlan);
  return lessonPlan;
}

export async function generateLessonPlanFromTopic(topic: string): Promise<LessonPlan> {
  const prompt = `Create a comprehensive lesson plan to teach someone about: "${topic}"

Break it down into 5-8 logical topics that would help a student learn progressively from basics to advanced concepts.

Respond in JSON format:
{
  "title": "Overall lesson title",
  "topics": [
    {
      "title": "Topic title",
      "content": "Detailed content to teach (3-5 sentences covering key concepts)",
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert educator who creates comprehensive, engaging lesson plans.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  const lessonPlan: LessonPlan = {
    id: uuidv4(),
    title: result.title || topic,
    topics: (result.topics || []).map((t: any, i: number) => ({
      id: uuidv4(),
      title: t.title || `Topic ${i + 1}`,
      content: t.content || '',
      pageNumbers: [],
      subtopics: t.subtopics || [],
      completed: false,
    })),
    currentTopicIndex: 0,
    sourceType: 'topic',
    createdAt: new Date(),
  };

  lessonPlans.set(lessonPlan.id, lessonPlan);
  return lessonPlan;
}

export function getLessonPlan(id: string): LessonPlan | undefined {
  return lessonPlans.get(id);
}

export function updateLessonPlanProgress(id: string, topicIndex: number): LessonPlan | undefined {
  const plan = lessonPlans.get(id);
  if (plan && topicIndex >= 0 && topicIndex < plan.topics.length) {
    // Mark previous topics as completed
    for (let i = 0; i < topicIndex; i++) {
      plan.topics[i].completed = true;
    }
    plan.currentTopicIndex = topicIndex;
    return plan;
  }
  return undefined;
}
