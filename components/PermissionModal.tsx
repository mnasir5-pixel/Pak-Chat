
import React from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  type: 'microphone' | 'camera';
  onClose: () => void;
  onConfirm: (persistence: 'always' | 'temp') => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, type, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform scale-100">
        <div className="flex flex-col items-center text-center mb-6">
           <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'microphone' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
              {type === 'microphone' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" /></svg>
              )}
           </div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enable {type === 'microphone' ? 'Microphone' : 'Camera'}?</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400">
             Pak Chat needs access to your {type} for this feature.
           </p>
        </div>

        <div className="space-y-3">
           <button 
             onClick={() => onConfirm('always')}
             className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30"
           >
             Always Allow
           </button>
           <button 
             onClick={() => onConfirm('temp')}
             className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
           >
             Allow just for now
           </button>
           <button 
             onClick={onClose}
             className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm transition-colors"
           >
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
};
