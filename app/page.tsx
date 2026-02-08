// app/page.tsx
"use client";

import { useState } from "react";
import AgentChat from "../components/AgentChat";
import GithubRepoLoader from "../components/GithubRepoLoader";

export default function Home() {
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Claude Code Clone !!!</h1>
        <p className="text-sm text-zinc-500">
          Agent + accès GitHub (API) : choisir un repo !!, explorer les fichiers, puis lancer l'agent.
        </p>
      </header>

      <GithubRepoLoader
        selectedRepo={selectedRepo}
        onSelectRepo={setSelectedRepo}
        branch={branch}
        onBranchChange={setBranch}
      />

      <section className="border rounded p-4">
        <h2 className="text-sm font-semibold mb-3">Agent</h2>
        <AgentChat repo={selectedRepo} branch={branch} />
      </section>
    </main>
  );
}
