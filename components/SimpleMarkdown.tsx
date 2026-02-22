import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, Maximize2, 
  PencilLine, X, ArrowRight,
  Link2, CheckCircle, Volume2, Sparkles, Minimize2, BrainCircuit, Layers, MousePointer2, Hand,
  RotateCcw, PenTool, Copy, Trash2, PlayCircle
} from 'lucide-react';

interface MindMapNode {
  topic: string;
  branches?: MindMapNode[];
}

const MindMapBranch: React.FC<{ 
  node: MindMapNode; 
  level: number; 
  onAutoReply: (topic: string) => void;
}> = ({ node, level, onAutoReply }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasBranches = node.branches && node.branches.length > 0;
  
  const timerRef = useRef<number | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const startPress = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsLongPressing(true);
    timerRef.current = window.setTimeout(() => {
      onAutoReply(node.topic);
      setIsLongPressing(false);
    }, 600);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLongPressing(false);
  };

  const getLevelStyles = (lvl: number) => {
    switch (lvl) {
      case 0: return "bg-blue-600 text-white border-blue-500 shadow-xl text-lg px-6 py-4 rounded-3xl mb-8 border-2 ring-4 ring-blue-600/10";
      case 1: return "bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-blue-400 dark:border-blue-600 shadow-md text-base px-5 py-3 rounded-2xl mb-4 border-2";
      case 2: return "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 text-xs px-4 py-2 rounded-xl mb-2 border";
      default: return "bg-white dark:bg-black/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 text-xs px-3 py-1.5 rounded-lg mb-1 border";
    }
  };

  return (
    <div className="flex flex-col relative group/branch">
      {level > 0 && <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 group-hover/branch:bg-blue-400 transition-colors" />}
      <div className="flex items-start gap-2 relative">
        {level > 0 && <div className="absolute left-[-24px] top-[18px] w-6 h-px bg-slate-200 dark:bg-slate-800 group-hover/branch:bg-blue-400 transition-colors" />}
        <div 
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          className={`flex items-center gap-3 cursor-pointer transition-all duration-300 transform active:scale-95 select-none ${getLevelStyles(level)} ${isLongPressing ? 'opacity-50 scale-110 ring-4 ring-blue-500/30' : 'hover:scale-[1.02]'}`}
          onClick={() => hasBranches && setIsExpanded(!isExpanded)}
        >
          {hasBranches && <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}><ChevronRight size={level === 0 ? 20 : 16} className="opacity-70" /></div>}
          <span className={`font-black uppercase tracking-tight ${level > 1 ? 'tracking-wider' : ''}`}>{node.topic}</span>
          {hasBranches && !isExpanded && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-md">{node.branches?.length}</span>}
        </div>
      </div>
      {isExpanded && hasBranches && (
        <div className="ml-10 space-y-1 animate-in slide-in-from-left-2 duration-300">
          {node.branches?.map((branch: any, idx: number) => (
            <MindMapBranch key={idx} node={branch} level={level + 1} onAutoReply={onAutoReply} />
          ))}
        </div>
      )}
    </div>
  );
};

const SourceLink: React.FC<{ title: string; url: string }> = ({ title, url }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new CustomEvent('pakchat:confirm_link', {
      detail: { url, title }
    });
    window.dispatchEvent(event);
  };

  const shortName = useMemo(() => {
    if (title.startsWith('http')) {
        try { return new URL(title).hostname; } catch(e) { return 'Source'; }
    }
    return title.split(' - ')[0].split(' | ')[0].substring(0, 30);
  }, [title]);

  return (
    <button 
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-[11px] font-bold uppercase tracking-tight align-middle my-0.5"
    >
      <Link2 size={12} className="shrink-0" />
      <span className="truncate max-w-[150px]">{shortName}</span>
    </button>
  );
};

const VocabularyChip: React.FC<{ 
  text: string; 
  pinyin: string; 
  meaning: string; 
  urduMeaning?: string; 
  opinion?: string 
}> = ({ text, pinyin, meaning, urduMeaning, opinion }) => {
  const [showStrokes, setShowStrokes] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const strokeRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  const isChinese = /[\u4e00-\u9fa5]/.test(text);

  const getTones = (py: string) => {
    const toneMap: Record<string, string> = { 'ā': '1st', 'á': '2nd', 'ǎ': '3rd', 'à': '4th', 'ē': '1st', 'é': '2nd', 'ě': '3rd', 'è': '4th', 'ī': '1st', 'í': '2nd', 'ǐ': '3rd', 'ì': '4th', 'ō': '1st', 'ó': '2nd', 'ǒ': '3rd', 'ò': '4th', 'ū': '1st', 'ú': '2nd', 'ǔ': '3rd', 'ù': '4th', 'ǖ': '1st', 'ǘ': '2nd', 'ǚ': '3rd', 'ǜ': '4th' };
    const tones: string[] = [];
    py.split(' ').forEach(word => {
        let found = false;
        for (const char of word) {
            if (toneMap[char]) {
                tones.push(toneMap[char]);
                found = true;
                break;
            }
        }
        if (!found) tones.push('Neutral');
    });
    return tones.join(', ');
  };

  const tonesText = useMemo(() => getTones(pinyin), [pinyin]);

  useEffect(() => {
    const saveEvent = new CustomEvent('pakchat:save_word', {
      detail: {
        hanzi: text,
        pinyin: pinyin,
        meaning: meaning,
        urdu_meaning: urduMeaning,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(saveEvent);
  }, [text, pinyin, meaning, urduMeaning]);

  const initStrokes = () => {
    if (!isChinese || !strokeRef.current || writerRef.current) return;
    const HanziWriter = (window as any).HanziWriter;
    if (HanziWriter) {
        strokeRef.current.innerHTML = '';
        writerRef.current = HanziWriter.create(strokeRef.current, text[0], {
          width: 200,
          height: 200,
          padding: 10,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          strokeColor: '#3B82F6',
          outlineColor: '#f1f5f9',
          showOutline: true
        });
        writerRef.current.animateCharacter();
    }
  };

  useEffect(() => {
    if (showStrokes) setTimeout(initStrokes, 300);
  }, [showStrokes]);

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (isChinese) utterance.lang = 'zh-CN';
    else utterance.lang = 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(`${text} (${pinyin}) - ${meaning}`);
  };

  return (
    <div className="my-8 animate-in fade-in slide-in-from-top-4 duration-700 w-full max-w-2xl group/card">
        <div className="bg-white dark:bg-[#0c0c14] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
            
            <div className="p-8 sm:p-10">
                {/* Header section with term and pinyin */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-8">
                    <h4 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                      {text}
                    </h4>
                    <div className="flex items-center gap-3">
                       <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {pinyin}
                       </span>
                       <span className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-600 tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">HSK1 + 2</span>
                    </div>
                </div>

                {/* Definitions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-start mb-10">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">English Definition</span>
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-200 leading-tight">
                              {meaning}
                            </p>
                        </div>
                        {urduMeaning && (
                          <div className="space-y-1 border-t border-gray-50 dark:border-white/5 pt-4">
                             <span className="text-[9px] font-black uppercase text-emerald-500/60 tracking-[0.3em]">Urdu Context</span>
                             <p className="text-4xl font-black text-emerald-800 dark:text-emerald-400 font-serif leading-none mt-2 text-right" dir="rtl">
                               {urduMeaning}
                             </p>
                          </div>
                        )}
                    </div>

                    <div className="space-y-4 sm:border-l border-gray-50 dark:border-white/5 sm:pl-8">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">Tone Profile</span>
                            <p className="text-lg font-black text-blue-500 uppercase tracking-tighter">{tonesText}</p>
                        </div>
                        {opinion && (
                            <div className="space-y-1 pt-4 border-t border-gray-50 dark:border-white/5">
                                <span className="text-[9px] font-black uppercase text-purple-400 tracking-[0.3em]">Context Logic</span>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                  {opinion}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Core Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-50 dark:border-white/5">
                    <button onClick={handleSpeak} className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Volume2 size={16} className={isSpeaking ? 'animate-pulse text-blue-500' : ''} /> Play
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Copy size={16} /> Copy
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>

                {/* Handwriting Section Toggle */}
                {isChinese && (
                  <div className="mt-8">
                       <button 
                        onClick={() => setShowStrokes(!showStrokes)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                       >
                         {showStrokes ? <X size={20} /> : <PenTool size={20} />}
                         {showStrokes ? "Hide Calligraphy Guide" : "Practice This Word"}
                       </button>

                       {showStrokes && (
                          <div className="mt-8 p-10 bg-gray-50 dark:bg-black/40 rounded-[2.5rem] border-2 border-dashed border-blue-500/10 flex flex-col items-center animate-in zoom-in duration-500">
                              <div ref={strokeRef} className="bg-white rounded-[2rem] p-6 shadow-2xl" style={{ width: '200px', height: '200px' }} />
                              <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                                  <button onClick={() => writerRef.current?.animateCharacter()} className="flex-1 px-6 py-4 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-lg transition-all active:scale-95">
                                     <RotateCcw size={16} /> Replay
                                  </button>
                                  <button onClick={() => writerRef.current?.quiz()} className="flex-[2] px-6 py-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                                     <PenTool size={16} /> Writing Quiz
                                  </button>
                              </div>
                              <p className="mt-6 text-[9px] font-black uppercase text-gray-400 tracking-[0.4em]">Multi-Stroke Recognition Active</p>
                          </div>
                       )}
                  </div>
                )}
            </div>
        </div>
    </div>
  );
};

const MCQChoice: React.FC<{ label: string; isCorrect: boolean; onReply?: (text: string) => void }> = ({ label, isCorrect, onReply }) => {
  const [state, setState] = useState<'idle' | 'clicked'>('idle');
  
  const handleClick = () => {
    if (state !== 'idle' || !onReply) return;
    setState('clicked');
    onReply(label);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={state === 'clicked'}
      className={`flex items-center gap-4 w-full max-w-md px-6 py-4 mb-3 rounded-[1.2rem] border-2 transition-all transform active:scale-[0.98] ${
        state === 'clicked' 
        ? isCorrect 
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-400 ring-4 ring-emerald-500/10'
          : 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-400 ring-4 ring-red-500/10'
        : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:shadow-xl shadow-sm'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
          state === 'clicked' 
          ? isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          : 'bg-slate-100 dark:bg-white/5 text-slate-400'
      }`}>
        {state === 'clicked' 
            ? isCorrect ? <CheckCircle size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />
            : <div className="w-[12px] h-[12px] border-2 border-current rounded-full" />
        }
      </div>
      <span className={`text-base font-bold tracking-tight text-left flex-1 ${state === 'clicked' ? 'font-black' : ''}`}>{label}</span>
      {state === 'clicked' && (
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
      )}
    </button>
  );
};

const MindMapTool: React.FC<{ data: any; onReply?: (text: string) => void }> = ({ data, onReply }) => {
  const [displayMode, setDisplayMode] = useState<'closed' | 'inline' | 'fullscreen'>('closed');
  // Fix: Use 1 as initial value for zoom state to avoid 'used before its declaration' error
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleAutoReply = (topic: string) => {
    if (onReply) {
      onReply(`Agent, please explain "${topic}" in depth.`);
    }
  };

  if (!data) return null;

  if (displayMode === 'closed') {
    return (
      <div className="my-4 animate-in zoom-in duration-300">
        <button 
          onClick={() => setDisplayMode('inline')}
          className="flex items-center gap-4 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
            <BrainCircuit size={24} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black uppercase tracking-widest">Mind Map Ready</h4>
            <p className="text-[9px] font-bold text-white/70 uppercase">Click to expand overview</p>
          </div>
          <ArrowRight size={18} className="ml-2 opacity-50 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    );
  }

  const containerClasses = displayMode === 'fullscreen' 
    ? "fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
    : "my-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/20 overflow-hidden p-6 shadow-2xl transition-all relative min-h-[400px]";

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-50 border-b border-gray-50 dark:border-white/5 pb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
            <BrainCircuit size={22} />
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setDisplayMode(displayMode === 'fullscreen' ? 'inline' : 'fullscreen')} className="p-2.5 text-gray-400 hover:text-blue-600 rounded-xl transition-all">
             {displayMode === 'fullscreen' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
           </button>
           <button onClick={() => setDisplayMode('closed')} className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl transition-all">
             <X size={20} />
           </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden relative">
          <div 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 overflow-hidden cursor-${isDragging ? 'grabbing' : 'grab'} relative`}
          >
            <div 
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              className="min-w-fit h-full p-4"
            >
                <MindMapBranch node={data} level={0} onAutoReply={handleAutoReply} />
            </div>
          </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex justify-between items-center shrink-0 px-2">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <Layers size={10} /> Nexus Workspace Synthesis
          </span>
      </div>
    </div>
  );
};

export const SimpleMarkdown: React.FC<{ 
  content: string; 
  onReply?: (text: string) => void;
  isTutorContext?: boolean;
}> = ({ content, onReply, isTutorContext = false }) => {
  const parseContent = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /```json:mindmap\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      try { parts.push({ type: 'mindmap', content: JSON.parse(match[1]) }); } catch (e) { parts.push({ type: 'text', content: match[0] }); }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ type: 'text', content: text.substring(lastIndex) });
    return parts;
  };

  const cleanHeader = (text: string) => {
      return text.replace(/^\*+/, '').replace(/\*+$/, '').trim();
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\[Choice:.*?\]|\[Word:.*?\]|\[.*?\]\(.*?\)|==.*?==|\*\*.*?\*\*|\*.*?\*)/g);
    
    const isOnlyChoices = parts.every(p => !p.trim() || (p.startsWith('[Choice:') && p.endsWith(']')));
    const isOnlyWords = parts.every(p => !p.trim() || (p.startsWith('[Word:') && p.endsWith(']')));

    const renderedParts = parts.map((part, i) => {
      if (part.startsWith('[Choice:') && part.endsWith(']')) {
        const choiceData = part.slice(8, -1).split('|').map(s => s.trim());
        const choiceText = choiceData[0];
        const isCorrect = choiceData[1]?.toLowerCase() === 'true';

        if (isTutorContext) {
          return <MCQChoice key={i} label={choiceText} isCorrect={isCorrect} onReply={onReply} />;
        } else {
          return <span key={i} className="font-black text-blue-600 underline decoration-2 decoration-blue-500/30">{choiceText}</span>;
        }
      }
      if (part.startsWith('[Word:') && part.endsWith(']')) {
        const wordData = part.slice(6, -1).split('|').map(s => s.trim());
        
        if (isTutorContext) {
          return (
            <VocabularyChip 
              key={i} 
              text={wordData[0]} 
              pinyin={wordData[1] || ''} 
              meaning={wordData[2] || ''} 
              urduMeaning={wordData[3]}
              opinion={wordData[4]}
            />
          );
        } else {
          return (
            <strong key={i} className="text-blue-600 dark:text-blue-400 font-black">
               {wordData[0]} <span className="text-[10px] font-normal opacity-50 uppercase tracking-tighter">[{wordData[1]}]</span>
            </strong>
          );
        }
      }
      if (part.startsWith('[') && part.includes('](')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return <SourceLink key={i} title={match[1]} url={match[2]} />;
        }
      }
      if (part.startsWith('==') && part.endsWith('==')) {
        return <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 font-black mx-0.5 shadow-sm">{part.slice(2, -2)}</span>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-600 dark:text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });

    if (isTutorContext && (isOnlyChoices || isOnlyWords)) {
        return <div className="flex flex-col items-start w-full space-y-1">{renderedParts}</div>;
    }
    return renderedParts;
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine && line.length === 0) return <div key={i} className="h-2" />;
      
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-black mt-6 mb-3 text-teal-600 dark:text-teal-400 uppercase tracking-tight border-b border-gray-50 dark:border-white/5 pb-1">{renderInlineMarkdown(cleanHeader(line.replace('### ', '')))}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-black mt-8 mb-4 text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{renderInlineMarkdown(cleanHeader(line.replace('## ', '')))}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-black mt-10 mb-6 text-blue-700 dark:text-blue-400 uppercase tracking-widest border-b-2 border-blue-600 pb-2">{renderInlineMarkdown(cleanHeader(line.replace('# ', '')))}</h1>;
      }
      
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-3 ml-4 mb-2 group">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform shadow-sm" />
            <span className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{renderInlineMarkdown(line.replace(/^[-*]\s/, ''))}</span>
          </div>
        );
      }

      return (
        <p key={i} className="mb-4 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-bold">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <div className="simple-markdown-root w-full space-y-2">
      {parts.map((part, idx) => {
        if (part.type === 'mindmap') return <MindMapTool key={idx} data={part.content} onReply={onReply} />;
        return <div key={idx} className="prose-container max-w-none">{renderFormattedText(part.content as string)}</div>;
      })}
    </div>
  );
};