import { createVite } from '../../turbo/vite/createVite'
import path from 'node:path'

/**
 * 设备管理应用 Vite 配置。
 *
 * 后端代理指向 spring-support-device-starter (默认 18170/device/**)。
 *
 * 备注：pages/device/src/views 与 components 中的 @/xxx 别名
 * 由 pages/device 的 tsconfig.json 配置，但 vite 不会跨包读 tsconfig，
 * 因此在应用侧额外注册 @ → pages/device/src 映射。
 */
export default createVite({
  appName: 'vue-support-device-starter',
  title: '设备管理',
  alias: {
    '@': path.resolve(__dirname, '../../pages/device/src')
  },
  server: {
    port: 19092,
    strictPort: false,
    proxy: {
      '/api/device': {
        target: 'http://localhost:18170',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:18170',
        changeOrigin: true
      }
    }
  }
})
