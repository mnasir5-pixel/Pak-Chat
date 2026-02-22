import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, Tutor, SavedWord } from '../types';
import { 
    Menu, Plus, MoreVertical, BookOpen, Share2, 
    Settings, Globe, MessageCircle, PenTool, 
    Volume2, X, Trash2, PlayCircle, 
    ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, 
    Mic, Book, Sparkles, Languages
} from 'lucide-react';
import { LessonEngine } from './LessonEngine';
import { SUPPORTED_LANGUAGES } from '../constants';

const DEFAULT_VOCABULARY: SavedWord[] = [
  { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello', urdu_meaning: 'ہیلو / السلام علیکم', timestamp: Date.now() },
  { hanzi: '老师', pinyin: 'lǎo shī', meaning: 'Teacher', urdu_meaning: 'استاد', timestamp: Date.now() },
  { hanzi: '中国', pinyin: 'zhōng guó', meaning: 'China', urdu_meaning: 'چین', timestamp: Date.now() },
  { hanzi: '学生', pinyin: 'xué sheng', meaning: 'Student', urdu_meaning: 'طالب علم', timestamp: Date.now() },
  { hanzi: '谢谢', pinyin: 'xiè xie', meaning: 'Thank you', urdu_meaning: 'شکریہ', timestamp: Date.now() },
];

const MasterySession: React.FC<{ 
  words: SavedWord[]; 
  initialIndex: number; 
  onClose: () => void;
  language: string;
}> = ({ words, initialIndex, onClose, language }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const word = words[currentIndex];
  
  const next = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev + 1) % words.length); };
  const prev = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev - 1 + words.length) % words.length); };

  const speak = (text: string, target: 'term' | 'def') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (target === 'term') {
      const lowerLang = language.toLowerCase();
      if (lowerLang.includes('chinese') || /[\u4e00-\u9fa5]/.test(text)) {
          utterance.lang = 'zh-CN';
      } else {
          utterance.lang = 'en-US';
      }
    } else {
      // Definition/Meaning is English or Urdu fallback
      utterance.lang = 'en-US'; 
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  if (!word) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-white dark:bg-black flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Mastery Session</h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full max-w-md aspect-[4/3] cursor-pointer group"
          style={{ perspective: '1000px' }}
        >
          <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 bg-white dark:bg-gray-900 border-2 border-orange-100 dark:border-orange-900/40 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 [backface-visibility:hidden]">
               <span className="text-[10px] font-black uppercase text-orange-500 tracking-[0.4em] mb-6">Term</span>
               <h3 className="text-5xl sm:text-6xl font-black dark:text-white mb-2">{word.hanzi}</h3>
               <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{word.pinyin}</p>
               
               <button 
                  onClick={(e) => { e.stopPropagation(); speak(word.hanzi, 'term'); }}
                  className={`mt-6 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isSpeaking ? 'bg-orange-50 text-white animate-pulse' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                  title="Read Term"
               >
                 <Volume2 size={28} />
               </button>

               <div className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-widest">Tap to reveal meaning</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-500 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 [transform:rotateY(180deg)] [backface-visibility:hidden]">
               <span className="text-[10px] font-black uppercase text-orange-600 tracking-[0.4em] mb-6">Definition</span>
               <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight mb-4">{word.meaning}</p>
               {word.urdu_meaning && <p className="text-4xl font-black text-emerald-800 dark:text-emerald-400 font-serif mb-4" dir="rtl">{word.urdu_meaning}</p>}
               
               <button 
                  onClick={(e) => { e.stopPropagation(); speak(word.meaning, 'def'); }}
                  className={`p-4 rounded-full transition-all shadow-lg active:scale-90 ${isSpeaking ? 'bg-orange-600 text-white animate-pulse' : 'bg-white text-orange-600 hover:shadow-xl'}`}
                  title="Read Definition"
               >
                 <Volume2 size={28} />
               </button>

               <div className="mt-8 text-orange-400 text-[10px] font-black uppercase tracking-widest">Tap to flip back</div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex items-center gap-8">
           <button onClick={prev} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"><ChevronLeft size={24}/></button>
           <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1} / {words.length}</span>
           <button onClick={next} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"><ChevronRight size={24}/></button>
        </div>
      </div>
    </div>
  );
};

interface TutorsPageProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  activeTutorId: string | null;
  tutors: Tutor[];
  onSelectTutor: (tutorId: string) => void;
  onStartTest: () => void;
  onSendMessage: (content: string, attachment?: File) => void;
  onBack: () => void;
  onStartLive: () => void;
  language: string;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onConfigure: () => void;
  onAddTutor: (tutor: Tutor) => void;
  onMenuClick: () => void; 
  isAddTutorOpen: boolean;
  setIsAddTutorOpen: (open: boolean) => void;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  onNewSession?: () => void;
  onDictionaryClick?: () => void;
  onLanguageClick: () => void;
  onQuizClick?: () => void;
  onShareClick?: () => void;
  isAssessmentCompleted: boolean;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const TutorsPage: React.FC<TutorsPageProps> = ({
  messages, loadingState, activeTutorId, tutors, onSendMessage, onBack, onStartLive, language, onRegenerate, onEdit, onConfigure, onAddTutor, onMenuClick, inputValue, onInputChange, onNewSession, onDictionaryClick, onLanguageClick, onQuizClick, onShareClick, onStartTest, isAssessmentCompleted,
  onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'practice'>('chat');
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [activeMasteryIndex, setActiveMasteryIndex] = useState<number | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<{ id: string; title: string; words?: SavedWord[] } | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const storageKey = `pakchat_practice_${activeTutorId || 'default'}`;

  useEffect(() => {
    try {
        const saved = localStorage.getItem(storageKey);
        setSavedWords(saved ? JSON.parse(saved) : []);
    } catch { setSavedWords([]); }
  }, [activeTutorId]);

  useEffect(() => {
    const handleSaveWord = (e: any) => {
        const word = e.detail;
        setSavedWords(prev => { 
            if (prev.some(w => w.hanzi === word.hanzi)) return prev; 
            const updated = [...prev, { ...word, timestamp: Date.now() }]; 
            localStorage.setItem(storageKey, JSON.stringify(updated)); 
            return updated; 
        });
    };
    window.addEventListener('pakchat:save_word', handleSaveWord);
    return () => window.removeEventListener('pakchat:save_word', handleSaveWord);
  }, [storageKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Improved language detection for speech
    const lowerLang = language.toLowerCase();
    if (lowerLang.includes('chinese') || /[\u4e00-\u9fa5]/.test(text)) {
        utterance.lang = 'zh-CN';
    } else {
        utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStartWritingMastery = () => {
    const wordsToPractice = savedWords.length > 0 ? savedWords : DEFAULT_VOCABULARY;
    setActiveLesson({ 
        id: 'writing-all-' + Date.now(), 
        title: 'Complete Writing Mastery',
        words: wordsToPractice
    });
  };

  const handlePracticeWriting = (word: SavedWord) => {
    setActiveLesson({ 
        id: 'writing-' + word.hanzi, 
        title: 'Writing Quiz: ' + word.hanzi,
        words: [word]
    });
  };

  if (!activeTutorId) return null;

  const currentTutor = tutors.find(t => t.id === activeTutorId);
  const showIntro = messages.length === 0;
  const displayWords = savedWords.length > 0 ? savedWords : DEFAULT_VOCABULARY;

  if (activeLesson) {
    return (
        <div className="fixed inset-0 z-[1001] bg-white dark:bg-black flex flex-col">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">{activeLesson.title}</h2>
                <button onClick={() => setActiveLesson(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <LessonEngine 
                    lessonId={activeLesson.id}
                    lessonTitle={activeLesson.title}
                    language={language}
                    onExit={() => setActiveLesson(null)}
                    onComplete={() => setActiveLesson(null)}
                    initialTaskType="HANDWRITING"
                    words={activeLesson.words}
                />
            </div>
        </div>
    );
  }

  if (activeMasteryIndex !== null) return <MasterySession words={displayWords} initialIndex={activeMasteryIndex} onClose={() => setActiveMasteryIndex(null)} language={language} />;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-black relative overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md z-50 shrink-0">
         <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button onClick={onMenuClick} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Menu size={24} /></button>
            <div className="flex items-center gap-3">
               <span className="text-2xl hidden xs:block">{currentTutor?.icon}</span>
               <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">{currentTutor?.name}</h2>
                  <div className="flex items-center gap-1">
                    {isAssessmentCompleted ? (
                      <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> Certified Level 1</span>
                    ) : (
                      <span className="text-[9px] text-orange-500 font-black uppercase tracking-widest animate-pulse">Entry Test Required</span>
                    )}
                    <span className="text-[9px] text-gray-400 hidden sm:inline">•</span>
                    <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1 hidden sm:inline"><Globe size={8} /> {currentTutor?.targetLanguage}</span>
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
                <span className="hidden md:inline uppercase tracking-widest">Reload</span>
            </button>

            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`p-2 rounded-lg transition-colors z-[60] ${isMoreMenuOpen ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <MoreVertical size={20} />
                </button>

                {isMoreMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/70 z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-1 space-y-0.5">
                            <button onClick={() => { onLanguageClick(); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Globe size={18} className="text-blue-500" /> Output Language
                            </button>
                            <button onClick={() => { onQuizClick?.(); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <span className="text-lg">📝</span> Attempt Quiz
                            </button>
                            <button onClick={() => { onDictionaryClick?.(); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <BookOpen size={18} className="text-teal-500" /> Dictionary
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                            <button onClick={() => { onShareClick?.(); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Share2 size={18} className="text-gray-400" /> Share Logs
                            </button>
                            <button onClick={() => { onConfigure(); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors">
                                <Settings size={18} className="text-gray-400" /> Configure
                            </button>
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>

      {!showIntro && (
        <div className="w-full bg-[#0277bd] flex items-center px-2 shrink-0 z-40 shadow-md">
            <button onClick={() => setActiveSubTab('chat')} className={`flex-1 py-3.5 text-center transition-all relative ${activeSubTab === 'chat' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}><span className="text-[11px] font-black uppercase tracking-[0.2em]">Assistant</span>{activeSubTab === 'chat' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-white rounded-t-full" />}</button>
            <button onClick={() => setActiveSubTab('practice')} className={`flex-1 py-3.5 text-center transition-all relative ${activeSubTab === 'practice' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}><span className="text-[11px] font-black uppercase tracking-[0.2em]">Vocabulary Practice</span>{activeSubTab === 'practice' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-white rounded-t-full" />}</button>
        </div>
      )}

      {activeSubTab === 'chat' ? (
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
                        // Fix: Using the correct 'onTranslate' prop instead of undefined 'handleTranslate'
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
                    <ChatInput onSend={onSendMessage} isLoading={loadingState !== 'idle'} onStartLive={onStartLive} value={inputValue} onInputChange={onInputChange} placeholder={`Chat with your personal ${currentTutor?.name}...`} language={language} />
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-black overflow-y-auto no-scrollbar pb-20">
            <div className="max-w-4xl mx-auto w-full px-6 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Vocabulary Practice</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{displayWords.length} Words Available</p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        {displayWords.length > 0 && (
                            <>
                                <button 
                                  onClick={handleStartWritingMastery} 
                                  className="animate-in slide-in-from-right duration-500 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <PenTool size={18} /> Master Writing Practice
                                </button>
                                <button 
                                  onClick={() => setActiveMasteryIndex(0)} 
                                  className="animate-in slide-in-from-right duration-700 flex items-center justify-center gap-2 px-6 py-3 bg-[#0277bd] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <PlayCircle size={18} /> Master All Flashcards
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayWords.map((word, idx) => (
                        <div key={idx} className="group bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-[#0277bd] hover:shadow-xl transition-all relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0277bd] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-black rounded-xl flex items-center justify-center text-2xl font-black text-[#0277bd]">{word.hanzi[0]}</div>
                                {savedWords.length > 0 && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSavedWords(prev => { 
                                                const updated = prev.filter(w => w.hanzi !== word.hanzi); 
                                                localStorage.setItem(storageKey, JSON.stringify(updated)); 
                                                return updated; 
                                            }); 
                                        }} 
                                        className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-2xl font-black dark:text-white mb-1">{word.hanzi}</h4>
                                <p className="text-[10px] text-[#0277bd] font-black uppercase tracking-widest mb-3">{word.pinyin}</p>
                                <div className="h-px bg-slate-50 dark:bg-slate-800 w-full mb-3" />
                                <p className="text-sm text-gray-500 font-bold leading-relaxed mb-4">{word.meaning}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <button 
                                    onClick={() => speak(word.hanzi)} 
                                    className="flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
                                    title="Listen to word"
                                >
                                    <Volume2 size={14} /> Read
                                </button>
                                <button 
                                    onClick={() => handlePracticeWriting(word)}
                                    className="flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
                                    title="Start writing practice"
                                >
                                    <PenTool size={14} /> Write
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {displayWords === DEFAULT_VOCABULARY && (
                    <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 text-center">
                        <Sparkles size={24} className="mx-auto mb-4 text-blue-500" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-2">Build Your Vault</h4>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/60 font-medium">As you chat with the assistant, new words will be saved here automatically for personalized practice sessions.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
