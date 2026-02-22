import React, { useState } from 'react';
import { ChatSession } from '../types';
import { X, MessageSquare, Clock, Trash2, Share2, Edit2, ChevronRight, History, Search } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onLoadSession: (id: string, type: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onShareSession: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onLoadSession, 
  onDeleteSession,
  onRenameSession,
  onShareSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) && s.messages.length > 0
  ).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-[1000] backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-[#050508] z-[1001] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col border-l border-gray-100 dark:border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-6 py-6 flex justify-between items-center border-b border-gray-50 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                <History size={20} />
             </div>
             <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tighter uppercase">Recent Activity</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-white transition-all bg-gray-50 dark:bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-50 dark:border-white/5">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-transparent rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {filteredSessions.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching logs found</p>
                </div>
            ) : (
                filteredSessions.map(session => (
                    <div 
                        key={session.id}
                        onClick={() => { onLoadSession(session.id, session.type); onClose(); }}
                        className="group p-4 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all hover:shadow-lg"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <MessageSquare size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate uppercase tracking-tight">{session.title}</h3>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); onShareSession(session.id); }} className="p-1.5 text-gray-400 hover:text-blue-500"><Share2 size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id, e); }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(session.timestamp).toLocaleDateString()}</span>
                            </div>
                            <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">{session.type}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        <div className="px-8 py-4 border-t border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-black/20 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 text-center shrink-0">
            Session Vault Synchronized
        </div>
      </div>
    </>
  );
};