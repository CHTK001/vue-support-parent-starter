import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { prismjsPlugin } from "vite-plugin-prismjs";
import removeConsole from "vite-plugin-remove-console";
import removeNoMatch from "vite-plugin-router-warn";
import topLevelAwait from "vite-plugin-top-level-await";
import svgLoader from "vite-svg-loader";
import { cdn } from "./cdn";
import { configCompressPlugin } from "./compress";
import { viteBuildInfo } from "./info";
import { pathResolve } from "./utils";

export function getPluginsList(VITE_CDN: boolean, VITE_COMPRESSION: ViteCompression): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
  return [
    topLevelAwait(),
    vue(),
    nodePolyfills({
      // 把 Node 全局变量注入到浏览器端
      globals: { process: true, Buffer: true },
    }),
    // jsx、tsx语法支持
    vueJsx(),
    prismjsPlugin({
      languages: "all",
      plugins: ["line-numbers", "line-highlight", "inline-color", "copy-to-clipboard", "highlight-keywords", "show-language", "download-button", "data-uri-highlight"], //官网有其他功能,这里开启行数和复制按钮功能
      theme: "okaidia",
      css: true,
    }),
    VueI18nPlugin({
      include: [pathResolve("../locales/**"), pathResolve("@repo/config/locales/**")],
    }),
    /**
     * 在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
     * Mac 默认组合键 Option + Shift
     * Windows 默认组合键 Alt + Shift
     * 更多用法看 https://inspector.fe-dev.cn/guide/start.html
     */ codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true,
    }),
    viteBuildInfo(),
    /**
     * 开发环境下移除非必要的vue-router动态路由警告No match found for location with path
     * 非必要具体看 https://github.com/vuejs/router/issues/521 和 https://github.com/vuejs/router/issues/359
     * vite-plugin-router-warn只在开发环境下启用，只处理vue-router文件并且只在服务启动或重启时运行一次，性能消耗可忽略不计
     */
    removeNoMatch(),
    // mock支持
    vitePluginFakeServer({
      logger: false,
      include: "mock",
      infixName: false,
      enableProd: true,
    }),
    // svg组件化支持
    svgLoader(),
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    // 线上环境删除console
    removeConsole({ external: ["@repo/assets/iconfont/iconfont.js"] }),
    // 打包分析
    lifecycle === "report" ? visualizer({ open: true, brotliSize: true, filename: "report.html" }) : (null as any),
  ];
}
