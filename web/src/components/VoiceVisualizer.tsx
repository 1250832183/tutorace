import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  className?: string;
}

export function VoiceVisualizer({ isActive, isSpeaking, className }: VoiceVisualizerProps) {
  const bars = 5;
  
  return (
    <div className={cn('flex items-center justify-center gap-1 h-8', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-150',
            isActive && isSpeaking
              ? 'bg-spark-purple voice-bar'
              : isActive
              ? 'bg-spark-blue h-2'
              : 'bg-gray-300 h-1'
          )}
          style={{
            height: isActive && isSpeaking ? `${Math.random() * 24 + 8}px` : undefined,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

interface AgentAvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  className?: string;
}

export function AgentAvatar({ isActive, isSpeaking, className }: AgentAvatarProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Outer glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-300',
          isActive && isSpeaking
            ? 'bg-spark-purple/30 animate-pulse scale-125'
            : isActive
            ? 'bg-spark-blue/20 scale-110'
            : 'bg-transparent scale-100'
        )}
      />
      
      {/* Avatar circle */}
      <div
        className={cn(
          'relative w-24 h-24 rounded-full flex items-center justify-center',
          'bg-gradient-spark text-white font-bold text-3xl',
          'shadow-lg transition-transform duration-300',
          isActive && isSpeaking ? 'scale-105' : 'scale-100'
        )}
      >
        S
      </div>
      
      {/* Voice indicator */}
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <VoiceVisualizer isActive={isActive} isSpeaking={isSpeaking} />
        </div>
      )}
    </div>
  );
}
