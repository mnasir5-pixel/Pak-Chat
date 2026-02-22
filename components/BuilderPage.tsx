import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { ChatMessage } from '../types';
import { SimpleMarkdown } from './SimpleMarkdown';
import { CONFIG } from '../services/config';
import { 
  Play, Code2, Monitor, RotateCcw, Maximize2, Minimize2, 
  Terminal, Bug, Cpu, Layers, RefreshCw, X, Menu, ArrowRight, Mic,
  // Fix: Added missing MessageSquare import from lucide-react
  MessageSquare
} from 'lucide-react';

const GEMINI_MODEL = 'gemini-3-pro-preview';

const BUILDER_SYSTEM_INSTRUCTION = `You are the **Nexus Lead Architect**. 
Your goal is to build, debug, and optimize production-ready web applications in real-time.

### 1. TECHNOLOGY STACK
- **Frontend**: React (Functional Components + Hooks) via CDN (Babel Standalone).
- **Styling**: Tailwind CSS via CDN.
- **Visuals**: Use SVG strings for icons.

### 2. FILE STRUCTURE
You must output a MULTI-FILE solution using this delimiter:
<!--__FILE: filename.ext__-->
\`\`\`language
[Full Code]
\`\`\`

Required Files:
1. \`index.html\` (CDNs: React, ReactDOM, Babel, Tailwind).
2. \`App.jsx\` (Main Entry).
3. \`components/...\` (Modular components).

### 3. DEBUGGING PROTOCOL
- If the user reports an error, analyze all previous files and provide a "Debug Log" followed by corrected files.
- Ensure all components are imported/defined correctly for a single-pass Babel compilation.
`;

interface VirtualFile {
  name: string;
  language: string;
  content: string;
}

interface BuilderPageProps {
  onMenuClick: () => void;
}

const fileToGenerativePart = async (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Content = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64Content, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const INITIAL_MSG: ChatMessage = {
  id: 'init',
  role: 'model',
  content: "Nexus Architect Active. Provide requirements or a UI screenshot to initialize generation.",
  timestamp: Date.now()
};

export const BuilderPage: React.FC<BuilderPageProps> = ({ onMenuClick }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'code' | 'preview'>('prompt'); 
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview'); 
  const [isFullScreen, setIsFullScreen] = useState(false); 
  const [previewKey, setPreviewKey] = useState(0); 

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const s = localStorage.getItem('pak_builder_msgs');
        return s ? JSON.parse(s) : [INITIAL_MSG];
    } catch { return [INITIAL_MSG]; }
  });
  
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    try {
        const s = localStorage.getItem('pak_builder_files');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => localStorage.setItem('pak_builder_msgs', JSON.stringify(messages)), [messages]);
  useEffect(() => localStorage.setItem('pak_builder_files', JSON.stringify(files)), [files]);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, activeTab]);

  const initChat = () => {
    if (!chatSession.current) {
      const apiKey = CONFIG.GEMINI_API_KEY || localStorage.getItem('pakchat_gemini_api_key') || process.env.API_KEY || '';
      if (!apiKey) throw new Error("API Key missing.");
      const ai = new GoogleGenAI({ apiKey });
      const history = messages.length > 1 ? messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })) : [];
      chatSession.current = ai.chats.create({
        model: GEMINI_MODEL,
        config: { systemInstruction: BUILDER_SYSTEM_INSTRUCTION },
        history: history as any
      });
    }
  };

  const parseAndSetFiles = (fullText: string) => {
    const regex = /<!--__FILE:\s*([\w.\/-]+)\s*-->\s*```(\w+)\n([\s\S]*?)```/g;
    const newFiles: VirtualFile[] = [];
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      newFiles.push({ name: match[1].trim(), language: match[2].trim(), content: match[3] });
    }
    if (newFiles.length > 0) {
      setFiles(newFiles);
      if (!activeFile || !newFiles.find(f => f.name === activeFile)) {
         const main = newFiles.find(f => f.name.includes('App') || f.name.includes('index.html'));
         setActiveFile(main ? main.name : newFiles[0].name);
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      initChat();
      const botMsgId = (Date.now() + 1).toString();
      setMessages(p => [...p, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      let stream;
      if (attachment) {
        const part = await fileToGenerativePart(attachment);
        stream = await chatSession.current!.sendMessageStream({ message: [userMsg.content, part] as any });
      } else {
        stream = await chatSession.current!.sendMessageStream({ message: userMsg.content });
      }
      setAttachment(null); setAttachmentPreview(null);
      let fullText = '';
      for await (const chunk of stream) {
        const text = (chunk as GenerateContentResponse).text || '';
        fullText += text;
        setMessages(p => {
             const last = p[p.length - 1];
             return last.id === botMsgId ? [...p.slice(0, -1), { ...last, content: fullText }] : p;
        });
      }
      setMessages(p => p.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
      parseAndSetFiles(fullText);
      setViewMode('preview'); setActiveTab('preview'); setPreviewKey(k => k + 1);
    } catch (e: any) {
      setMessages(p => [...p, { id: Date.now().toString(), role: 'model', content: "Nexus Error: " + e.message, timestamp: Date.now(), isError: true }]);
    } finally { setIsLoading(false); }
  };

  const getCompiledHtml = () => {
    if (files.length === 0) return '';
    const indexHtml = files.find(f => f.name.toLowerCase() === 'index.html');
    if (!indexHtml) return `<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#0ff;font-family:monospace;"><h3>Nexus Archive: index.html not found.</h3></body></html>`;

    let html = indexHtml.content;
    const jsFiles = files.filter(f => ['js', 'jsx', 'javascript'].includes(f.language));
    const scripts = jsFiles.map(f => `<script type="text/babel" data-file="${f.name}">${f.content}</script>`).join('\n');
    return html.replace('</body>', `${scripts}</body>`);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#050508] text-gray-100 font-sans overflow-hidden">
      <header className="h-14 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-400 hover:text-blue-500 rounded-xl transition-all md:hidden"><Menu size={22}/></button>
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-600/20">NX</div>
             <div>
                <span className="font-black text-xs uppercase tracking-[0.2em] text-white">Nexus Hub</span>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500 -mt-0.5">Architecture & Preview</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => { if(confirm("Wipe workspace?")) { setMessages([INITIAL_MSG]); setFiles([]); } }} className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all">Reset Nexus</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col bg-[#0a0a0f] border-r border-white/5 w-full md:w-[400px] shrink-0 transition-all ${isFullScreen ? 'hidden' : (activeTab === 'prompt' ? 'flex' : 'hidden md:flex')}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar no-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[95%] shadow-xl transition-all ${m.role === 'user' ? 'bg-blue-600 text-white border border-blue-500/30 rounded-tr-none' : 'bg-transparent text-gray-300'}`}>
                    {m.role === 'user' ? m.content : <SimpleMarkdown content={m.content} />}
                 </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5">
             {attachmentPreview && (
                <div className="relative w-20 h-20 mb-4 rounded-xl overflow-hidden border border-blue-500/30 group">
                   <img src={attachmentPreview} className="w-full h-full object-cover" alt="UI Context"/>
                   <button onClick={() => {setAttachment(null); setAttachmentPreview(null)}} className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={20}/></button>
                </div>
             )}
             <div className="relative rounded-2xl bg-white/5 border border-white/10 p-2 focus-within:border-blue-500 transition-all group">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Nexus command..." className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-sm resize-none" rows={2}/>
                <div className="flex justify-between items-center mt-2 px-1">
                   <div className="flex gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-500 transition-colors"><Monitor size={18}/></button>
                      <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if(f) { setAttachment(f); setAttachmentPreview(URL.createObjectURL(f)); } }} className="hidden" accept="image/*"/>
                   </div>
                   <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-blue-600 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-20"><ArrowRight size={18}/></button>
                </div>
             </div>
          </div>
        </div>

        <div className={`flex-1 bg-[#050508] flex flex-col overflow-hidden ${activeTab === 'prompt' ? 'hidden md:flex' : 'flex'}`}>
           <div className="h-12 bg-black border-b border-white/5 flex items-center justify-between px-4 shrink-0">
               <div className="flex items-center gap-3">
                   <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
                       <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Preview</button>
                       <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === 'code' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Source</button>
                   </div>
                   <button onClick={() => setPreviewKey(k => k+1)} className="p-2 text-gray-500 hover:text-emerald-500 transition-colors"><RefreshCw size={16}/></button>
               </div>
               <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1 ml-4 pr-10">
                   {files.map(f => (
                       <button key={f.name} onClick={() => { setActiveFile(f.name); setViewMode('code'); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeFile === f.name ? 'border-blue-600 text-white bg-blue-600/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                           {f.name}
                       </button>
                   ))}
               </div>
               <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">{isFullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
           </div>

           <div className="flex-1 flex relative">
               <div className={`flex-1 overflow-hidden ${viewMode === 'code' ? 'flex' : 'hidden'}`}>
                  {files.length > 0 ? (
                      <pre className="flex-1 overflow-auto p-8 text-xs sm:text-sm font-mono text-gray-400 bg-black leading-relaxed custom-scrollbar"><code dangerouslySetInnerHTML={{ __html: (files.find(f => f.name === activeFile)?.content || '').replace(/</g, '&lt;') }}/></pre>
                  ) : (
                      <div className="flex-1 flex items-center justify-center opacity-20"><Cpu size={64}/></div>
                  )}
               </div>
               <div className={`flex-1 overflow-hidden bg-white ${viewMode === 'preview' ? 'flex' : 'hidden'}`}>
                  {files.length > 0 ? (
                      <iframe key={previewKey} title="Nexus Live Preview" srcDoc={getCompiledHtml()} className="w-full h-full border-none" sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"/>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0f] text-gray-500 gap-4"><Monitor size={48} className="opacity-10"/><span className="text-[10px] font-black uppercase tracking-[0.4em]">Nexus Pipeline Empty</span></div>
                  )}
               </div>
           </div>
        </div>
      </div>
      
      <div className="md:hidden h-14 bg-black border-t border-white/10 flex items-center justify-around shrink-0 z-50">
          <button onClick={() => setActiveTab('prompt')} className={`p-2 transition-all ${activeTab === 'prompt' ? 'text-blue-500' : 'text-gray-600'}`}><MessageSquare size={24}/></button>
          <button onClick={() => setActiveTab('code')} className={`p-2 transition-all ${activeTab === 'code' ? 'text-blue-500' : 'text-gray-600'}`}><Code2 size={24}/></button>
          <button onClick={() => setActiveTab('preview')} className={`p-2 transition-all ${activeTab === 'preview' ? 'text-emerald-500' : 'text-gray-600'}`}><Monitor size={24}/></button>
      </div>
    </div>
  );
};