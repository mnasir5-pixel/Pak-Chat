
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'chat' | 'history' | 'chinese-tutor' | 'english-tutor' | 'study-school';
  onNavigate: (view: 'chat' | 'history' | 'chinese-tutor' | 'english-tutor' | 'study-school') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentView,
  onNavigate
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">P</div>
              <span className="font-bold text-lg text-gray-800">Menu</span>
           </div>
           <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => onNavigate('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'chat' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${currentView === 'chat' ? 'bg-blue-200/50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              </div>
              <span>Pak Chat Assistant</span>
            </button>

            <button onClick={() => onNavigate('chinese-tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'chinese-tutor' ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-200 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${currentView === 'chinese-tutor' ? 'bg-red-200/50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
              </div>
              <span>Chinese Tutor</span>
            </button>

            <button onClick={() => onNavigate('english-tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'english-tutor' ? 'bg-green-50 text-green-700 shadow-sm ring-1 ring-green-200 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${currentView === 'english-tutor' ? 'bg-green-200/50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
              </div>
              <span>English Tutor</span>
            </button>

            <button onClick={() => onNavigate('study-school')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'study-school' ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-200 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${currentView === 'study-school' ? 'bg-purple-200/50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.182-.311a51.006 51.006 0 004.659-2.62.75.75 0 01.668 1.333 49.526 49.526 0 01-4.01 2.247c-.002.124.097.228.222.228h12.292c.125 0 .224-.104.222-.228a50.485 50.485 0 01-4.01-2.247.75.75 0 01.668-1.333 51.01 51.01 0 004.66 2.62c.114.063.181.18.181.311v1.127a7.5 7.5 0 00-9.151 7.155.75.75 0 01-1.5 0A9 9 0 0118 14.5v-1.127a.75.75 0 010-1.5v1.127z" /></svg>
              </div>
              <span>Study School</span>
            </button>

            <button onClick={() => onNavigate('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${currentView === 'history' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${currentView === 'history' ? 'bg-blue-200/50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span>History</span>
            </button>
        </div>
      </div>
    </>
  );
};
