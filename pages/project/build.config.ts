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
        "!views/device/**/*.vue",
        "!views/template/device/**/*.vue",
      ],
    },
    {
      builder: "mkdist",
      format: "esm",
      input: "./src",
      loaders: ["js"],
      pattern: [
        "**/*.ts",
        "!api/manage/device.ts",
        "!api/manage/device-channel.ts",
        "!api/manage/device-message.ts",
        "!api/manage/project-device.ts",
        "!views/template/device/**/*.ts",
      ],
    },
  ],
});
