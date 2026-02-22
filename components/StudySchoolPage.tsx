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
  // Functional Action Handlers
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const StudySchoolPage: React.FC<StudySchoolPageProps> = ({ 
  messages, 
  loadingState, 
  activeSubject, 
  customSubjects, 
  onSendMessage,
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
  onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeSubject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black h-full p-8 text-center">
         <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-purple-100 dark:border-purple-800">
            <BookOpen size={40} className="text-purple-600 opacity-50" />
         </div>
         <h2 className="text-xl font-bold dark:text-white mb-2 uppercase tracking-tight">Study Hall Standby</h2>
         <p className="max-w-xs text-sm text-gray-500">Select a subject to begin your lesson.</p>
         <button onClick={onMenuClick} className="mt-8 px-8 py-3 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-widest md:hidden">Open Menu</button>
      </div>
    );
  }

  const currentSubject = customSubjects.find(s => s.id === activeSubject);
  const isAgent = currentSubject?.type === 'agent';

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-black relative overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md z-50 shrink-0">
         <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button onClick={onMenuClick} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Menu size={20} /></button>
            <div className="flex items-center gap-3">
               <span className="text-2xl hidden xs:block">{currentSubject?.icon}</span>
               <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">{currentSubject?.name}</h2>
                  <div className="flex items-center gap-1.5">
                    {isAssessmentCompleted ? (
                      <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> Journey Verified</span>
                    ) : (
                      <span className="text-[9px] text-orange-500 font-black uppercase tracking-widest animate-pulse">Test Required</span>
                    )}
                    <span className="text-[9px] text-gray-400">•</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isAgent ? 'text-purple-500' : 'text-blue-500'}`}>
                      {isAgent ? 'Active Agent Workspace' : 'Class Assistant Active'}
                    </span>
                  </div>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
             <button 
                onClick={() => onNewSession?.()}
                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span className="hidden md:inline">New Session</span>
             </button>

             {/* 3-DOT MENU */}
             <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-lg transition-colors z-[60] ${isMenuOpen ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-1 space-y-0.5">
                            <button onClick={() => { onLanguageClick(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Globe size={18} className="text-blue-500" /> Output Language
                            </button>
                            <button onClick={() => { onQuizClick?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <span className="text-lg">📝</span> Attempt Quiz
                            </button>
                            <button onClick={() => { onDictionaryClick?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <BookOpen size={18} className="text-purple-500" /> Dictionary
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                            <button onClick={() => { onShareClick?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Share2 size={18} className="text-gray-400" /> Share Chat
                            </button>
                            <button onClick={() => { onConfigure(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Settings size={18} className="text-gray-400" /> Configure
                            </button>
                        </div>
                    </div>
                )}
             </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
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
        <div className="w-full px-4 pb-8 pt-4 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5">
          <div className="max-w-4xl mx-auto">
              <ChatInput 
                  onSend={onSendMessage}
                  isLoading={loadingState !== 'idle'}
                  onStartLive={onStartLive} 
                  value={inputValue}
                  onInputChange={onInputChange}
                  language={language}
              />
          </div>
        </div>
      </div>
    </div>
  );
};