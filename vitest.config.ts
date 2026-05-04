import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const workspaceRoot = fileURLToPath(new URL("./", import.meta.url));
const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: "@repo/components/ScCodeEditor",
        replacement: resolve(
          workspaceRoot,
          "packages/components-standalone/ScCodeEditor",
        ),
      },
      {
        find: "@repo/components/ScEchartsMap3D",
        replacement: resolve(
          workspaceRoot,
          "packages/components-standalone/ScEchartsMap3D",
        ),
      },
      {
        find: "@repo/components/ScLayer",
        replacement: resolve(
          workspaceRoot,
          "packages/components-standalone/ScLayer",
        ),
      },
      {
        find: "@repo/components/ScMap",
        replacement: resolve(workspaceRoot, "packages/components-standalone/ScMap"),
      },
      {
        find: "@repo/components/ScFlowEditor",
        replacement: resolve(
          workspaceRoot,
          "packages/components-standalone/ScFlowEditor",
        ),
      },
      {
        find: "@repo/components/ScWebLLM",
        replacement: resolve(
          workspaceRoot,
          "packages/components-standalone/ScWebLLM",
        ),
      },
      {
        find: "@repo/components/TechUI",
        replacement: resolve(workspaceRoot, "packages/components-standalone/TechUI"),
      },
      {
        find: "@layout/default",
        replacement: resolve(workspaceRoot, "layout/default/src"),
      },
      {
        find: "@pages/common",
        replacement: resolve(workspaceRoot, "pages/common"),
      },
      {
        find: "@repo/components",
        replacement: resolve(workspaceRoot, "packages/components"),
      },
      {
        find: "@repo",
        replacement: resolve(workspaceRoot, "packages"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(currentDir, "layout/default/vitest.setup.ts")],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.codex/**",
      "**/playwright-report/**",
    ],
  },
});

