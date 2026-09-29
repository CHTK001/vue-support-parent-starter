/**
 * RePlaceholderPicker —— 占位字段选择组件
 *
 * 在采集流程配置项中动态检索并插入占位符（形如 ${变量名}）。
 * 数据完全由 groups prop 传入，组件不发任何 HTTP 请求，便于复用与单测。
 *
 * 用法：
 *   <RePlaceholderPicker
 *     :groups="[{ label: '全局变量', items: [{ name: 'now', description: '当前时间' }] }]"
 *     mode="input"
 *     @pick="onPick"
 *     @search="onSearch"
 *   />
 */
import type { App, Plugin } from "vue";
import RePlaceholderPicker from "./RePlaceholderPicker.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("RePlaceholderPicker", RePlaceholderPicker);
  },
};

export { plugin as install };
export default RePlaceholderPicker;
