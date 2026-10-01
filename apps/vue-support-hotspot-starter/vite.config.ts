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
 * 刻意**不预置远端缺省值**，原因有两条实测依据：
 *   1. Kali 上目前没有部署 APM 观测后端，已监听的端口里没有它；
 *   2. 该主机 8086 端口被 **influxd** 占用（实测 `ss -lntp` 显示
 *      `users:(("influxd",pid=...))`）。若把缺省改成该主机的 8086，
 *      `/api/apm` 请求会被转发到 influxd，得到的是误导性的响应而不是「连不上」。
 *      这比指向一个死端口更糟：死端口至少不会返回看似有效的数据。
 *
 * 因此这里保留本机地址作为显式缺省（仅在「本机自己跑 APM 后端」时正确），
 * 并把目标改为可覆盖，缺省错误时至少有一条明确的路：
 *   APM_API_TARGET=http://<apm-host>:8086 pnpm dev
 *
 * 另注：monitor 应用的 vite 里 `/api/apm` 的缺省是 8582，与此处 8086 不一致，
 * 两个数字都没有实测依据，属同一类待核实项。
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
