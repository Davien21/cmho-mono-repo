import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { env } from "../config/env";

// Define the exact schema. Note: description fields help the model "think" better.

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
                text: `Transcribe the medical inventory from this image: ${imageUrl}`,
              },
            ],
          },
        ],

        config: {
          tools: [{ urlContext: {} }], // Use urlContext for image URLs

          responseMimeType: "application/json",

          responseSchema: INVENTORY_SCHEMA,

          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },

          // systemInstruction:

          // "You are a professional medical transcriber. Convert every line of handwriting into the requested JSON format without skipping items.",
        },
      });

      // result.text is a getter that automatically extracts the string from the candidate

      // Because we use response_schema, this is GUARANTEED to be a valid JSON string.

      if (!result.text) throw new Error("Empty response");
      console.log("result.text", JSON.parse(result.text));

      return JSON.parse(result.text);
    } catch (error: any) {
      console.error("Transcription Error:", error.message);

      throw error;
    }
  }
}

export const geminiService = new GeminiService();
