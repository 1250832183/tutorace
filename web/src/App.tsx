import React, { useState, useCallback } from 'react';
import { Sparkles, BookOpen, MessageSquare, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceSession } from '@/components/VoiceSession';
import { FileUpload } from '@/components/FileUpload';
import type { LessonPlan, ConnectionConfig } from '@/lib/types';
import * as api from '@/lib/api';

type AppState = 'home' | 'uploading' | 'generating' | 'session';

function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleStartWithFile = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setAppState('uploading');
      setError(null);

      // Upload the file
      const material = await api.uploadMaterial(selectedFile);

      setAppState('generating');

      // Generate lesson plan
      const plan = await api.generateLessonPlan(material.id);
      setLessonPlan(plan);

      // Create voice room
      const config = await api.createVoiceRoom(plan.id);
      setConnectionConfig(config);

      setAppState('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('home');
    }
  }, [selectedFile]);

  const handleStartWithTopic = useCallback(async () => {
    if (!topicInput.trim()) return;

    try {
      setAppState('generating');
      setError(null);

      // Generate lesson plan from topic
      const plan = await api.generateLessonPlanFromTopic(topicInput);
      setLessonPlan(plan);

      // Create voice room
      const config = await api.createVoiceRoom(plan.id);
      setConnectionConfig(config);

      setAppState('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('home');
    }
  }, [topicInput]);

  const handleStartFreeChat = useCallback(async () => {
    try {
      setAppState('generating');
      setError(null);

      // Create voice room without lesson plan
      const config = await api.createVoiceRoom();
      setConnectionConfig(config);

      setAppState('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('home');
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setAppState('home');
    setConnectionConfig(null);
    setLessonPlan(null);
    setSelectedFile(null);
    setTopicInput('');
  }, []);

  // Session view
  if (appState === 'session' && connectionConfig) {
    return (
      <div className="h-screen">
        <VoiceSession
          connectionConfig={connectionConfig}
          lessonPlan={lessonPlan}
          onDisconnect={handleDisconnect}
        />
      </div>
    );
  }

  // Loading states
  if (appState === 'uploading' || appState === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spark-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {appState === 'uploading' ? 'Uploading your document...' : 'Generating lesson plan...'}
          </h2>
          <p className="text-gray-600">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-spark flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Tutorace</h1>
          <span className="text-sm text-gray-500">AI Voice Tutor</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Learn anything with your
            <span className="bg-gradient-spark bg-clip-text text-transparent"> AI tutor</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a document, enter a topic, or just start chatting. Spark will guide you through
            an interactive voice-based learning experience.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Option 1: Upload PDF */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-spark-purple" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload a Document</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a PDF and I'll create a structured lesson plan to teach you the content.
            </p>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={handleClearFile}
              isUploading={false}
              className="mb-4"
            />
            <button
              onClick={handleStartWithFile}
              disabled={!selectedFile}
              className={cn(
                'w-full py-2 px-4 rounded-lg font-medium transition-colors',
                selectedFile
                  ? 'bg-spark-purple text-white hover:bg-purple-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Start Learning
            </button>
          </div>

          {/* Option 2: Enter Topic */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-spark-blue" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn a Topic</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter any topic and I'll create a comprehensive lesson to teach you about it.
            </p>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g., Machine Learning Basics"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-spark-blue"
            />
            <button
              onClick={handleStartWithTopic}
              disabled={!topicInput.trim()}
              className={cn(
                'w-full py-2 px-4 rounded-lg font-medium transition-colors',
                topicInput.trim()
                  ? 'bg-spark-blue text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Generate Lesson
            </button>
          </div>

          {/* Option 3: Free Chat */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-spark-cyan" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Conversation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Just want to chat? Start a free conversation and ask me anything you'd like to learn.
            </p>
            <div className="h-[88px]" /> {/* Spacer to align button */}
            <button
              onClick={handleStartFreeChat}
              className="w-full py-2 px-4 rounded-lg font-medium bg-spark-cyan text-white hover:bg-cyan-600 transition-colors"
            >
              Start Chatting
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">🎙️</div>
            <h4 className="font-semibold text-gray-900 mb-1">Natural Voice</h4>
            <p className="text-sm text-gray-600">
              Powered by Cartesia Sonic 3 for ultra-realistic voice interactions
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-1">Real-time</h4>
            <p className="text-sm text-gray-600">
              Sub-100ms latency for seamless, natural conversations
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-900 mb-1">Adaptive</h4>
            <p className="text-sm text-gray-600">
              Adjusts teaching style based on your responses and questions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
