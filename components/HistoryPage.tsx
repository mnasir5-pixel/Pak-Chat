import React, { useState } from 'react';
import { ChatSession } from '../types';
import { ActionModal } from './ActionModal';
// Added missing ArrowLeft, Plus, and MoreVertical icons
import { MessageSquare, Languages, GraduationCap, Sparkles, Library, Mic2, ChevronRight, Clock, Trash2, Share2, Edit2, ArrowLeft, Plus, MoreVertical } from 'lucide-react';

interface HistoryPageProps {
  sessions: ChatSession[];
  onLoadSession: (id: string, type: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onStartNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onShareSession: (id: string) => void;
}

type CategoryID = 'chat' | 'language-tutors' | 'study-school' | 'notes-lm' | 'resource-hub' | 'voice-chat';

export const HistoryPage: React.FC<HistoryPageProps> = ({ 
  sessions, 
  onLoadSession, 
  onDeleteSession,
  onStartNewChat,
  onRenameSession,
  onShareSession
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | null>(null);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    sessionId: string;
    defaultValue?: string;
    isDestructive?: boolean;
    action: 'rename' | 'delete';
  }>({ isOpen: false, type: 'confirm', title: '', sessionId: '', action: 'rename' });

  // Filter out "empty" sessions
  const validSessions = sessions.filter(s => s.messages.length > 0);

  const CATEGORIES = [
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare size={24} />, color: 'blue', desc: 'General conversations' },
    { id: 'language-tutors', label: 'Language Agents', icon: <Languages size={24} />, color: 'teal', desc: 'Fluency & Mastery tracks' },
    { id: 'study-school', label: 'Study Classes', icon: <GraduationCap size={24} />, color: 'purple', desc: 'Subject workspaces' },
    { id: 'notes-lm', label: 'Knowledge Notebooks', icon: <Sparkles size={24} />, color: 'indigo', desc: 'Grounded source research' },
    { id: 'resource-hub', label: 'Librarian Searches', icon: <Library size={24} />, color: 'orange', desc: 'File retrieval logs' },
    { id: 'voice-chat', label: 'Voice Sessions', icon: <Mic2 size={24} />, color: 'rose', desc: 'Audio workspace history' },
  ];

  const getFilteredSessions = (catId: CategoryID) => {
      switch(catId) {
          // Fixed: Simplified comparison to only use valid session types from ChatSession['type']
          case 'language-tutors': return validSessions.filter(s => s.type === 'tutor');
          default: return validSessions.filter(s => s.type === catId as any);
      }
  };

  const handleModalConfirm = (value?: string) => {
      if (modalConfig.action === 'rename' && value) onRenameSession(modalConfig.sessionId, value);
      else if (modalConfig.action === 'delete') onDeleteSession(modalConfig.sessionId, { stopPropagation: () => {} } as any);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  if (!selectedCategory) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in zoom-in duration-500 overflow-y-auto no-scrollbar">
        <div className="mb-12 text-center">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Workspace History</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">All your intelligent sessions, organized by hub.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const count = getFilteredSessions(cat.id as CategoryID).length;
            return (
                <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as CategoryID)} 
                    className="group relative flex flex-col p-8 bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all text-left overflow-hidden active:scale-[0.98]"
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-lg ${
                        cat.color === 'blue' ? 'bg-blue-600 text-white' :
                        cat.color === 'teal' ? 'bg-teal-600 text-white' :
                        cat.color === 'purple' ? 'bg-purple-600 text-white' :
                        cat.color === 'indigo' ? 'bg-indigo-600 text-white' :
                        cat.color === 'orange' ? 'bg-orange-600 text-white' :
                        'bg-rose-600 text-white'
                    }`}>
                        {cat.icon}
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight">{cat.label}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">{cat.desc}</p>
                    <div className="mt-8 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500">{count} Sessions</span>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </button>
            );
          })}
        </div>
      </div>
    );
  }

  const filteredSessions = getFilteredSessions(selectedCategory);
  const activeCat = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-8 overflow-hidden" onClick={() => setActiveMenuSessionId(null)}>
      <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedCategory(null)} className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-all active:scale-90"><ArrowLeft size={24} /></button>
            <div>
                <div className="flex items-center gap-3">
                    <div className="text-blue-600">{activeCat?.icon}</div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{activeCat?.label}</h2>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 ml-9">{filteredSessions.length} ARCHIVED RECORDS</p>
            </div>
          </div>
          <button onClick={onStartNewChat} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"><Plus size={16} /> New Session</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 px-2">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                <Clock size={48} className="text-gray-200 dark:text-gray-800 mb-6" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Vault Empty</h3>
                <p className="text-sm text-gray-500 max-w-xs mt-2 font-medium">Your {activeCat?.label} history will appear here once sessions are initiated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => onLoadSession(session.id, session.type)}
                  className="group relative bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 hover:border-blue-500/40 hover:shadow-xl rounded-[1.8rem] p-5 cursor-pointer transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all"><MessageSquare size={18} /></div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors text-sm uppercase tracking-tight">{session.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            {/* Fixed: Removed non-existent createdAt property */}
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {new Date(session.timestamp).toLocaleDateString()}</span>
                            {session.subjectId && <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-900/40 text-purple-600 px-2 py-0.5 rounded-full uppercase">{session.subjectId}</span>}
                        </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id); }}
                        className="p-2 text-gray-300 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                     ><MoreVertical size={18} /></button>
                     {activeMenuSessionId === session.id && (
                         <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1a22] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden p-1 animate-in zoom-in-95">
                             <button onClick={(e) => { e.stopPropagation(); setActiveMenuSessionId(null); setModalConfig({ isOpen: true, type: 'prompt', title: 'Rename Session', defaultValue: session.title, sessionId: session.id, action: 'rename' }); }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3"><Edit2 size={12} /> Rename</button>
                             <button onClick={(e) => { e.stopPropagation(); onShareSession(session.id); }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3"><Share2 size={12} /> Share</button>
                             <div className="h-px bg-gray-50 dark:bg-white/5 my-1" />
                             <button onClick={(e) => { e.stopPropagation(); setActiveMenuSessionId(null); setModalConfig({ isOpen: true, type: 'confirm', title: 'Permanently Delete?', sessionId: session.id, action: 'delete', isDestructive: true }); }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"><Trash2 size={12} /> Delete</button>
                         </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <ActionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        defaultValue={modalConfig.defaultValue}
        isDestructive={modalConfig.isDestructive}
        confirmText={modalConfig.action === 'delete' ? 'Delete' : 'Save'}
        onConfirm={handleModalConfirm}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};