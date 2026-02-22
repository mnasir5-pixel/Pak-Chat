
import React, { useState, useEffect } from 'react';
import { ChatConfig } from '../types';
import { X } from 'lucide-react';

interface ConfigureChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatConfig;
  onSave: (config: ChatConfig) => void;
}

export const ConfigureChatModal: React.FC<ConfigureChatModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ChatConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101018] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-white/10 relative">
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 dark:border-white/5">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Configure Chat</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 overflow-y-auto no-scrollbar">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
            Notebooks can be customized to help you achieve different goals: do research, help learn, show various perspectives, or converse in a particular style and tone.
          </p>

          {/* Goal Section */}
          <div className="mb-10">
            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">
              Define your conversational goal, style, or role
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'default', label: 'Default' },
                { id: 'learning', label: 'Learning Guide' },
                { id: 'custom', label: 'Custom' }
              ].map(goal => (
                <button 
                  key={goal.id}
                  onClick={() => setLocalConfig({...localConfig, style: goal.id as any})}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
                    localConfig.style === goal.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:border-blue-500/50'
                  }`}
                >
                  {localConfig.style === goal.id && <span className="mr-2">✓</span>}
                  {goal.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-4 font-bold italic h-4 px-1">
              {localConfig.style === 'default' && "Best for general purpose research and brainstorming tasks."}
              {localConfig.style === 'learning' && "Explains concepts like a professional tutor and curriculum guide."}
              {localConfig.style === 'custom' && "Uses your custom behavior rules and long-term memory."}
            </p>
          </div>

          {/* Length Section */}
          <div className="mb-4">
            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">
              Choose your response length
            </label>
            <div className="flex flex-wrap gap-2">
               {[
                { id: 'default', label: 'Default' },
                { id: 'long', label: 'Longer' },
                { id: 'short', label: 'Shorter' }
              ].map(len => (
                <button 
                  key={len.id}
                  onClick={() => setLocalConfig({...localConfig, length: len.id as any})}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
                    localConfig.length === len.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:border-blue-500/50'
                  }`}
                >
                  {localConfig.length === len.id && <span className="mr-2">✓</span>}
                  {len.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 dark:border-white/5 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/40 transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
