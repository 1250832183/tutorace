import type { LessonPlan, Material, ConnectionConfig } from './types';

const API_BASE = '/api';

export async function uploadMaterial(file: File): Promise<Material> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/materials/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload material');
  }
  
  return response.json();
}

export async function generateLessonPlan(materialId: string): Promise<LessonPlan> {
  const response = await fetch(`${API_BASE}/lesson-plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate lesson plan');
  }
  
  return response.json();
}

export async function generateLessonPlanFromTopic(topic: string): Promise<LessonPlan> {
  const response = await fetch(`${API_BASE}/lesson-plans/generate-from-topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate lesson plan');
  }
  
  return response.json();
}

export async function createVoiceRoom(lessonPlanId?: string): Promise<ConnectionConfig> {
  const response = await fetch(`${API_BASE}/voice/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonPlanId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create voice room');
  }
  
  return response.json();
}

export async function getLessonPlan(id: string): Promise<LessonPlan> {
  const response = await fetch(`${API_BASE}/lesson-plans/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to get lesson plan');
  }
  
  return response.json();
}
