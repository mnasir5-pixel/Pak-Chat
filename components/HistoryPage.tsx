
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { ActionModal } from './ActionModal';

interface HistoryPageProps {
  sessions: ChatSession[];
  onLoadSession: (id: string, type: 'chat' | 'tutor' | 'english-tutor' | 'study-school') => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onStartNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onShareSession: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ 
  sessions, 
  onLoadSession, 
  onDeleteSession,
  onStartNewChat,
  onRenameSession,
  onShareSession
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'chat' | 'tutor' | 'english-tutor' | 'study-school' | null>(null);
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
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    sessionId: '',
    action: 'rename'
  });

  // Helper to filter sessions
  const getFilteredSessions = (type: string) => sessions.filter(s => s.type === type);
  const getCount = (type: string) => getFilteredSessions(type).length;

  const handleRenameClick = (id: string, currentTitle: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuSessionId(null);
      setModalConfig({
        isOpen: true,
        type: 'prompt',
        title: 'Rename Conversation',
        defaultValue: currentTitle,
        sessionId: id,
        action: 'rename',
        isDestructive: false
      });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuSessionId(null);
      setModalConfig({
        isOpen: true,
        type: 'confirm',
        title: 'Delete Conversation?',
        sessionId: id,
        action: 'delete',
        isDestructive: true
      });
  };

  const handleModalConfirm = (value?: string) => {
      if (modalConfig.action === 'rename' && value) {
          onRenameSession(modalConfig.sessionId, value);
      } else if (modalConfig.action === 'delete') {
          // Create a synthetic event or just pass the ID if the handler supports it
          // The App.tsx handler expects an event for stopPropagation, but we can pass a dummy one or null
          // However, checking App.tsx, it uses 'e' to stop propagation. 
          // We already stopped propagation when clicking the button. 
          // We can create a fake event object.
          const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
          onDeleteSession(modalConfig.sessionId, fakeEvent);
      }
      setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setActiveMenuSessionId(null);
      onShareSession(id);
  };

  // --- DASHBOARD VIEW (Main Buttons) ---
  if (!selectedCategory) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 animate-in fade-in zoom-in duration-300">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">History Dashboard</h2>
          <p className="text-gray-500 mt-2">Select a category to view your saved conversations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pak Chat Button */}
          <button 
            onClick={() => setSelectedCategory('chat')} 
            className="group flex items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">P</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-700">Pak Chat History</h3>
               <p className="text-sm text-gray-500 mt-1">{getCount('chat')} Conversations</p>
             </div>
             <div className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>

          {/* Chinese Tutor Button */}
          <button 
            onClick={() => setSelectedCategory('tutor')} 
            className="group flex items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-red-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">🇨🇳</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-700">Chinese Tutor History</h3>
               <p className="text-sm text-gray-500 mt-1">{getCount('tutor')} Lessons</p>
             </div>
             <div className="text-gray-300 group-hover:text-red-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>

          {/* English Tutor Button */}
          <button 
            onClick={() => setSelectedCategory('english-tutor')} 
            className="group flex items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-green-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">🇬🇧</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-700">English Tutor History</h3>
               <p className="text-sm text-gray-500 mt-1">{getCount('english-tutor')} Lessons</p>
             </div>
             <div className="text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>

          {/* Study School Button */}
          <button 
            onClick={() => setSelectedCategory('study-school')} 
            className="group flex items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-purple-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">🎓</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-lg group-hover:text-purple-700">Study School History</h3>
               <p className="text-sm text-gray-500 mt-1">{getCount('study-school')} Classes</p>
             </div>
             <div className="text-gray-300 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>
        </div>
      </div>
    );
  }

  // --- LIST VIEW (Specific Category) ---
  const filteredSessions = getFilteredSessions(selectedCategory);
  
  const getTheme = () => {
      switch(selectedCategory) {
          case 'tutor': return { label: 'Chinese Tutor', color: 'red', icon: '🇨🇳' };
          case 'english-tutor': return { label: 'English Tutor', color: 'green', icon: '🇬🇧' };
          case 'study-school': return { label: 'Study School', color: 'purple', icon: '🎓' };
          default: return { label: 'Pak Chat', color: 'blue', icon: 'P' };
      }
  };
  const theme = getTheme();

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-6 overflow-y-auto" onClick={() => setActiveMenuSessionId(null)}>
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setSelectedCategory(null)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Back to Dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
            <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-${theme.color}-100 text-${theme.color}-600`}>{theme.icon}</span>
                {theme.label} History
            </h2>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mx-2">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No history found</h3>
          <p className="text-gray-500 max-w-xs mt-2">You haven't had any conversations in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-10">
          {filteredSessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onLoadSession(session.id, selectedCategory)}
              className={`group relative bg-white border border-gray-200 hover:border-${theme.color}-400 hover:shadow-md rounded-xl p-5 cursor-pointer transition-all duration-200 flex items-center justify-between`}
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold text-gray-800 line-clamp-1 group-hover:text-${theme.color}-700 transition-colors`}>
                    {session.title}
                  </h3>
                  {session.subjectId && (
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 uppercase tracking-wide font-bold">{session.subjectId}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(session.timestamp).toLocaleDateString()} &bull; {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="relative flex items-center gap-3">
                 <span className={`text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity text-${theme.color}-600 hidden sm:block mr-2`}>
                    Open
                 </span>
                 
                 {/* MENU BUTTON (3 Dots) */}
                 <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id); }}
                    className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                    title="Options"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                 </button>

                 {/* DROPDOWN MENU */}
                 {activeMenuSessionId === session.id && (
                     <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95">
                         <button 
                            onClick={(e) => handleRenameClick(session.id, session.title, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                         >
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             Rename
                         </button>
                         <button 
                            onClick={(e) => handleShare(session.id, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                         >
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                             Share
                         </button>
                         <div className="border-t border-gray-100 my-1"></div>
                         <button 
                            onClick={(e) => handleDeleteClick(session.id, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                         >
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             Delete
                         </button>
                     </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RENDER MODAL */}
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
