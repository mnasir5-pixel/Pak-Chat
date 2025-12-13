
import React, { useState, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface SettingsPageProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  translateLanguage: string;
  onTranslateLanguageChange: (lang: string) => void;
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onBack: () => void;
  // Playback Settings
  playbackEnabled?: boolean;
  onPlaybackChange?: (enabled: boolean) => void;
  // Hardware Access
  micAccess?: boolean;
  onMicAccessChange?: (enabled: boolean) => void;
  cameraAccess?: boolean;
  onCameraAccessChange?: (enabled: boolean) => void;
  // User Profile
  userName?: string;
  userAvatar?: string;
  onUpdateProfile?: (name: string, avatar?: string) => void;
  // Sign Out
  onSignOut: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  currentLanguage, 
  onLanguageChange, 
  translateLanguage,
  onTranslateLanguageChange,
  currentTheme, 
  onThemeChange, 
  onBack,
  playbackEnabled = true,
  onPlaybackChange,
  micAccess = true,
  onMicAccessChange,
  cameraAccess = true,
  onCameraAccessChange,
  userName = '',
  userAvatar = '',
  onUpdateProfile,
  onSignOut
}) => {
  const [activeSection, setActiveSection] = useState<'main' | 'account' | 'language' | 'translation' | 'appearance' | 'memory' | 'audio' | 'privacy'>('main');
  const [userMemory, setUserMemory] = useState(() => localStorage.getItem('pakchat_user_memory') || '');
  const currentUserEmail = localStorage.getItem('pakchat_current_user') || 'user@example.com';

  // Profile Edit State
  const [editName, setEditName] = useState(userName);
  const [previewAvatar, setPreviewAvatar] = useState(userAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveMemory = () => {
    localStorage.setItem('pakchat_user_memory', userMemory);
    alert("Memory updated! Pak Chat will use this context in new conversations.");
    setActiveSection('main');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setPreviewAvatar(base64);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = () => {
      if (onUpdateProfile) {
          onUpdateProfile(editName, previewAvatar);
          alert("Profile updated successfully!");
      }
  };

  // --- SUB-COMPONENT: ACCOUNT & CLOUD ---
  const renderAccountSettings = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Account & Profile</h3>
      </div>
      
      <div className="space-y-6">
          {/* Editable User Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex flex-col items-center sm:flex-row gap-6">
                  {/* Avatar Upload */}
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-600 shadow-sm">
                          {previewAvatar ? (
                              <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                  {currentUserEmail.charAt(0).toUpperCase()}
                              </div>
                          )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                  </div>

                  {/* Fields */}
                  <div className="flex-1 w-full space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name (How AI refers to you)</label>
                          <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="e.g. Ali, MNs, Doctor..."
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Read Only)</label>
                          <div className="w-full p-2.5 bg-gray-100 dark:bg-gray-700/50 border border-transparent rounded-lg text-gray-500 dark:text-gray-400 select-none cursor-not-allowed">
                              {currentUserEmail}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button 
                      onClick={onSignOut}
                      className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  >
                      Sign Out
                  </button>
                  <button 
                      onClick={handleSaveProfile}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all active:scale-95"
                  >
                      Save Profile
                  </button>
              </div>
          </div>

          {/* Cloud Sync Simulation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" /><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" /></svg>
                      <h4 className="font-medium text-gray-900 dark:text-white">Cloud Sync</h4>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Your data is securely synced to your account.
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full w-[100%] animate-pulse"></div>
              </div>
          </div>
      </div>
    </div>
  );

  // --- SUB-COMPONENT: LANGUAGE SELECTOR ---
  const renderLanguageSelector = (isTranslation = false) => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {isTranslation ? 'Translation Button Language' : 'Select Output Language'}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = isTranslation ? translateLanguage === lang.name : currentLanguage === lang.name;
          return (
            <button
              key={lang.code}
              onClick={() => {
                  if (isTranslation) onTranslateLanguageChange(lang.name);
                  else onLanguageChange(lang.name);
              }}
              className={`
                flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all
                ${isSelected 
                   ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500' 
                   : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                }
              `}
            >
              {lang.name}
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: MEMORY EDITOR ---
  const renderMemoryEditor = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Memory & Personalization</h3>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">What is this?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                  This acts as the AI's <span className="font-semibold text-blue-600 dark:text-blue-400">Long-Term Memory</span>. 
                  Any details you add here will be remembered in <strong>every</strong> future conversation.
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 mt-2 list-disc pl-4 space-y-1">
                  <li>"My name is {userName || '[Your Name]'}"</li>
                  <li>"I am a vegetarian."</li>
                  <li>"I prefer simple explanations."</li>
                  <li>"I am learning Python."</li>
              </ul>
          </div>
          <textarea
             value={userMemory}
             onChange={(e) => setUserMemory(e.target.value)}
             className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-800 dark:text-gray-200 resize-none"
             placeholder="e.g. Always address me as 'Sir', I hate mushrooms, I work in Marketing..."
          />
          <div className="flex justify-end mt-4">
              <button 
                onClick={handleSaveMemory}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                  Save Memory
              </button>
          </div>
      </div>
    </div>
  );

  // --- SUB-COMPONENT: AUDIO SETTINGS ---
  const renderAudioSettings = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Audio & Playback</h3>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Text-to-Speech Playback</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Show 'Read' button and enable audio playback for messages.</p>
              </div>
              <button 
                  onClick={() => onPlaybackChange && onPlaybackChange(!playbackEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${playbackEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${playbackEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
          </div>
      </div>
    </div>
  );

  // --- SUB-COMPONENT: PRIVACY SETTINGS ---
  const renderPrivacySettings = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Privacy & Permissions</h3>
      </div>
      
      <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
                      </div>
                      <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Microphone Access</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Required for voice chat and audio input.</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => onMicAccessChange && onMicAccessChange(!micAccess)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${micAccess ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${micAccess ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" /></svg>
                      </div>
                      <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Camera Access</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Required for video analysis in Live Chat.</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => onCameraAccessChange && onCameraAccessChange(!cameraAccess)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${cameraAccess ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${cameraAccess ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );

  // --- SUB-COMPONENT: APPEARANCE SELECTOR ---
  const renderAppearanceSelector = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Appearance</h3>
      </div>
      
      <div className="space-y-3">
         {['light', 'dark', 'system'].map((t) => (
             <button 
                key={t}
                onClick={() => onThemeChange(t as any)}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all capitalize
                  ${currentTheme === t
                     ? 'bg-white dark:bg-gray-800 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                     : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
             >
                <div className="flex items-center gap-3">
                   <span className={`font-medium ${currentTheme === t ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{t}</span>
                </div>
                {currentTheme === t && (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                   </svg>
                )}
             </button>
         ))}
      </div>
    </div>
  );

  // --- MAIN SETTINGS MENU ---
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 animate-in fade-in zoom-in duration-300 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Back to Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your app preferences.</p>
        </div>
      </div>

      <div className="space-y-4">
        {activeSection === 'main' ? (
             // --- MENU BUTTONS ---
            <div className="space-y-3">
                {/* Account Settings */}
                <button 
                    onClick={() => setActiveSection('account')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-teal-400 transition-all group"
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                            {userAvatar ? (
                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                                    {currentUserEmail.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account & Profile</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {userName ? `Hi, ${userName}` : currentUserEmail}
                        </p>
                    </div>
                </button>

                {/* Output Language */}
                <button 
                    onClick={() => setActiveSection('language')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-blue-400 transition-all group"
                >
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">🌐</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Output Language</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current: <span className="text-blue-600 dark:text-blue-400 font-medium">{currentLanguage}</span></p>
                    </div>
                </button>

                 {/* Translation Selection */}
                 <button 
                    onClick={() => setActiveSection('translation')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-green-400 transition-all group"
                >
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">文</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Translation Selection</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Target: <span className="text-green-600 dark:text-green-400 font-medium">{translateLanguage}</span></p>
                    </div>
                </button>

                {/* Memory & Personalization */}
                 <button 
                    onClick={() => setActiveSection('memory')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-yellow-400 transition-all group"
                >
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl group-hover:bg-yellow-600 group-hover:text-white transition-colors">🧠</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory & Personalization</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Context: <span className="text-yellow-600 dark:text-yellow-400 font-medium">{localStorage.getItem('pakchat_user_memory') ? 'Active' : 'Empty'}</span></p>
                    </div>
                </button>

                {/* Audio Settings */}
                <button 
                    onClick={() => setActiveSection('audio')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-red-400 transition-all group"
                >
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">🔊</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audio & Playback</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">TTS: <span className="text-red-600 dark:text-red-400 font-medium">{playbackEnabled ? 'On' : 'Off'}</span></p>
                    </div>
                </button>

                {/* Privacy & Permissions */}
                <button 
                    onClick={() => setActiveSection('privacy')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-400 transition-all group"
                >
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">🔒</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Permissions</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Mic/Cam Control</p>
                    </div>
                </button>

                {/* Appearance */}
                <button 
                    onClick={() => setActiveSection('appearance')}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:border-purple-400 transition-all group"
                >
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">🎨</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current: <span className="text-purple-600 dark:text-purple-400 font-medium capitalize">{currentTheme}</span></p>
                    </div>
                </button>
            </div>
        ) : activeSection === 'account' ? (
            renderAccountSettings()
        ) : activeSection === 'language' ? (
            renderLanguageSelector(false)
        ) : activeSection === 'translation' ? (
            renderLanguageSelector(true)
        ) : activeSection === 'memory' ? (
            renderMemoryEditor()
        ) : activeSection === 'audio' ? (
            renderAudioSettings()
        ) : activeSection === 'privacy' ? (
            renderPrivacySettings()
        ) : (
            renderAppearanceSelector()
        )}
      </div>
    </div>
  );
};
