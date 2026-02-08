import AgentChat from "@/components/AgentChat";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Claude Code Clone</h1>
      <AgentChat />
    </main>
  );
}
