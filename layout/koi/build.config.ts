import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index"],
  declaration: true,
  rollup: {
    emitCJS: false,
    esbuild: {
      target: "es2020",
    },
  },
  externals: [
    "vue",
    "vue-router",
    "pinia",
    "element-plus",
    "@vueuse/core",
    "@pureadmin/utils",
    "@repo/core",
    "@repo/components",
    "vue-i18n",
  ],
});