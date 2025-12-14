
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL } from "../constants";
import { CONFIG } from "./config";

export class ChatService {
  private provider: string = "gemini";

  // Gemini
  private geminiClient: GoogleGenAI | null = null;
  private geminiChat: Chat | null = null;
  private currentModel: string = GEMINI_MODEL;

  // Other providers
  private history: { role: string; content: string }[] = [];
  private systemInstruction: string;

  private internalHistory: { role: "user" | "model"; content: string }[] = [];

  constructor(systemInstruction: string) {
    this.systemInstruction = systemInstruction;
    this.provider = CONFIG.PROVIDER || "gemini";

    // ✅ GEMINI INIT (ONLY ONCE)
    if (this.provider === "gemini") {
      const key = CONFIG.GEMINI_API_KEY;

      if (!key) {
        throw new Error("❌ Gemini API key missing. Check .env.local");
      }

      this.geminiClient = new GoogleGenAI({ apiKey: key });
      this.initGeminiSession();
    } else {
      this.history = [{ role: "system", content: systemInstruction }];
    }
  }

  // ================== TRANSLATION ==================
  static async translateText(text: string, targetLanguage: string): Promise<string> {
    const key = CONFIG.GEMINI_API_KEY;
    if (!key) return text;

    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Translate into ${targetLanguage}. Only output translation:\n${text}`,
      });
      return res.text || text;
    } catch (e) {
      console.error("Translation error:", e);
      return text;
    }
  }

  private initGeminiSession(model: string = GEMINI_MODEL) {
    if (!this.geminiClient) return;

    this.currentModel = model;

    this.geminiChat = this.geminiClient.chats.create({
      model,
      config: {
        systemInstruction: this.systemInstruction,
      },
    });
  }

  private async fileToPart(file: File): Promise<Part> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve({ inlineData: { data: base64, mimeType: file.type } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ================== CHAT ==================
  async *sendMessageStream(message: string, attachment?: File) {
    if (!this.geminiChat) {
      throw new Error("Gemini chat not initialized");
    }

    let msg: any = message;

    if (attachment) {
      const part = await this.fileToPart(attachment);
      msg = [message, part];
    }

    try {
      const stream = await this.geminiChat.sendMessageStream({ message: msg });

      for await (const chunk of stream) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) yield text;
      }
    } catch (e) {
      console.error("Gemini error:", e);
      yield "❌ Error connecting to Gemini.";
    }
  }
}
