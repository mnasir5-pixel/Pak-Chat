import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, Maximize2, 
  PencilLine, X, ArrowRight,
  Link2, CheckCircle, Volume2, Sparkles, Minimize2, BrainCircuit, Layers, MousePointer2, Hand,
  RotateCcw, PenTool
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
      case 0: return "bg-blue-600 text-white border-blue-500 shadow-xl text-base sm:text-lg px-4 sm:px-6 py-2.5 sm:py-4 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border-2";
      case 1: return "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm text-sm sm:text-base px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border";
      case 2: return "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 text-[10px] sm:text-xs px-3 py-1.5 rounded-lg mb-2 border";
      default: return "bg-white dark:bg-black/10 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5 text-[9px] sm:text-xs px-2 py-1 rounded-md mb-1 border opacity-80";
    }
  };

  return (
    <div className="flex flex-col relative group/branch">
      {level > 0 && <div className="absolute left-[-16px] sm:left-[-24px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />}
      <div className="flex items-start gap-1.5 sm:gap-2 relative">
        {level > 0 && <div className="absolute left-[-16px] sm:left-[-24px] top-[14px] sm:top-[18px] w-4 sm:w-6 h-px bg-slate-200 dark:bg-slate-800" />}
        <div 
          onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
          className={`flex items-center gap-2 sm:gap-3 cursor-pointer transition-all duration-300 transform active:scale-95 select-none ${getLevelStyles(level)} ${isLongPressing ? 'opacity-40 scale-105' : 'hover:scale-[1.02]'}`}
          onClick={() => hasBranches && setIsExpanded(!isExpanded)}
        >
          {hasBranches && <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}><ChevronRight size={level === 0 ? 18 : 14} className="opacity-70" /></div>}
          <span className={`font-black uppercase tracking-tight ${level > 1 ? 'tracking-wider' : ''}`}>{node.topic}</span>
        </div>
      </div>
      {isExpanded && hasBranches && (
        <div className="ml-6 sm:ml-10 space-y-1 animate-in slide-in-from-left-2">
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
    window.dispatchEvent(new CustomEvent('pakchat:confirm_link', { detail: { url, title } }));
  };
  const shortName = useMemo(() => {
    if (title.startsWith('http')) { try { return new URL(title).hostname; } catch(e) { return 'Source'; } }
    return title.split(' - ')[0].split(' | ')[0].substring(0, 25);
  }, [title]);
  return (
    <button onClick={handleClick} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all text-[10px] font-black uppercase tracking-tighter align-middle my-0.5 max-w-[140px] truncate">
      <Link2 size={10} className="shrink-0 opacity-50" /> {shortName}
    </button>
  );
};

const VocabularyChip: React.FC<{ text: string; pinyin: string; meaning: string; urduMeaning?: string; opinion?: string }> = ({ text, pinyin, meaning, urduMeaning, opinion }) => {
  const [showStrokes, setShowStrokes] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const strokeRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const isChinese = /[\u4e00-\u9fa5]/.test(text);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pakchat:save_word', { detail: { hanzi: text, pinyin, meaning, urdu_meaning: urduMeaning, timestamp: Date.now() } }));
  }, [text, pinyin, meaning, urduMeaning]);

  const initStrokes = () => {
    if (!isChinese || !strokeRef.current || writerRef.current) return;
    const HW = (window as any).HanziWriter;
    if (HW) {
        strokeRef.current.innerHTML = '';
        writerRef.current = HW.create(strokeRef.current, text[0], { width: 140, height: 140, padding: 5, strokeAnimationSpeed: 1, delayBetweenStrokes: 200, strokeColor: '#3B82F6', outlineColor: '#eee', showOutline: true });
        writerRef.current.animateCharacter();
    }
  };

  useEffect(() => { if (showStrokes) setTimeout(initStrokes, 200); }, [showStrokes]);

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = isChinese ? 'zh-CN' : 'en-US';
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="my-5 animate-in fade-in slide-in-from-top-1 w-full max-w-xl">
        <div className="bg-white dark:bg-black/20 border-l-4 border-blue-500 rounded-r-2xl overflow-hidden p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5 transition-all hover:shadow-md group/chip">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-5">
                <h4 className={`font-black text-slate-900 dark:text-white tracking-tighter ${isChinese ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-4xl'}`}>{text}</h4>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">{pinyin}</span>
                   <button onClick={handleSpeak} className={`p-2.5 rounded-full shadow-md transition-all active:scale-75 ${isSpeaking ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-slate-400 hover:text-blue-600'}`}><Volume2 size={18} /></button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Definition</span>
                    <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 leading-tight">{meaning}</p>
                </div>
                {urduMeaning && (
                  <div className="text-right border-r sm:border-r-0 sm:border-l border-slate-100 dark:border-white/5 px-3" dir="rtl">
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest" dir="ltr">اردو معنی</span>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none font-serif mt-1">{urduMeaning}</p>
                  </div>
                )}
            </div>
            {isChinese && (
              <div className="mt-5">
                   <button onClick={() => setShowStrokes(!showStrokes)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-50 transition-all shadow-xs"><PencilLine size={14} /> Strokes</button>
                   {showStrokes && (
                      <div className="mt-4 p-5 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center shadow-lg animate-in zoom-in duration-300">
                          <div ref={strokeRef} className="bg-white rounded-lg p-2 shadow-inner" style={{ width: '140px', height: '140px' }} />
                          <div className="mt-4 flex gap-2">
                              <button onClick={() => writerRef.current?.animateCharacter()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">Replay</button>
                              <button onClick={() => writerRef.current?.quiz()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">Quiz</button>
                          </div>
                      </div>
                   )}
              </div>
            )}
        </div>
    </div>
  );
};

const MCQChoice: React.FC<{ label: string; isCorrect: boolean; onReply?: (text: string) => void }> = ({ label, isCorrect, onReply }) => {
  const [state, setState] = useState<'idle' | 'clicked'>('idle');
  const handleClick = () => { if (state !== 'idle' || !onReply) return; setState('clicked'); onReply(label); };
  return (
    <button onClick={handleClick} disabled={state === 'clicked'} className={`flex items-center gap-3 w-full max-w-md px-4 py-3 mb-2 rounded-xl border-2 transition-all transform active:scale-[0.98] ${state === 'clicked' ? isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:border-blue-400 shadow-xs'}`}>
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${state === 'clicked' ? isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-300'}`}>{state === 'clicked' ? isCorrect ? <CheckCircle size={14} /> : <X size={14} /> : <div className="w-2 h-2 border border-current rounded-full" />}</div>
      <span className={`text-xs sm:text-sm font-bold tracking-tight text-left flex-1 ${state === 'clicked' ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </button>
  );
};

export const SimpleMarkdown: React.FC<{ content: string; onReply?: (text: string) => void; isTutorContext?: boolean }> = ({ content, onReply, isTutorContext = false }) => {
  const parseContent = (text: string) => {
    const parts = []; let lastIndex = 0; const regex = /```json:mindmap\n([\s\S]*?)```/g; let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      try { parts.push({ type: 'mindmap', content: JSON.parse(match[1]) }); } catch (e) { parts.push({ type: 'text', content: match[0] }); }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ type: 'text', content: text.substring(lastIndex) });
    return parts;
  };
  const cleanHeader = (text: string) => text.replace(/^\*+/, '').replace(/\*+$/, '').trim();
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\[Choice:.*?\]|\[Word:.*?\]|\[.*?\]\(.*?\)|==.*?==|\*\*.*?\*\*|\*.*?\*)/g);
    const isOnlyChoices = parts.every(p => !p.trim() || (p.startsWith('[Choice:') && p.endsWith(']')));
    const isOnlyWords = parts.every(p => !p.trim() || (p.startsWith('[Word:') && p.endsWith(']')));
    const renderedParts = parts.map((part, i) => {
      if (part.startsWith('[Choice:') && part.endsWith(']')) {
        const d = part.slice(8, -1).split('|').map(s => s.trim());
        return isTutorContext ? <MCQChoice key={i} label={d[0]} isCorrect={d[1]?.toLowerCase() === 'true'} onReply={onReply} /> : <span key={i} className="font-black text-blue-600 underline">{d[0]}</span>;
      }
      if (part.startsWith('[Word:') && part.endsWith(']')) {
        const d = part.slice(6, -1).split('|').map(s => s.trim());
        return isTutorContext ? <VocabularyChip key={i} text={d[0]} pinyin={d[1] || ''} meaning={d[2] || ''} urduMeaning={d[3]} opinion={d[4]} /> : <strong key={i} className="text-blue-600 dark:text-blue-400 font-black">{d[0]} <span className="text-[10px] font-normal opacity-50">[{d[1]}]</span></strong>;
      }
      if (part.startsWith('[') && part.includes('](')) { const m = part.match(/\[(.*?)\]\((.*?)\)/); if (m) return <SourceLink key={i} title={m[1]} url={m[2]} />; }
      if (part.startsWith('==') && part.endsWith('==')) return <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-black mx-0.5 shadow-xs">{part.slice(2, -2)}</span>;
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-black text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-slate-500 dark:text-slate-400 opacity-90">{part.slice(1, -1)}</em>;
      return part;
    });
    return isTutorContext && (isOnlyChoices || isOnlyWords) ? <div className="flex flex-col items-start w-full space-y-1">{renderedParts}</div> : renderedParts;
  };
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim(); if (!t && line.length === 0) return <div key={i} className="h-1.5" />;
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm sm:text-base font-black mt-4 mb-2 text-teal-600 dark:text-teal-400 uppercase tracking-tight border-b border-gray-50 dark:border-white/5 pb-1">{renderInlineMarkdown(cleanHeader(line.replace('### ', '')))}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base sm:text-xl font-black mt-6 mb-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{renderInlineMarkdown(cleanHeader(line.replace('## ', '')))}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg sm:text-2xl font-black mt-8 mb-4 text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b-2 border-blue-600/30 pb-2">{renderInlineMarkdown(cleanHeader(line.replace('# ', '')))}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex items-start gap-2 ml-3 mb-1.5 opacity-90"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-xs" /><span className="text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm leading-relaxed">{renderInlineMarkdown(line.replace(/^[-*]\s/, ''))}</span></div>;
      return <p key={i} className="mb-3 leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold opacity-100">{renderInlineMarkdown(line)}</p>;
    });
  };
  const parts = useMemo(() => parseContent(content), [content]);
  return (
    <div className="simple-markdown-root w-full space-y-1">
      {parts.map((p, idx) => p.type === 'mindmap' ? <MindMapTool key={idx} data={p.content} onReply={onReply} /> : <div key={idx} className="prose-container max-w-none">{renderFormattedText(p.content as string)}</div>)}
    </div>
  );
};

const MindMapTool: React.FC<{ data: any; onReply?: (text: string) => void }> = ({ data, onReply }) => {
  const [displayMode, setDisplayMode] = useState<'closed' | 'inline' | 'fullscreen'>('closed');
  if (!data) return null;
  if (displayMode === 'closed') {
    return (
      <div className="my-4">
        <button onClick={() => setDisplayMode('inline')} className="flex items-center gap-3 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 group">
          <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform"><BrainCircuit size={18} /></div>
          <div className="text-left"><h4 className="text-[10px] font-black uppercase tracking-widest">Mind Map Ready</h4><p className="text-[8px] font-bold text-white/60 uppercase">Click to expand</p></div>
        </button>
      </div>
    );
  }
  return (
    <div className={displayMode === 'fullscreen' ? "fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col p-4" : "my-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-black/20 p-4 shadow-xl relative min-h-[350px] flex flex-col"}>
      <div className="flex items-center justify-between mb-4 border-b border-gray-50 dark:border-white/5 pb-2 shrink-0">
        <div className="flex items-center gap-2"><div className="p-1.5 bg-blue-600 text-white rounded-lg"><BrainCircuit size={16} /></div><span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Synthesis Map</span></div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDisplayMode(displayMode === 'fullscreen' ? 'inline' : 'fullscreen')} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">{displayMode === 'fullscreen' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
          <button onClick={() => setDisplayMode('closed')} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar no-scrollbar p-2">
         <MindMapBranch node={data} level={0} onAutoReply={(t) => onReply?.(`Explain "${t}" in detail.`)} />
      </div>
    </div>
  );
};
