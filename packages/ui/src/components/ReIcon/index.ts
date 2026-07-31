/**
 * ReIcon —— 图标组件（@element-plus/icons-vue 封装）
 *
 *   <ReIcon name="Search" />
 *   <ReIcon name="Search" :size="20" color="var(--el-color-primary)" />
 */
import type { App, Plugin } from "vue";
import ReIcon from "./ReIcon.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReIcon", ReIcon);
  },
};

export { plugin as install };
export default ReIcon;
