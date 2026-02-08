import { spawn } from "child_process";

export async function searchRepo(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rg = spawn("rg", ["-n", query, "."], {
      cwd: process.cwd(),
    });

    let output = "";
    let error = "";

    rg.stdout.on("data", (data) => {
      output += data.toString();
    });

    rg.stderr.on("data", (data) => {
      error += data.toString();
    });

    rg.on("close", (code) => {
      if (code !== 0 && !output) {
        reject(error || "No matches found");
      } else {
        resolve(output.slice(0, 8_000)); // garde-fou taille
      }
    });
  });
}
