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
 * 提供的页面：
 *   - DeviceView：设备工作台（设备树 / 概览 / 地图 / 通道 / 视频 / 云台 / 门禁 / 事件）
 */
export { default as DeviceView } from './views/DeviceView.vue'
export { default as DeviceProviderView } from './views/DeviceProviderView.vue'
export { default as DeviceGroupView } from './views/DeviceGroupView.vue'
export { deviceRoutes, deviceMenus } from './router'
export { deviceApi } from './api/deviceApi'
export * from './types/device'
