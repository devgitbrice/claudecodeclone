"use client";

import { useState } from "react";
import type { AgentEvent } from "@/lib/agent/types";

type Provider = "openai" | "gemini";

export default function AgentChat() {
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [provider, setProvider] = useState<Provider>("openai");
  const [loading, setLoading] = useState(false);

  async function runAgent() {
    setEvents([]);
    setLoading(true);

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-llm-provider": provider,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: input }],
      }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        if (!chunk.startsWith("data: ")) continue;

        try {
          const event = JSON.parse(
            chunk.replace("data: ", "")
          ) as AgentEvent;

          setEvents((prev) => [...prev, event]);
        } catch {
          // ignore malformed chunk
        }
      }
    }

    setLoading(false);
  }

  function renderEvent(event: AgentEvent, index: number) {
    if (event.type === "message") {
      return (
        <div
          key={index}
          className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm"
        >
          {event.content}
        </div>
      );
    }

    if (event.type === "tool_start") {
      return (
        <div
          key={index}
          className="text-xs text-blue-600 font-mono"
        >
          ▶ {event.tool} {JSON.stringify(event.input)}
        </div>
      );
    }

    if (event.type === "tool_result") {
      // Git diff affiché proprement
      if (event.tool === "git_diff") {
        return (
          <pre
            key={index}
            className="bg-black text-green-200 p-3 rounded overflow-x-auto text-xs"
          >
            {event.output}
          </pre>
        );
      }

      return (
        <pre
          key={index}
          className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-xs overflow-x-auto"
        >
          {event.output}
        </pre>
      );
    }

    if (event.type === "error") {
      return (
        <div
          key={index}
          className="bg-red-100 text-red-800 p-2 rounded text-sm"
        >
          ❌ {event.message}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-4">
      {/* Provider selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">LLM :</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini 3 Pro</option>
        </select>
      </div>

      {/* Input */}
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={4}
        placeholder="Décris le bug ou la modification à effectuer…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {/* Run button */}
      <button
        onClick={runAgent}
        disabled={loading || !input}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? "Agent en cours…" : "Run agent"}
      </button>

      {/* Events */}
      <div className="space-y-2 border rounded p-3">
        {events.length === 0 && (
          <div className="text-xs text-zinc-500">
            Aucun événement pour l’instant.
          </div>
        )}
        {events.map(renderEvent)}
      </div>
    </div>
  );
}
