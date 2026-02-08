import { BaseMessage } from "@langchain/core/messages";

export type AgentState = {
  messages: BaseMessage[];
  events: any[];
};
