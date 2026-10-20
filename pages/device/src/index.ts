/**
 * @pages/device —— 设备管理共享包
 *
 * 业务应用通过 @pages/device 引入：
 *   import { createContextApp } from "@repo/app";
 *   import { deviceRoutes } from "@pages/device";
 *
 *   // 路由树即菜单树：分组 + 子页由这棵树推导，无需再手动注册菜单
 *   await createContextApp({}).routes(deviceRoutes).mount("#app");
 *
 * 提供的页面（挂在「设备管理」分组下）：
 *   - DeviceView：设备资产 / 设备工作台（设备卡牌 / 组织树 / 概览 / 地图 / 通道 / 视频 / 云台 / 门禁 / 事件）
 *   - DeviceOrganizationView：设备组织（厂商侧组织树 + 组织内设备，只读）
 *   - DeviceChannelView：通道管理（设备下的通道台账 + 启停）
 *   - DeviceEventLogView：设备日志（移动侦测 / IO 报警 / 门禁 / 温度 / 网络事件）
 *   - DevicePreviewView：设备预览（多路实时画面墙）
 *   - DeviceProviderView：提供商配置（厂商 AK/SK 凭据，卡牌式）
 *   - DeviceAccessRecordView：门禁记录（通行记录查询 + 远程开门）
 */
export { default as DeviceView } from './views/DeviceView.vue'
<<<<<<< HEAD
export { default as DeviceProviderView } from './views/DeviceProviderView.vue'
export { deviceRoutes, deviceMenus } from './router'
=======
export { default as DeviceOrganizationView } from './views/DeviceOrganizationView.vue'
export { default as DeviceChannelView } from './views/DeviceChannelView.vue'
export { default as DeviceEventLogView } from './views/DeviceEventLogView.vue'
export { default as DevicePreviewView } from './views/DevicePreviewView.vue'
export { default as DeviceProviderView } from './views/DeviceProviderView.vue'
export { default as DeviceAccessRecordView } from './views/DeviceAccessRecordView.vue'
export { deviceRoutes } from './router'
>>>>>>> feat/device-stream
export { deviceApi } from './api/deviceApi'
export * from './types/device'
