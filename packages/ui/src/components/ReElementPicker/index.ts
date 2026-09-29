/**
 * ReElementPicker —— 元素拾取器。
 *
 * 把目标页面渲染在同源 iframe 里，hover 高亮、点击/右键选中，然后生成
 * CSS 选择器（@medv/finder，短且唯一）与绝对路径 XPath。
 *
 * 用法：
 * ```vue
 * <ReElementPicker
 *   v-model:visible="picking"
 *   :url="upstreamUrl"
 *   :parser-type="row.parserType"
 *   :loader="loadPreview"
 *   @pick="({ expression, parserType }) => applyToExpression(expression, parserType)"
 * />
 * ```
 *
 * 注意：组件自身**不发 HTTP**，页面正文由 `loader` 注入。
 */
import ReElementPicker from "./ReElementPicker.vue";

/**
 * 抓取结果载荷。
 *
 * 刻意在 index.ts 里再声明一份、而不是 `export type { X } from "./X.vue"`：
 * SFC 的 `<script setup>` 类型导出在没有 vue-tsc 的纯 tsc 下不可见
 * （实测 TS2614: Module '"*.vue"' has no exported member）。
 * 结构与本组件内部、以及后端 CollectPreviewVO 保持一致。
 */
export interface ElementPreviewPayload {
  /** HTTP 状态码 */
  status: number;
  /** 响应 Content-Type，可空 */
  contentType?: string | null;
  /** 正文字符数，可空 */
  length?: number;
  /** 正文原文 */
  html: string;
}

/**
 * 注册为全局组件。
 *
 * @param app Vue 应用实例
 */
export const install = (app: { component: (name: string, comp: unknown) => void }): void => {
  app.component("ReElementPicker", ReElementPicker);
};

export default ReElementPicker;
