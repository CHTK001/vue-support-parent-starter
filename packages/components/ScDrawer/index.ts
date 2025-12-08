/**
 * ScDrawer 抽屉组件
 * 继承 el-drawer 所有功能，并添加记忆功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-08
 */
import { App } from "vue";
import ScDrawer from "./index.vue";

// 导出组件
export { ScDrawer };

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("ScDrawer", ScDrawer);
  }
};
