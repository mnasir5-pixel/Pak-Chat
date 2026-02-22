import React, { useState } from 'react';
import { X, Globe, Check, MessageSquare } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (lang: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose, currentLanguage, onSelect }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customInput.trim()) {
      onSelect(customInput.trim());
      onClose();
    }
  };

  const isCurrentLangCustom = !SUPPORTED_LANGUAGES.some(l => l.name === currentLanguage);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101018] rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-white/10">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <Globe size={22} />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Output Language</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto no-scrollbar max-h-[60vh] flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button 
                        key={lang.code}
                        onClick={() => { onSelect(lang.name); onClose(); }}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all group ${
                            !isCurrentLangCustom && currentLanguage === lang.name 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-blue-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{lang.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{lang.name}</span>
                        </div>
                        {!isCurrentLangCustom && currentLanguage === lang.name && <Check size={16} className="text-blue-500" />}
                    </button>
                ))}
                
                <button 
                    onClick={() => setIsCustomMode(true)}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all group ${
                        isCurrentLangCustom || isCustomMode
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                        : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-blue-500/30'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🌐</span>
                        <span className="text-xs font-black uppercase tracking-widest">and other</span>
                    </div>
                </button>
            </div>

            {(isCustomMode || isCurrentLangCustom) && (
                <div className="mt-2 p-5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-3xl animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <MessageSquare size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Enter custom target language</span>
                    </div>
                    <form onSubmit={handleCustomSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={customInput || (isCurrentLangCustom ? currentLanguage : '')} 
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Type language name..."
                            className="flex-1 p-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold text-blue-600"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="px-5 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-90"
                        >
                            Set
                        </button>
                    </form>
                </div>
            )}
        </div>

        <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">
            Conversation Intelligence calibrated per selection
        </div>
      </div>
    </div>
  );
};