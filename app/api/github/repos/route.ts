import { ghFetch } from "../../../../lib/github/client";

export const runtime = "nodejs";

export async function GET() {
  // Repos auxquels l’installation a accès
  const res = await ghFetch("https://api.github.com/installation/repositories?per_page=100");
  if (!res.ok) return new Response(await res.text(), { status: res.status });

  const data = await res.json() as {
    repositories: { full_name: string; private: boolean; default_branch: string }[];
  };

  return Response.json({
    repositories: data.repositories.map(r => ({
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
    })),
  });
}
