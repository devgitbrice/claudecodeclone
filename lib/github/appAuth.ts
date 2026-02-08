import jwt from "jsonwebtoken";

function getPrivateKey(): string {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (raw && raw.includes("BEGIN")) {
    // Handle PEM key with literal \n sequences (single-line in .env)
    const key = raw.replace(/\\n/g, "\n");

    // Validate that the key has actual content, not just the header line
    if (!key.includes("END")) {
      throw new Error(
        "GITHUB_APP_PRIVATE_KEY appears truncated (missing END marker). " +
        "Wrap the PEM key in double quotes in .env.local, or use GITHUB_APP_PRIVATE_KEY_B64 instead."
      );
    }

    return key;
  }

  const b64 = process.env.GITHUB_APP_PRIVATE_KEY_B64;
  if (b64) {
    const key = Buffer.from(b64, "base64").toString("utf-8");

    if (!key.includes("BEGIN") || !key.includes("END")) {
      throw new Error(
        "GITHUB_APP_PRIVATE_KEY_B64 does not decode to a valid PEM key. " +
        "Encode the full PEM file with: base64 -w0 < your-app.pem"
      );
    }

    return key;
  }

  throw new Error(
    "Missing GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_B64. " +
    "Set one of these in .env.local with your GitHub App private key."
  );
}

export async function getInstallationToken(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId) throw new Error("Missing GITHUB_APP_ID in .env.local");
  if (!installationId) throw new Error("Missing GITHUB_APP_INSTALLATION_ID in .env.local");

  const privateKey = getPrivateKey();

  // JWT GitHub App: iat/exp courts (max ~10 min)
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 30,
    exp: now + 9 * 60,
    iss: Number(appId),
  };

  const appJwt = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get installation token: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
