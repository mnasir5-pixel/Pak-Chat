
import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, AudioNote } from '../types';
import { ChatService } from '../services/geminiService';
import { Library, Download, Search, Globe, FileText, X, Menu, MoreVertical, Plus, Share2, Settings, ExternalLink, FileCheck, CloudDownload, BookOpen } from 'lucide-react';

interface LibrarianPageProps {
  messages: ChatMessage[]; 
  loadingState: LoadingState;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onShareClick: () => void;
  onConfigure: () => void;
  onLanguageClick: () => void;
  onNewSession: () => void;
  language: string;
  onTranslate?: (id: string, targetLang: string) => void;
  onReadAloud?: (id: string) => void;
  onAudioOverview?: (id: string) => void;
  onMindMap?: (id: string) => void;
  onShare?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  shareHandler?: (id: string) => void;
}

interface FetchedFile {
  id: string;
  name: string;
  size: string;
  format: 'PDF' | 'DOCX' | 'MD';
  content: string;
  timestamp: number;
}

const getPrompt = (lang: string) => `You are "Pak Librarian", an expert Document Retrieval and Knowledge Synthesis Agent.
Your primary goal is to provide users with specific documents, books, textbooks, or consolidated knowledge bases.

IMPORTANT: You MUST respond in ${lang}.

### OPERATIONAL RULES:
1. **Direct Search**: Use Google Search to find accurate info.
2. **Document Synthesis**: When a user asks for a book, synthesize a comprehensive "Digital Resource".
3. **Format**: Always structure your response for formatting.
4. **Grounding**: Always provide sources.

### FOLLOW-UP PROTOCOL
At the end of EVERY response, you MUST suggest 3 follow-up questions.
Use this EXACT format:
### HINTS:
- Follow-up question 1
- Follow-up question 2
- Follow-up question 3`;

export const LibrarianPage: React.FC<LibrarianPageProps> = ({
  onBack,
  onMenuClick,
  onShareClick,
  onConfigure,
  onLanguageClick,
  onNewSession,
  language,
  onTranslate, onReadAloud, onAudioOverview, onMindMap, onShare, onRegenerate, shareHandler
}) => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [fetchedFiles, setFetchedFiles] = useState<FetchedFile[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    chatServiceRef.current = new ChatService(getPrompt(language));
  }, [language]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || loading !== 'idle') return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
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

      if (finalContent.length > 500 || content.toLowerCase().includes('pdf') || content.toLowerCase().includes('book')) {
          const docTitle = finalContent.split('\n')[0].replace(/[#*]/g, '').trim().substring(0, 40) || "Knowledge Resource";
          const newFile: FetchedFile = {
            id: botMsgId,
            name: docTitle,
            size: `${Math.round(finalContent.length / 1024 * 10) / 10} KB`,
            format: 'PDF',
            content: finalContent,
            timestamp: Date.now()
          };
          setFetchedFiles(prev => [newFile, ...prev]);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading('idle');
    }
  };

  const handleEditMessage = (id: string, newContent: string) => {
    setLocalMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const showIntro = localMessages.length === 0;

  return (
    <div className="flex h-full w-full bg-[#f8fafc] dark:bg-[#050508] relative overflow-hidden">
      {/* Side "Retrieved Files" panel removed as requested by user highlight */}

      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#050508]">
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md z-50 shrink-0">
           <div className="flex items-center gap-4">
              <button onClick={onMenuClick} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Menu size={20} /></button>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <Library size={22} />
                 </div>
                 <div>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pak Librarian</h2>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${loading !== 'idle' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${loading !== 'idle' ? 'text-orange-500' : 'text-emerald-500'}`}>
                           {loading !== 'idle' ? 'Searching Repository...' : 'Direct Retrieval Active'}
                        </span>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
               <button 
                  onClick={() => { setLocalMessages([]); setFetchedFiles([]); onNewSession(); }}
                  className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  <span className="hidden md:inline uppercase tracking-widest">New Fetch</span>
               </button>
               <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400"><MoreVertical size={20} /></button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden p-1 animate-in zoom-in-95">
                        <button onClick={() => { onLanguageClick(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Globe size={18} className="text-blue-500" /> Output Language</button>
                        <button onClick={() => { onShareClick(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Share2 size={18} className="text-gray-400" /> Share Log</button>
                        <button onClick={() => { onConfigure(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-3 transition-colors"><Settings size={18} className="text-gray-400" /> Configure</button>
                    </div>
                )}
               </div>
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {showIntro ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700 overflow-y-auto no-scrollbar">
               <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl border border-blue-100 dark:border-blue-800 -rotate-3">
                 <Library className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" />
               </div>
               <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter uppercase">Knowledge Repository</h1>
               <p className="text-gray-500 max-w-sm mb-12 text-sm sm:text-lg font-medium italic">Instant textbook & document retrieval.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
                <MessageList 
                    messages={localMessages} 
                    loadingState={loading} 
                    onEdit={handleEditMessage} 
                    onTranslate={onTranslate}
                    onReadAloud={onReadAloud}
                    onAudioOverview={onAudioOverview}
                    onMindMap={onMindMap}
                    onRegenerate={onRegenerate}
                    onShare={shareHandler}
                    onReply={handleSendMessage} 
                    language={language}
                />
            </div>
          )}
        </div>

        <div className="w-full px-4 pb-8 pt-4 bg-white/50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <ChatInput 
                onSend={handleSendMessage}
                isLoading={loading !== 'idle'}
                onStartLive={() => {}} 
                placeholder="Name a book or document to retrieve..."
                language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
