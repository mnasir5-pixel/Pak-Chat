import React, { useState, useEffect } from 'react';
import { X, Languages, Globe, User, Plus, Sparkles, Shield, UserCheck, MessageSquare, GraduationCap, BarChart } from 'lucide-react';
import { Tutor } from '../types';

interface HireAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Tutor>) => void;
  editingAgent?: Tutor | null;
}

const DEFAULT_LANGUAGES = [
    'English', 'Urdu', 'Spanish', 'Mandarin Chinese', 
    'Hindi', 'Arabic', 'French', 'Bengali', 
    'Portuguese', 'Russian', 'Japanese', 'German'
];

const AGENT_ICONS = ['🇨🇳', '🇬🇧', '🇪🇸', '🇫🇷', '🇩🇪', '🇯🇵', '🇰🇷', '🇸🇦', '🇷🇺', '🇮🇹', '🇧🇷', '👤'];

export const HireAgentModal: React.FC<HireAgentModalProps> = ({ isOpen, onClose, onSave, editingAgent }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [role, setRole] = useState<'agent' | 'assistant'>('agent');
  const [icon, setIcon] = useState('👤');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isAddingNewLang, setIsAddingNewLang] = useState(false);
  const [newLangInput, setNewLangInput] = useState('');

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setDescription(editingAgent.description || '');
      setLanguage(editingAgent.targetLanguage);
      setRole(editingAgent.role || 'agent');
      setIcon(editingAgent.icon || '👤');
      setPriority(editingAgent.priority || 'Medium');
      const isCustom = !DEFAULT_LANGUAGES.includes(editingAgent.targetLanguage);
      setIsAddingNewLang(isCustom);
      if (isCustom) {
          setNewLangInput(editingAgent.targetLanguage);
      }
    } else {
      setName('');
      setDescription('');
      setLanguage('English');
      setRole('agent');
      setIcon('👤');
      setPriority('Medium');
      setIsAddingNewLang(false);
      setNewLangInput('');
    }
  }, [editingAgent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLanguage = isAddingNewLang ? newLangInput : language;
    if (isAddingNewLang && !newLangInput.trim()) return;
    onSave({ name, description, targetLanguage: finalLanguage, role, icon, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0a0f] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5 shrink-0 bg-white/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-500/20">
                <UserCheck size={22} />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                {editingAgent ? 'Edit Agent Profile' : 'Contract Intelligence Agent'}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Identification</label>
                <div className="relative">
                <Sparkles className="absolute left-4 top-3.5 text-teal-500" size={18} />
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Linguistic Architect"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold"
                    required
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Avatar Symbol</label>
                <div className="flex flex-wrap gap-2">
                    {AGENT_ICONS.map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setIcon(i)}
                            className={`p-3 rounded-xl border-2 transition-all ${icon === i ? 'bg-teal-600 border-teal-500 shadow-lg' : 'bg-gray-50 dark:bg-black border-transparent grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                        >
                            <span className="text-xl">{i}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Priority Level</label>
                <div className="flex items-center gap-2">
                    {(['High', 'Medium', 'Low'] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                priority === p 
                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg' 
                                : 'bg-gray-50 dark:bg-black border-transparent text-gray-400 hover:border-gray-200'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Core Directives & Behavioral Logic</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Define the agent's tone, expertise level, and personality..."
                    className="w-full p-5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm h-24 resize-none leading-relaxed"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Operational Model</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={() => setRole('agent')}
                        className={`group flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'agent' ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-500/20' : 'bg-gray-50 dark:bg-black border-transparent text-gray-400 hover:border-teal-500/30'}`}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">Mastery Agent</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase mt-1">Autonomous</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setRole('assistant')}
                        className={`group flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'assistant' ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-500/20' : 'bg-gray-50 dark:bg-black border-transparent text-gray-400 hover:border-teal-500/30'}`}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">Tutor Assistant</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase mt-1">Supportive</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />

          {/* LANGUAGE GRID */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Language Track</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {DEFAULT_LANGUAGES.map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => { setLanguage(lang); setIsAddingNewLang(false); }}
                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                            !isAddingNewLang && language === lang 
                            ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-600' 
                            : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => { setIsAddingNewLang(true); }}
                    className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                        isAddingNewLang 
                        ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-600' 
                        : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-gray-300'
                    }`}
                >
                    and other
                </button>
            </div>

            {isAddingNewLang && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-2 px-1">
                        <MessageSquare size={14} className="text-teal-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Enter custom language</span>
                    </div>
                    <input 
                        type="text" 
                        value={newLangInput} 
                        onChange={(e) => setNewLangInput(e.target.value)}
                        placeholder="Type language here..."
                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold text-teal-600"
                        autoFocus
                    />
                </div>
            )}
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/40 shrink-0">
          <button 
            onClick={handleSubmit}
            className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-teal-500/40 transition-all active:scale-95"
          >
            {editingAgent ? 'Save Profile' : 'Finalize Contract'}
          </button>
        </div>
      </div>
    </div>
  );
};