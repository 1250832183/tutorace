import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Sparkles, Mic, MicOff, SkipForward, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { trackEvent, SessionTracker } from "@/lib/analytics";

interface LessonPlan {
  id: string;
  title: string;
  topics: Array<{
    id: string;
    title: string;
    content: string;
    subtopics: string[];
    completed: boolean;
  }>;
  currentTopicIndex: number;
}

export default function Session() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const token = params.get("token");
  const wsUrl = params.get("wsUrl");
  const lessonPlanId = params.get("lessonPlanId");

  const { data: lessonPlan } = trpc.voice.getLessonPlan.useQuery(
    { id: lessonPlanId || "" },
    { enabled: !!lessonPlanId }
  );

  const handleDisconnect = useCallback(() => {
    setLocation("/");
  }, [setLocation]);

  if (!token || !wsUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-destructive mb-4">Missing connection parameters</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
      className="h-screen"
    >
      <VoiceSessionContent 
        lessonPlan={lessonPlan || null} 
        lessonPlanId={lessonPlanId || undefined}
        onDisconnect={handleDisconnect} 
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

interface VoiceSessionContentProps {
  lessonPlan: LessonPlan | null;
  lessonPlanId?: string;
  onDisconnect: () => void;
}

function VoiceSessionContent({ lessonPlan, lessonPlanId, onDisconnect }: VoiceSessionContentProps) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "agent"; text: string; timestamp: number }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionTrackerRef = useRef<SessionTracker | null>(null);
  const lastAgentMessageTimeRef = useRef<number>(0);
  const sessionStartedRef = useRef(false);

  const sessionType = lessonPlan ? 'lesson' : 'free_chat';

  // Initialize session tracker and track session start
  useEffect(() => {
    if (!sessionStartedRef.current && room) {
      sessionTrackerRef.current = new SessionTracker();
      
      trackEvent({
        name: 'lesson_session_started',
        properties: {
          lesson_plan_id: lessonPlanId,
          lesson_title: lessonPlan?.title,
          session_type: sessionType,
          room_id: room.name,
        },
      });

      sessionStartedRef.current = true;
    }

    // Cleanup: track session end
    return () => {
      if (sessionTrackerRef.current && sessionStartedRef.current) {
        const stats = sessionTrackerRef.current.getSessionStats();
        trackEvent({
          name: 'lesson_session_ended',
          properties: {
            lesson_plan_id: lessonPlanId,
            session_type: sessionType,
            ...stats,
            exit_reason: 'disconnected',
          },
        });
      }
    };
  }, [room, lessonPlanId, lessonPlan, sessionType]);

  // Track agent messages
  useEffect(() => {
    if (agentTranscriptions && agentTranscriptions.length > 0) {
      const latest = agentTranscriptions[agentTranscriptions.length - 1];
      if (latest.text) {
        const now = Date.now();
        setChatHistory((prev) => {
          const lastAgent = prev.filter((m) => m.role === "agent").pop();
          if (!lastAgent || lastAgent.text !== latest.text) {
            // Track agent message received
            const responseTime = lastAgentMessageTimeRef.current > 0 
              ? now - lastAgentMessageTimeRef.current 
              : undefined;
            
            trackEvent({
              name: 'conversation_message_received',
              properties: {
                lesson_plan_id: lessonPlanId,
                session_type: sessionType,
                message_length: latest.text.length,
                response_time_ms: responseTime || 0,
              },
            });

            sessionTrackerRef.current?.trackAgentMessage(responseTime);
            
            return [...prev, { role: "agent", text: latest.text, timestamp: now }];
          }
          return prev;
        });
      }
    }
  }, [agentTranscriptions, lessonPlanId, sessionType]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const isConnected = state !== "disconnected" && state !== "connecting";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  // Track voice activity
  useEffect(() => {
    if (isListening) {
      lastAgentMessageTimeRef.current = Date.now();
    }
  }, [isListening]);

  const handleToggleMute = useCallback(async () => {
    if (room) {
      const localParticipant = room.localParticipant;
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted, room]);

  const handleNextTopic = useCallback(() => {
    if (room && lessonPlan) {
      const currentIndex = lessonPlan.currentTopicIndex;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < lessonPlan.topics.length) {
        trackEvent({
          name: 'lesson_slide_changed',
          properties: {
            lesson_plan_id: lessonPlanId!,
            from_topic_index: currentIndex,
            to_topic_index: nextIndex,
            topic_title: lessonPlan.topics[nextIndex].title,
            change_type: 'manual',
            direction: 'next',
          },
        });

        sessionTrackerRef.current?.trackTopicCompleted();
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: "next_topic" }));
      room.localParticipant.publishData(data, { reliable: true });
    }
  }, [room, lessonPlan, lessonPlanId]);

  const handleSendText = useCallback((method: 'button' | 'enter_key' = 'button') => {
    if (!textInput.trim() || !room) return;

    const now = Date.now();
    setChatHistory((prev) => [...prev, { role: "user", text: textInput, timestamp: now }]);

    // Track text message sent
    trackEvent({
      name: 'text_message_sent',
      properties: {
        lesson_plan_id: lessonPlanId,
        session_type: sessionType,
        message_length: textInput.length,
        send_method: method,
      },
    });

    sessionTrackerRef.current?.trackUserMessage('text');
    lastAgentMessageTimeRef.current = now;

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "text_message",
        text: textInput,
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    setTextInput("");
  }, [textInput, room, lessonPlanId, sessionType]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText('enter_key');
      }
    },
    [handleSendText]
  );

  const handleExitClick = useCallback(() => {
    if (sessionTrackerRef.current) {
      const stats = sessionTrackerRef.current.getSessionStats();
      trackEvent({
        name: 'session_exit_clicked',
        properties: {
          lesson_plan_id: lessonPlanId,
          session_type: sessionType,
          session_duration_ms: stats.session_duration_ms,
          messages_sent: stats.user_messages_count,
        },
      });

      trackEvent({
        name: 'lesson_session_ended',
        properties: {
          lesson_plan_id: lessonPlanId,
          session_type: sessionType,
          ...stats,
          exit_reason: 'user_action',
        },
      });
    }
    
    onDisconnect();
  }, [lessonPlanId, sessionType, onDisconnect]);

  // Track voice messages (approximate based on listening state changes)
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && !isMuted) {
      // User just finished speaking
      const duration = Date.now() - lastAgentMessageTimeRef.current;
      
      trackEvent({
        name: 'voice_message_sent',
        properties: {
          lesson_plan_id: lessonPlanId,
          session_type: sessionType,
          message_duration_ms: duration,
          is_muted: isMuted,
        },
      });

      sessionTrackerRef.current?.trackUserMessage('voice');
    }
    prevListeningRef.current = isListening;
  }, [isListening, isMuted, lessonPlanId, sessionType]);

  return (
    <div className="flex h-full bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Left sidebar: Lesson Plan */}
      {lessonPlan && (
        <div className="w-80 border-r bg-white/80 backdrop-blur-sm flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg text-foreground">{lessonPlan.title}</h2>
            <p className="text-sm text-muted-foreground">
              {lessonPlan.topics.length} topics
            </p>
          </div>
          <div className="p-4 space-y-2">
            {lessonPlan.topics.map((topic, index) => (
              <div
                key={topic.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  index === lessonPlan.currentTopicIndex
                    ? "bg-primary/10 border-primary"
                    : topic.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      index === lessonPlan.currentTopicIndex
                        ? "bg-primary text-primary-foreground"
                        : topic.completed
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm text-foreground">{topic.title}</span>
                </div>
                {index === lessonPlan.currentTopicIndex && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {topic.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-spark flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {lessonPlan?.title || "Free Conversation"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? (
                    isSpeaking ? "AI is speaking..." : isListening ? "Listening..." : "Connected"
                  ) : (
                    "Connecting..."
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleExitClick}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white border border-border"
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Controls */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="container max-w-4xl mx-auto">
            {/* Voice visualizer */}
            <div className="mb-4 h-16 flex items-center justify-center">
              {audioTrack && <BarVisualizer state={state} barCount={5} trackRef={audioTrack} />}
            </div>

            {/* Text input */}
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendText('button')}
                disabled={!textInput.trim() || !isConnected}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={handleToggleMute}
                disabled={!isConnected}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {lessonPlan && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNextTopic}
                  disabled={!isConnected}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Next Topic
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
