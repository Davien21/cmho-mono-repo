import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { env } from "../config/env";

const INVENTORY_SCHEMA = {
  type: "object",
  properties: {
    inventory: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity_details: { type: "string" },
        },
        required: ["name", "quantity_details"],
      },
    },
  },
  required: ["inventory"],
};

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async transcribeImage(imageUrl: string) {
    try {
      const result = await this.client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract all medical inventory items from this image and return valid JSON.",
              },
              {
                fileData: {
                  fileUri: imageUrl,
                  mimeType: "image/jpeg",
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: INVENTORY_SCHEMA,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      if (!result.text) throw new Error("Empty response");

      return JSON.parse(result.text);
    } catch (error: any) {
      console.error("Transcription Error:", error.message);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
