import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };

// 应用启动器 & 标准应用工厂
export { AppBootstrap, createStandardApp } from "./app-bootstrap";
export type { StandardAppOptions, FontEncryptionOptions } from "./app-bootstrap";
