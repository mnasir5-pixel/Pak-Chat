
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL } from "../constants";
import { CONFIG } from "./config";

// =========================================================================================
//  MULTI-PROVIDER SERVICE
//  Supports: Google Gemini, OpenAI, DeepSeek
// =========================================================================================

export class ChatService {
  private provider: string = 'gemini';
  
  // Gemini specific
  private geminiClient: GoogleGenAI | null = null;
  private geminiChat: Chat | null = null;
  private currentModel: string = GEMINI_MODEL;
  
  // OpenAI/DeepSeek specific
  private history: { role: string; content: string }[] = [];
  private systemInstruction: string;
  
  // Helper to track internal message history for fallback recreation
  private internalHistory: { role: 'user' | 'model', content: string }[] = [];

  constructor(systemInstruction: string) {
    this.systemInstruction = systemInstruction;
    this.provider = CONFIG.PROVIDER || 'gemini';

    // 1. Initialize Provider
    if (this.provider === 'gemini') {
      const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyCy-lvF9iGZ1SidX2_KsihkLRyB_U8Qp3o';
      if (key) {
        this.geminiClient = new GoogleGenAI({ apiKey: key });
        this.initGeminiSession();
      }
    } else {
      // For OpenAI/DeepSeek, we initialize the history with system instruction
      // Note: DeepSeek supports system messages same as OpenAI
      this.history = [{ role: 'system', content: systemInstruction }];
    }
  }

  // --- STATIC HELPER FOR TRANSLATION ---
  public static async translateText(text: string, targetLanguage: string): Promise<string> {
      const key = CONFIG.GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyCy-lvF9iGZ1SidX2_KsihkLRyB_U8Qp3o';
      // Translation always uses Gemini Flash for speed/cost, regardless of main provider
      if (!key) return text; 
      
      const ai = new GoogleGenAI({ apiKey: key });
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Translate the following text into ${targetLanguage}. Output ONLY the translation. Text: ${text}`
          });
          return response.text || text;
      } catch (e) {
          console.error("Translation API Error:", e);
          return text;
      }
  }

  private initGeminiSession(model: string = GEMINI_MODEL) {
    if (this.geminiClient) {
      this.currentModel = model;
      try {
        // Only add googleSearch tool if model supports it (not flash-image or imagen)
        const tools = (model.includes('flash-image') || model.includes('imagen')) ? undefined : [{ googleSearch: {} }];
        
        this.geminiChat = this.geminiClient.chats.create({
          model: model,
          config: { 
            systemInstruction: this.systemInstruction,
            tools: tools
          },
        });
      } catch (e) {
        console.warn(`Failed to init Gemini session with ${model}`, e);
      }
    }
  }

  // --- HISTORY MANAGEMENT ---
  public async startChatWithHistory(history: { role: 'user' | 'model', content: string }[]) {
    this.internalHistory = [...history];

    if (this.provider === 'gemini') {
      // Filter out messages with empty content to avoid API 400 errors
      // Also ensure role is valid
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
                systemInstruction: this.systemInstruction,
                tools: tools
              },
              history: formattedHistory
            });
        } catch (e) {
            console.error("Failed to restore history, starting fresh session", e);
            this.initGeminiSession();
        }
      }
    } else {
      // OpenAI / DeepSeek
      this.history = [{ role: 'system', content: this.systemInstruction }];
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

  // --- HELPER: FILE TO BASE64 ---
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

  // --- MAIN SEND METHOD ---
  async *sendMessageStream(message: string, attachment?: File): AsyncGenerator<string, void, unknown> {
    
    // -------------------------------------------------------
    // OPTION A: GEMINI (Native Multimodal)
    // -------------------------------------------------------
    if (this.provider === 'gemini') {
       const lowerMsg = message.toLowerCase();
       const isImageRequest = ['generate image', 'create image', 'draw'].some(k => lowerMsg.includes(k));
       
       // Image Generation Logic (Imagen 3)
       if (isImageRequest && !attachment && this.geminiClient) {
           try {
               yield "🎨 Generating image...\n\n";
               const response = await this.geminiClient.models.generateImages({
                   model: 'imagen-3.0-generate-001',
                   prompt: message,
                   config: { numberOfImages: 1, aspectRatio: '1:1' }
               });
               const base64 = response.generatedImages?.[0]?.image?.imageBytes;
               if (base64) {
                   yield `![Generated Image](data:image/jpeg;base64,${base64})\n\n`;
                   this.internalHistory.push({ role: 'user', content: message });
                   return;
               }
           } catch (e) {
               yield "*(Image generation failed, falling back to text...)*\n\n";
           }
       }

       // Standard Chat
       if (!this.geminiChat) this.initGeminiSession();
       
       if (!this.geminiChat) {
           throw new Error("Gemini Chat failed to initialize. Please check your API Key in services/config.ts");
       }

       let msgParam: any = message;
       if (attachment) {
         const part = await this.fileToPart(attachment);
         msgParam = [message, part];
       }

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

         // Sources
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

       } catch (error) {
         console.error("Gemini Error:", error);
         yield "Error: Unable to connect to Gemini. Please check API Key.";
       }
    } 
    
    // -------------------------------------------------------
    // OPTION B: OPENAI / DEEPSEEK
    // -------------------------------------------------------
    else {
      let apiKey = "";
      let baseUrl = "";
      let model = "";

      if (this.provider === 'deepseek') {
          apiKey = CONFIG.DEEPSEEK_API_KEY;
          baseUrl = "https://api.deepseek.com/chat/completions";
          model = "deepseek-chat";
      } else {
          apiKey = CONFIG.OPENAI_API_KEY;
          baseUrl = "https://api.openai.com/v1/chat/completions";
          model = "gpt-4o";
      }

      if (!apiKey) throw new Error(`${this.provider.toUpperCase()} API Key is missing in services/config.ts`);

      const userMsg: any = { role: 'user', content: message };
      
      // OpenAI Vision support (DeepSeek currently text-only for images usually, but we'll try standard format)
      if (attachment && this.provider === 'openai') {
        const reader = new FileReader();
        const base64Url = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(attachment);
        });
        userMsg.content = [
          { type: "text", text: message },
          { type: "image_url", image_url: { url: base64Url } }
        ];
      } else if (attachment && this.provider === 'deepseek') {
          yield "[System Note: File attachments are currently optimized for Gemini/OpenAI. Sending text prompt only...]\n\n";
      }

      this.history.push(userMsg);

      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: this.history,
            stream: true,
            temperature: 0.7
          })
        });

        if (!response.ok) {
           const err = await response.text();
           throw new Error(`${this.provider.toUpperCase()} API Error: ${err}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullResponseText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;
              try {
                const json = JSON.parse(jsonStr);
                const content = json.choices[0]?.delta?.content || "";
                if (content) {
                  fullResponseText += content;
                  yield content;
                }
              } catch (e) {
                // ignore parse errors for partial chunks
              }
            }
          }
        }

        this.history.push({ role: 'assistant', content: fullResponseText });

      } catch (error: any) {
        console.error(`${this.provider} Error:`, error);
        yield `Error connecting to ${this.provider}: ${error.message}`;
      }
    }
  }
}
