
import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, ChatSession } from '../types';

interface StudySubject {
    id: string;
    name: string;
    icon: string;
    color: string;
    instruction?: string;
    isCustom?: boolean;
}

interface StudySchoolPageProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  activeSubject: string | null;
  sessions: ChatSession[];
  // Custom Subjects
  customSubjects: StudySubject[];
  onAddSubject: (subject: StudySubject) => void;
  onDeleteCustomSubject: (id: string) => void;
  // ---
  onSelectSubject: (subject: string) => void;
  onSendMessage: (content: string, attachment?: File) => void;
  onBack: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  language?: string;
  onRegenerate?: (id: string) => void;
  onStartLive: () => void;
}

const DEFAULT_SUBJECTS: StudySubject[] = [
  { id: 'Math', name: 'Mathematics', icon: '📐', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400' },
  { id: 'Science', name: 'Science', icon: '🧬', color: 'bg-green-50 text-green-700 border-green-200 hover:border-green-400' },
  { id: 'English', name: 'English', icon: '📚', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-400' },
  { id: 'AI', name: 'Artificial Intelligence', icon: '🤖', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400' },
  { id: 'AIAgent', name: 'AI Agent', icon: '🕵️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400' },
  { id: 'CyberSecurity', name: 'Cyber Security', icon: '🛡️', color: 'bg-red-50 text-red-700 border-red-200 hover:border-red-400' },
  { id: 'WebDev', name: 'Web Development', icon: '💻', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:border-cyan-400' },
];

export const StudySchoolPage: React.FC<StudySchoolPageProps> = ({ 
  messages, 
  loadingState, 
  activeSubject, 
  sessions,
  customSubjects,
  onAddSubject,
  onDeleteCustomSubject,
  onSelectSubject, 
  onSendMessage,
  onBack,
  onLoadSession,
  onDeleteSession,
  language,
  onRegenerate,
  onStartLive
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  
  // Creator State
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjIcon, setNewSubjIcon] = useState('🎓');
  const [newSubjPrompt, setNewSubjPrompt] = useState('');

  // 1. DASHBOARD VIEW (No subject selected)
  if (!activeSubject) {
    if (showHistory) {
        // --- HISTORY VIEW ---
        const historySessions = sessions.filter(s => s.type === 'study-school');

        return (
            <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-6 overflow-y-auto animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8">
                     <button onClick={() => setShowHistory(false)} className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        Back to School
                     </button>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Class History</h2>
                </div>

                {historySessions.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="text-4xl mb-4">📜</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No class history yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Attend a class to save your notes here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {historySessions.map(session => {
                            const subj = [...DEFAULT_SUBJECTS, ...customSubjects].find(s => s.id === session.subjectId);
                            return (
                                <div key={session.id} onClick={() => onLoadSession(session.id)} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-md rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between h-32 relative">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">{subj?.icon || '🎓'}</span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{subj?.name || 'Class'}</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-1">{session.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(session.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="text-xs font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Open Class &rarr;</span>
                                        <button onClick={(e) => onDeleteSession(session.id, e)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 z-10"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    const handleCreateSubmit = () => {
        if (!newSubjName.trim() || !newSubjPrompt.trim()) return;
        
        const newSubject: StudySubject = {
            id: `custom-${Date.now()}`,
            name: newSubjName,
            icon: newSubjIcon,
            instruction: newSubjPrompt,
            color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-500',
            isCustom: true
        };
        
        onAddSubject(newSubject);
        setIsCreatorOpen(false);
        setNewSubjName('');
        setNewSubjPrompt('');
    };

    const ALL_SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects];

    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-6 overflow-y-auto animate-in fade-in zoom-in duration-300 relative">
        <div className="text-center mb-6 mt-4 relative">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study School</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">Select a subject or create a custom niche class.</p>
          
          <div className="absolute top-0 right-0">
             <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-md px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                History
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALL_SUBJECTS.map((sub) => (
            <div key={sub.id} className="relative group">
                <button
                onClick={() => onSelectSubject(sub.id)}
                className={`w-full h-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${sub.color}`}
                >
                <span className="text-5xl mb-4">{sub.icon}</span>
                <span className="text-xl font-bold">{sub.name}</span>
                <span className="text-sm opacity-75 mt-1">Click to Start Class</span>
                </button>
                {sub.isCustom && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${sub.name}?`)) onDeleteCustomSubject(sub.id); }} 
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                        title="Delete Class"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    </button>
                )}
            </div>
          ))}
          
          {/* Add New Class Button */}
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <span className="text-5xl mb-4">+</span>
            <span className="text-xl font-bold">Create Class</span>
            <span className="text-sm opacity-75 mt-1">Define your own niche</span>
          </button>
        </div>

        {/* Creator Modal */}
        {isCreatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create New Class</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class Name</label>
                            <input 
                                type="text" 
                                value={newSubjName}
                                onChange={(e) => setNewSubjName(e.target.value)}
                                placeholder="e.g. Physics, Cooking, Crypto..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon (Emoji)</label>
                            <input 
                                type="text" 
                                value={newSubjIcon}
                                onChange={(e) => setNewSubjIcon(e.target.value)}
                                placeholder="e.g. ⚛️"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">System Instructions</label>
                            <p className="text-xs text-gray-400 mb-2">Define how the AI should behave. Be specific about the niche.</p>
                            <textarea 
                                value={newSubjPrompt}
                                onChange={(e) => setNewSubjPrompt(e.target.value)}
                                placeholder="You are an expert in Physics. Only answer physics-related questions..."
                                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsCreatorOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button onClick={handleCreateSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm">
                            Create Class
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    );
  }

  // 2. CLASSROOM VIEW (Subject selected)
  const currentSubject = [...DEFAULT_SUBJECTS, ...customSubjects].find(s => s.id === activeSubject);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      {/* Header for Classroom */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm z-10 transition-colors duration-200">
         <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
               <span className="text-2xl">{currentSubject?.icon}</span>
               <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">{currentSubject?.name} Class</h2>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Live Tutor
                  </p>
               </div>
            </div>
         </div>
         <button onClick={onBack} className="text-xs font-medium text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
            Leave Class
         </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <MessageList 
          messages={messages} 
          loadingState={loadingState} 
          onEdit={() => {}} 
          onRegenerate={onRegenerate}
          onReply={(text) => onSendMessage(text)}
          language={language}
        />
      </div>
      
      <div className="w-full px-4 pb-6 pt-2">
        <ChatInput 
          onSend={onSendMessage} 
          isLoading={loadingState !== 'idle'}
          onStartLive={onStartLive} 
        />
      </div>
    </div>
  );
};
