
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, LoadingState, Asset, ChatConfig, Source, ChatSession } from '../types';
import { ChatService } from '../services/geminiService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ActionModal } from './ActionModal';
import { ConfigureChatModal } from './ConfigureChatModal';
import { 
  X, Plus, FileText, Menu, BrainCircuit, Lightbulb, 
  BookOpen, Video, Mic, FileQuestion, GraduationCap, 
  Layout, Presentation, ListChecks, Search, Sparkles,
  Loader2, MoreVertical, Download, Edit2, Trash2, CheckCircle2,
  Settings2, ChevronLeft, ChevronRight, DownloadCloud, FileOutput,
  Maximize2, RotateCcw, ArrowLeft, Layers, Play, Minimize2,
  Move, Hand, MousePointer2, ZoomIn, ZoomOut, RefreshCcw, ChevronDown,
  ExternalLink, Info, FileSearch, Printer, ZoomInIcon, ZoomOutIcon,
  ImageIcon as ImageIcon, DownloadIcon as DownloadIcon, Upload, Globe, Youtube, ClipboardList,
  FileCode, Music, FileImage, File, Pause, Volume2, Check, AlertCircle, RefreshCw,
  MonitorPlay, SlidersHorizontal, Zap, FileVideo
} from 'lucide-react';
import { LiveSessionOverlay } from './LiveSessionOverlay';

// Industry-standard document generation libraries
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import pptxgen from 'pptxgenjs';
import saveAs from 'file-saver';

interface NasherNotesPageProps {
  language: string;
  session: ChatSession;
  onUpdateSession: (id: string, updates: Partial<ChatSession>) => void;
  onBack: () => void;
  onStartLive: () => void;
  onNavigateToGeneralChat?: () => void;
}

const getBaseSystemPrompt = (language: string) => `You are "NotesLM Assistant". 
Respond strictly based on PROVIDED AND SELECTED sources. Provide comprehensive, analytical answers. 
You are multimodal and can discuss images, videos, audio, and documents.

IMPORTANT: You MUST respond strictly in the user's preferred output language: ${language}.

At the end of EVERY reply, you MUST provide 3 follow-up hints (questions the user might ask next) using this EXACT format:
### HINTS:
- Hint 1
- Hint 2
- Hint 3`;

const stripMarkdown = (text: string) => {
  return text
    .replace(/[*#$~`]+/g, '')
    .trim();
};

const ExportFormatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (format: string) => void;
  formats: { id: string; label: string; icon: any }[];
}> = ({ isOpen, onClose, onSelect, formats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101018] rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-t sm:border border-white/10 overflow-hidden relative animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Export Format</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => onSelect(format.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 hover:border-blue-500 hover:bg-blue-50/10 transition-all group"
            >
              <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm">
                <format.icon size={20} />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-500">{format.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuizViewer: React.FC<{ asset: Asset; onExit: () => void; onRegenerate: () => void }> = ({ asset, onExit, onRegenerate }) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        try {
            const data = JSON.parse(asset.content || '[]');
            setQuestions(Array.isArray(data) ? data : []);
        } catch (e) {
            setQuestions([]);
        }
    }, [asset.content]);

    const handleAnswer = (index: number) => {
        if (showResult) return;
        setSelectedAnswer(index);
        setShowResult(true);
        if (index === questions[currentIndex].answer) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        setSelectedAnswer(null);
        setShowResult(false);
        setCurrentIndex(prev => prev + 1);
    };

    if (questions.length === 0) return <div className="h-full w-full bg-[#050508] flex items-center justify-center text-gray-500">Error loading quiz data.</div>;

    const isLast = currentIndex === questions.length - 1;
    const q = questions[currentIndex];

    // Safety guard for missing question object
    if (!q) return null;

    return (
        <div className="h-full w-full bg-[#f8fafc] dark:bg-[#050508] flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
                 <button onClick={onExit} className="p-3 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all shadow-sm"><ArrowLeft size={24}/></button>
                 <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Knowledge Diagnostic</span>
            </div>
            
            <button onClick={onRegenerate} className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                <RefreshCw size={14} /> <span className="hidden sm:inline">Regenerate Quiz</span>
            </button>

            <div className="w-full max-w-2xl">
                <div className="mb-8 sm:mb-12 flex items-center justify-between">
                    <div className="flex gap-1 sm:gap-2 flex-1 mr-4">
                        {questions.map((_, i) => (
                            <div key={i} className={`h-1 sm:h-1.5 flex-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-blue-600' : i < currentIndex ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                        ))}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">Q {currentIndex + 1} / {questions.length}</span>
                </div>

                <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-2xl animate-in slide-in-from-bottom-4">
                    <h3 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-8 sm:mb-12 tracking-tight">
                        {stripMarkdown(q.question)}
                    </h3>

                    <div className="space-y-3 sm:space-y-4">
                        {q.options.map((opt: string, i: number) => {
                            const isCorrect = i === q.answer;
                            const isSelected = i === selectedAnswer;
                            let stateClass = "border-gray-100 dark:border-white/5 hover:border-blue-500 bg-white dark:bg-black";
                            
                            if (showResult) {
                                if (isCorrect) stateClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20";
                                else if (isSelected) stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-2 ring-red-500/20";
                                else stateClass = "opacity-40 grayscale border-gray-100 dark:border-white/5 bg-white dark:bg-black";
                            }

                            return (
                                <button 
                                    key={i}
                                    disabled={showResult}
                                    onClick={() => handleAnswer(i)}
                                    className={`w-full text-left px-5 sm:px-8 py-4 sm:py-6 rounded-[1.2rem] sm:rounded-[1.8rem] border-2 transition-all flex items-center justify-between group active:scale-[0.98] ${stateClass}`}
                                >
                                    <span className="text-sm sm:text-lg font-bold">{stripMarkdown(opt)}</span>
                                    {showResult && isCorrect && <Check size={18} className="text-emerald-500" strokeWidth={3} />}
                                    {showResult && isSelected && !isCorrect && <X size={18} className="text-red-500" strokeWidth={3} />}
                                </button>
                            );
                        })}
                    </div>

                    {showResult && (
                        <div className="mt-8 sm:mt-12 flex justify-end animate-in fade-in zoom-in duration-300">
                            {!isLast ? (
                                <button onClick={nextQuestion} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-[0.98] transition-all">
                                    Next Question <ChevronRight size={20} />
                                </button>
                            ) : (
                                <div className="text-center w-full">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-4">Quiz Completed</p>
                                    <h4 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6 sm:mb-8">Score: {score} / {questions.length}</h4>
                                    <button onClick={onExit} className="w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-[0.98] transition-all">Exit Review</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SlidesViewer: React.FC<{ asset: Asset; onExit: () => void }> = ({ asset, onExit }) => {
    const [slides, setSlides] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        try {
            const data = JSON.parse(asset.content || '[]');
            setSlides(Array.isArray(data) ? data : []);
        } catch (e) { setSlides([]); }
    }, [asset.content]);

    const next = () => setCurrentIndex(p => Math.min(p + 1, slides.length - 1));
    const prev = () => setCurrentIndex(p => Math.max(p - 1, 0));

    if (slides.length === 0) return null;

    const currentSlide = slides[currentIndex];
    const layoutType = currentIndex % 3; 

    return (
        <div className="h-full w-full bg-[#f1f3f4] dark:bg-[#050508] flex flex-col relative overflow-hidden animate-in fade-in duration-700">
            <div className="h-14 sm:h-16 px-4 sm:px-6 bg-white dark:bg-[#0d0d14] border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={onExit} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ArrowLeft size={20} /></button>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Presentation size={18} className="text-blue-600" />
                        <h2 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{asset.name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)} 
                        className="hidden sm:block p-2 text-gray-400 hover:text-blue-600 transition-all rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        {isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                    </button>
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1} / {slides.length}</span>
                    <button onClick={onExit} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-8 md:p-12 relative overflow-hidden">
                <div className={`w-full transition-all duration-500 ease-out shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col relative overflow-hidden bg-white dark:bg-[#101018] ${isFullscreen ? 'max-w-full h-full p-6 sm:p-16' : 'max-w-[100%] md:max-w-[85%] lg:max-w-[70%] max-h-[calc(100%-80px)] aspect-video p-4 sm:p-10 md:p-12'}`}>
                    <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gray-50 dark:bg-white/5">
                        <div className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} />
                    </div>

                    <div className={`flex-1 flex flex-col ${layoutType === 2 ? 'items-center text-center justify-center' : 'justify-center'} animate-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar pr-1`}>
                        {layoutType === 1 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-12 items-center min-h-0">
                                <div className="space-y-2 sm:space-y-4 text-center md:text-left">
                                    <h3 className="text-xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                                        {stripMarkdown(currentSlide.title)}
                                    </h3>
                                    <div className="h-1 w-16 sm:h-1.5 sm:w-24 bg-blue-600 rounded-full mx-auto md:mx-0" />
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    {currentSlide.points.map((pt: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2 sm:gap-3 bg-gray-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all shadow-sm">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 mt-1.5 sm:mt-2 shrink-0" />
                                            <p className="text-xs sm:text-base lg:text-lg text-gray-700 dark:text-gray-200 font-bold leading-relaxed">{stripMarkdown(pt)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : layoutType === 2 ? (
                            <div className="max-w-4xl mx-auto py-2 sm:py-4">
                                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-blue-600 text-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-500/20 inline-block animate-bounce">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-2xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 sm:mb-8 leading-tight">
                                    {stripMarkdown(currentSlide.title)}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                                    {currentSlide.points.map((pt: string, i: number) => (
                                        <div key={i} className="p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 flex items-center justify-center">
                                            <p className="text-xs sm:text-lg lg:text-xl text-gray-700 dark:text-gray-200 font-black leading-tight uppercase tracking-tight">{stripMarkdown(pt)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 sm:space-y-10">
                                <h3 className="text-2xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                                    {stripMarkdown(currentSlide.title)}
                                </h3>
                                <div className="space-y-2 sm:space-y-6">
                                    {currentSlide.points.map((pt: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3 sm:gap-6 animate-in slide-in-from-left duration-300">
                                            <div className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-600 mt-1.5 sm:mt-3 shrink-0 shadow-lg shadow-blue-600/30" />
                                            <p className="text-sm sm:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 font-bold leading-relaxed">{stripMarkdown(pt)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-50 dark:border-white/5 flex justify-between items-center text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-0.5 sm:w-4 sm:h-0.5 bg-blue-600 rounded-full" />
                            <span>Pak Chat Studio</span>
                        </div>
                        <span className="hidden xs:inline">Synthesis Module 3.1</span>
                    </div>
                </div>

                <div className="mt-4 sm:mt-10 flex items-center gap-3 sm:gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-2xl p-1.5 sm:p-2 rounded-full border border-gray-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-700 z-50">
                    <button 
                        onClick={prev} 
                        disabled={currentIndex === 0} 
                        className="p-2 sm:p-4 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-white rounded-full transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm active:scale-[0.9] overflow-hidden"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    
                    <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-gray-100 dark:bg-white/5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 sm:gap-3">
                        <span className="text-blue-600">{currentIndex + 1}</span>
                        <span className="opacity-20">/</span>
                        <span>{slides.length}</span>
                    </div>

                    <button 
                        onClick={next} 
                        disabled={currentIndex === slides.length - 1} 
                        className="p-2 sm:p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all disabled:opacity-20 disabled:pointer-events-none shadow-xl shadow-blue-500/30 active:scale-[0.9] overflow-hidden"
                    >
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const AudioOverviewViewer: React.FC<{ asset: Asset; onExit: () => void; onDownload: () => void }> = ({ asset, onExit, onDownload }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const bufferRef = useRef<AudioBuffer | null>(null);

    const decodeBase64 = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodeRawPCM = async (data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    };

    useEffect(() => {
        if (asset.content) {
            const initAudio = async () => {
                const ctx = new (window.AudioContext || (window as any).AudioContext)({ sampleRate: 24000 });
                audioCtxRef.current = ctx;
                const bytes = decodeBase64(asset.content!);
                const buffer = await decodeRawPCM(bytes, ctx, 24000);
                bufferRef.current = buffer;
            };
            initAudio();
        }
        return () => {
            sourceNodeRef.current?.stop();
            audioCtxRef.current?.close();
        };
    }, [asset.content]);

    useEffect(() => {
        let interval: number;
        if (isPlaying && audioCtxRef.current && bufferRef.current) {
            interval = window.setInterval(() => {
                const elapsed = audioCtxRef.current!.currentTime - startTimeRef.current;
                const p = (elapsed / bufferRef.current!.duration) * 100;
                if (p >= 100) {
                    setIsPlaying(false);
                    setProgress(100);
                    clearInterval(interval);
                } else {
                    setProgress(p);
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!audioCtxRef.current || !bufferRef.current) return;

        if (isPlaying) {
            sourceNodeRef.current?.stop();
            pauseTimeRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
            setIsPlaying(false);
        } else {
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = bufferRef.current;
            source.connect(audioCtxRef.current.destination);
            
            const offset = pauseTimeRef.current % bufferRef.current.duration;
            startTimeRef.current = audioCtxRef.current.currentTime - offset;
            source.start(0, offset);
            sourceNodeRef.current = source;
            setIsPlaying(true);
        }
    };

    return (
        <div className="h-full w-full bg-[#050508] flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-700">
            <button onClick={onExit} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"><X size={24}/></button>
            
            <div className="w-full max-w-2xl bg-[#101018] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <div className="mb-6 sm:mb-10 flex justify-center">
                    <div className={`p-6 sm:p-8 rounded-full transition-all duration-500 ${isPlaying ? 'bg-teal-500 text-black scale-110 shadow-[0_0_50px_rgba(20,184,166,0.3)]' : 'bg-white/5 text-teal-500'}`}>
                        <Volume2 size={32} className="sm:w-12 sm:h-12" />
                    </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-2">{asset.name}</h2>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-8 sm:mb-12">Synthesized Narration • {asset.config?.language || 'English'}</p>

                <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <button 
                        onClick={togglePlay}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-[0.95] transition-all shadow-xl"
                    >
                        {isPlaying ? <Pause size={24} className="sm:w-8 sm:h-8" fill="currentColor" /> : <Play size={24} className="sm:w-8 sm:h-8 ml-1" fill="currentColor" />}
                    </button>
                    
                    <button onClick={onDownload} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <Download size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Export Audio</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const VideoOverviewViewer: React.FC<{ asset: Asset; onExit: () => void; onDownload: () => void }> = ({ asset, onExit, onDownload }) => {
  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-700">
       <button onClick={onExit} className="absolute top-4 left-4 sm:top-8 sm:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50"><ArrowLeft size={24}/></button>
       <div className="w-full max-w-5xl aspect-video bg-[#101018] rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative group">
          <video src={asset.content} className="w-full h-full object-contain" controls autoPlay />
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
             <button onClick={onDownload} className="p-3 sm:p-4 bg-blue-600 text-white rounded-full shadow-xl hover:scale-110 active:scale-[0.95] transition-all"><Download size={20}/></button>
          </div>
       </div>
       <div className="mt-6 sm:mt-10 text-center">
          <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter mb-2">{asset.name}</h2>
          <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em]">Cinematic Context Overview • MP4 720p</p>
       </div>
    </div>
  );
};

const FlashcardDeck: React.FC<{ content: string; onClose: () => void }> = ({ content, onClose }) => {
  const [cards, setCards] = useState<{ front: string; back: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const lines = content.split('\n').filter(l => l.includes(':') || l.includes('?'));
    const parsed = [];
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i+1]) {
        parsed.push({ 
          front: stripMarkdown(lines[i].replace(/^[*-]\s*|Front:\s*/gi, '')), 
          back: stripMarkdown(lines[i+1].replace(/^[*-]\s*|Back:\s*/gi, '')) 
        });
      }
    }
    if (parsed.length === 0) {
        setCards([{ front: "Extracting knowledge...", back: stripMarkdown(content) }]);
    } else {
        setCards(parsed);
    }
  }, [content]);

  const next = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev + 1) % cards.length); };
  const prev = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length); };

  if (cards.length === 0) return <div className="flex items-center justify-center h-full bg-[#050508]"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#050508] p-4 sm:p-10 animate-in fade-in duration-500">
      <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"><X size={24}/></button>
      <div className="max-w-2xl w-full h-[320px] sm:h-[400px] relative group perspective-1000">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full relative transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          <div className="absolute inset-0 bg-[#101018] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center p-6 sm:p-10 text-center backface-hidden shadow-2xl">
             <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-4 sm:mb-6">Question</span>
             <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight">{cards[currentIndex].front}</h3>
             <div className="mt-8 sm:mt-12 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Tap to see answer</div>
          </div>
          <div className="absolute inset-0 bg-[#101018] border border-blue-500/30 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center p-6 sm:p-10 text-center backface-hidden rotate-y-180 shadow-2xl">
             <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] mb-4 sm:mb-6">Answer</span>
             <p className="text-base sm:text-xl font-medium text-gray-200">{cards[currentIndex].back}</p>
             <div className="mt-8 sm:mt-12 text-gray-500 text-[9px] font-black uppercase tracking-widest">Tap to flip back</div>
          </div>
        </div>
        <div className="absolute top-1/2 -left-4 sm:-left-20 -translate-y-1/2">
           <button onClick={prev} className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-[0.8]"><ChevronLeft size={24} className="sm:w-8 sm:h-8" /></button>
        </div>
        <div className="absolute top-1/2 -right-4 sm:-right-20 -translate-y-1/2">
           <button onClick={next} className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-[0.8]"><ChevronRight size={24} className="sm:w-8 sm:h-8" /></button>
        </div>
      </div>
      <div className="mt-8 sm:mt-12 flex items-center gap-6">
        <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{currentIndex + 1} / {cards.length} CARDS</span>
      </div>
    </div>
  );
};

interface MindMapNode {
  id: string;
  label: string;
  level: number;
  parentId: string | null;
  expanded: boolean;
  x: number;
  y: number;
  children: string[];
}

interface MindMapCanvasProps {
    content: string;
    onExit: () => void;
    onNodeClick: (label: string) => void;
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ content, onExit, onNodeClick }) => {
    const [nodes, setNodes] = useState<Record<string, MindMapNode>>({});
    const [viewState, setViewState] = useState({ x: 50, y: 150, scale: 0.6 });
    const [interactionMode, setInteractionMode] = useState<'move' | 'pan'>('pan');
    const containerRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef<{ type: 'canvas' | 'node'; id?: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 50;
    const HORIZONTAL_SPACING = 80;
    const VERTICAL_SPACING = 30;

    useEffect(() => {
        const mainContent = content.split(/### HINTS:|HINTS:/i)[0];
        const lines = mainContent.split('\n').filter(l => {
            const trim = l.trim();
            return trim.length > 0 && !trim.startsWith('###') && !trim.startsWith('- Hint');
        });
        
        if (lines.length === 0) return;

        const newNodes: Record<string, MindMapNode> = {};
        const stack: { id: string; level: number }[] = [];
        
        lines.forEach((line, idx) => {
            const indent = line.search(/\S/);
            const label = stripMarkdown(line.trim().replace(/^[#*-]\s*/, ''));
            const level = Math.floor(indent / 2);
            const id = `node-${idx}`;

            while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop();
            const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

            newNodes[id] = { id, label, level, parentId, expanded: level === 0, x: 0, y: 0, children: [] };
            if (parentId) newNodes[parentId].children.push(id);
            stack.push({ id, level });
        });

        calculateDynamicLayout(newNodes);
    }, [content]);

    const calculateDynamicLayout = (targetNodes: Record<string, MindMapNode>) => {
        const tempNodes = { ...targetNodes };
        const roots = (Object.values(tempNodes) as MindMapNode[]).filter(n => n.parentId === null);
        let currentY = 0;

        const layoutSubtree = (nodeId: string, depth: number) => {
            const node = tempNodes[nodeId];
            node.x = depth * (NODE_WIDTH + HORIZONTAL_SPACING);
            
            if (!node.expanded || node.children.length === 0) {
                node.y = currentY;
                currentY += NODE_HEIGHT + VERTICAL_SPACING;
                return;
            }

            const startY = currentY;
            node.children.forEach(childId => layoutSubtree(childId, depth + 1));
            
            const firstChild = tempNodes[node.children[0]];
            const lastChild = tempNodes[node.children[node.children.length - 1]];
            node.y = (firstChild.y + lastChild.y) / 2;
        };

        roots.forEach(root => layoutSubtree(root.id, 0));
        setNodes(tempNodes);
    };

    const handleAutoFit = () => {
        const nodeValues = Object.values(nodes) as MindMapNode[];
        if (nodeValues.length === 0 || !containerRef.current) return;
        const visibleNodes = nodeValues.filter(n => {
            let p = n.parentId;
            while(p) { if (!nodes[p].expanded) return false; p = nodes[p].parentId; }
            return true;
        });
        const minX = Math.min(...visibleNodes.map(n => n.x));
        const maxX = Math.max(...visibleNodes.map(n => n.x + NODE_WIDTH));
        const minY = Math.min(...visibleNodes.map(n => n.y));
        const maxY = Math.max(...visibleNodes.map(n => n.y + NODE_HEIGHT));
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scale = Math.min((containerWidth * 0.7) / contentWidth, (containerHeight * 0.7) / contentHeight, 0.8);
        setViewState({ x: 50, y: (containerHeight / 2) - ((minY + contentHeight / 2) * scale), scale: scale });
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = Math.pow(1.1, -e.deltaY / 150);
        const newScale = Math.max(0.1, Math.min(viewState.scale * zoomFactor, 2));
        const dx = (mouseX - viewState.x) / viewState.scale;
        const dy = (mouseY - viewState.y) / viewState.scale;
        setViewState({ x: mouseX - dx * newScale, y: mouseY - dy * newScale, scale: newScale });
    }, [viewState]);

    const handlePointerDown = (e: React.PointerEvent, id?: string) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        target.setPointerCapture(e.pointerId);
        if (id && interactionMode === 'move') { dragInfo.current = { type: 'node', id, startX: e.clientX, startY: e.clientY, initX: nodes[id].x, initY: nodes[id].y }; }
        else { dragInfo.current = { type: 'canvas', startX: e.clientX, startY: e.clientY, initX: viewState.x, initY: viewState.y }; }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const info = dragInfo.current;
        if (!info) return;
        const dx = (e.clientX - info.startX) / viewState.scale;
        const dy = (e.clientY - info.startY) / viewState.scale;
        if (info.type === 'canvas' || interactionMode === 'pan') { setViewState(prev => ({ ...prev, x: info.initX + (e.clientX - info.startX), y: info.initY + (e.clientY - info.startY) })); }
        else if (info.type === 'node' && info.id) {
            const nodeId = info.id;
            setNodes(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], x: info.initX + dx, y: info.initY + dy } }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => { if (dragInfo.current) { (e.target as HTMLElement).releasePointerCapture(e.pointerId); dragInfo.current = null; } };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newNodes = { ...nodes };
        newNodes[id].expanded = !newNodes[id].expanded;
        calculateDynamicLayout(newNodes);
    };

    const renderEdges = useMemo(() => {
        return (Object.values(nodes) as MindMapNode[]).map(node => {
            if (!node.parentId || !nodes[node.parentId].expanded) return null;
            const parent = nodes[node.parentId];
            const x1 = parent.x + NODE_WIDTH; 
            const y1 = parent.y + (NODE_HEIGHT / 2);
            const x2 = node.x;
            const y2 = node.y + (NODE_HEIGHT / 2);
            const midX = x1 + (x2 - x1) / 2;
            return <path key={`${node.id}-edge`} d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`} fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="2" className="animate-in fade-in duration-500" />;
        });
    }, [nodes]);

    return (
        <div className="h-full w-full bg-[#f8fafc] dark:bg-[#050508] flex flex-col relative overflow-hidden select-none">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-[100] pointer-events-none">
                <div className="pointer-events-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-1 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex items-center gap-1">
                   <div className="p-2 sm:p-3 bg-indigo-600 text-white rounded-full shadow-lg mr-2 sm:mr-4"><BrainCircuit size={18} className="sm:w-5 sm:h-5"/></div>
                   <div className="pr-4 sm:pr-10 hidden xs:block">
                      <h2 className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-0.5">Knowledge Tree</h2>
                   </div>
                   <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                   <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-full">
                        <button onClick={() => setInteractionMode('move')} className={`p-2 rounded-full transition-all ${interactionMode === 'move' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}><MousePointer2 size={16} /></button>
                        <button onClick={() => setInteractionMode('pan')} className={`p-2 rounded-full transition-all ${interactionMode === 'pan' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}><Hand size={16} /></button>
                   </div>
                   <button onClick={handleAutoFit} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Fit to Screen"><RefreshCcw size={16}/></button>
                </div>
                <div className="pointer-events-auto flex gap-2">
                    <button onClick={onExit} className="flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.95] overflow-hidden"><X size={16}/> <span className="hidden sm:inline">Close</span></button>
                </div>
            </div>

            <div ref={containerRef} className={`flex-1 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:40px_40px] cursor-${interactionMode === 'pan' ? 'grab' : 'default'}`} onWheel={handleWheel} onPointerDown={(e) => handlePointerDown(e)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                <div className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out" style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})` }}>
                    <svg className="absolute top-0 left-0 w-[20000px] h-[20000px] pointer-events-none overflow-visible">{renderEdges}</svg>
                    {(Object.values(nodes) as MindMapNode[]).map(node => {
                        let p = node.parentId;
                        let visible = true;
                        while(p) { if (!nodes[p].expanded) { visible = false; break; } p = nodes[p].parentId; }
                        if (!visible) return null;
                        return (
                            <div key={node.id} onPointerDown={(e) => handlePointerDown(e, node.id)} onClick={() => interactionMode === 'pan' && onNodeClick(node.label)} className={`absolute flex items-center transition-all duration-300 group animate-in zoom-in-95 fade-in ${interactionMode === 'move' ? 'cursor-move' : 'cursor-pointer hover:scale-[1.02]'}`} style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${NODE_WIDTH}px`, zIndex: 10 + node.level }}>
                                <div className={`flex items-center justify-between w-full h-fit min-h-[40px] px-4 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl border-2 shadow-xl transition-all relative ${node.level === 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-200'} group-hover:border-indigo-400 group-hover:shadow-indigo-500/20`}>
                                    <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-wider whitespace-normal line-clamp-2 leading-relaxed flex-1 pr-2`}>{node.label}</span>
                                    {node.children.length > 0 && (
                                        <button onClick={(e) => toggleExpand(node.id, e)} className={`flex-shrink-0 p-1 rounded-full transition-all shadow-sm ${node.level === 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-white/5 text-indigo-500'} ${node.expanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const InfographicView: React.FC<{ url: string; name: string; onExit: () => void }> = ({ url, name, onExit }) => {
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 0.8 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const factor = 1 - e.deltaY * zoomSpeed;
    const newScale = Math.max(0.1, Math.min(viewState.scale * factor, 5));
    setViewState(prev => ({ ...prev, scale: newScale }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setViewState(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleReset = () => {
    setViewState({ x: 0, y: 0, scale: 0.8 });
  };

  return (
    <div className="h-full w-full bg-[#f1f3f4] dark:bg-[#050508] flex flex-col animate-in fade-in duration-700 overflow-hidden">
      <div className="h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white dark:bg-black shrink-0 z-50">
          <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={onExit} className="p-2 text-gray-500 hover:text-blue-600 transition-colors"><ArrowLeft size={20}/></button>
              <h2 className="text-[10px] sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate max-w-[150px] sm:max-w-none">{name}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={handleReset} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Fit to Screen"><RefreshCw size={16}/></button>
              <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-1" />
              <a href={url} download={`${name}.png`} className="p-2 sm:p-3 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-[0.95] transition-all overflow-hidden"><Download size={16}/></a>
          </div>
      </div>
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
      >
         <div 
            style={{ 
                transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
                transition: isDragging.current ? 'none' : 'transform 0.2s ease-out'
            }}
            className="flex items-center justify-center pointer-events-none"
         >
            <img 
                src={url} 
                alt={name} 
                className="max-w-[95vw] sm:max-w-[1200px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/5 rounded-2xl select-none" 
            />
         </div>
         
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 sm:px-6 py-2 rounded-full border border-white/10 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-white/60 pointer-events-none whitespace-nowrap">
            Wheel to Zoom • Drag to Pan
         </div>
      </div>
    </div>
  );
};

const ReportDocumentView: React.FC<{ content: string; name: string; onExit: () => void }> = ({ content, name, onExit }) => (
  <div className="h-full w-full bg-[#f1f3f4] dark:bg-[#050508] overflow-y-auto custom-scrollbar p-2 sm:p-12 animate-in slide-in-from-bottom duration-700">
    <div className="max-w-4xl mx-auto bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-24 relative overflow-hidden">
      <button onClick={onExit} className="absolute top-6 right-6 sm:top-10 sm:right-10 p-2 text-gray-400 hover:text-red-500 transition-colors z-20"><X size={24}/></button>
      <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
      <div className="mb-10 sm:mb-20 border-b-2 border-gray-100 dark:border-white/5 pb-6 sm:pb-12">
        <div className="flex items-center gap-3 mb-4"><FileText size={20} className="text-blue-600" /><span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Formal Synthetic Analysis</span></div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-none tracking-tighter uppercase">{name}</h1>
      </div>
      <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none font-serif leading-[1.6] sm:leading-[1.8] text-gray-800 dark:text-gray-200">
        {content.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('#')) {
              const level = trimmed.match(/^#+/)?.[0].length || 1;
              return <h3 key={i} className={`font-black uppercase tracking-tight border-b border-gray-100 dark:border-white/5 pb-2 ${level === 1 ? 'text-2xl sm:text-4xl mt-8 sm:mt-12 mb-4 sm:mb-8' : 'text-xl sm:text-2xl mt-6 sm:mt-10 mb-3 sm:mb-6'} text-blue-600 dark:text-blue-400`}>{stripMarkdown(line)}</h3>;
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
              return <li key={i} className="mb-2 sm:mb-4 list-none flex gap-3 sm:gap-4 bg-gray-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-white/5"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 mt-1.5 sm:mt-2 shrink-0" /> <span className="font-medium text-sm sm:text-lg">{stripMarkdown(line)}</span></li>;
          }
          if (trimmed) return <p key={i} className="mb-4 sm:mb-6 text-sm sm:text-lg leading-relaxed">{stripMarkdown(line)}</p>;
          return <div key={i} className="h-1 sm:h-2" />;
        })}
      </div>
      <div className="mt-16 sm:mt-32 pt-8 sm:pt-12 border-t border-gray-100 dark:border-white/5 flex justify-between items-center opacity-40"><span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Pak Chat NotesLM</span><span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Page 01</span></div>
    </div>
  </div>
);

export const NasherNotesPage: React.FC<NasherNotesPageProps> = ({ language, session, onUpdateSession, onBack, onStartLive, onNavigateToGeneralChat }) => {
  const [sources, setSources] = useState<Source[]>(session.sources || []);
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
  const [assets, setAssets] = useState<Asset[]>(session.assets || []);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on mobile-first logic
  
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>(session.config || { style: 'default', length: 'default', mode: 'assistant' });
  
  const [configModal, setConfigModal] = useState<{ isOpen: boolean; type: Asset['type'] | null }>({ isOpen: false, type: null });
  const [exportModal, setExportModal] = useState<{ isOpen: boolean; asset: Asset | null }>({ isOpen: false, asset: null });
  
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [urlModal, setUrlModal] = useState<{ isOpen: boolean; type: 'website' | 'youtube' }>({ isOpen: false, type: 'website' });
  const [textModal, setTextModal] = useState({ isOpen: false });
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  
  const [assetMenuId, setAssetMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  
  const [selectedLang, setSelectedLang] = useState(language || 'English');
  const [selectedLevel, setSelectedLevel] = useState('Medium');
  const [selectedDetail, setSelectedDetail] = useState('Detailed');
  const [audioFormat, setAudioFormat] = useState('Brief');
  const [audioLength, setAudioLength] = useState('Default');
  const [videoFormat, setVideoFormat] = useState('Explainer');
  const [videoStyle, setVideoStyle] = useState('Classic');
  const [videoFocus, setVideoFocus] = useState('');

  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    chatServiceRef.current = new ChatService(getBaseSystemPrompt(language), chatConfig);
    // Preserving memory if session exists
    if (messages.length > 0) {
        chatServiceRef.current.startChatWithHistory(messages.map(m => ({ role: m.role, content: m.content })));
    }
  }, [language, chatConfig]);

  // Sync local state back to App's master session state immediately when it changes
  useEffect(() => {
    onUpdateSession(session.id, { sources, messages, assets, config: chatConfig });
  }, [sources, messages, assets, chatConfig, session.id]);

  const handleConfigSave = (newConfig: ChatConfig) => {
    setChatConfig(newConfig);
    if (chatServiceRef.current) {
      chatServiceRef.current.updateConfig(newConfig);
    }
  };

  const handleUploadSource = (file: File) => {
    const fileName = file.name.toLowerCase();
    let type: Source['type'] = 'doc';
    
    if (fileName.endsWith('.pdf')) {
        type = 'pdf';
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        type = 'text';
    } else if (file.type.includes('audio') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.m4a')) {
        type = 'audio';
    } else if (file.type.includes('video') || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) {
        type = 'video';
    } else if (file.type.includes('image') || /\.(jpg|jpeg|png|gif|webp|avif|heic|heif|bmp|tiff|jp2|ico)$/.test(fileName)) {
        type = 'image';
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        type = 'doc';
    }

    const newSource: Source = { 
      id: Date.now().toString(), 
      name: file.name, 
      type, 
      timestamp: Date.now(),
      selected: true 
    };
    setSources(prev => [...prev, newSource]);
    setIsAddSourceModalOpen(false);
    handleSendMessage(`I have uploaded "${file.name}" (${type}). Please analyze it.`, file, true);
  };

  const handleAddUrlSource = () => {
      if (!urlInput.trim()) return;
      const type = urlModal.type === 'youtube' ? 'youtube' : 'url';
      const newSource: Source = { 
        id: Date.now().toString(), 
        name: urlInput, 
        type: type, 
        timestamp: Date.now(),
        selected: true
      };
      setSources(prev => [...prev, newSource]);
      setUrlModal({ ...urlModal, isOpen: false });
      setIsAddSourceModalOpen(false);
      setUrlInput('');
      handleSendMessage(`I added a source link: ${urlInput}. Please analyze it.`, undefined, true);
  };

  const handleAddTextSource = () => {
      if (!textInput.trim()) return;
      const snippet = textInput.substring(0, 30) + (textInput.length > 30 ? '...' : '');
      const newSource: Source = { 
        id: Date.now().toString(), 
        name: `Pasted Text: ${snippet}`, 
        type: 'text', 
        content: textInput, 
        timestamp: Date.now(),
        selected: true
      };
      setSources(prev => [...prev, newSource]);
      setTextModal({ isOpen: false });
      setIsAddSourceModalOpen(false);
      setTextInput('');
      handleSendMessage(`I am pasting this text as a source: ${textInput}`, undefined, true);
  };

  const toggleSourceSelection = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSources(prev => prev.map(s => ({ ...s, selected: checked })));
  };

  const getGroundedSourceContext = () => {
    const selectedSources = sources.filter(s => s.selected);
    if (selectedSources.length === 0) return "";
    return selectedSources.map(s => `[Source: ${s.name} (${s.type})]`).join('\n');
  };

  const handleSendMessage = async (content: string, attachment?: File, isAuto = false) => {
    if (!content.trim() || loadingState !== 'idle') return;
    if (!isAuto) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }]);
    setLoadingState('loading');
    try {
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setLoadingState('streaming');
      
      const sourceCtx = getGroundedSourceContext();
      const finalPrompt = sourceCtx ? `SOURCES:\n${sourceCtx}\n\nUSER:${content}` : content;
      
      const stream = await chatServiceRef.current!.sendMessageStream(finalPrompt, attachment);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullResponse } : m));
      }
      if (fullResponse.includes("### HINTS:")) {
          const [main, hintsPart] = fullResponse.split("### HINTS:");
          const hints = hintsPart.split('\n').map(h => h.replace(/^[-*•\d.]+\s*/, '').trim()).filter(h => h.length > 0).slice(0, 3);
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: main.trim(), isStreaming: false, hints } : m));
      } else { setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m)); }
    } catch (e) { console.error(e); } finally { setLoadingState('idle'); }
  };

  const executeStudioTool = async (overriddenType?: Asset['type']) => {
    const tool = overriddenType || configModal.type;
    const selectedSources = sources.filter(s => s.selected);
    if (!tool || selectedSources.length === 0) return setConfigModal({ isOpen: false, type: null });
    
    const assetId = Date.now().toString();
    const newAsset: Asset = { id: assetId, type: tool, name: `Synthesizing ${tool.charAt(0).toUpperCase() + tool.slice(1)}...`, status: 'processing', timestamp: Date.now(), config: { language: selectedLang, level: selectedLevel, detail: selectedDetail } };
    setAssets(prev => [newAsset, ...prev]);
    setConfigModal({ isOpen: false, type: null });
    
    try {
        const sourceCtx = selectedSources.map(s => `[Source: ${s.name}]`).join(', ');
        if (tool === 'infographic') {
            const visualPrompt = `Act as a professional corporate data visualizer. Create a CLEAN, modern high-resolution infographic that is EXCLUSIVELY and STICKLY grounded in the key analytical facts, data hierarchies, and core research findings found ONLY in the provided selected material: ${sourceCtx}. 
            Identify the 4-5 most impactful concepts or statistical trends from the material.
            Use an emerald and indigo high-contrast color palette with white negative space for maximum legibility. 
            Represent the information visually using high-fidelity diagrams that logically map the material's specific structure. 
            ENSURE all textual content in the generated image accurately reflects the specific terms and concepts from the source material in ${selectedLang}. Hallucinations are strictly forbidden.`;
            
            const imageUrl = await chatServiceRef.current!.generateImage(visualPrompt, '16:9');
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: imageUrl, name: `Infographic: ${selectedSources[0].name.substring(0, 15)}...` } : a));
        } else if (tool === 'video') {
            const videoPrompt = `A high-quality educational overview video in ${videoStyle} style explaining the provided research. Topic: ${selectedSources[0].name}. Instructions: ${videoFocus || 'Highlight main points'}. Grounded in: ${sourceCtx}. Audio language: ${selectedLang}.`;
            const videoUrl = await chatServiceRef.current!.generateVideo(videoPrompt, '16:9');
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: videoUrl, name: `Video Overview: ${selectedSources[0].name.substring(0, 15)}...` } : a));
        } else if (tool === 'audio') {
            const scriptPrompt = `Generate a ${audioFormat} narration script (Length: ${audioLength}) for an audio overview in ${selectedLang} because of: ${sourceCtx}. Focus on research insights. Output ONLY raw text.`;
            const stream = await chatServiceRef.current!.sendMessageStream(scriptPrompt);
            let scriptText = "";
            for await (const chunk of stream) { scriptText += chunk; }
            const cleanScript = scriptText.replace(/[*#`_]/g, '').trim();
            const voiceNoteBase64 = await chatServiceRef.current!.generateSpeech(cleanScript, 'Kore');
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: voiceNoteBase64, name: `Audio Overview: ${selectedSources[0].name.substring(0, 10)}...` } : a));
        } else if (tool === 'quiz') {
            const prompt = `Generate a JSON array of 5 interactive quiz questions based on: ${sourceCtx}. Respond in ${selectedLang}. Format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": number_index}]. Output ONLY JSON.`;
            const stream = await chatServiceRef.current!.sendMessageStream(prompt);
            let result = "";
            for await (const chunk of stream) { result += chunk; }
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: jsonMatch ? jsonMatch[0] : '[]', name: `Quiz: ${selectedSources[0].name.substring(0, 15)}...` } : a));
        } else if (tool === 'slides') {
            const prompt = `Generate a JSON array of 6-8 comprehensive professional presentation slides based on: ${sourceCtx}. Respond in ${selectedLang}. Each slide must have a 'title' and an array of 3-4 descriptive 'points'. Format: [{"title": "...", "points": ["...", "...", "..."]}]. Output ONLY valid JSON.`;
            const stream = await chatServiceRef.current!.sendMessageStream(prompt);
            let result = "";
            for await (const chunk of stream) { result += chunk; }
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: jsonMatch ? jsonMatch[0] : '[]', name: `Slides: ${selectedSources[0].name.substring(0, 15)}...` } : a));
        } else if (tool === 'mindmap') {
            const prompt = `Generate a hierarchical mind map of concepts in: ${sourceCtx}. Language: ${selectedLang}. Use indentation (2 spaces per level). Output ONLY the hierarchical text.`;
            const stream = await chatServiceRef.current!.sendMessageStream(prompt);
            let result = "";
            for await (const chunk of stream) { result += chunk; }
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: result, name: `Mind Map: ${selectedSources[0].name.substring(0, 15)}...` } : a));
        } else {
            const prompt = `STUDIO ACTION: Generate a ${tool}. Strictly use sources: ${sourceCtx}. Language: ${selectedLang}.`;
            const stream = await chatServiceRef.current!.sendMessageStream(prompt);
            let result = "";
            for await (const chunk of stream) { result += chunk; }
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready', content: result, name: `Synthesis ${tool.charAt(0).toUpperCase() + tool.slice(1)}` } : a));
        }
    } catch (e) { setAssets(prev => prev.filter(a => a.id !== assetId)); }
  };

  const handleMindMapQuery = (label: string) => { setViewingAsset(null); handleSendMessage(`Can you explain "${label}" in more detail based on the sources?`); };
  
  const handleExportRequest = (asset: Asset) => { setExportModal({ isOpen: true, asset }); };

  const performExport = async (format: string) => {
    const asset = exportModal.asset;
    if (!asset) return;
    setExportModal({ isOpen: false, asset: null });

    const fileName = asset.name.replace(/\s+/g, '_');

    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(asset.name, 10, 20);
        doc.setFontSize(12);
        
        let content = asset.content || '';
        if (asset.type === 'quiz') {
            const data = JSON.parse(content);
            content = data.map((q: any, i: number) => `${i+1}. ${q.question}\n   Options: ${q.options.join(', ')}`).join('\n\n');
        } else if (asset.type === 'slides') {
            const data = JSON.parse(content);
            content = data.map((s: any) => `Slide: ${s.title}\n${s.points.map((p:any) => `- ${p}`).join('\n')}`).join('\n\n');
        } else if (asset.type === 'infographic') {
            // For infographics, the content is a Data URI
            const imgData = asset.content!;
            const props = doc.getImageProperties(imgData);
            const width = doc.internal.pageSize.getWidth() - 20;
            const height = (props.height * width) / props.width;
            doc.addImage(imgData, 'PNG', 10, 30, width, height);
            doc.save(`${fileName}.pdf`);
            return;
        }

        const lines = doc.splitTextToSize(content, 180);
        doc.text(lines, 10, 35);
        doc.save(`${fileName}.pdf`);
      } 
      else if (format === 'docx') {
        let content = asset.content || '';
        let children: any[] = [
            new docx.Paragraph({ 
                text: asset.name, 
                heading: docx.HeadingLevel.HEADING_1, 
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new docx.Paragraph({ 
                text: `Synthesized by Pak Chat NotesLM`, 
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 800 }
            })
        ];

        if (asset.type === 'quiz') {
            const data = JSON.parse(content);
            data.forEach((q: any, i: number) => {
                children.push(new docx.Paragraph({ text: `Question ${i+1}: ${q.question}`, heading: docx.HeadingLevel.HEADING_3, spacing: { before: 400 } }));
                q.options.forEach((opt: string) => {
                    children.push(new docx.Paragraph({ text: opt, bullet: { level: 0 }, indent: { left: 720 } }));
                });
            });
        } else {
            content.split('\n').forEach(line => {
                if (line.trim()) {
                    children.push(new docx.Paragraph({ text: line, spacing: { after: 200 } }));
                }
            });
        }

        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        const blob = await docx.Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
      }
      else if (format === 'pptx') {
        const pres = new pptxgen();
        const data = JSON.parse(asset.content || '[]');
        
        // Title Slide
        let titleSlide = pres.addSlide();
        titleSlide.addText(asset.name, { x: 0, y: '40%', w: '100%', h: 1, align: 'center', fontSize: 44, bold: true });
        titleSlide.addText("Generated by Pak Chat NotesLM", { x: 0, y: '60%', w: '100%', h: 0.5, align: 'center', fontSize: 18, color: '888888' });

        data.forEach((slideData: any) => {
            let slide = pres.addSlide();
            slide.addText(slideData.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '3B82F6' });
            slide.addText(slideData.points.join('\n\n'), { x: 0.5, y: 1.5, w: '90%', h: 4, fontSize: 18, bullet: true });
        });

        await pres.writeFile({ fileName: `${fileName}.pptx` });
      }
      else if (format === 'svg' && asset.type === 'infographic') {
          // Wrap PNG in SVG if native SVG not available (industry fallback for real file structure)
          const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="720">
  <image width="1280" height="720" xlink:href="${asset.content}" />
</svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          saveAs(blob, `${fileName}.svg`);
      }
      else if (format === 'html') {
          // Specialized Mind Map HTML Export
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${asset.name}</title>
                <style>
                    body { font-family: -apple-system, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
                    .node { margin-left: 20px; border-left: 2px solid #e2e8f0; padding-left: 15px; margin-top: 10px; }
                    .label { font-weight: bold; cursor: pointer; padding: 8px 12px; background: white; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                    .label:hover { border-color: #3b82f6; color: #3b82f6; }
                    .root { font-size: 1.2em; background: #3b82f6; color: white; border: none; }
                    .hidden { display: none; }
                </style>
            </head>
            <body>
                <h1>${asset.name}</h1>
                <div id="mindmap"></div>
                <script>
                    const data = \`${asset.content?.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                    const container = document.getElementById('mindmap');
                    
                    function render(text) {
                        const lines = text.split('\\n').filter(l => l.trim());
                        const rootDiv = document.createElement('div');
                        let currentParent = rootDiv;
                        let lastLevel = -1;
                        let stack = [rootDiv];

                        lines.forEach(line => {
                            const indent = line.search(/\\S/);
                            const level = Math.floor(indent / 2);
                            const label = line.trim().replace(/^[#*-]\\s*/, '');
                            
                            while (level <= lastLevel) {
                                stack.pop();
                                lastLevel--;
                            }

                            const div = document.createElement('div');
                            div.className = 'node';
                            const span = document.createElement('span');
                            span.className = 'label' + (level === 0 ? ' root' : '');
                            span.innerText = label;
                            
                            div.appendChild(span);
                            stack[stack.length - 1].appendChild(div);
                            stack.push(div);
                            lastLevel = level;

                            span.onclick = (e) => {
                                Array.from(div.children).forEach(c => {
                                    if (c !== span) c.classList.toggle('hidden');
                                });
                            };
                        });
                        container.appendChild(rootDiv);
                    }
                    render(data);
                </script>
            </body>
            </html>
          `;
          const blob = new Blob([htmlContent], { type: 'text/html' });
          saveAs(blob, `${fileName}.html`);
      }
      else if (format === 'png') {
        if (asset.type === 'infographic' || asset.type === 'mindmap') {
            saveAs(asset.content!, `${fileName}.png`);
        }
      }
      else if (format === 'mp3') {
        const byteString = atob(asset.content!);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'audio/mp3' });
        saveAs(blob, `${fileName}.mp3`);
      }
      else if (format === 'mp4') {
        saveAs(asset.content!, `${fileName}.mp4`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert(`Technical error: Failed to generate valid ${format.toUpperCase()} file. Please try again.`);
    }
  };

  const getSourceIcon = (type: string) => {
    switch(type) {
        case 'pdf': return <FileText className="text-red-500" size={16} />;
        case 'url': return <Globe className="text-blue-500" size={16} />;
        case 'youtube': return <Youtube className="text-red-600" size={16} />;
        case 'image': return <FileImage className="text-emerald-500" size={16} />;
        case 'audio': return <Music className="text-purple-500" size={16} />;
        case 'video': return <FileVideo className="text-orange-500" size={16} />;
        case 'text': return <ClipboardList className="text-amber-500" size={16} />;
        default: return <File className="text-gray-500" size={16} />;
    }
  };

  const StudioButton = ({ icon: Icon, label, id, color }: any) => (
    <button onClick={() => setConfigModal({ isOpen: true, type: id })} className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 rounded-[1.5rem] hover:border-blue-500 hover:shadow-xl transition-all group active:scale-95 overflow-hidden">
      <div className={`p-3 rounded-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${color}`}><Icon size={18} /></div>
      <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 group-hover:text-blue-500 text-center">{label}</span>
    </button>
  );

  const researchGroundedSystemPrompt = useMemo(() => {
    const selectedSources = sources.filter(s => s.selected);
    const sourceCtx = selectedSources.map(s => `[Source: ${s.name} (${s.type})]`).join(', ');
    return `You are a world-class multimodal research assistant. Respond in ${language}. You have access to the following GROUNDED AND SELECTED sources: ${sourceCtx || 'No selected files provided yet.'}.
    
    IMPORTANT PROTOCOL:
    1. ONLY discuss the SELECTED sources provided. 
    2. Discuss ANY of the provided sources (Text, PDF, Audio, Image, Video).
    3. You are a multimodal AI. Use context to understand images/videos.
    4. Stay strictly grounded in the research provided but be conversational.`;
  }, [sources, language]);

  const allSelected = sources.length > 0 && sources.every(s => s.selected);

  return (
    <div className="flex h-full w-full bg-[#fdfdfe] dark:bg-[#050508] overflow-hidden" onClick={() => setAssetMenuId(null)}>
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[400] transition-opacity duration-300 backdrop-blur-sm md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`
        fixed md:relative top-0 left-0 h-full z-[450] md:z-0
        bg-gray-50/80 dark:bg-black/90 md:dark:bg-black/40 border-r border-gray-200 dark:border-white/5 
        flex flex-col shrink-0 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-[85vw] sm:w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-80'}
        overflow-hidden
      `}>
        <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl" title="Back to Notebooks"><ArrowLeft size={20} /></button>
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-blue-600" /><h2 className="font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-200">Source Q&A</h2></div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-12 no-scrollbar">
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between mb-4 px-1"><span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Research Sources</span></div>
             <button onClick={() => setIsAddSourceModalOpen(true)} className="w-full py-5 mb-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] group ring-2 ring-blue-500/10">
                <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Add Source</span>
             </button>

             {sources.length > 0 && (
               <div className="flex items-center justify-between px-3 py-2 mb-2 bg-gray-100/50 dark:bg-white/5 rounded-xl">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Select all sources</span>
                 <button 
                  onClick={() => toggleSelectAll(!allSelected)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${allSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-black border-gray-300 dark:border-gray-700'}`}
                 >
                   {allSelected && <Check size={14} strokeWidth={4} />}
                 </button>
               </div>
             )}

             <div className="space-y-2">
                {sources.length === 0 ? <div className="py-8 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl text-center opacity-40"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Awaiting materials...</p></div> : sources.map(source => (
                    <div key={source.id} className={`flex items-center justify-between p-3 bg-white dark:bg-[#0d0d14] border rounded-xl group transition-all shadow-sm ${source.selected ? 'border-blue-500 ring-1 ring-blue-500/10' : 'border-gray-100 dark:border-white/5 opacity-70 hover:opacity-100'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <button 
                              onClick={() => toggleSourceSelection(source.id)}
                              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${source.selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'}`}
                            >
                              {source.selected && <Check size={10} strokeWidth={4} />}
                            </button>
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg shrink-0">{getSourceIcon(source.type)}</div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold dark:text-white truncate uppercase tracking-tight">{source.name}</p>
                              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{source.type}</p>
                            </div>
                        </div>
                        <button onClick={() => setSources(prev => prev.filter(s => s.id !== source.id))} className="p-1 text-gray-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                    </div>
                ))}
             </div>
          </section>
          <section className="animate-in fade-in slide-in-from-top-6 duration-700 pt-8 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-5 px-1"><span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Knowledge tools</span></div>
            <div className="grid grid-cols-3 gap-3">
              <StudioButton icon={FileText} label="Reports" id="report" color="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
              <StudioButton icon={Sparkles} label="Flashcards" id="flashcards" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" />
              <StudioButton icon={Layout} label="Infographic" id="infographic" color="bg-orange-50 text-orange-600 dark:bg-orange-900/20" />
              <StudioButton icon={ListChecks} label="Quiz" id="quiz" color="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
              <StudioButton icon={BookOpen} label="Guide" id="guide" color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" />
              <StudioButton icon={Presentation} label="Slides" id="slides" color="bg-rose-50 text-rose-600 dark:bg-rose-900/20" />
              <StudioButton icon={Mic} label="Audio" id="audio" color="bg-teal-50 text-teal-700 dark:bg-teal-900/20" />
              <StudioButton icon={Video} label="Video" id="video" color="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
              <StudioButton icon={BrainCircuit} label="Mind Map" id="mindmap" color="bg-violet-50 text-violet-600 dark:bg-violet-900/20" />
            </div>
          </section>
          <section>
             <div className="flex items-center gap-2 mb-5 px-1"><span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Insights vault</span></div>
             <div className="space-y-2 pb-10">
                {assets.length === 0 ? <div className="p-12 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2rem] text-center opacity-20"><FileSearch size={32} className="mx-auto mb-3" /><p className="text-[9px] font-black uppercase tracking-widest">Library empty</p></div> : assets.map(asset => (
                    <div key={asset.id} onClick={() => asset.status === 'ready' && setViewingAsset(asset)} className={`p-4 bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm transition-all relative cursor-pointer ${asset.status === 'processing' ? 'animate-pulse ring-1 ring-blue-500/20' : 'hover:border-blue-500 hover:shadow-md'}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0"><div className={`p-2.5 rounded-xl ${asset.status === 'processing' ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'}`}>{asset.status === 'processing' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}</div><div className="min-w-0"><p className="text-[11px] font-bold truncate dark:text-white uppercase tracking-tight">{asset.name}</p><p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{asset.type} • {asset.status}</p></div></div>
                            {asset.status === 'ready' && <div className="relative"><button onClick={(e) => { e.stopPropagation(); setAssetMenuId(assetMenuId === asset.id ? null : asset.id); }} className="p-1 text-gray-300 hover:text-blue-500 transition-colors"><MoreVertical size={16} /></button>{assetMenuId === asset.id && <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden p-1"><button onClick={(e) => { e.stopPropagation(); setRenameModal({ isOpen: true, id: asset.id, name: asset.name }); setAssetMenuId(null); }} className="w-full text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"><Edit2 size={12} /> Rename</button><button onClick={(e) => { e.stopPropagation(); handleExportRequest(asset); setAssetMenuId(null); }} className="w-full text-left px-3 py-2.5 font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 transition-colors"><FileOutput size={12} /> Export</button><div className="h-px bg-gray-100 dark:bg-white/5 my-1" /><button onClick={(e) => { e.stopPropagation(); setAssets(prev => prev.filter(a => a.id !== asset.id)); setAssetMenuId(null); }} className="w-full text-left px-3 py-2.5 font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"><Trash2 size={12} /> Wipe</button></div>}</div>}
                        </div>
                    </div>
                ))}
             </div>
          </section>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#050508] relative overflow-x-hidden">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/40 backdrop-blur-md z-20 w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors shrink-0" title="Open Sidebar"><Menu size={22} /></button>
             <div className="min-w-0 truncate">
               <h1 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">{session.title}</h1>
               <div className="flex items-center gap-1.5 mt-0.5"><div className={`w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse`} /><span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">{sources.filter(s => s.selected).length} ACTIVE SOURCES</span></div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/10 scale-90 sm:scale-100">
                 <button 
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-800 text-blue-600 shadow-sm`}
                 >Q&A</button>
                 <button 
                  onClick={onNavigateToGeneralChat}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-gray-600`}
                 >CHAT</button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 sm:border-l border-gray-200 dark:border-white/10">
                  <button onClick={() => { if(confirm("Clear conversation history for this notebook?")) setMessages([]); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Reload Session">
                    <RefreshCw size={18} />
                  </button>
                  <button onClick={() => setIsConfigModalOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Configure">
                    <SlidersHorizontal size={18} />
                  </button>
              </div>
          </div>
        </div>
        {viewingAsset ? (
            <div className="absolute inset-0 z-[150] bg-white dark:bg-[#050508] flex flex-col animate-in slide-in-from-bottom duration-700">
                {viewingAsset.type === 'quiz' ? ( <QuizViewer asset={viewingAsset} onExit={() => setViewingAsset(null)} onRegenerate={() => executeStudioTool('quiz')} /> ) : viewingAsset.type === 'slides' ? ( <SlidesViewer asset={viewingAsset} onExit={() => setViewingAsset(null)} /> ) : viewingAsset.type === 'video' ? ( <VideoOverviewViewer asset={viewingAsset} onExit={() => setViewingAsset(null)} onDownload={() => handleExportRequest(viewingAsset)} /> ) : viewingAsset.type === 'audio' ? ( <AudioOverviewViewer asset={viewingAsset} onExit={() => setViewingAsset(null)} onDownload={() => handleExportRequest(viewingAsset)} /> ) : viewingAsset.type === 'mindmap' ? ( <MindMapCanvas content={viewingAsset.content || ''} onExit={() => setViewingAsset(null)} onNodeClick={handleMindMapQuery} /> ) : viewingAsset.type === 'infographic' ? ( <InfographicView url={viewingAsset.content || ''} name={viewingAsset.name} onExit={() => setViewingAsset(null)} /> ) : (viewingAsset.type === 'report' || viewingAsset.type === 'guide') ? ( <ReportDocumentView content={viewingAsset.content || ''} name={viewingAsset.name} onExit={() => setViewingAsset(null)} /> ) : (
                    <>
                        <div className="h-14 px-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-black/40 backdrop-blur-sm">
                           <div className="flex items-center gap-3">
                              <button onClick={() => setViewingAsset(null)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-gray-200 dark:border-white/10 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-[0.95] overflow-hidden"><ArrowLeft size={12} /> Back</button>
                              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 truncate max-w-[100px]">{viewingAsset.name}</h2>
                           </div>
                           <button onClick={() => handleExportRequest(viewingAsset)} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><DownloadCloud size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-hidden">{viewingAsset.type === 'flashcards' ? <FlashcardDeck content={viewingAsset.content || ''} onClose={() => setViewingAsset(null)} /> : <div className="h-full w-full p-4 sm:p-10 overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-4xl mx-auto font-serif">{viewingAsset.content?.split('\n').map((l, i) => (<p key={i} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg">{stripMarkdown(l)}</p>))}</div>}</div>
                    </>
                )}
            </div>
        ) : (
            <>
                <div className="flex-1 overflow-hidden relative border-b border-gray-100 dark:border-white/5">
                    {sources.length === 0 && messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 overflow-y-auto">
                             <div className="w-20 h-20 sm:w-28 sm:h-28 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center mb-6 sm:mb-8 shadow-2xl border border-blue-100 dark:border-blue-800 -rotate-6"><Plus size={32} className="sm:w-12 sm:h-12 text-blue-600" /></div>
                             <h2 className="text-xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-tighter">Your Grounded Research</h2>
                             <p className="text-gray-500 max-w-md mb-6 sm:mb-10 text-sm sm:text-lg font-medium italic">Upload documents or links to build your private context-aware knowledge base.</p>
                             <button onClick={() => setIsAddSourceModalOpen(true)} className="px-6 sm:px-10 py-3.5 sm:py-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] sm:rounded-[2rem] text-sm sm:text-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-[0.95] flex items-center gap-3 overflow-hidden"><Plus size={20} strokeWidth={3} /> Add Source</button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {sources.filter(s => s.selected).length === 0 && (
                                <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Warning: No sources selected. Grounding is inactive.</p>
                                </div>
                            )}
                            <MessageList messages={messages} loadingState={loadingState} onEdit={() => {}} language={language} onReply={handleSendMessage} />
                        </div>
                    )}
                </div>
                <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 z-30 w-full overflow-hidden">
                    <div className="max-w-4xl mx-auto w-full px-1">
                        <ChatInput onSend={handleSendMessage} isLoading={loadingState !== 'idle'} onStartLive={() => setIsLiveOpen(true)} placeholder="Analyze research material..." />
                    </div>
                </div>
            </>
        )}
      </div>

      {isAddSourceModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#101018] w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl border-t sm:border border-white/10 flex flex-col overflow-hidden max-h-[90vh] relative animate-in slide-in-from-bottom duration-300">
                  <button onClick={() => setIsAddSourceModalOpen(false)} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 text-gray-400 hover:text-red-500 transition-colors z-20"><X size={24} /></button>
                  <div className="p-6 sm:p-16 overflow-y-auto no-scrollbar">
                      <p className="text-[10px] sm:text-sm text-gray-500 mb-2 font-bold uppercase tracking-[0.2em]">Sources & Grounding</p>
                      <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mb-6 sm:mb-10 leading-tight">Sources let Pak Chat base its responses on your specific info.</h2>
                      <div onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.onchange = (e) => { const f = (e.target as any).files?.[0]; if(f) handleUploadSource(f); }; i.click(); }} className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] py-10 sm:py-20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all group mb-8 sm:mb-12"><div className="p-4 sm:p-6 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 mb-4 sm:mb-8 group-hover:scale-110 transition-transform"><Upload size={32} /></div><h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1 sm:mb-2">Upload sources</h3><p className="text-gray-400 font-medium text-sm sm:text-lg">Drag & drop or <span className="text-blue-600 underline">choose file</span></p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8"><div className="p-4 sm:p-8 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-blue-500 transition-all group"><div className="flex items-center gap-3 mb-4 sm:mb-6"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-black rounded-xl flex items-center justify-center shadow-sm"><Globe size={18} /></div><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Add Links</span></div><div className="flex gap-2 sm:gap-4"><button onClick={() => setUrlModal({ isOpen: true, type: 'website' })} className="flex-1 py-3 sm:py-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:shadow-lg transition-all"><Globe size={16} className="text-blue-500"/> WEB</button><button onClick={() => setUrlModal({ isOpen: true, type: 'youtube' })} className="flex-1 py-3 sm:py-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:shadow-lg transition-all"><Youtube size={16} className="text-red-500"/> YT</button></div></div><div className="p-4 sm:p-8 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-blue-500 transition-all group"><div className="flex items-center gap-3 mb-4 sm:mb-6"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-black rounded-xl flex items-center justify-center shadow-sm"><ClipboardList size={18} /></div><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Direct Entry</span></div><button onClick={() => setTextModal({ isOpen: true })} className="w-full py-3 sm:py-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:shadow-lg transition-all"><ClipboardList size={16} className="text-amber-500" /> PASTE TEXT</button></div></div>
                  </div>
              </div>
          </div>
      )}

      {urlModal.isOpen && (
          <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#15151e] w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-2xl border-t sm:border border-white/10 animate-in slide-in-from-bottom duration-300"><div className="flex items-center gap-4 mb-6"><div className={`p-3 rounded-xl ${urlModal.type === 'youtube' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{urlModal.type === 'youtube' ? <Youtube size={24}/> : <Globe size={24}/>}</div><h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">Insert {urlModal.type === 'youtube' ? 'YouTube URL' : 'Website Link'}</h3></div><input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder={`Enter ${urlModal.type} URL...`} className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm mb-6" autoFocus /><div className="flex gap-3"><button onClick={() => setUrlModal({ ...urlModal, isOpen: false })} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Cancel</button><button onClick={handleAddUrlSource} disabled={!urlInput.trim()} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30">Insert</button></div></div>
          </div>
      )}

      {textModal.isOpen && (
          <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#15151e] w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-2xl border-t sm:border border-white/10 animate-in slide-in-from-bottom duration-300"><div className="flex items-center gap-4 mb-6"><div className={`p-3 rounded-xl bg-amber-50 text-amber-500`}>{<ClipboardList size={24}/>}</div><h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">Paste Knowledge Block</h3></div><textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste text content..." className="w-full h-60 p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-sm mb-6 resize-none no-scrollbar" autoFocus /><div className="flex gap-3"><button onClick={() => setTextModal({ isOpen: false })} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Cancel</button><button onClick={handleAddTextSource} disabled={!textInput.trim()} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30">Insert</button></div></div>
          </div>
      )}

      {configModal.isOpen && (
          <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-2xl p-0 sm:p-4 animate-in fade-in duration-300">
              {configModal.type === 'audio' ? (
                <div className="bg-white dark:bg-[#101018] rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-sm p-6 sm:p-10 shadow-2xl border-t sm:border border-white/10 relative overflow-hidden animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-4 mb-6 sm:mb-8">
                       <div className="p-3 bg-blue-600 text-white rounded-xl"><Mic size={20} /></div>
                       <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Audio Overview</h3>
                    </div>
                    <div className="space-y-6 sm:space-y-8">
                        <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Format</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Deep Dive', 'Brief', 'Critique', 'Debate'].map(f => (
                                    <button key={f} onClick={() => setAudioFormat(f)} className={`py-2 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${audioFormat === f ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500'}`}>{f}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Language</label>
                            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl outline-none font-bold text-xs sm:text-sm">
                                {['English', 'Urdu', 'Roman Urdu'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8 sm:mt-12"><button onClick={() => setConfigModal({ isOpen: false, type: null })} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400">Abort</button><button onClick={() => executeStudioTool('audio')} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl">Generate</button></div>
                </div>
              ) : configModal.type === 'video' ? (
                <div className="bg-white dark:bg-[#101018] rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-sm p-6 sm:p-10 shadow-2xl border-t sm:border border-white/10 relative overflow-hidden animate-in slide-in-from-bottom duration-300">
                    <button onClick={() => setConfigModal({ isOpen: false, type: null })} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors z-20"><X size={20} /></button>
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-3 bg-orange-600 text-white rounded-xl"><MonitorPlay size={20} /></div>
                       <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Video Overview</h3>
                    </div>
                    <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2 no-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Format</label>
                                <select value={videoFormat} onChange={(e) => setVideoFormat(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl outline-none font-bold text-[10px]">
                                    {['Explainer', 'Brief'].map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Language</label>
                                <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl outline-none font-bold text-[10px]">
                                    {['English', 'Urdu'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Classic', 'Anime', ' Kawaii'].map(s => (
                                    <button key={s} onClick={() => setVideoStyle(s)} className={`py-2 px-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${videoStyle === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-50 text-gray-400'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => executeStudioTool('video')} className="w-full mt-8 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.3em]">Generate</button>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#101018] rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm p-6 sm:p-10 shadow-2xl border-t sm:border border-white/10 relative overflow-hidden animate-in slide-in-from-bottom duration-300"><div className="relative z-10"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-600 text-white rounded-lg"><Sparkles size={18} /></div><h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{configModal.type} Generator</h3></div><div className="space-y-6 pt-6"><div><label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Linguistic Target</label><select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl outline-none font-bold text-xs">{['English', 'Urdu', 'Roman Urdu'].map(l => <option key={l} value={l}>{l}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Depth</label><select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl outline-none font-bold text-xs">{['Easy', 'Medium', 'Hard'].map(l => <option key={l} value={l}>{l}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Complexity</label><select value={selectedDetail} onChange={(e) => setSelectedDetail(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl outline-none font-bold text-xs">{['Short', 'Detailed', 'Deep'].map(l => <option key={l} value={l}>{l}</option>)}</select></div></div></div><div className="flex gap-4 mt-8 sm:mt-12"><button onClick={() => setConfigModal({ isOpen: false, type: null })} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Abort</button><button onClick={() => executeStudioTool()} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.3em]">Synthesis</button></div></div></div>
              )}
          </div>
      )}
      
      {exportModal.isOpen && (
         <ExportFormatModal 
            isOpen={exportModal.isOpen} 
            onClose={() => setExportModal({ isOpen: false, asset: null })} 
            onSelect={performExport}
            formats={
                exportModal.asset?.type === 'audio' ? [{ id: 'mp3', label: 'MP3 Audio', icon: Music }] :
                exportModal.asset?.type === 'video' ? [{ id: 'mp4', label: 'MP4 Video', icon: Video }] :
                exportModal.asset?.type === 'report' || exportModal.asset?.type === 'guide' || exportModal.asset?.type === 'flashcards' || exportModal.asset?.type === 'quiz' ? [{ id: 'pdf', label: 'PDF Document', icon: FileOutput }, { id: 'docx', label: 'Microsoft Word', icon: FileText }] :
                exportModal.asset?.type === 'infographic' ? [{ id: 'png', label: 'PNG Image', icon: FileImage }, { id: 'svg', label: 'Scalable Vector (SVG)', icon: Globe }] :
                exportModal.asset?.type === 'slides' ? [{ id: 'pptx', label: 'PowerPoint', icon: Presentation }, { id: 'pdf', label: 'PDF Document', icon: FileOutput }] :
                exportModal.asset?.type === 'mindmap' ? [{ id: 'html', label: 'Interactive HTML', icon: Globe }, { id: 'pdf', label: 'PDF Document', icon: FileOutput }, { id: 'png', label: 'PNG Image', icon: FileImage }] :
                [{ id: 'pdf', label: 'PDF Document', icon: FileOutput }, { id: 'docx', label: 'Microsoft Word', icon: FileText }]
            }
         />
      )}

      {isLiveOpen && (
        <LiveSessionOverlay 
          onClose={(t) => {
              setIsLiveOpen(false);
              if(t.length > 0) setMessages(prev => [...prev, ...t]);
          }}
          language={language}
          systemInstruction={researchGroundedSystemPrompt}
          initialHistory={messages}
        />
      )}

      <ConfigureChatModal 
          isOpen={isConfigModalOpen} 
          onClose={() => setIsConfigModalOpen(false)} 
          config={chatConfig}
          onSave={handleConfigSave}
      />

      <ActionModal isOpen={renameModal.isOpen} type="prompt" title="Rename Resource" defaultValue={renameModal.name} onConfirm={(val) => val && setAssets(prev => prev.map(a => a.id === renameModal.id ? { ...a, name: val } : a))} onClose={() => setRenameModal({ isOpen: false, id: '', name: '' })} />
    </div>
  );
};
