/**
 * ReTime —— 时间展示组件
 *
 * 支持 Date / string / number / 毫秒时间戳输入，按 format 输出对应格式。
 * 同时支持中文相对时间（多少秒/分钟/小时/天/月/年前）。
 *
 * 用法：
 *   <ReTime :value="1719700000000" format="YYYY-MM-DD HH:mm:ss" />
 *   <ReTime :value="date" format="date" />
 *   <ReTime :value="now" relative />           <!-- 显示 "刚刚 / 3 分钟前" -->
 *   <ReTime :value="ms" format="ms" />          <!-- 显示毫秒数 -->
 *   <ReTime :value="ms" format="duration" />    <!-- 自动选最佳粒度显示 -->
 */
import type { App, Plugin } from "vue";
import ReTime from "./ReTime.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTime", ReTime);
  },
};

export { plugin as install };
export default ReTime;
export * from "./types";