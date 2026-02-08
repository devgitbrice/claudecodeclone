"use client";

import { useEffect, useState } from "react";

type RepoItem = { full_name: string; private: boolean; default_branch: string };

export default function GithubRepoLoader() {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setError("");
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const data = await res.json();
      setRepos(data.repositories || []);
    })();
  }, []);

  async function loadTree() {
    if (!selectedRepo) return;
    setLoading(true);
    setError("");
    setFiles([]);
    setSelectedFile("");
    setFileContent("");

    const res = await fetch(`/api/github/tree?repo=${encodeURIComponent(selectedRepo)}&branch=${encodeURIComponent(branch)}`);
    if (!res.ok) {
      setError(await res.text());
      setLoading(false);
      return;
    }
    const data = await res.json();
    setFiles(data.files || []);
    setLoading(false);
  }

  async function loadFile(path: string) {
    setSelectedFile(path);
    setFileContent("");
    setError("");

    const res = await fetch(
      `/api/github/file?repo=${encodeURIComponent(selectedRepo)}&ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`
    );
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = await res.json();
    setFileContent(data.content || "");
  }

  function onSelectRepo(repoFullName: string) {
    setSelectedRepo(repoFullName);
    const r = repos.find(x => x.full_name === repoFullName);
    setBranch(r?.default_branch || "main");
  }

  return (
    <div className="space-y-3 border rounded p-4">
      <div className="font-semibold">GitHub — Charger un repo</div>

      {error && <div className="bg-red-100 text-red-800 p-2 rounded text-sm">{error}</div>}

      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1 text-sm w-full"
          value={selectedRepo}
          onChange={(e) => onSelectRepo(e.target.value)}
        >
          <option value="">-- Choisir un repo --</option>
          {repos.map((r) => (
            <option key={r.full_name} value={r.full_name}>
              {r.full_name} {r.private ? "(private)" : "(public)"}
            </option>
          ))}
        </select>

        <input
          className="border rounded px-2 py-1 text-sm w-40"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="branch"
        />

        <button
          className="px-3 py-1 rounded bg-black text-white text-sm disabled:opacity-50"
          disabled={!selectedRepo || loading}
          onClick={loadTree}
        >
          {loading ? "Chargement…" : "Load"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded p-2 h-[360px] overflow-auto">
          <div className="text-xs text-zinc-500 mb-2">Fichiers</div>
          {files.length === 0 ? (
            <div className="text-sm text-zinc-500">Aucun fichier chargé.</div>
          ) : (
            <ul className="text-xs space-y-1">
              {files.slice(0, 400).map((f) => (
                <li key={f}>
                  <button
                    className={`text-left w-full hover:underline ${selectedFile === f ? "font-semibold" : ""}`}
                    onClick={() => loadFile(f)}
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border rounded p-2 h-[360px] overflow-auto">
          <div className="text-xs text-zinc-500 mb-2">Contenu</div>
          {selectedFile && <div className="text-xs mb-2">{selectedFile}</div>}
          <pre className="text-xs whitespace-pre-wrap">{fileContent}</pre>
        </div>
      </div>
    </div>
  );
}
