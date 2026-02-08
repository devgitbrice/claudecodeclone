export type AgentEvent =
  | {
      type: "message";
      role: "assistant" | "system";
      content: string;
    }
  | {
      type: "tool_start";
      tool: string;
      input: unknown;
    }
  | {
      type: "tool_result";
      tool: string;
      output: string;
    }
  | {
      type: "error";
      message: string;
    };

export type AgentRequest = {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  repo: string;
  branch: string;
};
