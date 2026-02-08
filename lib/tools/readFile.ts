import fs from "fs/promises";

export async function readFile(
  path: string,
  start?: number,
  end?: number
): Promise<string> {
  const content = await fs.readFile(path, "utf-8");
  const lines = content.split("\n");

  if (start !== undefined || end !== undefined) {
    return lines
      .slice(start ?? 0, end ?? lines.length)
      .join("\n");
  }

  return content.slice(0, 12_000); // garde-fou taille
}
