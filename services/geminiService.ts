import { GoogleGenAI, Chat, GenerateContentResponse, Part, Modality } from "@google/genai";
import { GEMINI_MODEL, getSystemInstructionFromConfig } from "../constants";
import { CONFIG } from "./config";
import { ChatConfig } from "../types";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

export class ChatService {
  private provider: string = 'gemini';
  private geminiClient: GoogleGenAI | null = null;
  private geminiChat: Chat | null = null;
  private currentModel: string = GEMINI_MODEL;
  private history: { role: string; content: string }[] = [];
  private baseSystemInstruction: string;
  private activeConfig: ChatConfig = { style: 'default', length: 'default' };
  private internalHistory: { role: 'user' | 'model', content: string }[] = [];

  constructor(systemInstruction: string, config?: ChatConfig) {
    this.baseSystemInstruction = systemInstruction;
    if (config) this.activeConfig = config;
    this.provider = CONFIG.PROVIDER || 'gemini';

    if (this.provider === 'gemini') {
      const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
      if (key) {
        this.geminiClient = new GoogleGenAI({ apiKey: key });
        this.initGeminiSession();
      }
    } else {
      this.history = [{ role: 'system', content: this.getEffectiveInstruction() }];
    }
  }

  private getEffectiveInstruction(): string {
    return getSystemInstructionFromConfig(this.baseSystemInstruction, this.activeConfig);
  }

  public updateConfig(newConfig: ChatConfig) {
    this.activeConfig = newConfig;
    if (this.provider === 'gemini' && this.geminiClient) {
        this.startChatWithHistory(this.internalHistory);
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseGeminiError(error: any): string {
    const errorStr = error?.message || String(error);
    if (errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
      return "⚠️ **Neural Capacity Exceeded**: Your current API key has reached its quota limit. Please use your own paid Google API key to continue without restrictions.";
    }
    if (errorStr.includes('401') || errorStr.includes('API_KEY_INVALID')) {
      return "❌ **Invalid API Key**: Please check your API key in settings or select a new one.";
    }
    if (errorStr.includes('Requested entity was not found')) {
      return "❌ **Session Error**: The specific model or project configuration could not be accessed. Please re-select your API key.";
    }
    return `Error: ${errorStr}`;
  }

  public static async translateText(text: string, targetLanguage: string): Promise<string> {
      const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!key) return text; 
      const ai = new GoogleGenAI({ apiKey: key });
      let delay = INITIAL_RETRY_DELAY;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Translate the following text into ${targetLanguage}. Output ONLY the translation. Text: ${text}`
          });
          return response.text || text;
        } catch (e: any) {
          if ((e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) && i < MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          throw e; // Propagate for UI handling
        }
      }
      return text;
  }

  public static async improveText(text: string): Promise<string> {
    const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!key || !text.trim()) return text;
    const ai = new GoogleGenAI({ apiKey: key });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a professional editor. Improve grammar and clarity. Text: "${text}"`,
      });
      return response.text?.trim() || text;
    } catch (e) {
      throw e;
    }
  }

  private initGeminiSession(model: string = GEMINI_MODEL) {
    const useModel = model || 'gemini-3-flash-preview'; 
    if (this.geminiClient) {
      this.currentModel = useModel;
      try {
        const tools = (useModel.includes('flash-image') || useModel.includes('imagen')) ? undefined : [{ googleSearch: {} }];
        this.geminiChat = this.geminiClient.chats.create({
          model: useModel,
          config: { 
            systemInstruction: this.getEffectiveInstruction(),
            tools: tools
          },
        });
      } catch (e) {
        console.warn(`Failed to init Gemini session`, e);
      }
    }
  }

  public async generateSpeech(text: string, voice: string = 'Kore'): Promise<string> {
    const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey: key });
    
    let delay = INITIAL_RETRY_DELAY;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Failed to generate speech");
        return base64Audio;
      } catch (e: any) {
        if ((e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) && i < MAX_RETRIES - 1) {
          await this.sleep(delay); delay *= 2; continue;
        }
        throw e;
      }
    }
    throw new Error("Speech failed");
  }

  public async startChatWithHistory(history: { role: 'user' | 'model', content: string }[]) {
    this.internalHistory = [...history];
    const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey: key });

    if (this.provider === 'gemini') {
      const formattedHistory = history
        .filter(msg => msg.content && msg.content.trim().length > 0)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
      
      const tools = (this.currentModel.includes('flash-image') || this.currentModel.includes('imagen')) ? undefined : [{ googleSearch: {} }];
      try {
          this.geminiChat = ai.chats.create({
            model: this.currentModel,
            config: { systemInstruction: this.getEffectiveInstruction(), tools: tools },
            history: formattedHistory as any
          });
      } catch (e) { 
          this.initGeminiSession('gemini-3-flash-preview'); 
      }
    }
  }

  async *sendMessageStream(message: string, attachment?: File): AsyncGenerator<string, void, unknown> {
    if (this.provider === 'gemini') {
       if (!this.geminiChat) this.initGeminiSession();
       if (!this.geminiChat) { yield "❌ **Error**: Session not initialized."; return; }
       let msgParam: any = message;
       if (attachment) {
         const part = await this.fileToPart(attachment);
         msgParam = [message, part];
       }
       let delay = INITIAL_RETRY_DELAY;
       for (let i = 0; i < MAX_RETRIES; i++) {
         try {
           const resultStream = await this.geminiChat.sendMessageStream({ message: msgParam });
           let collectedGroundingMetadata: any = null;
           for await (const chunk of resultStream) {
             const text = (chunk as GenerateContentResponse).text;
             if (text) yield text;
             if (chunk.candidates?.[0]?.groundingMetadata) collectedGroundingMetadata = chunk.candidates[0].groundingMetadata;
           }
           if (collectedGroundingMetadata?.groundingChunks) {
              const chunks = collectedGroundingMetadata.groundingChunks;
              const uniqueSources = new Map<string, string>();
              chunks.forEach((c: any) => { if (c.web?.uri && c.web?.title) uniqueSources.set(c.web.uri, c.web.title); });
              const sources = Array.from(uniqueSources.entries()).map(([uri, title]) => `[${title}](${uri})`);
              if (sources.length > 0) yield "\n\n**Sources:**\n" + sources.slice(0, 5).map(s => `- ${s}`).join('\n');
           }
           this.internalHistory.push({ role: 'user', content: message });
           return;
         } catch (error: any) {
           if ((error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) && i < MAX_RETRIES - 1) {
             yield `⚠️ **Capacity Warning**: Retrying transmission in ${delay / 1000}s...`;
             await this.sleep(delay); delay *= 2; continue;
           }
           throw error;
         }
       }
    }
  }

  private async fileToPart(file: File): Promise<Part> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Content = (reader.result as string).split(',')[1];
        resolve({ inlineData: { data: base64Content, mimeType: file.type } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
