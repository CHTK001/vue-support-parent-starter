import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    {
      builder: "mkdist",
      input: "./src",
      loaders: ["vue"],
      pattern: [
        "**/*.vue",
        "!**/*20250903.vue",
      ],
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
