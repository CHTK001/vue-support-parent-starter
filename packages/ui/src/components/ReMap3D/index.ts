/**
 * ReMap3D —— 多源 3D 地图嵌入组件
 *
 * 支持：Google Earth / Google Maps / OpenStreetMap / Bing Maps / 百度地图 / 高德地图
 *
 * 用法：
 *   import ReMap3D from '@repo/ui/re-map3d'
 *
 *   <!-- 默认 Google Earth，北京 -->
 *   <ReMap3D :height="500" />
 *
 *   <!-- 指定 OpenStreetMap，坐标 -->
 *   <ReMap3D type="openstreetmap" :location="{ lat: 22.5431, lng: 114.0579, zoom: 13 }" />
 *
 *   <!-- 搜索字符串 -->
 *   <ReMap3D type="amap" location="杭州西湖" />
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