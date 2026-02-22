import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LoadingState, ChatConfig, AudioNote } from '../types';
import { ChatService } from '../services/geminiService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConfigureChatModal } from './ConfigureChatModal';
import { Menu, MessageSquare, Zap, RefreshCw, SlidersHorizontal, ArrowLeft, X } from 'lucide-react';
import { LiveSessionOverlay } from './LiveSessionOverlay';

interface GeneralNotesChatPageProps {
  language: string;
  onMenuClick: () => void;
  onBack: () => void;
  onNavigateToSourceQA?: () => void;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

const GENERAL_CHAT_SYSTEM_PROMPT = `You are "Notes Chat Assistant". 
You provide intelligent, general-purpose assistance. While you are part of the Knowledge Hub, this specific session is for general inquiries not requiring grounded source documentation.

### FOLLOW-UP PROTOCOL
At the end of EVERY response, you MUST suggest 3 follow-up topics or questions.
Use this EXACT format:
### HINTS:
- Topic 1
- Topic 2
- Topic 3`;

export const GeneralNotesChatPage: React.FC<GeneralNotesChatPageProps> = ({ 
    language, onMenuClick, onBack, onNavigateToSourceQA,
    onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare, onRegenerate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  // Fixed: Added missing 'mode' property to satisfy ChatConfig interface
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ style: 'default', length: 'default', mode: 'assistant' });
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  
  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    chatServiceRef.current = new ChatService(GENERAL_CHAT_SYSTEM_PROMPT, chatConfig);
  }, []);

  const handleConfigSave = (newConfig: ChatConfig) => {
    setChatConfig(newConfig);
    if (chatServiceRef.current) {
      chatServiceRef.current.updateConfig(newConfig);
    }
  };

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!content.trim() || loadingState !== 'idle') return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }]);
    setLoadingState('loading');
    try {
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setLoadingState('streaming');
      const stream = await chatServiceRef.current!.sendMessageStream(content, attachment);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullResponse } : m));
      }

      // Parse Hints
      let finalContent = fullResponse;
      let hints: string[] = [];

      if (fullResponse.includes("### HINTS:")) {
          const parts = fullResponse.split("### HINTS:");
          finalContent = parts[0].trim();
          hints = parts[1].split('\n').map(h => h.replace(/^[-*•\d.]+\s*/, '').trim()).filter(h => h.length > 0).slice(0, 3);
      }

      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: finalContent, hints, isStreaming: false } : m));
    } catch (e) { console.error(e); } finally { setLoadingState('idle'); }
  };

  const handleLocalEdit = (id: string, newContent: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#050508] relative overflow-hidden">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
           <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors"><Menu size={22} /></button>
           <div className="truncate">
             <h1 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">General Notes</h1>
             <div className="flex items-center gap-1.5 mt-0.5"><div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`} /><span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">Assistant Active</span></div>
           </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/10 scale-90 sm:scale-100">
               <button 
                onClick={onNavigateToSourceQA}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-gray-600`}
               >Q&A</button>
               <button 
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-800 text-blue-600 shadow-sm`}
               >CHAT</button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 sm:border-l border-gray-200 dark:border-white/10">
                <button onClick={() => setMessages([])} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Reload Session">
                    <RefreshCw size={18} />
                </button>
                <button onClick={() => setIsConfigModalOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Configure">
                    <SlidersHorizontal size={18} />
                </button>
                <button onClick={() => setIsLiveOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  <Zap size={14} fill="currentColor" /> Live Talk
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
             <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 dark:bg-blue-900/10 rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-blue-100 dark:border-blue-800">
               <MessageSquare size={32} className="sm:w-12 sm:h-12 text-blue-600" />
             </div>
             <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">General Notes Chat</h2>
             <p className="text-gray-500 max-w-sm mb-12 text-sm sm:text-lg font-medium italic">Ask anything about your notes or just start a conversation.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <MessageList 
              messages={messages} 
              loadingState={loadingState} 
              onEdit={handleLocalEdit} 
              onTranslate={onTranslate}
              onReadAloud={onReadAloud}
              onAudioOverview={onAudioOverview}
              onMindMap={onMindMap}
              onRegenerate={onRegenerate}
              onShare={onShare}
              language={language} 
              onReply={handleSendMessage} 
            />
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 z-30 border-t border-gray-100 dark:border-white/5">
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput onSend={handleSendMessage} isLoading={loadingState !== 'idle'} onStartLive={() => setIsLiveOpen(true)} placeholder="Ask anything..." />
        </div>
      </div>

      {isLiveOpen && (
        <LiveSessionOverlay 
          onClose={(t) => {
              setIsLiveOpen(false);
              if(t.length > 0) setMessages(prev => [...prev, ...t]);
          }}
          language={language}
          systemInstruction="You are a helpful general-purpose AI assistant in a low-latency voice conversation. Feel free to discuss anything."
          initialHistory={messages}
        />
      )}

      <ConfigureChatModal 
          isOpen={isConfigModalOpen} 
          onClose={() => setIsConfigModalOpen(false)} 
          config={chatConfig}
          onSave={handleConfigSave}
      />
    </div>
  );
};