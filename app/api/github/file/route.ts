import { NextRequest } from "next/server";
import { ghFetch } from "../../../../lib/github/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");     // "owner/name"
  const path = searchParams.get("path");     // "src/index.ts"
  const ref = searchParams.get("ref") || "main";

  if (!repo) return new Response("Missing repo", { status: 400 });
  if (!path) return new Response("Missing path", { status: 400 });

  const res = await ghFetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`
  );

  if (!res.ok) return new Response(await res.text(), { status: res.status });

  const data = await res.json() as { content?: string; encoding?: string };

  if (data.encoding !== "base64" || !data.content) {
    return new Response("Unsupported file encoding or empty content", { status: 400 });
  }

  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  return Response.json({ repo, path, ref, content });
}
