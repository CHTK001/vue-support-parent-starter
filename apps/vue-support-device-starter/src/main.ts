/**
 * 设备管理应用入口。
 *
 * .routes(路由树)：路由树即菜单树，自动挂到 layout 之下，并驱动侧边栏，
 * 无需再手动 registerStaticMenu / addRoute。
 */
import { createContextApp } from '@repo/app'
import { deviceRoutes } from '@pages/device'

await createContextApp({ appName: 'vue-support-device-starter' })
  .routes(deviceRoutes as never)
  .mount('#app')
