/**
 * ReCard —— 卡片组件（el-card 封装）
 */
import type { App, Plugin } from "vue";
import ReCard from "./ReCard.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCard", ReCard);
  },
};

export { plugin as install };
export default ReCard;
