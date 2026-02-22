

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LoadingState } from '../types';
import { ChatService } from '../services/geminiService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'url' | 'youtube' | 'text' | 'image' | 'audio';
  content?: string; // Simulated content or URL
  timestamp: number;
}

interface ResearchAssistantPageProps {
  language: string;
  onMenuClick: () => void;
}

const RESEARCH_SYSTEM_PROMPT = `You are "Nasher Notes", an intelligent Notebook Assistant. 
Your goal is to help the user interact with their provided documents/sources and refine ideas.

### CAPABILITIES:
1. **Source Grounding**: Always prioritize the information provided in the user's "Sources" context. If the answer isn't in the sources, state that, unless the user explicitly asks for "Deep Research" or general knowledge.
2. **Analysis & Summary**: When a new source is added, you will be asked to analyze it. Provide a concise summary.
3. **Question Generation**: Generate insightful questions (hints) that the user might want to ask about the source.
4. **Deep Research**: If the user asks for "Deep Research" or to "Browse the web", use the Google Search tool to find the latest information.

### TONE:
Professional, analytical, yet accessible. Like a helpful academic research partner.
`;

export const ResearchAssistantPage: React.FC<ResearchAssistantPageProps> = ({ language, onMenuClick }) => {
  // State
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Collapsible source sidebar
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(true);
  
  // Services
  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    // Initialize Chat Service with the Research Prompt
    chatServiceRef.current = new ChatService(RESEARCH_SYSTEM_PROMPT);
  }, []);

  // --- SOURCE HANDLERS ---
  const handleAddSource = (type: Source['type']) => {
    // Simulation of file upload/link entry
    let name = '';
    let content = '';
    let fileObj: File | undefined = undefined;
    
    if (type === 'url' || type === 'youtube') {
      const url = prompt(`Enter ${type === 'youtube' ? 'YouTube' : 'Website'} URL:`);
      if (!url) return;
      name = url;
      content = url;
      addSourceAndAnalyze(name, type, content, undefined);
    } else {
       // Simulate file selection
       const input = document.createElement('input');
       input.type = 'file';
       input.accept = type === 'pdf' ? '.pdf' : type === 'image' ? 'image/*' : type === 'audio' ? 'audio/*' : '.txt,.md,.doc,.docx';
       
       input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
              addSourceAndAnalyze(file.name, type, `[Simulated content of ${file.name}]`, file);
          }
       };
       input.click();
    }
  };

  const addSourceAndAnalyze = (name: string, type: Source['type'], content: string, file?: File) => {
      const newSource: Source = {
          id: Date.now().toString(),
          name: name,
          type: type,
          content: content,
          timestamp: Date.now()
      };
      setSources(prev => [...prev, newSource]);
      
      // TRIGGER AUTO-ANALYSIS
      // We send a hidden system prompt to the AI to generate a summary and hints
      const analysisPrompt = `System Update: The user just added a new source: "${name}" (${type}). 
      1. Analyze this source (or the fact that it was added).
      2. Provide a short, 1-paragraph summary of what this document likely contains or what you can do with it.
      3. Generate 3 specific questions (hints) the user might want to ask about this source.
      
      Output format for hints:
      Start the hints section with "### HINTS:" followed by the questions on new lines.`;

      handleSendMessage(analysisPrompt, file, true); // true = hidden from user view (partially)
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // --- MESSAGE HANDLER ---
  const handleSendMessage = async (content: string, attachment?: File, isSystemAction = false) => {
    if (loadingState === 'streaming') return;
    
    // Only add user message to UI if it's not a system action
    if (!isSystemAction) {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: Date.now(),
            attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined
        };
        setMessages(prev => [...prev, userMsg]);
    }
    
    setLoadingState('loading');

    // CONSTRUCT CONTEXT FROM SOURCES
    const sourceContext = sources.map(s => `[Source: ${s.name} (${s.type})]`).join('\n');
    const fullPrompt = sourceContext 
        ? `CONTEXT FROM SOURCES:\n${sourceContext}\n\nQUERY:\n${content}`
        : content;

    try {
        if (!chatServiceRef.current) throw new Error("Service not ready");
        
        const botMsgId = (Date.now() + 1).toString();
        // Add placeholder for bot message
        setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
        setLoadingState('streaming');

        const stream = await chatServiceRef.current.sendMessageStream(fullPrompt, attachment);
        
        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
                return prev;
            });
        }

        // EXTRACT HINTS IF PRESENT
        if (fullResponse.includes("### HINTS:")) {
            const parts = fullResponse.split("### HINTS:");
            const mainContent = parts[0].trim();
            const hintsBlock = parts[1].trim();
            
            // Update the message to show only the main content
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: mainContent, isStreaming: false }];
                return prev;
            });

            // Parse hints
            const newHints = hintsBlock.split('\n').map(h => h.replace(/^\d+\.\s*|-\s*/, '').trim()).filter(h => h.length > 0);
            setHints(newHints);
            setShowHints(true); // Auto-show hints on new analysis
        } else {
             setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
                return prev;
            });
        }

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error: " + e.message, timestamp: Date.now(), isError: true }]);
    } finally {
        setLoadingState('idle');
    }
  };

  // --- RENDER HELPERS ---
  const getIcon = (type: string) => {
      switch(type) {
          case 'pdf': return '📄';
          case 'doc': return '📝';
          case 'youtube': return '▶️';
          case 'url': return '🌐';
          case 'image': return '🖼️';
          case 'audio': return '🎵';
          default: return '📁';
      }
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden relative">
        
        {/* LEFT SIDEBAR: SOURCES */}
        <div 
            className={`bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                 <button onClick={onMenuClick} className="md:hidden text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                 </button>
                 <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <span className="text-indigo-600">📚</span> Sources
                 </h2>
                 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-auto">{sources.length}</span>
            </div>

            {/* Source List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sources.length === 0 && (
                    <div className="text-center p-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p>No sources added.</p>
                        <p className="mt-1 text-xs">Upload PDFs, Links, or Text to begin analysis.</p>
                    </div>
                )}
                {sources.map(s => (
                    <div key={s.id} className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all">
                        <div className="text-xl">{getIcon(s.type)}</div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate" title={s.name}>{s.name}</h4>
                            <p className="text-[10px] text-gray-400 uppercase">{s.type}</p>
                        </div>
                        <button onClick={() => handleDeleteSource(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Source Buttons */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Add New Source</p>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => handleAddSource('pdf')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 gap-1 border border-gray-100 dark:border-gray-800" title="Upload PDF">
                        <span className="text-lg">📄</span> PDF
                    </button>
                    <button onClick={() => handleAddSource('url')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 gap-1 border border-gray-100 dark:border-gray-800" title="Add Link">
                        <span className="text-lg">🌐</span> Link
                    </button>
                    <button onClick={() => handleAddSource('text')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 gap-1 border border-gray-100 dark:border-gray-800" title="Paste Text">
                        <span className="text-lg">📝</span> Text
                    </button>
                    <button onClick={() => handleAddSource('youtube')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 gap-1 border border-gray-100 dark:border-gray-800" title="YouTube Video">
                        <span className="text-lg">▶️</span> YT
                    </button>
                </div>
            </div>
        </div>

        {/* TOGGLE BUTTON (Outside sidebar to allow opening) */}
        <div className={`absolute top-4 z-20 transition-all duration-300 ${isSidebarOpen ? 'left-80 ml-2' : 'left-4'}`}>
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                title={isSidebarOpen ? "Hide Sources" : "Show Sources"}
             >
                {isSidebarOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                )}
             </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 relative">
            
            {/* Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 pl-14 bg-white dark:bg-gray-900 z-10 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Nasher Notes</h1>
                    <p className="text-xs text-gray-500">Notebook Assistant</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {sources.length === 0 && messages.length === 0 ? (
                    // EMPTY STATE
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <span className="text-4xl">📂</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Start by Adding a Source</h2>
                        <p className="text-gray-500 max-w-md mb-8">
                            Upload a PDF, document, or link to the sidebar to begin analyzing with Nasher Notes.
                        </p>
                        <button 
                            onClick={() => { setIsSidebarOpen(true); handleAddSource('pdf'); }}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Add Source
                        </button>
                    </div>
                ) : (
                    // CHAT INTERFACE
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                             <MessageList 
                                messages={messages}
                                loadingState={loadingState}
                                onEdit={() => {}}
                                language={language}
                                onReply={(text) => handleSendMessage(text)}
                             />
                        </div>
                        
                        {/* HINTS AREA */}
                        {hints.length > 0 && (
                            <div className="px-4 pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <button 
                                        onClick={() => setShowHints(!showHints)}
                                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                                    >
                                        {showHints ? 'Hide Hints' : 'Show Hints'}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${showHints ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                {showHints && (
                                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                                        {hints.map((hint, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => handleSendMessage(hint)}
                                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors text-left"
                                            >
                                                {hint}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                             <ChatInput onSend={handleSendMessage} onStartLive={() => {}} isLoading={loadingState !== 'idle'} />
                        </div>
                    </div>
                )}
            </div>
        </div>

    </div>
  );
};
