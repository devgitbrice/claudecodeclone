import { getInstallationToken } from "./appAuth";

export async function ghFetch(url: string, init: RequestInit = {}) {
  const token = await getInstallationToken();

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
}
