// app/api/agent/route.ts

import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";

import { buildGraph } from "../../../lib/agent/graph";
import { AgentState } from "../../../lib/agent/state";
import { AgentRequest } from "../../../lib/agent/types";

import { openAIProvider } from "../../../lib/llm/openai";
import { geminiProvider } from "../../../lib/llm/gemini";

export const runtime = "nodejs";

/**
 * POST /api/agent
 * Lance l’agent LangGraph et stream les events via SSE
 */
export async function POST(req: NextRequest) {
  let body: AgentRequest;

  try {
    body = (await req.json()) as AgentRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // --- Choix du provider LLM ---
  const providerHeader = req.headers.get("x-llm-provider");
  const llm =
    providerHeader === "gemini"
      ? geminiProvider()
      : openAIProvider();

  // --- État initial (TYPÉ CORRECTEMENT) ---
  const initialState: AgentState = {
    messages: body.messages.map(
      (m) => new HumanMessage(m.content)
    ),
    events: [],
  };

  const graph = buildGraph(llm);

  // --- Exécution de l’agent ---
  const result = await graph.invoke(initialState);

  // --- Streaming SSE ---
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      for (const event of result.events) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
