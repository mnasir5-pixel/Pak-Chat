import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from '../services/config';
import { ChatMessage } from '../types';

// Define Blob type locally
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
  language: string;
  systemInstruction?: string;
}

export const LiveSessionOverlay: React.FC<LiveSessionOverlayProps> = ({ onClose, language, systemInstruction }) => {
  const [viewState, setViewState] = useState<'voice-selection' | 'session'>('voice-selection');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState("Offline");
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Refs for Transcription Buffer
  const messagesRef = useRef<ChatMessage[]>([]);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupSession();
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- AUDIO UTILS ---
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

  // --- VOICE PREVIEW ---
  const playVoicePreview = (voiceName: string) => {
    window.speechSynthesis.cancel();
    setSelectedVoice(voiceName);

    const voiceData = VOICES.find(v => v.name === voiceName);
    if (!voiceData) return;

    const utterance = new SpeechSynthesisUtterance(voiceData.intro);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.name.includes(voiceName)); 
    
    if (!bestVoice) {
       const genderKeywords = voiceData.gender === 'Male' ? ['male', 'david', 'mark', 'james'] : ['female', 'zira', 'google', 'samantha'];
       bestVoice = voices.find(v => genderKeywords.some(k => v.name.toLowerCase().includes(k)));
    }

    if (bestVoice) {
        utterance.voice = bestVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // --- SESSION MANAGEMENT ---
  const startSession = async () => {
    window.speechSynthesis.cancel();
    setViewState('session');

    try {
      setIsConnecting(true);
      setStatus("Connecting...");
      
      const apiKey = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!apiKey) {
        alert("API Key is missing. Please check configuration.");
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

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setIsConnected(true);
            setIsConnecting(false);
            setStatus("Listening...");

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMuted) return;

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
             // Transcription
             if (message.serverContent?.outputTranscription?.text) {
                 currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
             }
             if (message.serverContent?.inputTranscription?.text) {
                 currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
             }
             
             if (message.serverContent?.turnComplete) {
                 if (currentInputTranscriptionRef.current.trim()) {
                     messagesRef.current.push({
                         id: Date.now().toString() + '-user',
                         role: 'user',
                         content: currentInputTranscriptionRef.current.trim(),
                         timestamp: Date.now()
                     });
                     currentInputTranscriptionRef.current = '';
                 }
                 if (currentOutputTranscriptionRef.current.trim()) {
                     messagesRef.current.push({
                         id: Date.now().toString() + '-model',
                         role: 'model',
                         content: currentOutputTranscriptionRef.current.trim(),
                         timestamp: Date.now()
                     });
                     currentOutputTranscriptionRef.current = '';
                 }
                 setStatus("Listening...");
                 setVolumeLevel(0);
             }

             // Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
               setStatus("Pak Chat is speaking...");
               setVolumeLevel(0.5 + Math.random() * 0.3);

               const outputCtx = audioContextRef.current;
               if (outputCtx) {
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                   decode(base64Audio),
                   outputCtx,
                   24000,
                   1
                 );
                 
                 const source = outputCtx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputCtx.destination);
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 
                 setTimeout(() => setVolumeLevel(0), audioBuffer.duration * 1000);
               }
             }
          },
          onclose: () => {
            console.log("Session Closed");
            cleanupSession();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            // Don't kill session immediately on minor errors, but maybe notify
            setStatus("Connection unstable...");
            setTimeout(() => setStatus("Listening..."), 2000);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: systemInstruction || `You are Pak Chat, a helpful and friendly AI assistant. 
          IMPORTANT: You must speak and converse in ${language}. 
          Keep responses concise and conversational.`,
        },
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      setIsConnecting(false);
      setStatus("Failed to start");
    }
  };

  const cleanupSession = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setStatus("Offline");
    setVolumeLevel(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current && inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        processorRef.current.disconnect();
    }

    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();

    inputContextRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
    inputSourceRef.current = null;

    // Flush transcripts
    if (currentInputTranscriptionRef.current.trim()) {
         messagesRef.current.push({
             id: Date.now().toString() + '-user-end',
             role: 'user',
             content: currentInputTranscriptionRef.current.trim(),
             timestamp: Date.now()
         });
    }
    if (currentOutputTranscriptionRef.current.trim()) {
         messagesRef.current.push({
             id: Date.now().toString() + '-model-end',
             role: 'model',
             content: currentOutputTranscriptionRef.current.trim(),
             timestamp: Date.now()
         });
    }
  };

  const handleEnd = () => {
      cleanupSession();
      onClose([...messagesRef.current]);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleCustomize = () => {
      if (isConnected) cleanupSession(); // Must restart to change voice
      setViewState('voice-selection');
  };

  // --- RENDER: VOICE SELECTION ---
  if (viewState === 'voice-selection') {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0a101f] h-[100dvh] w-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute top-6 right-6">
                <button onClick={() => onClose([])} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>

             <div className="w-full max-w-2xl text-center">
                 <h2 className="text-3xl font-light text-white mb-2">Choose your Assistant</h2>
                 <p className="text-gray-400 mb-8">Select a voice to start your live conversation in <strong>{language}</strong>.</p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                     {VOICES.map(voice => (
                         <button
                             key={voice.name}
                             onClick={() => playVoicePreview(voice.name)}
                             className={`px-4 py-4 rounded-2xl text-left transition-all border ${
                                 selectedVoice === voice.name 
                                 ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' 
                                 : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                             }`}
                         >
                             <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-lg">{voice.name}</span>
                                {selectedVoice === voice.name && <span className="animate-pulse">🔊</span>}
                             </div>
                             <span className="block text-xs opacity-70">{voice.gender} &bull; {voice.desc}</span>
                         </button>
                     ))}
                 </div>

                 <button 
                    onClick={startSession}
                    className="px-10 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                >
                    Start Session
                </button>
             </div>
        </div>
      );
  }

  // --- RENDER: LIVE SESSION ---
  return (
    <div className="!fixed !inset-0 !z-[9999] !h-[100dvh] !w-screen flex flex-col bg-[#0a101f] text-white overflow-hidden animate-in fade-in duration-300">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a101f] to-[#0a101f]"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs font-medium tracking-widest uppercase text-gray-400">Live</span>
         </div>
         
         <div className="flex items-center gap-4">
             {/* Customize Button */}
             <button onClick={handleCustomize} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                <span>Customize</span>
             </button>

             {/* Close/End Button (Top Right) */}
             <button onClick={handleEnd} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
         </div>
      </div>

      {/* Visualizer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
         <div className="relative w-72 h-72 flex items-center justify-center mb-6">
            {isConnected && (
              <>
                <div className="absolute inset-0 rounded-full border border-blue-500/30" style={{ transform: `scale(${1 + volumeLevel * 0.5})`, transition: 'transform 0.1s ease-out' }}></div>
                <div className="absolute inset-0 rounded-full border border-teal-500/20" style={{ transform: `scale(${1 + volumeLevel * 1.0})`, transition: 'transform 0.15s ease-out' }}></div>
                <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-3xl" style={{ transform: `scale(${1 + volumeLevel})`, opacity: 0.5 + volumeLevel }}></div>
              </>
            )}
            <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_60px_rgba(59,130,246,0.5)] ${isConnected ? 'bg-gradient-to-tr from-blue-600 to-teal-500' : 'bg-gray-800 border-2 border-dashed border-gray-600'}`}>
               {isConnecting ? (
                  <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                  <div className="flex gap-1.5 h-10 items-center">
                     <div className="w-1.5 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" style={{ height: `${15 + volumeLevel * 40}px` }}></div>
                     <div className="w-1.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" style={{ height: `${25 + volumeLevel * 60}px` }}></div>
                     <div className="w-1.5 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" style={{ height: `${15 + volumeLevel * 40}px` }}></div>
                  </div>
               )}
            </div>
         </div>
         <h2 className="text-3xl font-light text-white tracking-wide text-center mt-4">{status}</h2>
      </div>

      {/* Controls */}
      <div className="relative z-10 p-10 flex justify-center gap-8">
          <button 
              onClick={toggleMute}
              className={`p-5 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
              {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              )}
          </button>

          <button 
              onClick={handleEnd}
              className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-900/50 transform hover:scale-105"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
          </button>
      </div>

    </div>
  );
};