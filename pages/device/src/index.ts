/**
 * @pages/device —— 设备管理共享包
 *
 * 业务应用通过 @pages/device 引入：
 *   import { createContextApp } from "@repo/app";
 *   import { registerStaticMenu } from "@repo/pinia";
 *   import { deviceRoutes, deviceMenus } from "@pages/device";
 *
 *   registerStaticMenu(deviceMenus);
 *   const { context } = await createContextApp({});
 *   deviceRoutes.forEach(r => context.router.addRoute("layout", r));
 *
 * 页面视图不再从包根 re-export：路由一律经 ./router 的懒加载 import() 引用，
 * 宿主需要具体页面时请走深路径（如 @pages/device/src/views/DeviceView.vue），
 * 避免包根把全部页面组件拖进宿主入口 chunk（见 前端加载性能优化清单 C1）。
 */
export { deviceRoutes, deviceMenus } from './router'
export { deviceApi } from './api/deviceApi'
export * from './types/device'
