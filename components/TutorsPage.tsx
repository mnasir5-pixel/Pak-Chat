
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, Tutor, SavedWord } from '../types';
import { 
    Menu, GraduationCap, Sparkles, MoreVertical, Plus, BookOpen, Share2, 
    Settings, Globe, MessageCircle, PenTool, Layout, 
    CheckCircle2, XCircle, Volume2, ArrowRight, X, Trash2, PlayCircle, 
    ChevronLeft, ChevronRight, PencilLine, Headphones, HelpCircle, 
    AlertCircle, RotateCcw, Check, Trophy, Lock, Star, Flag, Target, ShieldCheck, Map, Activity,
    MessageSquare, RefreshCcw, RefreshCw, Book, Mic, StopCircle
} from 'lucide-react';
import { SimpleMarkdown } from './SimpleMarkdown';
import { ChatService } from '../services/geminiService';
import { LessonEngine } from './LessonEngine';
import { english_lessons, chinese_lessons, Lesson } from './lessonData';

const LessonCard: React.FC<{ 
    id: string; 
    title: string; 
    desc: string; 
    isLocked: boolean; 
    isCompleted: boolean;
    onOpen: (id: string, title: string) => void;
}> = ({ id, title, desc, isLocked, isCompleted, onOpen }) => (
    <button 
        disabled={isLocked}
        onClick={() => onOpen(id, title)}
        className={`w-full flex items-center gap-5 p-5 bg-white dark:bg-gray-900 border-2 rounded-[2rem] transition-all active:scale-[0.98] text-left relative overflow-hidden group ${isLocked ? 'opacity-50 border-gray-100 dark:border-white/5' : 'border-gray-50 dark:border-white/10 hover:border-orange-400 hover:shadow-xl'}`}
    >
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-sm ${isCompleted ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 dark:bg-black text-gray-300'}`}>
            {isCompleted ? <Star size={24} fill="currentColor" /> : <Book size={24} />}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-0.5">{title}</h4>
            <p className="text-xs text-gray-500 font-bold opacity-80 truncate">{desc}</p>
        </div>
        <div className="shrink-0">
            {isLocked ? <Lock size={18} className="text-gray-300" /> : isCompleted ? <RotateCcw size={18} className="text-orange-500" /> : <ChevronRight size={24} className="text-gray-200 group-hover:text-orange-500 transition-colors" />}
        </div>
    </button>
);

const RoadmapView: React.FC<{ 
  tutorId: string; 
  tutorName: string;
  language: string;
  onOpenLesson: (id: string, title: string) => void;
  completedLessons: string[];
}> = ({ tutorId, tutorName, language, onOpenLesson, completedLessons }) => {
  
  const languageContext = useMemo(() => {
    const lang = language.toLowerCase();
    if (lang.includes('chinese') || lang.includes('mandarin')) return 'Chinese';
    if (lang.includes('english')) return 'English';
    return 'Other';
  }, [language]);

  const lessons: Lesson[] = useMemo(() => {
    if (languageContext === 'English') return english_lessons;
    if (languageContext === 'Chinese') return chinese_lessons;
    return []; 
  }, [languageContext]);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#050508] animate-in fade-in duration-700 no-scrollbar pb-32">
      <div className="max-w-xl mx-auto pt-8 px-6">
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 opacity-60">
                 <Sparkles size={14} className="text-orange-500" />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em]">Curriculum Path</span>
              </div>
              
              {lessons.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <AlertCircle size={48} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No interactive path defined for {language}</p>
                </div>
              ) : lessons.map((step, idx) => (
                  <LessonCard 
                    key={step.id} 
                    id={step.id} 
                    title={step.label} 
                    desc={step.desc} 
                    isCompleted={completedLessons.includes(step.id)}
                    isLocked={idx > 0 && !completedLessons.includes(lessons[idx-1].id)}
                    onOpen={onOpenLesson}
                  />
              ))}
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
  onSendMessage: (content: string, attachment?: File) => void;
  onStop?: () => void;
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
  onStartTest: () => void;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  isLiveActive?: boolean;
  savedWords: SavedWord[];
  onSaveWord: (word: SavedWord) => void;
  onRemoveWord: (hanzi: string) => void;
}

const VocabularyView: React.FC<{ 
    words: SavedWord[]; 
    onRemove: (hanzi: string) => void;
    onPractice: (word: SavedWord) => void;
}> = ({ words, onRemove, onPractice }) => {
    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#050508] animate-in fade-in duration-700 no-scrollbar pb-32">
            <div className="max-w-xl mx-auto pt-8 px-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 opacity-60">
                        <BookOpen size={14} className="text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Personal Lexicon</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full uppercase tracking-widest">{words.length} Words</span>
                </div>

                {words.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <Book size={48} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Your vocabulary is empty. Save words from chat to build your lexicon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {words.map((word) => (
                            <div key={word.hanzi} className="group p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[2rem] hover:border-blue-400 transition-all shadow-sm hover:shadow-xl flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{word.hanzi}</h4>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{word.pinyin}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold opacity-80">{word.meaning}</p>
                                    {word.urdu_meaning && <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-tighter">{word.urdu_meaning}</p>}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onPractice(word)} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><PlayCircle size={18} /></button>
                                    <button onClick={() => onRemove(word.hanzi)} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TutorsPage: React.FC<TutorsPageProps> = ({
  messages, loadingState, activeTutorId, tutors, onSendMessage, onStop, onBack, onStartLive, language, onRegenerate, onEdit, onConfigure, onMenuClick, inputValue, onInputChange, onNewSession, onDictionaryClick, onLanguageClick, onQuizClick, onShareClick, onStartTest, isAssessmentCompleted,
  onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare, isLiveActive, savedWords, onSaveWord, onRemoveWord
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'app'>('chat');
  const [activeLessonState, setActiveLessonState] = useState<{ id: string; title: string } | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [practicingWord, setPracticingWord] = useState<SavedWord | null>(null);

  const progressKey = `pakchat_progress_lessons_${activeTutorId || 'default'}`;

  useEffect(() => {
    try {
        const progress = localStorage.getItem(progressKey);
        setCompletedLessons(progress ? JSON.parse(progress) : []);
        setXp(parseInt(localStorage.getItem('pakchat_xp') || '0'));
    } catch { setCompletedLessons([]); }
  }, [activeTutorId]);

  if (!activeTutorId) return null;

  const currentTutor = tutors.find(t => t.id === activeTutorId);
  const targetLanguage = currentTutor?.targetLanguage || language;

  const lessonsPool: Lesson[] = useMemo(() => {
      const lang = targetLanguage.toLowerCase();
      if (lang.includes('chinese') || lang.includes('mandarin')) return chinese_lessons;
      if (lang.includes('english')) return english_lessons;
      return [];
  }, [targetLanguage]);

  if (activeLessonState) {
    const lessonData = lessonsPool.find(l => l.id === activeLessonState.id);
    return (
        <LessonEngine 
            lessonId={activeLessonState.id} 
            lessonTitle={activeLessonState.title} 
            language={targetLanguage}
            tasks={lessonData?.tasks || []} 
            onExit={() => setActiveLessonState(null)}
            onComplete={(finalScore) => {
                const updated = [...new Set([...completedLessons, activeLessonState.id])];
                setCompletedLessons(updated);
                localStorage.setItem(progressKey, JSON.stringify(updated));
                const newXp = xp + finalScore * 10;
                setXp(newXp);
                localStorage.setItem('pakchat_xp', newXp.toString());
                setActiveLessonState(null);
            }}
        />
    );
  }

  if (practicingWord) {
      return (
          <div className="fixed inset-0 z-[1000] bg-white dark:bg-black flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300">
              <button onClick={() => setPracticingWord(null)} className="absolute top-8 right-8 p-3 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
              <div className="w-full max-w-md text-center">
                  <div className="mb-12">
                      <h2 className="text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">{practicingWord.hanzi}</h2>
                      <p className="text-xl font-bold text-blue-600 uppercase tracking-widest">{practicingWord.pinyin}</p>
                  </div>
                  <div className="p-10 bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-gray-100 dark:border-white/10 mb-12">
                      <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{practicingWord.meaning}</p>
                      {practicingWord.urdu_meaning && <p className="text-sm text-blue-500 font-black mt-4 uppercase tracking-tighter">{practicingWord.urdu_meaning}</p>}
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => onReadAloud?.(practicingWord.hanzi)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><Volume2 size={18} /> Listen</button>
                      <button onClick={() => setPracticingWord(null)} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Next Word</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-black relative overflow-hidden">
      <div className="w-full bg-[#0277bd] flex items-center px-2 shrink-0 z-40 shadow-lg">
          <button onClick={() => setActiveSubTab('chat')} className={`flex-1 py-3 text-center transition-all relative ${activeSubTab === 'chat' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}><span className="text-[10px] font-black uppercase tracking-[0.2em]">Assistant</span>{activeSubTab === 'chat' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-white rounded-t-full" />}</button>
          <button onClick={() => setActiveSubTab('app')} className={`flex-1 py-3 text-center transition-all relative ${activeSubTab === 'app' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}><span className="text-[10px] font-black uppercase tracking-[0.2em]">Vocabulary</span>{activeSubTab === 'app' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-white rounded-t-full" />}</button>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeSubTab === 'app' ? (
          <VocabularyView 
              words={savedWords}
              onRemove={onRemoveWord}
              onPractice={(w) => setPracticingWord(w)}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-hidden relative">
                  <div className="max-w-4xl mx-auto h-full">
                      <MessageList 
                          messages={messages} 
                          loadingState={loadingState} 
                          onEdit={onEdit || (() => {})} 
                          onRegenerate={onRegenerate}
                          onReply={(text) => onSendMessage(text)}
                          language={targetLanguage} 
                          onTranslate={onTranslate}
                          onReadAloud={onReadAloud}
                          onAudioOverview={onAudioOverview}
                          onMindMap={onMindMap}
                          onShare={onShare}
                          isTutorContext={true}
                          onSaveWord={onSaveWord}
                      />
                  </div>
              </div>
              
              {!isAssessmentCompleted ? (
                <div className="absolute inset-0 z-[100] bg-white/95 dark:bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
                   <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-[2.5rem] mb-6 shadow-xl border border-orange-100 dark:border-orange-800">
                      <Target size={48} className="text-orange-500" />
                   </div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900 dark:text-white">Proficiency Check</h2>
                   <p className="max-w-xs text-sm text-gray-500 font-medium mb-10 italic">Your instructional agent requires an initial assessment to calibrate your path.</p>
                   <button onClick={onStartTest} className="px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all flex items-center gap-2"><Sparkles size={16} /> Begin Entry Test</button>
                </div>
              ) : (
                <div className="p-4 shrink-0 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5">
                    <div className="max-w-4xl mx-auto">
                        <ChatInput 
                            onSend={onSendMessage}
                            onStop={onStop}
                            isLoading={loadingState !== 'idle'} 
                            onStartLive={onStartLive} 
                            value={inputValue} 
                            onInputChange={onInputChange} 
                            placeholder={`Communicate with ${currentTutor?.name}...`} 
                            language={targetLanguage} 
                            isLiveActive={isLiveActive}
                        />
                    </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
