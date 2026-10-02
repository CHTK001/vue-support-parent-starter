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

/** APM 观测后端地址；实测 8582 无监听，故不预置远端缺省，详见下方注释 */
const apmTarget = process.env.APM_TARGET ?? "http://127.0.0.1:8582";

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
      // APM 观测后端（/api/apm 与 /agent 共用）。
      //
      // 实测（2026-10-02）：**8582 上没有任何进程监听**，所以这个缺省是死端口 ——
      // 请求会直接连接失败好在能看见。
      // 同时该主机上不存在 APM 观测后端：逐个探测 8086/8582/9848/9849/19180-19185/
      // 19380/19390，只有 8086 有响应，而那是 influxd（对任意路径返回 200 + 它的
      // HTML 落地页，响应头带 X-Influxdb-Build: OSS）。
      // 因此这里**不**把缺省改成任何远端地址：填 8086 会拿到 200 + HTML 这种
      // 垃圾数据，比死端口更难排查。改为显式可覆盖：
      //   APM_TARGET=http://<apm-host>:<port> pnpm dev
      // 待办：部署真实 APM 后端或确认该功能已下线，然后与 hotspot 应用统一该缺省
      // （hotspot 的 /api/apm 缺省是 8082→已改为可覆盖，两边数字本来就不一致）。
      "/api/apm": {
        target: apmTarget,
        changeOrigin: true,
      },
      "/agent": {
        target: apmTarget,
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
