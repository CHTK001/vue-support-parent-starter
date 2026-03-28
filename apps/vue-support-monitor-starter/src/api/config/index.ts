// Only re-export the setting API surface here.
// Importing the page entry also pulls the full setting view component tree,
// which can create circular route dependencies when low-level utilities like
// `getWebSocketUrl` are imported from `@/api/config`.
export * from "../../../../../pages/setting/src/api";
