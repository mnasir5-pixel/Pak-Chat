
import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface ChatInputProps {
  onSend: (message: string, attachment?: File) => void;
  onStartLive: () => void;
  isLoading: boolean;
  hardwareAccess?: boolean; 
  language?: string; 
  onRequestMicAccess?: () => void; // New Prop
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStartLive, isLoading, hardwareAccess = true, language = 'English', onRequestMicAccess }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string>('image');
  const [showMenu, setShowMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Max height approx 150px (about 5-6 rows)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment(file);
      
      if (file.type.startsWith('image/')) {
         setAttachmentType('image');
         setAttachmentPreview(URL.createObjectURL(file));
      } else if (file.type === 'application/pdf') {
         setAttachmentType('pdf');
         setAttachmentPreview(null);
      } else if (file.type.startsWith('audio/')) {
         setAttachmentType('audio');
         setAttachmentPreview(null);
      } else if (file.type.startsWith('video/')) {
         setAttachmentType('video');
         setAttachmentPreview(null);
      } else {
         setAttachmentType('file');
         setAttachmentPreview(null);
      }
    }
    setShowMenu(false);
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    
    onSend(input, attachment || undefined);
    
    setInput('');
    clearAttachment();
    
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLiveClick = () => {
      if (!hardwareAccess) {
          if (onRequestMicAccess) onRequestMicAccess();
          else alert("Microphone access is disabled in Settings.");
          return;
      }
      onStartLive();
  };

  const handleVoiceInput = () => {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!Speech) return alert("Voice input not supported in this browser.");
      
      const rec = new Speech();
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.name === language);
      if (langConfig) {
          rec.lang = langConfig.code;
      } else {
          rec.lang = 'en-US';
      }

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      
      rec.start();
  };

  const handleMenuAction = (action: string) => {
      setShowMenu(false);
      switch(action) {
          case 'file':
              fileInputRef.current?.click();
              break;
          case 'image':
              setInput("Generate an image of ");
              textareaRef.current?.focus();
              break;
          case 'deep':
              setInput("Deep research on: ");
              textareaRef.current?.focus();
              break;
          case 'web':
              setInput("Search for: ");
              textareaRef.current?.focus();
              break;
          case 'study':
              setInput("Teach me about: ");
              textareaRef.current?.focus();
              break;
      }
  };

  const hasContent = input.trim().length > 0 || !!attachment;

  const getAttachmentIcon = () => {
      if (attachmentType === 'pdf') return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100">
              <span className="text-xs font-bold uppercase">PDF</span>
              <span className="text-[10px] truncate max-w-[90%]">{attachment?.name}</span>
          </div>
      );
      if (attachmentType === 'audio') return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-500 rounded-xl border border-purple-100">
              <span className="text-xs font-bold uppercase">AUDIO</span>
              <span className="text-[10px] truncate max-w-[90%]">{attachment?.name}</span>
          </div>
      );
      if (attachmentType === 'video') return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 rounded-xl border border-indigo-100">
              <span className="text-xs font-bold uppercase">VIDEO</span>
              <span className="text-[10px] truncate max-w-[90%]">{attachment?.name}</span>
          </div>
      );
      if (attachmentType === 'file') return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-blue-500 rounded-xl border border-blue-100">
              <span className="text-xs font-bold uppercase">FILE</span>
              <span className="text-[10px] truncate max-w-[90%]">{attachment?.name}</span>
          </div>
      );
      return <img src={attachmentPreview!} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" />;
  };

  return (
    <div className="w-full mx-auto relative">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 relative w-20 h-20 group">
          {getAttachmentIcon()}
          <button 
            onClick={clearAttachment}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* MORE MENU */}
      {showMenu && (
          <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-1">
                  <button onClick={() => handleMenuAction('file')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <span className="text-gray-500">📎</span> Add photos & files
                  </button>
                  <button onClick={() => handleMenuAction('image')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <span className="text-purple-500">🎨</span> Create image
                  </button>
                  <button onClick={() => handleMenuAction('deep')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <span className="text-blue-500">🔭</span> Deep research
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
                  <button onClick={() => handleMenuAction('study')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <span className="text-indigo-500">📖</span> Study and learn
                  </button>
                  <button onClick={() => handleMenuAction('web')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <span className="text-green-500">🌐</span> Web search
                  </button>
              </div>
          </div>
      )}

      {/* Input Container */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-3xl border shadow-sm transition-all duration-300 ${isListening ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-end p-2 md:p-3 gap-2">
          {/* MENU Toggle Button (Plus) */}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full transition-colors flex-shrink-0 mb-1 ${showMenu ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            aria-label="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,text/plain,audio/*,video/*"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : (attachment ? "Add instructions for this file..." : "Ask anything...")}
            rows={1}
            className="flex-1 max-h-[150px] py-3 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none overflow-y-auto leading-normal scrollbar-hide"
            style={{ minHeight: '44px' }}
            disabled={isLoading}
          />

          {/* Voice Input Button */}
          {!hasContent && (
              <button 
                onClick={handleVoiceInput}
                className={`p-2 rounded-full flex-shrink-0 transition-colors mb-1 ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Voice Input"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
              </button>
          )}

          {/* Dynamic Action Button: Send or Live Talk */}
          {hasContent ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="p-2 rounded-full flex-shrink-0 transition-all duration-200 mb-1 bg-blue-600 text-white hover:bg-blue-500 shadow-md transform hover:scale-105"
              aria-label="Send message"
              title="Send Message"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-500 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          ) : (
            <div className="relative flex-shrink-0 mb-1">
              <button
                  onClick={handleLiveClick}
                  className={`relative z-10 p-2 rounded-full transition-all duration-300 flex items-center justify-center w-10 h-10 ${hardwareAccess ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'}`}
                  aria-label="Start Live Talk"
                  title={hardwareAccess ? "Start Live Conversation" : "Enable Microphone Access"}
              >
                  {/* Waveform Icon */}
                  <div className="flex gap-0.5 h-4 items-center">
                      <div className="w-1 bg-current rounded-full h-2"></div>
                      <div className="w-1 bg-current rounded-full h-4"></div>
                      <div className="w-1 bg-current rounded-full h-3"></div>
                      <div className="w-1 bg-current rounded-full h-2"></div>
                  </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
