
import React, { useState, useRef, useEffect } from 'react';
import { User, TrashItem } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { 
    User as UserIcon, Camera, Mail, Shield, Trash2, Globe, Palette, 
    LogOut, ChevronLeft, Save, Sparkles, ArrowRight, CheckCircle2, 
    Settings, Sun, Moon, Laptop, ShieldCheck, RotateCcw, X,
    // Added Loader2 to fix "Cannot find name 'Loader2'" error
    Loader2
} from 'lucide-react';

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
  trashItems?: TrashItem[];
  onRestoreFromTrash?: (id: string) => void;
  onPermanentlyDelete?: (id: string) => void;
  onEmptyTrash?: () => void;
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
  onBack,
  trashItems = [],
  onRestoreFromTrash,
  onPermanentlyDelete,
  onEmptyTrash
}) => {
  const [activeSection, setActiveSection] = useState<'main' | 'account' | 'language' | 'appearance' | 'trash'>('main');
  const [editName, setEditName] = useState(currentUser.name);
  const [previewAvatar, setPreviewAvatar] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewAvatar(reader.result as string);
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

  const renderTrash = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setActiveSection('main')} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-90"><ChevronLeft size={24} /></button>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Recycle Bin</h3>
            </div>
            {trashItems.length > 0 && (
                <button 
                    onClick={() => { if(confirm("Permanently empty all items in trash?")) onEmptyTrash?.(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                >
                    <Trash2 size={14} /> Purge All
                </button>
            )}
        </div>

        <div className="space-y-3">
            {trashItems.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] opacity-30 shadow-sm">
                    <Trash2 size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Bin is Empty</p>
                </div>
            ) : (
                trashItems.sort((a,b) => b.deletedAt - a.deletedAt).map(item => (
                    <div key={item.id} className="group flex items-center justify-between p-5 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[1.8rem] hover:shadow-lg transition-all animate-in fade-in">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate uppercase tracking-tight">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{item.type}</span>
                                    <span className="text-[9px] text-gray-400">•</span>
                                    <span className="text-[9px] text-gray-400 font-bold">Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onRestoreFromTrash?.(item.id)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Restore"><RotateCcw size={18} /></button>
                            <button onClick={() => onPermanentlyDelete?.(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Permanent Delete"><X size={18} /></button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  const renderMain = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3"><Settings size={16} className="text-blue-500" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Workspace Management</span></div>
        <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-4">System Console</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium italic">Configure your synchronized neural environment.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => setActiveSection('account')} className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-blue-500/50 hover:shadow-2xl transition-all active:scale-[0.98]">
          <div className="w-16 h-16 rounded-3xl overflow-hidden bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 transition-transform group-hover:scale-105">
            {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-blue-600" size={28} />}
          </div>
          <div className="flex-1 text-left"><h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Identity</h4><p className="text-sm text-gray-500 font-bold opacity-70">{currentUser.name}</p></div>
          <div className="p-3 text-gray-200 group-hover:text-blue-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>

        <button onClick={() => setActiveSection('language')} className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-emerald-500/50 hover:shadow-2xl transition-all active:scale-[0.98]">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 transition-transform group-hover:scale-105"><Globe className="text-emerald-600" size={28} /></div>
          <div className="flex-1 text-left"><h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Linguistic Hub</h4><p className="text-sm text-gray-500 font-bold opacity-70">Primary: {currentLanguage}</p></div>
          <div className="p-3 text-gray-200 group-hover:text-emerald-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>

        <button onClick={() => setActiveSection('trash')} className="group flex items-center gap-6 p-6 bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:border-amber-500/50 hover:shadow-2xl transition-all active:scale-[0.98]">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center border border-amber-100 transition-transform group-hover:scale-105"><Trash2 className="text-amber-600" size={28} /></div>
          <div className="flex-1 text-left"><h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Recycle Bin</h4><p className="text-sm text-gray-500 font-bold opacity-70">{trashItems.length} Deleted Items</p></div>
          <div className="p-3 text-gray-200 group-hover:text-amber-500 transition-colors"><ChevronLeft className="rotate-180" size={24} /></div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-700 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-6 mb-12 shrink-0">
        <button onClick={onBack} className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[1.5rem] hover:text-blue-600 transition-all active:scale-90 shadow-xl shadow-black/5"><ChevronLeft size={28} /></button>
        <div className="flex items-center gap-4"><Settings className="text-gray-400" size={32} /><h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Workspace Configuration</h1></div>
      </div>
      <div className="flex-1">
        {activeSection === 'main' && renderMain()}
        {activeSection === 'account' && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-4 mb-8"><button onClick={() => setActiveSection('main')} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-90"><ChevronLeft size={24} /></button><h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Profile Credentials</h3></div>
            <div className="bg-white dark:bg-[#0a0a0f] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex flex-col items-center gap-10">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}><div className="w-40 h-40 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-blue-50 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">{previewAvatar ? <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={64} className="text-blue-600 opacity-50" />}</div><div className="absolute inset-0 bg-black/50 rounded-[3rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"><Camera size={32} className="text-white" /></div><input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" /></div>
                <div className="w-full space-y-8">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-1">Identifier</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-6 py-5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-lg" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-1">Verified Registry</label><input type="text" value={currentUser.email} disabled className="w-full px-6 py-5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-2xl text-gray-400 font-bold cursor-not-allowed text-lg" /></div>
                </div>
                <button onClick={saveProfile} disabled={isSaving} className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${saveSuccess ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>{isSaving ? <Loader2 size={20} className="animate-spin" /> : saveSuccess ? <><CheckCircle2 size={20} /> Verified</> : <><Save size={20} /> Update Profile</>}</button>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'trash' && renderTrash()}
      </div>
    </div>
  );
};
