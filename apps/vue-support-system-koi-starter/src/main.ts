import { createStandardApp } from "@repo/core";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

/**
 * Koi 主题应用入口。
 *
 * 只需传 layout: "koi"，架构层（createStandardApp）会自动完成：
 *   1. 加载 @layout/koi/styles/index.scss 全局样式
 *   2. install @layout/koi 包（注册 KoiGlobalIcon 等全局组件）
 *
 * Element Plus 图标沿用 koi 原版 main.ts 的注册方式（全局注册），
 * 因为 koi 布局模板中通过组件名直接引用图标。
 */
createStandardApp({
  layout: "koi",
  components: {
    // 全局注册所有 Element Plus 图标，koi 布局模板中直接使用图标组件名
    ...Object.fromEntries(
      Object.entries(ElementPlusIconsVue).map(([key, comp]) => [key, comp]),
    ),
  },
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[KoiBootstrap] bootstrap-failed", error);
  });
