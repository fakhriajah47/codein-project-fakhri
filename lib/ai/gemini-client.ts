import { ZodSchema } from "zod";

export class GeminiClient {
  private static getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    return key;
  }

  private static getModel(): string {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (model === "gemini-flash-latest" || model === "gemini-1.5-flash") {
      return "gemini-2.5-flash";
    }
    return model;
  }

  static async generateStructuredJSON<T>(params: {
    prompt: string;
    systemInstruction?: string;
    schema: ZodSchema<T>;
  }): Promise<T> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    
    // Google AI Studio Gemini API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload: Record<string, any> = {
      contents: [
        {
          parts: [
            {
              text: params.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    if (params.systemInstruction) {
      payload.systemInstruction = {
        parts: [
          {
            text: params.systemInstruction,
          },
        ],
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error details:", errorText);
      throw new Error(`Gemini API call failed with status: ${response.status}`);
    }

    const resData = await response.json();
    const textOutput = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error("Gemini returned an empty response or invalid candidates structure.");
    }

    try {
      const parsedJson = JSON.parse(textOutput.trim());
      // Validate with Zod
      const validatedData = params.schema.parse(parsedJson);
      return validatedData;
    } catch (parseErr) {
      console.error("Failed to parse or validate Gemini output:", textOutput, parseErr);
      throw new Error("Gemini output was not valid JSON or failed schema validation.");
    }
  }
}
