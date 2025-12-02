/**
 * ScDeco 科技装饰组件
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { App } from "vue";
import ScDeco from "./src/index.vue";

export { ScDeco };

export default {
  install(app: App): void {
    app.component("ScDeco", ScDeco);
  }
};
