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

export type { ElementPreviewPayload } from "./ReElementPicker.vue";

/**
 * 注册为全局组件。
 *
 * @param app Vue 应用实例
 */
export const install = (app: { component: (name: string, comp: unknown) => void }): void => {
  app.component("ReElementPicker", ReElementPicker);
};

export default ReElementPicker;
