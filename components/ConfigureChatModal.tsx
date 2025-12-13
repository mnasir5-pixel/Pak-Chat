

import React, { useState, useEffect } from 'react';
import { ChatConfig } from '../types';

interface ConfigureChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatConfig;
  onSave: (config: ChatConfig) => void;
}

export const ConfigureChatModal: React.FC<ConfigureChatModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ChatConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configure Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Customize how Pak Chat responds to you. These settings apply to future messages in this session.
          </p>

          {/* Style Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Conversational Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setLocalConfig({...localConfig, style: 'default'})}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  localConfig.style === 'default' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Default
              </button>
              <button 
                onClick={() => setLocalConfig({...localConfig, style: 'learning'})}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  localConfig.style === 'learning' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Learning
              </button>
              <button 
                onClick={() => setLocalConfig({...localConfig, style: 'custom'})}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  localConfig.style === 'custom' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Custom
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 h-4">
              {localConfig.style === 'default' && "Balanced and helpful responses."}
              {localConfig.style === 'learning' && "Explains concepts like a tutor."}
              {localConfig.style === 'custom' && "Uses your custom memory instructions."}
            </p>
          </div>

          {/* Length Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Response Length
            </label>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button 
                onClick={() => setLocalConfig({...localConfig, length: 'short'})}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  localConfig.length === 'short' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Shorter
              </button>
              <button 
                onClick={() => setLocalConfig({...localConfig, length: 'default'})}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  localConfig.length === 'default' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Default
              </button>
              <button 
                onClick={() => setLocalConfig({...localConfig, length: 'long'})}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  localConfig.length === 'long' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Longer
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};