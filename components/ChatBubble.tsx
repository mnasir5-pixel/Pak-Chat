
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from '../types';
import { SimpleMarkdown } from './SimpleMarkdown';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ChatService } from '../services/geminiService';

interface ChatBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void;
  onReply?: (content: string) => void;
  language?: string; // Output language for TTS
  translateLanguage?: string; // Target language for Translation Button
  playbackEnabled?: boolean; 
  onBranchChat?: (id: string) => void; // New Prop
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
    message, 
    isLast, 
    onEdit, 
    onRegenerate, 
    onReply, 
    language = 'English', 
    translateLanguage = 'Urdu',
    playbackEnabled = true,
    onBranchChat
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  
  // Edit State (User)
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio/Copy State (Model)
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [isCopied, setIsCopied] = useState(false);
  const [isUserCopied, setIsUserCopied] = useState(false);
  
  // Translation State
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  
  // Menu State
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Source Confirmation State
  const [linkToOpen, setLinkToOpen] = useState<string | null>(null);

  // Refs for TTS
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressRef = useRef<number>(0); // Tracks absolute character index
  const isIntentionalPause = useRef<boolean>(false); // Prevents onEnd from resetting if we paused manually

  // Resize textarea when content changes during edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editContent]);

  // Click outside listener for menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    }
    if (showMenu) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Cleanup audio on unmount or if message changes
  useEffect(() => {
    return () => {
      // If we unmount or change message, cancel everything.
      if (speechState !== 'idle') {
          window.speechSynthesis.cancel();
          setSpeechState('idle');
          progressRef.current = 0;
          isIntentionalPause.current = false;
      }
    };
  }, [message.id]);

  // --- PARSING LOGIC ---
  const { originalCleanText, sourceLinks } = useMemo(() => {
      // Regex to find "**Sources:**" followed by a list of markdown links
      const sourceBlockRegex = /\n\n\*\*Sources:\*\*\n([\s\S]*)$/;
      const match = message.content.match(sourceBlockRegex);
      
      let clean = message.content;
      const links: { title: string, url: string }[] = [];

      if (match) {
          const sourcesText = match[1];
          clean = message.content.replace(sourceBlockRegex, '');
          
          const linkRegex = /-\s+\[(.*?)\]\((.*?)\)/g;
          let linkMatch;
          while ((linkMatch = linkRegex.exec(sourcesText)) !== null) {
              links.push({ title: linkMatch[1], url: linkMatch[2] });
          }
      }
      return { originalCleanText: clean, sourceLinks: links };
  }, [message.content]);

  // Determine content to display
  const displayContent = isTranslated && translatedContent ? translatedContent : originalCleanText;

  // Compute text for reading (Memoized to ensure index consistency)
  const textForReading = useMemo(() => {
      return displayContent
          .replace(/[*#`_]/g, '') // Remove markdown formatting chars
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, remove URL
          .trim();
  }, [displayContent]);

  // --- TTS HANDLERS ---
  const getLanguageCode = (langName: string) => {
      const config = SUPPORTED_LANGUAGES.find(l => l.name === langName);
      if (config) return config.code;
      // Fallback map for common names not in config list
      if (langName === 'Urdu') return 'ur-PK';
      if (langName === 'Arabic') return 'ar-SA';
      if (langName === 'Chinese') return 'zh-CN';
      return 'en-US';
  };

  const startSpeaking = (startIndex: number = 0) => {
      // Always cancel existing speech first
      window.speechSynthesis.cancel();
      isIntentionalPause.current = false;

      // Slice the text from the resume point
      const textSegment = textForReading.substring(startIndex);
      
      if (!textSegment.trim()) {
          setSpeechState('idle');
          progressRef.current = 0;
          return;
      }

      const utterance = new SpeechSynthesisUtterance(textSegment);
      
      // Determine language
      const targetLangName = isTranslated ? translateLanguage : language;
      const targetCode = getLanguageCode(targetLangName || 'English');
      utterance.lang = targetCode;
      
      // Try to find best voice
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang === targetCode);
      if (!voice && targetCode.includes('-')) {
          const base = targetCode.split('-')[0];
          voice = voices.find(v => v.lang.startsWith(base));
      }
      if (voice) utterance.voice = voice;

      // Track progress
      utterance.onboundary = (e) => {
          // IMPORTANT: e.charIndex is relative to the textSegment, NOT the full text.
          // We add startIndex to get the absolute position.
          progressRef.current = startIndex + e.charIndex;
      };

      utterance.onend = () => {
          if (isIntentionalPause.current) return; // Don't reset if we just paused
          setSpeechState('idle');
          progressRef.current = 0;
          utteranceRef.current = null;
      };
      
      utterance.onerror = (e) => {
          if (isIntentionalPause.current) return;
          console.error("TTS Error", e);
          setSpeechState('idle');
          progressRef.current = 0;
          utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setSpeechState('playing');
  };

  const handlePlayPause = () => {
    if (speechState === 'playing') {
      // PAUSE
      isIntentionalPause.current = true;
      window.speechSynthesis.cancel(); // Stop speaking immediately
      setSpeechState('paused');
      // progressRef keeps the last onboundary index
    } else if (speechState === 'paused') {
      // RESUME
      // Start a new utterance from the last known index
      startSpeaking(progressRef.current);
    } else {
      // START FRESH
      progressRef.current = 0;
      startSpeaking(0);
    }
  };

  const cancelSpeech = () => {
      isIntentionalPause.current = false;
      window.speechSynthesis.cancel();
      setSpeechState('idle');
      progressRef.current = 0;
      utteranceRef.current = null;
  };

  // --- Edit Handlers ---
  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // --- Action Handlers ---
  const copyToClipboard = async (text: string, url?: string) => {
      try {
          if (url) {
              try {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  
                  // Only try to copy images to clipboard as files
                  if (blob.type.startsWith('image/')) {
                      // ClipboardItem expects strict types. 'image/png' is safest.
                      const item = new ClipboardItem({
                          [blob.type]: blob,
                          'text/plain': new Blob([text], { type: 'text/plain' })
                      });
                      await navigator.clipboard.write([item]);
                      return true;
                  }
              } catch (e) {
                  console.warn("Clipboard write failed (non-image or unsupported type), falling back to text.");
              }
          }
          
          await navigator.clipboard.writeText(text);
          return true;
      } catch (err) {
          console.error("Copy failed", err);
          return false;
      }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(displayContent, message.attachmentUrl);
    if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleUserCopy = async () => {
    const success = await copyToClipboard(message.content, message.attachmentUrl);
    if (success) {
        setIsUserCopied(true);
        setTimeout(() => setIsUserCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    // Shares the specific message content
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pak Chat Message',
          text: displayContent,
          url: message.attachmentUrl // Some browsers support URL sharing
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
      alert("Content copied to clipboard (Share not supported on this browser)");
    }
  };

  const handleTranslateToggle = async () => {
      // Reset speech if we change content
      if (speechState !== 'idle') cancelSpeech();

      if (isTranslated) {
          setIsTranslated(false); // Toggle back to original
          return;
      }

      if (translatedContent) {
          setIsTranslated(true); // Toggle to existing translation
          return;
      }

      const targetLang = translateLanguage || 'Urdu';

      setIsTranslating(true);
      try {
          const translation = await ChatService.translateText(originalCleanText, targetLang);
          if (translation) {
              setTranslatedContent(translation);
              setIsTranslated(true);
          } else {
              throw new Error("Empty translation result");
          }
      } catch (e) {
          console.error("Translation failed", e);
          alert(`Translation to ${targetLang} failed. Please try again.`);
      } finally {
          setIsTranslating(false);
      }
  };
  
  // Helper for attachment rendering
  const renderAttachment = () => {
      if (!message.attachmentUrl) return null;
      const isImage = !message.attachmentType || message.attachmentType === 'image' || message.attachmentType.startsWith('image/');
      const isVideo = message.attachmentType === 'video' || message.attachmentType?.startsWith('video/');
      const isAudio = message.attachmentType === 'audio' || message.attachmentType?.startsWith('audio/');
      
      if (isImage) {
          return (
              <div className="mb-3">
                <img 
                  src={message.attachmentUrl} 
                  alt="User attachment" 
                  className="max-w-full rounded-lg border border-white/20"
                  style={{ maxHeight: '300px' }}
                />
              </div>
          );
      }

      if (isVideo) {
          return (
              <div className="mb-3 max-w-full">
                  <video 
                      src={message.attachmentUrl} 
                      controls 
                      className="max-w-full rounded-lg border border-white/20 max-h-[300px]"
                  >
                      Your browser does not support the video tag.
                  </video>
              </div>
          );
      }

      if (isAudio) {
          return (
              <div className="mb-3 w-full">
                  <audio 
                      src={message.attachmentUrl} 
                      controls 
                      className="w-full"
                  >
                      Your browser does not support the audio tag.
                  </audio>
              </div>
          );
      }

      return (
          <div className="mb-3 flex items-center gap-3 bg-gray-700/50 p-3 rounded-xl border border-white/10">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${message.attachmentType === 'pdf' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {message.attachmentType === 'pdf' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  )}
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{message.attachmentName || 'Attached File'}</p>
                  <p className="text-xs text-gray-400 uppercase">{message.attachmentType || 'File'}</p>
              </div>
          </div>
      );
  };

  return (
    <div className={`flex w-full max-w-full ${isUser ? 'justify-end' : 'justify-start'} group px-1`}>
      <div className={`flex max-w-full w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Message Content */}
        <div className={`flex flex-col gap-1 min-w-0 ${isUser ? 'items-end max-w-[85%] md:max-w-[70%]' : 'items-start max-w-[98%] w-full'}`}>
            <div 
            className={`
                relative p-4 md:p-5 shadow-sm text-sm md:text-base leading-relaxed overflow-hidden break-words
                ${isUser 
                ? 'bg-gray-800 dark:bg-gray-700 text-white rounded-2xl w-fit text-left' 
                : isError 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl w-full' 
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl w-full'
                }
            `}
            >
            {/* Attachment */}
            {renderAttachment()}

            {isEditing ? (
                <div className="min-w-[200px] w-full">
                    <textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:border-blue-500 resize-none text-sm"
                        rows={1}
                        style={{ minHeight: '60px' }}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors">Save & Send</button>
                    </div>
                </div>
            ) : (
                <>
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="text-gray-800 dark:text-gray-200">
                       <SimpleMarkdown content={displayContent} onReply={onReply} />
                       
                       {/* Render Sources */}
                       {sourceLinks.length > 0 && (
                           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                               <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                                   Sources
                               </p>
                               <div className="flex flex-wrap gap-2">
                                   {sourceLinks.map((src, idx) => (
                                       <button 
                                           key={idx}
                                           onClick={() => setLinkToOpen(src.url)}
                                           className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 transition-all max-w-[200px]"
                                           title={src.title}
                                       >
                                           <span className="truncate">{src.title}</span>
                                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0 opacity-50"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 19h-8.5A2.25 2.25 0 012 16.75v-8.5A2.25 2.25 0 014.25 6h4a.75.75 0 010 1.5h-4z" clipRule="evenodd" /><path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" /></svg>
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )}
                    </div>
                )}
                
                {isLast && message.isStreaming && !isUser && (
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-50 animate-pulse"></span>
                )}
                </>
            )}
            </div>
            
            {/* Actions Row */}
            <div className={`flex items-center gap-2 mt-0.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* User Actions */}
                {isUser && !isEditing && !message.isStreaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleUserCopy} className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Copy text">
                             {isUserCopied ? (
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" /></svg>
                             )}
                        </button>
                        <button onClick={() => setIsEditing(true)} className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit message">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                    </div>
                )}

                {/* Model Actions */}
                {!isUser && !isError && !message.isStreaming && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        
                        {/* READ (Only if enabled) */}
                        {playbackEnabled && (
                            <>
                                <button onClick={handlePlayPause} className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors ${speechState === 'playing' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    {speechState === 'playing' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75-.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                                    ) : speechState === 'paused' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                                    ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                                    )}
                                    <span className="hidden sm:inline">{speechState === 'playing' ? 'Pause' : (speechState === 'paused' ? 'Resume' : 'Read')}</span>
                                </button>
                                {(speechState !== 'idle') && (
                                    <button onClick={cancelSpeech} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                            </>
                        )}

                        {/* COPY */}
                        <button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                             {isCopied ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" /></svg>}
                             <span className="hidden sm:inline">Copy</span>
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                        {/* REFRESH (REGENERATE) */}
                        {onRegenerate && (
                            <button onClick={() => onRegenerate(message.id)} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Regenerate response">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                <span className="hidden sm:inline">Regenerate</span>
                            </button>
                        )}

                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                        {/* 3-DOTS MENU TRIGGER */}
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setShowMenu(!showMenu)} 
                                className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ${showMenu ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                                title="More options"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                            </button>

                            {/* DROPDOWN MENU */}
                            {showMenu && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="p-1 space-y-0.5">
                                        {/* Branch in New Chat */}
                                        {onBranchChat && (
                                            <button 
                                                onClick={() => { setShowMenu(false); onBranchChat(message.id); }} 
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Branch in New Chat
                                            </button>
                                        )}

                                        {/* Reply */}
                                        {onReply && (
                                            <button 
                                                onClick={() => { setShowMenu(false); onReply(originalCleanText); }} 
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                                Reply
                                            </button>
                                        )}
                                        
                                        {/* Translate */}
                                        <button 
                                            onClick={() => { setShowMenu(false); handleTranslateToggle(); }} 
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>
                                            {isTranslated ? 'Show Original' : `Translate to ${translateLanguage}`}
                                        </button>

                                        {/* Share */}
                                        <button 
                                            onClick={() => { setShowMenu(false); handleShare(); }} 
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                                            Share
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* LINK CONFIRMATION MODAL */}
      {linkToOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Open External Link?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      You are about to leave Pak Chat and visit an external website:
                      <br/>
                      <span className="block mt-2 font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all text-blue-600 dark:text-blue-400">
                          {linkToOpen}
                      </span>
                  </p>
                  <div className="flex gap-3 justify-end">
                      <button onClick={() => setLinkToOpen(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                      <button onClick={() => { window.open(linkToOpen, '_blank', 'noopener,noreferrer'); setLinkToOpen(null); }} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">Yes, Open Link</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

