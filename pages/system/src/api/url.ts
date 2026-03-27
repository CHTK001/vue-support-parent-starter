import { getConfig } from "@repo/config";

function joinUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = (baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedBaseUrl
    ? `${normalizedBaseUrl}/${normalizedPath}`
    : `/${normalizedPath}`;
}

export function buildApiUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
) {
  const baseUrl = getConfig().ApiAddress || getConfig().BaseUrl || "";
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const url = joinUrl(baseUrl, path);
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}
