/**
 * ScHeader 头部组件
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { App } from "vue";
import ScHeader from "./src/index.vue";

export { ScHeader };

export default {
  install(app: App): void {
    app.component("ScHeader", ScHeader);
  }
};
