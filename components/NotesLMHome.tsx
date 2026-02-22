
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Settings, MoreVertical, Book, Trash2, Edit2, Globe, Sun, Moon, Laptop, ChevronRight, X, Menu } from 'lucide-react';
import { ChatSession } from '../types';
import { ActionModal } from './ActionModal';

interface NotesLMHomeProps {
  notebooks: ChatSession[];
  onOpenNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  onDeleteNotebook: (id: string) => void;
  onRenameNotebook: (id: string, newTitle: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onMenuClick: () => void;
}

export const NotesLMHome: React.FC<NotesLMHomeProps> = ({
  notebooks,
  onOpenNotebook,
  onCreateNotebook,
  onDeleteNotebook,
  onRenameNotebook,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onMenuClick
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'theme'>('main');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
        setSettingsView('main');
      }
      // If we clicked outside any notebook menu, close active menus
      if (!(event.target as HTMLElement).closest('.notebook-menu-trigger')) {
          setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { name: 'English', code: 'en-US' },
    { name: 'Urdu', code: 'ur-PK' },
    { name: 'Roman Urdu', code: 'ur-Roman' },
    { name: 'Seraiki', code: 'sr-PK' },
    { name: 'Spanish', code: 'es-ES' },
    { name: 'Mandarin Chinese', code: 'zh-CN' },
    { name: 'Arabic', code: 'ar-SA' },
    { name: 'French', code: 'fr-FR' }
  ];

  const handleDeleteConfirm = () => {
      onDeleteNotebook(deleteModal.id);
      setDeleteModal({ isOpen: false, id: '' });
  };

  return (
    <div className="min-h-full w-full bg-white dark:bg-[#050508] transition-colors duration-300 flex flex-col overflow-y-auto no-scrollbar" onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onMenuClick(); }}
            className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-lg">
            <Book size={18} fill="white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Nâxī ěr NotesLM</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-300"
            >
              <Settings size={18} />
              <span className="text-sm font-bold">Settings</span>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#121218] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] p-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                {settingsView === 'main' && (
                  <div className="flex flex-col">
                    <button 
                      onClick={() => setSettingsView('language')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-gray-400 group-hover:text-blue-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Output Language</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-xs">{language}</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    <button 
                      onClick={() => setSettingsView('theme')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Sun size={18} className="text-gray-400 group-hover:text-orange-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Theme</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-xs capitalize">{theme}</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  </div>
                )}

                {settingsView === 'language' && (
                  <div>
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Language</span>
                       <button onClick={() => setSettingsView('main')} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"><X size={14}/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
                      {languages.map(l => (
                        <button 
                          key={l.code}
                          onClick={() => { onLanguageChange(l.name); setSettingsView('main'); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${language === l.name ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {settingsView === 'theme' && (
                  <div>
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Appearance</span>
                       <button onClick={() => setSettingsView('main')} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"><X size={14}/></button>
                    </div>
                    <div className="py-1">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Laptop }
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => { onThemeChange(t.id as any); setSettingsView('main'); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === t.id ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          <t.icon size={16} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">A</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 sm:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create New Notebook Card */}
          <button 
            onClick={(e) => { e.stopPropagation(); onCreateNotebook(); }}
            className="aspect-[4/3] rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0a0e] flex flex-col items-center justify-center gap-4 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group active:scale-[0.98]"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} className="text-blue-600" strokeWidth={3} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-300">Create New Notebook</span>
          </button>

          {/* Existing Notebooks */}
          {notebooks.map(nb => (
            <div 
              key={nb.id}
              onClick={() => onOpenNotebook(nb.id)}
              className="aspect-[4/3] rounded-[2.5rem] border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0e] flex flex-col p-8 hover:shadow-2xl transition-all cursor-pointer group relative"
            >
              <div className="flex-1 flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-100 dark:text-white/5 group-hover:text-blue-600/20 transition-colors">
                  <Book size={40} />
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-white mb-1 truncate">{nb.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(nb.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {nb.sources?.length || 0} SOURCES
                  </p>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveMenuId(activeMenuId === nb.id ? null : nb.id); 
                    }}
                    className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors notebook-menu-trigger"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenuId === nb.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden p-1 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => { setActiveMenuId(null); setRenameModal({ isOpen: true, id: nb.id, name: nb.title }); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit2 size={12} /> Edit Title
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                      <button 
                        onClick={() => { setActiveMenuId(null); setDeleteModal({ isOpen: true, id: nb.id }); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete Notebook
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <ActionModal 
        isOpen={renameModal.isOpen} 
        type="prompt" 
        title="Rename Notebook" 
        defaultValue={renameModal.name} 
        onConfirm={(val) => val && onRenameNotebook(renameModal.id, val)} 
        onClose={() => setRenameModal({ isOpen: false, id: '', name: '' })} 
      />

      <ActionModal 
        isOpen={deleteModal.isOpen} 
        type="confirm" 
        title="Permanently Delete?" 
        message="This will delete this notebook and all its saved materials, sources, and synthesis history. This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleDeleteConfirm} 
        onClose={() => setDeleteModal({ isOpen: false, id: '' })} 
      />
    </div>
  );
};
