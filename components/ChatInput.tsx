
import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { X, Plus, Image as ImageIcon, FileText, Music, FileVideo, Mic, Sparkles, Send, Globe, MessageSquare, Zap, Trash2, StopCircle, BrainCircuit } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, attachment?: File) => void;
  onStop?: () => void; 
  onStartLive: () => void;
  isLoading: boolean;
  hardwareAccess?: boolean; 
  language?: string; 
  onRequestMicAccess?: () => void;
  replyingTo?: string | null; 
  onCancelReply?: () => void; 
  value?: string;
  onInputChange?: (val: string) => void;
  placeholder?: string;
  isLiveActive?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, onStop, onStartLive, isLoading, hardwareAccess = true, language = 'English', onRequestMicAccess, replyingTo, onCancelReply, value, onInputChange, placeholder, isLiveActive
}) => {
  const [localInput, setLocalInput] = useState('');
  const input = value !== undefined ? value : localInput;
  
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string>('image');
  const [showMenu, setShowMenu] = useState(false);
  
  const [isListening, setIsListening] = useState(false); 
  const [isRecordingAudio, setIsRecordingAudio] = useState(false); 
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(4));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !isRecordingAudio && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading, isRecordingAudio]); 

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => { adjustHeight(); }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (onInputChange) onInputChange(val);
      else setLocalInput(val);
  };

  const processFile = (file: File) => {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
         setAttachmentType('image');
         setAttachmentPreview(URL.createObjectURL(file));
      } else if (file.type.startsWith('video/')) {
         setAttachmentType('video');
         setAttachmentPreview(null);
      } else if (file.type.startsWith('audio/')) {
         setAttachmentType('audio');
         setAttachmentPreview(null);
      } else {
         setAttachmentType('file');
         setAttachmentPreview(null);
      }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    setShowMenu(false);
  };

  const clearAttachment = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSend(input, attachment || undefined);
    if (onInputChange) onInputChange(''); else setLocalInput('');
    clearAttachment();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleVoiceInput = () => {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!Speech) return alert("Neural Voice unavailable in this browser.");
      const rec = new Speech();
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          const newVal = input ? `${input} ${transcript}` : transcript;
          if (onInputChange) onInputChange(newVal); else setLocalInput(newVal);
      };
      rec.start();
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVisualizer = () => {
        if (!isRecordingAudio && !mediaRecorderRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        const normalized = Math.max(4, Math.min(average / 4, 24));
        setAudioLevels(prev => [...prev.slice(1), normalized]);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            requestAnimationFrame(updateVisualizer);
        }
      };

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        onSend("", audioFile);
        stream.getTracks().forEach(track => track.stop());
        if (audioCtxRef.current) audioCtxRef.current.close();
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordDuration(0);
      setAudioLevels(new Array(20).fill(4));
      updateVisualizer();
      durationIntervalRef.current = window.setInterval(() => setRecordDuration(prev => prev + 1), 1000);
    } catch (err) {
      alert("Please enable microphone access.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.onstop = null; 
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      audioChunksRef.current = [];
      if (audioCtxRef.current) audioCtxRef.current.close();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full mx-auto relative z-20 min-w-0 px-2 sm:px-0">
      {attachment && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-black flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
              {attachmentPreview ? <img src={attachmentPreview} className="w-full h-full object-cover" /> : 
               attachmentType === 'video' ? <FileVideo className="text-orange-500" size={18} /> :
               attachmentType === 'audio' ? <Music className="text-purple-500" size={18} /> :
               <FileText className="text-blue-500" size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black truncate dark:text-white uppercase tracking-tight">{attachment.name}</p>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{attachmentType} • {(attachment.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={clearAttachment} className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-red-500 hover:text-white rounded-full transition-all active:scale-75 shadow-sm"><X size={14} /></button>
          </div>
      )}
      
      {showMenu && (
          <div ref={menuRef} className="absolute bottom-full left-0 mb-3 w-64 bg-white dark:bg-[#101018] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden z-[60] animate-in slide-in-from-bottom-2 p-1">
              <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-4 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-[0.2em] transition-colors">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Plus size={16} /></div> Attach File
              </button>
              <button onClick={() => { if(onInputChange) onInputChange("Synthesize a Mind Map for: "); else setLocalInput("Synthesize a Mind Map for: "); setShowMenu(false); }} className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-4 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] transition-colors">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><BrainCircuit size={16} /></div> Mind Map Root
              </button>
          </div>
      )}

      <div className={`relative bg-white dark:bg-[#101018] rounded-[2rem] border transition-all duration-300 ${isRecordingAudio ? 'border-red-500 ring-4 ring-red-500/10 shadow-[0_10px_40px_rgba(239,68,68,0.2)]' : isListening ? 'border-blue-400 ring-2 ring-blue-400/10 shadow-lg' : 'border-gray-200 dark:border-white/10 focus-within:border-blue-500 shadow-xl'}`}>
        <div className="flex items-end p-1.5 sm:p-2.5 gap-1 sm:gap-2">
          {isRecordingAudio ? (
            <div className="flex-1 flex items-center justify-between px-3 h-[48px] animate-in fade-in duration-300">
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.6)] shrink-0" />
                  <span className="font-mono font-bold text-xs text-red-600 shrink-0">{formatTime(recordDuration)}</span>
                  <div className="flex-1 flex gap-0.5 items-center justify-center px-4 overflow-hidden h-6">
                    {audioLevels.map((lvl, i) => (
                        <div key={i} className="w-0.5 bg-red-500/50 rounded-full transition-all duration-100" style={{ height: `${lvl}px` }} />
                    ))}
                  </div>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  <button onClick={cancelAudioRecording} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Cancel"><Trash2 size={20} /></button>
                  <button onClick={stopAudioRecording} className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xl shadow-red-600/30 transition-all active:scale-90"><Send size={20} /></button>
               </div>
            </div>
          ) : (
            <>
              <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-full transition-colors shrink-0 mb-1 ${showMenu ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}><Plus size={22} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="*/*" />
              <textarea ref={textareaRef} value={input} onPaste={handlePaste} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={placeholder || "Initiate link..."} rows={1} className="flex-1 max-h-[150px] py-3 bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 resize-none no-scrollbar min-w-0" disabled={isLoading}/>
              
              <div className="flex items-center gap-1 mb-1 shrink-0">
                <button onClick={handleVoiceInput} className={`p-2.5 rounded-full transition-colors ${isListening ? 'text-blue-600 bg-blue-50 animate-pulse' : 'text-gray-400 hover:text-blue-600'}`} title="Voice-to-Text"><MessageSquare size={20}/></button>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); startAudioRecording(); }} 
                  onMouseUp={stopAudioRecording}
                  onTouchStart={(e) => { e.preventDefault(); startAudioRecording(); }}
                  onTouchEnd={stopAudioRecording}
                  className="p-2.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 transition-all active:scale-125" 
                  title="Voice Note"
                >
                  <Mic size={22}/>
                </button>
              </div>

              <div className="mb-1 shrink-0">
                {isLoading ? (
                  <button onClick={onStop} className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all active:scale-90"><StopCircle size={22} /></button>
                ) : (input.trim() || attachment) ? (
                  <button onClick={handleSubmit} className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-90"><Send size={22} /></button>
                ) : isLiveActive ? (
                  <button onClick={onStartLive} className="p-2.5 rounded-full bg-red-600 text-white shadow-lg hover:scale-110 active:scale-95 transition-all animate-pulse" title="End Live Session"><StopCircle size={20} fill="currentColor"/></button>
                ) : (
                  <button onClick={onStartLive} className="p-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:scale-110 active:scale-95 transition-all" title="Start Live Session"><Zap size={20} fill="currentColor"/></button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
