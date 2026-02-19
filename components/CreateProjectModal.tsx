
import React, { useState } from 'react';
import { X, DollarSign, GraduationCap, PenTool, Plane, Hash } from 'lucide-react';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, title: string, description: string, hashtags: string[], tag?: string) => void;
  existingProjects: Project[];
  onSelectProject: (id: string) => void;
}

const TAG_OPTIONS = [
  { id: 'investing', label: 'Investing', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
  { id: 'homework', label: 'Homework', icon: GraduationCap, color: 'text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
  { id: 'writing', label: 'Writing', icon: PenTool, color: 'text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate,
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddHashtag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectName.trim()) return;
    onCreate(projectName, projectTitle || projectName, projectDesc, hashtags, selectedTag || undefined);
    setProjectName('');
    setProjectTitle('');
    setProjectDesc('');
    setHashtags([]);
    setHashtagInput('');
    setSelectedTag(null);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#101018] rounded-[2rem] w-full max-w-xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-white/5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Create New Project</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Internal Reference Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Q4_Expansion"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Display Title</label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Nordic Market Expansion"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Description & Task Instruction</label>
            <textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Provide a detailed task. The AI will strictly follow this description."
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white h-24 resize-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Project Tags</label>
            <div className="relative">
              <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleAddHashtag}
                placeholder="Press Enter to add tags..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-blue-500 transition-all"
              />
            </div>
            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {hashtags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg border border-blue-100 dark:border-blue-800">
                            {tag}
                            <button onClick={() => removeHashtag(tag)} className="hover:text-red-500 transition-colors"><X size={10}/></button>
                        </span>
                    ))}
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all ${
                  selectedTag === tag.id 
                    ? 'ring-2 ring-blue-500/50 border-blue-500 scale-105 bg-blue-50 text-blue-600' 
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                }`}
              >
                <tag.icon size={14} />
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 dark:border-white/5 flex justify-end shrink-0">
          <button 
            onClick={() => handleSubmit()}
            disabled={!projectName.trim()}
            className="px-10 py-4 bg-blue-600 disabled:opacity-30 text-white rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
          >
            Create Intelligence Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
