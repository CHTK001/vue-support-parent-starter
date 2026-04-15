<script setup lang="ts">
/**
 * lay-setting 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.1 - 布局级设置面板改为静态主题映射，避免切换时触发布局抖动
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import { createLayoutAsyncComponent } from "../../utils/asyncComponentLoader";

const DefaultSetting = createLayoutAsyncComponent(
  () => import("./themes/Default.vue"),
);
const EightBitSetting = createLayoutAsyncComponent(
  () => import("./themes/EightBit.vue"),
);
const SpringFestivalSetting = createLayoutAsyncComponent(
  () => import("./themes/SpringFestival.vue"),
);
const HalloweenSetting = createLayoutAsyncComponent(
  () => import("./themes/Halloween.vue"),
);
const ChristmasSetting = createLayoutAsyncComponent(
  () => import("./themes/Christmas.vue"),
);
const FutureTechSetting = createLayoutAsyncComponent(
  () => import("./themes/FutureTech.vue"),
);

// 设置面板只渲染当前主题壳，非当前主题组件改为按需加载，
// 避免打开设置时把所有主题面板一起解析进来。
const themeComponents = {
  default: DefaultSetting,
  "8bit": EightBitSetting,
  "spring-festival": SpringFestivalSetting,
  halloween: HalloweenSetting,
  christmas: ChristmasSetting,
  "future-tech": FutureTechSetting,
};

// 使用统一的主题切换 Hook
const { CurrentComponent } = useThemeComponent(themeComponents, DefaultSetting);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
