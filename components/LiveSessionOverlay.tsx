import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from '../services/config';
import { ChatMessage } from '../types';
import { X, Clipboard, RefreshCw, ChevronDown, Mic, RotateCcw, Maximize2, Move, MessageSquare } from 'lucide-react';

type Blob = {
  data: string;
  mimeType: string;
};

const VOICES = [
  { name: 'Puck', gender: 'Male', desc: 'Playful & Energetic', intro: "Hello! I'm Puck. I'm here to bring some energy and fun to our chat. What's on your mind?" },
  { name: 'Charon', gender: 'Male', desc: 'Deep & Authoritative', intro: "Greetings. I am Charon. I provide clear, direct, and reliable assistance. How may I be of service?" },
  { name: 'Kore', gender: 'Female', desc: 'Calm & Soothing', intro: "Hi there, I'm Kore. I'm here to listen and help you find the answers you need calmly. How can I help?" },
  { name: 'Fenrir', gender: 'Male', desc: 'Resonant & Direct', intro: "I am Fenrir. I speak clearly and get straight to the point. Let's solve your problem together." },
  { name: 'Zephyr', gender: 'Female', desc: 'Gentle & Polished', intro: "Hello, I'm Zephyr. I'll do my best to assist you with grace and precision. What would you like to discuss?" },
];

interface LiveSessionOverlayProps {
  onClose: (transcript: ChatMessage[]) => void;
  onTranscriptUpdate?: (transcript: ChatMessage[]) => void; 
  language: string;
  systemInstruction?: string;
  micAccess?: boolean;
  initialHistory?: ChatMessage[];
}

// Helper to clean transcription text for the UI (removes markdown artifacts)
const cleanTranscriptText = (text: string) => {
  return text
    .replace(/[*#_~`]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ')    // Replace multiple newlines with space for concise voice transcript
    .trim();
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
  const [showTranscript, setShowTranscript] = useState(true); // Default to true as per user request for "well-arranged" transcription section
  const [localTranscript, setLocalTranscript] = useState<ChatMessage[]>([]);
  
  const isMutedRef = useRef(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const isDragging = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Real-time Turn Buffer
  const messagesRef = useRef<ChatMessage[]>([]);
  const currentTurnIdRef = useRef<string | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const stopAllAudio = () => {
    if (activeSourcesRef.current.length > 0) {
      activeSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
        try { source.disconnect(); } catch (e) {}
      });
      activeSourcesRef.current = [];
    }
    if (audioContextRef.current) {
        nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    if (isConnected) setStatus("Listening...");
    setVolumeLevel(0);
  };

  const syncTranscriptToApp = () => {
      const currentMessages = [...messagesRef.current];
      // Inject current real-time chunks if they aren't empty
      const displayMessages = [...currentMessages];
      
      if (currentInputTranscriptionRef.current.trim()) {
          displayMessages.push({
              id: 'temp-input',
              role: 'user',
              content: cleanTranscriptText(currentInputTranscriptionRef.current),
              timestamp: Date.now()
          });
      }
      
      if (currentOutputTranscriptionRef.current.trim()) {
          displayMessages.push({
              id: 'temp-output',
              role: 'model',
              content: cleanTranscriptText(currentOutputTranscriptionRef.current),
              timestamp: Date.now()
          });
      }

      setLocalTranscript(displayMessages);
      if (onTranscriptUpdate) onTranscriptUpdate(displayMessages);
  };

  const startSession = async () => {
    window.speechSynthesis.cancel();
    setViewState('session');

    try {
      setIsConnecting(true);
      setStatus("Connecting...");
      
      if (!micAccess) {
          alert("Microphone access is denied.");
          onClose([]);
          return;
      }

      const apiKey = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!apiKey) {
        alert("API Key is missing.");
        setIsConnecting(false);
        setStatus("Error: No API Key");
        return;
      }

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const chatContext = initialHistory.length > 0
        ? `\n\n[PAST CONVERSATION HISTORY]:\n${initialHistory.filter(m => !m.isStreaming).slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`
        : '';

      const finalSystemInstruction = (systemInstruction || `You are a helpful AI assistant. Speak in ${language}.`) + chatContext + `\n\nMaintain conversation flow. Keep your spoken responses concise.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setStatus("Listening...");

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMutedRef.current) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevel(Math.min(rms * 5, 1));
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            inputSourceRef.current = source;
            processorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.interrupted) { 
                 stopAllAudio(); 
                 // If we were interrupted, commit current transcript buffers as is
                 return; 
             }
             
             // HANDLE REAL-TIME TRANSCRIPTION CHUNKS
             if (message.serverContent?.inputTranscription?.text) {
                 currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                 syncTranscriptToApp();
             }
             if (message.serverContent?.outputTranscription?.text) {
                 currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                 syncTranscriptToApp();
             }
             
             // COMMITTING THE TURN
             if (message.serverContent?.turnComplete) {
                 if (currentInputTranscriptionRef.current.trim()) {
                     messagesRef.current.push({ 
                        id: `li-${Date.now()}-u`, 
                        role: 'user', 
                        content: cleanTranscriptText(currentInputTranscriptionRef.current), 
                        timestamp: Date.now() 
                     });
                     currentInputTranscriptionRef.current = '';
                 }
                 if (currentOutputTranscriptionRef.current.trim()) {
                     messagesRef.current.push({ 
                        id: `li-${Date.now()}-m`, 
                        role: 'model', 
                        content: cleanTranscriptText(currentOutputTranscriptionRef.current), 
                        timestamp: Date.now() 
                     });
                     currentOutputTranscriptionRef.current = '';
                 }
                 
                 syncTranscriptToApp();
                 setStatus("Listening...");
                 setVolumeLevel(0);
             }

             // AUDIO PLAYBACK
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
               setStatus("Assistant Speaking...");
               setVolumeLevel(0.7);
               const outputCtx = audioContextRef.current;
               if (outputCtx) {
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                 const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                 const source = outputCtx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputCtx.destination);
                 source.onended = () => { activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source); };
                 activeSourcesRef.current.push(source);
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
               }
             }
          },
          onclose: () => cleanupSession(),
          onerror: (err) => {
            console.error("Live API Error", err);
            setStatus("Service unavailable. Reconnecting...");
            setTimeout(() => { if (!isConnected) startSession(); }, 3000);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: finalSystemInstruction,
        },
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) {
      setIsConnecting(false);
      setStatus("Failed to start");
    }
  };

  const cleanupSession = () => {
    setIsConnected(false); setIsConnecting(false); setStatus("Offline"); setVolumeLevel(0);
    stopAllAudio();
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (processorRef.current && inputSourceRef.current) { inputSourceRef.current.disconnect(); processorRef.current.disconnect(); }
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    inputContextRef.current = null; audioContextRef.current = null; processorRef.current = null; inputSourceRef.current = null;
  };

  const handleReconnect = (e: React.MouseEvent) => { e.stopPropagation(); cleanupSession(); setTimeout(() => startSession(), 300); };
  const handleEnd = () => { 
      cleanupSession(); 
      // Make sure to commit any last buffers before closing
      const finalTranscript = [...messagesRef.current];
      if (currentInputTranscriptionRef.current.trim()) {
          finalTranscript.push({ id: `f-${Date.now()}-u`, role: 'user', content: cleanTranscriptText(currentInputTranscriptionRef.current), timestamp: Date.now() });
      }
      if (currentOutputTranscriptionRef.current.trim()) {
          finalTranscript.push({ id: `f-${Date.now()}-m`, role: 'model', content: cleanTranscriptText(currentOutputTranscriptionRef.current), timestamp: Date.now() });
      }
      onClose(finalTranscript); 
  };
  
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

  const handlePointerDown = (e: React.PointerEvent) => {
      if (!isMinimized) return;
      if ((e.target as HTMLElement).closest('button')) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      isDragging.current = true; 
      dragStartRef.current = { x: e.clientX, y: e.clientY }; 
      startPosRef.current = { ...position };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging.current || !isMinimized) return;
      const dx = e.clientX - dragStartRef.current.x; 
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({ x: startPosRef.current.x + dx, y: startPosRef.current.y + dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => { 
    if (isDragging.current) { 
      isDragging.current = false; 
      (e.target as Element).releasePointerCapture(e.pointerId); 
    } 
  };

  if (viewState === 'voice-selection') {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#050811] h-[100dvh] w-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute top-6 right-6">
                <button onClick={() => onClose([])} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                    <X size={24} />
                </button>
             </div>
             <div className="w-full max-w-2xl text-center">
                 <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Personality Module</h2>
                 <p className="text-gray-400 mb-8 font-medium">Configure your intelligent conversational partner for <strong>{language}</strong>.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                     {VOICES.map(voice => (
                         <button 
                            key={voice.name} 
                            onClick={() => playVoicePreview(voice.name)} 
                            className={`px-5 py-5 rounded-[2rem] text-left transition-all border-2 ${selectedVoice === voice.name ? 'bg-blue-600 border-blue-500 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'}`}
                         >
                             <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-lg uppercase tracking-tight">{voice.name}</span>
                                {selectedVoice === voice.name && <span className="animate-pulse">🔊</span>}
                             </div>
                             <span className="block text-[8px] opacity-70 uppercase tracking-widest font-black">{voice.gender} • {voice.desc}</span>
                         </button>
                     ))}
                 </div>
                 <button onClick={startSession} className="px-12 py-5 bg-white text-gray-900 rounded-[2rem] font-black text-lg hover:bg-blue-500 hover:text-white transition-all shadow-2xl uppercase tracking-[0.2em] active:scale-95">Initialize Chat</button>
             </div>
        </div>
      );
  }

  if (isMinimized) {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ 
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          cursor: isDragging.current ? 'grabbing' : 'grab'
        }}
        className="flex items-center gap-3 bg-gray-900/95 dark:bg-black/95 backdrop-blur-xl border border-white/10 p-2 pl-4 rounded-full shadow-2xl animate-in zoom-in duration-300 ring-2 ring-blue-500/20"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 whitespace-nowrap">{status}</span>
        </div>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <div className="flex items-center gap-1">
          <button onClick={toggleMute} className={`p-2 rounded-full transition-all ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white'}`}><Mic size={18} /></button>
          <button onClick={() => setIsMinimized(false)} className="p-2 text-gray-400 hover:text-white transition-all"><Maximize2 size={18} /></button>
          <button onClick={handleEnd} className="p-2 text-gray-400 hover:text-red-500 transition-all"><X size={18} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="!fixed !inset-0 !z-[9999] !h-[100dvh] !w-screen bg-[#05070a] text-white flex flex-col items-center animate-in fade-in duration-300 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#05070a] to-[#05070a] pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="sticky top-0 z-[60] w-full flex items-center justify-between p-6 shrink-0 bg-black/20 backdrop-blur-md border-b border-white/5">
         <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Live Synchronized Agent</span>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={() => setShowTranscript(!showTranscript)} className={`p-2 rounded-full transition-all ${showTranscript ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10'}`}><MessageSquare size={20} /></button>
             <button onClick={handleReconnect} className="p-2 text-gray-400 hover:bg-white/10 rounded-full transition-all"><RefreshCw size={20} /></button>
             <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-400 hover:bg-white/10 rounded-full transition-all"><ChevronDown size={24} /></button>
             <button onClick={handleEnd} className="p-2 bg-white/10 rounded-full hover:bg-red-600 transition-all text-white"><X size={20} /></button>
         </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row overflow-hidden">
         
         {/* VISUALIZER SECTION */}
         <div className={`flex flex-col items-center justify-center transition-all duration-700 ${showTranscript ? 'w-full md:w-1/2 p-6' : 'w-full p-8'}`}>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
                {isConnected && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-blue-500/20" style={{ transform: `scale(${1 + volumeLevel * 0.4})`, transition: 'transform 0.1s ease-out' }}></div>
                    <div className="absolute inset-0 rounded-full bg-blue-600/5 blur-3xl" style={{ transform: `scale(${1 + volumeLevel})`, opacity: 0.3 + volumeLevel }}></div>
                  </>
                )}
                <div className={`w-40 h-40 sm:w-56 sm:h-56 rounded-[3rem] flex items-center justify-center transition-all duration-500 shadow-[0_0_80px_rgba(59,130,246,0.3)] overflow-hidden ${isConnected ? 'bg-gradient-to-tr from-blue-700 to-indigo-600' : 'bg-gray-800 border-2 border-dashed border-gray-600'}`}>
                   {isConnecting ? (
                      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                   ) : (
                      <div className="flex gap-2 items-center z-30">
                         {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-1.5 bg-white/90 rounded-full transition-all duration-75" style={{ height: `${10 + (volumeLevel * (20 + i * 15))}px` }}></div>
                         ))}
                      </div>
                   )}
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{status}</h2>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] opacity-60">Neural Uplink Synchronized</p>
            </div>

            <div className="flex items-center justify-center gap-6 mt-12">
                <button onClick={toggleMute} className={`p-6 rounded-[2rem] border-2 transition-all shadow-xl active:scale-90 ${isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-white text-gray-900 hover:bg-blue-50'}`}>
                    {isMuted ? <Mic size={28} className="opacity-50" /> : <Mic size={28} />}
                </button>
                <button onClick={handleEnd} className="p-6 rounded-[2rem] bg-red-600 text-white shadow-2xl transform hover:rotate-12 transition-all active:scale-90">
                    <RotateCcw size={28} />
                </button>
            </div>
         </div>

         {/* TRANSCRIPTION SECTION (Well-Arranged as per screenshot) */}
         {showTranscript && (
             <div className="w-full md:w-1/2 h-full bg-[#080b15]/80 backdrop-blur-xl border-l border-white/5 flex flex-col p-4 sm:p-8 animate-in slide-in-from-right duration-500">
                 <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Clipboard size={16} /></div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Contextual Stream</h3>
                    </div>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-gray-500 tracking-widest">Active Memory</span>
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 space-y-8 no-scrollbar scroll-smooth">
                    {localTranscript.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 px-1 ${msg.role === 'user' ? 'text-gray-500' : 'text-blue-500'}`}>
                                {msg.role === 'user' ? 'You' : 'Assistant'}
                            </span>
                            <div className={`max-w-[90%] px-6 py-4 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-xl border ${msg.role === 'user' ? 'bg-[#151928] border-white/10 text-gray-200' : 'bg-[#0a0d18] border-blue-500/20 text-blue-50'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={transcriptEndRef} className="h-4" />
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live Translation Protocol V3</span>
                    </div>
                    <button onClick={() => messagesRef.current = []} className="text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-red-500 transition-colors">Clear Local Archive</button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
