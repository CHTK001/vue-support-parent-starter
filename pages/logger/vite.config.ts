/**
 * 日志控制台（@pages/logger）开发服务器配置。
 *
 * <p><strong>形态</strong>：与 pages/ai 同构——物理代码归档在 pages/logger，
 * 走 turbo/vite/createVite 共享壳（UnoCSS、ElementPlusResolver、共享 index.html
 * 模板均由壳内提供，本目录不放 index.html）。</p>
 *
 * <p><strong>代理</strong>：/v2/logger 统一转给 LOGGER_API_TARGET
 * （默认 http://172.16.9.194:8082，CLI 上通过 set LOGGER_API_TARGET=... 覆盖）。
 * 后端 ApiCorsFilter 是白名单制，changeOrigin 只改 Host、不改 Origin，陌生源
 * （localhost:19096）一律 403「Invalid CORS request」，因此转发前剥掉浏览器
 * Origin 头，让请求与 curl 同态（非 CORS 请求）按同源放行，无需为 vite 端口
 * 维护后端白名单再重启服务。</p>
 *
 * <p><strong>主机与端口</strong>：0.0.0.0 + strictPort。19096 是日志控制台
 * 专属白名单端口，启动前需先停掉占用该端口的旧进程。</p>
 */
import { createVite, WORKSPACE_ROOT } from "../../turbo/vite/createVite";
import path from "node:path";
import type { ProxyOptions } from "vite";

const loggerApiTarget = process.env.LOGGER_API_TARGET ?? "http://172.16.9.194:8082";

/**
 * dev 代理公共处理：转发前剥掉浏览器的 Origin 头（同 pages/ai 的 withoutBrowserOrigin）。
 */
const withoutBrowserOrigin: Pick<ProxyOptions, "configure"> = {
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
  },
};

export default createVite({
  appName: "logger",
  title: "日志控制台",
  // 显式写出入口（与共享模板默认约定一致：/src/main.ts）
  entry: "/src/main.ts",
  // @/ 业务别名（createVite 共享 @repo/* 别名录不包含此层）
  alias: { "@": path.join(WORKSPACE_ROOT, "pages", "logger", "src") },
  server: {
    host: "0.0.0.0",
    port: 19096,
    strictPort: true,
    proxy: {
      // 日志控制台全部接口（含 SSE /stream，http-proxy 对 EventSource 透传）
      "/v2/logger": {
        target: loggerApiTarget,
        changeOrigin: true,
        ...withoutBrowserOrigin,
      },
    },
  },
});
