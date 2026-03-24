import type { Plugin } from "vite";
import { Plugin as importToCDN } from "vite-plugin-cdn-import";

/**
 * @description 创建 CDN 插件实例，按需延迟初始化，避免在未启用 CDN 时也强依赖本地 vue 等包的 package.json
 * 仅在 VITE_CDN 为 true 时由外部调用此方法生成插件，默认不启用 CDN。
 */
export const createCdnPlugin = (): Plugin =>
  importToCDN({
  //（prodUrl解释： name: 对应下面modules的name，version: 自动读取本地package.json中dependencies依赖中对应包的版本号，path: 对应下面modules的path，当然也可写完整路径，会替换prodUrl）
  prodUrl: "https://cdn.bootcdn.net/ajax/libs/{name}/{version}/{path}",
  modules: [
    {
      name: "vue",
      var: "Vue",
      path: "vue.global.prod.min.js",
    },
    {
      name: "vue-router",
      var: "VueRouter",
      path: "vue-router.global.min.js",
    },
    // vue-i18n 可能不存在，移除或改为可选
    // {
    //   name: "vue-i18n",
    //   var: "VueI18n",
    //   path: "vue-i18n.runtime.global.prod.min.js",
    // },
    // 项目中没有直接安装vue-demi，但是pinia用到了，所以需要在引入pinia前引入vue-demi（https://github.com/vuejs/pinia/blob/v2/packages/pinia/package.json#L77）
    {
      name: "vue-demi",
      var: "VueDemi",
      path: "index.iife.min.js",
    },
    {
      name: "pinia",
      var: "Pinia",
      path: "pinia.iife.min.js",
    },
    {
      name: "element-plus",
      var: "ElementPlus",
      path: "index.full.min.js",
      css: "index.min.css",
    },
    {
      name: "axios",
      var: "axios",
      path: "axios.min.js",
    },
    {
      name: "dayjs",
      var: "dayjs",
      path: "dayjs.min.js",
    },
    // echarts 可能不存在，移除或改为可选
    // {
    //   name: "echarts",
    //   var: "echarts",
    //   path: "echarts.min.js",
    // },
  ],
});

// 兼容旧导出名，默认不启用，避免在未开启 CDN 时也触发插件初始化
export const cdn = null as unknown as Plugin;
