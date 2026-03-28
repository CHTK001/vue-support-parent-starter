import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@pages\/common\/(.*)$/,
        replacement: path.resolve(__dirname, "../../pages/common/$1"),
      },
      {
        find: "@pages/common",
        replacement: path.resolve(__dirname, "../../pages/common"),
      },
      {
        find: /^@repo\/components\/(.*)$/,
        replacement: path.resolve(__dirname, "../components/$1"),
      },
      {
        find: "@repo/components",
        replacement: path.resolve(__dirname, "../components"),
      },
      {
        find: /^@repo\/assets\/(.*)$/,
        replacement: path.resolve(__dirname, "../assets/$1"),
      },
      {
        find: "@repo/assets",
        replacement: path.resolve(__dirname, "../assets"),
      },
      {
        find: "@repo/config",
        replacement: path.resolve(__dirname, "../config"),
      },
      {
        find: "@repo/core",
        replacement: path.resolve(__dirname, "../core"),
      },
      {
        find: "@repo/plugins",
        replacement: path.resolve(__dirname, "../plugins"),
      },
      {
        find: "@repo/utils",
        replacement: path.resolve(__dirname, "../utils"),
      },
      {
        find: "@layout/default",
        replacement: path.resolve(__dirname, "../../layout/default/src"),
      },
    ],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
  },
});
