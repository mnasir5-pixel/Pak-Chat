import React, { useState, useRef, useEffect } from 'react';
import { ChatService } from '../services/geminiService';
import { StudioItem } from '../types';
import { X, Mic, Zap, Image as ImageIcon, Layers, Sliders, Wand2, Scissors, Palette, Move, Download, Edit3, Trash2, Check, ChevronRight, Menu, ArrowLeft } from 'lucide-react';

interface CreativeStudioPageProps {
  onBack: () => void;
  onMenuClick: () => void;
}

/* Fix: Define missing EDITOR_SYSTEM_PROMPT constant */
const EDITOR_SYSTEM_PROMPT = "You are the Pak Chat Creative Engine. You specialize in generating high-quality image prompts and visual content ideas.";

/* Fix: Define missing THEME_TEMPLATES constant */
const THEME_TEMPLATES = [
  { id: 'cinematic', name: 'Cinematic', prompt: 'Cinematic lighting, 8k resolution, highly detailed photorealistic' },
  { id: 'anime', name: 'Anime', prompt: 'Modern anime style, vibrant colors, clean lines' },
  { id: 'abstract', name: 'Abstract', prompt: 'Abstract expressionism, colorful, surreal composition' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Neon lights, futuristic city streets, rainy night' }
];

export const CreativeStudioPage: React.FC<CreativeStudioPageProps> = ({ onBack, onMenuClick }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<StudioItem[]>(() => {
    try {
      const saved = localStorage.getItem('pakchat_studio_results');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'prompt' | 'edit'>('prompt');
  const recognitionRef = useRef<any>(null);

  const [editingItem, setEditingItem] = useState<StudioItem | null>(null);
  const [currentEditBufferUrl, setCurrentEditBufferUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [activeToolCategory, setActiveToolCategory] = useState('ai-options');

  const chatService = useRef(new ChatService(EDITOR_SYSTEM_PROMPT));

  /* Fix: Implement missing handleGenerate function */
  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage('Initializing neural brushes...');

    try {
        const imageUrl = await chatService.current.generateImage(prompt, aspectRatio);
        const newItem: StudioItem = {
            id: Date.now().toString(),
            type: 'image',
            prompt: prompt,
            url: imageUrl,
            timestamp: Date.now()
        };
        const updated = [newItem, ...results];
        setResults(updated);
        localStorage.setItem('pakchat_studio_results', JSON.stringify(updated));
    } catch (e) {
        console.error(e);
        alert("Generation failed.");
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  /* Fix: Implement missing startVoiceInput function */
  const startVoiceInput = (target: 'prompt' | 'edit') => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice recognition not supported.");
        return;
    }

    setVoiceTarget(target);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'prompt') setPrompt(p => p + ' ' + transcript);
        else setEditPrompt(p => p + ' ' + transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#050508] text-white overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar flex flex-col">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col min-h-full">
          
          <div className="flex items-center justify-between mb-6 shrink-0 bg-[#101018]/50 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={onMenuClick} 
                className="p-2 -ml-2 text-gray-400 hover:text-emerald-500 rounded-xl transition-all active:scale-90 hover:bg-white/5"
                title="Open Sidebar"
              >
                <Menu size={24} />
              </button>
              <button 
                onClick={onBack} 
                className="p-2 text-gray-400 hover:text-white transition-all active:scale-90 hover:bg-white/5 rounded-xl"
                title="Back to Dashboard"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                  <ImageIcon size={22} />
              </div>
              <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Creative Studio</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">AI Visual Engine Active</p>
              </div>
            </div>
            <div className="hidden sm:block px-4 py-1.5 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-500/5">
              AI STUDIO ENGINE V3.0
            </div>
          </div>

          {/* MAIN PROMPT AREA */}
          <div className="w-full mb-10 shrink-0 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-[#101018] border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group/prompt">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black text-[9px] font-black">1</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Vision Prompt</span>
              </div>
              
              <div className="relative mb-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isListening && voiceTarget === 'prompt' ? "Listening..." : "Describe the scene..."}
                  className={`w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-xl sm:text-3xl font-light placeholder-gray-800 leading-relaxed min-h-[120px] ${isListening && voiceTarget === 'prompt' ? 'opacity-30' : ''}`}
                />
                <button 
                  onClick={() => startVoiceInput('prompt')}
                  className={`absolute bottom-0 right-0 p-4 rounded-full transition-all ${isListening && voiceTarget === 'prompt' ? 'text-emerald-500 animate-pulse bg-emerald-500/10' : 'text-gray-700 hover:text-emerald-400'}`}
                >
                  <Mic size={28} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-1 backdrop-blur-md flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer py-2 px-4"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Cinema</option>
                      <option value="9:16">9:16 Story</option>
                    </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-black hover:bg-emerald-400 disabled:opacity-20 transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-white/5"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">Initialize generation</span>
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 px-2">
               {THEME_TEMPLATES.map(t => (
                   <button key={t.id} onClick={() => setPrompt(t.prompt)} className="shrink-0 px-4 py-2 rounded-xl border border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">
                       {t.name}
                   </button>
               ))}
            </div>
          </div>

          {/* GALLERY AREA */}
          <div className="flex-1 pb-20">
            <div className="flex items-center justify-between mb-8 px-2">
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black text-[9px] font-black">2</div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-600 tracking-[0.4em]">Output Log</h3>
               </div>
               {results.length > 0 && (
                  <button onClick={() => { if(confirm("Clear results?")) setResults([]); }} className="text-[9px] font-black text-gray-800 hover:text-red-500 uppercase tracking-widest transition-colors">Wipe Memory</button>
               )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 px-2">
              {results.map(item => (
                <div key={item.id} className="group relative bg-[#101018] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <p className="text-xs text-white/80 line-clamp-3 mb-4 italic">"{item.prompt}"</p>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingItem(item); setEditPrompt(''); }} className="flex-1 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">Edit AI</button>
                            <a href={item.url} download={`pakchat-studio-${item.id}.png`} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20"><Download size={18} /></a>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
