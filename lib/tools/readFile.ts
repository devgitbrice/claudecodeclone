import { ghFetch } from "../github/client";

/**
 * Read a file from a GitHub repository via the Contents API.
 *
 * @param path   File path inside the repo, e.g. "src/index.ts"
 * @param repo   Full repo name, e.g. "owner/name"
 * @param ref    Branch / tag / SHA (defaults to "main")
 * @param start  Optional first line (0-based)
 * @param end    Optional last line (exclusive)
 */
export async function readFile(
  path: string,
  repo: string,
  ref: string = "main",
  start?: number,
  end?: number
): Promise<string> {
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const res = await ghFetch(
    `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub file read failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
  };

  if (data.encoding !== "base64" || !data.content) {
    throw new Error("Unsupported file encoding or empty content");
  }

  const content = Buffer.from(
    data.content.replace(/\n/g, ""),
    "base64"
  ).toString("utf-8");

  const lines = content.split("\n");

  if (start !== undefined || end !== undefined) {
    return lines
      .slice(start ?? 0, end ?? lines.length)
      .join("\n");
  }

  return content.slice(0, 12_000); // garde-fou taille
}
