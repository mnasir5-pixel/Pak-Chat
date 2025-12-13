
import React, { useState, useEffect } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  type: 'confirm' | 'prompt';
  title: string;
  message?: string;
  defaultValue?: string; // For prompt inputs (renaming)
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value?: string) => void;
  onClose: () => void;
  isDestructive?: boolean; // make button red for delete
}

export const ActionModal: React.FC<ActionModalProps> = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  defaultValue = '', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onClose,
  isDestructive = false
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onConfirm(type === 'prompt' ? inputValue : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform scale-100">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>}

        {type === 'prompt' && (
          <form onSubmit={handleSubmit} className="mb-6">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </form>
        )}

        <div className="flex gap-3 justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
           >
             {cancelText}
           </button>
           <button 
             onClick={() => handleSubmit()}
             className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
               isDestructive 
                 ? 'bg-red-600 hover:bg-red-700' 
                 : 'bg-blue-600 hover:bg-blue-700'
             }`}
           >
             {confirmText}
           </button>
        </div>
      </div>
    </div>
  );
};
