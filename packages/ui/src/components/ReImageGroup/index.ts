/**
 * ReImageGroup —— 图片列表/画廊组件
 *
 * 支持「视口内异步加载」：图片节点首次进入视口前不会赋值真实 src，
 * 避免一次性加载全部图片造成首屏阻塞。离开后再次进入不会重复加载。
 *
 *   <ReImageGroup :src-list="urls" :columns="3" :preview="true" />
 */
import type { App, Plugin } from "vue";
import ReImageGroup from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReImageGroup", ReImageGroup);
  },
};

export { plugin as install };
export default ReImageGroup;
