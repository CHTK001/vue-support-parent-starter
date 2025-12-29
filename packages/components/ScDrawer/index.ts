/**
 * ScDrawer 抽屉组件
 * 继承 el-drawer 所有功能，并添加记忆功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-08
 * @updated 2025-12-29 添加 composables 模块
 */
import { App } from "vue";
import ScDrawer from "./index.vue";

// 导出组件
export { ScDrawer };

// 导出 Composables
export {
  useDrawerMemory,
  useComponentMemory,
  clearAllComponentMemory,
  getAllMemoryKeys,
} from "./composables";

export type {
  DrawerMemoryData,
  ComponentMemoryData,
  ComponentMemoryOptions,
  ComponentMemoryReturn,
} from "./composables";

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("ScDrawer", ScDrawer);
  }
};
