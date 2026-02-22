import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatService } from './services/geminiService';
import { AppSidebar } from './components/AppSidebar';
import { Header } from './components/Header';
import { TutorsPage } from './components/TutorsPage';
import { StudySchoolPage } from './components/StudySchoolPage';
import { NotesPage } from './components/NotesPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { NasherNotesPage } from './components/NasherNotesPage';
import { NotesLMHome } from './components/NotesLMHome';
import { GeneralNotesChatPage } from './components/GeneralNotesChatPage';
import { DictionaryModal } from './components/DictionaryModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
import { ConfigureChatModal } from './components/ConfigureChatModal';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { VoiceChatInterface } from './components/VoiceChatInterface';
import { LibrarianPage } from './components/LibrarianPage';
import { DashboardPage } from './components/DashboardPage';
import { LinkConfirmModal } from './components/LinkConfirmModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ClassModal } from './components/ClassModal';
import { HireAgentModal } from './components/HireAgentModal';
import { LoginPage } from './components/LoginPage';
import { BuilderPage } from './components/BuilderPage';
import { DEFAULT_TUTORS, DEFAULT_SUBJECTS, SYSTEM_INSTRUCTION } from './constants';
import { ChatMessage, Tutor, StudySubject, ChatSession, LoadingState, ChatConfig, AudioNote, Project, UserProgress, User } from './types';

type ViewState = 'dashboard' | 'chat' | 'history' | 'tutors' | 'study-school' | 'settings' | 'notes' | 'builder' | 'notes-lm' | 'general-notes' | 'voice-chat' | 'resource-hub';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: "Hello! I'm your assistant. How can I help you with your learning today?",
  timestamp: Date.now(),
};

const DEFAULT_CONFIG: ChatConfig = { style: 'default', length: 'default' };

const MASTER_USER: User = {
  email: 'master@operative.ai',
  name: 'User',
  verified: true,
  createdAt: Date.now(),
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pakchat_active_user');
    return saved ? JSON.parse(saved) : MASTER_USER;
  });

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false); 
  const [isAddClassOpen, setIsAddClassOpen] = useState(false); 
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  
  const [activeLink, setActiveLink] = useState<{url: string, title: string} | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const userEmail = currentUser?.email || 'guest';

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(`pakchat_progress_${userEmail}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      const saved = localStorage.getItem(`pakchat_main_messages_${userEmail}`);
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
  });
  
  const [mainChatLanguage, setMainChatLanguage] = useState(() => localStorage.getItem(`pakchat_main_lang_${userEmail}`) || 'English');
  const [mainChatConfig, setMainChatConfig] = useState<ChatConfig>(() => {
      const saved = localStorage.getItem(`pakchat_main_config_${userEmail}`);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  
  const [tutors, setTutors] = useState<Tutor[]>(() => {
      try {
          const saved = localStorage.getItem(`pakchat_custom_tutors_${userEmail}`);
          const base = DEFAULT_TUTORS.map(t => ({ ...t, language: t.language || 'English', config: t.config || DEFAULT_CONFIG }));
          return saved ? [...base, ...JSON.parse(saved)] : base;
      } catch { return DEFAULT_TUTORS; }
  });
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null);
  const [activeTutorMessages, setActiveTutorMessages] = useState<ChatMessage[]>([]);
  
  const [subjects, setSubjects] = useState<StudySubject[]>(() => {
    try {
        const saved = localStorage.getItem(`pakchat_custom_subjects_${userEmail}`);
        const base = DEFAULT_SUBJECTS.map(s => ({ ...s, type: 'assistant' as const, language: s.language || 'English', config: s.config || DEFAULT_CONFIG }));
        return saved ? [...base, ...JSON.parse(saved)] : base;
    } catch { return DEFAULT_SUBJECTS.map(s => ({ ...s, type: 'assistant' as const })); }
  });
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeSubjectMessages, setActiveSubjectMessages] = useState<ChatMessage[]>([]);
  
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(`pakchat_projects_${userEmail}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(`pakchat_sessions_${userEmail}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  const mainChatServiceRef = useRef<ChatService | null>(null);
  const tutorServiceRef = useRef<ChatService | null>(null);
  const subjectServiceRef = useRef<ChatService | null>(null);

  const getContextualInstruction = useCallback((title: string, description: string, lang: string, role: 'agent' | 'assistant', base: string, id: string) => {
    const roleProtocol = role === 'agent' 
        ? "OPERATIONAL MODE: AGENT. Be proactive, authoritative, and structured. Take full initiative in the curriculum and conduct tests independently."
        : "OPERATIONAL MODE: ASSISTANT. Be supportive, helpful, and responsive to user cues. Focus on guiding rather than leading.";

    const assessmentStatus = userProgress[id]?.testCompleted ? "Assessment is ALREADY COMPLETED." : "Assessment is NOT COMPLETED. Your first mission is to greet the user and ask for their native language. Once provided, start a 5-question MCQ diagnostic entry test aligned with their level and native language.";

    return `### SYSTEM IDENTITY: ${title}
### MISSION & DESCRIPTION:
${description}
### ASSESSMENT STATUS:
${assessmentStatus}
### ROLE PROTOCOL:
${roleProtocol}
### INSTRUCTION LANGUAGE:
Everything you say to the user MUST be in ${lang}. 
${base}
`;
  }, [userProgress]);

  useEffect(() => {
    if (!currentUser) return;
    mainChatServiceRef.current = new ChatService(getContextualInstruction("Pak Chat Core", "General assistance", mainChatLanguage, 'assistant', SYSTEM_INSTRUCTION, 'core'), mainChatConfig);
    mainChatServiceRef.current.startChatWithHistory(messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })));
    localStorage.setItem(`pakchat_main_lang_${userEmail}`, mainChatLanguage);
    localStorage.setItem(`pakchat_main_config_${userEmail}`, JSON.stringify(mainChatConfig));
  }, [currentUser, mainChatConfig, mainChatLanguage, getContextualInstruction, userEmail]);

  useEffect(() => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else if (theme === 'light') document.documentElement.classList.remove('dark');
      else if (theme === 'system') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  // Handle Automatic AI Greeting for new sessions
  useEffect(() => {
    const id = activeTutorId || activeSubjectId;
    if (id && !userProgress[id]?.testCompleted) {
        const msgs = activeTutorId ? activeTutorMessages : activeSubjectMessages;
        if (msgs.length === 0) {
            handleSendMessage("### INSTRUCTION: Start initialization. Greet the user and ask for their native language to begin the journey.", undefined, true);
        }
    }
  }, [activeTutorId, activeSubjectId]);

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('pakchat_active_user');
    setCurrentView('dashboard');
  };

  const getActiveSetter = () => {
    if (currentView === 'tutors' && activeTutorId) return setActiveTutorMessages;
    if (currentView === 'study-school' && activeSubjectId) return setActiveSubjectMessages;
    return setMessages;
  };

  const getActiveMessages = () => {
    if (currentView === 'tutors' && activeTutorId) return activeTutorMessages;
    if (currentView === 'study-school' && activeSubjectId) return activeSubjectMessages;
    return messages;
  };

  const getActiveService = () => {
    if (currentView === 'tutors' && activeTutorId) return tutorServiceRef.current;
    if (currentView === 'study-school' && activeSubjectId) return subjectServiceRef.current;
    return mainChatServiceRef.current;
  };

  const handleEdit = (id: string, newContent: string) => {
    const setter = getActiveSetter();
    setter(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const handleConfigSave = (newConfig: ChatConfig) => {
    setMainChatConfig(newConfig);
    if (mainChatServiceRef.current) {
      mainChatServiceRef.current.updateConfig(newConfig);
    }
  };

  const handleSendMessage = async (content: string, attachment?: File, isSilent = false) => {
    if ((!content.trim() && !attachment) || loadingState === 'streaming') return;
    const setter = getActiveSetter();
    const activeService = getActiveService();

    if (!isSilent) {
        const userMessage: ChatMessage = { 
            id: Date.now().toString(), 
            role: 'user', 
            content, 
            timestamp: Date.now(), 
            attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined,
            attachmentType: attachment ? (attachment.type.includes('webm') ? 'audio/webm' : attachment.type) : undefined,
            attachmentName: attachment ? attachment.name : undefined
        };
        setter((prev) => [...prev, userMessage]);
    }
    setLoadingState('loading');
    try {
        const botMsgId = (Date.now() + 1).toString();
        setter((prev) => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
        setLoadingState('streaming');
        const stream = await activeService!.sendMessageStream(content, attachment);
        let fullResponse = '';
        if (stream) { 
            for await (const chunk of stream) { 
                fullResponse += chunk; 
                setter(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullResponse } : m)); 
            } 
        }
        if (fullResponse.includes("### HINTS:")) {
            const [mainText, hintsPart] = fullResponse.split("### HINTS:");
            const hints = hintsPart.split('\n').map(h => h.replace(/^[-*•\d.]+\s*/, '').trim()).filter(h => h.length > 0).slice(0, 3);
            setter(prev => prev.map(m => m.id === botMsgId ? { ...m, content: mainText.trim(), hints, isStreaming: false } : m));
        } else {
            setter(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
        }
    } catch (e: any) { 
        setter(prev => prev.map(m => m.isStreaming ? { ...m, content: "Service currently unavailable. Please try again later.", isStreaming: false, isError: true } : m));
    } finally { setLoadingState('idle'); }
  };

  const handleTranslate = async (messageId: string, targetLang: string) => {
      const setter = getActiveSetter();
      setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: true, processingLabel: `Translating to ${targetLang}...` } : m));
      try {
          const msg = getActiveMessages().find(m => m.id === messageId);
          if (!msg) return;
          const translated = await ChatService.translateText(msg.content, targetLang);
          setter(prev => prev.map(m => m.id === messageId ? { ...m, content: translated, isProcessing: false } : m));
      } catch (e) { setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: false } : m)); }
  };

  const handleReadAloud = async (messageId: string) => {
      const setter = getActiveSetter();
      const activeService = getActiveService();
      setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: true, processingLabel: "Generating voice note..." } : m));
      try {
          const msg = getActiveMessages().find(m => m.id === messageId);
          if (!msg) return;
          const audioBase64 = await activeService!.generateSpeech(msg.content.replace(/\[Choice:.*?\]|\[Word:.*?\]|#|==/g, '').trim());
          const newNote: AudioNote = { id: Date.now().toString(), url: audioBase64, label: "Read Aloud", timestamp: Date.now() };
          setter(prev => prev.map(m => m.id === messageId ? { ...m, audioNotes: [...(m.audioNotes || []), newNote], isProcessing: false } : m));
      } catch (e) { setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: false } : m)); }
  };

  const handleAudioOverview = async (messageId: string) => {
      const setter = getActiveSetter();
      const activeService = getActiveService();
      setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: true, processingLabel: "Synthesizing overview..." } : m));
      try {
          const msg = getActiveMessages().find(m => m.id === messageId);
          if (!msg) return;
          const overviewStream = await activeService!.sendMessageStream(`Summarize response VERY CONCISELY (MAX 30 words) for an audio recap. Focus on key takeaways. Text: ${msg.content}`);
          let overviewText = '';
          for await (const chunk of overviewStream) overviewText += chunk;
          const audioBase64 = await activeService!.generateSpeech(overviewText.replace(/### HINTS:[\s\S]*/, '').trim());
          const newNote: AudioNote = { id: Date.now().toString(), url: audioBase64, label: "Audio Overview", timestamp: Date.now() };
          setter(prev => prev.map(m => m.id === messageId ? { ...m, audioNotes: [...(m.audioNotes || []), newNote], isProcessing: false } : m));
      } catch (e) { setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: false } : m)); }
  };

  const handleMindMap = async (messageId: string) => {
      const setter = getActiveSetter();
      const activeService = getActiveService();
      setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: true, processingLabel: "Synthesizing Knowledge Map..." } : m));
      try {
          const msg = getActiveMessages().find(m => m.id === messageId);
          if (!msg) return;
          const prompt = `Generate a hierarchical JSON mind map based on this response. Use exactly this structure: {"topic": "Root", "branches": [{"topic": "Child 1", "branches": [...]}]}. Output ONLY JSON inside block: \`\`\`json:mindmap\n[JSON]\n\`\`\`. Response: ${msg.content}`;
          const stream = await activeService!.sendMessageStream(prompt);
          let mindMapCode = '';
          for await (const chunk of stream) mindMapCode += chunk;
          setter(prev => prev.map(m => m.id === messageId ? { ...m, content: `${m.content}\n\n${mindMapCode.trim()}`, isProcessing: false } : m));
      } catch (e) { setter(prev => prev.map(m => m.id === messageId ? { ...m, isProcessing: false } : m)); }
  };

  const handleRedo = async (messageId: string) => {
      const setter = getActiveSetter();
      const msgs = getActiveMessages();
      const targetIdx = msgs.findIndex(m => m.id === messageId);
      if (targetIdx === -1) return;
      const lastUserMsg = [...msgs.slice(0, targetIdx)].reverse().find(m => m.role === 'user');
      if (!lastUserMsg) return;
      const newHistory = msgs.slice(0, targetIdx);
      setter(newHistory);
      const activeService = getActiveService();
      await activeService!.startChatWithHistory(newHistory.map(m => ({ role: m.role, content: m.content })));
      handleSendMessage(lastUserMsg.content, undefined, true);
  };

  const handleShare = async (id?: string) => {
    let textToShare = "";
    if (id) {
      const msg = getActiveMessages().find(m => m.id === id);
      if (msg) textToShare = msg.content;
    } else {
      textToShare = getActiveMessages().map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    }
    if (!textToShare) return;
    if (navigator.share) {
      try { await navigator.share({ title: "Pak Chat", text: textToShare }); } catch (err) { console.error("Share failed:", err); }
    } else {
      try { await navigator.clipboard.writeText(textToShare); alert("Copied to clipboard!"); } catch (err) { alert("Failed to copy."); }
    }
  };

  const handleRemoveAudioNote = (messageId: string, noteId: string) => {
      const setter = getActiveSetter();
      setter(prev => prev.map(m => m.id === messageId ? { ...m, audioNotes: m.audioNotes?.filter(n => n.id !== noteId) } : m));
  };

  const handleStartTest = (type: 'tutor' | 'subject', id: string) => {
      const activeModule = type === 'tutor' ? tutors.find(t => t.id === id) : subjects.find(s => s.id === id);
      setUserProgress(prev => ({ ...prev, [id]: { ...(prev[id] || { testCompleted: false, timestamp: Date.now(), completedLessons: [] }), testCompleted: true } }));
      handleSendMessage(`### INSTRUCTION: Start Entry Test for "${activeModule?.name}". Ask ONE MCQ at a time. Respond in ${activeModule?.language || 'English'}.`, undefined, true);
  };

  const navigateTo = (view: ViewState, subId?: string) => {
      setCurrentView(view);
      setIsSidebarOpen(false);
      if (view === 'study-school' && subId) {
          const subject = subjects.find(s => s.id === subId);
          if (!subject) return;
          setActiveSubjectId(subId);
          subjectServiceRef.current = new ChatService(getContextualInstruction(subject.name, subject.description || subject.name, subject.language || 'English', subject.type || 'assistant', SYSTEM_INSTRUCTION, subId), subject.config || DEFAULT_CONFIG);
          setActiveSubjectMessages([]);
      } else if (view === 'tutors' && subId) {
          const tutor = tutors.find(t => t.id === subId);
          if (!tutor) return;
          setActiveTutorId(subId);
          tutorServiceRef.current = new ChatService(getContextualInstruction(tutor.name, tutor.description || tutor.name, tutor.language || 'English', tutor.role || 'assistant', SYSTEM_INSTRUCTION, subId), tutor.config || DEFAULT_CONFIG);
          setActiveTutorMessages([]);
      } else if (view === 'notes-lm') {
          setActiveSessionId(subId || null);
      }
  };

  if (!currentUser) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); localStorage.setItem('pakchat_active_user', JSON.stringify(user)); }} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-black overflow-hidden font-sans transition-colors duration-200">
        <div className="flex flex-1 overflow-hidden">
            <AppSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                currentView={currentView} 
                activeTutorId={activeTutorId} 
                activeSubjectId={activeSubjectId} 
                activeProjectId={null}
                tutors={tutors} 
                subjects={subjects} 
                projects={projects}
                onNavigate={navigateTo} 
                onOpenDeployTutor={() => { setEditingTutor(null); setIsAddTutorOpen(true); }} 
                onOpenCreateClass={() => { setEditingSubject(null); setIsAddClassOpen(true); }} 
                onOpenCreateProject={() => setIsAddProjectOpen(true)}
                onEditTutor={(t) => { setEditingTutor(t); setIsAddTutorOpen(true); }}
                onEditSubject={(s) => { setEditingSubject(s); setIsAddClassOpen(true); }}
                onOpenHistory={() => navigateTo('history')} 
                currentTheme={theme} 
            />
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {['dashboard', 'chat', 'history'].includes(currentView) && (
                <Header 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                    onNewChat={() => { navigateTo('chat'); setMessages([WELCOME_MESSAGE]); }} 
                    onConfigureClick={() => setIsConfigureModalOpen(true)} 
                    onShareClick={() => handleShare()} 
                    onLanguageClick={() => setIsLanguageOpen(true)}
                    onDictionaryClick={() => setIsDictionaryOpen(true)} 
                    onQuizClick={() => handleSendMessage("Give me a context-aware 5-question MCQ quiz based on our learning.", undefined, true)}
                    messages={messages}
                    language={currentView === 'chat' ? mainChatLanguage : 'English'}
                />
                )}
                <main className="flex-1 overflow-hidden relative">
                    {currentView === 'dashboard' && <DashboardPage onNavigate={navigateTo} userName={currentUser?.name} />}
                    {currentView === 'chat' && (
                        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
                            <div className="flex-1 overflow-hidden relative">
                                <MessageList 
                                    messages={messages} 
                                    loadingState={loadingState} 
                                    onEdit={handleEdit} 
                                    language={mainChatLanguage} 
                                    onReply={handleSendMessage} 
                                    onTranslate={handleTranslate}
                                    onReadAloud={handleReadAloud}
                                    onAudioOverview={handleAudioOverview}
                                    onMindMap={handleMindMap}
                                    onShare={handleShare}
                                    onRegenerate={handleRedo}
                                    onRemoveAudioNote={handleRemoveAudioNote}
                                />
                            </div>
                            <div className="w-full px-4 pb-6 pt-2">
                                <ChatInput onSend={handleSendMessage} isLoading={loadingState !== 'idle'} onStartLive={() => setIsLiveOpen(true)} language={mainChatLanguage} />
                            </div>
                        </div>
                    )}
                    {currentView === 'tutors' && (
                    <TutorsPage 
                        messages={activeTutorMessages} 
                        loadingState={loadingState} 
                        activeTutorId={activeTutorId} 
                        tutors={tutors} 
                        onSelectTutor={(id) => navigateTo('tutors', id)} 
                        onSendMessage={handleSendMessage} 
                        onBack={() => navigateTo('dashboard')} 
                        onStartLive={() => setIsLiveOpen(true)} 
                        onMenuClick={() => setIsSidebarOpen(true)} 
                        isAddTutorOpen={false} 
                        setIsAddTutorOpen={() => {}} 
                        onAddTutor={() => {}} 
                        onConfigure={() => setIsConfigureModalOpen(true)} 
                        onNewSession={() => setActiveTutorMessages([])} 
                        onDictionaryClick={() => setIsDictionaryOpen(true)} 
                        onLanguageClick={() => setIsLanguageOpen(true)} 
                        onShareClick={() => handleShare()} 
                        onQuizClick={() => handleSendMessage("Conduct a quiz based on our discussion.", undefined, true)} 
                        isAssessmentCompleted={userProgress[activeTutorId || '']?.testCompleted || false} 
                        onStartTest={() => handleStartTest('tutor', activeTutorId || '')} 
                        language={tutors.find(t => t.id === activeTutorId)?.language || 'English'} 
                        onTranslate={handleTranslate}
                        onReadAloud={handleReadAloud}
                        onAudioOverview={handleAudioOverview}
                        onMindMap={handleMindMap}
                        onShare={handleShare}
                        onRegenerate={handleRedo}
                        onEdit={handleEdit}
                        onRemoveAudioNote={handleRemoveAudioNote}
                    />
                    )}
                    {currentView === 'study-school' && (
                    <StudySchoolPage 
                        messages={activeSubjectMessages} 
                        loadingState={loadingState} 
                        activeSubject={activeSubjectId} 
                        customSubjects={subjects} 
                        onSendMessage={handleSendMessage} 
                        onBack={() => navigateTo('dashboard')} 
                        onStartLive={() => setIsLiveOpen(true)} 
                        onMenuClick={() => setIsSidebarOpen(true)} 
                        onConfigure={() => setIsConfigureModalOpen(true)} 
                        onNewSession={() => setActiveSubjectMessages([])} 
                        onDictionaryClick={() => setIsDictionaryOpen(true)} 
                        onLanguageClick={() => setIsLanguageOpen(true)} 
                        onShareClick={() => handleShare()} 
                        onQuizClick={() => handleSendMessage("Start a subject quiz.", undefined, true)} 
                        isAssessmentCompleted={userProgress[activeSubjectId || '']?.testCompleted || false} 
                        onStartTest={() => handleStartTest('subject', activeSubjectId || '')} 
                        language={subjects.find(s => s.id === activeSubjectId)?.language || 'English'} 
                        onTranslate={handleTranslate}
                        onReadAloud={handleReadAloud}
                        onAudioOverview={handleAudioOverview}
                        onMindMap={handleMindMap}
                        onShare={handleShare}
                        onRegenerate={handleRedo}
                        onEdit={handleEdit}
                        onRemoveAudioNote={handleRemoveAudioNote}
                    />
                    )}
                    {currentView === 'settings' && currentUser && <SettingsPage currentUser={currentUser} onUpdateProfile={(u) => setCurrentUser({...currentUser, ...u})} onSignOut={handleSignOut} currentLanguage={mainChatLanguage} onLanguageChange={setMainChatLanguage} translateLanguage="Urdu" onTranslateLanguageChange={() => {}} currentTheme={theme} onThemeChange={setTheme} onBack={() => navigateTo('dashboard')} />}
                    {currentView === 'history' && (
                    <HistoryPage 
                        sessions={sessions} 
                        onLoadSession={(id, type) => navigateTo(type as any, id)} 
                        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); }} 
                        onStartNewChat={() => navigateTo('chat')} 
                        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? {...s, title} : s))} 
                        onShareSession={handleShare} 
                    />
                    )}
                    {currentView === 'notes' && <NotesPage onAiAssist={async (a) => { if(!mainChatServiceRef.current) return ''; const s = await mainChatServiceRef.current.sendMessageStream(a); let r = ''; for await (const chunk of s) r += chunk; return r; }} language={mainChatLanguage} onMenuClick={() => setIsSidebarOpen(true)} />}
                    {currentView === 'voice-chat' && (
                        <VoiceChatInterface 
                            messages={[]} 
                            loadingState="idle" 
                            onSendMessage={() => {}} 
                            onRegenerate={handleRedo} 
                            onTranslate={handleTranslate} 
                            onStartLive={() => setIsLiveOpen(true)} 
                            onBack={() => navigateTo('dashboard')} 
                            onMenuClick={() => setIsSidebarOpen(true)} 
                            language={mainChatLanguage} 
                            onLanguageClick={() => setIsLanguageOpen(true)}
                            onReadAloud={handleReadAloud}
                            onAudioOverview={handleAudioOverview}
                            onMindMap={handleMindMap}
                            onShare={handleShare}
                            onRemoveAudioNote={handleRemoveAudioNote}
                        />
                    )}
                    {currentView === 'resource-hub' && <LibrarianPage messages={[]} loadingState="idle" onSendMessage={() => {}} onBack={() => navigateTo('dashboard')} onMenuClick={() => setIsSidebarOpen(true)} onShareClick={() => handleShare()} onConfigure={() => setIsConfigureModalOpen(true)} onLanguageClick={() => setIsLanguageOpen(true)} onNewSession={() => {}} language={mainChatLanguage} onTranslate={handleTranslate} onReadAloud={handleReadAloud} onAudioOverview={handleAudioOverview} onMindMap={handleMindMap} onShare={handleShare} onRegenerate={handleRedo} />}
                    {currentView === 'notes-lm' && (
                        activeSessionId ? (
                            <NasherNotesPage 
                                language={mainChatLanguage} 
                                session={sessions.find(s => s.id === activeSessionId) || { id: activeSessionId, userEmail: userEmail, type: 'notes-lm', title: 'New Notebook', messages: [], timestamp: Date.now() }} 
                                onUpdateSession={(id, updates) => setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))} 
                                onBack={() => setActiveSessionId(null)} 
                                onStartLive={() => setIsLiveOpen(true)} 
                            />
                        ) : (
                            <NotesLMHome 
                                notebooks={sessions.filter(s => s.type === 'notes-lm')} 
                                onOpenNotebook={(id) => setActiveSessionId(id)} 
                                onCreateNotebook={() => { const id = Date.now().toString(); setSessions(p => [...p, { id, userEmail, type: 'notes-lm', title: 'New Notebook', messages: [], timestamp: Date.now() }]); setActiveSessionId(id); }} 
                                onDeleteNotebook={(id) => setSessions(prev => prev.filter(s => s.id !== id))} 
                                onRenameNotebook={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))} 
                                language={mainChatLanguage} 
                                onLanguageChange={setMainChatLanguage} 
                                theme={theme} 
                                onThemeChange={setTheme} 
                                onMenuClick={() => setIsSidebarOpen(true)} 
                            />
                        )
                    )}
                    {currentView === 'general-notes' && <GeneralNotesChatPage language={mainChatLanguage} onMenuClick={() => setIsSidebarOpen(true)} onBack={() => navigateTo('dashboard')} onTranslate={handleTranslate} onReadAloud={handleReadAloud} onAudioOverview={handleAudioOverview} onMindMap={handleMindMap} onShare={handleShare} onRegenerate={handleRedo} />}
                </main>
            </div>
        </div>

        {isDictionaryOpen && <DictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />}
        {isLanguageOpen && <LanguageSelectorModal isOpen={isLanguageOpen} onClose={() => setIsLanguageOpen(false)} currentLanguage={currentView === 'chat' ? mainChatLanguage : 'English'} onSelect={(lang) => { if(currentView === 'chat') setMainChatLanguage(lang); }} />}
        
        {isAddTutorOpen && (
            <HireAgentModal 
                isOpen={isAddTutorOpen} 
                onClose={() => setIsAddTutorOpen(false)} 
                editingAgent={editingTutor}
                onSave={(data) => {
                    if (editingTutor) { setTutors(prev => prev.map(t => t.id === editingTutor.id ? { ...t, ...data } : t)); } 
                    else { setTutors(prev => [...prev, { ...data, id: Date.now().toString(), icon: '👤', color: 'bg-teal-50', isCustom: true } as Tutor]); }
                }}
            />
        )}

        {isAddClassOpen && (
            <ClassModal 
                isOpen={isAddClassOpen} 
                onClose={() => setIsAddClassOpen(false)} 
                editingClass={editingSubject}
                onSave={(data) => {
                    if (editingSubject) { setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...data } : s)); } 
                    else { setSubjects(prev => [...prev, { ...data, id: Date.now().toString(), icon: '🎓', color: 'bg-purple-50', isCustom: true } as StudySubject]); }
                }}
            />
        )}

        {isAddProjectOpen && (
            <CreateProjectModal 
                isOpen={isAddProjectOpen} 
                onClose={() => setIsAddProjectOpen(false)} 
                existingProjects={projects}
                onSelectProject={(id) => navigateTo('history', id)}
                onCreate={(name, tag) => { setProjects(prev => [...prev, { id: Date.now().toString(), name, tag, timestamp: Date.now() }]); setIsAddProjectOpen(false); }}
            />
        )}

        {isConfigureModalOpen && (
          <ConfigureChatModal 
            isOpen={isConfigureModalOpen} 
            onClose={() => setIsConfigureModalOpen(false)} 
            config={mainChatConfig} 
            onSave={handleConfigSave} 
          />
        )}

        {isLiveOpen && (
          <LiveSessionOverlay 
            onClose={(t) => { setIsLiveOpen(false); if(t.length > 0) getActiveSetter()(prev => [...prev, ...t]); }} 
            language={mainChatLanguage} 
            systemInstruction={getContextualInstruction("Live Talk", "Low-latency voice conversation", mainChatLanguage, 'assistant', SYSTEM_INSTRUCTION, 'live')} 
            initialHistory={getActiveMessages()} 
          />
        )}

        {activeLink && (
            <LinkConfirmModal 
                isOpen={!!activeLink} 
                onClose={() => setActiveLink(null)} 
                url={activeLink.url} 
                title={activeLink.title} 
            />
        )}
    </div>
  );
}
