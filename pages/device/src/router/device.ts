import type { RouteConfigsTable } from "@repo/core";

const loadDeviceMerchantPage = async () =>
  (await import("@pages/device/views/merchant/index.vue")).default;
const loadDeviceIndex = async () =>
  (await import("@pages/device/views/device/index.vue")).default;
const loadDeviceTemplate = async () =>
  (await import("@pages/device/views/template/device/index.vue")).default;
const loadDevicePreview = async () =>
  (await import("@pages/device/views/template/device/preview/index.vue")).default;

export default [
  {
    path: "/device",
    name: "Device",
    redirect: "/device/merchant",
    meta: {
      icon: "pixelarticons:device-tv-smart",
      title: "设备中心",
      rank: 6,
    },
    children: [
      {
        path: "/device/merchant",
        name: "DeviceMerchant",
        component: loadDeviceMerchantPage,
        meta: {
          title: "商户管理",
        },
      },
      {
        path: "/device/manage",
        name: "DeviceManage",
        component: loadDeviceIndex,
        meta: {
          title: "设备管理",
        },
      },
      {
        path: "/device/template",
        name: "DeviceTemplate",
        component: loadDeviceTemplate,
        meta: {
          title: "设备模板",
          showLink: false,
        },
      },
      {
        path: "/device/preview",
        name: "CameraPreview",
        component: loadDevicePreview,
        meta: {
          title: "设备预览",
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
