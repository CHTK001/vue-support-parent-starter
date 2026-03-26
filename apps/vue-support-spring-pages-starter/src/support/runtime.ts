import { getSpringPageDefinition } from "./pageRegistry";

const DEFAULT_PAGE_KEY = "job-console";

export function resolveSpringPageKey() {
  const pageKey = String(import.meta.env.VITE_SPRING_PAGE_KEY || DEFAULT_PAGE_KEY).trim();
  return pageKey || DEFAULT_PAGE_KEY;
}

export function resolveSpringPageDefinition() {
  return getSpringPageDefinition(resolveSpringPageKey());
}

export function resolveSpringApiRoot() {
  const value = String(import.meta.env.VITE_SPRING_API_ROOT || "").trim();
  return value || undefined;
}

export function resolveSpringAuthBasePath() {
  const value = String(import.meta.env.VITE_SPRING_AUTH_BASE_PATH || "./auth").trim();
  return value || "./auth";
}

export function resolveSpringStorageKey() {
  return `spring.simple-pages.${resolveSpringPageKey()}.settings`;
}
