import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  failOnWarn: false,
  entries: [
    {
      builder: "mkdist",
      input: "./src",
      loaders: ["vue"],
      pattern: ["**/*.vue"],
    },
    {
      builder: "mkdist",
      format: "esm",
      input: "./src",
      loaders: ["js"],
      pattern: ["**/*.ts"],
    },
  ],
  externals: [
    "vue",
    "@pureadmin/utils",
    "element-plus",
    "@element-plus/icons-vue",
    "vue-i18n",
    "@repo/components",
  ],
});