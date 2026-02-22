import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, AudioNote } from '../types';
import { SimpleMarkdown } from './SimpleMarkdown';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Download, Share2, Edit2, Play, Pause, Copy, RotateCcw, Volume2, Globe, Check, Mic, Headset, FileText, X, MoreHorizontal, BrainCircuit, ChevronDown, MessageSquare, Loader2, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void; 
  onReply?: (content: string) => void;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  onRemoveAudioNote?: (messageId: string, noteId: string) => void;
  onAudioNotePlayed?: (messageId: string, noteId: string) => void;
  language?: string;
  isTutorContext?: boolean;
}

// --- AUDIO UTILS FOR RAW PCM & WAV EXPORT ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); 
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false); 
  view.setUint32(12, 0x666d7420, false); 
  view.setUint16(16, 16, true); 
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  view.setUint32(36, 0x64617461, false); 
  view.setUint32(40, pcmData.length, true);
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
}

const AudioPlayer: React.FC<{ 
  base64OrUrl: string; 
  isUser: boolean; 
  label?: string; 
  timestamp?: number;
  onRemove?: () => void;
  onStartPlaying?: () => void;
}> = ({ base64OrUrl, isUser, label = "Audio Content", timestamp, onRemove, onStartPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const isNativeBlob = base64OrUrl.startsWith('blob:') || base64OrUrl.startsWith('data:audio/webm');

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const creationTime = useMemo(() => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [timestamp]);

  const waveformBars = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < base64OrUrl.length; i++) {
        hash = ((hash << 5) - hash) + base64OrUrl.charCodeAt(i);
        hash |= 0; 
    }
    const bars = [];
    for (let i = 0; i < 30; i++) {
        const height = 4 + (Math.abs((hash + i * 1117) % 16));
        bars.push(height);
    }
    return bars;
  }, [base64OrUrl]);

  useEffect(() => {
    if (isNativeBlob) {
        const audio = new Audio(base64OrUrl);
        audio.onloadedmetadata = () => setDuration(audio.duration);
        nativeAudioRef.current = audio;
    } else {
        initAudio();
    }
    return () => stopPlayback();
  }, [base64OrUrl]);

  const initAudio = async () => {
    if (audioBufferRef.current) return audioBufferRef.current;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    try {
      const rawData = base64OrUrl.includes(',') ? base64OrUrl.split(',')[1] : base64OrUrl;
      const decodedData = decode(rawData);
      const buffer = await decodeAudioData(decodedData, ctx, 24000, 1);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      return buffer;
    } catch (e) {
      console.error("Audio initialization failed", e);
      return null;
    }
  };

  const startPlayback = async (startFromOffset?: number) => {
    if (onStartPlaying) onStartPlaying();

    if (isNativeBlob && nativeAudioRef.current) {
        nativeAudioRef.current.onended = () => { setIsPlaying(false); setProgress(0); };
        nativeAudioRef.current.ontimeupdate = () => {
            if (nativeAudioRef.current && !isDragging) {
                const p = (nativeAudioRef.current.currentTime / (nativeAudioRef.current.duration || 1)) * 100;
                setProgress(p);
            }
        };
        nativeAudioRef.current.play();
        setIsPlaying(true);
        return;
    }

    const buffer = await initAudio();
    if (!buffer || !audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setIsPlaying(false);
        setProgress(0);
        offsetRef.current = 0;
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    const startAt = startFromOffset !== undefined ? startFromOffset : offsetRef.current;
    source.start(0, startAt);
    startTimeRef.current = audioContextRef.current.currentTime - startAt;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (audioContextRef.current && audioBufferRef.current && !isDragging) {
        const current = audioContextRef.current.currentTime - startTimeRef.current;
        const currentProgress = (current / audioBufferRef.current.duration) * 100;
        if (currentProgress >= 100) {
            setProgress(0); setIsPlaying(false); offsetRef.current = 0;
            if (timerRef.current) clearInterval(timerRef.current);
        } else { setProgress(currentProgress); }
      }
    }, 50);
  };

  const stopPlayback = () => {
    if (isNativeBlob) {
        nativeAudioRef.current?.pause();
        setIsPlaying(false);
        return;
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.onended = null; sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (!isNativeBlob && audioContextRef.current) {
        offsetRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      }
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleScrub = (clientX: number) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newProgress = (x / rect.width) * 100;
    setProgress(newProgress);
    
    const newOffset = (newProgress / 100) * duration;
    offsetRef.current = newOffset;

    if (isNativeBlob && nativeAudioRef.current) {
        nativeAudioRef.current.currentTime = newOffset;
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleScrub(e.clientX);
    if (isPlaying) stopPlayback();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleScrub(e.clientX);
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (isPlaying) startPlayback(offsetRef.current);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isPlaying, duration]);

  const handleDownload = () => {
    if (isNativeBlob) {
        const link = document.createElement('a');
        link.href = base64OrUrl;
        link.download = `pakchat-voice-${Date.now()}.webm`;
        link.click();
        return;
    }
    try {
      const rawData = base64OrUrl.includes(',') ? base64OrUrl.split(',')[1] : base64OrUrl;
      const pcmBytes = decode(rawData);
      const wavBlob = createWavBlob(pcmBytes, 24000);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pakchat-ai-voice-${Date.now()}.wav`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("Download failed", e); }
  };

  return (
    <div className={`flex flex-col p-3 rounded-2xl ${isUser ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg shadow-black/5'} w-full max-w-[280px] sm:max-w-[320px] group/player animate-in fade-in slide-in-from-bottom-2`}>
      <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest truncate max-w-[200px]">{label}</span>
          {onRemove && <button onClick={onRemove} className="text-gray-200 hover:text-red-500 transition-all" title="Remove"><X size={12} /></button>}
      </div>
      <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay} 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all active:scale-90 shadow-md shadow-blue-600/20 flex-shrink-0"
          >
            {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div 
              ref={scrubberRef}
              onMouseDown={onMouseDown}
              className="h-6 flex items-center gap-[2px] relative cursor-pointer group/scrub"
            >
              {waveformBars.map((h, i) => {
                const barPercent = (i / waveformBars.length) * 100;
                const isPlayed = progress >= barPercent;
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-colors duration-200 ${isPlayed ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
              
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-5 w-[2px] bg-blue-500 z-10"
                style={{ left: `${progress}%` }}
              >
                  <div className="absolute top-[-3px] left-[-3px] w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg ring-1 ring-white dark:ring-gray-800" />
              </div>
            </div>
          </div>
      </div>

      <div className="flex justify-between items-center mt-1.5 px-0.5">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono tracking-tighter">
                {formatTime((progress/100) * duration)}
             </span>
             <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{creationTime}</span>
              <button onClick={handleDownload} className="text-gray-300 hover:text-blue-500 transition-colors" title="Download"><Download size={12} /></button>
          </div>
      </div>
    </div>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
    message, isLast, onEdit, onRegenerate, onReply, onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare, onRemoveAudioNote, onAudioNotePlayed, language = 'English', isTutorContext = false
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isProcessing = message.isProcessing;
  
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [showReadMenu, setShowReadMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  const readRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex w-full max-w-full ${isUser ? 'justify-end' : 'justify-start'} group px-1 mb-6 relative`}>
      <div className={`flex max-w-full w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end max-w-[85%]' : 'items-start max-w-[98%] w-full'}`}>
            <div className={`relative text-sm leading-relaxed overflow-hidden break-words transition-all duration-300 ${
                isUser 
                ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-3xl rounded-tr-none px-5 py-4 shadow-md border border-white/10' 
                : 'bg-transparent text-gray-800 dark:text-gray-100 w-full'
            }`}>
                {isEditing ? (
                  <div className="space-y-3 min-w-[280px]">
                    <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" rows={3} autoFocus />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white uppercase">Cancel</button>
                      <button onClick={() => { onEdit(message.id, editValue); setIsEditing(false); }} className="px-4 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white uppercase shadow-lg active:scale-95 transition-all">Submit</button>
                    </div>
                  </div>
                ) : (
                  <div className={`${isUser ? 'text-white font-medium' : 'text-gray-800 dark:text-gray-200'}`}>
                      {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <SimpleMarkdown content={message.content} onReply={onReply} isTutorContext={isTutorContext} />}
                  </div>
                )}
                
                {isProcessing && (
                  <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-pulse transition-all">
                     <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"><Sparkles size={16} className="animate-spin" /></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{message.processingLabel || 'Neural Processing...'}</span>
                  </div>
                )}

                {isLast && message.isStreaming && !isUser && <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle"></span>}
                
                {message.audioNotes && message.audioNotes.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3">
                    {message.audioNotes.map((note) => (
                      <AudioPlayer 
                        key={note.id} 
                        base64OrUrl={note.url} 
                        isUser={isUser} 
                        label={note.label} 
                        timestamp={note.timestamp}
                        onRemove={() => onRemoveAudioNote?.(message.id, note.id)} 
                        onStartPlaying={() => onAudioNotePlayed?.(message.id, note.id)}
                      />
                    ))}
                  </div>
                )}

                {!isUser && !message.isStreaming && message.hints && message.hints.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {message.hints.map((hint, idx) => (
                      <button key={idx} onClick={() => onReply?.(hint)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-all text-xs font-bold shadow-sm"><MessageSquare size={12} />{hint}</button>
                    ))}
                  </div>
                )}
            </div>

            {/* ACTION TOOLBAR */}
            {!isUser && !isError && !message.isStreaming && !isEditing && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl shadow-sm border border-transparent">
                      {isCopied ? '✓' : <Copy size={12} />} Copy
                    </button>
                    
                    <div className="relative" ref={readRef}>
                        <button onClick={() => setShowReadMenu(!showReadMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl shadow-sm border ${showReadMenu ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 border-transparent dark:hover:bg-blue-900/20'}`}>
                            <Volume2 size={12} /> Read <ChevronDown size={10} className={`transition-transform duration-200 ${showReadMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showReadMenu && (
                            <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] p-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => { onReadAloud?.(message.id); setShowReadMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 flex items-center gap-3 rounded-xl transition-colors">
                                    <Volume2 size={14} /> Read Aloud (V-Note)
                                </button>
                                <div className="h-px bg-gray-50 dark:bg-gray-700 my-1 mx-2" />
                                <button onClick={() => { onAudioOverview?.(message.id); setShowReadMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center gap-3 rounded-xl transition-colors">
                                    <Headset size={14} /> Audio Overview (V-Note)
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={translateRef}>
                        <button onClick={() => setShowTranslateMenu(!showTranslateMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl shadow-sm border ${showTranslateMenu ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border-transparent dark:hover:bg-blue-900/20'}`}>
                            <Globe size={12} /> Translate <ChevronDown size={10} className={`transition-transform duration-200 ${showTranslateMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showTranslateMenu && (
                            <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] p-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="max-h-64 overflow-y-auto no-scrollbar p-1 space-y-0.5">
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <button key={lang.code} onClick={() => { onTranslate?.(message.id, lang.name); setShowTranslateMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-600 rounded-xl transition-colors">{lang.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={moreRef}>
                        <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl shadow-sm border ${showMoreMenu ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'}`}>
                            <MoreHorizontal size={14} />
                        </button>
                        {showMoreMenu && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] p-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="p-0.5 space-y-0.5">
                                    <button onClick={() => { onMindMap?.(message.id); setShowMoreMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-4 rounded-xl transition-colors border border-transparent hover:border-indigo-100">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl shadow-sm"><BrainCircuit size={16} /></div> Mind Map
                                    </button>
                                    <div className="h-px bg-gray-50 dark:bg-gray-700 my-1 mx-2" />
                                    <button onClick={() => { onShare?.(message.id); setShowMoreMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-4 rounded-xl transition-colors">
                                        <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl shadow-sm"><Share2 size={16} /></div> Share
                                    </button>
                                    <button onClick={() => { onRegenerate?.(message.id); setShowMoreMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 flex items-center gap-4 rounded-xl transition-colors">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl shadow-sm"><RotateCcw size={16} /></div> Redo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
