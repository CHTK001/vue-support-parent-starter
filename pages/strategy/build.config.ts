import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index", "src/router/index"],
  clean: true,
  declaration: true,
  externals: [
    "vue",
    "vue-router",
    "element-plus",
    "@repo/components",
    "@repo/core",
  ],
  rollup: {
    emitCJS: false,
  },
});
