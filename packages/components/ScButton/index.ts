/**
 * ScButton 按钮组件
 * 封装 el-button 和 scifiButton
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { App } from "vue";
import ScButton from "./src/index.vue";

export { ScButton };

export default {
  install(app: App): void {
    app.component("ScButton", ScButton);
  }
};
