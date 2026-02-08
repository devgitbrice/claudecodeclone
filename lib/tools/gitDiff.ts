import { spawn } from "child_process";

export async function gitDiff(): Promise<string> {
  return new Promise((resolve, reject) => {
    const git = spawn("git", ["diff"], { cwd: process.cwd() });

    let output = "";
    let error = "";

    git.stdout.on("data", (d) => (output += d.toString()));
    git.stderr.on("data", (d) => (error += d.toString()));

    git.on("close", (code) => {
      if (code !== 0) reject(error || "git diff failed");
      else resolve(output || "Aucune différence.");
    });
  });
}
