import { createVite } from "../../turbo/vite/createVite.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKUP_ROOT = "D:/vue-support-backup";
const BACKUP_PAGES_REMOTE = path.join(BACKUP_ROOT, "apps/vue-support-remote-starter/node_modules/@pages/remote/src");
const BACKUP_NM = path.join(BACKUP_ROOT, "apps/vue-support-remote-starter/node_modules");
const BACKUP_SRC = path.join(BACKUP_ROOT, "apps/vue-support-remote-starter/src");

export default createVite({
  appName: "vue-support-remote-starter",
  title: "Vue Support Remote",
  alias: {
    "@pages/remote": BACKUP_PAGES_REMOTE,
    "@": BACKUP_SRC,
  },
  resolve: {
    alias: [
      // 把 remote-starter 自己的 node_modules 和 src 也加入 alias（兜底）
      { find: /^@pages\/remote\/(.*)$/, replacement: `${BACKUP_PAGES_REMOTE}/$1` },
      { find: /^@pages\/remote$/, replacement: BACKUP_PAGES_REMOTE },
    ],
  },
  server: {
    port: 28849,
    strictPort: true,
    fs: {
      allow: [
        BACKUP_ROOT,
        path.resolve("."),
        path.resolve("../../.."),
      ],
    },
    proxy: {
      "/system/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/admin/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:8082",
        ws: true,
      },
    },
  },
});
