import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false,
  },
  entries: [
    {
      builder: "mkdist",
      input: ".",
      loaders: ["vue"],
      pattern: ["**/*.vue"],
      exclude: ["node_modules", "dist", "tests", "showcase", "build.config.ts"],
    },
    {
      builder: "mkdist",
      format: "esm",
      input: ".",
      loaders: ["js"],
      pattern: ["**/*.ts"],
      exclude: ["node_modules", "dist", "tests", "showcase", "**/*.vue", "build.config.ts"],
    },
  ],
});
