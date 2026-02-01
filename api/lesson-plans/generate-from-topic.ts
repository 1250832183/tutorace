import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic } = req.body || {};

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic required' });
    }

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

    const lessonPlan = {
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
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json(lessonPlan);
  } catch (error) {
    console.error('Lesson plan generation error:', error);
    return res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
}
