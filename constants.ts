
import { ChatConfig, StudySubject, Tutor } from './types';

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

const MINDMAP_PROTOCOL = `
### MIND MAP PROTOCOL
If the user asks for a mind map or visualization, you MUST output a JSON code block with the language identifier "json:mindmap".
Structure: {"topic": "Main", "branches": [{"topic": "Subtopic", "branches": []}]}
`;

const MCQ_PROTOCOL = `
### MCQ PROTOCOL
Format choices as: [Choice: Option Text | true/false]
`;

const SYMBOL_RESTRICTION = `
### CRITICAL SYMBOL RESTRICTION
1. NEVER use dollar signs ($). Use plain text.
2. For powers like i^25, write it exactly as: "i^25".
`;

export const SYSTEM_INSTRUCTION = `You are a helpful AI Assistant.
${SYMBOL_RESTRICTION}
${MINDMAP_PROTOCOL}
${MCQ_PROTOCOL}
${HINTS_PROTOCOL}
`;

export const createTutorInstruction = (language: string) => `You are a ${language} Language Tutor.
${SYSTEM_INSTRUCTION}
`;

// Fix: Added missing 'type' and 'language' properties required by StudySubject interface
export const DEFAULT_SUBJECTS: StudySubject[] = [
  { id: 'Math', name: 'Mathematics', icon: '📐', color: 'bg-blue-50 text-blue-700 border-blue-200', instruction: `You are a Mathematics Assistant.`, type: 'assistant', language: 'English' },
  { id: 'Science', name: 'Science', icon: '🧬', color: 'bg-green-50 text-green-700 border-green-200', instruction: `You are a Science Assistant.`, type: 'assistant', language: 'English' }
];

// Fix: Added missing 'role' property required by Tutor interface
export const DEFAULT_TUTORS: Tutor[] = [
    { id: 'chinese-default', name: 'Chinese Tutor', targetLanguage: 'Mandarin Chinese', icon: '🇨🇳', color: 'bg-red-50 text-red-700 border-red-200', instruction: createTutorInstruction('Mandarin Chinese'), role: 'agent' },
    { id: 'english-default', name: 'English Tutor', targetLanguage: 'English', icon: '🇬🇧', color: 'bg-green-50 text-green-700 border-green-200', instruction: createTutorInstruction('English'), role: 'agent' }
];

export const SUPPORTED_LANGUAGES = [
  { name: 'English', code: 'en-US', icon: '🇬🇧' },
  { name: 'Urdu', code: 'ur-PK', icon: '🇵🇰' },
  { name: 'Roman Urdu', code: 'ur-Roman', icon: '🇵🇰' },
  { name: 'Arabic', code: 'ar-SA', icon: '🇸🇦' },
  { name: 'French', code: 'fr-FR', icon: '🇫🇷' },
  { name: 'German', code: 'de-DE', icon: '🇩🇪' },
  { name: 'Spanish', code: 'es-ES', icon: '🇪🇸' },
  { name: 'Portuguese', code: 'pt-BR', icon: '🇧🇷' },
  { name: 'Italian', code: 'it-IT', icon: '🇮🇹' },
  { name: 'Japanese', code: 'ja-JP', icon: '🇯🇵' },
  { name: 'Korean', code: 'ko-KR', icon: '🇰🇷' },
  { name: 'Russian', code: 'ru-RU', icon: '🇷🇺' },
  { name: 'Turkish', code: 'tr-TR', icon: '🇹🇷' },
  { name: 'Hindi', code: 'hi-IN', icon: '🇮🇳' },
  { name: 'Persian', code: 'fa-IR', icon: '🇮🇷' },
  { name: 'Mandarin Chinese', code: 'zh-CN', icon: '🇨🇳' },
  { name: 'Bengali', code: 'bn-BD', icon: '🇧🇩' },
  { name: 'Indonesian', code: 'id-ID', icon: '🇮🇩' },
  { name: 'Thai', code: 'th-TH', icon: '🇹🇭' },
  { name: 'Vietnamese', code: 'vi-VN', icon: '🇻🇳' },
  { name: 'Polish', code: 'pl-PL', icon: '🇵🇱' },
  { name: 'Dutch', code: 'nl-NL', icon: '🇳🇱' },
  { name: 'Swedish', code: 'sv-SE', icon: '🇸🇪' },
  { name: 'Greek', code: 'el-GR', icon: '🇬🇷' },
  { name: 'Hebrew', code: 'he-IL', icon: '🇮🇱' },
  { name: 'Swahili', code: 'sw-KE', icon: '🇰🇪' },
];

export const getSystemInstructionFromConfig = (baseInstruction: string, config: ChatConfig): string => {
  let modified = baseInstruction;
  if (config.style === 'learning') modified += `\n\n[MODE]: TEACHING PERSONA.`;
  if (config.length === 'short') modified += `\n\n[LENGTH]: Concise.`;
  return modified;
};
