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

/**
 * 把耗时格式化函数透出，供**字符串上下文**复用。
 *
 * 为什么需要：ReTime 是组件，只能用在模板里。但耗时也会出现在 toast 文案、
 * 复制到剪贴板的摘要这类纯字符串里。那里如果自己拼 `${x}ms`，就会和表格里的
 * 「176 毫秒」对不上——同一份数据两个页面两种文本，正是这次要消除的问题。
 * 透出后字符串侧与模板侧走同一个 formatDuration，格式永远一致。
 */
export { formatDuration, formatValue, relativeTime, toMs } from "./utils";