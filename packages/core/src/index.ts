import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };

// 应用启动器
export {
  createAppBootstrap,
  quickBootstrap,
  createStandardApp,
  AppBootstrap,
} from "./app-bootstrap";
export type { BootstrapOptions, StandardAppOptions } from "./app-bootstrap";
