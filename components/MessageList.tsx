
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, LoadingState } from '../types';
import { ChatBubble } from './ChatBubble';

interface MessageListProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void; 
  onReply?: (content: string) => void;
  language?: string; 
  translateLanguage?: string;
  playbackEnabled?: boolean; // New Prop
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  loadingState, 
  onEdit, 
  onRegenerate, 
  onReply, 
  language = 'English', 
  translateLanguage = 'Urdu',
  playbackEnabled = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Track if the user is currently at the bottom of the chat
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  // Handle User Scroll Events
  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Define a threshold (e.g., 50px) to consider "at the bottom"
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserAtBottom(isAtBottom);
    }
  };

  // Initial Scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  // Smart Auto-Scroll Logic
  useEffect(() => {
    // If loading (waiting for start), force scroll to bottom nicely
    if (loadingState === 'loading') {
       bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
       setIsUserAtBottom(true);
       return;
    }

    // While streaming, ONLY scroll if the user was already at the bottom.
    // Use 'auto' behavior to prevent the "shaking" (jitter) caused by 'smooth' animation fighting updates.
    if (loadingState === 'streaming') {
        if (isUserAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
        return;
    }

    // For normal message additions (not streaming), smooth scroll if at bottom
    if (isUserAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

  }, [messages, loadingState]); // Re-run when messages change

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth"
    >
      {messages.map((msg, index) => (
        <ChatBubble 
          key={msg.id} 
          message={msg} 
          isLast={index === messages.length - 1}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onReply={onReply}
          language={language}
          translateLanguage={translateLanguage}
          playbackEnabled={playbackEnabled}
        />
      ))}
      
      {/* Loading Indicator (before response starts streaming) */}
      {loadingState === 'loading' && (
        <div className="flex justify-start w-full">
           <div className="flex items-start max-w-[98%] gap-3">
             <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-delay-1"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-delay-2"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-delay-3"></div>
             </div>
           </div>
        </div>
      )}
      
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
