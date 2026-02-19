
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Plus, MoreVertical, BookOpen, Share2, Settings, History, Globe } from 'lucide-react';
import { ChatMessage } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onNewChat: () => void;
  onConfigureClick: () => void; 
  onShareClick: () => void;
  onLanguageClick: () => void;
  onDictionaryClick?: () => void;
  onHistoryClick: () => void; // New prop
  onQuizClick?: () => void; 
  messages?: ChatMessage[];
  language: string;
  title?: string; // New prop for dynamic titles
  description?: string; // New prop for dynamic descriptions
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onNewChat, 
  onConfigureClick, 
  onShareClick, 
  onLanguageClick,
  onDictionaryClick,
  onHistoryClick,
  onQuizClick,
  messages = [],
  language,
  title,
  description
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-black border-b border-gray-100 dark:border-white/5 py-2.5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="p-1.5 -ml-1 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 shrink-0">
            {title ? title.charAt(0) : 'P'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight truncate">
                  {title || "Pak Chat"}
                </h1>
                {!title && (
                   <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-blue-200 dark:border-blue-800 scale-90 sm:scale-100 shrink-0">
                   AI
                   </span>
                )}
            </div>
            {description && (
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-md hidden sm:block">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
        <button 
          onClick={onNewChat}
          className="flex items-center justify-center bg-[#0a0a0f] hover:bg-black text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all shadow-xl shadow-black/10 active:scale-95"
          title="New Chat"
        >
          <Plus size={20} strokeWidth={3} />
        </button>

        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1.5 rounded-xl transition-colors ${isMenuOpen ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
            >
                <MoreVertical size={22} />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#121218] rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-white/10 z-[100] overflow-hidden animate-in fade-in zoom-in-95 p-1">
                    <div className="p-1 space-y-0.5">
                        <button onClick={() => { onHistoryClick(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-4 transition-colors">
                            <History size={18} className="text-blue-600" /> History
                        </button>
                        <button onClick={() => { onLanguageClick(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-4 transition-colors">
                            <Globe size={18} className="text-emerald-500" /> Output: {language}
                        </button>
                        {onDictionaryClick && (
                            <button onClick={() => { onDictionaryClick(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-4 transition-colors">
                                <BookOpen size={18} className="text-indigo-500" /> Dictionary
                            </button>
                        )}
                        <div className="h-px bg-gray-50 dark:bg-white/5 my-1 mx-2"></div>
                        <button onClick={() => { onShareClick(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-4 transition-colors">
                            <Share2 size={18} className="text-gray-400" /> Share Chat
                        </button>
                        <button onClick={() => { onConfigureClick(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-4 transition-colors">
                            <Settings size={18} className="text-gray-400" /> Configure
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};
