import type { App, Plugin } from "vue";

export interface ReturnResult<E> {
  code: string | number;
  msg: string;
  message: string;
  data: E;
  headers?: any;
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
        options?.data === undefined
          ? undefined
          : JSON.stringify(options.data),
    });

    const payload = await response.json();
    return {
      data: payload?.data ?? payload,
      code: payload?.code ?? response.status,
      msg: payload?.msg ?? payload?.message ?? response.statusText,
      message: payload?.message ?? payload?.msg ?? response.statusText,
      success: payload?.success ?? response.ok,
      headers: {},
    } as T;
  },
};

export const deepCopy = <T>(source: T, target?: T): T => {
  const nextValue = JSON.parse(JSON.stringify(source)) as T;
  if (target && typeof target === "object") {
    Object.keys(target as Record<string, any>).forEach((key) => {
      delete (target as Record<string, any>)[key];
    });
    Object.assign(target as Record<string, any>, nextValue as Record<string, any>);
    return target;
  }
  return nextValue;
};

export const paginate = <T>(
  data: T[] = [],
  pageSize = 10,
  currentPage = 1,
) => {
  const safeSize = Math.max(1, pageSize);
  const safePage = Math.max(1, currentPage);
  const start = (safePage - 1) * safeSize;
  return {
    data: data.slice(start, start + safeSize),
    total: data.length,
  };
};

export const localStorageProxy = () => ({
  getItem<T = any>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: unknown) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key);
  },
});

const buildLoggerMethod = (prefix: string, method: "debug" | "error" | "info" | "warn") =>
  (...args: any[]) => {
    console[method](prefix, ...args);
  };

export const getLogger = (prefix = "[panel-playground]") => ({
  debug: buildLoggerMethod(prefix, "debug"),
  error: buildLoggerMethod(prefix, "error"),
  info: buildLoggerMethod(prefix, "info"),
  warn: buildLoggerMethod(prefix, "warn"),
});

export const withInstall = <T>(component: T, alias?: string) => {
  const installable = component as T & Plugin & { name?: string };
  installable.install = (app: App) => {
    const name = alias || installable.name;
    if (name) {
      app.component(name, installable as any);
    }
  };
  return installable;
};
