
import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState } from '../types';

interface ChineseTutorPageProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  onSendMessage: (content: string, attachment?: File) => void;
  onStartTest: () => void;
  language?: string;
  onRegenerate?: (id: string) => void;
  onStartLive: () => void;
}

export const ChineseTutorPage: React.FC<ChineseTutorPageProps> = ({ 
  messages, 
  loadingState, 
  onSendMessage, 
  onStartTest,
  language,
  onRegenerate,
  onStartLive
}) => {
  
  // If we have no messages (or empty array), show intro
  const showIntro = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      {showIntro ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
             <span className="text-4xl">🇨🇳</span>
           </div>
           <h1 className="text-3xl font-bold text-gray-800 mb-3">Chinese Language Tutor</h1>
           <p className="text-gray-600 max-w-md mb-8 text-lg">
             Take a quick assessment to determine your proficiency level, and then get personalized lessons to improve your skills.
           </p>
           <button 
             onClick={onStartTest}
             className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
           >
             <span>Start Entry Test</span>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
             </svg>
           </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden relative">
            <MessageList 
              messages={messages} 
              loadingState={loadingState} 
              onEdit={() => {}} // Edit not supported in tutor for now
              onRegenerate={onRegenerate}
              onReply={(text) => onSendMessage(text)}
              language={language}
            />
          </div>
          
          <div className="w-full px-4 pb-6 pt-2">
            <ChatInput 
              onSend={onSendMessage} 
              isLoading={loadingState !== 'idle'}
              onStartLive={onStartLive} 
            />
          </div>
        </>
      )}
    </div>
  );
};
