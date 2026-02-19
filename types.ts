export type Role = 'user' | 'model';

export interface User {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  createdAt: number;
  verified: boolean;
  isBlocked?: boolean;
}

export interface TrashItem {
  id: string;
  type: 'session' | 'notebook' | 'note' | 'project' | 'subject' | 'tutor';
  title: string;
  deletedAt: number;
  originalData: any;
}

export interface AudioNote {
  id: string;
  url: string; 
  label: string;
  timestamp: number;
  isPlayed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isProcessing?: boolean; 
  processingLabel?: string;
  isError?: boolean;
  attachmentUrl?: string;
  attachmentType?: string; 
  attachmentName?: string;
  audioNotes?: AudioNote[]; 
  hints?: string[];
}

export interface ChatConfig {
  style: 'default' | 'learning' | 'custom';
  length: 'default' | 'short' | 'long';
  // Fixed: Added 'agent' to mode union type
  mode: 'teacher' | 'assistant' | 'agent';
}

export interface Project {
  id: string;
  name: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  tag?: string;
  timestamp: number;
}

// Added missing Source interface
export interface Source {
  id: string;
  name: string;
  // Fix: Added 'video' to the union type to resolve assignment error in NasherNotesPage
  type: 'pdf' | 'doc' | 'url' | 'youtube' | 'text' | 'image' | 'audio' | 'video';
  content?: string;
  timestamp: number;
  selected: boolean;
}

// Added missing Asset interface
export interface Asset {
  id: string;
  type: 'report' | 'flashcards' | 'infographic' | 'quiz' | 'guide' | 'slides' | 'audio' | 'video' | 'mindmap';
  name: string;
  status: 'processing' | 'ready' | 'error';
  content?: string;
  timestamp: number;
  config?: {
    language?: string;
    level?: string;
    detail?: string;
  };
}

export interface ChatSession {
  id: string;
  userEmail: string; 
  // Fixed: Added 'voice-chat' and other missing session types to support the navigation hub logic
  type: 'chat' | 'tutor' | 'study-school' | 'notes-lm' | 'resource-hub' | 'project' | 'voice-chat' | 'english-tutor' | 'language-tutor';
  title: string;
  projectId?: string;
  subjectId?: string;
  tutorId?: string;
  messages: ChatMessage[];
  timestamp: number;
  config?: ChatConfig;
  // Added optional sources and assets to session
  sources?: Source[];
  assets?: Asset[];
}

export interface StudySubject {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
    type: 'agent' | 'assistant';
    language: string;
    isCustom?: boolean;
    isAssessmentCompleted?: boolean;
    // Added missing instruction and agentName
    instruction?: string;
    agentName?: string;
}

export interface Tutor {
    id: string;
    name: string;
    targetLanguage: string;
    icon: string;
    color: string;
    description?: string;
    role: 'agent' | 'assistant';
    experience?: string;
    proficiency?: string;
    isCustom?: boolean;
    isAssessmentCompleted?: boolean;
    // Added missing instruction property
    instruction?: string;
}

// Added missing SavedWord interface
export interface SavedWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  urdu_meaning?: string;
  timestamp: number;
}

// Added missing StudioItem interface
export interface StudioItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  url: string;
  timestamp: number;
}

export type LoadingState = 'idle' | 'loading' | 'streaming';