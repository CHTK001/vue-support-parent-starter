import { createVite } from "../../turbo/vite/createVite.ts";
import path from 'node:path'

/**
 * 设备管理应用 Vite 配置。
 *
 * 备注：pages/device/src/views 与 components 中的 @/xxx 别名
 * 由 pages/device 的 tsconfig.json 配置，但 vite 不会跨包读 tsconfig，
 * 因此在应用侧额外注册 @ → pages/device/src 映射。
 */

/**
 * 后端（spring-support-device-starter）地址。
 *
 * 后端只跑在 Kali 上（18170 实例实测在远端监听），本机不起后端进程，
 * 所以缺省指向远端而不是 localhost —— 与 vue-support-ai-starter /
 * vue-support-system-starter / monitor 同一口径。
 *
 * 指向没人监听的本机端口时，dev 代理返回的是**合法 JSON 但 data 为空**，
 * 不会报连接错误，表现为「列表 0 条」，排查方向容易被带偏，因此不用本机缺省。
 *
 * 需要指向其他实例时用环境变量覆盖：
 *   DEVICE_API_TARGET=http://localhost:18170 pnpm dev
 */
const deviceApiTarget = process.env.DEVICE_API_TARGET ?? 'http://192.168.50.198:18170'
console.log('DBG-PROXY-TARGET=' + JSON.stringify(deviceApiTarget) + ' ENV=' + JSON.stringify(process.env.DEVICE_API_TARGET))

/**
 * 代理转发时移除浏览器 Origin。
 *
 * <p>浏览器对 POST 会带上 {@code Origin: http://localhost:19092}，而设备后端
 * 的 CORS 白名单未包含开发端口时，Spring 会直接返回 403 Invalid CORS request；
 * GET 不带 Origin 因而正常，表现为“查询正常、保存 403”。开发代理与后端同源转发，
 * 移除该头即可，生产环境由网关/后端统一配置 CORS。</p>
 */
function stripOrigin(proxy: { on: (event: string, cb: (req: { removeHeader: (name: string) => void }) => void) => void }): void {
  proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
}


export default createVite({
  appName: 'vue-support-device-starter',
  title: '设备管理',
  alias: {
    '@': path.resolve(__dirname, '../../pages/device/src'),
    // 新版页面内部统一使用 @pages/device/src/... 引用，便于同时被 8848 宿主挂载
    '@pages/device': path.resolve(__dirname, '../../pages/device')
  },
  server: {
    port: 19092,
    strictPort: false,
    proxy: {
      '/api/device': {
        target: deviceApiTarget,
        changeOrigin: true,
        configure: stripOrigin
      },
      '/api': {
        target: deviceApiTarget,
        changeOrigin: true,
        configure: stripOrigin
      }
    }
  }
})