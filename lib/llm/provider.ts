import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type LLMProvider = {
  name: "openai" | "gemini";
  model: BaseChatModel;
};
