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

/**
 * 全局组件类型声明。
 *
 * <p>业务页面几乎都是通过 {@code installUi({ components: ["ReText"] })}
 * 全局使用 {@code <ReText>}，全仓库没有一处 import 它。若不在这里补
 * {@code GlobalComponents}，`vue-tsc` 会把 `ReText` 当作未知组件，
 * props 完全不校验（`type="secondary"` 这类非法值就查不出来）。</p>
 *
 * <p>只声明 ReText：其余 Re 组件暂未纳入，避免一次性放出海量既有报错。</p>
 */
declare module "vue" {
  export interface GlobalComponents {
    ReText: typeof ReText;
  }
}

export { plugin as install };
export default ReText;
export * from "./types";
