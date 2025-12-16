
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingState, Tutor } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface TutorsPageProps {
  messages: ChatMessage[];
  loadingState: LoadingState;
  activeTutorId: string | null;
  tutors: Tutor[];
  onSelectTutor: (tutorId: string) => void;
  onStartTest: () => void;
  onSendMessage: (content: string, attachment?: File) => void;
  onBack: () => void;
  onStartLive: () => void;
  language?: string;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onBranchChat?: (id: string) => void;
  onConfigure: () => void;
  onAddTutor: (tutor: Tutor) => void;
  onDictionaryClick?: () => void;
  onShareClick?: () => void;
  // Input props
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

export const TutorsPage: React.FC<TutorsPageProps> = ({
  messages,
  loadingState,
  activeTutorId,
  tutors,
  onSelectTutor,
  onStartTest,
  onSendMessage,
  onBack,
  onStartLive,
  language,
  onRegenerate,
  onEdit,
  onBranchChat,
  onConfigure,
  onAddTutor,
  onDictionaryClick,
  onShareClick,
  inputValue,
  onInputChange
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    setReplyingTo(null);
    onBack();
  };

  const handleAddLanguage = (langName: string) => {
      const newId = `tutor-${langName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const newTutor: Tutor = {
          id: newId,
          name: `${langName} Tutor`,
          targetLanguage: langName,
          icon: '🌐', // Generic icon, could be mapped to flags
          color: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300', // Default styling
          isCustom: true
      };
      onAddTutor(newTutor);
      setIsAddTutorOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. DASHBOARD VIEW (No tutor selected)
  if (!activeTutorId) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-6 overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <span className="text-4xl">🗣️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Language Tutors</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Select a personal AI tutor to start learning.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tutors.map((tutor) => (
            <button
              key={tutor.id}
              onClick={() => onSelectTutor(tutor.id)}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tutor.color || 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-300'}`}
            >
              <span className="text-5xl mb-4">{tutor.icon}</span>
              <span className="text-xl font-bold text-gray-800 dark:text-white">{tutor.name}</span>
              <span className="text-sm opacity-75 mt-1 text-gray-600 dark:text-gray-300">{tutor.targetLanguage}</span>
            </button>
          ))}
          
          {/* Add Tutor Button */}
          <button
            onClick={() => setIsAddTutorOpen(true)}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <span className="text-5xl mb-4">+</span>
            <span className="text-xl font-bold">New Language</span>
            <span className="text-sm opacity-75 mt-1">Start learning a new language</span>
          </button>
        </div>

        {/* Add Tutor Modal */}
        {isAddTutorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Select Language</h3>
                        <button onClick={() => setIsAddTutorOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="p-2 overflow-y-auto">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => handleAddLanguage(lang.name)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between group transition-colors"
                            >
                                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">{lang.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{lang.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // 2. CLASSROOM VIEW (Tutor selected)
  const currentTutor = tutors.find(t => t.id === activeTutorId);
  const showIntro = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      {/* Header */}
      {!showIntro && (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm z-10 transition-colors duration-200">
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                   <span className="text-2xl">{currentTutor?.icon}</span>
                   <div>
                      <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">{currentTutor?.name}</h2>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        Live Session
                      </p>
                   </div>
                </div>
             </div>
             
             {/* 3-DOT MENU */}
             <div className="relative" ref={menuRef}>
                 <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className={`p-2 rounded-lg transition-colors ${showMenu ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                 </button>

                 {showMenu && (
                     <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                         <div className="p-1 space-y-0.5">
                             {/* 1. Learn from Start */}
                             <button 
                                onClick={() => { setShowMenu(false); onStartTest(); }} 
                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors"
                             >
                                 <span className="text-lg">📝</span> Attempt Quiz
                             </button>

                             {/* 2. Dictionary */}
                             {onDictionaryClick && (
                                 <button 
                                    onClick={() => { setShowMenu(false); onDictionaryClick(); }} 
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-lg flex items-center gap-3 transition-colors"
                                 >
                                     <span className="text-lg">📖</span> Dictionary
                                 </button>
                             )}

                             {/* 3. Configure */}
                             <button 
                                onClick={() => { setShowMenu(false); onConfigure(); }} 
                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors"
                             >
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.41.41.43 1.059.04 1.491l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.39.432.37 1.081-.04 1.491l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.781-.929-.397-.164-.853-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.04-1.491l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.04-1.491l.774-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                 Settings
                             </button>

                             <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

                             {/* 4. Share */}
                             {onShareClick && (
                                 <button 
                                    onClick={() => { setShowMenu(false); onShareClick(); }} 
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                                     Share Chat
                                 </button>
                             )}

                             {/* 5. End Session */}
                             <button 
                                onClick={() => { setShowMenu(false); onBack(); }} 
                                className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 transition-colors"
                             >
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                                 End Session
                             </button>
                         </div>
                     </div>
                 )}
             </div>
          </div>
      )}

      {showIntro ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-teal-100 dark:border-teal-800">
             <span className="text-4xl">{currentTutor?.icon}</span>
           </div>
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">{currentTutor?.name}</h1>
           <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 text-lg">
             I will help you master {currentTutor?.targetLanguage}. Let's assess your level and start learning!
           </p>
           <button 
             onClick={onStartTest}
             className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
           >
             <span>Learn from Start</span>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
             </svg>
           </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden relative">
            <MessageList 
              messages={messages} 
              loadingState={loadingState} 
              onEdit={onEdit || (() => {})} 
              onRegenerate={onRegenerate}
              onReply={(text) => onSendMessage(text)} 
              language={language}
              onBranchChat={onBranchChat}
            />
          </div>
          
          <div className="w-full px-4 pb-6 pt-2">
            <ChatInput 
              onSend={(content, attachment) => {
                  onSendMessage(content, attachment);
              }} 
              isLoading={loadingState !== 'idle'}
              onStartLive={onStartLive} 
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              // Input persistence props
              value={inputValue}
              onInputChange={onInputChange}
            />
          </div>
        </>
      )}
    </div>
  );
};
