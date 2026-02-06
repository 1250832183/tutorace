import { useEffect, useState, useCallback, useRef } from "react";
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
      <VoiceSessionContent lessonPlan={lessonPlan || null} onDisconnect={handleDisconnect} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

interface VoiceSessionContentProps {
  lessonPlan: LessonPlan | null;
  onDisconnect: () => void;
}

function VoiceSessionContent({ lessonPlan, onDisconnect }: VoiceSessionContentProps) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "agent"; text: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get the latest transcriptions
  useEffect(() => {
    if (agentTranscriptions && agentTranscriptions.length > 0) {
      const latest = agentTranscriptions[agentTranscriptions.length - 1];
      if (latest.text) {
        setChatHistory((prev) => {
          const lastAgent = prev.filter((m) => m.role === "agent").pop();
          if (!lastAgent || lastAgent.text !== latest.text) {
            return [...prev, { role: "agent", text: latest.text }];
          }
          return prev;
        });
      }
    }
  }, [agentTranscriptions]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const isConnected = state !== "disconnected" && state !== "connecting";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  const handleToggleMute = useCallback(async () => {
    if (room) {
      const localParticipant = room.localParticipant;
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted, room]);

  const handleNextTopic = useCallback(() => {
    if (room) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: "next_topic" }));
      room.localParticipant.publishData(data, { reliable: true });
    }
  }, [room]);

  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !room) return;

    setChatHistory((prev) => [...prev, { role: "user", text: textInput }]);

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "text_message",
        text: textInput,
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    setTextInput("");
  }, [textInput, room]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

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

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-spark flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Spark</h1>
              <p className="text-xs text-muted-foreground">
                {isSpeaking ? "Speaking..." : isListening ? "Listening..." : isConnected ? "Ready" : "Connecting..."}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onDisconnect}>
            <X className="w-5 h-5" />
          </Button>
        </header>

        {/* Agent visualization area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-0">
          {/* Avatar */}
          <div
            className={cn(
              "w-32 h-32 rounded-full gradient-spark flex items-center justify-center mb-6 transition-all",
              isSpeaking && "glow-purple scale-110",
              isListening && "ring-4 ring-primary/30"
            )}
          >
            <Sparkles className="w-16 h-16 text-white" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {isSpeaking
              ? "Spark is teaching..."
              : isListening
              ? "Listening to you..."
              : isConnected
              ? "Ready to help!"
              : "Connecting..."}
          </h2>

          {!isConnected && (
            <Loader2 className="w-8 h-8 animate-spin text-primary mt-4" />
          )}

          {/* Audio visualizer */}
          {audioTrack && isConnected && (
            <div className="mt-4 w-64">
              <BarVisualizer state={state} trackRef={audioTrack} barCount={7} className="h-12" />
            </div>
          )}
        </div>

        {/* Chat history */}
        <div className="mx-4 mb-4 flex-1 max-h-64 overflow-y-auto bg-white/80 backdrop-blur-sm rounded-lg border p-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation by speaking or typing below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg max-w-[80%]",
                    msg.role === "user"
                      ? "bg-primary/10 ml-auto text-right"
                      : "bg-muted mr-auto"
                  )}
                >
                  <p className="text-sm text-foreground">{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              onClick={handleToggleMute}
              disabled={!isConnected}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={!isConnected}
              />
              <Button onClick={handleSendText} disabled={!isConnected || !textInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {lessonPlan && (
              <Button variant="outline" onClick={handleNextTopic} disabled={!isConnected}>
                <SkipForward className="w-4 h-4 mr-2" />
                Next
              </Button>
            )}

            <Button variant="destructive" onClick={onDisconnect}>
              End
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
