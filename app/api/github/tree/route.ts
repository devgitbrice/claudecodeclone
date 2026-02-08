import { NextRequest } from "next/server";
import { ghFetch } from "../../../../lib/github/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");         // "owner/name"
  const branch = searchParams.get("branch") || "main";

  if (!repo) return new Response("Missing repo", { status: 400 });

  // 1) récupérer le SHA du branch
  const refRes = await ghFetch(`https://api.github.com/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!refRes.ok) return new Response(await refRes.text(), { status: refRes.status });
  const refData = await refRes.json() as { object: { sha: string } };

  // 2) récupérer l’arbre complet (recursive=1)
  const treeRes = await ghFetch(
    `https://api.github.com/repos/${repo}/git/trees/${refData.object.sha}?recursive=1`
  );
  if (!treeRes.ok) return new Response(await treeRes.text(), { status: treeRes.status });

  const treeData = await treeRes.json() as {
    tree: { path: string; type: "blob" | "tree"; sha: string }[];
  };

  // On renvoie uniquement les fichiers (blobs)
  const files = treeData.tree
    .filter(x => x.type === "blob")
    .map(x => x.path)
    .slice(0, 2000); // garde-fou

  return Response.json({ repo, branch, files });
}
