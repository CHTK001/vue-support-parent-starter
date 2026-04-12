export interface ReturnResult<E> {
  code: string | number;
  msg: string;
  message: string;
  data: E;
  headers?: Record<string, string>;
  success: boolean;
}

type RequestMethod = "get" | "post" | "put" | "delete";

type RequestOptions = {
  data?: unknown;
  params?: Record<string, unknown>;
};

const buildUrl = (url: string, params?: Record<string, unknown>) => {
  const target = new URL(url, window.location.origin);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    target.searchParams.set(key, String(value));
  }
  return target.toString();
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();
  return {
    data: payload?.data ?? payload,
    code: payload?.code ?? response.status,
    msg: payload?.msg ?? payload?.message ?? response.statusText,
    message: payload?.message ?? payload?.msg ?? response.statusText,
    success: payload?.success ?? response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  } as T;
};

export const http = {
  async request<T>(
    method: RequestMethod,
    url: string,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
      },
      body:
        options?.data === undefined ? undefined : JSON.stringify(options.data),
    });

    return parseResponse<T>(response);
  },
};
