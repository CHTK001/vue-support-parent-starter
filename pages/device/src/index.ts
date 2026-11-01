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
 *   - DeviceView：设备工作台（设备列表 / 分组 / 机房拓扑，都在页面内）
 *   - DeviceTopoView：机房拓扑（区域 → 网段 → 设备 → 通道）
 *   - DeviceTaskView：定时任务（时间轮任务状态与间隔）
 */
export { default as DeviceView } from './views/DeviceView.vue'
export { default as DeviceProviderView } from './views/DeviceProviderView.vue'
export { default as DeviceTopoView } from './views/DeviceTopoView.vue'
export { default as DeviceTaskView } from './views/DeviceTaskView.vue'
export { deviceRoutes, deviceMenus } from './router'
export { deviceApi } from './api/deviceApi'
export * from './types/device'
