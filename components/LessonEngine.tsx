
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, Check, ArrowRight, RotateCcw, 
  PenTool, Trophy, ChevronRight, Play, Mic, MessageCircle, AlertCircle, Sparkles
} from 'lucide-react';

export interface Task {
  id: string;
  type: 'IMAGE_MCQ' | 'AUDIO_MCQ' | 'SENTENCE_BUILDER' | 'HANDWRITING' | 'VOICE_REPEAT' | 'FILL_BLANK' | 'INTERACTIVE_MCQ';
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
  tasks: Task[];
  onComplete: (score: number) => void;
  onExit: () => void;
  language: string;
}

export const LessonEngine: React.FC<LessonEngineProps> = ({ lessonTitle, tasks, onComplete, onExit, language }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  const currentTask = tasks && tasks.length > 0 ? tasks[currentIndex] : null;
  const progress = tasks && tasks.length > 0 ? ((currentIndex + 1) / tasks.length) * 100 : 0;

  const handleCheck = () => {
    if (!currentTask) return;
    const isCorrect = (selectedOption?.text || selectedOption) === currentTask.target;
    if (isCorrect) setScore(s => s + 1);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setFeedback(null);
      setIsRecording(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
      return (
          <div className="fixed inset-0 z-[2000] bg-blue-600 flex flex-col items-center justify-center p-8 animate-in zoom-in duration-500">
              <div className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-8"><Trophy size={64} className="text-orange-500" /></div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Assessment Results</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-12">Proficiency Level: Synchronized</p>
                  <div className="w-full space-y-4 mb-12">
                      <div className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl">
                          <span className="font-black text-gray-400 uppercase text-[10px]">Score</span>
                          <span className="font-black text-blue-600 text-lg">{score} / {tasks.length}</span>
                      </div>
                  </div>
                  <button onClick={() => onComplete(score)} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Continue to Hub</button>
              </div>
          </div>
      );
  }

  if (!currentTask) {
    return (
      <div className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mb-4">
          <AlertCircle className="text-orange-500" size={48} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Sync Error</h2>
        <p className="text-gray-500 max-w-xs mb-8">The neural curriculum for this module is currently empty or loading.</p>
        <button onClick={onExit} className="px-8 py-3 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest text-xs">Return to Workspace</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/5">
        <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1}/{tasks.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center max-w-4xl mx-auto w-full no-scrollbar">
        <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-blue-500" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">{currentTask.type.replace(/_/g, ' ')}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-12 tracking-tighter text-center leading-tight">{currentTask.question}</h2>

        <div className="grid grid-cols-1 gap-3 w-full max-w-lg">
            {currentTask.options?.map((opt, i) => (
                <button 
                    key={i}
                    onClick={() => { if(!feedback) setSelectedOption(opt); }}
                    className={`w-full text-left px-8 py-6 rounded-[1.8rem] border-2 transition-all active:scale-[0.98] flex items-center justify-between group ${selectedOption === opt ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-[#0a0a10] border-gray-100 dark:border-white/5 hover:border-blue-300'}`}
                >
                    <span className="text-lg font-bold">{opt.text || opt}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === opt ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-gray-700'}`}>{selectedOption === opt && <Check size={14} strokeWidth={4}/>}</div>
                </button>
            ))}
        </div>
      </div>

      <div className={`shrink-0 transition-all duration-500 p-6 ${feedback ? 'bg-gray-50 dark:bg-gray-900/50' : 'border-t border-gray-100 dark:border-white/5'}`}>
        {feedback ? (
          <div className="flex flex-col gap-6 max-w-lg mx-auto">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full text-white ${feedback === 'correct' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {feedback === 'correct' ? <Check size={32} strokeWidth={4} /> : <X size={32} strokeWidth={4} />}
              </div>
              <div>
                <h3 className={`text-xl font-black uppercase tracking-tight ${feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'}`}>{feedback === 'correct' ? 'Correct!' : 'Incorrect'}</h3>
                {feedback === 'incorrect' && <p className="text-sm text-gray-500 font-bold">Target: {currentTask.target}</p>}
              </div>
            </div>
            <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">Continue <ChevronRight size={24} /></button>
          </div>
        ) : (
          <button 
            onClick={handleCheck}
            disabled={!selectedOption}
            className="w-full max-w-lg mx-auto py-5 bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all block"
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  );
};
