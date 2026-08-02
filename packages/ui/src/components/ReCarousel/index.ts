/**
 * ReCarousel —— 轮播图组件
 *
 * 自实现 CSS transform + transition，无外部依赖
 *   <ReCarousel :items="images" :interval="3000" />
 */
import type { App, Plugin } from "vue";
import ReCarousel from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCarousel", ReCarousel);
  },
};

export { plugin as install };
export default ReCarousel;