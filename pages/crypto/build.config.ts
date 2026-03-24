import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  // 当前项目中 vue-tsc 安装存在问题，这里先关闭声明文件生成以避免构建失败
  declaration: false,
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
});

