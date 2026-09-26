/**
 * ReRichText —— TipTap 富文本组件
 */
import type { App, Plugin } from "vue";
import ReRichText from "./ReRichText.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRichText", ReRichText);
  },
};

export { plugin as install };
export default ReRichText;
