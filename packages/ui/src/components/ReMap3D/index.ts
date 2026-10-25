/**
 * ReMap3D —— 多引擎 3D 地图嵌入组件
 *
 * 支持两个引擎：
 * - mars3d: 基于 mars.js 的三维地球可视化引擎
 * - maplibre: 基于 maplibre-gl 的可定制 3D 地图引擎
 *
 * 用法：
 *   import ReMap3D from '@repo/ui/re-map3d'
 *
 *   <!-- 默认使用 mars3d 引擎，显示全球 3D 地球 -->
 *   <ReMap3D :height="500" />
 *
 *   <!-- 切换为 maplibre 引擎，显示街道视图 -->
 *   <ReMap3D type="maplibre" :location="{ lat: 22.5431, lng: 114.0579, zoom: 13 }" />
 *
 *   <!-- mars3d 引擎的球体模式 -->
 *   <ReMap3D engine="mars3d" mode="globe" />
 */
import type { App, Plugin } from "vue";
import ReMap3D from "./ReMap3D.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReMap3D", ReMap3D);
  },
};

export { plugin as install };
export default ReMap3D;