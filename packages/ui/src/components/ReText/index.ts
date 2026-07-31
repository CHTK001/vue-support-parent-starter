/**
 * ReText —— 文本组件
 *
 * 在 el-text 全部能力的基础上，叠加两项防抓取能力：
 *  - ocr：canvas 防 OCR 渲染（secure-render-text）
 *  - obfuscate：动态字体混淆（字符位图 + PUA 乱码文本）
 *
 * 按需引入：import ReText from "@repo/ui/re-text";
 */
import type { App, Plugin } from "vue";
import ReText from "./ReText.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReText", ReText);
  },
};

export { plugin as install };
export default ReText;
export * from "./types";
