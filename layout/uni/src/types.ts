export interface UniBottomNavItem {
  key: string;
  label: string;
  shortLabel: string;
  path: string;
  badge?: number | string;
  mode?: "reLaunch" | "redirectTo" | "switchTab";
}

export type UniThemeMode = "light" | "dark";

export interface UniRequestOptions<T = unknown> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  beforeRequest?: (options: UniRequestOptions<T>) => UniRequestOptions<T>;
  afterResponse?: (res: UniApp.RequestSuccessCallbackResult) => T;
}
