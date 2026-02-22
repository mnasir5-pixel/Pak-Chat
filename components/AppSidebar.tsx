import React, { useState } from 'react';
import { Tutor, StudySubject, Project } from '../types';
import { 
    LayoutDashboard, MessageSquare, BookOpen, Mic2, 
    GraduationCap, Clock, Settings, Plus, History, ChevronDown, X, 
    Languages, Library, Sparkles, Folder, Menu, Edit3
} from 'lucide-react';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  activeTutorId?: string | null;
  activeSubjectId?: string | null;
  activeProjectId?: string | null;
  tutors: Tutor[];
  subjects: StudySubject[];
  projects: Project[];
  onNavigate: (view: any, id?: string) => void;
  onOpenDeployTutor?: () => void;
  onOpenCreateClass?: () => void; 
  onOpenCreateProject?: () => void;
  onOpenHistory?: (type: 'tutor' | 'school') => void;
  currentTheme?: 'light' | 'dark' | 'system';
  onEditTutor?: (tutor: Tutor) => void;
  onEditSubject?: (subject: StudySubject) => void;
}

interface CategoryProps {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SidebarCategory: React.FC<CategoryProps> = ({ label, icon, isOpen, onToggle, children }) => {
  return (
    <div className="flex flex-col">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
          </div>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <ChevronDown 
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="ml-6 border-l border-gray-100 dark:border-gray-800 flex flex-col gap-1 pl-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const SubItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  variant?: 'default' | 'accent' | 'history';
}> = ({ label, icon, isActive, onClick, onEdit, variant = 'default' }) => (
  <div className="group/item flex items-center w-full">
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200 text-left ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' 
          : variant === 'accent'
            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 font-bold'
            : variant === 'history'
              ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 font-bold italic'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <span className="opacity-70 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
    {onEdit && (
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition-all rounded-md"
        title="Edit Parameters"
      >
        <Edit3 size={14} />
      </button>
    )}
  </div>
);

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentView,
  activeTutorId,
  activeSubjectId,
  activeProjectId,
  tutors,
  subjects,
  projects,
  onNavigate,
  onOpenDeployTutor,
  onOpenCreateClass,
  onOpenCreateProject,
  onOpenHistory,
  currentTheme = 'light',
  onEditTutor,
  onEditSubject
}) => {
  // Fix: All categories now initialize as FALSE so sub-buttons are hidden by default
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    studio: false,
    school: false,
    tutors: false,
    projects: false
  });

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[990] transition-opacity duration-300 backdrop-blur-sm md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        className={`
          fixed md:relative top-0 left-0 h-full z-[1000] md:z-0
          bg-white dark:bg-gray-900 shadow-2xl md:shadow-none
          border-r border-gray-100 dark:border-gray-800
          transition-[transform,width] duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 md:w-72' : '-translate-x-full md:w-0'}
          md:translate-x-0 md:overflow-hidden
        `}
      >
        <div className="w-72 h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
             <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 -ml-1 text-gray-500 hover:text-blue-600 transition-colors" title="Toggle Sidebar">
                  <Menu size={22} />
                </button>
                <div>
                    <span className="font-black text-sm uppercase tracking-tighter text-gray-800 dark:text-white block leading-tight">Pak Chat</span>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors md:hidden">
               <X size={20} />
             </button>
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar border-b border-gray-50 dark:border-gray-800">
              <button onClick={() => onNavigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'dashboard' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <LayoutDashboard size={18} />
                </div>
                <span className="text-sm uppercase tracking-tight">Dashboard</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

              <SidebarCategory 
                label="Projects" 
                icon={<Folder size={18} className="text-blue-500" />}
                isOpen={expandedCats.projects}
                onToggle={() => toggleCat('projects')}
              >
                {projects.map(p => (
                    <SubItem 
                        key={p.id}
                        label={p.name} 
                        icon={<Folder size={14} className="text-blue-400" />} 
                        isActive={activeProjectId === p.id} 
                        onClick={() => onNavigate('history', p.id)} 
                    />
                ))}
                <SubItem 
                    label="New Project" 
                    icon={<Plus size={12} />} 
                    isActive={false} 
                    variant="accent"
                    onClick={() => { if(onOpenCreateProject) onOpenCreateProject(); }} 
                />
              </SidebarCategory>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

              <button onClick={() => onNavigate('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'chat' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'chat' ? 'bg-blue-200/50 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <MessageSquare size={18} />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">Pak Chat</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

              <SidebarCategory 
                label="Knowledge Hub" 
                icon={<BookOpen size={18} className="text-blue-500" />}
                isOpen={expandedCats.studio}
                onToggle={() => toggleCat('studio')}
              >
                <SubItem 
                    label="NotesLM (Sources)" 
                    icon={<Sparkles size={14} className="text-indigo-600" />} 
                    isActive={currentView === 'notes-lm'} 
                    onClick={() => onNavigate('notes-lm')} 
                />
                <SubItem 
                    label="Notes Chat" 
                    icon={<MessageSquare size={14} className="text-blue-500" />} 
                    isActive={currentView === 'general-notes'} 
                    onClick={() => onNavigate('general-notes')} 
                />
                <SubItem 
                    label="Librarian AI" 
                    icon={<Library size={14} className="text-blue-600" />} 
                    isActive={currentView === 'resource-hub'} 
                    onClick={() => onNavigate('resource-hub')} 
                />
                <SubItem 
                    label="Personal Notes" 
                    icon={<span className="text-sm leading-none">📝</span>} 
                    isActive={currentView === 'notes'} 
                    onClick={() => onNavigate('notes')} 
                />
                <SubItem 
                    label="Voice Chat" 
                    icon={<Mic2 size={14} />} 
                    isActive={currentView === 'voice-chat'} 
                    onClick={() => onNavigate('voice-chat')} 
                />
              </SidebarCategory>

              <SidebarCategory 
                label="Study School" 
                icon={<GraduationCap size={18} />}
                isOpen={expandedCats.school}
                onToggle={() => toggleCat('school')}
              >
                {subjects.map(s => (
                    <SubItem 
                        key={s.id}
                        label={s.name} 
                        icon={<span>{s.icon}</span>} 
                        isActive={currentView === 'study-school' && activeSubjectId === s.id} 
                        onClick={() => onNavigate('study-school', s.id)} 
                        onEdit={onEditSubject ? () => onEditSubject(s) : undefined}
                    />
                ))}
                <SubItem 
                    label="New Class" 
                    icon={<Plus size={12} />} 
                    isActive={false} 
                    variant="accent"
                    onClick={() => { if(onOpenCreateClass) onOpenCreateClass(); }} 
                />
                <SubItem 
                    label="Class History" 
                    icon={<History size={12} />} 
                    isActive={false} 
                    variant="history"
                    onClick={() => { if(onOpenHistory) onOpenHistory('school'); }} 
                />
              </SidebarCategory>

              <SidebarCategory 
                label="Language Tutors" 
                icon={<Languages size={18} />}
                isOpen={expandedCats.tutors}
                onToggle={() => toggleCat('tutors')}
              >
                {tutors.map(t => (
                    <SubItem 
                        key={t.id}
                        label={t.name} 
                        icon={<span>{t.icon}</span>} 
                        isActive={currentView === 'tutors' && activeTutorId === t.id} 
                        onClick={() => onNavigate('tutors', t.id)} 
                        onEdit={onEditTutor ? () => onEditTutor(t) : undefined}
                    />
                ))}
                <SubItem 
                    label="Hire Agent" 
                    icon={<Plus size={12} />} 
                    isActive={false} 
                    variant="accent"
                    onClick={() => { if(onOpenDeployTutor) onOpenDeployTutor(); }} 
                />
                <SubItem 
                    label="Tutor History" 
                    icon={<History size={12} />} 
                    isActive={false} 
                    variant="history"
                    onClick={() => { if(onOpenHistory) onOpenHistory('tutor'); }} 
                />
              </SidebarCategory>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

              <button onClick={() => onNavigate('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'history' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'history' ? 'bg-blue-200/50 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Clock size={18} />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">History</span>
              </button>

              <button onClick={() => onNavigate('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'settings' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentTheme === 'dark' ? 'bg-700' : 'bg-gray-100'}`}>
                  <Settings size={18} />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">Settings</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
};