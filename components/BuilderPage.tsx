
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { ChatMessage } from '../types';
import { SimpleMarkdown } from './SimpleMarkdown';
import { CONFIG } from '../services/config';

// --- CONSTANTS & SYSTEM PROMPTS ---
const GEMINI_MODEL = 'gemini-2.5-flash';

const BUILDER_SYSTEM_INSTRUCTION = `You are an expert Senior Full-Stack Architect (Pak Chat Builder). 
Your goal is to build production-ready, highly polished web applications in a single pass.

### 1. TECHNOLOGY STACK (MANDATORY)
- **Frontend**: React (Functional Components + Hooks) via CDN (Babel Standalone).
- **Styling**: Tailwind CSS via CDN.
- **Icons**: Use pure SVG strings (Heroicons style) inside JSX. Do NOT use external icon libraries like 'lucide-react' or 'font-awesome'.
- **Backend Simulation**: You CANNOT run real Python/Node. You MUST simulate backend logic (Auth, DB, API) using \`localStorage\` and JavaScript \`Promises\` within the React code.

### 2. FILE STRUCTURE & FORMAT
You must output a MULTI-FILE solution. Use this EXACT delimiter format:
<!--__FILE: filename.ext__-->
\`\`\`language
[Code Content]
\`\`\`

Required Files:
1.  \`index.html\` (Must include React/Tailwind CDNs and mount <App />).
2.  \`App.jsx\` (Main component).
3.  \`components/...\` (Break down complex UIs into components).
4.  \`utils.js\` (For simulated backend logic/helpers).

### 3. CRITICAL RULES
- **No Placeholders**: Do not write "// ... code here". Write the FULL working code.
- **Self-Contained**: The app must run entirely in the browser.
- **Aesthetics**: Google AI Studio / Vercel style. Clean, generous whitespace, subtle borders, Inter font.
- **Error Handling**: Verify inputs and handle empty states visually.
`;

// --- TYPES ---
interface VirtualFile {
  name: string;
  language: string;
  content: string;
}

interface BuilderPageProps {
  onMenuClick: () => void;
}

// --- HELPER: FILE TO BASE64 ---
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

// --- INITIAL STATE ---
const INITIAL_MSG: ChatMessage = {
  id: 'init',
  role: 'model',
  content: "I'm Pak Chat Builder. Describe an app (e.g., 'A Kanban board', 'Crypto Dashboard', 'Fitness Tracker'), and I'll architect and build it for you.",
  timestamp: Date.now()
};

export const BuilderPage: React.FC<BuilderPageProps> = ({ onMenuClick }) => {
  // --- STATE: LAYOUT ---
  const [activeTab, setActiveTab] = useState<'prompt' | 'code' | 'preview'>('prompt'); 
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview'); 
  const [isFullScreen, setIsFullScreen] = useState(false); 
  const [previewKey, setPreviewKey] = useState(0); 

  // --- STATE: DATA ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const s = localStorage.getItem('nova_builder_msgs');
        return s ? JSON.parse(s) : [INITIAL_MSG];
    } catch { return [INITIAL_MSG]; }
  });
  
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    try {
        const s = localStorage.getItem('nova_builder_files');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [activeFile, setActiveFile] = useState<string | null>(() => localStorage.getItem('nova_builder_active_file'));

  // --- STATE: INPUT ---
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // --- REFS ---
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('nova_builder_msgs', JSON.stringify(messages)), [messages]);
  useEffect(() => localStorage.setItem('nova_builder_files', JSON.stringify(files)), [files]);
  useEffect(() => { if(activeFile) localStorage.setItem('nova_builder_active_file', activeFile); }, [activeFile]);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, activeTab]);

  // --- LOGIC: CHAT & PARSING ---
  const initChat = () => {
    if (!chatSession.current) {
      // 1. Try Config, 2. Try LocalStorage (from Settings Page), 3. Try Env
      const apiKey = CONFIG.GEMINI_API_KEY || localStorage.getItem('pakchat_gemini_api_key') || process.env.API_KEY || '';
      
      if (!apiKey) {
          throw new Error("API Key missing. Please go to Settings > API Configuration to add your key.");
      }

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
    // Regex to match <!--__FILE: name__--> ... code ...
    const regex = /<!--__FILE:\s*([\w./-]+)\s*-->\s*```(\w+)\n([\s\S]*?)```/g;
    const newFiles: VirtualFile[] = [];
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      newFiles.push({ name: match[1].trim(), language: match[2].trim(), content: match[3] });
    }

    if (newFiles.length > 0) {
      setFiles(newFiles);
      // If active file is not in new files, switch to index.html or App.jsx
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
      initChat(); // Re-init to ensure history/key is fresh
      const botMsgId = (Date.now() + 1).toString();
      setMessages(p => [...p, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);

      let stream;
      if (attachment) {
        // Send with image (Vision)
        const part = await fileToGenerativePart(attachment);
        stream = await chatSession.current!.sendMessageStream({ message: [userMsg.content, part] as any });
      } else {
        stream = await chatSession.current!.sendMessageStream({ message: userMsg.content });
      }

      // Clear attachment after sending starts
      setAttachment(null);
      setAttachmentPreview(null);

      let fullText = '';
      for await (const chunk of stream) {
        const text = (chunk as GenerateContentResponse).text || '';
        fullText += text;
        setMessages(p => {
             const last = p[p.length - 1];
             if (last.id === botMsgId) return [...p.slice(0, -1), { ...last, content: fullText }];
             return p;
        });
      }

      setMessages(p => {
        const last = p[p.length - 1];
        return last.id === botMsgId ? [...p.slice(0, -1), { ...last, isStreaming: false }] : p;
      });

      parseAndSetFiles(fullText);
      setViewMode('preview');
      setActiveTab('preview');
      setPreviewKey(k => k + 1); // Refresh preview

    } catch (e: any) {
      console.error(e);
      let errorMsg = "Error generating code.";
      if (e.message.includes("API Key")) errorMsg = "Error: API Key is missing or invalid. Please check Settings.";
      
      setMessages(p => [...p, { id: Date.now().toString(), role: 'model', content: errorMsg, timestamp: Date.now(), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompiledHtml = () => {
    if (files.length === 0) return '';
    const indexHtml = files.find(f => f.name.toLowerCase() === 'index.html');
    if (!indexHtml) return `<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;"><h3>No index.html generated yet.</h3></body></html>`;

    let html = indexHtml.content;
    const cssFiles = files.filter(f => f.language === 'css');
    const styles = cssFiles.map(f => f.content).join('\n');
    if (styles) html = html.replace('</head>', `<style>${styles}</style></head>`);

    const jsFiles = files.filter(f => ['js', 'jsx', 'javascript'].includes(f.language));
    const scripts = jsFiles.map(f => {
       const isReact = f.name.endsWith('jsx') || f.content.includes('from \'react\'');
       return `<script ${isReact ? 'type="text/babel"' : ''} data-file="${f.name}">${f.content}</script>`;
    }).join('\n');
    
    html = html.replace('</body>', `${scripts}</body>`);
    return html;
  };

  const runPreview = () => {
    setPreviewKey(p => p + 1); 
    setActiveTab('preview'); 
    setViewMode('preview'); 
  };

  const handleReset = () => {
    if (confirm("Clear current project and start over?")) {
        setMessages([INITIAL_MSG]);
        setFiles([]);
        localStorage.removeItem('nova_builder_msgs');
        localStorage.removeItem('nova_builder_files');
        chatSession.current = null; // Reset session
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('html')) return <span className="text-orange-500 font-bold text-xs">&lt;/&gt;</span>;
    if (name.endsWith('css')) return <span className="text-blue-400 font-bold text-xs">#</span>;
    if (name.endsWith('jsx')) return <span className="text-cyan-400 font-bold text-xs">⚛</span>;
    return <span className="text-yellow-400 font-bold text-xs">JS</span>;
  };

  const currentFileContent = files.find(f => f.name === activeFile)?.content || '';

  // --- HANDLE FILE INPUT ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-gray-900 font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <header className="h-14 bg-[#1e1e1e] text-white flex items-center justify-between px-4 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="p-2 text-gray-400 hover:text-white md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
             <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center font-bold text-sm">P</div>
             <span className="font-semibold tracking-wide hidden sm:block">Pak Chat Studio</span>
          </div>
          <div className="h-5 w-px bg-gray-600 mx-2 hidden sm:block"></div>
          <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
            Reset
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: PROMPT */}
        <div className={`
            flex-col bg-gray-50 border-r border-gray-200 w-full md:w-[350px] lg:w-[400px] xl:w-[450px] shrink-0
            ${isFullScreen ? 'hidden' : (activeTab === 'prompt' ? 'flex' : 'hidden md:flex')}
        `}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">{m.role === 'user' ? 'You' : 'Pak Chat'}</span>
                 <div className={`p-3.5 rounded-xl text-sm leading-relaxed max-w-[95%] shadow-sm ${m.role === 'user' ? 'bg-white border border-gray-200 text-gray-800' : 'bg-transparent pl-0 pt-0 text-gray-700'}`}>
                    {m.role === 'user' ? m.content : <SimpleMarkdown content={m.content} />}
                 </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-center gap-2 p-4 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <span>Architecting solution...</span>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 bg-white border-t border-gray-200">
             {/* Preview of Attached Image */}
             {attachmentPreview && (
                <div className="relative w-16 h-16 mb-2 group border border-gray-200 rounded-lg overflow-hidden">
                   <img src={attachmentPreview} className="w-full h-full object-cover" alt="Preview" />
                   <button 
                     onClick={() => {setAttachment(null); setAttachmentPreview(null)}} 
                     className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5"
                   >
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </div>
             )}

             <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-gray-300">
                <textarea 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Describe your app..."
                  className="w-full p-3 max-h-32 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-sm resize-none"
                  rows={1}
                />
                <div className="flex justify-between items-center px-2 pb-2">
                   <div className="flex gap-1 items-center">
                      
                      {/* Voice Input */}
                      <button onClick={() => {
                          const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                          if (!Speech) return alert("Browser not supported");
                          const rec = new Speech();
                          rec.onstart = () => setIsListening(true);
                          rec.onend = () => setIsListening(false);
                          rec.onresult = (e: any) => setInput(p => p + ' ' + e.results[0][0].transcript);
                          rec.start();
                      }} className={`p-2 rounded-full hover:bg-gray-100 ${isListening ? 'text-red-500' : 'text-gray-400'}`}>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                      </button>

                      {/* Attachment Button (Incircle Plus) */}
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors"
                        title="Attach Image"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                      </button>
                      
                      {/* Hidden File Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                      />

                   </div>
                   <button onClick={handleSend} disabled={!input.trim() && !attachment} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT PANE: WORKBENCH */}
        <div className={`
            flex-1 bg-[#1e1e1e] flex flex-col overflow-hidden relative
            ${activeTab === 'prompt' ? 'hidden md:flex' : 'flex'}
        `}>
           <div className="h-10 bg-[#252526] border-b border-[#333] flex items-center justify-between px-3 shrink-0">
               <div className="flex items-center gap-3">
                   <div className="flex items-center bg-[#333] rounded p-0.5">
                       <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Preview</button>
                       <button onClick={() => setViewMode('code')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'code' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Code</button>
                   </div>
                   <button onClick={runPreview} className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-semibold shadow-sm transition-all border border-green-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Run
                   </button>
                   <button onClick={() => setIsFullScreen(!isFullScreen)} className={`p-1.5 rounded hover:bg-[#333] text-gray-400 hover:text-white transition-colors ${isFullScreen ? 'text-blue-400' : ''}`} title="Toggle Fullscreen">
                     {isFullScreen ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10H4v5m11-5h5v5m-5-11h5v5m-11 5H4v-5"/></svg>
                     ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                     )}
                   </button>
               </div>
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar ml-4">
                   {files.map(f => (
                       <button key={f.name} onClick={() => { setActiveFile(f.name); setViewMode('code'); }} className={`flex items-center gap-2 px-3 py-1 text-xs border-r border-[#333] min-w-max transition-colors rounded-sm ${activeFile === f.name ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                           {getFileIcon(f.name)} {f.name}
                       </button>
                   ))}
               </div>
           </div>

           <div className="flex-1 flex overflow-hidden">
               <div className={`bg-[#1e1e1e] flex-col overflow-hidden transition-all duration-300 ${viewMode === 'code' ? 'flex w-full' : 'hidden'}`}>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                       {files.length > 0 ? (
                           <pre className="text-sm font-mono text-gray-300 p-4 leading-6 tab-4"><code dangerouslySetInnerHTML={{ __html: currentFileContent.replace(/</g, '&lt;') }} /></pre>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-gray-600"><span className="text-sm">Generated code will appear here</span></div>
                       )}
                   </div>
               </div>
               <div className={`bg-white flex-col overflow-hidden transition-all duration-300 ${viewMode === 'preview' ? 'flex w-full' : 'hidden'}`}>
                   {files.length > 0 ? (
                       <iframe key={previewKey} title="App Preview" srcDoc={getCompiledHtml()} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups" />
                   ) : (
                       <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                           <h3 className="text-gray-900 font-medium">Ready to Build</h3>
                           <p className="text-sm mt-2">Enter a prompt to generate your app.</p>
                       </div>
                   )}
               </div>
           </div>
        </div>
      </div>

      {/* MOBILE TABS */}
      <div className="md:hidden h-14 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-around shrink-0 z-50">
          <button onClick={() => setActiveTab('prompt')} className={`flex flex-col items-center gap-1 ${activeTab === 'prompt' ? 'text-blue-400' : 'text-gray-500'}`}><span className="text-[10px]">Chat</span></button>
          <button onClick={() => setActiveTab('code')} className={`flex flex-col items-center gap-1 ${activeTab === 'code' ? 'text-blue-400' : 'text-gray-500'}`}><span className="text-[10px]">Code</span></button>
          <button onClick={() => setActiveTab('preview')} className={`flex flex-col items-center gap-1 ${activeTab === 'preview' ? 'text-green-400' : 'text-gray-500'}`}><span className="text-[10px]">Preview</span></button>
      </div>

    </div>
  );
};
