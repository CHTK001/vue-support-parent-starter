import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * vue-support-hotspot-starter — APM 热点观测台（前后端分离）
 *
 * - dev：vite 8890 端口，/api/apm 代理到 APM 观测后端
 * - build：产物 dist/ 由构建脚本拷贝至 spring 模块 src/main/resources/static/
 *   实现单 jar 前后端一体交付
 */
/**
 * APM 观测数据 API 的后端地址。
 *
 * 刻意**不预置远端缺省值**，全部依据为实测（2026-10-02）：
 *   1. 本机没有部署 APM 观测后端 —— 逐个探测过 8086 / 8582 / 9848 / 9849 /
 *      19180-19185 / 19380 / 19390，只有 8086 有响应，而它的响应是 influxd；
 *      也没有任何 java 进程的命令行里出现 apm / hotspot / observ。
 *   2. 该主机 8086 被 **influxd** 占用（`ss` 显示 `users:(("influxd",pid=...))`），
 *      且 influxd 对**任何**未知路径都返回 **HTTP 200 + 自己的 HTML 落地页**
 *      （响应头带 `X-Influxdb-Build: OSS`、`Content-Type: text/html`）。
 *      实测 `curl http://<host>:8086/api/apm` 与 `/actuator/health` 返回的都是这段 HTML。
 *      因此若把缺省改成该主机的 8086，前端会拿到 **200 + HTML** —— 不报错，
 *      只是一段垃圾数据。这比指向死端口更糟：死端口至少会暴露连接错误。
 *   3. 另一处不一致：monitor 应用的 vite 里 `/api/apm` 的缺省是 8582，而实测
 *      **8582 根本没有进程监听**。两个数字都没有任何可验证依据。
 *
 * 结论：当前不存在可预置的正确远端缺省值。这里保留本机地址作为显式缺省
 * （仅在「本机自己跑 APM 后端」时正确），并把目标改为可覆盖：
 *   APM_API_TARGET=http://<apm-host>:<port> pnpm dev
 *
 * 待办：部署一个真实的 APM 观测后端，或确认该功能已下线，然后把两处缺省统一。
 */
const apmApiTarget = process.env.APM_API_TARGET ?? "http://127.0.0.1:8086"

export default createVite({
  appName: "vue-support-hotspot-starter",
  title: "APM 热点观测台",
  // 业务页以 "@pages/hotsport/src/..." 形式引用，alias 目标指向页面根 pages/hotsport
  alias: {
    "@pages/hotsport": "pages/hotsport",
  },
  server: {
    port: 8890,
    strictPort: true,
    proxy: {
      // APM 观测数据 API → 后端观测服务
      "/api/apm": {
        target: apmApiTarget,
        changeOrigin: true,
      },
    },
  },
});
