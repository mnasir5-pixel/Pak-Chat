import React from 'react';
import { X, Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (lang: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose, currentLanguage, onSelect }) => {
  if (!isOpen) return null;

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
        
        <div className="p-8 overflow-y-auto no-scrollbar max-h-[60vh] grid grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map(lang => (
                <button 
                    key={lang.code}
                    onClick={() => { onSelect(lang.name); onClose(); }}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all group ${
                        currentLanguage === lang.name 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                        : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-blue-500/30'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.icon}</span>
                        <span className="text-xs font-black uppercase tracking-widest">{lang.name}</span>
                    </div>
                    {currentLanguage === lang.name && <Check size={16} className="text-blue-500" />}
                </button>
            ))}
        </div>

        <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">
            Conversation Intelligence calibrated per selection
        </div>
      </div>
    </div>
  );
};