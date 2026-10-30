/**
 * 模板管理应用入口。
 *
 * .routes(路由树)：路由树一即菜单树，自动挂到 layout 之下，并驱动侧边栏，
 * 无需再手动 registerStaticMenu / addRoute。
 */
import { createContextApp } from '@repo/app'
import { templateRoutes } from '@pages/template'

await createContextApp({ appName: 'vue-support-template-starter' })
  .routes(templateRoutes as never)
  .mount('#app')
