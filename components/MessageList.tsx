
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, LoadingState } from '../types';
import { ChatBubble } from './ChatBubble';
import { Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  onEdit: (id: string, newContent: string) => void;
  onEditInput?: (content: string, id: string) => void;
  onRegenerate?: (id: string) => void; 
  onReply?: (content: string) => void;
  onTranslate?: (id: string, targetLang: string) => void;
  // Fix: Added missing audio handlers used by parent components to satisfy TypeScript
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onAudioAction?: (id: string, type: 'speak' | 'overview') => void;
  onDownloadDoc?: (id: string) => void;
  onShare?: (id: string) => void;
  onRemoveAudioNote?: (messageId: string, noteId: string) => void;
  onAudioNotePlayed?: (messageId: string, noteId: string) => void;
  onMindMap?: (id: string) => void;
  language?: string; 
  onBranchChat?: (id: string) => void;
  isTutorContext?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  loadingState, 
  onEdit,
  onEditInput,
  onRegenerate, 
  onReply,
  onTranslate,
  // Fix: Destructure added handlers and previously ignored handlers
  onReadAloud,
  onAudioOverview,
  onAudioAction,
  onDownloadDoc,
  onShare,
  onRemoveAudioNote,
  onAudioNotePlayed,
  onMindMap,
  language = 'English', 
  onBranchChat,
  isTutorContext = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserAtBottom(isAtBottom);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (loadingState === 'loading') {
       bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
       setIsUserAtBottom(true);
       return;
    }
    if (loadingState === 'streaming') {
        if (isUserAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
        return;
    }
    if (isUserAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingState]);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-auto px-4 py-6 space-y-2 scroll-smooth no-scrollbar"
    >
      {messages.map((msg, index) => (
        <ChatBubble 
          key={msg.id} 
          message={msg} 
          isLast={index === messages.length - 1}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onReply={onReply}
          onTranslate={onTranslate}
          /* Fix: Removed onReadAloud as it is handled within onAudioAction */
          onAudioAction={onAudioAction || ((id, type) => {
            if (type === 'speak') onReadAloud?.(id);
            else if (type === 'overview') onAudioOverview?.(id);
          })}
          onDownloadDoc={onDownloadDoc}
          onMindMap={onMindMap}
          onShare={onShare}
          onRemoveAudioNote={onRemoveAudioNote}
          onAudioNotePlayed={onAudioNotePlayed}
          language={language}
          isTutorContext={isTutorContext}
        />
      ))}
      
      {loadingState === 'loading' && (
        <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 w-full max-w-sm">
             <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                <Sparkles size={16} className="animate-spin" />
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Synthesizing Response...</span>
                </div>
                <div className="h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                </div>
             </div>
           </div>
        </div>
      )}
      
      <div ref={bottomRef} className="h-20" />
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(333%); width: 30%; }
        }
      `}</style>
    </div>
  );
};
