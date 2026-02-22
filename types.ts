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

export interface AudioNote {
  id: string;
  url: string; // This stores the base64 raw PCM string or blob URL
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

export interface Asset {
  id: string;
  type: 'report' | 'flashcards' | 'guide' | 'quiz' | 'infographic' | 'slides' | 'audio' | 'video' | 'mindmap' | 'idea';
  name: string;
  status: 'processing' | 'ready';
  timestamp: number;
  content?: string;
  config?: {
    language?: string;
    level?: string;
    detail?: string;
    count?: string;
  };
}

export interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'url' | 'youtube' | 'text' | 'image' | 'audio' | 'video';
  content?: string;
  timestamp: number;
  selected: boolean;
}

export interface ChatConfig {
  style: 'default' | 'learning' | 'custom';
  length: 'default' | 'short' | 'long';
}

export interface Project {
  id: string;
  name: string;
  tag?: string;
  timestamp: number;
}

export interface ModuleProgress {
  testCompleted: boolean;
  proficiencyLevel?: string;
  completedLessons: string[];
  lastCheckpoint?: string;
  timestamp: number;
}

export interface UserProgress {
  [moduleId: string]: ModuleProgress;
}

export interface ChatSession {
  id: string;
  userEmail: string; 
  type: 'chat' | 'tutor' | 'english-tutor' | 'study-school' | 'language-tutor' | 'voice-chat' | 'notes-lm' | 'resource-hub' | 'general-notes';
  title: string;
  projectId?: string;
  subjectId?: string;
  tutorId?: string;
  messages: ChatMessage[];
  timestamp: number;
  createdAt?: number;
  config?: ChatConfig;
  language?: string;
  sources?: Source[];
  assets?: Asset[];
}

export type LoadingState = 'idle' | 'loading' | 'streaming';

export interface StudySubject {
    id: string;
    name: string;
    icon: string;
    color: string;
    instruction?: string;
    isCustom?: boolean;
    type?: 'agent' | 'assistant';
    agentName?: string;
    description?: string;
    language?: string;
    config?: ChatConfig;
    priority?: 'High' | 'Medium' | 'Low';
}

export interface Tutor {
    id: string;
    name: string;
    targetLanguage: string;
    icon: string;
    color: string;
    instruction?: string;
    isCustom?: boolean;
    description?: string;
    role?: 'agent' | 'assistant';
    language?: string;
    config?: ChatConfig;
    priority?: 'High' | 'Medium' | 'Low';
}

export interface StudioItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  url: string;
  timestamp: number;
}

export interface SavedWord {
    hanzi: string;
    pinyin: string;
    meaning: string;
    urdu_meaning?: string;
    timestamp: number;
}