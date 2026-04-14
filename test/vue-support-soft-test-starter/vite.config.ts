import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";

const workspaceRoot = resolve(__dirname, "../..");
const resolveProxyTarget = (
  env: Record<string, string>,
  key: string,
  fallback: string,
) => {
  const value = (process.env[key] || env[key] || "").trim();
  return value || fallback;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [vue()],
    publicDir: resolve(workspaceRoot, "public"),
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${resolve(__dirname, "src")}/` },
        {
          find: "@layout/default",
          replacement: resolve(workspaceRoot, "layout/default/src"),
        },
        {
          find: "@pages/common",
          replacement: resolve(workspaceRoot, "pages/common"),
        },
        {
          find: "@pages/holiday",
          replacement: resolve(
            workspaceRoot,
            "pages/system/src/holiday/HolidayIndex.vue",
          ),
        },
        {
          find: "@pages/jvm",
          replacement: resolve(
            workspaceRoot,
            "pages/system/src/jvm/JvmInfoIndex.vue",
          ),
        },
        {
          find: "@pages/soft",
          replacement: resolve(workspaceRoot, "pages/soft/src"),
        },
        {
          find: "@repo/common-pages",
          replacement: resolve(workspaceRoot, "pages/common"),
        },
        {
          find: "@repo/components",
          replacement: resolve(workspaceRoot, "packages/components"),
        },
        {
          find: "@repo/core/router",
          replacement: resolve(workspaceRoot, "packages/core/src/router/index.ts"),
        },
      ],
    },
    server: {
      host: "127.0.0.1",
      port: 8856,
      fs: {
        allow: [workspaceRoot],
      },
      watch: {
        ignored: [
          "**/packages/components/ScFlourishEmbed",
          "**/packages/components/ScFlourishEmbed/**",
          "**/packages/components/ScLayer",
          "**/packages/components/ScLayer/**",
        ],
      },
      proxy: {
        "/soft-test/api": {
          target: resolveProxyTarget(
            env,
            "VITE_SOFT_TEST_API_PROXY_TARGET",
            "http://127.0.0.1:18171",
          ),
          changeOrigin: true,
        },
        "/socket.io": {
          target: resolveProxyTarget(
            env,
            "VITE_SOFT_TEST_SOCKET_PROXY_TARGET",
            "http://127.0.0.1:29191",
          ),
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
