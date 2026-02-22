
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatService } from './services/geminiService';
import { AppSidebar } from './components/AppSidebar';
import { Header } from './components/Header';
import { SettingsPage } from './components/SettingsPage';
import { LibrarianPage } from './components/LibrarianPage';
import { NotesLMHome } from './components/NotesLMHome';
import { NasherNotesPage } from './components/NasherNotesPage';
import { VoiceChatInterface } from './components/VoiceChatInterface';
import { NotesPage } from './components/NotesPage';
import { HistoryPage } from './components/HistoryPage';
import { RightDrawer } from './components/RightDrawer';
import { DictionarySidebar } from './components/DictionarySidebar';
import { HistorySidebar } from './components/HistorySidebar';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { ConfigureChatModal } from './components/ConfigureChatModal';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { DashboardPage } from './components/DashboardPage';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ClassModal } from './components/ClassModal';
import { HireAgentModal } from './components/HireAgentModal';
import { TutorsPage } from './components/TutorsPage';
import { StudySchoolPage } from './components/StudySchoolPage';
// Added missing LiveSessionOverlay import to fix errors
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
import { DEFAULT_TUTORS, DEFAULT_SUBJECTS, SYSTEM_INSTRUCTION, createTutorInstruction } from './constants';
import { ChatMessage, Tutor, StudySubject, ChatSession, LoadingState, ChatConfig, Project, User, TrashItem, SavedWord } from './types';
import { BookOpen, Clock, Layers } from 'lucide-react';
import * as docx from 'docx';
import saveAs from 'file-saver';

const pcmToWav = (base64Pcm: string, sampleRate = 24000): string => {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); 
  view.setUint32(4, 36 + len, true);   
  view.setUint32(8, 0x57415645, false); 
  view.setUint16(20, 1, true);          
  view.setUint16(22, 1, true);          
  view.setUint32(24, sampleRate, true); 
  view.setUint16(34, 16, true);         
  view.setUint32(36, 0x64617461, false); 
  view.setUint32(40, len, true);        
  const dataView = new Uint8Array(buffer, 44);
  dataView.set(bytes);
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

type ViewState = 'dashboard' | 'chat' | 'tutors' | 'study-school' | 'settings' | 'project' | 'history' | 'notes-lm' | 'resource-hub' | 'voice-chat' | 'notes';

const WELCOME_MESSAGE: ChatMessage = { id: 'welcome', role: 'model', content: "Hello! I'm your assistant. How can I help you today?", timestamp: Date.now() };
const MASTER_USER: User = { email: 'master@operative.ai', name: 'User', verified: true, createdAt: Date.now() };

export default function App() {
  const userEmail = MASTER_USER.email;
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeRightSidebar, setActiveRightSidebar] = useState<'dictionary' | 'history' | null>(null);
  
  // Added isLiveOpen state to fix "Cannot find name 'setIsLiveOpen'" errors
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [mainChatLanguage, setMainChatLanguage] = useState(() => localStorage.getItem(`pakchat_lang`) || 'English');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('pakchat_theme') as any) || 'light');

  const [sessions, setSessions] = useState<ChatSession[]>(() => JSON.parse(localStorage.getItem(`sessions`) || '[]'));
  const [projects, setProjects] = useState<Project[]>(() => JSON.parse(localStorage.getItem(`projects`) || '[]'));
  const [tutors, setTutors] = useState<Tutor[]>(() => JSON.parse(localStorage.getItem(`tutors`) || JSON.stringify(DEFAULT_TUTORS)));
  const [subjects, setSubjects] = useState<StudySubject[]>(() => JSON.parse(localStorage.getItem(`subjects`) || JSON.stringify(DEFAULT_SUBJECTS)));
  const [trash, setTrash] = useState<TrashItem[]>(() => JSON.parse(localStorage.getItem(`trash`) || '[]'));
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => JSON.parse(localStorage.getItem('pakchat_saved_words') || '[]'));

  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    localStorage.setItem(`sessions`, JSON.stringify(sessions));
    localStorage.setItem(`projects`, JSON.stringify(projects));
    localStorage.setItem(`tutors`, JSON.stringify(tutors));
    localStorage.setItem(`subjects`, JSON.stringify(subjects));
    localStorage.setItem(`trash`, JSON.stringify(trash));
    localStorage.setItem(`pakchat_saved_words`, JSON.stringify(savedWords));
    localStorage.setItem('pakchat_theme', theme);
  }, [sessions, projects, tutors, subjects, trash, savedWords, theme]);

  useEffect(() => {
    const handleSaveWord = (e: any) => {
        const word = e.detail;
        setSavedWords(prev => {
            const exists = prev.some(w => w.hanzi === word.hanzi && w.pinyin === word.pinyin);
            if (exists) return prev;
            return [word, ...prev];
        });
    };
    window.addEventListener('pakchat:save_word', handleSaveWord);
    return () => window.removeEventListener('pakchat:save_word', handleSaveWord);
  }, []);

  const initChatService = useCallback((title: string, desc: string, lang: string, mode: 'teacher' | 'assistant' | 'agent' = 'assistant') => {
    const roleInstr = (mode === 'teacher' || mode === 'agent') ? "Act as a directive teacher and lead the learning session. Be authoritative yet encouraging. Use interactive exercises." : "Act as a supportive assistant.";
    const instr = `### IDENTITY: ${title}\n### MISSION: ${desc}\n### LANGUAGE: ${lang}\n### ROLE: ${roleInstr}\n\n${SYSTEM_INSTRUCTION}`;
    chatServiceRef.current = new ChatService(instr);
  }, []);

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!chatServiceRef.current || loadingState !== 'idle') return;

    const audioNotes = attachment && attachment.type.startsWith('audio/') ? [{
        id: Date.now().toString(),
        url: URL.createObjectURL(attachment),
        label: attachment.name || "Voice Note",
        timestamp: Date.now()
    }] : undefined;

    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: content || (audioNotes ? "Voice Note" : ""), 
        timestamp: Date.now(), 
        attachmentUrl: attachment && !audioNotes ? URL.createObjectURL(attachment) : undefined,
        audioNotes
    };

    setMessages(prev => [...prev, userMsg]);
    setLoadingState('loading');

    try {
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
        setLoadingState('streaming');
        
        const prompt = audioNotes ? "Please analyze this voice note content." : content;
        const stream = await chatServiceRef.current.sendMessageStream(prompt, attachment);
        
        let full = '';
        for await (const chunk of stream) { 
            full += chunk; 
            setMessages(prev => {
                const updated = prev.map(m => m.id === botMsgId ? { ...m, content: full } : m);
                if (activeSessionId) setSessions(s => s.map(sess => sess.id === activeSessionId ? { ...sess, messages: updated, timestamp: Date.now() } : sess));
                return updated;
            });
        }
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
    } catch (e: any) { 
        setMessages(prev => prev.map(m => m.isStreaming ? { ...m, content: "Error: " + e.message, isStreaming: false, isError: true } : m));
    } finally { setLoadingState('idle'); }
  };

  const handleEditMessage = (id: string, newContent: string) => {
    setMessages(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, content: newContent } : m);
        if (activeSessionId) setSessions(s => s.map(sess => sess.id === activeSessionId ? { ...sess, messages: updated, timestamp: Date.now() } : sess));
        return updated;
    });
  };

  const handleNewChat = (type: any = 'chat', meta?: any) => {
    const sid = Date.now().toString();
    const newSession: ChatSession = { 
        id: sid, userEmail, type, 
        title: "New Session", messages: [WELCOME_MESSAGE], timestamp: Date.now(),
        projectId: meta?.projectId, tutorId: meta?.tutorId, subjectId: meta?.subjectId 
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(sid);
    setMessages([WELCOME_MESSAGE]);
    chatServiceRef.current?.startChatWithHistory([]);
  };

  const navigateTo = (view: ViewState, id?: string) => {
    setCurrentView(view); 
    setIsSidebarOpen(false); 
    setActiveRightSidebar(null);
    setActiveTutorId(null); 
    setActiveSubjectId(null); 
    setActiveProjectId(null); 
    setActiveSessionId(null);

    if (view === 'project' && id) {
      const p = projects.find(x => x.id === id);
      if (p) { setActiveProjectId(id); initChatService(p.title || p.name, p.description || "", mainChatLanguage); loadSession(id, 'project'); }
    } else if (view === 'tutors' && id) {
      const t = tutors.find(x => x.id === id);
      if (t) { setActiveTutorId(id); initChatService(t.name, t.description || "", t.targetLanguage, t.role); loadSession(id, 'tutor'); }
    } else if (view === 'study-school' && id) {
      const s = subjects.find(x => x.id === id);
      if (s) { setActiveSubjectId(id); initChatService(s.name, s.description || "", s.language, s.type); loadSession(id, 'study-school'); }
    } else if (view === 'notes-lm' && id) {
       const nb = sessions.find(s => s.id === id && s.type === 'notes-lm');
       if (nb) { setActiveSessionId(id); setMessages(nb.messages); initChatService(nb.title, "Source analysis", mainChatLanguage); }
    } else if (view === 'chat') {
       initChatService("Assistant", "General Help", mainChatLanguage);
       loadSession('general', 'chat');
    }
  };

  const loadSession = (id: string, type: string) => {
    const match = sessions.find(s => (type === 'project' && s.projectId === id) || (type === 'tutor' && s.tutorId === id) || (type === 'study-school' && s.subjectId === id) || (type === 'chat' && s.type === 'chat'));
    if (match) { 
        setActiveSessionId(match.id); 
        setMessages(match.messages); 
        chatServiceRef.current?.startChatWithHistory(match.messages.map(m => ({ role: m.role, content: m.content }))); 
    }
    else handleNewChat(type as any, { [`${type}Id`]: id });
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    console.log('Update profile:', updates);
  };

  const handleSignOut = () => {
    setCurrentView('dashboard');
  };

  const activeHeaderTitle = useMemo(() => {
    if (currentView === 'project') return projects.find(p => p.id === activeProjectId)?.title || "Project";
    if (currentView === 'tutors') return tutors.find(t => t.id === activeTutorId)?.name || "Tutor Academy";
    if (currentView === 'study-school') return subjects.find(s => s.id === activeSubjectId)?.name || "Classroom";
    if (currentView === 'chat') return "Assistant";
    return undefined;
  }, [currentView, activeProjectId, activeTutorId, activeSubjectId, projects, tutors, subjects]);

  const activeHeaderDesc = useMemo(() => {
    if (currentView === 'tutors') return "Language Mastery Tracker";
    if (currentView === 'study-school') return "Subject Intelligence Hub";
    return undefined;
  }, [currentView]);

  const hideGlobalHeader = ['notes-lm', 'resource-hub', 'voice-chat', 'notes'].includes(currentView);

  return (
    <div className={`flex h-screen bg-white dark:bg-black transition-colors overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        <AppSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            currentView={currentView} 
            activeTutorId={activeTutorId} 
            activeSubjectId={activeSubjectId} 
            activeProjectId={activeProjectId} 
            tutors={tutors} subjects={subjects} projects={projects} 
            onNavigate={navigateTo}
            onOpenCreateProject={() => { setEditingEntity(null); setIsProjectModalOpen(true); }}
            onOpenCreateClass={() => { setEditingEntity(null); setIsClassModalOpen(true); }}
            onOpenDeployTutor={() => { setEditingEntity(null); setIsAgentModalOpen(true); }}
            onEditTutor={(t) => { setEditingEntity(t); setIsAgentModalOpen(true); }}
            onEditSubject={(s) => { setEditingEntity(s); setIsClassModalOpen(true); }}
        />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {!hideGlobalHeader ? (
                <Header 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                    onNewChat={() => handleNewChat(currentView as any)} 
                    onConfigureClick={() => {}} 
                    onShareClick={() => {}} 
                    onLanguageClick={() => {}} 
                    onHistoryClick={() => setActiveRightSidebar('history')} 
                    language={mainChatLanguage}
                    title={activeHeaderTitle}
                    description={activeHeaderDesc}
                />
            ) : null}
            
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {currentView === 'dashboard' && <DashboardPage onNavigate={navigateTo} />}
                
                {['chat', 'project'].includes(currentView) && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 relative overflow-hidden">
                            <MessageList messages={messages} loadingState={loadingState} onEdit={handleEditMessage} onReply={handleSendMessage} />
                        </div>
                        <div className="p-4 shrink-0 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5">
                            <div className="max-w-4xl mx-auto"><ChatInput onSend={handleSendMessage} isLoading={loadingState !== 'idle'} onStartLive={() => setIsLiveOpen(true)} /></div>
                        </div>
                    </div>
                )}

                {currentView === 'tutors' && activeTutorId && (
                    <TutorsPage 
                        messages={messages} loadingState={loadingState} 
                        activeTutorId={activeTutorId} tutors={tutors} 
                        onSelectTutor={(id) => navigateTo('tutors', id)} 
                        onSendMessage={handleSendMessage} onBack={() => navigateTo('dashboard')} 
                        onStartLive={() => setIsLiveOpen(true)} language={mainChatLanguage} 
                        isAssessmentCompleted={tutors.find(t => t.id === activeTutorId)?.isAssessmentCompleted || false}
                        onStartTest={() => setTutors(p => p.map(t => t.id === activeTutorId ? { ...t, isAssessmentCompleted: true } : t))}
                        onConfigure={()=>{}} onMenuClick={()=>setIsSidebarOpen(true)}
                        isAddTutorOpen={false} setIsAddTutorOpen={()=>{}} onAddTutor={()=>{}}
                        onLanguageClick={()=>{}}
                        onEdit={handleEditMessage}
                    />
                )}

                {currentView === 'study-school' && activeSubjectId && (
                    <StudySchoolPage 
                        messages={messages} loadingState={loadingState} 
                        activeSubject={activeSubjectId} customSubjects={subjects} 
                        onSendMessage={handleSendMessage} onBack={() => navigateTo('dashboard')} 
                        language={mainChatLanguage} onConfigure={()=>{}} onMenuClick={()=>setIsSidebarOpen(true)}
                        isAssessmentCompleted={subjects.find(s => s.id === activeSubjectId)?.isAssessmentCompleted || false}
                        onStartTest={() => setSubjects(p => p.map(s => s.id === activeSubjectId ? { ...s, isAssessmentCompleted: true } : s))}
                        onStartLive={() => setIsLiveOpen(true)} onLanguageClick={()=>{}}
                        onEdit={handleEditMessage}
                    />
                )}

                {currentView === 'notes-lm' && (
                    activeSessionId ? (
                        <NasherNotesPage 
                            language={mainChatLanguage} 
                            session={sessions.find(s => s.id === activeSessionId)!} 
                            onUpdateSession={(id, upd) => setSessions(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s))} 
                            onBack={() => setActiveSessionId(null)} 
                            onStartLive={() => setIsLiveOpen(true)} 
                        />
                    ) : (
                        <NotesLMHome 
                            notebooks={sessions.filter(s => s.type === 'notes-lm')} 
                            onOpenNotebook={(id) => navigateTo('notes-lm', id)}
                            onCreateNotebook={() => handleNewChat('notes-lm')}
                            onDeleteNotebook={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
                            onRenameNotebook={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))}
                            language={mainChatLanguage} onLanguageChange={setMainChatLanguage}
                            theme={theme} onThemeChange={setTheme} onMenuClick={() => setIsSidebarOpen(true)}
                            notesLmConfig={{ style: 'default', length: 'default', mode: 'assistant' }}
                            onNotesLmConfigChange={() => {}}
                        />
                    )
                )}

                {currentView === 'resource-hub' && (
                    <LibrarianPage 
                        messages={[]} loadingState="idle" 
                        onSendMessage={()=>{}} onBack={()=>navigateTo('dashboard')} 
                        onMenuClick={()=>setIsSidebarOpen(true)} onShareClick={()=>{}} 
                        onConfigure={()=>{}} onLanguageClick={()=>{}} 
                        onNewSession={()=>{}} language={mainChatLanguage}
                    />
                )}

                {currentView === 'voice-chat' && (
                    <VoiceChatInterface 
                        messages={[]} loadingState="idle" 
                        onSendMessage={handleSendMessage} onRegenerate={()=>{}} onTranslate={()=>{}} 
                        onStartLive={() => setIsLiveOpen(true)} onBack={()=>navigateTo('dashboard')} 
                        onMenuClick={()=>setIsSidebarOpen(true)} language={mainChatLanguage} 
                        onLanguageClick={()=>{}} 
                    />
                )}

                {currentView === 'notes' && (
                    <NotesPage 
                        onAiAssist={async (a, c) => ""} 
                        language={mainChatLanguage} 
                        onMenuClick={()=>setIsSidebarOpen(true)} 
                    />
                )}

                {currentView === 'settings' && (
                    <SettingsPage 
                        currentUser={MASTER_USER} onUpdateProfile={handleUpdateProfile} 
                        onSignOut={handleSignOut} currentLanguage={mainChatLanguage} 
                        onLanguageChange={setMainChatLanguage} translateLanguage="Urdu" 
                        onTranslateLanguageChange={()=>{}} currentTheme={theme} 
                        onThemeChange={setTheme} onBack={()=>navigateTo('dashboard')} 
                    />
                )}

                {currentView === 'history' && (
                    <HistoryPage 
                        sessions={sessions} onLoadSession={(id, type) => navigateTo(type as any, id)} 
                        onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))} 
                        onStartNewChat={() => handleNewChat()} onRenameSession={()=>{}} onShareSession={()=>{}} 
                    />
                )}
            </main>
        </div>

        <CreateProjectModal 
            isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} 
            onCreate={(n, t, d, h, tag) => {
                const newP = { id: Date.now().toString(), name: n, title: t, description: d, hashtags: h, tag, timestamp: Date.now() };
                setProjects(prev => [...prev, newP]);
                setIsProjectModalOpen(false);
            }} 
            existingProjects={projects} onSelectProject={(id) => navigateTo('project', id)}
        />

        <ClassModal 
            isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} 
            editingClass={editingEntity}
            onSave={(data) => {
                if (editingEntity) setSubjects(prev => prev.map(s => s.id === editingEntity.id ? { ...s, ...data } : s));
                else setSubjects(prev => [...prev, { id: Date.now().toString(), ...data } as any]);
                setIsClassModalOpen(false);
            }} 
        />

        <HireAgentModal 
            isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} 
            editingAgent={editingEntity}
            onSave={(data) => {
                if (editingEntity) setTutors(prev => prev.map(t => t.id === editingEntity.id ? { ...t, ...data } : t));
                else setTutors(prev => [...prev, { id: Date.now().toString(), ...data } as any]);
                setIsAgentModalOpen(false);
            }} 
        />

        <RightDrawer isOpen={activeRightSidebar === 'history'} onClose={() => setActiveRightSidebar(null)} title="Context History" icon={<Clock size={18} />}>
            <HistorySidebar sessions={sessions} activeId={activeSessionId} onLoadSession={(id, type) => navigateTo(type as any, id)} />
        </RightDrawer>

        {/* Added missing Live Talk Overlay renderer */}
        {isLiveOpen && (
          <LiveSessionOverlay 
            onClose={(transcript) => {
              setIsLiveOpen(false);
              if (transcript.length > 0) {
                setMessages(prev => [...prev, ...transcript]);
              }
            }}
            language={mainChatLanguage}
            systemInstruction={SYSTEM_INSTRUCTION}
            initialHistory={messages}
          />
        )}
    </div>
  );
}
