
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { ActionModal } from './ActionModal';

interface HistoryPageProps {
  sessions: ChatSession[];
  onLoadSession: (id: string, type: 'chat' | 'tutor' | 'english-tutor' | 'study-school' | 'language-tutor') => void;
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
  // Unified category state
  const [selectedCategory, setSelectedCategory] = useState<'chat' | 'language-tutors' | 'study-school' | null>(null);
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

  // Filter out "empty" sessions (e.g., just welcome message)
  const validSessions = sessions.filter(s => s.messages.length > 1);

  // Helper to filter sessions
  const getFilteredSessions = (category: string) => {
      if (category === 'language-tutors') {
          // Aggregate all tutor types (Legacy Chinese 'tutor', Legacy English 'english-tutor', and new 'language-tutor')
          return validSessions.filter(s => 
              s.type === 'tutor' || 
              s.type === 'english-tutor' || 
              s.type === 'language-tutor'
          );
      }
      return validSessions.filter(s => s.type === category);
  };

  const getCount = (category: string) => getFilteredSessions(category).length;

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
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">History Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Select a category to view your saved conversations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pak Chat Button */}
          <button 
            onClick={() => setSelectedCategory('chat')} 
            className="group flex items-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">P</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-blue-700 dark:group-hover:text-blue-400">Pak Chat History</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getCount('chat')} Conversations</p>
             </div>
             <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>

          {/* Unified Language Tutors Button */}
          <button 
            onClick={() => setSelectedCategory('language-tutors')} 
            className="group flex items-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-teal-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">🗣️</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-teal-700 dark:group-hover:text-teal-400">Language Tutor History</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getCount('language-tutors')} Lessons</p>
             </div>
             <div className="text-gray-300 dark:text-gray-600 group-hover:text-teal-500 transform group-hover:translate-x-1 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>

          {/* Study School Button */}
          <button 
            onClick={() => setSelectedCategory('study-school')} 
            className="group flex items-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-purple-400 transition-all text-left"
          >
             <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
               <span className="font-bold text-2xl">🎓</span>
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-purple-700 dark:group-hover:text-purple-400">Study School History</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getCount('study-school')} Classes</p>
             </div>
             <div className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-transform">
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
          case 'language-tutors': return { label: 'Language Tutor', color: 'teal', icon: '🗣️' };
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
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Back to Dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
            <h2 className={`text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-${theme.color}-100 dark:bg-${theme.color}-900/30 text-${theme.color}-600 dark:text-${theme.color}-400`}>{theme.icon}</span>
                {theme.label} History
            </h2>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mx-2">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No history found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mt-2">You haven't had any conversations in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-10">
          {filteredSessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onLoadSession(session.id, session.type as any)} // Use session type to ensure correct router loading
              className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-${theme.color}-400 dark:hover:border-${theme.color}-500 hover:shadow-md rounded-xl p-5 cursor-pointer transition-all duration-200 flex items-center justify-between`}
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold text-gray-800 dark:text-white line-clamp-1 group-hover:text-${theme.color}-700 dark:group-hover:text-${theme.color}-400 transition-colors`}>
                    {session.title}
                  </h3>
                  {session.subjectId && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">{session.subjectId}</span>
                  )}
                  {/* Tutor Language Badge */}
                  {selectedCategory === 'language-tutors' && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">
                          {session.type === 'tutor' ? 'Chinese' : session.type === 'english-tutor' ? 'English' : 'Language'}
                      </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                        Started: {new Date(session.createdAt || session.timestamp).toLocaleDateString()}
                    </span>
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                 <span className={`text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity text-${theme.color}-600 dark:text-${theme.color}-400 hidden sm:block mr-2`}>
                    Open
                 </span>
                 
                 {/* MENU BUTTON (3 Dots) */}
                 <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id); }}
                    className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
                    title="Options"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                 </button>

                 {/* DROPDOWN MENU */}
                 {activeMenuSessionId === session.id && (
                     <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-in fade-in zoom-in-95">
                         <button 
                            onClick={(e) => handleRenameClick(session.id, session.title, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                         >
                             Rename
                         </button>
                         <button 
                            onClick={(e) => handleShare(session.id, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                         >
                             Share
                         </button>
                         <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                         <button 
                            onClick={(e) => handleDeleteClick(session.id, e)} 
                            className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                         >
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

