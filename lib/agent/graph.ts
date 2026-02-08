// lib/agent/graph.ts

import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";

import { AgentState } from "./state";
import { LLMProvider } from "../llm/provider";

import { searchRepo } from "../tools/searchRepo";
import { readFile } from "../tools/readFile";
import { applyPatch } from "../tools/applyPatch";
import { gitDiff } from "../tools/gitDiff";

import { runPlanner, generatePatch } from "./planner";

/**
 * Node 1 — Analyse initiale
 */
async function analyze(state: AgentState): Promise<AgentState> {
  state.events.push({
    type: "message",
    role: "assistant",
    content: "🔍 Analyse du message utilisateur…",
  });

  return state;
}

/**
 * Node 2 — Investigation réelle du repo (rg + read_file)
 */
async function investigate(state: AgentState): Promise<AgentState> {
  const query = "allow_adult";

  // --- search_repo ---
  state.events.push({
    type: "tool_start",
    tool: "search_repo",
    input: { query },
  });

  let searchResult = "";
  try {
    searchResult = await searchRepo(query);
  } catch (e) {
    searchResult = String(e);
  }

  state.events.push({
    type: "tool_result",
    tool: "search_repo",
    output: searchResult,
  });

  const firstLine = searchResult.split("\n")[0];
  const filePath = firstLine?.split(":")[0];

  if (!filePath) {
    state.events.push({
      type: "message",
      role: "assistant",
      content: "⚠️ Aucun fichier trouvé pour cette recherche.",
    });
    return state;
  }

  // --- read_file ---
  state.events.push({
    type: "tool_start",
    tool: "read_file",
    input: { path: filePath, start: 0, end: 200 },
  });

  let fileContent = "";
  try {
    fileContent = await readFile(filePath, 0, 200);
  } catch (e) {
    fileContent = String(e);
  }

  state.events.push({
    type: "tool_result",
    tool: "read_file",
    output: fileContent,
  });

  // Injecter le contexte code pour le LLM
  state.messages.push(
    new AIMessage(
      `Fichier ${filePath} (extrait) :\n\n${fileContent}`
    )
  );

  return state;
}

/**
 * Node 3 — Génération + application du patch + git diff
 */
async function patch(
  state: AgentState,
  llm: LLMProvider
): Promise<AgentState> {
  state.events.push({
    type: "message",
    role: "assistant",
    content: "🛠️ Génération du patch correctif…",
  });

  let patchText = "";
  try {
    patchText = await generatePatch(llm.model, state.messages);
  } catch (e) {
    state.events.push({
      type: "error",
      message: String(e),
    });
    return state;
  }

  // --- apply_patch ---
  state.events.push({
    type: "tool_start",
    tool: "apply_patch",
    input: { patch: patchText },
  });

  try {
    const result = await applyPatch(patchText);
    state.events.push({
      type: "tool_result",
      tool: "apply_patch",
      output: result,
    });
  } catch (e) {
    state.events.push({
      type: "error",
      message: String(e),
    });
    return state;
  }

  // --- git_diff ---
  state.events.push({
    type: "tool_start",
    tool: "git_diff",
    input: {},
  });

  try {
    const diff = await gitDiff();
    state.events.push({
      type: "tool_result",
      tool: "git_diff",
      output: diff,
    });

    // Injecter le diff dans le contexte LLM
    state.messages.push(
      new AIMessage(`Diff git après correction :\n\n${diff}`)
    );
  } catch (e) {
    state.events.push({
      type: "error",
      message: String(e),
    });
  }

  return state;
}

/**
 * Node 4 — Conclusion finale via LLM
 */
async function conclude(
  state: AgentState,
  llm: LLMProvider
): Promise<AgentState> {
  const answer = await runPlanner(llm.model, state.messages);

  state.events.push({
    type: "message",
    role: "assistant",
    content: answer,
  });

  state.messages.push(new AIMessage(answer));

  return state;
}

/**
 * Construction du graphe LangGraph
 */
export function buildGraph(llm: LLMProvider) {
  const graph = new StateGraph<AgentState>()
    .addNode("analyze", analyze)
    .addNode("investigate", investigate)
    .addNode("patch", (state) => patch(state, llm))
    .addNode("conclude", (state) => conclude(state, llm))
    .addEdge("analyze", "investigate")
    .addEdge("investigate", "patch")
    .addEdge("patch", "conclude")
    .addEdge("conclude", END);

  return graph.compile();
}
