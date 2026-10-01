import { createVite } from "../../turbo/vite/createVite.ts";

// 后端实例：后台只跑在 Kali 上，本机不起后端进程，所以缺省值指向远端而不是 127.0.0.1。
// 与 vue-support-ai-guada / vue-support-system-starter 同一口径
// （见 a2b20b189「前端代理默认指向远端后端」）。
//
// 为什么这件事值得单独说明：缺省目标指向一个**没人监听的本机端口**时，dev 代理返回的是
//   {"code":"00000","data":[],"success":true}
// 也就是**合法 JSON 但数据为空**。它不像连不上那样报错，表现是「服务管理列表 0 个服务」，
// 排查方向会整个跑偏到「数据丢了 / 查询写错了 / 后台没起节点」，而真实原因只是代理指错机器。
// 这类静默错误比直接报错更贵，本轮已实测踩过一次。
//
// 端口：8112 是 monitor 后台实际监听的端口；29612 是它的 socket.io 推送端口
// （与 project-start.sh 的 --plugin.socket.room[0].port=29612 一致）。
// 注意此前缺省写的 29181 是**错的端口**，即使把主机改成远端，socket 推送仍然连不上。
// 需要指向其他实例时用环境变量覆盖：
//   MS_API_TARGET=http://127.0.0.1:8082 pnpm dev
const apiTarget = process.env.MS_API_TARGET ?? "http://192.168.50.198:8112";
const socketTarget = process.env.MS_SOCKET_TARGET ?? "http://192.168.50.198:29612";

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
    "@pages/filesystem": "pages/filesystem",
    "@pages/datasource": "pages/datasource",
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
      // 后端 v2 基础接口：默认设置 /v2/setting/default、用户菜单 /v2/user/menu、
      // 布局 /v2/user/layout 等。缺失会导致启动期“远程登录页配置拉取失败 404”。
      "/v2": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 天气组件 IP 定位：freeipapi（HTTPS）
      "/freeip-api": {
        target: "https://freeipapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freeip-api/, ""),
      },
      // 天气组件 IP 定位：ip-api（HTTP 免费版，HTTPS 返回 403）
      "/ip-api": {
        target: "http://ip-api.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-api/, ""),
      },
      "/ms/monitor/system": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/system": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/monitor": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 数据源中心（spring-support-datasource-hub-starter）
      "/ms/datasource": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/server": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/project": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ws/ms/server": {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
      // tshark 抓包实时推送（socket.io，后端 plugin.socket.room[0].port）
      "/socket.io": {
        target: socketTarget,
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
