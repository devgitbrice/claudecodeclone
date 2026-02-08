import { ghFetch } from "../github/client";

/**
 * Search for code in a GitHub repository using the GitHub Code Search API.
 *
 * @param query  Text to search for
 * @param repo   Full repo name, e.g. "owner/name"
 */
export async function searchRepo(query: string, repo: string): Promise<string> {
  // GitHub code-search endpoint:  GET /search/code?q={query}+repo:{owner/name}
  const q = encodeURIComponent(`${query} repo:${repo}`);
  const res = await ghFetch(
    `https://api.github.com/search/code?q=${q}&per_page=10`,
    { headers: { Accept: "application/vnd.github.text-match+json" } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub code search failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    total_count: number;
    items: { name: string; path: string; html_url: string; text_matches?: { fragment: string }[] }[];
  };

  if (data.total_count === 0) {
    return "";
  }

  // Format results similarly to ripgrep output:  path:fragment
  const lines = data.items.flatMap((item) => {
    if (item.text_matches && item.text_matches.length > 0) {
      return item.text_matches.map((m) => `${item.path}:${m.fragment}`);
    }
    return [`${item.path}:`];
  });

  return lines.join("\n").slice(0, 8_000); // garde-fou taille
}
