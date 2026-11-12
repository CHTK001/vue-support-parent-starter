<!-- 这里是一次性加载 LayoutComponents -->
<template>
  <div>
    <!-- 壁纸层：z-index:-1，落在所有布局组件的背景之下（见 styles/wallpaper.scss） -->
    <WallpaperLayer />
    <AnnouncementBar position="fixed-top" />
    <component :is="LayoutComponent[layout]" v-if="!isMobile" />
    <component :is="LayoutMobile" v-if="isMobile" />
    <component :is="ThemeConfig" />
    <KoiLockScreen />
  </div>
</template>

<script setup lang="ts" name="layout">
import { useScreenStore } from "@repo/utils";
import { computed, onMounted, type Component } from "vue";
// 全局主题配置
import useGlobalStore from "@repo/pinia/modules/global";
import { applyGlobalWatermark } from "@repo/core";
import { useUnreadFlash } from "./useUnreadFlash";

// 未读消息标签页闪烁提示
useUnreadFlash();

// 应用全局水印（依据 security.watermark 配置；配置变更由热重载联动刷新）
onMounted(() => {
  applyGlobalWatermark();
});
import ThemeConfig from "@repo/theme/koi/layouts/components/ThemeConfig/index.vue";
import KoiLockScreen from "@repo/theme/koi/layouts/components/LockScreen/index.vue";
import AnnouncementBar from "@repo/theme/koi/layouts/components/AnnouncementBar/index.vue";
import WallpaperLayer from "@repo/theme/koi/components/wallpaper/WallpaperLayer.vue";
import LayoutVertical from "@repo/theme/koi/layouts/LayoutVertical/index.vue";
import LayoutColumns from "@repo/theme/koi/layouts/LayoutColumns/index.vue";
import LayoutDouble from "@repo/theme/koi/layouts/LayoutDouble/index.vue";
import LayoutClassic from "@repo/theme/koi/layouts/LayoutClassic/index.vue";
import LayoutHorizontal from "@repo/theme/koi/layouts/LayoutHorizontal/index.vue";
import LayoutOptimum from "@repo/theme/koi/layouts/LayoutOptimum/index.vue";
import LayoutGroup from "@repo/theme/koi/layouts/LayoutGroup/index.vue";
import LayoutMobile from "@repo/theme/koi/layouts/LayoutMobile/index.vue";

type LayoutType = "vertical" | "columns" | "double" | "classic" | "horizontal" | 'optimum' | "group" | string;
const LayoutComponent: Record<LayoutType, Component> = {
  vertical: LayoutVertical,
  columns: LayoutColumns,
  double: LayoutDouble,
  classic: LayoutClassic,
  horizontal: LayoutHorizontal,
  optimum: LayoutOptimum,
  group: LayoutGroup
};

// 全局主题仓库
const globalStore = useGlobalStore();

/** 获取布局格式 */
const layout = computed(() => globalStore.layout);

// 获取当前为[移动端、IPad、PC端]仓库，阔以使用 watchEffect(() => {}) 进行监听。
const { isMobile } = useScreenStore();
</script>

<style scoped lang="scss"></style>
