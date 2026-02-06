/**
 * PostHog Analytics Utility
 * 
 * 提供类型安全的埋点方法
 */

import { usePostHog } from 'posthog-js/react';

// 事件类型定义
export type AnalyticsEvent =
  | { name: 'lesson_entry_clicked'; properties: LessonEntryClickedProps }
  | { name: 'lesson_generation_started'; properties: LessonGenerationStartedProps }
  | { name: 'lesson_generation_completed'; properties: LessonGenerationCompletedProps }
  | { name: 'lesson_generation_failed'; properties: LessonGenerationFailedProps }
  | { name: 'lesson_session_started'; properties: LessonSessionStartedProps }
  | { name: 'voice_message_sent'; properties: VoiceMessageSentProps }
  | { name: 'text_message_input'; properties: TextMessageInputProps }
  | { name: 'text_message_sent'; properties: TextMessageSentProps }
  | { name: 'lesson_slide_changed'; properties: LessonSlideChangedProps }
  | { name: 'session_exit_clicked'; properties: SessionExitClickedProps }
  | { name: 'conversation_message_received'; properties: ConversationMessageReceivedProps }
  | { name: 'lesson_session_ended'; properties: LessonSessionEndedProps };

// 事件属性接口
export interface LessonEntryClickedProps {
  entry_type: 'document' | 'topic' | 'free_chat';
  topic_input?: string;
}

export interface LessonGenerationStartedProps {
  generation_type: 'document' | 'youtube' | 'topic' | 'free_chat';
  source_name?: string;
  topic?: string;
  youtube_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface LessonGenerationCompletedProps {
  generation_type: 'document' | 'youtube' | 'topic' | 'free_chat';
  source_name?: string;
  lesson_plan_id: string;
  lesson_title: string;
  topics_count: number;
  generation_duration_ms: number;
}

export interface LessonGenerationFailedProps {
  generation_type: 'document' | 'youtube' | 'topic' | 'free_chat';
  source_name?: string;
  error_message: string;
  error_code?: string;
  generation_duration_ms: number;
}

export interface LessonSessionStartedProps {
  lesson_plan_id?: string;
  lesson_title?: string;
  session_type: 'lesson' | 'free_chat';
  room_id: string;
}

export interface VoiceMessageSentProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  message_duration_ms: number;
  is_muted: boolean;
}

export interface TextMessageInputProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  message_length: number;
}

export interface TextMessageSentProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  message_length: number;
  send_method: 'button' | 'enter_key';
}

export interface LessonSlideChangedProps {
  lesson_plan_id: string;
  from_topic_index: number;
  to_topic_index: number;
  topic_title: string;
  change_type: 'manual' | 'auto';
  direction: 'next' | 'previous';
}

export interface SessionExitClickedProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  session_duration_ms: number;
  messages_sent: number;
}

export interface ConversationMessageReceivedProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  message_length: number;
  response_time_ms: number;
}

export interface LessonSessionEndedProps {
  lesson_plan_id?: string;
  session_type: 'lesson' | 'free_chat';
  session_duration_ms: number;
  user_messages_count: number;
  agent_messages_count: number;
  voice_messages_count: number;
  text_messages_count: number;
  topics_completed?: number;
  avg_response_time_ms: number;
  exit_reason: 'user_action' | 'disconnected' | 'error';
}

/**
 * 类型安全的埋点函数
 */
export function trackEvent(event: AnalyticsEvent) {
  try {
    // 在浏览器环境中使用 PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(event.name, event.properties);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * React Hook 用于埋点
 */
export function useAnalytics() {
  const posthog = usePostHog();

  const track = (event: AnalyticsEvent) => {
    try {
      posthog?.capture(event.name, event.properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return { track };
}

/**
 * 会话统计工具类
 */
export class SessionTracker {
  private startTime: number;
  private userMessagesCount = 0;
  private agentMessagesCount = 0;
  private voiceMessagesCount = 0;
  private textMessagesCount = 0;
  private responseTimes: number[] = [];
  private topicsCompleted = 0;
  private lastMessageTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  trackUserMessage(type: 'voice' | 'text') {
    this.userMessagesCount++;
    if (type === 'voice') {
      this.voiceMessagesCount++;
    } else {
      this.textMessagesCount++;
    }
    this.lastMessageTime = Date.now();
  }

  trackAgentMessage(responseTimeMs?: number) {
    this.agentMessagesCount++;
    if (responseTimeMs !== undefined) {
      this.responseTimes.push(responseTimeMs);
    } else if (this.lastMessageTime) {
      const responseTime = Date.now() - this.lastMessageTime;
      this.responseTimes.push(responseTime);
    }
  }

  trackTopicCompleted() {
    this.topicsCompleted++;
  }

  getSessionStats(): Omit<LessonSessionEndedProps, 'lesson_plan_id' | 'session_type' | 'exit_reason'> {
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      session_duration_ms: Date.now() - this.startTime,
      user_messages_count: this.userMessagesCount,
      agent_messages_count: this.agentMessagesCount,
      voice_messages_count: this.voiceMessagesCount,
      text_messages_count: this.textMessagesCount,
      topics_completed: this.topicsCompleted,
      avg_response_time_ms: Math.round(avgResponseTime),
    };
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, any>) => void;
    };
  }
}
