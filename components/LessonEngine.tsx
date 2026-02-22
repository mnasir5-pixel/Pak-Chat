import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, Check, ArrowRight, RotateCcw, 
  PenTool, Trophy, ChevronRight, Play, Mic, MessageCircle, AlertCircle, PlayCircle
} from 'lucide-react';
import { SavedWord } from '../types';

interface Task {
  id: string;
  type: 'IMAGE_MCQ' | 'AUDIO_MCQ' | 'SENTENCE_BUILDER' | 'HANDWRITING' | 'VOICE_REPEAT' | 'FILL_BLANK';
  question: string;
  target?: string;
  pinyin?: string;
  translation?: string;
  audioUrl?: string;
  options?: any[];
  words?: string[];
  explanation?: string;
}

interface LessonEngineProps {
  lessonId: string;
  lessonTitle: string;
  onComplete: (score: number) => void;
  onExit: () => void;
  language: string;
  initialTaskType?: Task['type'];
  initialTarget?: string;
  initialPinyin?: string;
  initialTranslation?: string;
  words?: SavedWord[]; // Optional list of words for sequential practice
}

export const LessonEngine: React.FC<LessonEngineProps> = ({ 
  lessonTitle, 
  onComplete, 
  onExit, 
  language,
  initialTaskType,
  initialTarget,
  initialPinyin,
  initialTranslation,
  words
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Multi-character handwriting state
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [completedChars, setCompletedChars] = useState<Set<number>>(new Set());
  
  const strokeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const writersRef = useRef<any[]>([]);

  // Large boxes for high-precision stroke practice
  const BOX_SIZE = 240;

  useEffect(() => {
    if (words && words.length > 0) {
        const generatedTasks: Task[] = words.map((w, idx) => ({
            id: `word-${idx}`,
            type: initialTaskType || 'HANDWRITING',
            question: initialTaskType === 'HANDWRITING' ? 'Master the Strokes' : 'Analyze word',
            target: w.hanzi,
            pinyin: w.pinyin,
            translation: w.meaning
        }));
        setTasks(generatedTasks);
    } else if (initialTaskType && initialTarget) {
        setTasks([{
            id: 'single-q',
            type: initialTaskType,
            question: initialTaskType === 'HANDWRITING' ? 'Master the Strokes' : 'Analyze word',
            target: initialTarget,
            pinyin: initialPinyin,
            translation: initialTranslation
        }]);
    }
  }, [words, initialTaskType, initialTarget, initialPinyin, initialTranslation]);

  const currentTask = tasks[currentIndex];
  const progress = tasks.length > 0 ? ((currentIndex + 1) / tasks.length) * 100 : 0;

  // Cleanup and initialization on task (word) change
  useEffect(() => {
    if (currentTask?.type === 'HANDWRITING') {
        setCurrentCharIndex(0);
        setIsQuizActive(false);
        setCompletedChars(new Set());
        const t = setTimeout(() => initAllStrokes(), 400);
        return () => clearTimeout(t);
    }
  }, [currentIndex, currentTask?.id]);

  // Handle sequential quiz advancement automatically
  useEffect(() => {
    if (isQuizActive && writersRef.current[currentCharIndex]) {
        runQuizAt(currentCharIndex);
    }
  }, [currentCharIndex, isQuizActive]);

  const initAllStrokes = () => {
    const HanziWriter = (window as any).HanziWriter;
    if (!HanziWriter || !currentTask?.target) return;

    writersRef.current = [];
    
    Array.from(currentTask.target).forEach((char, idx) => {
        const el = strokeRefs.current[idx];
        if (el) {
            el.innerHTML = '';
            const writer = HanziWriter.create(el, char, {
                width: BOX_SIZE,
                height: BOX_SIZE,
                padding: 20,
                strokeColor: '#3B82F6',
                outlineColor: '#f1f5f9',
                showOutline: true,
                drawingColor: '#3B82F6',
                outlineAlpha: 0.3
            });
            writersRef.current[idx] = writer;
        }
    });
  };

  const playSequentialAnimations = async () => {
      if (isAnimating) return;
      setIsAnimating(true);
      for (let i = 0; i < (currentTask?.target?.length || 0); i++) {
          const writer = writersRef.current[i];
          if (writer) {
              setCurrentCharIndex(i); // Update UI focus
              await writer.animateCharacter();
              await new Promise(r => setTimeout(r, 400));
          }
      }
      setIsAnimating(false);
      // Start practice automatically after full animation?
      startWordQuiz();
  };

  const startWordQuiz = () => {
      if (isQuizActive || isWordFinished) return;
      setIsQuizActive(true);
      setCurrentCharIndex(0);
  };

  const runQuizAt = (idx: number) => {
    const writer = writersRef.current[idx];
    if (!writer) return;

    writer.cancelQuiz();
    writer.animateCharacter();

    writer.quiz({
        onCorrect: () => {
            setCompletedChars(prev => {
                const next = new Set(prev);
                next.add(idx);
                return next;
            });
            
            const nextIdx = idx + 1;
            if (nextIdx < (currentTask?.target?.length || 0)) {
                setTimeout(() => {
                    setCurrentCharIndex(nextIdx);
                }, 800);
            } else {
                setIsQuizActive(false);
                setScore(s => s + 1);
            }
        },
        onMistake: () => {
            console.debug(`Mistake at index ${idx}`);
        }
    });
  };

  const restartWordPractice = () => {
      writersRef.current.forEach(w => w?.cancelQuiz());
      setIsQuizActive(false);
      setCompletedChars(new Set());
      setCurrentCharIndex(0);
      initAllStrokes();
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
      setCompletedChars(new Set());
      setCurrentCharIndex(0);
      setIsQuizActive(false);
    } else {
      setIsFinished(true);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lowerLang = language.toLowerCase();
    if (lowerLang.includes('chinese') || /[\u4e00-\u9fa5]/.test(text)) {
        utterance.lang = 'zh-CN';
    } else {
        utterance.lang = 'en-US';
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  if (isFinished) {
      return (
          <div className="fixed inset-0 z-[1001] bg-blue-600 flex flex-col items-center justify-center p-8 animate-in zoom-in duration-500">
              <div className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-8">
                      <Trophy size={64} className="text-orange-500" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Mastery Unlocked</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-12">Performance: Superior</p>
                  <button onClick={() => onComplete(score)} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all active:scale-95">Finish Session</button>
              </div>
          </div>
      );
  }

  if (!currentTask) return null;

  const isWordFinished = currentTask.type === 'HANDWRITING' && completedChars.size === (currentTask.target?.length || 0);

  return (
    <div className="h-full bg-white dark:bg-black flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900">
        <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <X size={24} />
        </button>
        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 shadow-sm" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1}/{tasks.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        <h2 className="text-sm font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">{currentTask.question}</h2>
        
        <div className="flex items-center gap-6 mb-8">
            <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{currentTask.target}</div>
            <button 
                onClick={() => speak(currentTask.target || '')}
                className={`p-5 rounded-full transition-all active:scale-90 shadow-xl border-2 ${isSpeaking ? 'bg-blue-600 text-white border-blue-500 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                title="Read pronunciation"
            >
                <Volume2 size={28} />
            </button>
        </div>

        {currentTask.type === 'HANDWRITING' && (
          <div className="flex flex-col items-center w-full max-w-7xl">
             <div className="text-center mb-10">
                 <p className="text-3xl font-black text-blue-500 uppercase tracking-widest mb-2">{currentTask.pinyin}</p>
                 <p className="text-gray-400 font-bold italic text-xl">{currentTask.translation}</p>
             </div>
             
             {/* Sequential Handwriting Zones */}
             <div className="flex flex-wrap justify-center gap-10 mb-12">
                {Array.from(currentTask.target || '').map((char, idx) => {
                    const isActive = isQuizActive && currentCharIndex === idx;
                    const isDone = completedChars.has(idx);
                    const isPending = !isActive && !isDone;
                    
                    return (
                        <div key={idx} className="flex flex-col items-center gap-4 animate-in zoom-in duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                             <div className={`p-6 border-[6px] rounded-[3.5rem] transition-all duration-500 shadow-2xl relative ${
                                isActive 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-[12px] ring-blue-500/10 scale-110 z-10' 
                                    : isDone 
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                                        : 'border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-[#0d0d14] opacity-50'
                             }`}>
                                <div 
                                    ref={el => strokeRefs.current[idx] = el} 
                                    className={`transition-opacity duration-300 ${isPending ? 'opacity-20' : 'opacity-100'}`}
                                    style={{ width: `${BOX_SIZE}px`, height: `${BOX_SIZE}px` }} 
                                />
                                
                                {isDone && (
                                    <div className="absolute top-6 right-6 bg-emerald-500 text-white rounded-full p-2.5 shadow-2xl animate-in zoom-in duration-300">
                                        <Check size={28} strokeWidth={4} />
                                    </div>
                                )}

                                {!isActive && (
                                    <div className="absolute inset-0 z-20 cursor-not-allowed rounded-[3.5rem]" />
                                )}

                                <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-black" />
                                    <div className="absolute left-1/2 top-0 w-px h-full bg-black" />
                                    <div className="absolute top-0 left-0 w-full h-full border border-dashed border-black/10" />
                                </div>
                             </div>
                             <span className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isActive ? 'text-blue-500' : isDone ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {isDone ? 'Mastered' : isActive ? 'ACTIVE' : 'LOCKED'}
                             </span>
                        </div>
                    );
                })}
             </div>

             <div className="flex gap-6 mt-4">
                <button 
                  onClick={restartWordPractice} 
                  className="p-6 bg-gray-100 dark:bg-gray-800 rounded-[2rem] text-gray-500 hover:text-blue-600 transition-all active:scale-90 border border-transparent hover:border-blue-200 shadow-sm"
                  title="Reset word session"
                >
                  <RotateCcw size={28} />
                </button>
                <button 
                    onClick={playSequentialAnimations}
                    disabled={isAnimating || isWordFinished}
                    className="px-12 py-6 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900 text-blue-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 hover:shadow-xl transition-all active:scale-95"
                >
                    <PlayCircle size={28} /> {isAnimating ? 'Watching Strokes...' : 'Play Sequential Animation'}
                </button>
                <button 
                    onClick={startWordQuiz}
                    disabled={isQuizActive || isWordFinished || isAnimating}
                    className="px-24 py-6 bg-blue-600 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all"
                >
                    <PenTool size={28} /> {isQuizActive ? 'Tracing Strokes...' : isWordFinished ? 'Sequence Complete' : 'Begin Practice'}
                </button>
             </div>
          </div>
        )}

        {currentTask.type === 'IMAGE_MCQ' && (
          <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
            {currentTask.options?.map((opt, i) => (
              <button 
                key={i}
                onClick={() => { setSelectedOption(opt); speak(opt.text); }}
                className={`group p-6 bg-white dark:bg-gray-900 border-4 rounded-[2.5rem] transition-all active:scale-95 flex flex-col items-center gap-6 shadow-sm ${selectedOption?.text === opt.text ? 'border-blue-500 ring-8 ring-blue-500/10' : 'border-gray-100 dark:border-white/5 hover:border-blue-200'}`}
              >
                <div className="w-full aspect-square bg-gray-50 dark:bg-black rounded-3xl flex items-center justify-center overflow-hidden">
                   <img src={opt.img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                </div>
                <div className="text-center">
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">{opt.pinyin}</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{opt.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 p-8 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-50">
        <button 
          onClick={handleNext}
          disabled={(!selectedOption && currentTask.type !== 'HANDWRITING') || (currentTask.type === 'HANDWRITING' && !isWordFinished)}
          className="w-full py-7 bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-[2.2rem] font-black uppercase tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-lg"
        >
          {currentIndex < tasks.length - 1 ? 'Next Vocabulary Item' : 'Conclude Mastery'} <ChevronRight size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
