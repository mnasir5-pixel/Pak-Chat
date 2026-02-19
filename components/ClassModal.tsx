import React, { useState, useEffect } from 'react';
import { X, GraduationCap, User, Globe, Plus, MessageSquare, BookOpen, Calculator, Atom, Code, Globe2, Music, Pencil, Palette } from 'lucide-react';
import { StudySubject } from '../types';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<StudySubject>) => void;
  editingClass?: StudySubject | null;
}

const DEFAULT_LANGUAGES = [
  'English', 'Urdu', 'Spanish', 'Mandarin Chinese', 
  'Hindi', 'Arabic', 'French', 'Bengali', 
  'Portuguese', 'Russian', 'Japanese', 'German'
];

const ICONS = [
  { char: '📐', icon: Calculator, label: 'Math' },
  { char: '🧬', icon: Atom, label: 'Science' },
  { char: '💻', icon: Code, label: 'Tech' },
  { char: '🌍', icon: Globe2, label: 'History' },
  { char: '🎵', icon: Music, label: 'Arts' },
  { char: '✍️', icon: Pencil, label: 'Literacy' },
  { char: '🎨', icon: Palette, label: 'Design' },
  { char: '📖', icon: BookOpen, label: 'Study' }
];

export const ClassModal: React.FC<ClassModalProps> = ({ isOpen, onClose, onSave, editingClass }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentName, setAgentName] = useState('');
  const [role, setRole] = useState<'agent' | 'assistant'>('assistant');
  const [language, setLanguage] = useState('English');
  const [icon, setIcon] = useState('📖');
  const [isAddingNewLang, setIsAddingNewLang] = useState(false);
  const [newLangInput, setNewLangInput] = useState('');

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setDescription(editingClass.description || '');
      setAgentName(editingClass.agentName || '');
      setRole(editingClass.type || 'assistant');
      setLanguage(editingClass.language || 'English');
      setIcon(editingClass.icon || '📖');
      setIsAddingNewLang(!DEFAULT_LANGUAGES.includes(editingClass.language || ''));
      if (!DEFAULT_LANGUAGES.includes(editingClass.language || '')) {
          setNewLangInput(editingClass.language || '');
      }
    } else {
      setName('');
      setDescription('');
      setAgentName('');
      setRole('assistant');
      setLanguage('English');
      setIcon('📖');
      setIsAddingNewLang(false);
      setNewLangInput('');
    }
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLanguage = isAddingNewLang ? newLangInput : language;
    onSave({ 
      name, 
      description, 
      agentName, 
      type: role,
      language: finalLanguage,
      icon
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0a0f] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5 shrink-0 bg-white/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20">
                <BookOpen size={22} />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                {editingClass ? 'Update Class Profile' : 'Initialize Classroom'}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Class Title</label>
                <div className="relative">
                <GraduationCap className="absolute left-4 top-3.5 text-blue-500" size={18} />
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Quantum Physics 101"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                    required
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Icon Selection</label>
                <div className="flex flex-wrap gap-2">
                    {ICONS.map((i) => (
                        <button
                            key={i.char}
                            type="button"
                            onClick={() => setIcon(i.char)}
                            className={`p-3 rounded-xl border-2 transition-all ${icon === i.char ? 'bg-purple-600 border-purple-500 shadow-lg' : 'bg-gray-50 dark:bg-black border-transparent grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                        >
                            <span className="text-xl">{i.char}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Instructional Persona & Syllabus</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the objectives and learning depth..."
                    className="w-full p-5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm h-24 resize-none leading-relaxed"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Engagement Model</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={() => setRole('agent')}
                        className={`group flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'agent' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-gray-50 dark:bg-black border-transparent text-gray-400 hover:border-blue-500/30'}`}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">Mastery Agent</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase mt-1">Autonomous</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setRole('assistant')}
                        className={`group flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'assistant' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-gray-50 dark:bg-black border-transparent text-gray-400 hover:border-blue-500/30'}`}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">Assistant</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase mt-1">Supportive</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />

          {/* LANGUAGE GRID */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Instruction Language</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {DEFAULT_LANGUAGES.map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => { setLanguage(lang); setIsAddingNewLang(false); }}
                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                            !isAddingNewLang && language === lang 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600' 
                            : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/40 shrink-0">
          <button 
            onClick={handleSubmit}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
          >
            {editingClass ? 'Save Parameters' : 'Authorize Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};