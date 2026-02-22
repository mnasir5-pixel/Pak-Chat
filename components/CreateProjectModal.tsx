import React, { useState } from 'react';
import { X, Settings, Lightbulb, DollarSign, GraduationCap, PenTool, Plane, Check } from 'lucide-react';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, tag?: string) => void;
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
  existingProjects,
  onSelectProject
}) => {
  const [projectName, setProjectName] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectName.trim()) return;
    onCreate(projectName, selectedTag || undefined);
    setProjectName('');
    setSelectedTag(null);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#101018] rounded-[2rem] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create project</h2>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Project Name Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <PlusIcon size={18} />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Copenhagen Trip"
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Tags / Categories */}
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  selectedTag === tag.id 
                    ? 'ring-2 ring-blue-500/50 border-blue-500 scale-105' 
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${tag.color.split(' ')[0]}`}
              >
                <tag.icon size={16} />
                {tag.label}
              </button>
            ))}
          </div>

          {/* Info Banner */}
          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm h-fit">
              <Lightbulb size={18} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.
            </p>
          </div>

          {/* Existing Projects Highlight */}
          {existingProjects.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Switch to existing</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar">
                {existingProjects.map(proj => (
                   <button 
                    key={proj.id} 
                    onClick={() => onSelectProject(proj.id)}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-xl hover:border-blue-500 transition-all text-left"
                   >
                     <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{proj.name}</span>
                     <ChevronRight size={12} className="text-gray-400" />
                   </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => handleSubmit()}
              disabled={!projectName.trim()}
              className="px-8 py-3 bg-gray-300 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-full font-bold text-sm transition-all hover:bg-gray-400 dark:hover:bg-gray-600 enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700"
            >
              Create project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
);

const ChevronRight = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);