
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, StudySubject } from '../types';
import { Menu, BookOpen, Sparkles, MoreVertical, Plus, Share2, Settings, ShieldCheck, Target, Globe } from 'lucide-react';

interface StudySchoolPageProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  activeSubject: string | null;
  customSubjects: StudySubject[]; 
  onSendMessage: (content: string, attachment?: File) => void;
  onStop?: () => void;
  onBack: () => void;
  language: string;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void; 
  onConfigure: () => void;
  onMenuClick: () => void;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  onStartLive: () => void;
  onDictionaryClick?: () => void;
  onLanguageClick: () => void;
  onBranchChat?: (messageId: string) => void;
  onQuizClick?: () => void;
  onShareClick?: () => void;
  onNewSession?: () => void;
  isAssessmentCompleted: boolean;
  onStartTest: () => void;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  isLiveActive?: boolean;
}

export const StudySchoolPage: React.FC<StudySchoolPageProps> = ({ 
  messages, 
  loadingState, 
  activeSubject, 
  customSubjects, 
  onSendMessage,
  onStop,
  onBack,
  language,
  onRegenerate,
  onEdit,
  onConfigure,
  onMenuClick,
  inputValue,
  onInputChange,
  onStartLive,
  onDictionaryClick,
  onLanguageClick,
  onBranchChat,
  onQuizClick,
  onShareClick,
  onNewSession,
  isAssessmentCompleted,
  onStartTest,
  onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare, isLiveActive
}) => {

  if (!activeSubject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black h-full p-8 text-center">
         <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-purple-100 dark:border-purple-800">
            <BookOpen size={40} className="text-purple-600 opacity-50" />
         </div>
         <h2 className="text-xl font-black dark:text-white mb-2 uppercase tracking-tighter">Laboratory Offline</h2>
         <p className="max-w-xs text-sm text-gray-500 italic font-medium">Select a specialized class from the hub to activate neural link.</p>
         <button onClick={onMenuClick} className="mt-8 px-10 py-3 bg-purple-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest md:hidden shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Hub Select</button>
      </div>
    );
  }

  const currentSubject = customSubjects.find(s => s.id === activeSubject);
  const showIntro = messages.length === 0;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-black relative overflow-hidden">
      {showIntro && !isAssessmentCompleted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700">
           <div className="w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl border border-purple-100 dark:border-purple-800 -rotate-3">
             <span className="text-6xl">{currentSubject?.icon}</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">Academic Entry</h1>
           <p className="text-gray-500 max-w-sm mb-12 text-lg font-medium italic">
             Complete the curriculum assessment to calibrate the AI teacher for {currentSubject?.name}.
           </p>
           <button 
             onClick={onStartTest}
             className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-[2.5rem] text-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
           >
             <Target size={24} strokeWidth={3} />
             Start Diagnostic
           </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative h-full">
          <div className="flex-1 overflow-hidden relative">
            <div className="max-w-4xl mx-auto h-full">
                <MessageList 
                    messages={messages} 
                    loadingState={loadingState} 
                    onEdit={onEdit || (() => {})} 
                    onRegenerate={onRegenerate}
                    onReply={(text) => onSendMessage(text)} 
                    language={language}
                    onBranchChat={onBranchChat}
                    onTranslate={onTranslate}
                    onReadAloud={onReadAloud}
                    onAudioOverview={onAudioOverview}
                    onMindMap={onMindMap}
                    onShare={onShare}
                    isTutorContext={true}
                />
            </div>
          </div>
          <div className="p-4 shrink-0 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5">
            <div className="max-w-4xl mx-auto">
                <ChatInput 
                    onSend={onSendMessage}
                    onStop={onStop}
                    isLoading={loadingState !== 'idle'}
                    onStartLive={onStartLive} 
                    value={inputValue}
                    onInputChange={onInputChange}
                    language={language}
                    placeholder={`Query ${currentSubject?.name} Intelligence...`}
                    isLiveActive={isLiveActive}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
