import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 热点系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/agent", "http://127.0.0.1:18954")
  .cssPreprocessor("scss", {
    api: "modern-compiler",
    additionalData: `
      @use "@layout/default/styles/layout/variables.scss" as *;
      @use "@layout/default/styles/layout/mixin.scss";
    `,
    silenceDeprecations: ["color-functions", "global-builtin", "import"]
  })
  .terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ["console.log", "console.info", "console.debug", "console.warn", "console.error"],
      passes: 3,
      dead_code: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
      reduce_funcs: true,
      inline: 2,
      keep_fargs: false,
      keep_fnames: false
    },
    mangle: {
      properties: {
        regex: /^_/
      },
      toplevel: true,
      reserved: [],
      keep_classnames: false,
      keep_fnames: false
    },
    format: {
      comments: false,
      beautify: false,
      ascii_only: false
    }
  })
  .build();
