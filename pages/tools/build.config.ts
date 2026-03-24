import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index"],
  clean: true,
  declaration: true,
  failOnWarn: false,
  rollup: {
    emitCJS: false,
    esbuild: {
      minify: false,
    },
  },
  externals: [
    "vue",
    "@pureadmin/utils",
    "element-plus",
    "unbuild",
    "vue-i18n",
    "@repo/components",
    "./index.vue"
  ],
}); 