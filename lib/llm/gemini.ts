import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LLMProvider } from "./provider";

export function geminiProvider(): LLMProvider {
  return {
    name: "gemini",
    model: new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro", // Gemini 3 Pro
      temperature: 0,
    }),
  };
}
