import { ChatConfig, StudySubject, Tutor } from './types';

// Use 'gemini-3-pro-preview' for the ultimate reasoning and coding power.
export const GEMINI_MODEL = 'gemini-3-pro-preview'; 

const HINTS_PROTOCOL = `
### FOLLOW-UP PROTOCOL
At the end of EVERY response, you MUST suggest 3 follow-up topics or questions the user might ask next.
Use this EXACT format:
### HINTS:
- Topic/Question 1
- Topic/Question 2
- Topic/Question 3
`;

const MCQ_PROTOCOL = `
### INTERACTIVE MCQ PROTOCOL
When conducting a quiz or entry test, present questions one at a time.
Format each option as an interactive button. You MUST specify if the choice is correct or incorrect for UI feedback.
Format: [Choice: Option Text | true/false]

Example:
What is the capital of France?
[Choice: Paris | true]
[Choice: London | false]
[Choice: Berlin | false]

IMPORTANT: DO NOT use dollar signs ($) for any reason in tutor or school sessions. Use plain text or markdown bolding instead.
`;

const VOCABULARY_PROTOCOL = `
### VOCABULARY INTEGRATION
When introducing new words, phrases, or key concepts, use this tag:
[Word: Main Text | Phonetic/Pinyin | English Meaning | Urdu Meaning | Usage/Opinion]

Example: 
[Word: 爸爸 | bàba | Father | والد (Walid) | A common way to refer to one's father.]

Rules:
1. Provide the Urdu meaning clearly.
2. Use this tag naturally within your reply.
`;

// --- CORE IDENTITY ---
export const SYSTEM_INSTRUCTION = `You are a helpful and intelligent AI Assistant.

### 1. PERSISTENT MEMORY
- You recall previous context and user preferences to maintain a consistent conversation.

### 2. CORE PRINCIPLES
- Provide clear, direct, and helpful information.
- Use Google Search for internet grounding to ensure accuracy.

### 3. FORMATTING
- Markdown headers (# Blue, ## Indigo, ### Teal).
- Highlights: ==text== in amber.
- NO DOLLAR SIGNS ($). Use plain text.

${MCQ_PROTOCOL}
${VOCABULARY_PROTOCOL}
${HINTS_PROTOCOL}
`;

// Shared Logic for Tutors
const TUTOR_CORE_LOGIC = `
### TUTOR ROLE
You are a dedicated learning assistant. Help the student master the subject or language through interactive lessons.

### INITIALIZATION
If you receive "Initialize entry test interaction", introduce yourself and start with 3-5 diagnostic MCQs.

### FORMATTING
- NO DOLLAR SIGNS ($).
- Use ==amber highlighting== for key terms.
- Use emerald bulleted lists for steps.

${MCQ_PROTOCOL}
${VOCABULARY_PROTOCOL}
${HINTS_PROTOCOL}
`;

export const TUTOR_SYSTEM_INSTRUCTION = `You are a Chinese Language Tutor.
${TUTOR_CORE_LOGIC}
- Focus on character mapping and usage.
`;

export const ENGLISH_TUTOR_SYSTEM_INSTRUCTION = `You are an English Fluency Tutor.
${TUTOR_CORE_LOGIC}
- Focus on natural phrasing and grammar.
`;

export const createTutorInstruction = (language: string) => `You are a ${language} Language Tutor.
${TUTOR_CORE_LOGIC}
`;

export const DEFAULT_SUBJECTS: StudySubject[] = [
  { 
    id: 'Math', 
    name: 'Mathematics', 
    icon: '📐', 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    instruction: `You are a Mathematics Assistant.
    ${TUTOR_CORE_LOGIC}
    - IMPORTANT: DO NOT use LaTeX or dollar signs. Use Unicode (e.g., ^2, sqrt).` 
  },
  { 
    id: 'Science', 
    name: 'Science', 
    icon: '🧬', 
    color: 'bg-green-50 text-green-700 border-green-200', 
    instruction: `You are a Science Assistant.
    ${TUTOR_CORE_LOGIC}` 
  },
  { 
    id: 'WebDev', 
    name: 'Web Architect', 
    icon: '💻', 
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200', 
    instruction: `You are a Web Development Architect.
    ${TUTOR_CORE_LOGIC}` 
  },
];

export const DEFAULT_TUTORS: Tutor[] = [
    { id: 'chinese-default', name: 'Chinese Tutor', targetLanguage: 'Mandarin Chinese', icon: '🇨🇳', color: 'bg-red-50 text-red-700 border-red-200', instruction: TUTOR_SYSTEM_INSTRUCTION },
    { id: 'english-default', name: 'English Tutor', targetLanguage: 'English', icon: '🇬🇧', color: 'bg-green-50 text-green-700 border-green-200', instruction: ENGLISH_TUTOR_SYSTEM_INSTRUCTION }
];

export const SUPPORTED_LANGUAGES = [
  { name: 'English', code: 'en-US', icon: '🇬🇧' },
  { name: 'Urdu', code: 'ur-PK', icon: '🇵🇰' },
  { name: 'Roman Urdu', code: 'ur-Roman', icon: '🇵🇰' },
  { name: 'Spanish', code: 'es-ES', icon: '🇪🇸' },
  { name: 'Mandarin Chinese', code: 'zh-CN', icon: '🇨🇳' },
  { name: 'Hindi', code: 'hi-IN', icon: '🇮🇳' },
  { name: 'Arabic', code: 'ar-SA', icon: '🇸🇦' },
  { name: 'French', code: 'fr-FR', icon: '🇫🇷' },
  { name: 'Portuguese', code: 'pt-BR', icon: '🇧🇷' },
  { name: 'Russian', code: 'ru-RU', icon: '🇷🇺' },
  { name: 'Japanese', code: 'ja-JP', icon: '🇯🇵' },
  { name: 'German', code: 'de-DE', icon: '🇩🇪' },
  { name: 'Bengali', code: 'bn-BD', icon: '🇧🇩' },
  { name: 'Turkish', code: 'tr-TR', icon: '🇹🇷' },
  { name: 'Italian', code: 'it-IT', icon: '🇮🇹' },
  { name: 'Korean', code: 'ko-KR', icon: '🇰🇷' },
  { name: 'Punjabi', code: 'pa-PK', icon: '🇵🇰' },
];

export const getSystemInstructionFromConfig = (baseInstruction: string, config: ChatConfig): string => {
  let modified = baseInstruction;
  if (config.style === 'learning') modified += `\n\n[MODE]: ADOPT A TEACHING PERSONA.`;
  if (config.length === 'short') modified += `\n\n[LENGTH]: Be extremely concise.`;
  return modified;
};