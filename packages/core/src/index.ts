import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };
export * from "./app-bootstrap";
export * from "./api/message";
export * from "./config";
export * from "./types/router";

