import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  useRoomContext,
  useDataChannel,
} from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { cn } from '@/lib/utils';
import { AgentAvatar } from './VoiceVisualizer';
import { LessonPlanPanel } from './LessonPlanPanel';
import { VoiceControlBar } from './VoiceControlBar';
import type { LessonPlan, ConnectionConfig } from '@/lib/types';

interface VoiceSessionProps {
  connectionConfig: ConnectionConfig;
  lessonPlan: LessonPlan | null;
  onDisconnect: () => void;
}

export function VoiceSession({ connectionConfig, lessonPlan, onDisconnect }: VoiceSessionProps) {
  return (
    <LiveKitRoom
      token={connectionConfig.token}
      serverUrl={connectionConfig.wsUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      className="h-full"
    >
      <VoiceSessionContent lessonPlan={lessonPlan} onDisconnect={onDisconnect} />
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
  const [userTranscript, setUserTranscript] = useState('');
  const [agentTranscript, setAgentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'agent', text: string}>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get the latest transcriptions
  useEffect(() => {
    if (agentTranscriptions && agentTranscriptions.length > 0) {
      const latest = agentTranscriptions[agentTranscriptions.length - 1];
      if (latest.text) {
        setAgentTranscript(latest.text);
        // Add to chat history if it's a new message
        setChatHistory(prev => {
          const lastAgent = prev.filter(m => m.role === 'agent').pop();
          if (!lastAgent || lastAgent.text !== latest.text) {
            return [...prev, { role: 'agent', text: latest.text }];
          }
          return prev;
        });
      }
    }
  }, [agentTranscriptions]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const isConnected = state !== 'disconnected' && state !== 'connecting';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  const handleToggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    // TODO: Actually mute the audio track
  }, [isMuted]);

  const handleNextTopic = useCallback(() => {
    // Send message to agent to move to next topic
    if (room) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: 'next_topic' }));
      room.localParticipant.publishData(data, { reliable: true });
    }
  }, [room]);

  const handleEndSession = useCallback(() => {
    onDisconnect();
  }, [onDisconnect]);

  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !room) return;
    
    // Add to chat history
    setChatHistory(prev => [...prev, { role: 'user', text: textInput }]);
    
    // Send text message to agent via data channel
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'text_message', 
      text: textInput 
    }));
    room.localParticipant.publishData(data, { reliable: true });
    
    setTextInput('');
  }, [textInput, room]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left sidebar: Lesson Plan */}
      <div className="w-80 border-r bg-white flex-shrink-0">
        <LessonPlanPanel lessonPlan={lessonPlan} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Agent visualization area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-0">
          <div className="text-center mb-4">
            <AgentAvatar
              isActive={isConnected}
              isSpeaking={isSpeaking}
              className="mx-auto mb-4"
            />
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isSpeaking
                ? 'Spark is teaching...'
                : isListening
                ? 'Listening to you...'
                : isConnected
                ? 'Ready to help!'
                : 'Connecting...'}
            </h2>
            
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              {lessonPlan
                ? `Currently learning: ${lessonPlan.topics[lessonPlan.currentTopicIndex]?.title || 'Introduction'}`
                : 'Ask me anything or upload a document to get started!'}
            </p>

            {/* Audio visualizer */}
            {audioTrack && (
              <div className="mt-4">
                <BarVisualizer
                  state={state}
                  trackRef={audioTrack}
                  barCount={7}
                  className="h-12"
                />
              </div>
            )}
          </div>

          {/* Chat history */}
          <div className="w-full max-w-2xl flex-1 overflow-y-auto bg-white rounded-lg shadow-sm border p-4 mb-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>Start a conversation by speaking or typing below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg max-w-[80%]',
                      msg.role === 'user'
                        ? 'bg-blue-100 ml-auto text-right'
                        : 'bg-gray-100 mr-auto'
                    )}
                  >
                    <p className="text-sm text-gray-800">{msg.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Text input area */}
          <div className="w-full max-w-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message (or speak using your microphone)..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                onClick={handleSendText}
                disabled={!isConnected || !textInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Voice control bar */}
        <VoiceControlBar
          isConnected={isConnected}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isMuted={isMuted}
          transcript={userTranscript}
          agentTranscript={agentTranscript}
          onToggleMute={handleToggleMute}
          onNextTopic={handleNextTopic}
          onEndSession={handleEndSession}
        />
      </div>
    </div>
  );
}
