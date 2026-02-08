import { ChatOpenAI } from "@langchain/openai";
import { LLMProvider } from "./provider";

export function openAIProvider(): LLMProvider {
  return {
    name: "openai",
    model: new ChatOpenAI({
      model: "gpt-4.1-mini", // ou ton “5.2” interne
      temperature: 0,
      streaming: false,
    }),
  };
}
