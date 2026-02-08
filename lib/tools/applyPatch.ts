import { spawn } from "child_process";

export async function applyPatch(patch: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const git = spawn("git", ["apply", "--whitespace=nowarn"], {
      cwd: process.cwd(),
    });

    let stderr = "";

    git.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    git.on("close", (code) => {
      if (code !== 0) {
        reject(stderr || "Patch application failed");
      } else {
        resolve("Patch appliqué avec succès.");
      }
    });

    git.stdin.write(patch);
    git.stdin.end();
  });
}
