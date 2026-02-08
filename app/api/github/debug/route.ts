import { getInstallationToken } from "../../../../lib/github/appAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await getInstallationToken();

    const res = await fetch("https://api.github.com/installation/repositories?per_page=5", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const text = await res.text();
    return new Response(
      JSON.stringify(
        {
          ok: res.ok,
          status: res.status,
          sample: text.slice(0, 500),
          hasToken: Boolean(token),
        },
        null,
        2
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
