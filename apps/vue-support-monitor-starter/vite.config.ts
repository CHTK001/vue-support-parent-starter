import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  // @pages/server、@pages/monitor 未收录在 createVite 共享 REPO_ALIAS，这里按 monorepo 惯例
  // （见 createVite: alias 值相对 WORKSPACE_ROOT 解析）应用本地补全。
  // 注意：业务代码以 "@pages/server/src/api" 形式引用，alias 目标应指向页面根（pages/server），
  // 使 "/src/..." 后缀落在真实的 pages/server/src/... 上；不可指向 pages/server/src（否则叠加成 src/src）。
  alias: {
    "@pages/server": "pages/server",
    "@pages/monitor": "pages/monitor",
    "@pages/project": "pages/project",
  },
  server: {
    port: 8848,
    strictPort: true,
    // 启动预编译：预热弹窗相关源码文件，首次点击弹窗不再现场 transform（避免 5s~1min 卡顿）
    warmup: {
      clientFiles: [
        "src/main.ts",
        "src/App.vue",
        "src/router.ts",
        "src/views/AssetsView.vue",
        "src/views/HostFormDialog.vue",
      ],
    },
    proxy: {
      "/ms/monitor/system": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
      },
      "/ms/monitor": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      "/ms/server": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      "/ms/project": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/ws/ms/server": {
        target: "http://127.0.0.1:8081",
        ws: true,
        changeOrigin: true,
      },
      "/guacamole": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      // tshark 抓包实时推送（socket.io，后端 plugin.socket.room[0].port=29181）
      "/socket.io": {
        target: "http://127.0.0.1:29181",
        ws: true,
        changeOrigin: true,
      },
      "/api/apm": {
        target: "http://127.0.0.1:8582",
        changeOrigin: true,
      },
      "/agent": {
        target: "http://127.0.0.1:8582",
        changeOrigin: true,
      },
      "/monitor/api": {
        target: "http://127.0.0.1:19180",
        changeOrigin: true,
      },
      "/api/account": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "element-plus",
      "@repo/theme",
      "@repo/ui",
      "@repo/ui/components/ReFilter/types",
      "@repo/ui/re-icon",
      "@repo/ui/re-input",
      "@repo/ui/re-kit",
      "@repo/ui/re-scrollbar",
      "@repo/ui/re-select",
      "@repo/ui/re-tag",
    ],
  },
});
