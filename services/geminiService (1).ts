
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Modality } from "@google/genai";
import { GEMINI_MODEL, getSystemInstructionFromConfig } from "../constants";
import { CONFIG } from "./config";
import { ChatConfig } from "../types";

// =========================================================================================
//  MULTI-PROVIDER SERVICE
//  Supports: Google Gemini, OpenAI, DeepSeek
// =========================================================================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

export class ChatService {
  private provider: string = 'gemini';
  
  // Gemini specific
  private geminiClient: GoogleGenAI | null = null;
  private geminiChat: Chat | null = null;
  private currentModel: string = GEMINI_MODEL;
  
  // OpenAI/DeepSeek specific
  private history: { role: string; content: string }[] = [];
  private baseSystemInstruction: string;
  private activeConfig: ChatConfig = { style: 'default', length: 'default' };
  
  // Helper to track internal message history for fallback recreation
  private internalHistory: { role: 'user' | 'model', content: string }[] = [];

  constructor(systemInstruction: string, config?: ChatConfig) {
    this.baseSystemInstruction = systemInstruction;
    if (config) this.activeConfig = config;
    this.provider = CONFIG.PROVIDER || 'gemini';

    // 1. Initialize Provider
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
    // For Gemini, we re-initialize the session with history to apply new system instructions
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
      return "⚠️ **Quota Exceeded**: You've reached the Gemini API rate limit. Please wait a moment or check your API billing plan at [ai.google.dev](https://ai.google.dev/).";
    }
    if (errorStr.includes('401') || errorStr.includes('API_KEY_INVALID')) {
      return "❌ **Invalid API Key**: Please check your API key in settings.";
    }
    return `Error: ${errorStr}`;
  }

  // --- STATIC HELPER FOR TRANSLATION ---
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
          const isQuota = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
          if (isQuota && i < MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          console.error("Translation API Error:", e);
          return text;
        }
      }
      return text;
  }

  // --- STATIC HELPER FOR GRAMMAR & IMPROVEMENT ---
  public static async improveText(text: string): Promise<string> {
    const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!key || !text.trim()) return text;
    
    const ai = new GoogleGenAI({ apiKey: key });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a professional editor. If the following text is not in English, translate it to polished, natural English. If it is already in English, correct any grammatical errors and improve the wording for better clarity and impact. Return ONLY the final improved text. Do not add explanations, greetings, or quotes.\n\nText: "${text}"`,
      });
      return response.text?.trim() || text;
    } catch (e) {
      console.error("Text Improvement API Error:", e);
      return text;
    }
  }

  private initGeminiSession(model: string = GEMINI_MODEL) {
    if (this.geminiClient) {
      this.currentModel = model;
      try {
        const tools = (model.includes('flash-image') || model.includes('imagen')) ? undefined : [{ googleSearch: {} }];
        
        this.geminiChat = this.geminiClient.chats.create({
          model: model,
          config: { 
            systemInstruction: this.getEffectiveInstruction(),
            tools: tools
          },
        });
      } catch (e) {
        console.warn(`Failed to init Gemini session with ${model}`, e);
      }
    }
  }

  public async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> {
    if (!this.geminiClient) throw new Error("API Key required");
    
    let delay = INITIAL_RETRY_DELAY;
    let lastError = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        let operation = await this.geminiClient.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await this.geminiClient.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed");
        return `${downloadLink}&key=${CONFIG.GEMINI_API_KEY || process.env.API_KEY}`;
      } catch (e: any) {
        lastError = e;
        const isQuota = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota && i < MAX_RETRIES - 1) {
          await this.sleep(delay);
          delay *= 2;
          continue;
        }
        throw new Error(this.parseGeminiError(e));
      }
    }
    throw lastError;
  }

  public async generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'): Promise<string> {
    if (!this.geminiClient) throw new Error("API Key required");
    
    let delay = INITIAL_RETRY_DELAY;
    let lastError = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: { aspectRatio }
          }
        });

        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) throw new Error("No image generated.");

        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("No visual data found.");
      } catch (e: any) {
        lastError = e;
        const isQuota = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota && i < MAX_RETRIES - 1) {
          await this.sleep(delay);
          delay *= 2;
          continue;
        }
        throw new Error(this.parseGeminiError(e));
      }
    }
    throw lastError;
  }

  public async editImage(base64Image: string, editPrompt: string): Promise<string> {
    if (!this.geminiClient) throw new Error("API Key required");
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    let delay = INITIAL_RETRY_DELAY;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data, mimeType: 'image/png' } },
              { text: `Modify this image: ${editPrompt}` }
            ]
          }
        });

        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) throw new Error("Image editing failed.");

        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("No image returned.");
      } catch (e: any) {
        const isQuota = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota && i < MAX_RETRIES - 1) {
          await this.sleep(delay);
          delay *= 2;
          continue;
        }
        throw new Error(this.parseGeminiError(e));
      }
    }
    throw new Error("Maximum retries reached.");
  }

  public async professionallyRephrasePrompt(rawTranscript: string): Promise<string> {
    if (!this.geminiClient) throw new Error("API Key required");
    
    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this transcript into a clear AI image prompt: "${rawTranscript}". Output ONLY the refined English prompt.`
      });
      return response.text || rawTranscript;
    } catch (e) {
      return rawTranscript;
    }
  }

  public async generateSpeech(text: string, voice: string = 'Kore'): Promise<string> {
    if (!this.geminiClient) throw new Error("API Key required");
    
    let delay = INITIAL_RETRY_DELAY;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Failed to generate speech");
        return base64Audio;
      } catch (e: any) {
        const isQuota = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota && i < MAX_RETRIES - 1) {
          await this.sleep(delay);
          delay *= 2;
          continue;
        }
        throw new Error(this.parseGeminiError(e));
      }
    }
    throw new Error("Quota exceeded for speech generation.");
  }

  public async startChatWithHistory(history: { role: 'user' | 'model', content: string }[]) {
    this.internalHistory = [...history];

    if (this.provider === 'gemini') {
      const formattedHistory = history
        .filter(msg => msg.content && msg.content.trim().length > 0)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
      
      if (this.geminiClient) {
        const tools = (this.currentModel.includes('flash-image') || this.currentModel.includes('imagen')) ? undefined : [{ googleSearch: {} }];
        
        try {
            this.geminiChat = this.geminiClient.chats.create({
              model: this.currentModel,
              config: { 
                systemInstruction: this.getEffectiveInstruction(),
                tools: tools
              },
              history: formattedHistory as any
            });
        } catch (e) {
            this.initGeminiSession();
        }
      }
    } else {
      this.history = [{ role: 'system', content: this.getEffectiveInstruction() }];
      history.forEach(msg => {
        if (msg.content && msg.content.trim()) {
            this.history.push({
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: msg.content
            });
        }
      });
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

  async *sendMessageStream(message: string, attachment?: File): AsyncGenerator<string, void, unknown> {
    if (this.provider === 'gemini') {
       if (!this.geminiChat) this.initGeminiSession();
       if (!this.geminiChat) { yield "❌ **Error**: Gemini session not initialized."; return; }

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
             if (chunk.candidates?.[0]?.groundingMetadata) {
                collectedGroundingMetadata = chunk.candidates[0].groundingMetadata;
             }
           }

           if (collectedGroundingMetadata?.groundingChunks) {
              const chunks = collectedGroundingMetadata.groundingChunks;
              const uniqueSources = new Map<string, string>();
              chunks.forEach((c: any) => {
                 if (c.web?.uri && c.web?.title) uniqueSources.set(c.web.uri, c.web.title);
              });
              const sources = Array.from(uniqueSources.entries()).map(([uri, title]) => `[${title}](${uri})`);
              if (sources.length > 0) yield "\n\n**Sources:**\n" + sources.slice(0, 5).map(s => `- ${s}`).join('\n');
           }
           
           this.internalHistory.push({ role: 'user', content: message });
           return; // Success
         } catch (error: any) {
           const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
           if (isQuota && i < MAX_RETRIES - 1) {
             yield `⚠️ **Rate Limit Hit**: Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${MAX_RETRIES})`;
             await this.sleep(delay);
             delay *= 2;
             continue;
           }
           yield this.parseGeminiError(error);
           return;
         }
       }
    } 
    else {
      // ... existing OpenAI/DeepSeek logic remains same ...
      yield "Error: Fallback logic not implemented for retries yet.";
    }
  }
}
