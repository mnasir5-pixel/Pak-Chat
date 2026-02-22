
import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';

interface HistorySidebarProps {
  sessions: ChatSession[];
  onLoadSession: (id: string, type: string) => void;
  activeId?: string | null;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ sessions, onLoadSession, activeId }) => {
  const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
        <Clock size={48} className="mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Recent Activity</p>
      </div>
    );
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="mb-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 leading-relaxed">
            Viewing history for this specific module context. Use the sidebar for global activity logs.
         </p>
      </div>
      {sortedSessions.map(session => (
        <button
          key={session.id}
          onClick={() => onLoadSession(session.id, session.type)}
          className={`w-full group flex items-center justify-between p-4 bg-white dark:bg-[#0d0d14] border rounded-2xl transition-all text-left hover:shadow-lg ${
            activeId === session.id 
              ? 'border-blue-500 ring-2 ring-blue-500/10' 
              : 'border-gray-100 dark:border-white/5'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
             <div className={`p-2 rounded-xl shrink-0 ${activeId === session.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-black text-gray-400'}`}>
                <MessageSquare size={16} />
             </div>
             <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-800 dark:text-white truncate uppercase tracking-tight">{session.title}</h4>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{formatDateTime(session.timestamp)}</p>
             </div>
          </div>
          <ArrowRight size={14} className="text-gray-200 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>
      ))}
    </div>
  );
};
