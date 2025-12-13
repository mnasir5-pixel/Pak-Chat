
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LoadingState, ChatConfig } from '../types';
import { ChatService } from '../services/geminiService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConfigureChatModal } from './ConfigureChatModal';
import { SUPPORTED_LANGUAGES, getSystemInstructionFromConfig } from '../constants';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'website' | 'youtube' | 'drive' | 'audio' | 'video' | 'image';
  content: string;
  summary?: string;
  timestamp: number;
  isProcessing?: boolean; 
}

interface StudioItem {
  id: string;
  type: 'audio' | 'video' | 'mindmap' | 'reports' | 'flashcards' | 'quiz' | 'infographic' | 'slides';
  title: string;
  status: 'processing' | 'ready' | 'error';
  content?: string; 
  timestamp: number;
}

interface NasherNotesPageProps {
  language: string;
  onMenuClick: () => void;
  onBack: () => void;
  onStartLive: (instruction: string) => void;
}

// --- SYSTEM PROMPTS ---

// 1. STRICT SOURCE Q&A
const SOURCE_QA_PROMPT = `You are "Notes LM", a strict Document Assistant. 
Your goal is to answer user questions based ONLY on the provided Sources.

### STRICT RULES:
1. **Source Grounding**: Answer ONLY using information found in the "CONTEXT FROM SOURCES".
2. **Refusal**: If the answer is not in the sources, you MUST state: "I cannot find the answer to that in the provided sources." Do not hallucinate or use outside knowledge.
3. **Citations**: When possible, mention which source the information came from (e.g., "According to [Source Name]...").
4. **Auto-updating Hints**: At the end of helpful responses, provide 3 follow-up questions relevant to the SOURCE MATERIAL.

### TONE:
Professional, analytical, and objective.`;

// 2. GENERAL CHAT (Helper)
const GENERAL_CHAT_PROMPT = `You are "Pak Chat", a helpful AI Assistant working alongside a notebook.
You have access to the user's sources as context, but you are NOT restricted by them.

### CAPABILITIES:
1. **General Knowledge**: Answer any question using your broad knowledge base.
2. **Source Awareness**: You can see the sources if the user asks about them, but you can also discuss outside topics, coding, math, or creative writing.
3. **Image Generation**: If the user asks for an image, use your generation tools.
4. **Resource Librarian**: If the user asks for books/resources, use Google Search to find real, free PDF links.

### TONE:
Friendly, helpful, and creative.`;

type ToolType = 'audio' | 'video' | 'mindmap' | 'reports' | 'flashcards' | 'quiz' | 'infographic' | 'slides';
type ModalType = 'none' | 'main' | 'website' | 'youtube' | 'text' | 'drive' | 'edit-source';
type ChatMode = 'source' | 'general';

const STUDIO_TOOLS = [
  { id: 'audio', label: 'Audio Overview', icon: '🎧', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-600' },
  { id: 'video', label: 'Video Overview', icon: '📹', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', iconColor: 'text-green-600' },
  { id: 'mindmap', label: 'Mind Map', icon: '🧠', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-600' },
  { id: 'reports', label: 'Reports', icon: '📄', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', iconColor: 'text-yellow-600' },
  { id: 'flashcards', label: 'Flashcards', icon: '🗂️', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', iconColor: 'text-red-600' },
  { id: 'quiz', label: 'Quiz', icon: '❓', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', iconColor: 'text-cyan-600' },
  { id: 'infographic', label: 'Infographic', icon: '📊', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-700 dark:text-fuchsia-300', iconColor: 'text-fuchsia-600' },
  { id: 'slides', label: 'Slide Deck', icon: '🖼️', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', iconColor: 'text-rose-600' },
];

export const NasherNotesPage: React.FC<NasherNotesPageProps> = ({ language, onMenuClick, onBack, onStartLive }) => {
  // State
  const [notebookTitle, setNotebookTitle] = useState('Untitled notebook');
  const [sources, setSources] = useState<Source[]>([]);
  const [studioItems, setStudioItems] = useState<StudioItem[]>([]);
  
  // DUAL CHAT STATE
  const [chatMode, setChatMode] = useState<ChatMode>('source');
  
  const [sourceMessages, setSourceMessages] = useState<ChatMessage[]>([]);
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [deepResearchQuery, setDeepResearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Menu States
  const [activeSourceMenu, setActiveSourceMenu] = useState<string | null>(null);
  const [activeStudioMenu, setActiveStudioMenu] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  // Chat Configuration
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ style: 'default', length: 'default' });
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);

  // Temporary input state for modals
  const [tempInput, setTempInput] = useState('');

  // Studio Modal State
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  
  // Refs for Dual Services
  const sourceChatServiceRef = useRef<ChatService | null>(null);
  const generalChatServiceRef = useRef<ChatService | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Services
  useEffect(() => {
    sourceChatServiceRef.current = new ChatService(SOURCE_QA_PROMPT);
    generalChatServiceRef.current = new ChatService(GENERAL_CHAT_PROMPT);
  }, []);

  // Sync Messages to View
  const currentMessages = chatMode === 'source' ? sourceMessages : generalMessages;

  // --- SOURCE HANDLERS ---
  const triggerFileUpload = (accept: string) => {
      if (fileInputRef.current) {
          fileInputRef.current.accept = accept;
          fileInputRef.current.click();
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: Source['type'] = 'pdf';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('audio/')) type = 'audio';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type === 'text/plain') type = 'text';

    if (type === 'pdf' || type === 'text') {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const isBinary = file.type === 'application/pdf';
            addSource(file.name, type, isBinary ? `[PDF File: ${file.name} - Content Extraction Pending]` : content);
        };
        if (type === 'text') reader.readAsText(file);
        else reader.readAsDataURL(file); 
    } else {
        addSource(file.name, type, `[Processing ${type} file...]`, file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveModal('none');
  };

  const handleAddSourceSubmit = () => {
      if (!tempInput.trim()) return;
      
      let type: Source['type'] = 'text';
      let name = 'Copied Text';
      
      if (activeModal === 'website') {
          type = 'website';
          name = new URL(tempInput).hostname;
      } else if (activeModal === 'youtube') {
          type = 'youtube';
          name = 'YouTube Video';
      } else if (activeModal === 'drive') {
          type = 'drive';
          name = 'Google Drive File'; 
      } else if (activeModal === 'edit-source' && editingSourceId) {
          setSources(prev => prev.map(s => s.id === editingSourceId ? { ...s, content: tempInput } : s));
          setEditingSourceId(null);
          setTempInput('');
          setActiveModal('none');
          return;
      }

      addSource(name, type, tempInput);
      setTempInput('');
      setActiveModal('none');
  };

  const addSource = (name: string, type: Source['type'], content: string, file?: File) => {
    const newSource: Source = {
      id: Date.now().toString(),
      name,
      type,
      content,
      timestamp: Date.now(),
      isProcessing: !!file 
    };
    setSources(prev => [...prev, newSource]);
    
    if (file) {
        extractMediaContent(newSource, file);
    } else {
        analyzeSource(newSource);
    }
  };

  const extractMediaContent = async (source: Source, file: File) => {
      const extractor = new ChatService("You are a Transcription and Analysis AI.");
      let prompt = "";
      if (source.type === 'audio' || source.type === 'video') {
          prompt = `Listen to/Watch this ${source.type} file. 
          1. Provide a verbatim or near-verbatim TRANSCRIPT of the spoken content.
          2. If there are visual elements (for video), describe them briefly.
          3. Summarize the main topics discussed.`;
      } else if (source.type === 'image') {
          prompt = "Analyze this image. Describe everything you see in detail, including text, objects, and context.";
      }

      try {
          const stream = await extractor.sendMessageStream(prompt, file);
          let fullExtraction = "";
          for await (const chunk of stream) {
              fullExtraction += chunk;
          }
          
          const updatedSource = { ...source, content: fullExtraction, isProcessing: false };
          setSources(prev => prev.map(s => s.id === source.id ? updatedSource : s));
          analyzeSource(updatedSource);

      } catch (e) {
          console.error("Extraction Failed", e);
          setSources(prev => prev.map(s => s.id === source.id ? { ...s, content: "Error processing file.", isProcessing: false } : s));
      }
  };

  const analyzeSource = async (source: Source) => {
    if (!sourceChatServiceRef.current) return;

    let analysisPrompt = `Analyze the following new source added to the notebook:
    Name: ${source.name}
    Type: ${source.type}
    Content Start: ${source.content.substring(0, 500)}... 

    TASK:
    1. Create a structured summary.
    2. List 3 key hints/questions.
    
    OUTPUT FORMAT:
    **Summary**
    [Summary]

    **Key Takeaways**
    * [Point 1]
    * [Point 2]

    ### HINTS:
    - [Question 1]
    - [Question 2]
    - [Question 3]`;

    if (source.type === 'youtube' || source.type === 'website') {
        analysisPrompt += `\nIMPORTANT: Use Google Search to verify and summarize this URL content.`;
    }

    try {
        const summaryMsgId = Date.now().toString();
        setSourceMessages(prev => [...prev, {
            id: summaryMsgId,
            role: 'model',
            content: `**Analysis of ${source.name}:**\n\nAnalyzing...`,
            timestamp: Date.now(),
            isStreaming: true
        }]);

        const stream = await sourceChatServiceRef.current.sendMessageStream(analysisPrompt);
        let fullResponse = "";
        
        for await (const chunk of stream) {
            fullResponse += chunk;
            setSourceMessages(prev => prev.map(m => m.id === summaryMsgId ? { ...m, content: fullResponse } : m));
        }

        const hintsMatch = fullResponse.split("### HINTS:");
        if (hintsMatch.length > 1) {
            const displayContent = hintsMatch[0].trim();
            const rawHints = hintsMatch[1].trim().split('\n').map(h => h.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim()).filter(h => h);
            
            setSourceMessages(prev => prev.map(m => m.id === summaryMsgId ? { ...m, content: displayContent, isStreaming: false } : m));
            setHints(rawHints);
            setShowHints(true);
        } else {
            setSourceMessages(prev => prev.map(m => m.id === summaryMsgId ? { ...m, isStreaming: false } : m));
        }

    } catch (e) {
        console.error("Analysis failed", e);
    }
  };

  const handleRenameSource = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault(); setActiveSourceMenu(null);
      setTimeout(() => {
        const s = sources.find(src => src.id === id);
        if (s) {
            const newName = prompt("Rename source:", s.name);
            if (newName) setSources(prev => prev.map(src => src.id === id ? { ...src, name: newName.trim() } : src));
        }
      }, 50);
  };

  const handleEditSource = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault(); setActiveSourceMenu(null);
      const s = sources.find(src => src.id === id);
      if (s) { setEditingSourceId(id); setTempInput(s.content); setActiveModal('edit-source'); }
  };

  const handleDeleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault(); setActiveSourceMenu(null);
    setTimeout(() => { if (confirm("Remove this source?")) setSources(prev => prev.filter(s => s.id !== id)); }, 50);
  };

  // --- STUDIO GENERATION ---
  const handleStudioGenerate = async (prompt: string, toolName: string, toolId: string) => {
      setActiveTool(null); 
      const newItem: StudioItem = { id: Date.now().toString(), type: toolId as any, title: toolName, status: 'processing', timestamp: Date.now() };
      setStudioItems(prev => [newItem, ...prev]);

      const sourceContext = sources.map(s => `SOURCE (${s.name}):\n${s.content}`).join('\n\n');
      const fullSystemPrompt = `You are a Content Generator. Generate the requested content based on:\n\n${sourceContext}`;
      const tempService = new ChatService(fullSystemPrompt);

      try {
          const stream = await tempService.sendMessageStream(prompt);
          let generatedContent = "";
          for await (const chunk of stream) generatedContent += chunk;
          setStudioItems(prev => prev.map(item => item.id === newItem.id ? { ...item, status: 'ready', content: generatedContent } : item));
      } catch (e) {
          setStudioItems(prev => prev.map(item => item.id === newItem.id ? { ...item, status: 'error', content: "Failed." } : item));
      }
  };

  // --- CHAT HANDLER (DUAL CHANNEL) ---
  const handleSendMessage = async (content: string, attachment?: File): Promise<string> => {
    if (loadingState === 'streaming') return '';

    const activeService = chatMode === 'source' ? sourceChatServiceRef.current : generalChatServiceRef.current;
    const setMessages = chatMode === 'source' ? setSourceMessages : setGeneralMessages;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: content,
        timestamp: Date.now(),
        attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setLoadingState('loading');

    const sourceContext = sources.map(s => `SOURCE (${s.name}):\n${s.content.substring(0, 2000)}...`).join('\n\n');
    
    let promptToSend = "";
    if (chatMode === 'source') {
        promptToSend = `CONTEXT FROM SOURCES:\n${sourceContext}\n\nUSER QUESTION: ${content}\n\nREMINDER: Answer ONLY from sources.`;
    } else {
        promptToSend = `BACKGROUND SOURCES:\n${sourceContext}\n\nUSER MESSAGE: ${content}`;
    }

    promptToSend += `\n\n${getSystemInstructionFromConfig("", chatConfig)}`;

    let fullResponse = '';

    try {
        if (!activeService) throw new Error("Service not ready");
        
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
        setLoadingState('streaming');

        const stream = await activeService.sendMessageStream(promptToSend, attachment);
        
        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
                return prev;
            });
        }
        
        const hintsMatch = fullResponse.split("### HINTS:");
        if (hintsMatch.length > 1) {
            const displayContent = hintsMatch[0].trim();
            const rawHints = hintsMatch[1].trim().split('\n').map(h => h.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim()).filter(h => h);
            
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: displayContent, isStreaming: false } : m));
            setHints(rawHints);
            setShowHints(true);
        } else {
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
        }

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error: " + e.message, timestamp: Date.now(), isError: true }]);
    } finally {
        setLoadingState('idle');
    }

    return fullResponse;
  };

  const handleRefreshChat = () => {
      if (chatMode === 'source') {
          setSourceMessages([]);
          if (sourceChatServiceRef.current) sourceChatServiceRef.current = new ChatService(SOURCE_QA_PROMPT);
      } else {
          setGeneralMessages([]);
          if (generalChatServiceRef.current) generalChatServiceRef.current = new ChatService(GENERAL_CHAT_PROMPT);
      }
      setHints([]);
  };

  const handleRenameStudioItem = (id: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setActiveStudioMenu(null); setTimeout(() => { const item = studioItems.find(s => s.id === id); if (item) { const n = prompt("Rename:", item.title); if (n) setStudioItems(p => p.map(s => s.id === id ? { ...s, title: n } : s)); } }, 50); };
  const handleDeleteStudioItem = (id: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setActiveStudioMenu(null); setTimeout(() => { if (confirm("Delete file?")) setStudioItems(p => p.filter(s => s.id !== id)); }, 50); };
  const handleDownloadStudioItem = (id: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setActiveStudioMenu(null); const item = studioItems.find(s => s.id === id); if (item?.content) { const blob = new Blob([item.content], {type: 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${item.title}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } };
  const handleRenameNotebook = () => { const n = prompt("Notebook name:", notebookTitle); if(n) setNotebookTitle(n); };
  const handleShareNotebook = async () => { const txt = `Notebook: ${notebookTitle}\nSources: ${sources.length}`; if (navigator.share) await navigator.share({ title: notebookTitle, text: txt }); else alert("Copied!"); };
  const handleRunResearch = () => { if(!deepResearchQuery.trim()) return; handleSendMessage(`Research: ${deepResearchQuery}`); setDeepResearchQuery(''); };
  const handleLiveSessionStart = () => { onStartLive(`Live Session for ${notebookTitle}. Sources available.`); };
  const scrollHints = (d: 'left' | 'right') => scrollContainerRef.current?.scrollBy({ left: d === 'right' ? 300 : -300, behavior: 'smooth' });

  // --- RENDER ---
  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-900 overflow-hidden relative" onClick={() => { setActiveSourceMenu(null); setActiveStudioMenu(null); }}>
      
      {/* LEFT SIDEBAR */}
      <div className={`bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 h-16 shrink-0">
           <div className="flex items-center gap-2">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg></button>
              <div className="font-bold text-gray-800 dark:text-white truncate max-w-[150px] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded" onClick={handleRenameNotebook}>{notebookTitle}</div>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
           {/* SOURCES */}
           <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-3"><span>SOURCES</span><span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">{sources.length}</span></div>
              <button onClick={() => setActiveModal('main')} className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all mb-3"><span className="text-sm font-medium">+ Add Source</span></button>
              
              <div className="flex gap-2 mb-3">
                  <button onClick={() => triggerFileUpload('audio/*')} className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-medium">Audio</button>
                  <button onClick={() => triggerFileUpload('video/*')} className="flex-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-medium">Video</button>
              </div>

              <div className="space-y-2">
                 {sources.map(s => (
                    <div key={s.id} className="group relative flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-sm">
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">{s.name}</h4>
                          <p className="text-[10px] text-gray-400 uppercase">{s.type} {s.isProcessing && '• Processing...'}</p>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); setActiveSourceMenu(activeSourceMenu === s.id ? null : s.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400">•••</button>
                       {activeSourceMenu === s.id && (
                          <div className="absolute right-0 top-8 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
                              <button onClick={(e) => handleEditSource(s.id, e)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
                              <button onClick={(e) => handleRenameSource(s.id, e)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">Rename</button>
                              <button onClick={(e) => handleDeleteSource(s.id, e)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>

           {/* DEEP RESEARCH */}
           <div>
              <div className="text-xs font-bold text-gray-400 uppercase mb-3">DEEP RESEARCH</div>
              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-3">
                  <input type="text" value={deepResearchQuery} onChange={(e) => setDeepResearchQuery(e.target.value)} placeholder="Topic or URL..." className="w-full text-sm p-2 bg-white dark:bg-gray-800 rounded-lg mb-2 outline-none" />
                  <button onClick={handleRunResearch} disabled={!deepResearchQuery.trim()} className="w-full py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg">Run Research</button>
              </div>
           </div>

           {/* STUDIO */}
           <div>
              <div className="text-xs font-bold text-gray-400 uppercase mb-3">STUDIO</div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {STUDIO_TOOLS.map(tool => (
                      <button key={tool.id} onClick={() => setActiveTool(tool.id as ToolType)} className={`flex flex-col items-start p-3 rounded-2xl border transition-all h-20 ${tool.bg} ${tool.text} border-transparent hover:shadow-sm`}>
                          <span className="text-lg mb-1">{tool.icon}</span>
                          <span className="text-xs font-bold">{tool.label}</span>
                      </button>
                  ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {studioItems.map(item => (
                      <div key={item.id} className="group relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <span className="text-xl">{item.type === 'audio' ? '🎧' : '📄'}</span>
                          <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{item.title}</h4>
                              <p className="text-[10px] text-gray-400">{item.status}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setActiveStudioMenu(activeStudioMenu === item.id ? null : item.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400">•••</button>
                          {activeStudioMenu === item.id && (
                              <div className="absolute right-0 top-8 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
                                  {item.status === 'ready' && <button onClick={(e) => handleDownloadStudioItem(item.id, e)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">Download</button>}
                                  <button onClick={(e) => handleDeleteStudioItem(item.id, e)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">Delete</button>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
           </div>
        </div>
      </div>

      {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border shadow-sm rounded-lg text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
          </button>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 relative">
         
         {/* DUAL MODE HEADER */}
         <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0">
             <div>
                 <h1 className="text-xl font-bold text-gray-800 dark:text-white">Notes LM</h1>
                 <p className="text-xs text-gray-500">Notebook Assistant</p>
             </div>
             <div className="flex items-center gap-3">
                 <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setChatMode('source')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${chatMode === 'source' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" /></svg>
                        Source Q&A
                    </button>
                    <button
                      onClick={() => setChatMode('general')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${chatMode === 'general' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                        General Chat
                    </button>
                 </div>
                 <button onClick={handleRefreshChat} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Clear Chat">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                 </button>
                 <button onClick={() => setIsConfigureModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                 </button>
                 <button onClick={handleShareNotebook} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                 </button>
             </div>
         </div>

         <div className="flex-1 overflow-hidden relative flex flex-col">
             {sources.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                     </div>
                     <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add a source to get started</h1>
                     <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">Upload a PDF, text file, audio, video, or copy a link.</p>
                     <button onClick={() => setActiveModal('main')} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">Upload a source</button>
                 </div>
             ) : (
                 <>
                    <div className="flex-1 overflow-hidden relative">
                        <MessageList 
                            messages={currentMessages} 
                            loadingState={loadingState} 
                            onEdit={() => {}} 
                            onReply={handleSendMessage}
                            language={language}
                        />
                    </div>
                    {/* HINTS CAROUSEL */}
                    {hints.length > 0 && chatMode === 'source' && (
                        <div className="w-full max-w-4xl mx-auto px-4 mb-2 relative z-20">
                            <div className="flex justify-center -mb-3 relative z-30">
                                 <button onClick={() => setShowHints(!showHints)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-300 ${showHints ? 'rotate-0' : 'rotate-180'}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                 </button>
                            </div>
                            <div className={`transition-all duration-300 overflow-hidden ${showHints ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                               <div className="flex items-center gap-2 pb-2 pt-1">
                                   <div ref={scrollContainerRef} className="flex-1 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth p-1">
                                       {hints.map((hint, i) => (
                                           <button key={i} onClick={() => handleSendMessage(hint)} className="shrink-0 w-[240px] text-left p-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md rounded-xl transition-all whitespace-normal h-full flex flex-col justify-center"><span className="line-clamp-2">{hint}</span></button>
                                       ))}
                                   </div>
                                   <button onClick={() => scrollHints('right')} className="shrink-0 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border rounded-full shadow-sm text-gray-500 z-10"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></button>
                               </div>
                            </div>
                        </div>
                    )}
                    <div className="p-4 pt-2 w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 z-10 border-t border-transparent">
                        <ChatInput onSend={handleSendMessage} isLoading={loadingState !== 'idle'} onStartLive={handleLiveSessionStart} />
                    </div>
                 </>
             )}
         </div>
      </div>

      {/* RENDER MODALS */}
      {renderSourceModals()} 
      
      <StudioModal isOpen={!!activeTool} onClose={() => setActiveTool(null)} tool={activeTool} onGenerate={handleStudioGenerate} />
      <ConfigureChatModal isOpen={isConfigureModalOpen} onClose={() => setIsConfigureModalOpen(false)} config={chatConfig} onSave={setChatConfig} />

    </div>
  );

  function renderSourceModals() {
      if (activeModal === 'none') return null;
      const closeModal = () => { setActiveModal('none'); setTempInput(''); setEditingSourceId(null); };
      
      const modalTitles: Record<string, string> = {
          main: 'Add Source',
          website: 'Add Website Link',
          youtube: 'Add YouTube Video',
          text: 'Paste Text',
          drive: 'Google Drive',
          'edit-source': 'Edit Source Content'
      };

      if (activeModal === 'main') {
          return null; // Handled inline in sidebar for better UX, or we can show a modal if needed. The sidebar buttons act as triggers.
      }

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{modalTitles[activeModal]}</h3>
                  
                  {(activeModal === 'website' || activeModal === 'youtube' || activeModal === 'drive') && (
                      <input 
                        type="text" 
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        autoFocus
                      />
                  )}

                  {(activeModal === 'text' || activeModal === 'edit-source') && (
                      <textarea 
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        placeholder="Paste or type content here..."
                        className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                        autoFocus
                      />
                  )}

                  <div className="flex justify-end gap-3">
                      <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                      <button onClick={handleAddSourceSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                          {activeModal === 'edit-source' ? 'Save Changes' : 'Add Source'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }
};

interface StudioModalProps { isOpen: boolean; onClose: () => void; tool: ToolType | null; onGenerate: (prompt: string, toolName: string, toolId: string) => void; }
const StudioModal: React.FC<StudioModalProps> = ({ isOpen, onClose, tool, onGenerate }) => {
    if (!isOpen || !tool) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Generate {tool}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create AI-generated content based on your sources.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                    <button onClick={() => onGenerate(`Generate ${tool}`, tool || 'Content', tool || 'audio')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate</button>
                </div>
            </div>
        </div>
    );
};
