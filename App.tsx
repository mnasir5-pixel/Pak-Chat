
import React, { useState, useRef, useEffect } from 'react';
import { ChatService } from './services/geminiService';
import { AppSidebar } from './components/AppSidebar';
import { Header } from './components/Header';
import { TutorsPage } from './components/TutorsPage';
import { StudySchoolPage } from './components/StudySchoolPage';
import { NotesPage } from './components/NotesPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { NasherNotesPage } from './components/NasherNotesPage';
import { BuilderPage } from './components/BuilderPage';
import { DictionaryModal } from './components/DictionaryModal';
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
import { PermissionModal } from './components/PermissionModal';
import { ConfigureChatModal } from './components/ConfigureChatModal';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { DEFAULT_TUTORS, DEFAULT_SUBJECTS, createTutorInstruction, SYSTEM_INSTRUCTION, getSystemInstructionFromConfig } from './constants';
import { ChatMessage, Tutor, StudySubject, ChatSession, LoadingState, ChatConfig } from './types';

// Types for View State
type ViewState = 'chat' | 'history' | 'tutors' | 'study-school' | 'settings' | 'notes' | 'builder' | 'nasher-notes';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: "Hello! I'm Pak Chat. How can I help you today?",
  timestamp: Date.now(),
};

// Helper to format context for Live Session
const formatContext = (messages: ChatMessage[]) => {
  const recent = messages.filter(m => !m.isError && m.id !== 'welcome').slice(-10);
  if (recent.length === 0) return "";
  
  return `\n\n[RECENT CONVERSATION CONTEXT]\n${recent.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')}\n[END CONTEXT]\n\nIMPORTANT: The user has switched to Live Voice mode. Continue the conversation naturally from the context above. Do not repeat the last message unless asked.`;
};

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<ViewState>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveInstruction, setLiveInstruction] = useState('');
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ style: 'default', length: 'default' });
  const [permissionModalType, setPermissionModalType] = useState<'microphone' | null>(null);
  
  // Input Persistence State
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Chat & Messages
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [replyingToContent, setReplyingToContent] = useState<string | null>(null);
  
  // Tutors
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>(DEFAULT_TUTORS);
  const [activeTutorMessages, setActiveTutorMessages] = useState<ChatMessage[]>([]);
  const [learnerContext, setLearnerContext] = useState<Record<string, any>>({});
  const [currentTutorSessionId, setCurrentTutorSessionId] = useState<string | null>(null);

  // Study School
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<StudySubject[]>(DEFAULT_SUBJECTS);
  const [activeSubjectMessages, setActiveSubjectMessages] = useState<ChatMessage[]>([]);
  const [currentSubjectSessionId, setCurrentSubjectSessionId] = useState<string | null>(null);

  // History
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Settings
  const [language, setLanguage] = useState('English');
  const [translateLanguage, setTranslateLanguage] = useState('Urdu');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [playbackEnabled, setPlaybackEnabled] = useState(true);
  const [micAccess, setMicAccess] = useState(true);

  // Refs
  const tutorServiceRef = useRef<ChatService | null>(null);
  const subjectServiceRef = useRef<ChatService | null>(null);
  const mainChatServiceRef = useRef<ChatService | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load persisted data
    const savedSessions = localStorage.getItem('pakchat_sessions');
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    
    const savedContext = localStorage.getItem('pakchat_learner_context');
    if (savedContext) {
        try { setLearnerContext(JSON.parse(savedContext)); } catch (e) {}
    }

    // Theme init
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
    
    // Init Main Service
    mainChatServiceRef.current = new ChatService(SYSTEM_INSTRUCTION);
  }, []);

  useEffect(() => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
      localStorage.setItem('pakchat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
      localStorage.setItem('pakchat_learner_context', JSON.stringify(learnerContext));
  }, [learnerContext]);

  // --- DRAFT HANDLING ---
  const handleDraftChange = (text: string) => {
      setDrafts(prev => ({ ...prev, [currentView]: text }));
  };

  const clearCurrentDraft = () => {
      setDrafts(prev => ({ ...prev, [currentView]: '' }));
  };

  // --- LOGIC: BRANCH CHAT ---
  const handleBranchChat = async (messageId: string) => {
      // Determine source array based on current view
      let sourceMessages: ChatMessage[] = [];
      if (currentView === 'chat') sourceMessages = messages;
      else if (currentView === 'tutors') sourceMessages = activeTutorMessages;
      else if (currentView === 'study-school') sourceMessages = activeSubjectMessages;

      const index = sourceMessages.findIndex(m => m.id === messageId);
      if (index === -1) return;

      const branchMsg = sourceMessages[index];
      const newId = Date.now().toString();
      
      // RESET VIEW & STATE FOR NEW CHAT
      setCurrentView('chat');
      setActiveTutorId(null);
      setActiveSubjectId(null);
      setCurrentSessionId(newId);

      // RESET SERVICE
      // Use default system instruction for branched chat (General Assistant)
      mainChatServiceRef.current = new ChatService(SYSTEM_INSTRUCTION);

      // CASE 1: BRANCHING ON USER MESSAGE (Re-trigger generation)
      if (branchMsg.role === 'user') {
          // History is everything BEFORE this message
          const history = sourceMessages.slice(0, index);
          
          // 1. Init Service History (Filter out 'welcome' to prevent API 400 errors)
          await mainChatServiceRef.current.startChatWithHistory(
              history
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }))
          );

          // 2. Set UI State to History + User Message
          const userMessage: ChatMessage = { 
              ...branchMsg, 
              id: Date.now().toString(), // New ID for new session
              timestamp: Date.now() 
          };
          
          const initialMessages = [...history, userMessage];
          setMessages(initialMessages);
          setLoadingState('loading');

          // 3. Create Session Entry immediately
          const newSession: ChatSession = {
              id: newId,
              type: 'chat',
              title: `Branch: ${userMessage.content.slice(0, 30)}...`,
              messages: initialMessages,
              timestamp: Date.now(),
              createdAt: Date.now()
          };
          setSessions(prev => [newSession, ...prev]);

          // 4. Send Request (Generate response for the branched message)
          try {
              const stream = await mainChatServiceRef.current.sendMessageStream(userMessage.content);
              const botMsgId = (Date.now() + 1).toString();
              
              setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
              setLoadingState('streaming');

              let fullResponse = '';
              for await (const chunk of stream) {
                  fullResponse += chunk;
                  setMessages(prev => {
                      const last = prev[prev.length - 1];
                      if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                      return prev;
                  });
              }
              
              setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
                  return prev;
              });

              // Update Session with final response
              setSessions(prev => prev.map(s => s.id === newId ? { 
                  ...s, 
                  messages: [...initialMessages, { id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now() }], 
                  timestamp: Date.now() 
              } : s));

          } catch (e: any) {
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error: " + e.message, timestamp: Date.now(), isError: true }]);
          } finally {
              setLoadingState('idle');
          }

      } else {
          // CASE 2: BRANCHING ON MODEL MESSAGE (Continue conversation)
          // History includes the branched message
          const history = sourceMessages.slice(0, index + 1);
          
          await mainChatServiceRef.current.startChatWithHistory(
              history
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }))
          );

          setMessages(history);
          
          const title = history[history.length - 1].content.slice(0, 30) + '...';
          const newSession: ChatSession = {
              id: newId,
              type: 'chat',
              title: `Branch: ${title}`,
              messages: history,
              timestamp: Date.now(),
              createdAt: Date.now()
          };
          setSessions(prev => [newSession, ...prev]);
      }
  };

  // --- HANDLERS: MAIN CHAT ---
  const handleSendMessage = async (content: string, attachment?: File) => {
    if ((!content.trim() && !attachment) || loadingState === 'streaming') return;
    
    clearCurrentDraft(); // Clear draft on send

    // Construct actual content with Reply Context if exists
    let finalContent = content;
    if (replyingToContent) {
        finalContent = `> ${replyingToContent}\n\n${content}`;
        setReplyingToContent(null);
    }

    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newTitle = finalContent.trim().length > 30 ? finalContent.trim().slice(0, 30) + '...' : (finalContent.trim() || 'File Attachment');
      const newSession: ChatSession = { id: newId, type: 'chat', title: newTitle, messages: [WELCOME_MESSAGE], timestamp: Date.now(), createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
    }

    const userMessage: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: finalContent, 
        timestamp: Date.now(), 
        attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined,
        attachmentType: attachment?.type.startsWith('image/') ? 'image' : 'file',
        attachmentName: attachment?.name
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoadingState('loading');
    
    if (!mainChatServiceRef.current) {
        mainChatServiceRef.current = new ChatService(SYSTEM_INSTRUCTION);
    }
    
    try {
        const stream = await mainChatServiceRef.current.sendMessageStream(finalContent, attachment);
        
        const botMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);
        setLoadingState('streaming');

        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                return prev;
            });
        }
        
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
            return prev;
        });

        // Update Session
        if (currentSessionId) {
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...messages, userMessage, { id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now() }], timestamp: Date.now() } : s));
        }

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Error: " + e.message, timestamp: Date.now(), isError: true }]);
    } finally {
        setLoadingState('idle');
    }
  };

  const handleEditMessage = async (id: string, newContent: string) => {
      const index = messages.findIndex(m => m.id === id);
      if (index === -1) return;
      
      const newHistory = messages.slice(0, index);
      setMessages(newHistory);
      
      if (mainChatServiceRef.current) {
          mainChatServiceRef.current.startChatWithHistory(
              newHistory
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }))
          );
      }
      handleSendMessage(newContent);
  };

  const handleRegenerateChat = async (id: string) => {
      const index = messages.findIndex(m => m.id === id);
      if (index === -1) return;

      let targetUserMessage: string | null = null;
      let newHistory: ChatMessage[] = [];

      if (messages[index].role === 'model') {
          const prevUserMsg = messages[index - 1];
          if (prevUserMsg && prevUserMsg.role === 'user') {
              targetUserMessage = prevUserMsg.content;
              newHistory = messages.slice(0, index - 1); 
          }
      } else {
          targetUserMessage = messages[index].content;
          newHistory = messages.slice(0, index);
      }

      if (targetUserMessage) {
          setMessages(newHistory);
          if (mainChatServiceRef.current) {
              mainChatServiceRef.current.startChatWithHistory(
                  newHistory
                    .filter(m => m.id !== 'welcome')
                    .map(m => ({ role: m.role, content: m.content }))
              );
          }
          handleSendMessage(targetUserMessage);
      }
  };

  // --- HANDLERS: TUTOR ---
  const handleAddTutor = (tutor: Tutor) => {
      setTutors(prev => [...prev, tutor]);
  };

  const handleSelectTutor = (tutorId: string) => {
      setActiveTutorId(tutorId);
      
      const lastSession = sessions
          .filter(s => {
              if (s.tutorId === tutorId) return true;
              if (tutorId === 'chinese-default' && s.type === 'tutor') return true;
              if (tutorId === 'english-default' && s.type === 'english-tutor') return true;
              return false;
          })
          .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastSession) {
          setActiveTutorMessages(lastSession.messages);
          setCurrentTutorSessionId(lastSession.id);
          
          const tutor = tutors.find(t => t.id === tutorId);
          if (tutor) {
               const instr = tutor.instruction || createTutorInstruction(tutor.targetLanguage);
               tutorServiceRef.current = new ChatService(instr);
               tutorServiceRef.current.startChatWithHistory(
                   lastSession.messages.map(m => ({ role: m.role, content: m.content }))
               );
          }
      } else {
          setActiveTutorMessages([]);
          setCurrentTutorSessionId(null);
      }
  };

  const handleStartTutorTest = async () => {
      if (!activeTutorId) return;
      const tutor = tutors.find(t => t.id === activeTutorId);
      if (!tutor) return;

      setLearnerContext(prev => {
          const newCtx = { ...prev };
          delete newCtx[activeTutorId];
          return newCtx;
      });

      const instr = tutor.instruction || createTutorInstruction(tutor.targetLanguage);
      tutorServiceRef.current = new ChatService(instr);
      tutorServiceRef.current.startChatWithHistory([]); 

      setActiveTutorMessages([]);
      setCurrentTutorSessionId(null);

      // Force prompt to ensure the quiz actually starts
      const hiddenPrompt = "Start Session. First step: Ask the user for their native language (Madri Zaban). Do NOT start the quiz yet.";
      setLoadingState('streaming');
      
      try {
          const stream = await tutorServiceRef.current.sendMessageStream(hiddenPrompt);
          const botMsgId = (Date.now()).toString();
          
          setActiveTutorMessages([{ id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);

          let fullResponse = '';
          for await (const chunk of stream) {
              fullResponse += chunk;
              setActiveTutorMessages(prev => {
                  if (prev.length === 0) return [{ id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now(), isStreaming: true }];
                  const last = prev[prev.length - 1];
                  if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                  return prev;
              });
          }
          setActiveTutorMessages(prev => {
              const last = prev[prev.length - 1];
              if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
              return prev;
          });

          const session: ChatSession = {
              id: Date.now().toString(),
              type: 'language-tutor',
              tutorId: activeTutorId,
              title: `${tutor.name} Session`,
              messages: [{ id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now() }],
              timestamp: Date.now(),
              createdAt: Date.now()
          };
          setCurrentTutorSessionId(session.id);
          setSessions(prev => [session, ...prev]);

      } catch (e) {
          console.error(e);
          setLoadingState('idle');
      } finally {
          setLoadingState('idle');
      }
  };

  const handleTutorMessage = async (content: string, attachment?: File) => {
      if (!activeTutorId) return;
      const tutor = tutors.find(t => t.id === activeTutorId);
      if (!tutor) return;

      clearCurrentDraft(); // Clear draft

      if (!tutorServiceRef.current) {
          const instr = tutor.instruction || createTutorInstruction(tutor.targetLanguage);
          tutorServiceRef.current = new ChatService(instr);
      }

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now(), attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined };
      setActiveTutorMessages(prev => [...prev, userMsg]);
      setLoadingState('streaming');

      try {
          const stream = await tutorServiceRef.current.sendMessageStream(content, attachment);
          const botMsgId = (Date.now() + 1).toString();
          setActiveTutorMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);

          let fullResponse = '';
          for await (const chunk of stream) {
              fullResponse += chunk;
              setActiveTutorMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                  return prev;
              });
          }
          setActiveTutorMessages(prev => {
              const last = prev[prev.length - 1];
              if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
              return prev;
          });

          const session: ChatSession = {
              id: currentTutorSessionId || Date.now().toString(),
              type: 'language-tutor',
              tutorId: activeTutorId,
              title: `${tutor.name} Session`,
              messages: [...activeTutorMessages, userMsg, { id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now() }],
              timestamp: Date.now(),
              createdAt: currentTutorSessionId ? undefined : Date.now()
          };
          if (!currentTutorSessionId) setCurrentTutorSessionId(session.id);
          
          setSessions(prev => {
              const exists = prev.findIndex(s => s.id === session.id);
              if (exists >= 0) {
                  const updated = [...prev];
                  updated[exists] = session;
                  return updated;
              }
              return [session, ...prev];
          });

      } catch (e) {
          console.error(e);
      } finally {
          setLoadingState('idle');
      }
  };

  const handleRegenerateTutor = async (id: string) => {
      const index = activeTutorMessages.findIndex(m => m.id === id);
      if (index === -1) return;

      let targetUserMessage: string | null = null;
      let newHistory: ChatMessage[] = [];

      if (activeTutorMessages[index].role === 'model') {
          const prevUserMsg = activeTutorMessages[index - 1];
          if (prevUserMsg && prevUserMsg.role === 'user') {
              targetUserMessage = prevUserMsg.content;
              newHistory = activeTutorMessages.slice(0, index - 1);
          }
      } else {
          targetUserMessage = activeTutorMessages[index].content;
          newHistory = activeTutorMessages.slice(0, index);
      }

      if (targetUserMessage) {
          setActiveTutorMessages(newHistory);
          if (tutorServiceRef.current) {
              tutorServiceRef.current.startChatWithHistory(
                  newHistory.map(m => ({ role: m.role, content: m.content }))
              );
          }
          handleTutorMessage(targetUserMessage);
      }
  };

  // --- HANDLERS: STUDY SCHOOL ---
  const handleSelectSubject = (subjectId: string) => {
      setActiveSubjectId(subjectId);
      
      const lastSession = sessions
          .filter(s => s.subjectId === subjectId)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastSession) {
          setActiveSubjectMessages(lastSession.messages);
          setCurrentSubjectSessionId(lastSession.id);
          
          const subject = subjects.find(s => s.id === subjectId);
          if (subject) {
               const instr = subject.instruction || "You are a helpful tutor.";
               subjectServiceRef.current = new ChatService(instr);
               subjectServiceRef.current.startChatWithHistory(
                   lastSession.messages.map(m => ({ role: m.role, content: m.content }))
               );
          }
      } else {
          setActiveSubjectMessages([]);
          setCurrentSubjectSessionId(null);
      }
  };

  const handleSubjectMessage = async (content: string, attachment?: File) => {
      if (!activeSubjectId) return;
      const subject = subjects.find(s => s.id === activeSubjectId);
      if (!subject) return;

      clearCurrentDraft(); // Clear draft

      if (!subjectServiceRef.current) {
          subjectServiceRef.current = new ChatService(subject.instruction || "You are a helpful tutor.");
      }

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now(), attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined };
      setActiveSubjectMessages(prev => [...prev, userMsg]);
      setLoadingState('streaming');

      try {
          const stream = await subjectServiceRef.current.sendMessageStream(content, attachment);
          const botMsgId = (Date.now() + 1).toString();
          setActiveSubjectMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);

          let fullResponse = '';
          for await (const chunk of stream) {
              fullResponse += chunk;
              setActiveSubjectMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                  return prev;
              });
          }
          setActiveSubjectMessages(prev => {
              const last = prev[prev.length - 1];
              if (last.id === botMsgId) return [...prev.slice(0, -1), { ...last, isStreaming: false }];
              return prev;
          });

          const session: ChatSession = {
              id: currentSubjectSessionId || Date.now().toString(),
              type: 'study-school',
              subjectId: activeSubjectId,
              title: `${subject.name} Class`,
              messages: [...activeSubjectMessages, userMsg, { id: botMsgId, role: 'model', content: fullResponse, timestamp: Date.now() }],
              timestamp: Date.now(),
              createdAt: currentSubjectSessionId ? undefined : Date.now()
          };
          if (!currentSubjectSessionId) setCurrentSubjectSessionId(session.id);
          
          setSessions(prev => {
              const exists = prev.findIndex(s => s.id === session.id);
              if (exists >= 0) {
                  const updated = [...prev];
                  updated[exists] = session;
                  return updated;
              }
              return [session, ...prev];
          });

      } catch (e) {
          console.error(e);
      } finally {
          setLoadingState('idle');
      }
  };

  const handleRegenerateSubject = async (id: string) => {
      const index = activeSubjectMessages.findIndex(m => m.id === id);
      if (index === -1) return;

      let targetUserMessage: string | null = null;
      let newHistory: ChatMessage[] = [];

      if (activeSubjectMessages[index].role === 'model') {
          const prevUserMsg = activeSubjectMessages[index - 1];
          if (prevUserMsg && prevUserMsg.role === 'user') {
              targetUserMessage = prevUserMsg.content;
              newHistory = activeSubjectMessages.slice(0, index - 1);
          }
      } else {
          targetUserMessage = activeSubjectMessages[index].content;
          newHistory = activeSubjectMessages.slice(0, index);
      }

      if (targetUserMessage) {
          setActiveSubjectMessages(newHistory);
          if (subjectServiceRef.current) {
              subjectServiceRef.current.startChatWithHistory(
                  newHistory.map(m => ({ role: m.role, content: m.content }))
              );
          }
          handleSubjectMessage(targetUserMessage);
      }
  };

  // --- NAVIGATION ---
  const navigateTo = (view: ViewState) => {
      setCurrentView(view);
      setIsSidebarOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      if (session.type === 'study-school' && session.subjectId) {
          setActiveSubjectId(session.subjectId);
          setActiveSubjectMessages(session.messages);
          setCurrentSubjectSessionId(session.id);
          setCurrentView('study-school');
          const subj = subjects.find(s => s.id === session.subjectId);
          if (subj) subjectServiceRef.current = new ChatService(subj.instruction || "");
      } else if (session.type === 'tutor' || session.type === 'language-tutor' || session.type === 'english-tutor') {
          const tId = session.tutorId || (session.type === 'tutor' ? 'chinese-default' : 'english-default');
          setActiveTutorId(tId);
          setActiveTutorMessages(session.messages);
          setCurrentTutorSessionId(session.id);
          setCurrentView('tutors');
          const t = tutors.find(tr => tr.id === tId);
          if (t) tutorServiceRef.current = new ChatService(t.instruction || "");
      } else if (session.type === 'chat') {
          setMessages(session.messages);
          setCurrentSessionId(session.id);
          setCurrentView('chat');
          if (mainChatServiceRef.current) {
              mainChatServiceRef.current.startChatWithHistory(
                  session.messages
                    .filter(m => m.id !== 'welcome')
                    .map(m => ({ role: m.role, content: m.content }))
              );
          }
      }
  };

  const shouldShowHeader = ['chat', 'history', 'settings'].includes(currentView) ||
                           (currentView === 'tutors' && !activeTutorId) ||
                           (currentView === 'study-school' && !activeSubjectId);

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black overflow-hidden font-sans">
        {/* Sidebar */}
        <AppSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            currentView={currentView as any}
            onNavigate={navigateTo as any}
        />

        <div className="flex-1 flex flex-col h-full relative">
            {/* Header */}
            {shouldShowHeader && (
                <Header 
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onNewChat={() => { setMessages([WELCOME_MESSAGE]); setCurrentSessionId(null); mainChatServiceRef.current = new ChatService(SYSTEM_INSTRUCTION); }}
                    onConfigureClick={() => setIsConfigureModalOpen(true)}
                    onShareClick={() => alert("Share feature coming soon!")}
                    onDictionaryClick={() => setIsDictionaryOpen(true)}
                    onQuizClick={() => { /* Optional: Navigate to Tutors? */ }}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                {currentView === 'tutors' && (
                    <TutorsPage 
                        messages={activeTutorMessages}
                        loadingState={loadingState}
                        activeTutorId={activeTutorId}
                        tutors={tutors}
                        onSelectTutor={handleSelectTutor} 
                        onStartTest={handleStartTutorTest}
                        onSendMessage={handleTutorMessage}
                        onBack={() => { setActiveTutorId(null); setActiveTutorMessages([]); }}
                        onStartLive={() => { 
                            const instr = tutors.find(t => t.id === activeTutorId)?.instruction || "You are a language tutor.";
                            const context = formatContext(activeTutorMessages);
                            setLiveInstruction(`${instr}${context}`); 
                            setIsLiveOpen(true); 
                        }}
                        language={language}
                        onBranchChat={handleBranchChat}
                        onConfigure={() => setIsConfigureModalOpen(true)}
                        onAddTutor={handleAddTutor}
                        onRegenerate={handleRegenerateTutor}
                        onDictionaryClick={() => setIsDictionaryOpen(true)}
                        onShareClick={() => alert("Sharing Tutor Chat...")}
                        
                        // Pass input persistence
                        inputValue={drafts['tutors'] || ''}
                        onInputChange={(val) => handleDraftChange(val)}
                    />
                )}

                {currentView === 'study-school' && (
                    <StudySchoolPage 
                        messages={activeSubjectMessages}
                        loadingState={loadingState}
                        activeSubject={activeSubjectId}
                        sessions={sessions}
                        customSubjects={subjects}
                        onAddSubject={(s) => setSubjects(prev => [...prev, s])}
                        onDeleteCustomSubject={(id) => setSubjects(prev => prev.filter(s => s.id !== id))}
                        onSelectSubject={handleSelectSubject} 
                        onSendMessage={handleSubjectMessage}
                        onBack={() => { setActiveSubjectId(null); setActiveSubjectMessages([]); }}
                        onLoadSession={handleLoadSession}
                        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); }}
                        onStartLive={() => { 
                            const instr = subjects.find(s => s.id === activeSubjectId)?.instruction || "You are a subject tutor.";
                            const context = formatContext(activeSubjectMessages);
                            setLiveInstruction(`${instr}${context}`); 
                            setIsLiveOpen(true); 
                        }}
                        language={language}
                        onRegenerate={handleRegenerateSubject}
                        onBranchChat={handleBranchChat}
                        onConfigure={() => setIsConfigureModalOpen(true)}
                        onDictionaryClick={() => setIsDictionaryOpen(true)}
                        onShareClick={() => alert("Sharing Class Chat...")}

                        // Pass input persistence
                        inputValue={drafts['study-school'] || ''}
                        onInputChange={(val) => handleDraftChange(val)}
                    />
                )}

                {currentView === 'notes' && (
                    <NotesPage 
                        language={language}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onAiAssist={async (action, content) => { return "AI response placeholder"; }} 
                    />
                )}

                {currentView === 'history' && (
                    <HistoryPage 
                        sessions={sessions}
                        onLoadSession={(id) => handleLoadSession(id)}
                        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); }}
                        onStartNewChat={() => setCurrentView('chat')}
                        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))}
                        onShareSession={() => {}}
                    />
                )}

                {currentView === 'settings' && (
                    <SettingsPage 
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        translateLanguage={translateLanguage}
                        onTranslateLanguageChange={setTranslateLanguage}
                        currentTheme={theme}
                        onThemeChange={setTheme}
                        onBack={() => setCurrentView('chat')}
                        playbackEnabled={playbackEnabled}
                        onPlaybackChange={setPlaybackEnabled}
                        micAccess={micAccess}
                        onMicAccessChange={setMicAccess}
                        onSignOut={() => {}}
                    />
                )}

                {currentView === 'chat' && (
                    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
                        <div className="flex-1 overflow-hidden relative">
                            <MessageList 
                                messages={messages}
                                loadingState={loadingState}
                                onEdit={handleEditMessage}
                                onRegenerate={handleRegenerateChat}
                                onReply={(text) => setReplyingToContent(text)}
                                language={language}
                                translateLanguage={translateLanguage}
                                playbackEnabled={playbackEnabled}
                                onBranchChat={handleBranchChat}
                            />
                        </div>
                        <div className="w-full px-4 pb-6 pt-2">
                            <ChatInput 
                                onSend={handleSendMessage}
                                isLoading={loadingState !== 'idle'}
                                onStartLive={() => { 
                                    const context = formatContext(messages);
                                    setLiveInstruction(`${SYSTEM_INSTRUCTION}${context}`); 
                                    setIsLiveOpen(true); 
                                }}
                                hardwareAccess={micAccess}
                                language={language}
                                onRequestMicAccess={() => setPermissionModalType('microphone')}
                                replyingTo={replyingToContent}
                                onCancelReply={() => setReplyingToContent(null)}
                                
                                // Pass input persistence
                                value={drafts['chat'] || ''}
                                onInputChange={(val) => handleDraftChange(val)}
                            />
                            <div className="text-center mt-2"><p className="text-xs text-gray-400">Pak Chat may display inaccurate info, so double-check its responses.</p></div>
                        </div>
                    </div>
                )}
            </main>

            {/* Overlays */}
            <DictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />
            <ConfigureChatModal isOpen={isConfigureModalOpen} onClose={() => setIsConfigureModalOpen(false)} config={chatConfig} onSave={setChatConfig} />
            <PermissionModal isOpen={!!permissionModalType} type={permissionModalType || 'microphone'} onClose={() => setPermissionModalType(null)} onConfirm={(p) => { if(p==='always') { if(permissionModalType==='microphone') { setMicAccess(true); localStorage.setItem('pakchat_mic_access', 'true'); } } else { if(permissionModalType==='microphone') setMicAccess(true); } setPermissionModalType(null); }} />
            
            {isLiveOpen && (
                <LiveSessionOverlay 
                    onClose={() => setIsLiveOpen(false)} 
                    language={language} 
                    systemInstruction={liveInstruction} 
                    micAccess={micAccess}
                />
            )}
        </div>
    </div>
  );
}

