/**
 * ReAvatar —— 头像组件（el-avatar 封装）
 */
import type { App, Plugin } from "vue";
import ReAvatar from "./ReAvatar.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAvatar", ReAvatar);
  },
};

export { plugin as install };
export default ReAvatar;