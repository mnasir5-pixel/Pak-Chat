
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from '../services/config';
import { ChatMessage } from '../types';
import { X, Clipboard, RefreshCw, ChevronDown, Mic, RotateCcw, Maximize2, Move, MessageSquare, History } from 'lucide-react';
import { SimpleMarkdown } from './SimpleMarkdown';

type Blob = {
  data: string;
  mimeType: string;
};

const VOICES = [
  { name: 'Puck', gender: 'Male', desc: 'Playful', intro: "Hello! I'm Puck. Let's have some fun!" },
  { name: 'Charon', gender: 'Male', desc: 'Deep', intro: "Greetings. I am Charon. How may I serve?" },
  { name: 'Kore', gender: 'Female', desc: 'Calm', intro: "Hi there, I'm Kore. How can I help?" },
  { name: 'Fenrir', gender: 'Male', desc: 'Direct', intro: "I am Fenrir. Let's get straight to it." },
  { name: 'Zephyr', gender: 'Female', desc: 'Gentle', intro: "Hello, I'm Zephyr. What's on your mind?" },
];

interface LiveSessionOverlayProps {
  onClose: (transcript: ChatMessage[]) => void;
  onTranscriptUpdate?: (transcript: ChatMessage[]) => void; 
  language: string;
  systemInstruction?: string;
  micAccess?: boolean;
  initialHistory?: ChatMessage[];
}

const cleanTranscriptText = (text: string) => {
  return text.replace(/[*#_~`]/g, '').replace(/\n+/g, ' ').trim();
};

export const LiveSessionOverlay: React.FC<LiveSessionOverlayProps> = ({ onClose, onTranscriptUpdate, language, systemInstruction, micAccess = true, initialHistory = [] }) => {
  const [viewState, setViewState] = useState<'voice-selection' | 'session'>('voice-selection');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState("Offline");
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [showTranscript, setShowTranscript] = useState(true);
  const [localTranscript, setLocalTranscript] = useState<ChatMessage[]>([]);
  
  const isMutedRef = useRef(false);
  const [position, setPosition] = useState({ x: 10, y: 100 });
  const isDragging = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  const messagesRef = useRef<ChatMessage[]>(initialHistory);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setLocalTranscript(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    return () => {
      cleanupSession();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (showTranscript) {
        setTimeout(() => {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  }, [localTranscript, showTranscript]);

  useEffect(() => {
      isMutedRef.current = isMuted;
  }, [isMuted]);

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
    }
    return buffer;
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  const stopAllAudio = () => {
    if (activeSourcesRef.current.length > 0) {
      activeSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
        try { source.disconnect(); } catch (e) {}
      });
      activeSourcesRef.current = [];
    }
    if (audioContextRef.current) { nextStartTimeRef.current = audioContextRef.current.currentTime; }
    if (isConnected) setStatus("Listening...");
    setVolumeLevel(0);
  };

  const syncTranscriptToApp = () => {
      const currentMessages = [...messagesRef.current];
      const displayMessages = [...currentMessages];
      if (currentInputTranscriptionRef.current.trim()) {
          displayMessages.push({ id: 'temp-u', role: 'user', content: cleanTranscriptText(currentInputTranscriptionRef.current), timestamp: Date.now() });
      }
      if (currentOutputTranscriptionRef.current.trim()) {
          displayMessages.push({ id: 'temp-m', role: 'model', content: cleanTranscriptText(currentOutputTranscriptionRef.current), timestamp: Date.now() });
      }
      setLocalTranscript(displayMessages);
      if (onTranscriptUpdate) onTranscriptUpdate(displayMessages);
  };

  const startSession = async () => {
    window.speechSynthesis.cancel();
    setViewState('session');
    try {
      setIsConnecting(true);
      setStatus("Syncing...");
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) return;
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      inputContextRef.current = inputCtx; audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const finalSystemInstruction = (systemInstruction || `Assistant in ${language}.`) + `\nConcise spoken responses only.`;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true); setIsConnecting(false); setStatus("Listening...");
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMutedRef.current) return;
              const data = e.inputBuffer.getChannelData(0);
              let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
              setVolumeLevel(Math.min(Math.sqrt(sum / data.length) * 5, 1));
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({ media: createBlob(data) });
              }
            };
            source.connect(scriptProcessor); scriptProcessor.connect(inputCtx.destination);
            inputSourceRef.current = source; processorRef.current = scriptProcessor;
          },
          onmessage: async (m: LiveServerMessage) => {
             if (m.serverContent?.interrupted) { stopAllAudio(); return; }
             if (m.serverContent?.inputTranscription?.text) { currentInputTranscriptionRef.current += m.serverContent.inputTranscription.text; syncTranscriptToApp(); }
             if (m.serverContent?.outputTranscription?.text) { currentOutputTranscriptionRef.current += m.serverContent.outputTranscription.text; syncTranscriptToApp(); }
             if (m.serverContent?.turnComplete) {
                 if (currentInputTranscriptionRef.current.trim()) { messagesRef.current.push({ id: `u-${Date.now()}`, role: 'user', content: cleanTranscriptText(currentInputTranscriptionRef.current), timestamp: Date.now() }); currentInputTranscriptionRef.current = ''; }
                 if (currentOutputTranscriptionRef.current.trim()) { messagesRef.current.push({ id: `m-${Date.now()}`, role: 'model', content: cleanTranscriptText(currentOutputTranscriptionRef.current), timestamp: Date.now() }); currentOutputTranscriptionRef.current = ''; }
                 syncTranscriptToApp(); setStatus("Listening..."); setVolumeLevel(0);
             }
             const base64 = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64) {
               setStatus("Speaking..."); setVolumeLevel(0.7);
               if (audioContextRef.current) {
                 try {
                   nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                   const buffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
                   const source = audioContextRef.current.createBufferSource();
                   source.buffer = buffer; source.connect(audioContextRef.current.destination);
                   source.onended = () => { activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source); };
                   activeSourcesRef.current.push(source); source.start(nextStartTimeRef.current);
                   nextStartTimeRef.current += buffer.duration;
                 } catch (e) { console.error("Audio decode error", e); }
               }
             }
          },
          onclose: () => cleanupSession(),
          onerror: (err) => { console.error(err); setStatus("Reconnecting..."); setTimeout(() => { if (!isConnected) startSession(); }, 3000); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: finalSystemInstruction,
        },
      });

      sessionPromise.then(session => {
        sessionRef.current = session;
      });
    } catch (e) { setIsConnecting(false); setStatus("Err"); }
  };

  const cleanupSession = () => {
    setIsConnected(false); setIsConnecting(false); setStatus("Offline"); setVolumeLevel(0);
    stopAllAudio();
    if (sessionRef.current) {
      try { 
        if (typeof sessionRef.current.close === 'function') {
          sessionRef.current.close(); 
        }
      } catch (e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (processorRef.current && inputSourceRef.current) { inputSourceRef.current.disconnect(); processorRef.current.disconnect(); }
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    inputContextRef.current = null; audioContextRef.current = null; processorRef.current = null; inputSourceRef.current = null;
  };

  const handleEnd = () => { cleanupSession(); onClose([...messagesRef.current]); };
  const toggleMute = (e: React.MouseEvent) => { e.stopPropagation(); setIsMuted(!isMuted); };
  
  const playVoicePreview = (voiceName: string) => {
    window.speechSynthesis.cancel();
    setSelectedVoice(voiceName);
    const voiceData = VOICES.find(v => v.name === voiceName);
    if (!voiceData) return;
    const utterance = new SpeechSynthesisUtterance(voiceData.intro);
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.name.includes(voiceName)); 
    if (bestVoice) utterance.voice = bestVoice;
    window.speechSynthesis.speak(utterance);
  };

  if (viewState === 'voice-selection') {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#050811] h-[100dvh] w-screen flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-300">
             <div className="w-full flex justify-end">
                <button onClick={() => onClose([])} className="p-2 sm:p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"><X size={24} /></button>
             </div>
             <div className="w-full max-w-2xl text-center flex-1 flex flex-col justify-center">
                 <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tighter">Personality</h2>
                 <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-10 font-medium">Select an agent for <strong>{language}</strong>.</p>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-8">
                     {VOICES.map(voice => (
                         <button 
                            key={voice.name} 
                            onClick={() => playVoicePreview(voice.name)} 
                            className={`p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] text-left transition-all border-2 ${selectedVoice === voice.name ? 'bg-blue-600 border-blue-400 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                         >
                             <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="font-black text-sm sm:text-lg uppercase tracking-tight">{voice.name}</span>
                                {selectedVoice === voice.name && <span className="text-xs">🔊</span>}
                             </div>
                             <span className="block text-[7px] sm:text-[9px] opacity-60 uppercase tracking-widest font-black line-clamp-1">{voice.desc}</span>
                         </button>
                     ))}
                 </div>
                 <button onClick={startSession} className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-white text-gray-900 rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-lg hover:bg-blue-500 hover:text-white transition-all shadow-2xl uppercase tracking-[0.2em] active:scale-95">Initialize Chat</button>
             </div>
             <div className="pb-4 sm:pb-0 text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Secure Neural Uplink v3.1</div>
        </div>
      );
  }

  if (isMinimized) {
    return (
      <div 
        onPointerDown={(e) => { 
          (e.currentTarget as any).setPointerCapture(e.pointerId); 
          isDragging.current = true; 
          dragStartRef.current = { x: e.clientX, y: e.clientY }; 
          startPosRef.current = { ...position }; 
        }}
        onPointerMove={(e) => { if (!isDragging.current) return; const dx = e.clientX - dragStartRef.current.x; const dy = e.clientY - dragStartRef.current.y; setPosition({ x: startPosRef.current.x + dx, y: startPosRef.current.y + dy }); }}
        onPointerUp={(e) => { 
          isDragging.current = false; 
          (e.currentTarget as any).releasePointerCapture(e.pointerId); 
        }}
        style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 9999 }}
        className="flex items-center gap-3 bg-gray-900/95 backdrop-blur-xl border border-white/10 p-2 pl-4 rounded-full shadow-2xl animate-in zoom-in ring-2 ring-blue-500/20 cursor-grab active:cursor-grabbing"
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-[9px] font-black uppercase text-blue-400 whitespace-nowrap">{status}</span>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} title={isMuted ? "Unmute" : "Mute"}><Mic size={18} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Maximize"><Maximize2 size={18} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleEnd(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="End Session"><X size={18} /></button>
      </div>
    );
  }

  return (
    <div className="!fixed !inset-0 !z-[9999] !h-[100dvh] !w-screen bg-[#05070a] text-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#05070a] to-[#05070a] pointer-events-none opacity-50"></div>
      
      <div className="sticky top-0 z-[60] w-full flex items-center justify-between p-4 sm:p-6 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/5">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black tracking-[0.3em] uppercase text-gray-400">Synchronized Agent</span>
         </div>
         <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setShowTranscript(!showTranscript)} className={`p-2 rounded-full transition-all ${showTranscript ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:bg-white/10'}`}><MessageSquare size={20} /></button>
             <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-400 hover:bg-white/10 rounded-full transition-all"><ChevronDown size={24} /></button>
             <button onClick={handleEnd} className="p-2 bg-white/10 rounded-full hover:bg-red-600 transition-all text-white"><X size={20} /></button>
         </div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col overflow-hidden">
         <div className={`flex flex-col items-center justify-center transition-all duration-700 shrink-0 ${showTranscript ? 'h-[40%] md:h-full md:w-1/2 p-4' : 'h-full w-full p-8'}`}>
            <div className="relative w-40 h-40 sm:w-80 sm:h-80 flex items-center justify-center mb-4 sm:mb-10">
                {isConnected && <div className="absolute inset-0 rounded-full bg-blue-600/5 blur-3xl scale-[2] opacity-20"></div>}
                <div className={`w-28 h-28 sm:w-56 sm:h-56 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden ${isConnected ? 'bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/30' : 'bg-gray-800 border-2 border-dashed border-gray-700'}`}>
                   {isConnecting ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <div className="flex gap-2 items-center"><div className="w-1.5 bg-white/80 rounded-full transition-all duration-75" style={{ height: `${12 + volumeLevel * 40}px` }}></div><div className="w-1.5 bg-white/90 rounded-full transition-all duration-100" style={{ height: `${20 + volumeLevel * 70}px` }}></div><div className="w-1.5 bg-white/80 rounded-full transition-all duration-75" style={{ height: `${12 + volumeLevel * 40}px` }}></div></div>}
                </div>
            </div>
            <div className="text-center mb-6 sm:mb-10">
                <h2 className="text-lg sm:text-3xl font-black text-white tracking-tighter uppercase mb-1">{status}</h2>
                <p className="text-[7px] sm:text-[9px] font-bold text-blue-400 uppercase tracking-[0.4em] opacity-50">Neural Stream Active</p>
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-6">
                <button onClick={toggleMute} className={`p-4 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all shadow-xl active:scale-90 ${isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-white text-gray-900 hover:bg-blue-50'}`} title={isMuted ? "Unmute" : "Mute"}><Mic size={24} /></button>
                <button onClick={handleEnd} className="p-4 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] bg-red-600 text-white shadow-2xl hover:bg-red-700 transition-all active:scale-90" title="End Conversation"><RotateCcw size={24} /></button>
            </div>
         </div>

         {showTranscript && (
             <div className="w-full md:w-1/2 h-full bg-[#080b15]/90 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/5 flex flex-col p-4 sm:p-8 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 overflow-hidden">
                 <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0">
                    <div className="flex items-center gap-3"><div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Clipboard size={16} /></div><h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Linguistic Stream</h3></div>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 sm:space-y-6 no-scrollbar scroll-smooth">
                    {initialHistory.length > 0 && (
                        <div className="mb-8 p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-4 text-blue-400">
                                <History size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Context Reminder</span>
                            </div>
                            <div className="space-y-4">
                                {initialHistory.slice(-5).map((msg, idx) => (
                                    <div key={`hist-${idx}`} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} opacity-50`}>
                                        <span className={`text-[7px] font-black uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-gray-500' : 'text-blue-500'}`}>{msg.role === 'user' ? 'User' : 'Assistant'}</span>
                                        <div className="text-[10px] sm:text-xs font-medium leading-relaxed max-w-[90%] text-gray-300">
                                            {msg.content.substring(0, 150)}{msg.content.length > 150 ? '...' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {localTranscript.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${msg.role === 'user' ? 'text-gray-500' : 'text-blue-500'}`}>{msg.role === 'user' ? 'Operator' : 'Agent'}</span>
                            <div className={`max-w-[90%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-[1.2rem] text-xs sm:text-sm font-medium leading-relaxed border ${msg.role === 'user' ? 'bg-[#151928]/80 border-white/5 text-gray-300' : 'bg-[#0a0d18] border-blue-500/10 text-blue-50 shadow-lg shadow-blue-500/5'}`}>
                                <SimpleMarkdown content={msg.content} />
                            </div>
                        </div>
                    ))}
                    <div ref={transcriptEndRef} className="h-4" />
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
