import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index"],
  clean: true,
  declaration: true,
  externals: [
    "vite",
    "@vitejs/plugin-vue",
    "@vitejs/plugin-vue-jsx",
    "@intlify/unplugin-vue-i18n",
    "@pureadmin/utils",
    "dayjs",
    "dayjs/plugin/duration",
    "boxen",
    "gradient-string",
    "code-inspector-plugin",
    "rollup-plugin-visualizer",
    "vite-plugin-cdn-import",
    "vite-plugin-compression",
    "vite-plugin-fake-server",
    "vite-plugin-prismjs",
    "vite-plugin-remove-console",
    "vite-plugin-router-warn",
    "vite-svg-loader",
    "node:fs",
    "node:path",
    "node:url",
  ],
  rollup: {
    emitCJS: true,
  },
});
