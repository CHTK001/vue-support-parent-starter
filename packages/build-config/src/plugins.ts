import { createCdnPlugin } from "./cdn";
import vue from "@vitejs/plugin-vue";
import { pathResolve } from "./utils";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import type { PluginOption } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { configCompressPlugin } from "./compress";
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import { prismjsPlugin } from "vite-plugin-prismjs";
import { codeInspectorPlugin } from "code-inspector-plugin";
import topLevelAwait from "vite-plugin-top-level-await";

export interface PluginsOptions {
  /** 是否启用 CDN */
  VITE_CDN: boolean;
  /** 压缩类型 */
  VITE_COMPRESSION: ViteCompression;
  /** i18n 路径（可选） */
  i18nPaths?: string[];
  /** 移除 console 排除项 */
  removeConsoleExternal?: string[];
  /** mock 路径（可选，如果提供则启用 mock 插件） */
  mockPath?: string | string[];
}

export function getPluginsList(options: PluginsOptions): PluginOption[] {
  const {
    VITE_CDN,
    VITE_COMPRESSION,
    i18nPaths = [],
    removeConsoleExternal = ["@repo/assets/iconfont/iconfont.js"],
    mockPath,
  } = options;

  const lifecycle = process.env.npm_lifecycle_event;
  return [
    vue(),
    // jsx、tsx语法支持
    vueJsx(),
    // WASM 顶层 await 支持
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
    prismjsPlugin({
      languages: "all",
      plugins: [
        "line-numbers",
        "line-highlight",
        "inline-color",
        "copy-to-clipboard",
        "highlight-keywords",
        "show-language",
        "download-button",
        "data-uri-highlight",
      ],
      theme: "okaidia",
      css: true,
    }),
    VueI18nPlugin({
      include: i18nPaths,
    }),
    /**
     * 在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
     * Mac 默认组合键 Option + Shift
     * Windows 默认组合键 Alt + Shift
     * 更多用法看 https://inspector.fe-dev.cn/guide/start.html
     */
    codeInspectorPlugin({
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
    mockPath
      ? vitePluginFakeServer({
          logger: false,
          include: mockPath,
          infixName: false,
          enableProd: true,
        })
      : null,
    // svg组件化支持
    svgLoader(),
    VITE_CDN ? createCdnPlugin() : null,
    configCompressPlugin(VITE_COMPRESSION),
    // 线上环境删除console
    lifecycle === "report" || process.env.NODE_ENV === "production"
      ? removeConsole({ external: removeConsoleExternal })
      : (null as unknown as PluginOption),
    // 打包分析
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as unknown as PluginOption),
  ];
}
