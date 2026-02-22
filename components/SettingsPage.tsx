
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { User as UserIcon, Camera, Mail, Shield, Trash2, Globe, Palette, LogOut, ChevronLeft, Save, Sparkles, ArrowRight, CheckCircle2, Settings, Sun, Moon, Laptop, ShieldCheck } from 'lucide-react';

interface SettingsPageProps {
  currentUser: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  onSignOut: () => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  translateLanguage: string;
  onTranslateLanguageChange: (lang: string) => void;
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  currentUser,
  onUpdateProfile,
  onSignOut,
  currentLanguage, 
  onLanguageChange, 
  translateLanguage,
  onTranslateLanguageChange,
  currentTheme, 
  onThemeChange, 
  onBack
}) => {
  const [activeSection, setActiveSection] = useState<'main' | 'account' | 'language' | 'appearance'>('main');
  const [editName, setEditName] = useState(currentUser.name);
  const [previewAvatar, setPreviewAvatar] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    onUpdateProfile({ name: editName, avatar: previewAvatar });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const renderAccount = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveSection('main')} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-90"><ChevronLeft size={24} /></button>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Operative Profile</h3>
      </div>

      <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-2xl shadow-black/5">
        <div className="flex flex-col items-center gap-10">
           <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-blue-600 opacity-50" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-[3rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                <Camera size={32} className="text-white" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
           </div>

           <div className="w-full space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-1">Identity Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-1">Verified Credential</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="text" 
                    value={currentUser.email}
                    disabled
                    className="w-full pl-14 pr-6 py-5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-2xl text-gray-400 font-bold cursor-not-allowed text-lg"
                  />
                  <ShieldCheck className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 ml-1">Account synchronized with global registry</p>
              </div>
           </div>

           <div className="flex w-full gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
              <button 
                onClick={saveProfile}
                disabled={isSaving}
                className={`flex-1 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${saveSuccess ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <><CheckCircle2 size={20} /> Changes Authenticated</>
                ) : (
                  <><Save size={20} /> Synchronize Profile</>
                )}
              </button>
           </div>
        </div>
      </div>

      <div className="p-8 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-[3rem] animate-in fade-in duration-700 delay-200">
          <div className="flex items-center gap-5 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-2xl"><Trash2 size={24} /></div>
              <div>
                  <h4 className="text-base font-black text-red-600 uppercase tracking-tight">Security Override</h4>
                  <p className="text-xs text-red-500 opacity-80 font-medium">Delete all local records and neural footprints.</p>
              </div>
          </div>
          <button className="w-full py-4 border-2 border-red-200 dark:border-red-900/40 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all active:scale-95">Purge Session Logs</button>
      </div>
    </div>
  );

  const renderMain = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Workspace Management</span>
        </div>
        <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-4">System Console</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium italic">Configure your synchronized neural environment.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActiveSection('account')}
          className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-blue-500/50 hover:shadow-2xl hover:shadow-black/5 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-3xl overflow-hidden bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-xl shadow-blue-500/10 transition-transform group-hover:scale-105">
            {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-blue-600" size={28} />}
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Personal Identity</h4>
            <p className="text-sm text-gray-500 font-bold opacity-70">{currentUser.name} • Operative</p>
          </div>
          <div className="p-3 text-gray-200 group-hover:text-blue-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>

        <button 
          onClick={() => setActiveSection('language')}
          className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-black/5 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shadow-xl shadow-emerald-500/10 transition-transform group-hover:scale-105">
            <Globe className="text-emerald-600" size={28} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Linguistic Hub</h4>
            <p className="text-sm text-gray-500 font-bold opacity-70">Primary: {currentLanguage} • Assist: {translateLanguage}</p>
          </div>
          <div className="p-3 text-gray-200 group-hover:text-emerald-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>

        <button 
          onClick={() => setActiveSection('appearance')}
          className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-purple-500/50 hover:shadow-2xl hover:shadow-black/5 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center border border-purple-100 dark:border-purple-800 shadow-xl shadow-purple-500/10 transition-transform group-hover:scale-105">
            <Palette className="text-purple-600" size={28} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Visual Interface</h4>
            <p className="text-sm text-gray-500 font-bold opacity-70 capitalize">{currentTheme} Protocol Active</p>
          </div>
          <div className="p-3 text-gray-200 group-hover:text-purple-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>

        <div className="h-px bg-gray-100 dark:bg-white/5 my-8 mx-12" />

        <button 
          onClick={onSignOut}
          className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-red-500/50 hover:shadow-2xl hover:shadow-black/5 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800 shadow-xl shadow-red-500/10 transition-transform group-hover:scale-105">
            <LogOut className="text-red-600" size={28} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-lg font-black text-red-600 uppercase tracking-tight">Terminate Session</h4>
            <p className="text-sm text-gray-500 font-bold opacity-70">Logout from verified workspace.</p>
          </div>
          <div className="p-3 text-gray-200 group-hover:text-red-500 transition-colors"><ArrowRight size={24} /></div>
        </button>
      </div>
    </div>
  );

  const renderLinguistic = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveSection('main')} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-90"><ChevronLeft size={24} /></button>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Linguistic Calibration</h3>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-xl">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-6 block">Output Instruction Target</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button 
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.name)}
                        className={`px-5 py-4 rounded-2xl border-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${currentLanguage === lang.name ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 scale-105' : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-blue-500/30'}`}
                    >
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-xl">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-6 block">Assistive Translation Layer</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button 
                        key={lang.code}
                        onClick={() => onTranslateLanguageChange(lang.name)}
                        className={`px-5 py-4 rounded-2xl border-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${translateLanguage === lang.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-105' : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-emerald-500/30'}`}
                    >
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveSection('main')} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-90"><ChevronLeft size={24} /></button>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Visual Configuration</h3>
      </div>
      
      <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-xl space-y-4">
         {[
           { id: 'light', label: 'Light Protocol', icon: Sun, color: 'text-orange-500' },
           { id: 'dark', label: 'Obsidian Mode', icon: Moon, color: 'text-blue-400' },
           { id: 'system', label: 'Adaptive Sync', icon: Laptop, color: 'text-purple-500' }
         ].map((t) => (
             <button 
                key={t.id}
                onClick={() => onThemeChange(t.id as any)}
                className={`w-full flex items-center justify-between px-8 py-6 rounded-[2rem] border-2 transition-all group animate-in slide-in-from-bottom-2
                  ${currentTheme === t.id
                     ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xl shadow-blue-500/10 scale-[1.02]'
                     : 'bg-gray-50 dark:bg-black border-transparent text-gray-500 hover:border-blue-500/30'
                  }
                `}
             >
                <div className="flex items-center gap-5">
                   <div className={`p-3 rounded-2xl ${currentTheme === t.id ? 'bg-white dark:bg-gray-900 shadow-sm' : 'bg-white dark:bg-white/5'} ${t.color}`}>
                     <t.icon size={28} />
                   </div>
                   <div className="text-left">
                     <span className="block text-lg font-black uppercase tracking-tight">{t.label}</span>
                     <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Interface Theme Module</span>
                   </div>
                </div>
                {currentTheme === t.id && <div className="p-2 bg-blue-500 text-white rounded-full"><CheckCircle2 size={24} /></div>}
             </button>
         ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in zoom-in duration-700 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-6 mb-12 shrink-0">
        <button 
          onClick={onBack}
          className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[1.5rem] hover:text-blue-600 transition-all active:scale-90 shadow-xl shadow-black/5"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex items-center gap-4">
          <Settings className="text-gray-400" size={32} />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Workspace Environment</h1>
        </div>
      </div>

      <div className="flex-1">
        {activeSection === 'main' && renderMain()}
        {activeSection === 'account' && renderAccount()}
        {activeSection === 'language' && renderLinguistic()}
        {activeSection === 'appearance' && renderAppearance()}
      </div>

      <div className="mt-24 pt-10 border-t border-gray-100 dark:border-white/5 flex items-center justify-between opacity-40">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em]"><Sparkles size={16} /> Environment Synchronized</div>
      </div>
    </div>
  );
};
