import { http, type ReturnResult } from "@repo/utils";

const TOKEN_KEY = "datalake.api.token";
const TOKEN_URL = "/v2/datalake/auth/token";

let tokenPromise: Promise<string> | null = null;

type DatalakeMethod = "get" | "post" | "put" | "delete";
type DatalakeRequestConfig = {
  data?: any;
  params?: any;
  headers?: Record<string, any>;
  timeout?: number;
  [key: string]: any;
};

function readStoredToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

function storeToken(token: string): void {
  if (typeof window !== "undefined" && token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

function unwrapToken(payload: any): string {
  return String(payload?.data?.token || payload?.token || "").trim();
}

export async function getDatalakeToken(): Promise<string> {
  const cached = readStoredToken();
  if (cached) {
    return cached;
  }
  if (!tokenPromise) {
    tokenPromise = http
      .request<ReturnResult<{ token: string }> | { token: string }>("post", TOKEN_URL, {
        data: { description: "datalake-console", expiresAt: 0 },
      })
      .then((payload) => {
        const token = unwrapToken(payload);
        storeToken(token);
        return token;
      })
      .finally(() => {
        tokenPromise = null;
      });
  }
  return tokenPromise;
}

export async function datalakeRequest<T>(
  method: DatalakeMethod,
  url: string,
  config: DatalakeRequestConfig = {},
): Promise<T> {
  const token = await getDatalakeToken();
  const headers = {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return http.request<T>(method, url, {
    ...config,
    headers,
  });
}
