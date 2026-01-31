import React from 'react';
import { CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonPlan, Topic } from '@/lib/types';

interface LessonPlanPanelProps {
  lessonPlan: LessonPlan | null;
  onTopicSelect?: (index: number) => void;
  className?: string;
}

export function LessonPlanPanel({ lessonPlan, onTopicSelect, className }: LessonPlanPanelProps) {
  if (!lessonPlan) {
    return (
      <div className={cn('p-4 bg-gray-50 rounded-lg', className)}>
        <p className="text-gray-500 text-center">No lesson plan loaded</p>
      </div>
    );
  }

  const completedCount = lessonPlan.topics.filter(t => t.completed).length;
  const progress = (completedCount / lessonPlan.topics.length) * 100;

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-xl shadow-sm border', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg text-gray-900">{lessonPlan.title}</h2>
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedCount}/{lessonPlan.topics.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-spark transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto p-2">
        {lessonPlan.topics.map((topic, index) => (
          <TopicItem
            key={topic.id}
            topic={topic}
            index={index}
            isCurrent={index === lessonPlan.currentTopicIndex}
            onClick={() => onTopicSelect?.(index)}
          />
        ))}
      </div>
    </div>
  );
}

interface TopicItemProps {
  topic: Topic;
  index: number;
  isCurrent: boolean;
  onClick?: () => void;
}

function TopicItem({ topic, index, isCurrent, onClick }: TopicItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        isCurrent
          ? 'bg-spark-purple/10 border border-spark-purple/30'
          : topic.completed
          ? 'bg-green-50 hover:bg-green-100'
          : 'hover:bg-gray-50'
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5">
        {topic.completed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : isCurrent ? (
          <PlayCircle className="w-5 h-5 text-spark-purple" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3
            className={cn(
              'font-medium truncate',
              isCurrent ? 'text-spark-purple' : topic.completed ? 'text-green-700' : 'text-gray-900'
            )}
          >
            {topic.title}
          </h3>
        </div>
        
        {topic.subtopics.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {topic.subtopics.slice(0, 3).map((subtopic, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {subtopic}
              </span>
            ))}
          </div>
        )}

        {topic.pageNumbers.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Pages: {topic.pageNumbers.join(', ')}
          </p>
        )}
      </div>
    </button>
  );
}
