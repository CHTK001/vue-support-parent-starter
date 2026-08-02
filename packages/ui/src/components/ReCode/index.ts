/**
 * ReCode —— 验证码输入组件
 *
 * 支持多位验证码输入、自动聚焦下一个输入框
 *   <ReCode length="6" @change="(code) => console.log(code)" />
 */
import type { App, Plugin } from "vue";
import ReCode from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCode", ReCode);
  },
};

export { plugin as install };
export default ReCode;