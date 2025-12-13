
import React from 'react';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'chat' | 'history' | 'chinese-tutor' | 'english-tutor' | 'study-school' | 'settings' | 'notes';
  onNavigate: (view: 'chat' | 'history' | 'chinese-tutor' | 'english-tutor' | 'study-school' | 'settings' | 'notes') => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentView,
  onNavigate
}) => {
  return (
    <>
      {/* Mobile Backdrop (Hidden on Desktop) */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 backdrop-blur-sm md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <div 
        className={`
          fixed md:relative top-0 left-0 h-full z-50 md:z-0
          bg-white dark:bg-gray-900 shadow-2xl md:shadow-none
          border-r border-gray-100 dark:border-gray-800
          transition-[transform,width] duration-300 ease-in-out
          
          /* Mobile: Translate */
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0

          /* Desktop: Width Push */
          ${isOpen ? 'md:w-72' : 'md:w-0'}
          md:overflow-hidden
        `}
      >
        {/* Inner Content Wrapper - Fixed width to prevent squashing during transition */}
        <div className="w-72 h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">P</div>
                <span className="font-bold text-lg text-gray-800 dark:text-white">Menu</span>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {/* Pak Chat */}
              <button onClick={() => onNavigate('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'chat' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'chat' ? 'bg-blue-200/50 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                </div>
                <span>Pak Chat</span>
              </button>

              {/* Chinese Tutor */}
              <button onClick={() => onNavigate('chinese-tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'chinese-tutor' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-sm ring-1 ring-red-200 dark:ring-red-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'chinese-tutor' ? 'bg-red-200/50 dark:bg-red-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <span className="text-lg leading-none">🇨🇳</span>
                </div>
                <span>Chinese Tutor</span>
              </button>

              {/* English Tutor */}
              <button onClick={() => onNavigate('english-tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'english-tutor' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm ring-1 ring-green-200 dark:ring-green-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'english-tutor' ? 'bg-green-200/50 dark:bg-green-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <span className="text-lg leading-none">🇬🇧</span>
                </div>
                <span>English Tutor</span>
              </button>

              {/* Study School */}
              <button onClick={() => onNavigate('study-school')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'study-school' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-200 dark:ring-purple-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'study-school' ? 'bg-purple-200/50 dark:bg-purple-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <span className="text-lg leading-none">🎓</span>
                </div>
                <span>Study School</span>
              </button>

              {/* Notes */}
              <button onClick={() => onNavigate('notes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'notes' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm ring-1 ring-orange-200 dark:ring-orange-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'notes' ? 'bg-orange-200/50 dark:bg-orange-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
                <span>Notes</span>
              </button>

              {/* History */}
              <button onClick={() => onNavigate('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'history' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'history' ? 'bg-blue-200/50 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span>History</span>
              </button>

              {/* Settings */}
              <button onClick={() => onNavigate('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'settings' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`p-1.5 rounded-lg ${currentView === 'settings' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span>Settings</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
};
