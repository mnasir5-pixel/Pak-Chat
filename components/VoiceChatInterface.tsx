import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LoadingState, AudioNote } from '../types';
import { 
  Mic, Send, MoreVertical, Zap, Plus, X, Play, Pause, 
  Menu, Copy, RotateCcw, MessageSquare, Volume2, 
  Square, Globe, Check, BookOpen, Share2, Settings
} from 'lucide-react';
import { SimpleMarkdown } from './SimpleMarkdown';
import { MessageList } from './MessageList';
import { ChatService } from '../services/geminiService';

interface VoiceChatInterfaceProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  onSendMessage: (content: string, audio?: Blob) => void;
  onRegenerate: (id: string) => void;
  onTranslate: (id: string, targetLang: string) => void;
  onStartLive: () => void;
  onBack: () => void; 
  onMenuClick: () => void; 
  language: string;
  onConfigure?: () => void;
  onDictionaryClick?: () => void;
  onLanguageClick: () => void;
  onNewSession?: () => void;
  onShareClick?: () => void;
  // Shared Actions
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  onRemoveAudioNote?: (messageId: string, noteId: string) => void;
  onAudioNotePlayed?: (messageId: string, noteId: string) => void;
}

export const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ 
  messages: externalMessages, 
  loadingState: externalLoadingState, 
  onSendMessage, 
  onRegenerate,
  onTranslate,
  onStartLive, 
  onBack,
  onMenuClick,
  language,
  onConfigure,
  onDictionaryClick,
  onLanguageClick,
  onNewSession,
  onShareClick,
  onReadAloud, onAudioOverview, onMindMap, onShare, onRemoveAudioNote, onAudioNotePlayed
}) => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatServiceRef = useRef<ChatService | null>(null);

  const getSystemPrompt = (lang: string) => `You are the "Voice Interactive Module". Focus on audio-friendly responses. IMPORTANT: Respond in ${lang}. Output ONLY 3 hints at the end using ### HINTS: format.`;

  useEffect(() => {
    chatServiceRef.current = new ChatService(getSystemPrompt(language));
  }, [language]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoiceSend = async (content: string, audio?: Blob) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now(),
      attachmentUrl: audio ? URL.createObjectURL(audio) : undefined,
      attachmentType: audio ? audio.type : undefined
    };

    setLocalMessages(prev => [...prev, userMsg]);
    setLoading('loading');

    try {
      const botMsgId = (Date.now() + 1).toString();
      setLocalMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setLoading('streaming');

      let fullResponse = '';
      const stream = await chatServiceRef.current!.sendMessageStream(content);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setLocalMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullResponse } : m));
      }

      let finalContent = fullResponse;
      let hints: string[] = [];
      if (fullResponse.includes("### HINTS:")) {
          const parts = fullResponse.split("### HINTS:");
          finalContent = parts[0].trim();
          hints = parts[1].split('\n').map(h => h.replace(/^[-*•\d.]+\s*/, '').trim()).filter(h => h.length > 0).slice(0, 3);
      }

      setLocalMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: finalContent, hints, isStreaming: false } : m));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading('idle');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleVoiceSend("Voice Note", audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleVoiceSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-200">
      <div className="h-16 flex items-center px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 z-50">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors" title="Open Sidebar"><Menu size={22} /></button>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg"><Mic size={22} /></div>
          <div><h1 className="text-lg font-bold leading-tight">Voice Workspace</h1><p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Audio Interactive</p></div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={onStartLive} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all font-bold text-xs"><Zap size={16} fill="currentColor" /><span className="hidden sm:inline uppercase tracking-widest">Live Talk</span></button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><MoreVertical size={22} /></button>
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-1 space-y-0.5">
                        <button onClick={() => { onLanguageClick(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Globe size={18} className="text-blue-500" /> Output Language</button>
                        <button onClick={() => { setLocalMessages([]); onNewSession?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Plus size={18} className="text-blue-500" /> New Voice Session</button>
                        <button onClick={() => { onDictionaryClick?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><BookOpen size={18} className="text-indigo-500" /> Dictionary</button>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <button onClick={() => { onShareClick?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Share2 size={18} className="text-gray-400" /> Share Transcript</button>
                        <button onClick={() => { onConfigure?.(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Settings size={18} className="text-gray-400" /> Configure Assistant</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="max-w-4xl mx-auto h-full">
            <MessageList 
                messages={localMessages} 
                loadingState={loading} 
                onEdit={() => {}} 
                onTranslate={onTranslate}
                onReadAloud={onReadAloud}
                onAudioOverview={onAudioOverview}
                onMindMap={onMindMap}
                onRegenerate={onRegenerate}
                onReply={handleVoiceSend} 
                language={language}
                onShare={onShare}
                onRemoveAudioNote={onRemoveAudioNote}
                onAudioNotePlayed={onAudioNotePlayed}
            />
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className={`flex-1 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border transition-all duration-300 flex items-center px-3 py-1 relative ${isRecording ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10'}`}>
            {isRecording ? (
               <div className="flex-1 h-12 flex items-center px-4 gap-4 animate-pulse">
                  <div className="w-2.5 h-2.5 bg-red-50 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
                  <span className="text-sm font-mono font-bold text-red-500">{recordTime}s</span>
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-auto">Listening...</span>
               </div>
            ) : (
              <>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Plus size={24} /></button>
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask via voice or text..." className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-3.5 px-1 text-sm max-h-32 text-gray-800 dark:text-gray-100 placeholder-gray-400" rows={1} />
              </>
            )}
          </div>

          <div className="shrink-0 pb-1">
            {input.trim() ? (
              <button onClick={handleSend} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"><Send size={22} /></button>
            ) : (
              <button onMouseDown={(e) => { e.preventDefault(); startRecording(); }} onTouchStart={(e) => { e.preventDefault(); startRecording(); }} onMouseUp={(e) => { e.preventDefault(); stopRecording(); }} onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }} className={`w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isRecording ? 'scale-[1.45] bg-red-600 shadow-red-500/40 ring-8 ring-red-500/5' : 'hover:bg-blue-700 active:scale-90 hover:scale-105'}`} title="Hold to Record"><Mic size={24} className={isRecording ? 'animate-pulse' : ''} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};