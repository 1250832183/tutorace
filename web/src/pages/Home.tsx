import { useState, useCallback } from "react";
import { Sparkles, BookOpen, MessageSquare, Upload, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";

type AppState = "home" | "generating";

export default function Home() {
  const [, setLocation] = useLocation();
  const [appState, setAppState] = useState<AppState>("home");
  const [topicInput, setTopicInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRoomMutation = trpc.voice.createRoom.useMutation();
  const generateLessonPlanMutation = trpc.voice.generateLessonPlan.useMutation();

  const handleStartWithTopic = useCallback(async () => {
    if (!topicInput.trim()) return;

    const startTime = Date.now();

    try {
      // Track entry click
      trackEvent({
        name: 'lesson_entry_clicked',
        properties: {
          entry_type: 'topic',
          topic_input: topicInput,
        },
      });

      setAppState("generating");
      setError(null);

      // Track generation start
      trackEvent({
        name: 'lesson_generation_started',
        properties: {
          generation_type: 'topic',
          source_name: topicInput,
          topic: topicInput,
        },
      });

      // Generate lesson plan from topic
      const lessonPlan = await generateLessonPlanMutation.mutateAsync({ topic: topicInput });

      // Track generation completion
      trackEvent({
        name: 'lesson_generation_completed',
        properties: {
          generation_type: 'topic',
          source_name: topicInput,
          lesson_plan_id: lessonPlan.id,
          lesson_title: lessonPlan.title || topicInput,
          topics_count: lessonPlan.topics?.length || 0,
          generation_duration_ms: Date.now() - startTime,
        },
      });

      // Create voice room
      const roomConfig = await createRoomMutation.mutateAsync({ lessonPlanId: lessonPlan.id });

      // Navigate to session with state
      setLocation(`/session?token=${encodeURIComponent(roomConfig.token)}&wsUrl=${encodeURIComponent(roomConfig.wsUrl)}&lessonPlanId=${lessonPlan.id}`);
    } catch (err) {
      // Track generation failure
      trackEvent({
        name: 'lesson_generation_failed',
        properties: {
          generation_type: 'topic',
          source_name: topicInput,
          error_message: err instanceof Error ? err.message : 'Unknown error',
          generation_duration_ms: Date.now() - startTime,
        },
      });

      setError(err instanceof Error ? err.message : "An error occurred");
      setAppState("home");
    }
  }, [topicInput, generateLessonPlanMutation, createRoomMutation, setLocation]);

  const handleStartFreeChat = useCallback(async () => {
    try {
      // Track entry click
      trackEvent({
        name: 'lesson_entry_clicked',
        properties: {
          entry_type: 'free_chat',
        },
      });

      setAppState("generating");
      setError(null);

      // Create voice room without lesson plan
      const roomConfig = await createRoomMutation.mutateAsync({});

      // Navigate to session
      setLocation(`/session?token=${encodeURIComponent(roomConfig.token)}&wsUrl=${encodeURIComponent(roomConfig.wsUrl)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setAppState("home");
    }
  }, [createRoomMutation, setLocation]);

  // Loading state
  if (appState === "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Preparing your session...
          </h2>
          <p className="text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-spark flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Tutorace</h1>
          <span className="text-sm text-muted-foreground">AI Voice Tutor</span>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Learn anything with your
            <span className="gradient-text"> AI tutor</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a document, enter a topic, or just start chatting. Spark will guide you through
            an interactive voice-based learning experience.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive max-w-4xl mx-auto">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Option 1: Upload PDF */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Upload a Document</CardTitle>
              <CardDescription>
                Upload a PDF and I'll create a structured lesson plan to teach you the content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-4">
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
              <Button disabled className="w-full">
                Start Learning
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Enter Topic */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Learn a Topic</CardTitle>
              <CardDescription>
                Enter any topic and I'll create a comprehensive lesson to teach you about it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g., Machine Learning Basics"
                className="mb-4"
              />
              <Button
                onClick={handleStartWithTopic}
                disabled={!topicInput.trim()}
                className="w-full"
              >
                Generate Lesson
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: Free Chat */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>Free Conversation</CardTitle>
              <CardDescription>
                Just want to chat? Start a free conversation and ask me anything you'd like to learn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[72px]" /> {/* Spacer to align button */}
              <Button
                onClick={handleStartFreeChat}
                variant="secondary"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-3xl mb-2">🎙️</div>
            <h4 className="font-semibold text-foreground mb-1">Natural Voice</h4>
            <p className="text-sm text-muted-foreground">
              Powered by Cartesia Sonic 3 for ultra-realistic voice interactions
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-foreground mb-1">Real-time</h4>
            <p className="text-sm text-muted-foreground">
              Sub-100ms latency for seamless, natural conversations
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-foreground mb-1">Adaptive</h4>
            <p className="text-sm text-muted-foreground">
              Adjusts teaching style based on your responses and questions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
