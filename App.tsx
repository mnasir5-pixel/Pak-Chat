
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { AppSidebar } from './components/AppSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { HistoryPage } from './components/HistoryPage';
import { ChineseTutorPage } from './components/ChineseTutorPage';
import { EnglishTutorPage } from './components/EnglishTutorPage';
import { StudySchoolPage } from './components/StudySchoolPage';
import { LiveSessionOverlay } from './components/LiveSessionOverlay'; 
import { SettingsPage } from './components/SettingsPage';
import { NotesPage } from './components/NotesPage';
// Removed BuilderPage Import
import { LoginPage } from './components/LoginPage';
import { ConfigureChatModal } from './components/ConfigureChatModal';
import { PermissionModal } from './components/PermissionModal';
import { DictionaryModal } from './components/DictionaryModal';
import { ChatService } from './services/geminiService';
import { ChatMessage, LoadingState, ChatSession, ChatConfig } from './types';
import { SYSTEM_INSTRUCTION, TUTOR_SYSTEM_INSTRUCTION, ENGLISH_TUTOR_SYSTEM_INSTRUCTION, TUTOR_INITIAL_MESSAGE, ENGLISH_TUTOR_INITIAL_MESSAGE, SUBJECT_INSTRUCTIONS, getSystemInstructionFromConfig } from './constants';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: "Hello! I'm Pak Chat. How can I help you today?",
  timestamp: Date.now(),
};

const TUTOR_START_MESSAGE: ChatMessage = {
  id: 'tutor-start',
  role: 'model',
  content: TUTOR_INITIAL_MESSAGE,
  timestamp: Date.now(),
};

const ENGLISH_START_MESSAGE: ChatMessage = {
  id: 'english-start',
  role: 'model',
  content: ENGLISH_TUTOR_INITIAL_MESSAGE,
  timestamp: Date.now(),
};

const getErrorMessage = (error: any): string => {
  const msg = error?.message || error?.toString() || "Unknown error";
  if (msg.includes('API key')) return "Error: API Key is invalid or missing. Please check services/config.ts.";
  return `Error: ${msg}`;
};

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('pakchat_current_user'));
  // Profile State
  const [userName, setUserName] = useState<string>(localStorage.getItem('pakchat_user_name') || '');
  const [userAvatar, setUserAvatar] = useState<string>(localStorage.getItem('pakchat_user_avatar') || '');

  // Navigation State
  const [currentView, setCurrentView] = useState<'chat' | 'history' | 'chinese-tutor' | 'english-tutor' | 'study-school' | 'settings' | 'notes'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings State
  const [outputLanguage, setOutputLanguage] = useState<string>('English');
  const [translateLanguage, setTranslateLanguage] = useState<string>('Urdu'); 
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [userMemory, setUserMemory] = useState<string>('');
  const [playbackEnabled, setPlaybackEnabled] = useState<boolean>(true); 
  
  // Hardware Permissions (Split)
  const [micAccess, setMicAccess] = useState<boolean>(false);
  const [cameraAccess, setCameraAccess] = useState<boolean>(false);
  
  // Permission Modal State
  const [permissionModalType, setPermissionModalType] = useState<'microphone' | 'camera' | null>(null);

  // Chat Configuration State
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ style: 'default', length: 'default' });
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false); // Dictionary State

  // --- NOVA CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [chatLoadingState, setChatLoadingState] = useState<LoadingState>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false); 
  const [liveSessionInstruction, setLiveSessionInstruction] = useState<string | undefined>(undefined);
  
  // --- CHINESE TUTOR STATE ---
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]); 
  const [tutorLoadingState, setTutorLoadingState] = useState<LoadingState>('idle');
  const [currentTutorSessionId, setCurrentTutorSessionId] = useState<string | null>(null);

  // --- ENGLISH TUTOR STATE ---
  const [englishMessages, setEnglishMessages] = useState<ChatMessage[]>([]); 
  const [englishLoadingState, setEnglishLoadingState] = useState<LoadingState>('idle');
  const [currentEnglishSessionId, setCurrentEnglishSessionId] = useState<string | null>(null);

  // --- STUDY SCHOOL STATE ---
  const [activeStudySubject, setActiveStudySubject] = useState<string | null>(null);
  const [studyMessages, setStudyMessages] = useState<ChatMessage[]>([]);
  const [studyLoadingState, setStudyLoadingState] = useState<LoadingState>('idle');
  const [currentStudySessionId, setCurrentStudySessionId] = useState<string | null>(null);
  
  // Custom Subjects State
  const [customSubjects, setCustomSubjects] = useState<any[]>([]);

  // --- SHARED STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Services
  const chatServiceRef = useRef<ChatService | null>(null);
  const tutorServiceRef = useRef<ChatService | null>(null);
  const englishServiceRef = useRef<ChatService | null>(null);
  const studyServiceRef = useRef<ChatService | null>(null);

  // --- AUTH HANDLERS ---
  const handleLogin = (email: string) => {
    localStorage.setItem('pakchat_current_user', email);
    setCurrentUser(email);
  };

  const handleSignOut = () => {
    localStorage.removeItem('pakchat_current_user');
    setCurrentUser(null);
    setCurrentView('chat'); // Reset view on logout
  };

  const handleUpdateProfile = (name: string, avatar?: string) => {
      setUserName(name);
      localStorage.setItem('pakchat_user_name', name);
      
      if (avatar) {
          setUserAvatar(avatar);
          localStorage.setItem('pakchat_user_avatar', avatar);
      }
  };

  // --- INITIALIZATION & PERSISTENCE ---
  useEffect(() => {
    // 1. Load basic settings
    const savedMemory = localStorage.getItem('pakchat_user_memory') || '';
    setUserMemory(savedMemory);

    // DYNAMIC SYSTEM PROMPT WITH USER NAME
    let fullSystemInstruction = SYSTEM_INSTRUCTION;
    if (userName) {
        fullSystemInstruction += `\n\n[USER IDENTITY]: The user's name is "${userName}". Address them by this name when appropriate.`;
    }
    if (savedMemory) {
        fullSystemInstruction += `\n\n[USER MEMORY/CONTEXT]:\n${savedMemory}`;
    }

    chatServiceRef.current = new ChatService(fullSystemInstruction);
    tutorServiceRef.current = new ChatService(TUTOR_SYSTEM_INSTRUCTION);
    englishServiceRef.current = new ChatService(ENGLISH_TUTOR_SYSTEM_INSTRUCTION);
    
    try {
      // 2. Load Sessions
      const savedSessions = localStorage.getItem('nova_sessions');
      const loadedSessions = savedSessions ? JSON.parse(savedSessions) : [];
      setSessions(loadedSessions);
      
      const savedLang = localStorage.getItem('pakchat_language');
      if (savedLang) setOutputLanguage(savedLang);

      const savedTransLang = localStorage.getItem('pakchat_trans_language');
      if (savedTransLang) setTranslateLanguage(savedTransLang);

      const savedTheme = localStorage.getItem('pakchat_theme');
      if (savedTheme) setTheme(savedTheme as any);

      const savedPlayback = localStorage.getItem('pakchat_playback');
      if (savedPlayback !== null) setPlaybackEnabled(savedPlayback === 'true');

      const savedMic = localStorage.getItem('pakchat_mic_access');
      if (savedMic === 'true') setMicAccess(true);

      const savedCam = localStorage.getItem('pakchat_cam_access');
      if (savedCam === 'true') setCameraAccess(true);
      
      const savedSubjects = localStorage.getItem('pakchat_custom_subjects');
      if (savedSubjects) setCustomSubjects(JSON.parse(savedSubjects));

      // 3. Restore Last Active View & Sessions (Auto-Resume)
      const savedView = localStorage.getItem('pakchat_current_view');
      const savedChatId = localStorage.getItem('pakchat_active_chat_id');
      const savedTutorId = localStorage.getItem('pakchat_active_tutor_id');
      const savedEngId = localStorage.getItem('pakchat_active_english_id');
      const savedStudyId = localStorage.getItem('pakchat_active_study_id');

      // Helper to restore specific session data
      const restore = (id: string | null, type: string) => {
          if(!id) return;
          const session = loadedSessions.find((s: ChatSession) => s.id === id);
          if (session) {
              const history = session.messages.map((m: any) => ({ role: m.role, content: m.content }));
              if (type === 'chat') {
                  setCurrentSessionId(id);
                  setMessages(session.messages);
                  if (chatServiceRef.current) chatServiceRef.current.startChatWithHistory(history);
              } else if (type === 'tutor') {
                  setCurrentTutorSessionId(id);
                  setTutorMessages(session.messages);
                  if (tutorServiceRef.current) tutorServiceRef.current.startChatWithHistory(history);
              } else if (type === 'english-tutor') {
                  setCurrentEnglishSessionId(id);
                  setEnglishMessages(session.messages);
                  if (englishServiceRef.current) englishServiceRef.current.startChatWithHistory(history);
              } else if (type === 'study-school') {
                  setCurrentStudySessionId(id);
                  setStudyMessages(session.messages);
                  setActiveStudySubject(session.subjectId || null);
                  // Init specific service
                  let instruction = SUBJECT_INSTRUCTIONS[session.subjectId as keyof typeof SUBJECT_INSTRUCTIONS] || "You are a helpful teacher.";
                  studyServiceRef.current = new ChatService(instruction);
                  studyServiceRef.current.startChatWithHistory(history);
              }
          }
      };

      if (savedChatId) restore(savedChatId, 'chat');
      if (savedTutorId) restore(savedTutorId, 'tutor');
      if (savedEngId) restore(savedEngId, 'english-tutor');
      if (savedStudyId) restore(savedStudyId, 'study-school');

      // Remove builder routing
      if (savedView && savedView !== 'builder') setCurrentView(savedView as any);

    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }, []);

  // --- UPDATE SERVICE WHEN NAME/MEMORY CHANGES ---
  useEffect(() => {
      if (currentView === 'chat') {
          let fullSystemInstruction = SYSTEM_INSTRUCTION;
          if (userName) {
              fullSystemInstruction += `\n\n[USER IDENTITY]: The user's name is "${userName}". Address them by this name when appropriate.`;
          }
          if (userMemory) {
              fullSystemInstruction += `\n\n[USER MEMORY/CONTEXT]:\n${userMemory}`;
          }
          
          // Re-init chat service with new instructions
          chatServiceRef.current = new ChatService(fullSystemInstruction);
          
          // If a chat is active, we should theoretically maintain history but update instruction
          // The ChatService architecture in this app creates a new session, so we need to re-inject history
          if (messages.length > 1) {
              const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content }));
              chatServiceRef.current.startChatWithHistory(history);
          }
      }
  }, [userName, userMemory, currentView]);

  // --- AUTO-SAVE STATE ON CHANGE ---
  useEffect(() => {
      localStorage.setItem('pakchat_current_view', currentView);
  }, [currentView]);

  useEffect(() => { if(currentSessionId) localStorage.setItem('pakchat_active_chat_id', currentSessionId); }, [currentSessionId]);
  useEffect(() => { if(currentTutorSessionId) localStorage.setItem('pakchat_active_tutor_id', currentTutorSessionId); }, [currentTutorSessionId]);
  useEffect(() => { if(currentEnglishSessionId) localStorage.setItem('pakchat_active_english_id', currentEnglishSessionId); }, [currentEnglishSessionId]);
  useEffect(() => { if(currentStudySessionId) localStorage.setItem('pakchat_active_study_id', currentStudySessionId); }, [currentStudySessionId]);

  // ... (Other useEffects) ... 
  
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
            root.classList.add(mediaQuery.matches ? 'dark' : 'light');
        } else {
            root.classList.add(theme);
        }
    };

    applyTheme();
    localStorage.setItem('pakchat_theme', theme);

    if (theme === 'system') {
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('nova_sessions', JSON.stringify(sessions));
  }, [sessions]);
  
  // Persist Custom Subjects
  useEffect(() => {
    localStorage.setItem('pakchat_custom_subjects', JSON.stringify(customSubjects));
  }, [customSubjects]);

  // Sync Logic
  useEffect(() => { if (currentTutorSessionId && tutorMessages.length > 0) { setSessions(prev => { const index = prev.findIndex(s => s.id === currentTutorSessionId); if (index !== -1) { const updated = [...prev]; updated[index] = { ...updated[index], messages: tutorMessages, timestamp: Date.now() }; return updated; } return prev; }); } }, [tutorMessages, currentTutorSessionId]);
  useEffect(() => { if (currentEnglishSessionId && englishMessages.length > 0) { setSessions(prev => { const index = prev.findIndex(s => s.id === currentEnglishSessionId); if (index !== -1) { const updated = [...prev]; updated[index] = { ...updated[index], messages: englishMessages, timestamp: Date.now() }; return updated; } return prev; }); } }, [englishMessages, currentEnglishSessionId]);
  useEffect(() => { if (currentStudySessionId && studyMessages.length > 0) { setSessions(prev => { const index = prev.findIndex(s => s.id === currentStudySessionId); if (index !== -1) { const updated = [...prev]; updated[index] = { ...updated[index], messages: studyMessages, timestamp: Date.now() }; return updated; } return prev; }); } }, [studyMessages, currentStudySessionId]);
  useEffect(() => { if (currentSessionId && messages.length > 0 && currentView === 'chat') { setSessions(prev => { const index = prev.findIndex(s => s.id === currentSessionId); if (index !== -1) { const updated = [...prev]; updated[index] = { ...updated[index], messages: messages, timestamp: Date.now() }; return updated; } return prev; }); } }, [messages, currentSessionId, currentView]);

  const handleLanguageChange = (lang: string) => { setOutputLanguage(lang); localStorage.setItem('pakchat_language', lang); };
  const handleTranslateLanguageChange = (lang: string) => { setTranslateLanguage(lang); localStorage.setItem('pakchat_trans_language', lang); };
  const handlePlaybackChange = (enabled: boolean) => { setPlaybackEnabled(enabled); localStorage.setItem('pakchat_playback', String(enabled)); };

  const handleMicAccessChange = (enabled: boolean) => {
    setMicAccess(enabled);
    if (!enabled) localStorage.setItem('pakchat_mic_access', 'false');
    if (enabled) localStorage.setItem('pakchat_mic_access', 'true');
  };

  const handleCameraAccessChange = (enabled: boolean) => {
    setCameraAccess(enabled);
    if (!enabled) localStorage.setItem('pakchat_cam_access', 'false');
    if (enabled) localStorage.setItem('pakchat_cam_access', 'true');
  };

  const handlePermissionConfirm = (persistence: 'always' | 'temp') => {
      if (permissionModalType === 'microphone') {
          setMicAccess(true);
          if (persistence === 'always') localStorage.setItem('pakchat_mic_access', 'true');
      } else if (permissionModalType === 'camera') {
          setCameraAccess(true);
          if (persistence === 'always') localStorage.setItem('pakchat_cam_access', 'true');
      }
      setPermissionModalType(null);
  };

  // --- NAVIGATION HANDLER (Forced New Session on Return) ---
  const handleNavigation = (view: typeof currentView) => {
      // If switching main views (e.g. Chat -> History -> Chat), reset the session to create a new history entry next time.
      if (view !== currentView) {
          // Resetting IDs means the next message will create a NEW session ID.
          // The previous session is already saved in the `sessions` state/local storage.
          setCurrentSessionId(null);
          setCurrentTutorSessionId(null);
          setCurrentEnglishSessionId(null);
          setCurrentStudySessionId(null);

          // Reset UI to initial state
          setMessages([WELCOME_MESSAGE]);
          setTutorMessages([TUTOR_START_MESSAGE]);
          setEnglishMessages([ENGLISH_START_MESSAGE]);
          setStudyMessages([]); 
          // Note: Study messages reset, but if we select a subject again, it initializes.
          
          if (chatServiceRef.current) chatServiceRef.current.startChatWithHistory([]);
          if (tutorServiceRef.current) tutorServiceRef.current.startChatWithHistory([]);
          if (englishServiceRef.current) englishServiceRef.current.startChatWithHistory([]);
      }

      setCurrentView(view);
      
      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  const getPromptWithConfig = (content: string) => {
      let prompt = content;
      if (outputLanguage !== 'English') {
          prompt += `\n\n[SYSTEM NOTICE]: The user's preferred language is ${outputLanguage}. 
          However, if the user speaks or writes in a different language (e.g., Urdu, Hindi), YOU MUST REPLY IN THAT SAME LANGUAGE. 
          Mirror the user's language choice.`;
      }
      const configInstructions = [];
      if (chatConfig.length === 'short') configInstructions.push("Keep the response brief and concise.");
      if (chatConfig.length === 'long') configInstructions.push("Provide a detailed and comprehensive explanation.");
      if (chatConfig.style === 'learning') configInstructions.push("Act as a learning guide. Break down concepts simply.");
      if (chatConfig.style === 'custom') configInstructions.push("Follow the user's custom memory instructions strictly.");
      if (configInstructions.length > 0) prompt += `\n\n[INSTRUCTION]: ${configInstructions.join(' ')}`;
      return prompt;
  };

  // --- CONTEXT-AWARE QUIZ LOGIC ---
  const handleTakeQuiz = () => {
      const quizPrompt = "Create a short, interactive quiz (5 questions) to test my understanding of our recent topics. Use the json:quiz format for the first question.";
      
      if (currentView === 'chinese-tutor') {
          handleTutorSendMessage(quizPrompt);
      } else if (currentView === 'english-tutor') {
          handleEnglishSendMessage(quizPrompt);
      } else if (currentView === 'study-school') {
          handleStudySendMessage(quizPrompt);
      } else if (currentView === 'chat') {
          handleSendMessage("Generate a general knowledge quiz or a quiz based on our conversation.", undefined);
      }
  };

  // --- CONTEXT-AWARE NEW CHAT LOGIC ---
  const handleContextualNewChat = () => {
      if (currentView === 'chinese-tutor') {
          if (tutorLoadingState === 'streaming') return;
          setTutorMessages([TUTOR_START_MESSAGE]);
          setCurrentTutorSessionId(null);
          if(tutorServiceRef.current) tutorServiceRef.current.startChatWithHistory([]);
          return;
      }
      if (currentView === 'english-tutor') {
          if (englishLoadingState === 'streaming') return;
          setEnglishMessages([ENGLISH_START_MESSAGE]);
          setCurrentEnglishSessionId(null);
          if(englishServiceRef.current) englishServiceRef.current.startChatWithHistory([]);
          return;
      }
      if (currentView === 'study-school') {
          if (studyLoadingState === 'streaming') return;
          const subjName = customSubjects.find(s => s.id === activeStudySubject)?.name || activeStudySubject || "Class";
          const welcomeMsg: ChatMessage = { id: 'subject-welcome', role: 'model', content: `Welcome to the ${subjName} class! I am your teacher. How can I help you learn today?`, timestamp: Date.now() };
          setStudyMessages([welcomeMsg]);
          setCurrentStudySessionId(null);
          if(studyServiceRef.current) studyServiceRef.current.startChatWithHistory([]);
          return;
      }
      if (chatLoadingState === 'streaming') return;
      setMessages([WELCOME_MESSAGE]);
      setCurrentSessionId(null);
      setCurrentView('chat');
      if (chatServiceRef.current) chatServiceRef.current.startChatWithHistory([]);
  };

  const handleSendMessage = async (content: string, attachment?: File) => {
    if ((!content.trim() && !attachment) || chatLoadingState === 'streaming') return;
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newId = Date.now().toString();
      const newTitle = content.trim().length > 30 ? content.trim().slice(0, 30) + '...' : (content.trim() || 'File Attachment');
      const newSession: ChatSession = { 
          id: newId, 
          type: 'chat', 
          title: newTitle, 
          messages: [WELCOME_MESSAGE], 
          timestamp: Date.now(),
          createdAt: Date.now() // Add creation time
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
      activeSessionId = newId;
    }
    const attachmentUrl = attachment ? URL.createObjectURL(attachment) : undefined;
    let attachmentType = 'image';
    if (attachment) {
        if (attachment.type === 'application/pdf') attachmentType = 'pdf';
        else if (attachment.type.startsWith('text/')) attachmentType = 'text';
        else if (!attachment.type.startsWith('image/')) attachmentType = 'file';
    }
    const userMessage: ChatMessage = {
      id: Date.now().toString(), role: 'user', content: content, timestamp: Date.now(), attachmentUrl, attachmentType, attachmentName: attachment ? attachment.name : undefined
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatLoadingState('loading');
    try {
      if (!chatServiceRef.current) throw new Error('Chat service not initialized');
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantMessageId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setChatLoadingState('streaming');
      const promptToSend = getPromptWithConfig(content);
      const stream = await chatServiceRef.current.sendMessageStream(promptToSend, attachment);
      for await (const chunkText of stream) {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id === assistantMessageId) return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunkText }];
          return prev;
        });
      }
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.id === assistantMessageId) return [...prev.slice(0, -1), { ...lastMsg, isStreaming: false }];
        return prev;
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'model', content: getErrorMessage(error), timestamp: Date.now(), isError: true }]);
    } finally {
      setChatLoadingState('idle');
    }
  };

  const handleTutorSendMessage = async (content: string) => {
    if (!content.trim() || tutorLoadingState === 'streaming') return;
    if (!currentTutorSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, type: 'tutor', title: 'Chinese Lesson', messages: [TUTOR_START_MESSAGE], timestamp: Date.now(), createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setCurrentTutorSessionId(newId);
      setTutorMessages([TUTOR_START_MESSAGE]);
    }
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setTutorMessages(prev => [...prev, userMessage]);
    setTutorLoadingState('loading');
    try {
      if (!tutorServiceRef.current) throw new Error("Service not ready");
      const botMsgId = (Date.now() + 1).toString();
      setTutorMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setTutorLoadingState('streaming');
      const promptToSend = getPromptWithConfig(content);
      const stream = await tutorServiceRef.current.sendMessageStream(promptToSend);
      for await (const chunk of stream) {
        setTutorMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          return prev;
        });
      }
      setTutorMessages(prev => { const last = prev[prev.length - 1]; return last.id === botMsgId ? [...prev.slice(0, -1), { ...last, isStreaming: false }] : prev; });
    } catch (e) { setTutorMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error connecting to tutor.", timestamp: Date.now(), isError: true }]); } finally { setTutorLoadingState('idle'); }
  };

  const startChineseTest = () => { setTutorMessages([TUTOR_START_MESSAGE]); if(tutorServiceRef.current) tutorServiceRef.current.startChatWithHistory([]); setCurrentTutorSessionId(null); };

  const handleEnglishSendMessage = async (content: string) => {
    if (!content.trim() || englishLoadingState === 'streaming') return;
    if (!currentEnglishSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, type: 'english-tutor', title: 'English Lesson', messages: [ENGLISH_START_MESSAGE], timestamp: Date.now(), createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setCurrentEnglishSessionId(newId);
      setEnglishMessages([ENGLISH_START_MESSAGE]);
    }
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setEnglishMessages(prev => [...prev, userMessage]);
    setEnglishLoadingState('loading');
    try {
      if (!englishServiceRef.current) throw new Error("Service not ready");
      const botMsgId = (Date.now() + 1).toString();
      setEnglishMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
      setEnglishLoadingState('streaming');
      const promptToSend = getPromptWithConfig(content);
      const stream = await englishServiceRef.current.sendMessageStream(promptToSend);
      for await (const chunk of stream) {
        setEnglishMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          return prev;
        });
      }
      setEnglishMessages(prev => { const last = prev[prev.length - 1]; return last.id === botMsgId ? [...prev.slice(0, -1), { ...last, isStreaming: false }] : prev; });
    } catch (e) { setEnglishMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error connecting to tutor.", timestamp: Date.now(), isError: true }]); } finally { setEnglishLoadingState('idle'); }
  };

  const startEnglishTest = () => { setEnglishMessages([ENGLISH_START_MESSAGE]); if(englishServiceRef.current) englishServiceRef.current.startChatWithHistory([]); setCurrentEnglishSessionId(null); };

  const handleSelectSubject = (subjectId: string) => {
      setActiveStudySubject(subjectId);
      
      let instruction = SUBJECT_INSTRUCTIONS[subjectId as keyof typeof SUBJECT_INSTRUCTIONS];
      if (!instruction) {
          const custom = customSubjects.find(s => s.id === subjectId);
          if (custom) instruction = custom.instruction;
      }
      if (!instruction) instruction = "You are a helpful teacher.";

      studyServiceRef.current = new ChatService(instruction);
      
      const subjName = customSubjects.find(s => s.id === subjectId)?.name || subjectId;
      const welcomeMsg: ChatMessage = { id: 'subject-welcome', role: 'model', content: `Welcome to the ${subjName} class! I am your teacher. How can I help you learn today?`, timestamp: Date.now() };
      setStudyMessages([welcomeMsg]);
      setCurrentStudySessionId(null);
  };

  const handleStudySendMessage = async (content: string) => {
      if (!content.trim() || studyLoadingState === 'streaming' || !activeStudySubject) return;
      if (!currentStudySessionId) {
          const newId = Date.now().toString();
          const subjName = customSubjects.find(s => s.id === activeStudySubject)?.name || activeStudySubject;
          const newSession: ChatSession = { id: newId, type: 'study-school', title: `${subjName} Class`, subjectId: activeStudySubject, messages: studyMessages, timestamp: Date.now(), createdAt: Date.now() };
          setSessions(prev => [newSession, ...prev]);
          setCurrentStudySessionId(newId);
      }
      const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
      setStudyMessages(prev => [...prev, userMessage]);
      setStudyLoadingState('loading');
      try {
          if (!studyServiceRef.current) throw new Error("Service not ready");
          const botMsgId = (Date.now() + 1).toString();
          setStudyMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
          setStudyLoadingState('streaming');
          const promptToSend = getPromptWithConfig(content);
          const stream = await studyServiceRef.current.sendMessageStream(promptToSend);
          for await (const chunk of stream) {
              setStudyMessages(prev => { const last = prev[prev.length - 1]; if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]; return prev; });
          }
          setStudyMessages(prev => { const last = prev[prev.length - 1]; return last.id === botMsgId ? [...prev.slice(0, -1), { ...last, isStreaming: false }] : prev; });
      } catch (e) { setStudyMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error in class.", timestamp: Date.now(), isError: true }]); } finally { setStudyLoadingState('idle'); }
  };

  const handleAddCustomSubject = (subject: any) => { setCustomSubjects(prev => [...prev, subject]); };
  const handleDeleteCustomSubject = (id: string) => { setCustomSubjects(prev => prev.filter(s => s.id !== id)); };

  const handleLoadSession = (sessionId: string, type: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      if (type === 'chat') {
          setMessages(session.messages);
          setCurrentSessionId(session.id);
          setCurrentView('chat');
          if (chatServiceRef.current) { const history = session.messages.filter(m => m.role !== 'model' || m.content !== '').map(m => ({ role: m.role, content: m.content })); chatServiceRef.current.startChatWithHistory(history); }
      } else if (type === 'tutor') {
          setTutorMessages(session.messages);
          setCurrentTutorSessionId(session.id);
          setCurrentView('chinese-tutor');
          if (tutorServiceRef.current) { const history = session.messages.map(m => ({ role: m.role, content: m.content })); tutorServiceRef.current.startChatWithHistory(history); }
      } else if (type === 'english-tutor') {
          setEnglishMessages(session.messages);
          setCurrentEnglishSessionId(session.id);
          setCurrentView('english-tutor');
          if (englishServiceRef.current) { const history = session.messages.map(m => ({ role: m.role, content: m.content })); englishServiceRef.current.startChatWithHistory(history); }
      } else if (type === 'study-school') {
          setStudyMessages(session.messages);
          setCurrentStudySessionId(session.id);
          setActiveStudySubject(session.subjectId || null);
          setCurrentView('study-school');
          if (session.subjectId) {
              let instruction = SUBJECT_INSTRUCTIONS[session.subjectId as keyof typeof SUBJECT_INSTRUCTIONS];
              if(!instruction) { const custom = customSubjects.find(s => s.id === session.subjectId); if (custom) instruction = custom.instruction; }
              if(!instruction) instruction = "You are a helpful teacher.";
              studyServiceRef.current = new ChatService(instruction);
              const history = session.messages.map(m => ({ role: m.role, content: m.content }));
              studyServiceRef.current.startChatWithHistory(history);
          }
      }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => { 
      setSessions(prev => prev.filter(s => s.id !== sessionId)); 
      if(currentSessionId === sessionId) handleContextualNewChat(); 
  };
  const handleRenameSession = (sessionId: string, newTitle: string) => { setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)); };
  const handleShareSession = async (sessionId: string) => { const session = sessions.find(s => s.id === sessionId); if (!session) return; const text = session.messages.map(m => `${m.role === 'user' ? 'User' : 'Pak Chat'}: ${m.content}`).join('\n\n'); if (navigator.share) { try { await navigator.share({ title: session.title, text: text }); } catch (err) { console.error("Share failed:", err); } } else { try { await navigator.clipboard.writeText(text); alert("Conversation copied to clipboard!"); } catch (err) { alert("Failed to copy conversation."); } } };

  const handleEditMessage = async (id: string, newContent: string) => { if (chatLoadingState !== 'idle') return; const msgIndex = messages.findIndex((m) => m.id === id); if (msgIndex === -1) return; const historyToKeep = messages.slice(0, msgIndex); const geminiHistory = historyToKeep.filter(m => m.id !== 'welcome'); setMessages(historyToKeep); if (chatServiceRef.current) await chatServiceRef.current.startChatWithHistory(geminiHistory); handleSendMessage(newContent); };
  const handleRegenerate = (botMessageId: string) => { if (chatLoadingState !== 'idle') return; const msgIndex = messages.findIndex((m) => m.id === botMessageId); if (msgIndex === -1) return; const prevUserMsg = messages[msgIndex - 1]; if (prevUserMsg && prevUserMsg.role === 'user') handleEditMessage(prevUserMsg.id, prevUserMsg.content); };
  const handleShareChat = async () => { let msgsToShare: ChatMessage[] = []; if (currentView === 'chat') msgsToShare = messages; else if (currentView === 'chinese-tutor') msgsToShare = tutorMessages; else if (currentView === 'english-tutor') msgsToShare = englishMessages; else if (currentView === 'study-school') msgsToShare = studyMessages; const validMsgs = msgsToShare.filter(m => !m.isError); if (validMsgs.length === 0) { alert("Nothing to share yet."); return; } const text = validMsgs.map(m => `${m.role === 'user' ? 'User' : 'Pak Chat'}:\n${m.content}`).join('\n\n'); if (navigator.share) { try { await navigator.share({ title: 'Pak Chat Conversation', text: text }); } catch (e) { console.log("Share failed"); } } else { try { await navigator.clipboard.writeText(text); alert("Chat transcript copied to clipboard!"); } catch (err) { alert("Failed to copy chat."); } } };
  
  const handleStartLiveSession = (instructionOverride?: string) => {
      let baseInstruction = SYSTEM_INSTRUCTION;
      if (instructionOverride) { baseInstruction = instructionOverride; } else { if (currentView === 'chinese-tutor') baseInstruction = TUTOR_SYSTEM_INSTRUCTION; else if (currentView === 'english-tutor') baseInstruction = ENGLISH_TUTOR_SYSTEM_INSTRUCTION; else if (currentView === 'study-school' && activeStudySubject) { let subjInstr = SUBJECT_INSTRUCTIONS[activeStudySubject as keyof typeof SUBJECT_INSTRUCTIONS]; if(!subjInstr) { const custom = customSubjects.find(s => s.id === activeStudySubject); if (custom) subjInstr = custom.instruction; } baseInstruction = subjInstr || "You are a helpful teacher."; } }
      const finalInstruction = instructionOverride ? baseInstruction : getSystemInstructionFromConfig(baseInstruction, chatConfig);
      setLiveSessionInstruction(finalInstruction);
      setIsLiveSessionOpen(true);
  };

  const handleLiveTranscriptUpdate = (liveTranscript: ChatMessage[]) => {
      const merge = (prevMessages: ChatMessage[], newLiveMessages: ChatMessage[]) => { const uniqueNew = newLiveMessages.filter(nm => !prevMessages.some(pm => pm.id === nm.id)); return [...prevMessages, ...uniqueNew]; };
      if (currentView === 'chinese-tutor') { if (!currentTutorSessionId) { const newId = Date.now().toString(); const newSession: ChatSession = { id: newId, type: 'tutor', title: 'Chinese Live Session', messages: liveTranscript, timestamp: Date.now(), createdAt: Date.now() }; setSessions(prev => [newSession, ...prev]); setCurrentTutorSessionId(newId); setTutorMessages(liveTranscript); } else { setTutorMessages(prev => merge(prev, liveTranscript)); } } 
      else if (currentView === 'english-tutor') { if (!currentEnglishSessionId) { const newId = Date.now().toString(); const newSession: ChatSession = { id: newId, type: 'english-tutor', title: 'English Live Session', messages: liveTranscript, timestamp: Date.now(), createdAt: Date.now() }; setSessions(prev => [newSession, ...prev]); setCurrentEnglishSessionId(newId); setEnglishMessages(liveTranscript); } else { setEnglishMessages(prev => merge(prev, liveTranscript)); } } 
      else if (currentView === 'study-school' && activeStudySubject) { if (!currentStudySessionId) { const newId = Date.now().toString(); const newSession: ChatSession = { id: newId, type: 'study-school', title: `${activeStudySubject} Live Class`, subjectId: activeStudySubject, messages: liveTranscript, timestamp: Date.now(), createdAt: Date.now() }; setSessions(prev => [newSession, ...prev]); setCurrentStudySessionId(newId); setStudyMessages(liveTranscript); } else { setStudyMessages(prev => merge(prev, liveTranscript)); } } 
      else if (currentView === 'chat') { if (!currentSessionId) { const newId = Date.now().toString(); const title = liveTranscript[0]?.content.slice(0, 30) || 'Live Session'; const newSession: ChatSession = { id: newId, type: 'chat', title: title, messages: liveTranscript, timestamp: Date.now(), createdAt: Date.now() }; setSessions(prev => [newSession, ...prev]); setCurrentSessionId(newId); setMessages(liveTranscript); } else { setMessages(prev => merge(prev, liveTranscript)); } }
  };

  const handleLiveSessionClose = (transcript: ChatMessage[]) => { setIsLiveSessionOpen(false); if (transcript.length > 0) { handleLiveTranscriptUpdate(transcript); } };

  // --- NEW: AI Handlers for Notes ---
  const handleNotesAiAssist = async (prompt: string, content: string): Promise<string> => {
      // Use a temporary chat service for Notes AI actions
      const notesService = new ChatService("You are an intelligent text editor assistant. Output ONLY HTML content compatible with a rich text editor.");
      try {
          const stream = await notesService.sendMessageStream(prompt);
          let result = "";
          for await (const chunk of stream) result += chunk;
          return result;
      } catch (e) {
          throw e;
      }
  };

  const handleNotesTranscribe = async (audioFile: File): Promise<string> => {
      // Use a temporary service for transcription
      const transcribeService = new ChatService("You are a professional transcriber. Transcribe the audio verbatim.");
      try {
          const stream = await transcribeService.sendMessageStream("Transcribe this audio file.", audioFile);
          let result = "";
          for await (const chunk of stream) result += chunk;
          return result;
      } catch (e) {
          throw e;
      }
  };

  // --- AUTH CHECK ---
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'settings': 
        return <SettingsPage 
          currentLanguage={outputLanguage} 
          onLanguageChange={handleLanguageChange} 
          translateLanguage={translateLanguage}
          onTranslateLanguageChange={handleTranslateLanguageChange}
          currentTheme={theme}
          onThemeChange={setTheme}
          onBack={() => handleNavigation('chat')} 
          playbackEnabled={playbackEnabled}
          onPlaybackChange={handlePlaybackChange}
          micAccess={micAccess}
          onMicAccessChange={handleMicAccessChange}
          cameraAccess={cameraAccess}
          onCameraAccessChange={handleCameraAccessChange}
          userName={userName}
          userAvatar={userAvatar}
          onUpdateProfile={handleUpdateProfile}
          onSignOut={handleSignOut}
        />;
      case 'notes': 
        return <NotesPage 
            onAiAssist={handleNotesAiAssist} 
            onTranscribe={handleNotesTranscribe}
            language={outputLanguage} 
            onMenuClick={() => setIsSidebarOpen(true)} 
        />;
      case 'history': 
        return <HistoryPage 
            sessions={sessions} 
            onLoadSession={handleLoadSession} 
            onDeleteSession={handleDeleteSession} 
            onStartNewChat={handleContextualNewChat}
            onRenameSession={handleRenameSession}
            onShareSession={handleShareSession}
        />;
      case 'chinese-tutor': return <ChineseTutorPage messages={tutorMessages} loadingState={tutorLoadingState} onSendMessage={handleTutorSendMessage} onStartTest={startChineseTest} language={outputLanguage} onStartLive={() => handleStartLiveSession()} />;
      case 'english-tutor': return <EnglishTutorPage messages={englishMessages} loadingState={englishLoadingState} onSendMessage={handleEnglishSendMessage} onStartTest={startEnglishTest} language={outputLanguage} onStartLive={() => handleStartLiveSession()} />;
      case 'study-school': return <StudySchoolPage messages={studyMessages} loadingState={studyLoadingState} activeSubject={activeStudySubject} customSubjects={customSubjects} onAddSubject={handleAddCustomSubject} onDeleteCustomSubject={handleDeleteCustomSubject} sessions={sessions} onSelectSubject={handleSelectSubject} onSendMessage={handleStudySendMessage} onBack={() => setActiveStudySubject(null)} onLoadSession={(id) => handleLoadSession(id, 'study-school')} onDeleteSession={handleDeleteSession} language={outputLanguage} onStartLive={() => handleStartLiveSession()} />;
      case 'chat': default:
        return (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            <div className="flex-1 overflow-hidden relative">
              <MessageList messages={messages} loadingState={chatLoadingState} onEdit={handleEditMessage} onRegenerate={handleRegenerate} onReply={(text) => handleSendMessage(text)} language={outputLanguage} translateLanguage={translateLanguage} playbackEnabled={playbackEnabled} />
            </div>
            <div className="w-full px-4 pb-6 pt-2">
              <ChatInput onSend={handleSendMessage} onStartLive={() => handleStartLiveSession()} isLoading={chatLoadingState !== 'idle'} hardwareAccess={micAccess} language={outputLanguage} onRequestMicAccess={() => setPermissionModalType('microphone')} />
              <div className="text-center mt-2"><p className="text-xs text-gray-400">Pak Chat may display inaccurate info, so double-check its responses.</p></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onNavigate={handleNavigation} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Hide header on full-screen modules like Notes */}
        {(currentView !== 'notes') && (
          <Header 
            onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
            onNewChat={handleContextualNewChat} 
            onConfigureClick={() => setIsConfigureModalOpen(true)} 
            onShareClick={handleShareChat} 
            onDictionaryClick={() => setIsDictionaryOpen(true)} 
            onQuizClick={handleTakeQuiz}
          />
        )}
        <main className={`flex-1 flex flex-col mx-auto w-full relative overflow-hidden ${currentView === 'notes' ? 'h-full' : ''}`}>
          {renderContent()}
        </main>
      </div>
      {isLiveSessionOpen && (<LiveSessionOverlay onClose={handleLiveSessionClose} onTranscriptUpdate={handleLiveTranscriptUpdate} language={outputLanguage} systemInstruction={liveSessionInstruction} micAccess={micAccess} cameraAccess={cameraAccess} onRequestCameraAccess={() => setPermissionModalType('camera')} />)}
      <ConfigureChatModal isOpen={isConfigureModalOpen} onClose={() => setIsConfigureModalOpen(false)} config={chatConfig} onSave={setChatConfig} />
      <DictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />
      <PermissionModal isOpen={!!permissionModalType} type={permissionModalType || 'microphone'} onClose={() => setPermissionModalType(null)} onConfirm={handlePermissionConfirm} />
    </div>
  );
}
