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
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'text' | 'topic';
  contentUrl?: string;
  pageCount?: number;
  createdAt: Date;
}

export interface VoiceSessionState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  agentTranscript: string;
}

export interface ConnectionConfig {
  token: string;
  wsUrl: string;
  roomName: string;
}
