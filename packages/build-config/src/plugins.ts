import { createCdnPlugin } from "./cdn";
import vue from "@vitejs/plugin-vue";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
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
import { createWorkspaceDependencyFallbackPlugin } from "./helpers";

export interface PluginsOptions {
  /** 是否启用 CDN */
  VITE_CDN: boolean;
  /** 压缩类型 */
  VITE_COMPRESSION: ViteCompression;
  /** 顶层 await 配置兼容参数，当前保留但不再注入插件 */
  enableTopLevelAwait?: boolean;
  /** i18n 路径（可选） */
  i18nPaths?: string[];
  /** 移除 console 排除项 */
  removeConsoleExternal?: string[];
  /** 是否启用 remove-console 插件 */
  enableRemoveConsolePlugin?: boolean;
  /** mock 路径（可选，如果提供则启用 mock 插件） */
  mockPath?: string | string[];
}

export function getPluginsList(options: PluginsOptions): PluginOption[] {
  const {
    VITE_CDN,
    VITE_COMPRESSION,
    i18nPaths = [],
    removeConsoleExternal = ["@repo/assets/fonts/iconfont.js"],
    enableRemoveConsolePlugin = false,
    mockPath,
  } = options;

  const lifecycle = process.env.npm_lifecycle_event;
  const isBuild =
    process.env.NODE_ENV === "production" ||
    lifecycle === "build" ||
    lifecycle === "report";
  const mockIncludes = (
    Array.isArray(mockPath) ? mockPath : mockPath ? [mockPath] : []
  ).filter((item) =>
    existsSync(isAbsolute(item) ? item : resolve(process.cwd(), item)),
  );
  const prismLanguages = [
    "markup",
    "css",
    "scss",
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "json",
    "yaml",
    "bash",
    "sql",
    "java",
    "python",
    "http",
    "groovy",
    "regex",
    "diff",
    "xml-doc",
    "log",
    "c",
    "cpp",
    "php",
    "ruby",
    "go",
    "rust",
    "batch",
  ];

  return [
    createWorkspaceDependencyFallbackPlugin(),
    vue(),
    // jsx、tsx语法支持
    vueJsx(),
    // 顶层 await 插件在当前 monorepo 构建链路下存在稳定性问题，这里保留配置位但不再注入插件。
    prismjsPlugin({
      languages: prismLanguages,
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
    isBuild
      ? null
      : codeInspectorPlugin({
          bundler: "vite",
          hideConsole: true,
        }),
    viteBuildInfo(),
    /**
     * 开发环境下移除非必要的vue-router动态路由警告No match found for location with path
     * 非必要具体看 https://github.com/vuejs/router/issues/521 和 https://github.com/vuejs/router/issues/359
     * vite-plugin-router-warn只在开发环境下启用，只处理vue-router文件并且只在服务启动或重启时运行一次，性能消耗可忽略不计
     */
    isBuild ? null : removeNoMatch(),
    // mock支持
    mockIncludes.length > 0
      ? vitePluginFakeServer({
          logger: false,
          include: mockIncludes,
          infixName: false,
          enableProd: true,
        })
      : null,
    // svg组件化支持
    svgLoader(),
    VITE_CDN ? createCdnPlugin() : null,
    configCompressPlugin(VITE_COMPRESSION),
    // 线上环境删除console
    enableRemoveConsolePlugin &&
    (lifecycle === "report" || process.env.NODE_ENV === "production")
      ? removeConsole({ external: removeConsoleExternal })
      : (null as unknown as PluginOption),
    // 打包分析
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as unknown as PluginOption),
  ];
}
