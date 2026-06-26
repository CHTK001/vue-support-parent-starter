import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index"],
  declaration: true,
  rollup: {
    emitCJS: false,
    esbuild: { target: "es2020" },
  },
  externals: [
    "vue", "vue-router", "element-plus", "@vueuse/core",
    "@pureadmin/utils", "@repo/utils", "@repo/config", "@repo/components",
  ],
});