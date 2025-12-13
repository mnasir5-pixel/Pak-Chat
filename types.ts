

export type Role = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  attachmentUrl?: string;
  attachmentType?: string; // 'image', 'pdf', 'text', 'audio', etc.
  attachmentName?: string;
}

export interface ChatSession {
  id: string;
  type: 'chat' | 'tutor' | 'english-tutor' | 'study-school';
  title: string;
  subjectId?: string; // Specific for Study School (e.g., 'Math', 'Science')
  messages: ChatMessage[];
  timestamp: number;
}

export type LoadingState = 'idle' | 'loading' | 'streaming';

export interface ChatConfig {
  style: 'default' | 'learning' | 'custom';
  length: 'default' | 'short' | 'long';
  temperature?: number;
  topK?: number;
  topP?: number;
}