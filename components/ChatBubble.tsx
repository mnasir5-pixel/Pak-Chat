import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, AudioNote } from '../types';
import { SimpleMarkdown } from './SimpleMarkdown';
import { SUPPORTED_LANGUAGES } from '../constants';
import { 
    Download, Share2, Edit2, Play, Pause, Copy, RotateCcw, 
    Volume2, Globe, Check, Mic, Headset, FileText, X, 
    MoreVertical, BrainCircuit, ChevronDown, MessageSquare, 
    Loader2, Sparkles, Reply, FileOutput, Languages, Trash2
} from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void; 
  onReply?: (content: string) => void;
  onTranslate?: (id: string, targetLang: string) => void;
  onAudioAction?: (id: string, type: 'speak' | 'overview') => void;
  onDownloadDoc?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  onRemoveAudioNote?: (messageId: string, noteId: string) => void;
  onAudioNotePlayed?: (messageId: string, noteId: string) => void;
  onSaveWord?: (word: SavedWord) => void;
  language?: string;
  isTutorContext?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
    message, isLast, onEdit, onRegenerate, onReply, onTranslate, onAudioAction, onDownloadDoc, onMindMap, onShare, onRemoveAudioNote, onAudioNotePlayed, onSaveWord, language = 'English', isTutorContext = false
}) => {
  const isUser = message.role === 'user';
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSavingWord, setIsSavingWord] = useState(false);

  const handleSaveWord = () => {
      if (!onSaveWord) return;
      const word: SavedWord = {
          hanzi: message.content.substring(0, 10).trim(),
          pinyin: "...",
          meaning: message.content.substring(0, 50).trim() + "...",
          timestamp: Date.now()
      };
      onSaveWord(word);
      setIsSavingWord(true);
      setTimeout(() => setIsSavingWord(false), 2000);
  };

  const isRTL = useMemo(() => {
    const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(message.content);
  }, [message.content]);

  const menuRef = useRef<HTMLDivElement>(null);
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setShowMoreMenu(false);
      if (audioMenuRef.current && !audioMenuRef.current.contains(target)) setShowAudioMenu(false);
      if (translateRef.current && !translateRef.current.contains(target)) setShowTranslateMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setShowMoreMenu(false);
    setShowAudioMenu(false);
    setShowTranslateMenu(false);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group mb-6 relative px-2`}>
      <div className={`flex max-w-full w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? 'items-end max-w-[90%]' : 'items-start max-w-[98%] w-full'}`}>
            <div className={`relative text-sm leading-relaxed overflow-hidden break-words transition-all duration-300 ${
                isUser 
                ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-[1.5rem] rounded-tr-none px-4 py-3 shadow-md border border-white/10' 
                : 'bg-transparent text-gray-800 dark:text-gray-100 w-full'
            }`}>
                {isEditing ? (
                  <div className="space-y-3 min-w-[260px]">
                    <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm outline-none font-bold" rows={3} autoFocus />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest">Cancel</button>
                      <button onClick={() => { onEdit(message.id, editValue); setIsEditing(false); }} className="px-4 py-1.5 bg-blue-600 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">Update</button>
                    </div>
                  </div>
                ) : (
                  <div className={`${isUser ? 'text-white font-bold' : 'text-gray-800 dark:text-gray-200'} ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                      {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <SimpleMarkdown content={message.content} onReply={onReply} isTutorContext={isTutorContext} />}
                  </div>
                )}
                
                {message.isProcessing && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-pulse">
                     <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"><Sparkles size={14} className="animate-spin" /></div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                         {message.processingLabel || "Processing..."}
                     </span>
                  </div>
                )}

                {message.audioNotes?.map(note => (
                    <div key={note.id} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shrink-0">
                               <Volume2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 mb-1">Audio Archive</p>
                               <audio 
                                 src={note.url} 
                                 controls 
                                 className="h-8 w-full filter dark:invert opacity-90 scale-95 origin-left" 
                                 onPlay={() => onAudioNotePlayed?.(message.id, note.id)}
                               />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 px-1 sm:px-0">
                           <a href={note.url} download={`${note.label}.wav`} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Download size={16} /></a>
                           {onRemoveAudioNote && (
                             <button onClick={() => onRemoveAudioNote(message.id, note.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                           )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`flex flex-wrap items-center gap-1 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'} relative z-20`}>
                {!isUser && !message.isStreaming && (
                    <div className="flex flex-wrap items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { navigator.clipboard.writeText(message.content); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-transparent">
                          {isCopied ? '✓' : <Copy size={12} />} Copy
                        </button>
                        
                        <div className="relative" ref={translateRef}>
                            <button onClick={() => setShowTranslateMenu(!showTranslateMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border border-transparent ${showTranslateMenu ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}`}>
                                <Globe size={12} /> Translate
                            </button>
                            {showTranslateMenu && (
                                <div className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:left-0 sm:right-auto sm:mt-2 w-full sm:w-48 bg-white dark:bg-[#121218] border-t sm:border border-gray-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-xl shadow-2xl z-[500] p-6 sm:p-1 overflow-hidden animate-in slide-in-from-bottom duration-300">
                                    <div className="flex sm:hidden justify-between items-center mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Target Language</h3>
                                        <button onClick={() => setShowTranslateMenu(false)} className="p-2 text-gray-400 hover:text-red-500"><X size={22}/></button>
                                    </div>
                                    <div className="max-h-64 sm:max-h-80 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0.5">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <button key={lang.code} onClick={() => handleAction(() => onTranslate?.(message.id, lang.name))} className="w-full text-left px-4 py-3 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-colors">
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={audioMenuRef}>
                            <button onClick={() => setShowAudioMenu(!showAudioMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border border-transparent ${showAudioMenu ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}>
                                <Headset size={12} /> Audio Hub
                            </button>
                            {showAudioMenu && (
                                <div className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:right-auto sm:mt-2 w-full sm:w-48 bg-white dark:bg-[#121218] border-t sm:border border-gray-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-xl shadow-2xl z-[500] p-6 sm:p-1 overflow-hidden animate-in slide-in-from-bottom duration-300">
                                    <div className="flex sm:hidden items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-600 text-white rounded-lg"><Volume2 size={20}/></div>
                                            <h3 className="text-xs font-black uppercase tracking-widest">Audio Synthesis</h3>
                                        </div>
                                        <button onClick={() => setShowAudioMenu(false)} className="p-2 text-gray-400"><X size={22} /></button>
                                    </div>
                                    <div className="space-y-1 sm:space-y-0.5">
                                        <button onClick={() => handleAction(() => onAudioAction?.(message.id, 'speak'))} className="w-full text-left px-5 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center gap-3 rounded-xl transition-colors">
                                            <Volume2 size={16} className="text-blue-500" /> Narrate
                                        </button>
                                        <button onClick={() => handleAction(() => onAudioAction?.(message.id, 'overview'))} className="w-full text-left px-5 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center gap-3 rounded-xl transition-colors">
                                            <Sparkles size={16} className="text-teal-500" /> Overview
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`p-1.5 rounded-xl transition-all ${showMoreMenu ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                <MoreVertical size={18} />
                            </button>
                            {showMoreMenu && (
                                <div className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full right-0 left-0 sm:left-auto sm:mt-2 w-full sm:w-56 bg-white dark:bg-[#121218] border-t border-gray-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-xl shadow-2xl z-[500] p-6 sm:p-1 overflow-hidden animate-in slide-in-from-bottom duration-300">
                                    <div className="flex sm:hidden justify-between items-center mb-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Action Module</h3>
                                        <button onClick={() => setShowMoreMenu(false)} className="p-2 text-gray-400"><X size={22}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0.5">
                                        {isTutorContext && (
                                            <button onClick={() => handleAction(handleSaveWord)} className={`w-full text-left px-4 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-3 rounded-xl transition-colors ${isSavingWord ? 'text-green-500 bg-green-50 dark:bg-green-900/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                                {isSavingWord ? <Check size={16} /> : <BookOpen size={16} className="text-blue-500" />} {isSavingWord ? 'Saved' : 'Save Word'}
                                            </button>
                                        )}
                                        <button onClick={() => handleAction(() => onDownloadDoc?.(message.id))} className="w-full text-left px-4 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 rounded-xl transition-colors"><FileOutput size={16} className="text-blue-500" /> Export</button>
                                        <button onClick={() => handleAction(() => onRegenerate?.(message.id))} className="w-full text-left px-4 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 rounded-xl transition-colors"><RotateCcw size={16} className="text-orange-500" /> Redo</button>
                                        <button onClick={() => handleAction(() => onMindMap?.(message.id))} className="w-full text-left px-4 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 rounded-xl transition-colors"><BrainCircuit size={16} className="text-indigo-500" /> Map</button>
                                        <button onClick={() => handleAction(() => onShare?.(message.id))} className="w-full text-left px-4 py-4 sm:py-2.5 text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 rounded-xl transition-colors"><Share2 size={16} className="text-gray-400" /> Share</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isUser && !isEditing && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { navigator.clipboard.writeText(message.content); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }} className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-all bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-transparent">{isCopied ? '✓' : <Copy size={11} />}</button>
                        <button onClick={() => setIsEditing(true)} className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-all bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-transparent"><Edit2 size={11} /></button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
