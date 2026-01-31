import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, SkipForward, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceVisualizer } from './VoiceVisualizer';

interface VoiceControlBarProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  transcript: string;
  agentTranscript: string;
  onToggleMute: () => void;
  onNextTopic: () => void;
  onEndSession: () => void;
  className?: string;
}

export function VoiceControlBar({
  isConnected,
  isListening,
  isSpeaking,
  isMuted,
  transcript,
  agentTranscript,
  onToggleMute,
  onNextTopic,
  onEndSession,
  className,
}: VoiceControlBarProps) {
  return (
    <div className={cn('bg-white border-t shadow-lg', className)}>
      {/* Transcript display */}
      <div className="px-4 py-3 border-b bg-gray-50 min-h-[60px]">
        {isSpeaking && agentTranscript && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-spark-purple bg-spark-purple/10 px-2 py-0.5 rounded">
              Spark
            </span>
            <p className="text-sm text-gray-700 flex-1">{agentTranscript}</p>
          </div>
        )}
        {isListening && transcript && (
          <div className="flex items-start gap-2 mt-2">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              You
            </span>
            <p className="text-sm text-gray-700 flex-1">{transcript}</p>
          </div>
        )}
        {!isSpeaking && !isListening && !transcript && !agentTranscript && (
          <p className="text-sm text-gray-400 text-center">
            {isConnected ? 'Listening for your voice...' : 'Connect to start the session'}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Voice status */}
        <div className="flex items-center gap-3">
          <VoiceVisualizer isActive={isConnected} isSpeaking={isSpeaking || isListening} />
          <span className="text-sm text-gray-600">
            {!isConnected
              ? 'Disconnected'
              : isSpeaking
              ? 'Spark is speaking...'
              : isListening
              ? 'Listening...'
              : 'Ready'}
          </span>
        </div>

        {/* Center: Main controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            disabled={!isConnected}
            className={cn(
              'p-3 rounded-full transition-colors',
              isMuted
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              !isConnected && 'opacity-50 cursor-not-allowed'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onNextTopic}
            disabled={!isConnected}
            className={cn(
              'p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors',
              !isConnected && 'opacity-50 cursor-not-allowed'
            )}
            title="Next Topic"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: End session */}
        <button
          onClick={onEndSession}
          disabled={!isConnected}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-red-50 text-red-600 hover:bg-red-100 transition-colors',
            !isConnected && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Square className="w-4 h-4" />
          <span className="text-sm font-medium">End Session</span>
        </button>
      </div>
    </div>
  );
}
